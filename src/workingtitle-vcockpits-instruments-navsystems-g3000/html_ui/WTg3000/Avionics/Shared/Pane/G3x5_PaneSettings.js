class WT_G3x5_PaneSettings {
    constructor(paneID) {
        this._paneID = paneID;

        this._initSettings();
    }

    _initDisplaySetting() {
        this._settingModel.addSetting(this._display = new WT_G3x5_PaneDisplaySetting(this._settingModel));
    }

    _initControlSetting() {
        this._settingModel.addSetting(this._control = new WT_G3x5_PaneControlSetting(this._settingModel));
    }

    _initNavMapInsetSettings() {
        this._settingModel.addSetting(this._navMapInset = new WT_G3x5_NavMapDisplayInsetSetting(this._settingModel));
        this._settingModel.addSetting(this._navMapFlightPlanTextInsetDistance = new WT_G3x5_NavMapDisplayFlightPlanTextDistanceSetting(this._settingModel));
    }

    _initFlightPlanSetting() {
        this._settingModel.addSetting(this._flightPlan = new WT_G3x5_FlightPlanDisplayFlightPlanSetting(this._settingModel));
    }

    _initProcedureSetting() {
        this._settingModel.addSetting(this._procedure = new WT_G3x5_ProcedureDisplayProcedureSetting(this._settingModel));
    }

    _initChartIDSetting() {
        this._settingModel.addSetting(this._chartID = new WT_G3x5_ChartsChartIDSetting(this._settingModel));
    }

    _initSettings() {
        this._settingModel = new WT_DataStoreSettingModel(this.paneID);

        this._initDisplaySetting();
        this._initControlSetting();

        this._initNavMapInsetSettings();
        this._initFlightPlanSetting();
        this._initProcedureSetting();
        this._initChartIDSetting();
    }

    /**
     * @readonly
     * @type {String}
     */
    get paneID() {
        return this._paneID;
    }

    /**
     * @readonly
     * @type {WT_G3x5_PaneDisplaySetting}
     */
    get display() {
        return this._display;
    }

    /**
     * @readonly
     * @type {WT_G3x5_PaneControlSetting}
     */
    get control() {
        return this._control;
    }

    /**
     * @readonly
     * @type {WT_G3x5_NavMapDisplayInsetSetting}
     */
    get navMapInset() {
        return this._navMapInset;
    }

    /**
     * @readonly
     * @type {WT_G3x5_NavMapDisplayFlightPlanTextDistanceSetting}
     */
    get navMapFlightPlanTextInsetDistance() {
        return this._navMapFlightPlanTextInsetDistance;
    }

    /**
     * @readonly
     * @type {WT_G3x5_FlightPlanDisplayFlightPlanSetting}
     */
    get flightPlan() {
        return this._flightPlan;
    }

    /**
     * @readonly
     * @type {WT_G3x5_ProcedureDisplayProcedureSetting}
     */
    get procedure() {
        return this._procedure;
    }

    /**
     * @readonly
     * @type {WT_G3x5_ChartsChartIDSetting}
     */
    get chartID() {
        return this._chartID;
    }

    update() {
        this._settingModel.update();
    }
}

class WT_G3x5_PaneControlSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = 0, autoUpdate = false, isPersistent = false, key = WT_G3x5_PaneControlSetting.KEY) {
        super(model, key, defaultValue, autoUpdate, isPersistent);
    }

    hasControl(touchscreen, all = false) {
        let value = this.getValue();
        if (all) {
            return (value & touchscreen) === touchscreen;
        } else {
            return (value & touchscreen) !== 0;
        }
    }

    addControl(touchscreen) {
        this.setValue(this.getValue() | touchscreen);
    }

    removeControl(touchscreen) {
        this.setValue(this.getValue() & (~touchscreen));
    }
}
WT_G3x5_PaneControlSetting.KEY = "WT_Pane_Control";
/**
 * @enum {Number}
 */
WT_G3x5_PaneControlSetting.Touchscreen = {
    LEFT: 1,
    RIGHT: 1 << 1
}

class WT_G3x5_PaneDisplaySetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = WT_G3x5_PaneDisplaySetting.Mode.NAVMAP, isPersistent = false, key = WT_G3x5_PaneDisplaySetting.KEY) {
        super(model, key, defaultValue, true, isPersistent);

        this._mode = defaultValue;
    }

    /**
     * @readonly
     * @type {WT_G3x5_PaneDisplaySetting.Mode}
     */
    get mode() {
        return this._mode;
    }

    update() {
        this._mode = this.getValue();
    }
}
WT_G3x5_PaneDisplaySetting.KEY = "WT_Pane_Display";
/**
 * @enum {Number}
 */
WT_G3x5_PaneDisplaySetting.Mode = {
    NAVMAP: 0,
    TRAFFIC: 1,
    WEATHER: 2,
    FLIGHT_PLAN: 3,
    PROCEDURE: 4,
    CHARTS: 5,
    WAYPOINT_INFO: 6,
    NRST_WAYPOINT: 7
}