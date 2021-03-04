/**
 * A searcher that finds ICAO strings of waypoints located within a circular geographic area.
 */
class WT_ICAOSearcher {
    /**
     * @param {String} id - a unique string ID to assign to the new searcher.
     * @param {Object} keys - an object defining the search keys the new searcher should use.
     */
    constructor(id, keys) {
        this._id = id;
        this._keys = keys;

        this._nextAvailableID = [];
        this._issuedIDCount = 0;
    }

    /**
     * @readonly
     * @property {String} id - this searcher's unique string ID.
     * @type {String}
     */
    get id() {
        return this._id;
    }

    _closeRequest(id) {
        SimVar.SetSimVarValue(`C:fs9gps:${this._setRangeKey}`, "nautical miles", 0, `${this.id}-${WT_ICAOSearcher.SIMVAR_KEY_SUFFIX}_${id}`).then(
            () => {
                this._nextAvailableID.push(id);
            });
    }

    /**
     * Creates a new ICAO search request from this searcher.
     * @param {{lat:Number, long:Number}} center - the center of the initial search circle of the new request.
     * @param {WT_NumberUnit} radius - the radius of the initial search circle of the new request.
     * @param {Number} searchLimit - the maximum number of items to return with the new request.
     * @returns {WT_ICAOSearchRequest} a new ICAO search request.
     */
    openRequest(center, radius, searchLimit) {
        let id = this._nextAvailableID.length > 0 ? this._nextAvailableID.splice(0, 1)[0] : this._issuedIDCount;
        this._issuedIDCount++;
        return new WT_ICAOSearchRequest(this, id, center, radius, searchLimit);
    }
}
WT_ICAOSearcher.SIMVAR_KEY_SUFFIX = "icaosearch";
/**
 * @enum {Object}
 */
WT_ICAOSearcher.Keys = {
    /**
     * @readonly
     * @property {Object} AIRPORT - search keys for airports.
     */
    AIRPORT: {
        setLatitudeKey: "NearestAirportCurrentLatitude",
        setLongitudeKey: "NearestAirportCurrentLongitude",
        setRangeKey: "NearestAirportMaximumDistance",
        setSearchLimitKey: "NearestAirportMaximumItems",
        getCountKey: "NearestAirportItemsNumber",
        setIndexKey: "NearestAirportCurrentLine",
        getICAOKey: "NearestAirportCurrentIcao"
    },
    /**
     * @readonly
     * @property {Object} VOR - search keys for VORs.
     */
    VOR: {
        setLatitudeKey: "NearestVorCurrentLatitude",
        setLongitudeKey: "NearestVorCurrentLongitude",
        setRangeKey: "NearestVorMaximumDistance",
        setSearchLimitKey: "NearestVorMaximumItems",
        getCountKey: "NearestVorItemsNumber",
        setIndexKey: "NearestVorCurrentLine",
        getICAOKey: "NearestVorCurrentIcao"
    },
    /**
     * @readonly
     * @property {Object} NDB - search keys for NDBs.
     */
    NDB: {
        setLatitudeKey: "NearestNdbCurrentLatitude",
        setLongitudeKey: "NearestNdbCurrentLongitude",
        setRangeKey: "NearestNdbMaximumDistance",
        setSearchLimitKey: "NearestNdbMaximumItems",
        getCountKey: "NearestNdbItemsNumber",
        setIndexKey: "NearestNdbCurrentLine",
        getICAOKey: "NearestNdbCurrentIcao"
    },
    /**
     * @readonly
     * @property {Object} INT - search keys for intersections.
     */
    INT: {
        setLatitudeKey: "NearestIntersectionCurrentLatitude",
        setLongitudeKey: "NearestIntersectionCurrentLongitude",
        setRangeKey: "NearestIntersectionMaximumDistance",
        setSearchLimitKey: "NearestIntersectionMaximumItems",
        getCountKey: "NearestIntersectionItemsNumber",
        setIndexKey: "NearestIntersectionCurrentLine",
        getICAOKey: "NearestIntersectionCurrentIcao"
    }
}

/**
 * A search request for ICAO strings.
 */
class WT_ICAOSearchRequest {
    /**
     * @param {WT_ICAOSearcher} searcher - the ICAO searcher to which the new request belongs.
     * @param {Number} id - a unique integer ID belonging to the new request.
     * @param {{lat:Number, long:Number}} center - the center of the initial search circle.
     * @param {WT_NumberUnit} radius - the radius of the initial search circle.
     * @param {Number} searchLimit - the maximum number of items to return with the search.
     */
    constructor(searcher, id, center, radius, searchLimit) {
        this._searcher = searcher;
        this._keys = searcher._keys;
        this._simVarSearchInstanceKey = `${searcher.id}-${WT_ICAOSearcher.SIMVAR_KEY_SUFFIX}_${id}`;
        this._id = id;
        this._center = new WT_GeoPoint(center.lat, center.long);
        this._radius = new WT_NumberUnit(radius.number, radius.unit);
        this._searchLimit = searchLimit;
        this._results = [];

        this._batch = new SimVar.SimVarBatch(`C:fs9gps:${this._keys.getCountKey}`, `C:fs9gps:${this._keys.setIndexKey}`);
        this._batch.add(`C:fs9gps:${this._keys.getICAOKey}`, "string");

        this._updateQueue = [];
        this._paramChangeQueue = [];
        this._isLocked = false;
        this._isClosing = false;
        this._isClosed = false;
    }

    /**
     * @readonly
     * @property {WT_ICAOSearcher} searcher - the ICAO searcher to which this request belongs.
     * @type {WT_ICAOSearcher}
     */
    get searcher() {
        return this._searcher;
    }

    /**
     * @readonly
     * @property {WT_GeoPointReadOnly} center - the center of the search circle.
     * @type {WT_GeoPointReadOnly}
     */
    get center() {
        return this._center.readonly();
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} radius - the radius of the search circle.
     * @type {WT_NumberUnitReadOnly}
     */
    get radius() {
        return this._radius.readonly();
    }

    /**
     * @readonly
     * @property {Number} searchLimit - the maximum number of items to return with the search.
     * @type {Number}
     */
    get searchLimit() {
        return this._searchLimit;
    }

    /**
     * @readonly
     * @property {String[]} results - the results of the search, as an array of ICAO strings.
     * @type {String[]}
     */
    get results() {
        return this._results;
    }

    /**
     * @readonly
     * @property {Boolean} isClosed - whether this request is closed.
     * @type {Boolean}
     */
    get isClosed() {
        return this._isClosed || this._isClosing;
    }

    _doSetParameters(center, radius, searchLimit) {
        this._center.set(center);
        this._radius.set(radius);
        this._searchLimit = searchLimit;
    }

    /**
     * Defines a new search circle for this request. The new parameters will not take effect until any currently pending search
     * updates have finished. This method returns a Promise that resolves either immediately if there are no pending search updates,
     * or when all pending search updates have finished. If this search request is already closed, then a rejected Promise will be returned.
     * If this search request is closed or if another parameter change is initiated while the returned Promise is pending, the Promise will
     * be rejected.
     * @param {{lat:Number, long:Number}} center - the center of the new search circle.
     * @param {WT_NumberUnit} radius - the radius of the new search circle.
     * @param {Number} searchLimit - the maximum number of items to return with the search.
     * @returns {Promise} - a Promise that resolves when the new search parameters take effect, or rejects if this search request closes
     *                      or another parameter change is initiated before that can happen.
     */
    setParameters(center, radius, searchLimit) {
        if (this._isClosing || this._isClosed) {
            return Promise.reject(new Error("ICAO search request is closed."));
        }

        return new Promise((resolve, reject) => {
            this._doSetParameters(center, radius, searchLimit);
            if (this._isLocked) {
                this._paramChangeQueue.push({resolve: resolve, reject: reject});
            } else {
                resolve();
            }
        });
    }

    _checkClosing() {
        if (this._isClosing) {
            this._doClose();
        }
    }

    _doClose() {
        this._searcher._closeRequest(this._id);
        this._isClosing = false;
        this._isClosed = true;
    }

    _resolveUpdateQueue() {
        for (let update of this._updateQueue) {
            update();
        }
        this._updateQueue = [];
    }

    _resolveParamChangeQueue() {
        for (let i = 0; i < this._paramChangeQueue.length; i++) {
            let paramChange = this._paramChangeQueue[i];
            if (this._isClosed) {
                paramChange.reject(new Error("ICAO search request is closed."));
            } else if (i < this._paramChangeQueue.length - 1) {
                paramChange.reject(new Error("Parameter change was overridden by a more recent one."));
            } else {
                paramChange.resolve();
            }
        }
        this._paramChangeQueue = [];
    }

    _finishUpdate(resolve) {
        this._isLocked = false;
        resolve();
        this._resolveUpdateQueue();
        this._checkClosing();
        for (let paramChange of this._paramChangeQueue) {
            if (this._isClosed) {
                paramChange.reject(new Error("ICAO search request is closed."));
            } else {
                paramChange.resolve();
            }
        }
        this._paramChangeQueue = [];
    }

    _retrieveResults(resolve) {
        let numResults = SimVar.GetSimVarValue(`C:fs9gps:${this._keys.getCountKey}`, "number", this._simVarSearchInstanceKey);
        if (numResults > 0) {
            SimVar.GetSimVarArrayValues(this._batch, values => {
                this._results = values.map(e => e[0]);
                this._finishUpdate(resolve);
            }, this._simVarSearchInstanceKey);
        } else {
            this._results = [];
            this._finishUpdate(resolve);
        }
    }

    /**
     * Initiates a search update. This will update the contents of the results array. Returns a Promise that resolves when the update is
     * finished. A new update will not be initiated if an existing update is pending; instead, the returned Promise will resolve when the
     * existing pending update has finished. If this search request is already closed, then this method will return a rejected Promise.
     * @returns {Promise} a Promise that resolves when the new update, or the pending update if one already exists, has finished, or
     *                    rejects if this search request is closed.
     */
    update() {
        if (this._isClosing || this._isClosed) {
            return Promise.reject(new Error("ICAO search request is closed."));
        }

        return new Promise(async resolve => {
            if (this._isLocked) {
                this._updateQueue.push(resolve);
                return;
            }

            this._isLocked = true;
            let center = this.center.copy();
            let radius = this.radius.asUnit(WT_Unit.NMILE);
            let searchLimit = this.searchLimit;
            await Promise.all([
                SimVar.SetSimVarValue(`C:fs9gps:${this._keys.setLatitudeKey}`, "degree latitude", center.lat, this._simVarSearchInstanceKey),
                SimVar.SetSimVarValue(`C:fs9gps:${this._keys.setLongitudeKey}`, "degree longitude", center.long, this._simVarSearchInstanceKey),
            ]);

            // ???????????
            for (let i = 0; i < 4; i++) {
                SimVar.SetSimVarValue(`C:fs9gps:${this._keys.setRangeKey}`, "nautical miles", radius, this._simVarSearchInstanceKey);
                await SimVar.SetSimVarValue(`C:fs9gps:${this._keys.setSearchLimitKey}`, "number", searchLimit, this._simVarSearchInstanceKey);
            }

            this._retrieveResults(resolve);
        });
    }

    /**
     * Closes this search request, freeing up resources associated with it. Pending updates will complete normally. However, no further
     * updates or search parameter changes may be issued once the request is closed.
     */
    close() {
        if (this._isClosing || this._isClosed) {
            return;
        }

        this._isClosing = true;
        if (this._isLocked) {
            return;
        }
        this._doClose();
    }
}