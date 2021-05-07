/**
 * This class implements the Navigation data bar (also referred to as navigation status bar) found on Garmin units.
 * It has support for an arbitrary number of data bar fields.
 */
class WT_G3x5_NavDataBarModel {
    /**
     * @param {WT_G3x5_BaseInstrument} instrument
     */
    constructor(instrument) {
        this._instrument = instrument;

        this._dataFieldCount = 0;
        this._dataFields = [];

        this._initInfos();
    }

    _initInfos() {
        let instrument = this._instrument;
        let flightPlanManager = this._instrument.flightPlanManagerWT;
        let airplane = this._instrument.airplane;

        this._infos = {
            BRG: new WT_G3x5_NavDataInfoNumber(WT_G3x5_NavDataBarModel.INFO_DESCRIPTION.BRG, new WT_NavAngleModelSimVar(true, {
                updateLocation(location) {
                    airplane.navigation.position(location);
                }
            }, "PLANE HEADING DEGREES MAGNETIC", "degree")),
            DIS: new WT_G3x5_NavDataInfoNumber(WT_G3x5_NavDataBarModel.INFO_DESCRIPTION.DIS, new WT_NumberUnitModelAutoUpdated(WT_Unit.NMILE, {
                updateValue(value) {
                    let result;
                    if (flightPlanManager.directTo.isActive()) {
                        result = flightPlanManager.distanceToDirectTo(true, value);
                    } else {
                        result = flightPlanManager.distanceToActiveLegFix(true, value);
                    }
                    if (!result) {
                        value.set(NaN);
                    }
                }
            })),
            DTG: new WT_G3x5_NavDataInfoNumber(WT_G3x5_NavDataBarModel.INFO_DESCRIPTION.DTG, new WT_NumberUnitModelAutoUpdated(WT_Unit.NMILE, {
                updateValue(value) {
                    let result = flightPlanManager.distanceToDestination(true, value);
                    if (!result) {
                        value.set(NaN);
                    }
                }
            })),
            DTK: new WT_G3x5_NavDataInfoNumber(WT_G3x5_NavDataBarModel.INFO_DESCRIPTION.DTK, new WT_NavAngleModelSimVar(true, {
                updateLocation(location) {
                    airplane.navigation.position(location);
                }
            }, "GPS WP DESIRED TRACK", "degree")),
            END: new WT_G3x5_NavDataInfoNumber(WT_G3x5_NavDataBarModel.INFO_DESCRIPTION.END, new WT_NumberUnitModelAutoUpdated(WT_Unit.HOUR, {
                tempGal: new WT_NumberUnit(0, WT_Unit.GALLON),
                tempGPH: new WT_NumberUnit(0, WT_Unit.GPH),
                updateValue(value) {
                    let fuelRemaining = airplane.engineering.fuelOnboard(this.tempGal);
                    let fuelFlow = airplane.engineering.fuelFlowTotal(this.tempGPH);
                    if (fuelFlow.number == 0) {
                        value.set(0);
                    } else {
                        value.set(fuelRemaining.number / fuelFlow.number);
                    }
                }
            })),
            ENR: new WT_G3x5_NavDataInfoNumber(WT_G3x5_NavDataBarModel.INFO_DESCRIPTION.ENR, new WT_NumberUnitModelAutoUpdated(WT_Unit.SECOND, {
                updateValue(value) {
                    let result = flightPlanManager.timeToDestination(true, value);
                    if (!result) {
                        value.set(NaN);
                    }
                }
            })),
            ETA: new WT_G3x5_NavDataInfoTime(WT_G3x5_NavDataBarModel.INFO_DESCRIPTION.ETA, new WT_G3x5_TimeModel(new WT_TimeModelAutoUpdated("", {
                _tempSec: WT_Unit.SECOND.createNumber(0),
                updateTime(time) {
                    let ete;
                    if (flightPlanManager.directTo.isActive()) {
                        ete = flightPlanManager.timeToDirectTo(true, this._tempSec);
                    } else {
                        ete = flightPlanManager.timeToActiveLegFix(true, this._tempSec);
                    }
                    if (ete) {
                        time.set(instrument.time);
                        time.add(ete);
                    } else {
                        time.set(NaN);
                    }
                }
            }), instrument.avionicsSystemSettingModel.timeFormatSetting, instrument.avionicsSystemSettingModel.timeLocalOffsetSetting)),
            ETE: new WT_G3x5_NavDataInfoNumber(WT_G3x5_NavDataBarModel.INFO_DESCRIPTION.ETE, new WT_NumberUnitModelAutoUpdated(WT_Unit.SECOND, {
                updateValue(value) {
                    let result;
                    if (flightPlanManager.directTo.isActive()) {
                        result = flightPlanManager.timeToDirectTo(true, value);
                    } else {
                        result = flightPlanManager.timeToActiveLegFix(true, value);
                    }
                    if (!result) {
                        value.set(NaN);
                    }
                }
            })),
            FOB: new WT_G3x5_NavDataInfoNumber(WT_G3x5_NavDataBarModel.INFO_DESCRIPTION.FOB, new WT_NumberUnitModelSimVar(WT_Unit.GALLON, "FUEL TOTAL QUANTITY", "gallons")),
            FOD: new WT_G3x5_NavDataInfoNumber(WT_G3x5_NavDataBarModel.INFO_DESCRIPTION.FOD, new WT_NumberUnitModelAutoUpdated(WT_Unit.GALLON, {
                tempGal: new WT_NumberUnit(0, WT_Unit.GALLON),
                tempGPH: new WT_NumberUnit(0, WT_Unit.GPH),
                updateValue(value) {
                    let fuelRemaining = airplane.engineering.fuelOnboard(this.tempGal);
                    let fuelFlow = airplane.engineering.fuelFlowTotal(this.tempGPH);
                    let enr = SimVar.GetSimVarValue("GPS ETE", "seconds") / 3600;
                    value.set(fuelRemaining.number - enr * fuelFlow.number);
                }
            })),
            GS: new WT_G3x5_NavDataInfoNumber(WT_G3x5_NavDataBarModel.INFO_DESCRIPTION.GS, new WT_NumberUnitModelSimVar(WT_Unit.KNOT, "GPS GROUND SPEED", "knots")),
            LDG: new WT_G3x5_NavDataInfoTime(WT_G3x5_NavDataBarModel.INFO_DESCRIPTION.LDG, new WT_G3x5_TimeModel(new WT_TimeModelAutoUpdated("", {
                _tempSec: WT_Unit.SECOND.createNumber(0),
                updateTime(time) {
                    let enr = flightPlanManager.timeToDestination(true, this._tempSec);
                    if (enr) {
                        time.set(instrument.time);
                        time.add(enr);
                    } else {
                        time.set(NaN);
                    }
                }
            }), instrument.avionicsSystemSettingModel.timeFormatSetting, instrument.avionicsSystemSettingModel.timeLocalOffsetSetting)),
            TAS: new WT_G3x5_NavDataInfoNumber(WT_G3x5_NavDataBarModel.INFO_DESCRIPTION.TAS, new WT_NumberUnitModelSimVar(WT_Unit.KNOT, "AIRSPEED TRUE", "knots")),
            TKE: new WT_G3x5_NavDataInfoNumber(WT_G3x5_NavDataBarModel.INFO_DESCRIPTION.TKE, new WT_NumberUnitModelSimVar(WT_Unit.DEGREE, "GPS WP TRACK ANGLE ERROR", "degree")),
            TRK: new WT_G3x5_NavDataInfoNumber(WT_G3x5_NavDataBarModel.INFO_DESCRIPTION.TRK, new WT_NavAngleModelSimVar(true, {
                updateLocation(location) {
                    airplane.navigation.position(location);
                }
            }, "GPS GROUND MAGNETIC TRACK", "degree")),
            XTK: new WT_G3x5_NavDataInfoNumber(WT_G3x5_NavDataBarModel.INFO_DESCRIPTION.XTK, new WT_NumberUnitModelSimVar(WT_Unit.METER, "GPS WP CROSS TRK", "meters"))
        };
    }

    /**
     * @readonly
     * @property {Number} dataFieldCount - the number of data fields this nav data bar contains.
     * @type {Number}
     */
    get dataFieldCount() {
        return this._dataFieldCount;
    }

    /**
     * Gets an array of all of this nav data bar's data info objects.
     * @returns {WT_G3x5_NavDataInfo[]} an array of all of this nav data bar's data info objects.
     */
    getAllNavDataInfo() {
        return Object.getOwnPropertyNames(this._infos).map(id => this._infos[id]);
    }

    /**
     * Gets one of this nav data bar's nav data info objects by its ID.
     * @param {String} id - a string ID.
     * @returns {WT_G3x5_NavDataInfo} the nav data info object matching the supplied ID.
     */
    getNavDataInfo(id) {
        return this._infos[id];
    }

    /**
     * Sets the number of data fields this nav data bar contains. If the count is set to a value less than the current number
     * of data fields, the excess fields will be deleted, beginning with those located at the highest indexes.
     * @param {Number} count - the new count.
     */
    setDataFieldCount(count) {
        this._dataFieldCount = count;
        if (count > this._dataFields.length) {
            this._dataFields.splice(count, this._dataFields.length - count);
        }
    }

    /**
     * Gets the nav data info object assigned to a data field.
     * @param {Number} index - the index of the data field.
     * @returns {WT_G3x5_NavDataInfo} a nava data info object.
     */
    getDataFieldInfo(index) {
        return this._dataFields[index];
    }

    /**
     * Assigns a nav data info object to a data field.
     * @param {Number} index - the index of the data field.
     * @param {WT_G3x5_NavDataInfo} info - the nav data info object to assign.
     */
    setDataFieldInfo(index, info) {
        if (index < 0 || index >= this._dataFieldCount) {
            return;
        }

        this._dataFields[index] = info;
    }
}
WT_G3x5_NavDataBarModel.INFO_DESCRIPTION = {
    BRG: {shortName: "BRG", longName: "Bearing"},
    DIS: {shortName: "DIS", longName: "Distance to Next Waypoint"},
    DTG: {shortName: "DTG", longName: "Distance to Destination"},
    DTK: {shortName: "DTK", longName: "Desired Track"},
    END: {shortName: "END", longName: "Endurance"},
    ENR: {shortName: "ENR", longName: "ETE To Destination"},
    ETA: {shortName: "ETA", longName: "Estimated Time of Arrival"},
    ETE: {shortName: "ETE", longName: "Estimated Time Enroute"},
    FOB: {shortName: "FOB", longName: "Fuel Onboard"},
    FOD: {shortName: "FOD", longName: "Fuel over Destination"},
    GS: {shortName: "GS", longName: "Groundspeed"},
    LDG: {shortName: "LDG", longName: "ETA at Final Destination"},
    TAS: {shortName: "TAS", longName: "True Airspeed"},
    TKE: {shortName: "TKE", longName: "Track Angle Error"},
    TRK: {shortName: "TRK", longName: "Track"},
    XTK: {shortName: "XTK", longName: "Cross-track Error"},
};

class WT_G3x5_NavDataBarView extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_NavDataBarView.TEMPLATE.content.cloneNode(true));

        this._fieldViewRecycler = new WT_G3x5_NavDataInfoViewRecycler(this);
        /**
         * @type {WT_G3x5_NavDataInfoView[]}
         */
        this._fieldViews = [];

        this._model = null;

        this._isInit = false;
    }

    /**
     * @readonly
     * @property {WT_NavDataBar} model
     * @type {WT_G3x5_NavDataBarModel}
     */
    get model() {
        return this._model;
    }

    _initFormatters() {
        let bearingOpts = {
            precision: 1,
            unitSpaceBefore: false
        };
        let bearingFormatter = new WT_NumberFormatter(bearingOpts);

        let distanceOpts = {
            precision: 0.1,
            maxDigits: 3,
            unitSpaceBefore: false,
            unitCaps: true
        }
        let distanceFormatter = new WT_NumberFormatter(distanceOpts);

        let volumeOpts = {
            precision: 0.1,
            maxDigits: 3,
            unitSpaceBefore: false,
            unitCaps: true
        }
        let volumeFormatter = new WT_NumberFormatter(volumeOpts);

        let speedOpts = {
            precision: 1,
            unitSpaceBefore: false,
            unitCaps: true
        }
        let speedFormatter = new WT_NumberFormatter(speedOpts);

        let timeOpts = {
            timeFormat: WT_TimeFormatter.Format.HH_MM_OR_MM_SS,
            delim: WT_TimeFormatter.Delim.COLON_OR_CROSS
        }
        let durationFormatter = new WT_TimeFormatter(timeOpts);

        this._formatters = {
            BRG: new WT_G3x5_NavDataInfoViewDegreeFormatter(bearingFormatter),
            DIS: new WT_G3x5_NavDataInfoViewNumberFormatter(distanceFormatter),
            DTG: new WT_G3x5_NavDataInfoViewNumberFormatter(distanceFormatter),
            DTK: new WT_G3x5_NavDataInfoViewDegreeFormatter(bearingFormatter),
            END: new WT_G3x5_NavDataInfoViewDurationFormatter(durationFormatter, "__:__"),
            ENR: new WT_G3x5_NavDataInfoViewDurationFormatter(durationFormatter, "__:__"),
            ETA: new WT_G3x5_NavDataInfoViewTimeFormatter(),
            ETE: new WT_G3x5_NavDataInfoViewDurationFormatter(durationFormatter, "__:__"),
            FOB: new WT_G3x5_NavDataInfoViewNumberFormatter(volumeFormatter),
            FOD: new WT_G3x5_NavDataInfoViewNumberFormatter(volumeFormatter),
            GS: new WT_G3x5_NavDataInfoViewNumberFormatter(speedFormatter),
            LDG: new WT_G3x5_NavDataInfoViewTimeFormatter(),
            TAS: new WT_G3x5_NavDataInfoViewNumberFormatter(speedFormatter),
            TKE: new WT_G3x5_NavDataInfoViewDegreeFormatter(bearingFormatter),
            TRK: new WT_G3x5_NavDataInfoViewDegreeFormatter(bearingFormatter),
            XTK: new WT_G3x5_NavDataInfoViewNumberFormatter(distanceFormatter),
        };
    }

    _defineChildren() {
        this._fields = this.shadowRoot.querySelector(`#fields`);
    }

    connectedCallback() {
        this._initFormatters();
        this._defineChildren();
        this._updateModel();
        this._isInit = true;
    }

    _updateModel() {
        this._fieldViewRecycler.recycleAll();
        this._fieldViews = [];

        if (!this.model) {
            return;
        }

        for (let i = 0; i < this.model.dataFieldCount; i++) {
            this._fieldViews.push(this._fieldViewRecycler.request());
        }
    }

    /**
     * Sets the nav data bar model for this view.
     * @param {WT_G3x5_NavDataBarModel} model - a nav data bar model.
     */
    setModel(model) {
        if (this.model === model) {
            return;
        }

        this._model = model;
        if (this._isInit) {
            this._updateModel();
        }
    }

    update() {
        for (let i = 0; i < this._fieldViews.length; i++) {
            let navDataInfo = this.model.getDataFieldInfo(i);
            this._fieldViews[i].update(navDataInfo, this._formatters[navDataInfo.shortName]);
        }
    }
}
WT_G3x5_NavDataBarView.NAME = "wt-navdatabar-view";
WT_G3x5_NavDataBarView.TEMPLATE = document.createElement("template");
WT_G3x5_NavDataBarView.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            width: 100%;
            height: 100%;
            text-align: left;
        }

        #fields {
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: auto;
            grid-template-columns: repeat(auto-fit, minmax(10px, 1fr));
        }
    </style>
    <slot name="fields" id="fields"></slot>
`;

customElements.define(WT_G3x5_NavDataBarView.NAME, WT_G3x5_NavDataBarView);

class WT_G3x5_NavDataBarSettingModel extends WT_DataStoreSettingModel {
    constructor(id, navDataBarModel) {
        super(id);

        this._navDataBarModel = navDataBarModel;
    }

    /**
     * The nav data bar model associated with this setting model.
     * @readonly
     * @type {WT_G3x5_NavDataBarModel}
     */
    get navDataBarModel() {
        return this._navDataBarModel;
    }

    /**
     * Creates and adds a data field setting to this setting model. The index of the setting is automatically set to
     * the next available index based on the number of settings already added to this model.
     * @param {String} defaultValue - the default value of the setting to add.
     * @returns {WT_G3x5_NavDataBarFieldSetting} the setting that was added.
     */
    addDataFieldSetting(defaultValue) {
        let setting = new WT_G3x5_NavDataBarFieldSetting(this, this._settings.length, defaultValue);
        this.addSetting(setting);
        return setting;
    }

    /**
     * Gets the setting for the data field at the specified index.
     * @param {Number} index - the index of the data field.
     * @returns {WT_G3x5_NavDataBarFieldSetting} a data field setting.
     */
    getDataFieldSetting(index) {
        return this._settings[index];
    }
}

class WT_G3x5_NavDataBarSetting extends WT_DataStoreSetting {
    /**
     * @param {WT_G3x5_NavDataBarSettingModel} model - the model with which to associate the new setting.
     * @param {String} key - the data store key of the new setting.
     * @param {*} [defaultValue] - the value to which the new setting should default if it is not persistent or if a value cannot be retrieved
     *                             from the data store.
     * @param {Boolean} [autoUpdate] - whether the new setting should automatically call its update() method whenever its value
     *                                 changes. True by default.
     * @param {Boolean} [isPersistent] - whether the new setting persists across sessions.
     */
    constructor(model, key, defaultValue = 0, autoUpdate = true, isPersistent = false) {
        super(model, key, defaultValue, autoUpdate, isPersistent);
    }

    /**
     * The nav data bar model associated with this setting.
     * @readonly
     * @type {WT_G3x5_NavDataBarModel}
     */
    get navDataBarModel() {
        return this._model.navDataBarModel;
    }
}

class WT_G3x5_NavDataBarFieldSetting extends WT_G3x5_NavDataBarSetting {
    constructor(model, index, defaultValue, autoUpdate = true, isPersistent = true, keyRoot = WT_G3x5_NavDataBarFieldSetting.KEY_ROOT) {
        super(model, `${keyRoot}_${index}`, defaultValue, autoUpdate, isPersistent);

        this._index = index;
    }

    /**
     * The index of the nav data field this setting controls.
     * @readonly
     * @type {Number}
     */
    get index() {
        return this._index;
    }

    update() {
        this.navDataBarModel.setDataFieldInfo(this._index, this.navDataBarModel.getNavDataInfo(this.getValue()));
    }
}
WT_G3x5_NavDataBarFieldSetting.KEY_ROOT = "WT_NavDataBar_FieldAssignment";