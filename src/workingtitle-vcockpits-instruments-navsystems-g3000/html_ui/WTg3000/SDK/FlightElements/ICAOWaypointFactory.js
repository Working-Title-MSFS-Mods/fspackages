/**
 * A factory for WT_ICAOWaypoint objects. This factory creates waypoint objects from ICAO strings. When a waypoint is requested, an
 * internal cache is first searched to see if an existing waypoint has already been created for the same ICAO string; if one exists, it
 * will be returned in lieu of creating a new object. If one does not exist, then a new object will be created using data loaded from
 * Coherent. The new object is added to the cache then returned.
 */
class WT_ICAOWaypointFactory {
    /**
     * @param {Number} [cacheSize] - the size of the internal waypoint cache.
     * @param {Number} [coherentCallProcessBudget] - the maximum number of calls to make to Coherent to request
     *                                               waypoint data per waypoint type per update cycle.
     * @param {Number} [coherentDataProcessBudget] - the maximum number of waypoint data objects sent by Coherent to
     *                                               process per update cycle.
     */
    constructor(cacheSize = WT_ICAOWaypointFactory.CACHE_SIZE_DEFAULT, coherentCallProcessBudget = WT_ICAOWaypointFactory.COHERENT_CALL_PROCESS_BUDGET_DEFAULT, coherentDataProcessBudget = WT_ICAOWaypointFactory.COHERENT_DATA_PROCESS_BUDGET_DEFAULT) {
        this._cacheSize = cacheSize;
        this._coherentCallProcessBudget = coherentCallProcessBudget;
        this._coherentDataProcessBudget = coherentDataProcessBudget;

        /**
         * @type {Map<String,Set<String>>}
         */
        this._icaosToRetrieve = new Map();
        this._coherentDataQueue = [];
        /**
         * @type {Map<String,WT_ICAOWaypointFactoryCacheEntry>}
         */
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
     * @returns {Promise<void>}
     */
    async _waitForRegistration() {
        await WT_Wait.awaitCallback(() => this._isRegistered, this);
    }

    _buildAirway(waypoint, route) {
        let airway = this._airwayCache.get(route.name);
        if (!airway) {
            let builder = new WT_ICAOWaypointFactoryAirwayBuilder(route, this._getWaypointEntry.bind(this), waypoint);
            airway = new WT_Airway(route.name, route.type, builder);
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

        routes.forEach(route => {
            let airway = this._buildAirway(waypoint, route);
            waypoint.airways.push(airway);
        }, this);
    }

    /**
     * Creates a waypoint using the specified data and adds it to the cache.
     * @param {Object} data - the data object describing the waypoint.
     * @param {WT_ICAOWaypointFactoryCacheEntry} entry - the cache entry associated with the waypoint.
     */
    _addWaypointToCache(data, entry) {
        switch(WT_ICAOWaypoint.getICAOType(data.icao)) {
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
     * Enqueues waypoint data sent by Coherent to be processed.
     * @param {Object} data - the waypoint data object.
     */
    _enqueueCoherentData(data) {
        this._coherentDataQueue.push(data);
    }

    /**
     *
     * @param {Object} data - the data object describing the waypoint.
     * @param {WT_ICAOWaypoint.Type} sentType - the ICAO waypoint type of the data, as sent by Coherent.
     */
    _onCoherentDataLoaded(data, sentType) {
        data.sentType = sentType;
        this._enqueueCoherentData(data);
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
        icaos.forEach(icao => icaosToRetrieve.add(icao));
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
        switch (WT_ICAOWaypoint.getICAOType(icao)) {
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
     * @returns {Promise<WT_Airport>} a Promise to return an airport waypoint.
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
        icaos.forEach((icao, index, array) => {
            if (icao[0] === "A" && icao[1] !== " ") {
                // sometimes nav data contains airport ICAOs with region codes, which will cause Coherent lookup to fail,
                // so we have to remove the region code
                array[index] = "A  " + icao.substring(3);
            }
        });
        return this._retrieveWaypoints(icaos, WT_ICAOWaypointFactory.COHERENT_CALL_AIRPORTS);
    }

    /**
     * Attempts to retrieve a VOR waypoint corresponding to an ICAO string.
     * @param {String} icao - an ICAO string.
     * @returns {Promise<WT_VOR>} a Promise to return a VOR waypoint.
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
     * @returns {Promise<WT_NDB>} a Promise to return an NDB waypoint.
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
     * @returns {Promise<WT_Intersection>} a Promise to return an intersection waypoint.
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
     * Attempts to retrieve a waypoint for an ICAO string. Returns null if the provided ICAO string is invalid.
     * @param {String} icao - the ICAO string for which to retrieve a waypoint.
     * @returns {Promise<WT_ICAOWaypoint>} a Promise to return a waypoint.
     */
    async getWaypoint(icao) {
        if (icao.length !== 12) {
            return null;
        }

        switch (WT_ICAOWaypoint.getICAOType(icao)) {
            case WT_ICAOWaypoint.Type.AIRPORT:
                return this.getAirport(icao);
            case WT_ICAOWaypoint.Type.VOR:
                return this.getVOR(icao);
            case WT_ICAOWaypoint.Type.NDB:
                return this.getNDB(icao);
            case WT_ICAOWaypoint.Type.INT:
                return this.getINT(icao);
            default:
                return null;
        }
    }

    /**
     * Sends a request to Coherent to retrieve waypoint data for an array of ICAO strings.
     * @param {String} key - the Coherent call key.
     * @param {String[]} icaoArray - an array of ICAO strings.
     */
    _executeCoherentCall(key, icaoArray) {
        Coherent.call(key, icaoArray, icaoArray.length);
        if (key !== WT_ICAOWaypointFactory.COHERENT_CALL_AIRPORTS && key !== WT_ICAOWaypointFactory.COHERENT_CALL_INTS) {
            // need to make an extra call to load intersection data in order to get airways for VORs and NDBs.
            Coherent.call(WT_ICAOWaypointFactory.COHERENT_CALL_INTS, icaoArray, icaoArray.length);
        }
    }

    _processCoherentCallQueue() {
        this._icaosToRetrieve.forEach((icaos, key) => {
            if (!icaos || icaos.size === 0) {
                return;
            }
            let icaoArray = [];
            icaos.forEach(icao => {
                if (icaoArray.length < this._coherentCallProcessBudget) {
                    icaoArray.push(icao);
                }
            });
            this._executeCoherentCall(key, icaoArray);

            icaoArray.forEach(icao => icaos.delete(icao));
        }, this);
    }

    /**
     * Processes waypoint data sent by Coherent. Depending on the data that was sent, either a new WT_ICAOWaypoint
     * object will be created from the data and added to the cache, or airway data will be added to a waypoint
     * object.
     * @param {Object} data - the waypoint data object.
     */
    _processCoherentData(data) {
        data.icaoTrimmed = data.icao.trim();

        let entry = this._waypointCache.get(data.icaoTrimmed);
        if (!entry) {
            entry = {isReady: false};
            this._waypointCache.set(data.icaoTrimmed, entry);
            if (this._waypointCache.size > this._cacheSize) {
                this._waypointCache.delete(this._waypointCache.keys().next().value);
            }
        } else if (entry.isReady) {
            return;
        }

        if (data.routes) {
            this._addAirwayDataToCache(data, entry);
        }
        if (WT_ICAOWaypoint.getICAOType(data.icao) === data.sentType) {
            this._addWaypointToCache(data, entry);
        }
    }

    _processCoherentDataQueue() {
        let count = 0;
        while (count < this._coherentDataProcessBudget) {
            if (count >= this._coherentDataQueue.length) {
                break;
            }
            this._processCoherentData(this._coherentDataQueue[count++]);
        }

        this._coherentDataQueue.splice(0, count);
    }

    update() {
        this._processCoherentCallQueue();
        this._processCoherentDataQueue();
    }
}
WT_ICAOWaypointFactory.CACHE_SIZE_DEFAULT = 5000;
WT_ICAOWaypointFactory.COHERENT_CALL_PROCESS_BUDGET_DEFAULT = 10;
WT_ICAOWaypointFactory.COHERENT_DATA_PROCESS_BUDGET_DEFAULT = 20;
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
    constructor(initialData, requestEntry, initialWaypoint) {
        super();
        this._initialData = initialData;
        this._requestEntry = requestEntry;
        this._initialWaypoint = initialWaypoint;
    }

    async _step(nextICAOPropertyName, arrayInsertFunc) {
        let isDone = false;
        let current = this._initialData;
        while (!isDone && current) {
            let nextICAO = current[nextICAOPropertyName];
            if (nextICAO && nextICAO.length > 0 && nextICAO[0] != " " && !this._waypointsArray.find(waypoint => waypoint.icao === nextICAO)) {
                let entry = await this._requestEntry(nextICAO);
                arrayInsertFunc(entry.waypoint);
                current = entry.routes.find(route => route.name === current.name);
            } else {
                isDone = true;
            }
        }
    }

    async _stepForward() {
        return this._step("nextIcao", this._waypointsArray.push.bind(this._waypointsArray));
    }

    async _stepBackward() {
        return this._step("prevIcao", this._waypointsArray.unshift.bind(this._waypointsArray));
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
            this._waypointsArray.push(this._initialWaypoint);
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