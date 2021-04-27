/**
 * An ordered list of the geographically closest waypoints to the player airplane.
 * @template {WT_ICAOWaypoint} T
 */
class WT_NearestWaypointList {
    /**
     * @param {WT_PlayerAirplane} airplane - the player airplane.
     * @param {(icaos:String[]) => Promise<T[]>} waypointFactoryMethod - the WT_ICAOWaypointFactory method to use to
     *                                                                   create waypoints from ICAO strings.
     * @param {WT_ICAOSearcher} waypointSearcher - the ICAO waypoint searcher to use to search for waypoints.
     */
    constructor(airplane, waypointFactoryMethod, waypointSearcher) {
        this._airplane = airplane;
        this._waypointFactoryMethod = waypointFactoryMethod;
        this._waypointSearcher = waypointSearcher;

        this._searchRequest = null;

        this._center = new WT_GeoPoint(0, 0);
        this._radius = WT_Unit.NMILE.createNumber(0);

        /**
         * @type {WT_SortedArray<T>}
         */
        this._waypoints = new WT_SortedArray(this._airportArrayComparator.bind(this));
        this._waypointsReadOnly = new WT_ReadOnlyArray(this._waypoints.array);

        this._optsManager = new WT_OptionsManager(this, WT_NearestWaypointList.OPTION_DEFS);

        /**
         * @type {((source:WT_NearestWaypointList<T>) => void)[]}
         */
        this._listeners = [];
    }

    /**
     *
     * @param {T} a
     * @param {T} b
     * @returns {Number}
     */
    _airportArrayComparator(a, b) {
        return a.location.distance(this._center) - b.location.distance(this._center);
    }

    /**
     * An array of the waypoints in this list. The waypoints are ordered from closest to farthest from the player
     * airplane.
     * @readonly
     * @type {WT_ReadOnlyArray<T>}
     */
    get waypoints() {
        return this._waypointsReadOnly;
    }

    /**
     * @type {WT_NumberUnit}
     */
    get radius() {
        return this._radius.readonly();
    }

    set radius(radius) {
        this._radius.set(radius);
    }

    /**
     * Adds a listener to this list. The listener will be called whenever the contents of this list change.
     * @param {(source:WT_NearestWaypointList<T>) => void} listener - the listener to add.
     */
    addListener(listener) {
        this._listeners.push(listener);
    }

    /**
     * Removes a previously added listener from this list.
     * @param {(source:WT_NearestWaypointList<T>) => void} listener - the listener to remove.
     */
    removeListener(listener) {
        let index = this._listeners.indexOf(listener);
        if (index >= 0) {
            this._listeners.splice(index, 1);
        }
    }

    _notifyListeners() {
        this._listeners.forEach(listener => listener(this));
    }

    async _searchForICAOs() {
        let center = this._airplane.navigation.position(this._center);
        if (!this._searchRequest) {
            this._searchRequest = this._waypointSearcher.openRequest(center, this.radius, this.searchLimit);
        } else {
            await this._searchRequest.setParameters(center, this.radius, this.searchLimit);
        }

        await this._searchRequest.update();
        return this._searchRequest.results;
    }

    /**
     * Updates this list with the closest waypoints based on the player airplane's current position.
     * @returns {Promise<void>} a Promise which is fulfilled when the update completes.
     */
    async update() {
        let icaos = await this._searchForICAOs();
        let waypoints = await this._waypointFactoryMethod(icaos);

        let didChange = false;
        let oldWaypoints;
        if (waypoints.length === this._waypoints.array.length) {
            oldWaypoints = this._waypoints.array.slice();
        } else {
            didChange = true;
        }

        this._waypoints.clear();
        waypoints.forEach(airport => this._waypoints.insert(airport), this);

        if (!didChange) {
            didChange = oldWaypoints.some((waypoint, index) => !waypoint.equals(this._waypoints.get(index)));
        }
        if (didChange) {
            this._notifyListeners();
        }
    }
}
WT_NearestWaypointList.OPTION_DEFS = {
    searchLimit: {default: 200, auto: true},
    radius: {default: WT_Unit.NMILE.createNumber(200)}
};