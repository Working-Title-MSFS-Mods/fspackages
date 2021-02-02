/**
 * A searcher that finds cities located within a circular geographic area.
 */
class WT_CitySearcher {
    constructor() {
        this._isReady = false;

        this._tempGeoPoint1 = new WT_GeoPoint(0, 0, 0);
        this._tempGeoPoint2 = new WT_GeoPoint(0, 0, 0);
        this._tempVector = new WT_GVector3(0, 0, 0);

        this._loadTreeJSON(WT_CitySearcher.DATA_FILE_PATH);
    }

    _loadTreeJSON(path) {
        let request = new XMLHttpRequest();
        request.overrideMimeType("application/json");

        request.addEventListener("load",
            (function() {
                this._loadData(request.responseText);
            }).bind(this)
        );
        request.open("GET", path);
        request.send();
    }

    _loadData(data) {
        /**
         * @type {{cities:WT_CityTreeNode[], roots:Number[]}}
         */
        this._tree = JSON.parse(data);
        this._isReady = true;
    }

    /**
     * @readonly
     * @property {Boolean} isReady
     * @type {Boolean}
     */
    get isReady() {
        return this._isReady;
    }

    /**
     * Creates a WT_City object from data contained in a tree node.
     * @param {WT_CityTreeNode} node - the tree node from which to create a city.
     * @returns {WT_City} a city.
     */
    static _createCityFromNode(node) {
        return new WT_City(node.name, new WT_GeoPoint(node.lat, node.long, 0), node.size);
    }

    /**
     * Gets a unique string key from a city.
     * @param {WT_City} city
     * @returns {String} a unique string key.
     */
    static _keyFromCity(city) {
        return city.uniqueID;
    }

    /**
     * Gets a unique string key from a tree node.
     * @param {WT_CityTreeNode} node
     * @returns {String} a unique string key.
     */
    static _keyFromNode(node) {
        return `${node.name}: ${node.lat.toFixed(2)} ${node.long.toFixed(2)}`;
    }

    /**
     * @param {WT_City} city
     * @param {WT_GeoPoint} center
     * @param {WT_City[]} array
     */
    _insertInOrder(city, center, array) {
        let min = 0;
        let max = array.length;
        let index = Math.floor((max + min) / 2);
        let distance = city.location.distance(center);
        while (min < max) {
            let compare = array[index].location.distance(center);
            if (distance === compare) {
                break;
            } else if (distance < compare) {
                max = index;
            } else {
                min = index + 1;
            }
            index = Math.floor((max + min) / 2);
        }
        array.splice(index, 0, city);
    }

    /**
     * @param {Number} nodeIndex
     * @param {WT_GeoPoint} centerCartesian
     * @param {WT_NumberUnit} radius
     * @param {Set<WT_City>} exclude
     * @param {WT_City[]} cities
     */
    _searchHelper(nodeIndex, center, centerCartesian, radius, exclude, cities) {
        let cityEntry = this._tree.cities[nodeIndex];

        if (!exclude.has(WT_CitySearcher._keyFromNode(cityEntry))) {
            let cityPos = this._tempGeoPoint2.set(cityEntry.lat, cityEntry.long, 0);
            let distance = center.distance(cityPos);
            if (distance <= radius) {
                if (!cityEntry.object) {
                    cityEntry.object = WT_CitySearcher._createCityFromNode(cityEntry);
                }
                this._insertInOrder(cityEntry.object, center, cities);
            }
        }

        if ((cityEntry.lesser >= 0) && (centerCartesian[cityEntry.axis] + radius >= cityEntry.least) && (centerCartesian[cityEntry.axis] - radius <= cityEntry[cityEntry.axis])) {
            this._searchHelper(cityEntry.lesser, center, centerCartesian, radius, exclude, cities);
        }
        if ((cityEntry.greater >= 0) && (centerCartesian[cityEntry.axis] + radius >= cityEntry[cityEntry.axis]) && (centerCartesian[cityEntry.axis] - radius <= cityEntry.greatest)) {
            this._searchHelper(cityEntry.greater, center, centerCartesian, radius, exclude, cities);
        }
    }

    /**
     * Searches for all cities within a specified radius of a geographic point and returns them in an array in ascending order of
     * great-circle distance from the specified point.
     * @param {Number} size - the size category of the cities to be returned by the search.
     * @param {WT_GeoPoint} center - the center of the search ring.
     * @param {WT_NumberUnit} radius - the radius of the search ring.
     * @param {Iterable<WT_City>} [exclude] - cities to exclude from the search results.
     * @returns {WT_City[]} - an array of cities located in the search ring, sorted in ascending order of great-circle distance
     *                        from the center of the search ring.
     */
    search(size, center, radius, exclude) {
        if (!this.isReady) {
            return [];
        }

        let cities = [];
        let excludeSet = new Set();
        if (exclude) {
            for (let city of exclude) {
                excludeSet.add(WT_CitySearcher._keyFromCity(city));
            }
        }
        center = this._tempGeoPoint1.set(center.lat, center.long, 0);
        this._searchHelper(this._tree.roots[size], center, center.cartesian(this._tempVector), radius.asUnit(WT_Unit.GA_RADIAN), excludeSet, cities);
        return cities;
    }
}
WT_CitySearcher.DATA_FILE_PATH = "/WTg3000/SDK/Assets/Data/Cities/cities.json";

/**
 * @typedef WT_CityTreeNode
 * @property {String} name - the name of this entry's city.
 * @property {Number} lat - the latitude of this entry's city.
 * @property {Number} long - the longitude of this entry's city.
 * @property {Number} size - the size category of this entry's city.
 * @property {Number} x - the x-coordinate of the cartesian representation of the location of this entry's city
 * @property {Number} y - the y-coordinate of the cartesian representation of the location of this entry's city
 * @property {Number} z - the z-coordinate of the cartesian representation of the location of this entry's city
 * @property {String} axis - the axis (x, y, or z) on which this entry was split.
 * @property {Number} lesser - the index of the lesser child of this entry.
 * @property {Number} greater - the index of the greater child of this entry.
 * @property {Number} least - the minimum value of the coordinate on which this entry was split contained within the sub-tree
 *                            that has this entry as its root.
 * @property {Number} greatest - the maximum value of the coordinate on which this entry was split contained within the sub-tree
 *                               that has this entry as its root.
 */