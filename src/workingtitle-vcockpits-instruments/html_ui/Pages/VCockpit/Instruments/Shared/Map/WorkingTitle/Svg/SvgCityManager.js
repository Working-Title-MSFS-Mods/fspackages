class SvgCityManager {
    constructor(map) {
        this.map = map;
        
        this.searchInterval = SvgCityManager.SEARCH_INTERVAL_DEFAULT;                           // seconds, how long to wait between database searches of cities in absence of map view changes
        this.mapChangeUpdateDelay = SvgCityManager.MAP_CHANGE_SEARCH_DELAY_DEFAULT;             // seconds, how long to wait after a map view change before a new search is triggered
        this.minimumSearchRadius = SvgCityManager.MIN_SEARCH_RADIUS_DEFAULT;                    // NM, the minimum search radius
        this.citySearchLimits = [
            SvgCityManager.CITY_LARGE_SEARCH_LIMIT_DEFAULT,                                     // the maximum number of large cities to return with a single search
            SvgCityManager.CITY_MEDIUM_SEARCH_LIMIT_DEFAULT,                                    // the maximum number of medium cities to return with a single search
            SvgCityManager.CITY_SMALL_SEARCH_LIMIT_DEFAULT                                      // the maximum number of small cities to return with a single search
        ];
        this.bufferMaxSize = SvgCityManager.BUFFER_SIZE_DEFAULT;
        this.displayedCitiesCleanInterval = SvgCityManager.DISPLAYED_CITIES_CLEAN_INTERVAL;     // seconds, how often to periodically remove out of frame cities from the display list
        
        this.buffer = new Array(this.bufferMaxSize);
        this.bufferHead = -1;
        this.bufferTail = 0;
        this.bufferSize = 0;
        this.toExclude = new Set();
        this.displayedCities = new Set();
        
        this.lastTime = -1;
        
        this.mapChangeTimer = 0;
        
        this.lastNMWidth = -1;
        this.lastSearchCoords = null;
        this.lastSearchRadius = -1;
        this.lastSearchTime = -1;
        
        this.searchedCitiesSmall = false;
        this.searchedCitiesMedium = false;
        
        this.lastDisplayCleanTime = -1;
        
        let request = new XMLHttpRequest();
        request.overrideMimeType("application/json");
        request.onreadystatechange = () => {
            if (request.readyState === 4) {
                if (request.status === 200) {
                    this.cities = JSON.parse(request.responseText);
                }
            }
        };
        request.open("GET", "/Pages/VCockpit/Instruments/Shared/Map/WorkingTitle/Cities/cities_tree.json?_=" + new Date().getTime());
        request.send();
    }
    
    update() {
        if (this.cities) {
            let currentTime = Date.now() / 1000;
            let centerCoords = this.map.centerCoordinates;
            let radius = Math.max(this.map.NMWidth * 0.75, this.minimumSearchRadius);
            
            if (this.lastSearchTime < 0) {
                this.searchAll(centerCoords, radius, currentTime);
                return;
            }    
            
            if (this.map.NMWidth != this.lastNMWidth || SvgCityManager.getDistanceNMSquaredLatLong(centerCoords, this.lastSearchCoords) >= this.lastSearchRadius * this.lastSearchRadius) {
                // map view changed -> start timer
                this.lastTime = currentTime;
                this.mapChangeTimer = this.mapChangeUpdateDelay;
                this.lastNMWidth = this.map.NMWidth;
                this.lastSearchCoords = centerCoords;
                return;
            }
            
            
            if (this.mapChangeTimer > 0) {
                let dt = currentTime - this.lastTime;
                this.mapChangeTimer -= dt;
                if (this.mapChangeTimer <= 0) {
                    // map view change timer expired -> do a search all operation
                    this.searchAll(centerCoords, radius, currentTime);
                    return;
                }
                this.lastTime = currentTime;
                return;
            }
            
            // map view has not changed recently -> staggered search of small, med, and large cities
            if ((currentTime - this.lastSearchTime >= this.searchInterval)) {
                this.searchCities(centerCoords, radius, CitySize.Large);
                this.lastSearchTime = currentTime;
                this.lastSearchCoords = centerCoords;
                this.lastSearchRadius = radius;
                this.searchedCitiesMedium = false;
                this.searchedCitiesSmall = false;
                return;
            }
            if (!this.searchedCitiesMedium && (currentTime - this.lastSearchTime >= this.searchInterval * 2 / 3)) {
                this.searchCities(centerCoords, radius, CitySize.Medium);
                this.searchedCitiesMedium = true;
                return;
            }
            if (!this.searchedCitiesSmall && (currentTime - this.lastSearchTime >= this.searchInterval / 3)) {
                this.searchCities(centerCoords, radius, CitySize.Small);
                this.searchedCitiesSmall = true;
                return;
            }
            
            // no search was done this update, so start creating city elements from the buffer
            let start = this.bufferHead;
            let end = this.bufferTail;
            while (start >= 0) {
                let city = this.dequeueBuffer();
                if (this.map.isLatLongInFrame(new LatLong(city.lat, city.long), 0.05)) {
                    let svgCityElement = new SvgCityElement(city);
                    if (!this.displayedCities.has(svgCityElement)) {
                        this.displayedCities.add(svgCityElement);
                        this.toExclude.add(city);
                    }
                } else {
                    this.enqueueBuffer(city);
                }
                start = this.bufferHead;
                if (start == end) {
                    break;
                }
            }
            
            if (this.lastDisplayCleanTime < 0 && this.displayedCities.size > 0) {
                this.lastDisplayCleanTime = currentTime;
            } else if (currentTime - this.lastDisplayCleanTime >= this.displayedCitiesCleanInterval) {
                this.cleanDisplayedCities(currentTime);
            }
        }
    }
    
    searchAll(_coords, _radius, _currentTime) {
        for (let size = 0; size < 3; size++) {
            this.searchCities(_coords, _radius, size);
        }
        this.lastNMWidth = this.map.NMWidth;
        this.lastSearchCoords = _coords;
        this.lastSearchRadius = _radius;
        this.lastSearchTime = _currentTime;
        this.mapChangeTimer = 0;
        this.searchedCitiesMedium = false;
        this.searchedCitiesSmall = false;
    }
    
    searchCities(_coords, _radius, _size) {
        if (this.map.htmlRoot.getDeclutteredRange() > this.map.htmlRoot.largeCityMaxRange) {
            return;
        }
        if (_size >= CitySize.Medium && this.map.htmlRoot.getDeclutteredRange() > this.map.htmlRoot.medCityMaxRange) {
            return;
        }
        if (_size == CitySize.Small && this.map.htmlRoot.getDeclutteredRange() > this.map.htmlRoot.smallCityMaxRange) {
            return;
        }
        
        let limit = this.citySearchLimits[_size];
        let results = null;
        if (limit == Infinity) {
            results = this.findAllCitiesNearPos(_coords, _radius, _size);
        } else {
            results = this.findNearestCitiesNearPos(_coords, _radius, _size, limit);
        }
        this.enqueueBufferArray(results);
    }
    
    enqueueBufferArray(_cities) {
        for (let city of _cities) {
            this.enqueueBuffer(city);
        }
    }
    
    enqueueBuffer(_city) {
        if (this.bufferTail == this.bufferHead) {
            this.dequeueBuffer();
        }
        this.buffer[this.bufferTail] = _city;
        this.toExclude.add(_city);
        if (this.bufferHead == -1) {
            this.bufferHead = this.bufferTail;
        }
        this.bufferTail = (this.bufferTail + 1) % this.buffer.length;
        this.bufferSize++;
    }
    
    dequeueBuffer() {
        if (this.bufferHead == -1) {
            return null;
        }
        let e = this.buffer[this.bufferHead];
        this.toExclude.delete(e);
        this.bufferHead = (this.bufferHead + 1) % this.buffer.length;
        this.bufferSize--;
        if (this.bufferHead == this.bufferTail) {
            this.bufferHead = -1;
        }
        return e;
    }
    
    cleanDisplayedCities(_currentTime) {
        let toRemove = [];
        for (let cityElement of this.displayedCities) {
            if (!this.map.isLatLongInFrame(new LatLong(cityElement.lat, cityElement.long), 1)) {
                toRemove.push(cityElement);
            }
        }
        for (let cityElement of toRemove) {
            this.displayedCities.delete(cityElement);
            this.toExclude.delete(cityElement.city);
        }
        this.lastDisplayCleanTime = _currentTime;
    }
    
    findNearestCitiesNearPos(_coords, _radius, _size, _numCities) {
        let cities = [];
        
        this.findNearestCitiesNearPosHelper(SvgCityManager.latLongToXYZ(_coords), _radius / 3440, this.cities.roots[_size], cities, _numCities);
        return cities;
    }
    
    findNearestCitiesNearPosHelper(_pos, _radius, _node, _cities, _numCities) {
        let city = this.cities.cities[_node];
        let side = _pos.get(city.axis) - city[city.axis];
        
        if (side < 0) {
            if (city.lesser >= 0) {
                this.findNearestCitiesNearPosHelper(_pos, _radius, city.lesser, _cities, _numCities);
            }
        } else {
            if (city.greater >= 0) {
                this.findNearestCitiesNearPosHelper(_pos, _radius, city.greater, _cities, _numCities);
            }
        }
        
        if (SvgCityManager.getDistanceSquared(_pos.get("x"), _pos.get("y"), _pos.get("z"), city.x, city.y, city.z) > _radius * _radius) {
            return;
        }
        
        if (!this.toExclude.has(city)) {
            SvgCityManager.insertInOrder(city, _cities, function (_val) {
                return SvgCityManager.getDistanceSquared(_pos.get("x"), _pos.get("y"), _pos.get("z"), _val.x, _val.y, _val.z);
            });
            if (_cities.length > _numCities) {
                _cities.pop();
            }
        }
        
        // check other side
        let other = -1;
        if (side < 0 && city.greater >= 0) {
            other = city.greater;
        } else if (city.lesser >= 0) {
            other = city.lesser;
        }
        
        if (other >= 0) {
            let distanceSquared = 0;
            if (_cities.length < _numCities) {
                distanceSquared = _radius * _radius;
            } else {
                let farthest = _cities[_cities.length - 1];
                distanceSquared = SvgCityManager.getDistanceSquared(_pos.get("x"), _pos.get("y"), _pos.get("z"), farthest.x, farthest.y, farthest.z);
            }
            let otherCity = this.cities.cities[other];
            let distanceToSplit = _pos.get(city.axis) - otherCity[city.axis];
            if (distanceSquared >= distanceToSplit * distanceToSplit) {
                this.findNearestCitiesNearPosHelper(_pos, _radius, other, _cities, _numCities);
            }
        }
    }
    
    findAllCitiesNearPos(_coords, _radius, _size) {
        let cities = [];
        this.findAllCitiesNearPosHelper(SvgCityManager.latLongToXYZ(_coords), _radius / 3440, this.cities.roots[_size], cities);
        return cities;
    }
    
    findAllCitiesNearPosHelper(_pos, _radius, _node, _cities) {
        let city = this.cities.cities[_node];
        
        if (!this.toExclude.has(city)) {
            let distanceSquared = SvgCityManager.getDistanceSquared(_pos.get("x"), _pos.get("y"), _pos.get("z"), city.x, city.y, city.z);
            if (distanceSquared <= _radius * _radius) {
                _cities.push(city);
            }
        }
        
        if ((city.lesser >= 0) && (_pos.get(city.axis) + _radius >= city.least) && (_pos.get(city.axis) - _radius <= city[city.axis])) {
            this.findAllCitiesNearPosHelper(_pos, _radius, city.lesser, _cities);
        }
        if ((city.greater >= 0) && (_pos.get(city.axis) + _radius >= city[city.axis]) && (_pos.get(city.axis) - _radius <= city.greatest)) {
            this.findAllCitiesNearPosHelper(_pos, _radius, city.greater, _cities);
        }
    }
    
    static insertInOrder(_val, _array, _key) {
        let valueKey = _key(_val);
        let i = 0;
        while (i < _array.length) {
            if (valueKey < _key(_array[i++])) {
                break;
            }
        }
        _array.splice(i, 0, _val);
    }
    
    static latLongToXYZ(_coords) {
        let lat = _coords.lat * Avionics.Utils.DEG2RAD;
        let long = _coords.long * Avionics.Utils.DEG2RAD;
        let posX = Math.cos(lat) * Math.cos(long);
        let posY = Math.cos(lat) * Math.sin(long);
        let posZ = Math.sin(lat);
        return new Map([["x", posX],["y", posY], ["z", posZ]]);
    }
    
    static getDistanceSquared(x1, y1, z1, x2, y2, z2) {
        let dx = x2 - x1;
        let dy = y2 - y1;
        let dz = z2 - z1;
        return dx * dx + dy * dy + dz * dz;
    }
    
    static getDistanceNMSquaredLatLong(_coords_1, _coords_2) {
        let lat1 = _coords_1.lat * Avionics.Utils.DEG2RAD;
        let long1 = _coords_1.long * Avionics.Utils.DEG2RAD;
        let lat2 = _coords_2.lat * Avionics.Utils.DEG2RAD;
        let long2 = _coords_2.long * Avionics.Utils.DEG2RAD;
        
        let x = (long2 - long1) * Math.cos((lat1 + lat2) / 2);
        let y = lat2 - lat1;
        return (x * x + y * y) * 3440 * 3440;
    }
}
SvgCityManager.SEARCH_INTERVAL_DEFAULT = 30;
SvgCityManager.MAP_CHANGE_SEARCH_DELAY_DEFAULT = 1;
SvgCityManager.MIN_SEARCH_RADIUS_DEFAULT = 10;
SvgCityManager.CITY_SMALL_SEARCH_LIMIT_DEFAULT = 20;
SvgCityManager.CITY_MEDIUM_SEARCH_LIMIT_DEFAULT = 20;
SvgCityManager.CITY_LARGE_SEARCH_LIMIT_DEFAULT = Infinity; 
SvgCityManager.BUFFER_SIZE_DEFAULT = 100;
SvgCityManager.DISPLAYED_CITIES_CLEAN_INTERVAL = 120;
//# sourceMappingURL=SvgCityManager.js.map