/**
 * @template {WT_ICAOWaypoint} T
 */
class WT_NearestWaypointList {
    /**
     * @param {WT_PlayerAirplane} airplane
     * @param {(icaos:String[]) => Promise<T[]>} waypointFactoryMethod
     * @param {WT_ICAOSearcher} waypointSearcher
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

    async update() {
        let icaos = await this._searchForICAOs();
        let waypoints = await this._waypointFactoryMethod(icaos);
        this._waypoints.clear();
        waypoints.forEach(airport => this._waypoints.insert(airport), this);
    }
}
WT_NearestWaypointList.OPTION_DEFS = {
    searchLimit: {default: 200, auto: true},
    radius: {default: WT_Unit.NMILE.createNumber(200)}
};