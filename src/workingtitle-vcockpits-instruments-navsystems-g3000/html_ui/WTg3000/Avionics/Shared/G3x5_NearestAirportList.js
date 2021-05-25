class WT_G3x5_NearestAirportList {
    /**
     * @param {WT_PlayerAirplane} airplane
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory
     * @param {WT_ICAOSearcher} airportSearcher
     */
    constructor(airplane, icaoWaypointFactory, airportSearcher) {
        this._list = new WT_NearestWaypointList(airplane, icaoWaypointFactory.getAirports.bind(icaoWaypointFactory), airportSearcher);

        /**
         * @type {WT_Airport[]}
         */
        this._airports = [];
        this._airportsReadOnly = new WT_ReadOnlyArray(this._airports);

        this._optsManager = new WT_OptionsManager(this, WT_G3x5_NearestAirportList.OPTION_DEFS);

        /**
         * @type {((source:WT_G3x5_NearestAirportList) => void)[]}
         */
         this._listeners = [];

        this._initSettingModel();
    }

    _initSettingModel() {
        this._settingModel = new WT_DataStoreSettingModel(WT_G3x5_NearestAirportList.SETTING_MODEL_ID);
        this._settingModel.addSetting(this._runwaySurfaceSetting = new WT_G3x5_NearestAirportRunwaySurfaceSetting(this._settingModel));
        this._settingModel.addSetting(this._runwayLengthSetting = new WT_G3x5_NearestAirportRunwayLengthSetting(this._settingModel));

        this._settingModel.init();
    }

    /**
     *
     * @param {WT_Airport} a
     * @param {WT_Airport} b
     * @returns {Number}
     */
    _airportArrayComparator(a, b) {
        return a.location.distance(this._center) - b.location.distance(this._center);
    }

    /**
     * @readonly
     * @type {WT_ReadOnlyArray<WT_Airport>}
     */
    get waypoints() {
        return this._airportsReadOnly;
    }

    /**
     * @readonly
     * @type {WT_ReadOnlyArray<WT_Airport>}
     */
    get airports() {
        return this._airportsReadOnly;
    }

    /**
     * @type {WT_NumberUnit}
     */
    get radius() {
        return this._list.radius;
    }

    set radius(radius) {
        this._list.radius = radius;
    }

    /**
     * @readonly
     * @type {WT_G3x5_NearestAirportRunwaySurfaceSetting}
     */
    get runwaySurfaceSetting() {
        return this._runwaySurfaceSetting;
    }

    /**
     * @readonly
     * @type {WT_G3x5_NearestAirportRunwayLengthSetting}
     */
    get runwayLengthSetting() {
        return this._runwayLengthSetting;
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

    _getRunwaySurfaces(runwaySurfaceMode) {
        return WT_G3x5_NearestAirportList.RUNWAY_SURFACES[runwaySurfaceMode];
    }

    _notifyListeners() {
        this._listeners.forEach(listener => listener(this));
    }

    /**
     *
     * @param {WT_Airport} airport
     * @param {WT_Runway.Surface[]} runwaySurfaces
     * @param {WT_NumberUnit} minRunwayLength
     * @returns {Boolean}
     */
    _filterAirport(airport, runwaySurfaces, minRunwayLength) {
        let longestRunway = airport.runways.longest();
        if (!longestRunway || longestRunway.length.compare(minRunwayLength) < 0) {
            return false;
        }

        return airport.runways.array.some(runway => runwaySurfaces.indexOf(runway.surface) >= 0 && runway.length.compare(minRunwayLength) >= 0);
    }

    async update() {
        await this._list.update();

        let airports = this._list.waypoints;
        let oldAirports = this._airports.splice(0, this._airports.length);
        let runwaySurfaces = this._getRunwaySurfaces(this.runwaySurfaceSetting.getValue());
        let minRunwayLength = this.runwayLengthSetting.getLength();
        for (let i = 0; this._airports.length < this.searchLimit && i < airports.length; i++) {
            let airport = airports.get(i);
            if (this._filterAirport(airport, runwaySurfaces, minRunwayLength)) {
                this._airports.push(airport);
            }
        }

        if (oldAirports.length !== this._airports.length || oldAirports.some((airport, index) => !airport.equals(this._airports[index]))) {
            this._notifyListeners();
        }
    }
}
WT_G3x5_NearestAirportList.SETTING_MODEL_ID = "WT_NearestAirport";
WT_G3x5_NearestAirportList.RUNWAY_SURFACES = [
    Object.values(WT_Runway.Surface),
    [WT_Runway.Surface.CONCRETE, WT_Runway.Surface.ASPHALT],
    [WT_Runway.Surface.GRASS, WT_Runway.Surface.DIRT, WT_Runway.Surface.TURF, WT_Runway.Surface.GRAVEL]
];
WT_G3x5_NearestAirportList.OPTION_DEFS = {
    searchLimit: {default: 25, auto: true},
    radius: {default: WT_Unit.NMILE.createNumber(200)}
};

class WT_G3x5_NearestAirportRunwaySurfaceSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = WT_G3x5_NearestAirportRunwaySurfaceSetting.DEFAULT, key = WT_G3x5_NearestAirportRunwaySurfaceSetting.KEY) {
        super(model, key, defaultValue, false, true);
    }
}
WT_G3x5_NearestAirportRunwaySurfaceSetting.KEY = "WT_NearestAirport_RunwaySurface";
/**
 * @enum {Number}
 */
WT_G3x5_NearestAirportRunwaySurfaceSetting.Mode = {
    ALL: 0,
    HARD_ONLY: 1,
    SOFT_ONLY: 2
}
WT_G3x5_NearestAirportRunwaySurfaceSetting.DEFAULT = WT_G3x5_NearestAirportRunwaySurfaceSetting.Mode.HARD_ONLY;

class WT_G3x5_NearestAirportRunwayLengthSetting extends WT_DataStoreSetting {
    constructor(model, defaultLength = WT_G3x5_NearestAirportRunwayLengthSetting.DEFAULT, key = WT_G3x5_NearestAirportRunwayLengthSetting.KEY) {
        super(model, key, defaultLength.asUnit(WT_Unit.FOOT), false, true);
    }

    /**
     *
     * @param {WT_NumberUnit} [reference]
     */
    getLength(reference) {
        let value = this.getValue();
        return reference ? reference.set(value, WT_Unit.FOOT) : WT_Unit.FOOT.createNumber(value);
    }

    /**
     *
     * @param {WT_NumberUnit} length
     */
    setLength(length) {
        this.setValue(length.asUnit(WT_Unit.FOOT));
    }
}
WT_G3x5_NearestAirportRunwayLengthSetting.KEY = "WT_NearestAirport_RunwayLength";
WT_G3x5_NearestAirportRunwayLengthSetting.DEFAULT = WT_Unit.FOOT.createNumber(3000);