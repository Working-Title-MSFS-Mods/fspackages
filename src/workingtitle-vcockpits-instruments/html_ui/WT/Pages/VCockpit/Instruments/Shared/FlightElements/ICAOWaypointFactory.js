/**
 * A factory for WT_ICAOWaypoint objects. This factory creates waypoint objects from ICAO strings. When a waypoint is requested, an
 * internal cache is first searched to see if an existing waypoint has already been created for the same ICAO string; if one exists, it
 * will be returned in lieu of creating a new object. If one does not exist, then a new object will be created using data loaded from
 * Coherent. The new object is added to the cache then returned.
 */
class WT_ICAOWaypointFactory {
    /**
     * @param {Number} [cacheSize] - the size of the internal waypoint cache.
     */
    constructor(cacheSize = WT_ICAOWaypointFactory.CACHE_SIZE_DEFAULT) {
        this._cacheSize = cacheSize;

        this._icaosToRetrieve = new Map();
        this._waypointCache = new Map();

        this._airwayCache = new Map();

        this._isRegistering = false;
        this._isRegistered = false;

        this._registerListener();
    }

    _registerListener() {
        if (this._isRegistering) {
            return;
        }
        this._isRegistering = true;

        RegisterViewListener("JS_LISTENER_FACILITY", () => {
            console.log("JS_LISTENER_FACILITY registered.");
            Coherent.on("SendAirport", (data) => {
                this._onCoherentDataLoaded(data, WT_ICAOWaypoint.Type.AIRPORT);
            });
            Coherent.on("SendIntersection", (data) => {
                this._onCoherentDataLoaded(data, WT_ICAOWaypoint.Type.INT);
            });
            Coherent.on("SendVor", (data) => {
                this._onCoherentDataLoaded(data, WT_ICAOWaypoint.Type.VOR);
            });
            Coherent.on("SendNdb", (data) => {
                this._onCoherentDataLoaded(data, WT_ICAOWaypoint.Type.NDB);
            });
            this._isRegistered = true;
        });
    }

    /**
     * Returns a Promise that resolves when this factory is registered to receive waypoint data from Coherent.
     * @returns {Promise}
     */
    _waitForRegistration() {
        return new Promise(resolve => {
            let loop = function() {
                if (this._isRegistered) {
                    resolve();
                } else {
                    this.instrument.requestCall(loop.bind(this));
                }
            }
            loop.bind(this)();
        });
    }

    _buildAirway(waypoint, route) {
        let airway = this._airwayCache.get(route.name);
        if (!airway) {
            let builder = new WT_ICAOWaypointFactoryAirwayBuilder(route, this._getWaypointEntry.bind(this));
            airway = new WT_Airway(route.name, route.type, builder);
            airway._waypoints.push(waypoint);
            this._airwayCache.set(route.name, airway);
        }
        return airway;
    }

    /**
     * Adds airways to a waypoint.
     * @param {WT_ICAOWaypoint} waypoint - the waypoint to which to add airways.
     * @param {Object[]} routes - the airway data to use when defining the airways to add.
     */
    _addAirwaysToWaypoint(waypoint, routes) {
        if (waypoint.type === WT_ICAOWaypoint.Type.AIRPORT) {
            return;
        }

        for (let route of routes) {
            let airway = this._buildAirway(waypoint, route);
            waypoint.airways.push(airway);
        }
    }

    /**
     * Creates a waypoint using the specified data and adds it to the cache.
     * @param {Object} data - the data object describing the waypoint.
     * @param {WT_ICAOWaypointFactoryCacheEntry} entry - the cache entry associated with the waypoint.
     */
    _addWaypointToCache(data, entry) {
        switch(data.icao[0]) {
            case WT_ICAOWaypoint.Type.AIRPORT:
                entry.waypoint = new WT_Airport(data, WT_ICAOWaypoint.Type.AIRPORT);
                entry.isReady = true;
                break;
            case WT_ICAOWaypoint.Type.VOR:
                entry.waypoint = new WT_VOR(data, WT_ICAOWaypoint.Type.VOR);
                break;
            case WT_ICAOWaypoint.Type.NDB:
                entry.waypoint = new WT_NDB(data, WT_ICAOWaypoint.Type.NDB);
                break;
            case WT_ICAOWaypoint.Type.INT:
                entry.waypoint = new WT_Intersection(data, WT_ICAOWaypoint.Type.INT);
                break;
            default:
                entry.waypoint = new WT_ICAOWaypoint(data, data.icao[0]);
        }

        if (entry.routes) {
            this._addAirwaysToWaypoint(entry.waypoint, entry.routes);
            entry.isReady = true;
        }
    }

    /**
     * Adds airway data for a waypoint to the cache.
     * @param {Object} data - the data object describing the airway data.
     * @param {WT_ICAOWaypointFactoryCacheEntry} entry - the cache entry associated with the waypoint.
     */
    _addAirwayDataToCache(data, entry) {
        entry.routes = data.routes;
        if (entry.waypoint) {
            this._addAirwaysToWaypoint(entry.waypoint, entry.routes);
            entry.isReady = true;
        }
    }

    /**
     *
     * @param {Object} data - the data object describing the waypoint.
     */
    _onCoherentDataLoaded(data, type) {
        data.icaoTrimmed = data.icao.trim();

        let entry = this._waypointCache.get(data.icaoTrimmed);
        if (!entry) {
            entry = {isReady: false};
            this._waypointCache.set(data.icaoTrimmed, entry);
        } else if (entry.isReady) {
            return;
        }

        if (data.routes) {
            this._addAirwayDataToCache(data, entry);
        }
        if (data.icao[0] === type) {
            this._addWaypointToCache(data, entry);
        }

        if (this._waypointCache.size > this._cacheSize) {
            this._waypointCache.delete(this._waypointCache.keys().next().value);
        }
    }

    /**
     * Inserts an array of ICAO strings into the queue for data retrieval through Coherent.
     * @param {String} coherentCallName - the Coherent call to use when retrieving data.
     * @param {String[]} icaos - an array of ICAO strings.
     */
    _queueICAOsToRetrieve(coherentCallName, icaos) {
        if (!this._icaosToRetrieve.has(coherentCallName)) {
            this._icaosToRetrieve.set(coherentCallName, new Set());
        }
        let icaosToRetrieve = this._icaosToRetrieve.get(coherentCallName);
        for (let icao of icaos) {
            icaosToRetrieve.add(icao);
        }
    }

    /**
     * Attempts to retrieve waypoint entries for an array of ICAO strings in the cache and add them to an array. ICAO strings for which
     * waypoint entries were successfully retrieved are removed from the supplied array.
     * @param {String[]} icaosTrimmed - the list of trimmed ICAO strings for which to retrieve waypoint entries.
     * @param {WT_ICAOWaypoint[]} entryList - the array to which to add the retrieved waypoint entries.
     * @param {Boolean} requireAirwaysLoaded - whether to only retrieve waypoint entries for which airway data has been loaded.
     *                                         Does not affect waypoints of type Airport.
     */
    _findWaypointEntriesInCache(icaosTrimmed, entryList, requireAirwaysLoaded) {
        let i = 0;
        while (i < icaosTrimmed.length) {
            let icaoTrimmed = icaosTrimmed[i];
            let entry = this._waypointCache.get(icaoTrimmed);
            if (entry && (entry.isReady || (entry.waypoint && !requireAirwaysLoaded))) {
                entryList.push(entry);
                icaosTrimmed.splice(i, 1);
            } else {
                i++;
            }
        }
    }

    _createWaypointEntriesFromCoherentLoop(resolve, icaosTrimmed, entryList, coherentCallName, requireAirwaysLoaded, t0, attempts) {
        this._findWaypointEntriesInCache(icaosTrimmed, entryList, requireAirwaysLoaded && attempts < WT_ICAOWaypointFactory.MAX_LOAD_ATTEMPTS);
        if (icaosTrimmed.length === 0) {
            resolve(entryList);
        } else {
            if (attempts >= WT_ICAOWaypointFactory.MAX_LOAD_ATTEMPTS) {
                resolve(entryList);
            } else {
                let currentTime = performance.now();
                if (currentTime - t0 >= WT_ICAOWaypointFactory.RELOAD_ATTEMPT_INTERVAL) {
                    this._queueICAOsToRetrieve(coherentCallName, icaosTrimmed);
                    t0 = currentTime;
                    attempts++;
                }
                requestAnimationFrame(this._createWaypointEntriesFromCoherentLoop.bind(this, resolve, icaosTrimmed, entryList, coherentCallName, requireAirwaysLoaded, t0, attempts));
            }
        }
    }

    /**
     * Attempts to create waypoint entries for a specified array of trimmed ICAO strings using data loaded from Coherent.
     * @param {String[]} icaosTrimmed - an array of trimmed ICAO strings for which to create waypoint entries.
     * @param {WT_ICAOWaypointFactoryCacheEntry[]} entryList - an array to which to add the created entries.
     * @param {String} coherentCallName - the Coherent call to use when retrieving data.
     * @param {Boolean} requireAirwaysLoaded - whether to only retrieve waypoint entries for which airway data has been loaded.
     *                                         Does not affect waypoints of type Airport.
     * @returns {Promise<WT_ICAOWaypointFactoryCacheEntry[]>} a Promise to return an array of waypoint entries.
     */
    _createWaypointEntriesFromCoherent(icaosTrimmed, entryList, coherentCallName, requireAirwaysLoaded) {
        return new Promise(resolve => {
            this._createWaypointEntriesFromCoherentLoop(resolve, icaosTrimmed, entryList, coherentCallName, requireAirwaysLoaded, performance.now(), 1);
        });
    }

    /**
     * Attempts to retrieve waypoint entries for a specified array of ICAO strings. First, the local cache is searched; if the entry
     * is not found there, then an attempt is made to retrieve the data through coherent. In certain circumstances, entries for
     * some ICAO strings may not be able to be retrieved - if this happens only the successfully retrieved entries will be returned.
     * @param {String[]} icaos - an array of ICAO strings for which to retrieve waypoint entries.
     * @param {String} coherentCallName - the name of the coherent call to use if some entries cannot be found in the local cache.
     * @param {Boolean} requireAirwaysLoaded - whether to only retrieve waypoint entries for which airway data has been loaded.
     *                                         Does not affect waypoints of type Airport.
     * @returns {Promise<WT_ICAOWaypointFactoryCacheEntry[]>} a Promise to return an array of retrieved waypoint entries.
     */
    async _retrieveWaypointEntries(icaos, coherentCallName, requireAirwaysLoaded) {
        let entries = [];
        let icaosTrimmed = icaos.map(icao => icao.trim());
        this._findWaypointEntriesInCache(icaosTrimmed, entries, requireAirwaysLoaded);

        if (icaosTrimmed.length === 0) {
            return entries;
        }

        this._queueICAOsToRetrieve(coherentCallName, icaosTrimmed);
        return await this._createWaypointEntriesFromCoherent(icaosTrimmed, entries, coherentCallName, requireAirwaysLoaded);
    }

    /**
     * Gets a waypoint cache entry for an ICAO string.
     * @param {String} icao - the ICAO string for which to get a cache entry.
     * @returns {Promise<WT_ICAOWaypointFactoryCacheEntry>} a Promise to return a waypoint cache entry.
     */
    async _getWaypointEntry(icao) {
        let coherentCallName;
        switch (icao[0]) {
            case WT_ICAOWaypoint.Type.AIRPORT:
                coherentCallName = WT_ICAOWaypointFactory.COHERENT_CALL_AIRPORTS;
                break;
            case WT_ICAOWaypoint.Type.VOR:
                coherentCallName = WT_ICAOWaypointFactory.COHERENT_CALL_VORS;
                break;
            case WT_ICAOWaypoint.Type.NDB:
                coherentCallName = WT_ICAOWaypointFactory.COHERENT_CALL_NDBS;
                break;
            case WT_ICAOWaypoint.Type.INT:
                coherentCallName = WT_ICAOWaypointFactory.COHERENT_CALL_INTS;
                break;
        }
        if (!coherentCallName) {
            throw new Error(`Invalid ICAO string: ${icao}`);
        }
        let entries = await this._retrieveWaypointEntries([icao], coherentCallName, true);
        if (entries.length === 0) {
            throw new Error(`Could not retrieve waypoint entry for ICAO string: ${icao}`);
        }
        return entries[0];
    }

    /**
     * Attempts to retrieve waypoints for a specified array of ICAO strings. First, the local cache is searched; if the waypoint
     * is not found there, then an attempt is made to retrieve the data through coherent. In certain circumstances, waypoints for
     * some ICAO strings may not be able to be retrieved - if this happens only the successfully retrieved waypoints will be returned.
     * @param {String[]} icaos - an array of ICAO strings for which to retrieve waypoints.
     * @param {String} coherentCallName - the name of the coherent call to use if some waypoints cannot be found in the local cache.
     * @returns {Promise<WT_ICAOWaypoint[]>} a Promise to return an array of retrieved waypoints.
     */
    async _retrieveWaypoints(icaos, coherentCallName) {
        await this._waitForRegistration();
        let entries = await this._retrieveWaypointEntries(icaos, coherentCallName, false);
        return entries.map(entry => entry.waypoint);
    }

    /**
     * Attempts to retrieve an airport waypoint corresponding to an ICAO string.
     * @param {String} icao - an ICAO string.
     * @returns {Promise<WT_ICAOWaypoint>} a Promise to return an airport waypoint.
     */
    async getAirport(icao) {
        let array = await this.getAirports([icao]);
        if (array.length > 0) {
            return array[0];
        } else {
            throw new Error(`Could not retrieve airport for ICAO string: ${icao}`);
        }
    }

    /**
     * Attempts to retrieve airport waypoints corresponding to a list of ICAO strings.
     * @param {String[]} icaos - an array of ICAO strings.
     * @returns {Promise<WT_ICAOWaypoint[]>} a Promise to return an array of airport waypoints.
     */
    async getAirports(icaos) {
        return this._retrieveWaypoints(icaos, WT_ICAOWaypointFactory.COHERENT_CALL_AIRPORTS);
    }

    /**
     * Attempts to retrieve a VOR waypoint corresponding to an ICAO string.
     * @param {String} icao - an ICAO string.
     * @returns {Promise<WT_ICAOWaypoint>} a Promise to return a VOR waypoint.
     */
    async getVOR(icao) {
        let array = await this.getVORs([icao]);
        if (array.length > 0) {
            return array[0];
        } else {
            throw new Error(`Could not retrieve VOR for ICAO string: ${icao}`);
        }
    }

    /**
     * Attempts to retrieve VOR waypoints corresponding to a list of ICAO strings.
     * @param {String[]} icaos - an array of ICAO strings.
     * @returns {Promise<WT_ICAOWaypoint[]>} a Promise to return an array of VOR waypoints.
     */
    async getVORs(icaos) {
        return this._retrieveWaypoints(icaos, WT_ICAOWaypointFactory.COHERENT_CALL_VORS);
    }

    /**
     * Attempts to retrieve an NDB waypoint corresponding to an ICAO string.
     * @param {String} icao - an ICAO string.
     * @returns {Promise<WT_ICAOWaypoint>} a Promise to return an NDB waypoint.
     */
    async getNDB(icao) {
        let array = await this.getNDBs([icao]);
        if (array.length > 0) {
            return array[0];
        } else {
            throw new Error(`Could not retrieve NDB for ICAO string: ${icao}`);
        }
    }

    /**
     * Attempts to retrieve NDB waypoints corresponding to a list of ICAO strings.
     * @param {String[]} icaos - an array of ICAO strings.
     * @returns {Promise<WT_ICAOWaypoint[]>} a Promise to return an array of NDB waypoints.
     */
    async getNDBs(icaos) {
        return this._retrieveWaypoints(icaos, WT_ICAOWaypointFactory.COHERENT_CALL_NDBS);
    }

    /**
     * Attempts to retrieve an intersection waypoint corresponding to an ICAO string.
     * @param {String} icao - an ICAO string.
     * @returns {Promise<WT_ICAOWaypoint>} a Promise to return an intersection waypoint.
     */
    async getINT(icao) {
        let array = await this.getINTs([icao]);
        if (array.length > 0) {
            return array[0];
        } else {
            throw new Error(`Could not retrieve INT for ICAO string: ${icao}`);
        }
    }

    /**
     * Attempts to retrieve intersection waypoints corresponding to a list of ICAO strings.
     * @param {String[]} icaos - an array of ICAO strings.
     * @returns {Promise<WT_ICAOWaypoint[]>} a Promise to return an array of intersection waypoints.
     */
    async getINTs(icaos) {
        return this._retrieveWaypoints(icaos, WT_ICAOWaypointFactory.COHERENT_CALL_INTS);
    }

    /**
     * Attempts to retrieve a waypoint for an ICAO string.
     * @param {String} icao - the ICAO string for which to retrieve a waypoint.
     * @returns {Promise<WT_ICAOWaypoint>} a Promise to return a waypoint.
     */
    async getWaypoint(icao) {
        switch (icao[0]) {
            case WT_ICAOWaypoint.Type.AIRPORT:
                return this.getAirport(icao);
            case WT_ICAOWaypoint.Type.VOR:
                return this.getVOR(icao);
            case WT_ICAOWaypoint.Type.NDB:
                return this.getNDB(icao);
            case WT_ICAOWaypoint.Type.INT:
                return this.getINT(icao);
            default:
                throw new Error(`Invalid ICAO string: ${icao}`);
        }
    }

    update() {
        for (let key of this._icaosToRetrieve.keys()) {
            let icaos = this._icaosToRetrieve.get(key);
            if (!icaos || icaos.size === 0) {
                continue;
            }
            let icaoArray = Array.from(icaos);
            Coherent.call(key, icaoArray, icaoArray.length);
            if (key !== WT_ICAOWaypointFactory.COHERENT_CALL_AIRPORTS && key !== WT_ICAOWaypointFactory.COHERENT_CALL_INTS) {
                Coherent.call(WT_ICAOWaypointFactory.COHERENT_CALL_INTS, icaoArray, icaoArray.length);
            }
            icaos.clear();
        }
    }
}
WT_ICAOWaypointFactory.CACHE_SIZE_DEFAULT = 5000;
WT_ICAOWaypointFactory.COHERENT_CALL_AIRPORTS = "LOAD_AIRPORTS";
WT_ICAOWaypointFactory.COHERENT_CALL_VORS = "LOAD_VORS";
WT_ICAOWaypointFactory.COHERENT_CALL_NDBS = "LOAD_NDBS";
WT_ICAOWaypointFactory.COHERENT_CALL_INTS = "LOAD_INTERSECTIONS";
WT_ICAOWaypointFactory.MAX_LOAD_ATTEMPTS = 10;
WT_ICAOWaypointFactory.RELOAD_ATTEMPT_INTERVAL = 200; // ms

/**
 * @typedef WT_ICAOWaypointFactoryCacheEntry
 * @property {Boolean} isReady - whether the waypoint has finished loading and is ready for public access.
 * @property {WT_ICAOWaypoint} waypoint - the waypoint object.
 * @property {Object[]} routes - airway data for the waypoint.
 */

class WT_ICAOWaypointFactoryAirwayBuilder extends WT_AirwayBuilder {
    constructor(initialData, requestEntry) {
        super();
        this._initialData = initialData;
        this._requestEntry = requestEntry;
    }

    async _stepForward() {
        let isDone = false;
        let current = this._initialData;
        while (!isDone && current) {
            let nextICAO = current.nextIcao;
            if (nextICAO && nextICAO.length > 0 && nextICAO[0] != " ") {
                let entry = await this._requestEntry(nextICAO);
                this.airway._waypoints.push(entry.waypoint);
                current = entry.routes.find(route => route.name === current.name);
            } else {
                isDone = true;
            }
        }
    }

    async _stepBackward() {
        let isDone = false;
        let current = this._initialData;
        while (!isDone && current) {
            let prevICAO = current.prevIcao;
            if (prevICAO && prevICAO.length > 0 && prevICAO[0] != " ") {
                let entry = await this._requestEntry(prevICAO);
                this.airway._waypoints.splice(0, 0, entry.waypoint);
                current = entry.routes.find(route => route.name === current.name);
            } else {
                isDone = true;
            }
        }
    }

    /**
     * Begins loading waypoints for this builder's parent airway.
     * @returns {Promise<Number>} a Promise to return a status code corresponding to WT_Airway.Status when this builder has
     *                            finished loading waypoints.
     */
    startBuild() {
        if (this.hasStarted) {
            return Promise.reject(new Error("Airway builder has already started building."));
        }
        return new Promise(resolve => {
            this._hasStarted = true;
            Promise.all([
                this._stepForward(),
                this._stepBackward()
            ]).then(() => {
                this._isDone = true;
                resolve(WT_Airway.Status.COMPLETE);
            }).catch(e => {
                this._isDone = true;
                resolve(WT_Airway.Status.PARTIAL);
            });
        });
    }
}