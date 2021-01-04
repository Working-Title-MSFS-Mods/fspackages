/**
 * This class implements the Navigational data bar (also referred to as navigation status bar) found on Garmin units.
 * It has support for an arbitrary number of data bar fields; outside code or subclasses define the exact number
 * by setting the length of the .dataFields array. Data fields are set using data store. Static methods are
 * provided to facilitate an interface between data store, WT_NavDataBar, and controllers.
 */
class WT_NavDataBar {
    /**
     * @param {WT_FlightPlanManager} flightPlanManager
     */
    constructor(flightPlanManager) {
        this._fpm = flightPlanManager;

        this._dataFieldCount = 0;
        this._dataFields = [];

        this._initInfos();
    }

    _initInfos() {
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
        let timeFormatter = new WT_TimeFormatter(timeOpts);

        let utcOpts = {
            timeFormat: WT_TimeFormatter.Format.HH_MM
        }
        let utcFormatter = new WT_TimeFormatter(utcOpts);

        let flightPlanManager = this._fpm;
        let airplaneModel = WT_PlayerAirplane.INSTANCE;

        this._infos = {
            BRG: new WT_NavDataInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION.BRG, new WT_NumberUnit(0, WT_Unit.DEGREE), "PLANE HEADING DEGREES MAGNETIC", "degree", bearingFormatter),
            DIS: new WT_NavDataInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION.DIS, new WT_NumberUnit(0, WT_Unit.NMILE), "GPS WP DISTANCE", "nautical miles", distanceFormatter),
            DTG: new WT_NavDataInfo(WT_NavDataBar.INFO_DESCRIPTION.DTG, new WT_NumberUnit(0, WT_Unit.NMILE), {
                    temp: new WT_NumberUnit(0, WT_Unit.NMILE),
                    getCurrentValue: function() {
                        return flightPlanManager.distanceToDestination(true, this.temp).number;
                    }
                }, distanceFormatter),

            DTK: new WT_NavDataInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION.DTK, new WT_NumberUnit(0, WT_Unit.DEGREE), "GPS WP DESIRED TRACK", "degree", bearingFormatter),
            END: new WT_NavDataInfo(WT_NavDataBar.INFO_DESCRIPTION.END, new WT_NumberUnit(0, WT_Unit.HOUR), {
                    tempGal: new WT_NumberUnit(0, WT_Unit.GALLON),
                    tempGPH: new WT_NumberUnit(0, WT_Unit.GPH),
                    getCurrentValue: function() {
                        let fuelRemaining = airplaneModel.fuelOnboard(this.tempGal);
                        let fuelFlow = airplaneModel.fuelFlowTotal(this.tempGPH);
                        if (fuelFlow.number == 0) {
                            return 0;
                        } else {
                            return fuelRemaining.number / fuelFlow.number;
                        }
                    }
                }, timeFormatter, {showDefault: number => number == 0 ? "__:__" : null}),

            ENR: new WT_NavDataInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION.ENR, new WT_NumberUnit(0, WT_Unit.SECOND),"GPS ETE", "seconds", timeFormatter, {showDefault: number => number == 0 ? "__:__" : null}),
            ETA: new WT_NavDataInfoUTCTime(WT_NavDataBar.INFO_DESCRIPTION.ETA, new WT_NumberUnit(0, WT_Unit.SECOND), {
                    getCurrentValue: function() {
                        let currentTime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");
                        let ete = SimVar.GetSimVarValue("GPS WP ETE", "seconds");
                        return (currentTime + ete) % (24 * 3600);
                    }
                }, utcFormatter),

            ETE: new WT_NavDataInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION.ETE, new WT_NumberUnit(0, WT_Unit.SECOND), "GPS WP ETE", "seconds", timeFormatter, {showDefault: number => number == 0 ? "__:__" : null}),
            FOB: new WT_NavDataInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION.FOB, new WT_NumberUnit(0, WT_Unit.GALLON), "FUEL TOTAL QUANTITY", "gallons", volumeFormatter),
            FOD: new WT_NavDataInfo(WT_NavDataBar.INFO_DESCRIPTION.FOD, new WT_NumberUnit(0, WT_Unit.GALLON), {
                    tempGal: new WT_NumberUnit(0, WT_Unit.GALLON),
                    tempGPH: new WT_NumberUnit(0, WT_Unit.GPH),
                    getCurrentValue: function() {
                        let fuelRemaining = airplaneModel.fuelOnboard(this.tempGal);
                        let fuelFlow = airplaneModel.fuelFlowTotal(this.tempGPH);
                        let enr = SimVar.GetSimVarValue("GPS ETE", "seconds") / 3600;

                        return fuelRemaining.number - enr * fuelFlow.number;
                    }
                }, volumeFormatter),

            GS: new WT_NavDataInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION.GS, new WT_NumberUnit(0, WT_Unit.KNOT), "GPS GROUND SPEED", "knots", speedFormatter),
            LDG: new WT_NavDataInfoUTCTime(WT_NavDataBar.INFO_DESCRIPTION.LDG, new WT_NumberUnit(0, WT_Unit.SECOND), {
                    getCurrentValue: function() {
                        let currentTime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");
                        let enr = SimVar.GetSimVarValue("GPS ETE", "seconds");
                        return (currentTime + enr) % (24 * 3600);
                    }
                }, utcFormatter),

            TAS: new WT_NavDataInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION.TAS, new WT_NumberUnit(0, WT_Unit.KNOT), "AIRSPEED TRUE", "knots", speedFormatter),
            TKE: new WT_NavDataInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION.TKE, new WT_NumberUnit(0, WT_Unit.DEGREE), "GPS WP TRACK ANGLE ERROR", "degree", bearingFormatter),
            TRK: new WT_NavDataInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION.TRK, new WT_NumberUnit(0, WT_Unit.DEGREE), "GPS GROUND MAGNETIC TRACK", "degree", bearingFormatter),
            XTK: new WT_NavDataInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION.XTK, new WT_NumberUnit(0, WT_Unit.METER), "GPS WP CROSS TRK", "meters", distanceFormatter),
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
     * @returns {WT_NavDataInfo[]} an array of all of this nav data bar's data info objects.
     */
    getAllNavDataInfo() {
        return Object.getOwnPropertyNames(this._infos).map(id => this._infos[id]);
    }

    /**
     * Gets one of this nav data bar's nav data info objects by its ID.
     * @param {String} id - a string ID.
     * @returns {WT_NavDataInfo} the nav data info object matching the supplied ID.
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
     * @returns {WT_NavDataInfo} a nava data info object.
     */
    getDataFieldInfo(index) {
        return this._dataFields[index];
    }

    /**
     * Assigns a nav data info object to a data field.
     * @param {Number} index - the index of the data field.
     * @param {WT_NavDataInfo} info - the nav data info object to assign.
     */
    setDataFieldInfo(index, info) {
        if (index < 0 || index >= this._dataFieldCount) {
            return;
        }

        this._dataFields[index] = info;
    }
}
WT_NavDataBar.INFO_DESCRIPTION = {
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

/**
 * This class represents a type of nav info that can be assigned to a data field on the navigational data bar.
 * Each nav info has a description consisting of a short name and long name, a WT_NumberUnit value, a
 * WT_NumberFormatter to control the display of the value, default text to display in case an appropriate value
 * cannot be found, and optionally a list of units (WT_Unit) to choose from when displaying the value.
 * @property {String} shortName - the short name of this nav info.
 * @property {String} longName - the long name of this nav info.
 * @property {Object} valueGetter - the object that gets the current value of this nav info.
 */
class WT_NavDataInfo {
    /**
     * @param {Object} description - a description object containing the short name and long name of the nav info in the .shortName and .longName properties, respectively.
     * @param {WT_NumberUnit} value - the starting value of the nav info. This will also indirectly determine the reference unit used by the nav info.
     * @param {Object} valueGetter - an object that gets the current value of the nav info by implementing the .getCurrentValue() method.
     * @param {WT_NumberFormatter} numberFormatter - a formatting definition to use when displaying the nav info's value.
     * @param {Object} [defaultChecker] - an object that determines when to display default text by implementing the .showDefault(number) method, where number is the value of the nav info.
     *                         .showDefault(number) should return the default text to display when appropriate and either null, undefined, or the empty string otherwise.
     */
    constructor(description, value, valueGetter, numberFormatter, defaultChecker = {showDefault: number => null}) {
        this._shortName = description.shortName;
        this._longName = description.longName;
        this._value = value;
        this._numberFormatter = numberFormatter;
        this._valueGetter = valueGetter;
        this._defaultChecker = defaultChecker;
    }

    /**
     * @readonly
     * @property {String} id - this nav data info's ID string.
     * @type {String}
     */
    get id() {
        return this._shortName;
    }

    /**
     * @readonly
     * @property {String} shortName - this nav data info's short name.
     * @type {String}
     */
    get shortName() {
        return this._shortName;
    }

    /**
     * @readonly
     * @property {String} longName - this nava data info's long name.
     * @type {String}
     */
    get longName() {
        return this._longName;
    }

    /**
     * Gets the number part of the formatted display text of this nav info's value.
     * @returns {string} a formatted text representation of this nav info's current value.
     */
    getDisplayNumber() {
        this._value.set(this._valueGetter.getCurrentValue());
        let displayText;
        let defaultText = this._defaultChecker.showDefault(this._value.number);
        if (defaultText) {
            displayText = defaultText;
        } else {
            displayText = this._numberFormatter.getFormattedNumber(this._value);
        }
        return displayText;
    }

    /**
     * Gets the unit part of the formatted display text of this nav info's value.
     * @returns {string} a formatted text representation of this nav info's current display unit.
     */
    getDisplayUnit() {
        return this._numberFormatter.getFormattedUnit(this._value);
    }
}

/**
 * A convenience class for implementing a nav info type whose current value is determined by a SimVar.
 * @property {string} simVarName - the key of the SimVar used to get this nav info's value.
 * @property {string} simVarUnit - the unit of the SimVar used to get this nav info's value.
 */
class WT_NavDataInfoSimVar extends WT_NavDataInfo {
    /**
     * @param {object} description - a description object containing the short name and long name of the nav info in the .shortName and .longName properties, respectively.
     * @param {WT_NumberUnit} value - the starting value of the nav info. This will also indirectly determine the reference unit used by the nav info.
     * @param {string} simVarName - the key to use when retrieving the SimVar value.
     * @param {string} simVarUnit - the unit to use when retrieving the SimVar value.
     * @param {WT_NumberFormatter} numberFormatter - a formatting definition to use when displaying the nav info's value.
     * @param {string} defaultText - the text to display when
     * @param defaultChecker - an object that determines when to display the default text by implementing the .showDefault(number) method, where number is the value of the nav info.
     *                         .showDefault(number) should return the default text to display when appropriate and either null, undefined, or the empty string otherwise.
     */
    constructor(description, value, simVarName, simVarUnit, numberFormatter, defaultChecker) {
        super(description, value, {getCurrentValue:()=>SimVar.GetSimVarValue(this._simVarName, this._simVarUnit)}, numberFormatter, defaultChecker);
        this._simVarName = simVarName;
        this._simVarUnit = simVarUnit;
    }
}

/**
 * A convenience class for implementing a nav info type whose value is a UTC time.
 */
class WT_NavDataInfoUTCTime extends WT_NavDataInfo {
    getDisplayUnit() {
        return "UTC";
    }
}

class WT_NavDataBarView extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_NavDataBarView.TEMPLATE.content.cloneNode(true));

        this._fieldViewRecycler = new WT_NavDataFieldViewRecycler(this);
        /**
         * @type {WT_NavDataFieldView[]}
         */
        this._fieldViews = [];

        this._model = null;

        this._isInit = false;
    }

    /**
     * @readonly
     * @property {WT_NavDataBar} model
     * @type {WT_NavDataBar}
     */
    get model() {
        return this._model;
    }

    _defineChildren() {
        this._fields = this.shadowRoot.querySelector(`#fields`);
    }

    connectedCallback() {
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
     * @param {WT_NavDataBar} model - a nav data bar model.
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
            this._fieldViews[i].update(this.model.getDataFieldInfo(i));
        }
    }
}
WT_NavDataBarView.TEMPLATE = document.createElement("template");
WT_NavDataBarView.TEMPLATE.innerHTML = `
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

customElements.define("navdatabar-view", WT_NavDataBarView);

class WT_NavDataFieldViewRecycler extends WT_HTMLElementRecycler {
    _createElement() {
        let element = new WT_NavDataFieldView();
        element.slot = "fields";
        return element;
    }
}

class WT_NavDataFieldView extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_NavDataFieldView.TEMPLATE.content.cloneNode(true));

        this._isInit = false;
    }

    _defineChildren() {
        this._title = this.shadowRoot.querySelector(`#title`);
        this._number = this.shadowRoot.querySelector(`#number`);
        this._unit = this.shadowRoot.querySelector(`#unit`);
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
    }

    _clear() {
        this._title.innerHTML = "";
        this._number.innerHTML = "";
        this._unit.innerHTML = "";
    }

    /**
     *
     * @param {WT_NavDataInfo} navDataInfo
     */
    update(navDataInfo) {
        if (!this._isInit) {
            return;
        }

        if (navDataInfo) {
            this._title.innerHTML = navDataInfo.shortName;
            this._number.innerHTML = navDataInfo.getDisplayNumber();
            this._unit.innerHTML = navDataInfo.getDisplayUnit();
        } else {
            this._clear();
        }
    }
}
WT_NavDataFieldView.TEMPLATE = document.createElement("template");
WT_NavDataFieldView.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            width: 100%;
            height: 100%;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            flex-flow: row nowrap;
            justify-content: flex-start;
            align-items: baseline;
        }
            #title {
                margin-right: 0.5em;
                font-size: var(--navdatafield-unit-font-size, 0.75em);
                color: var(--navdatafield-title-color, white);
            }
            #value {
                color: var(--navdatafield-value-color, #d12bc7);
            }
                #unit {
                    font-size: var(--navdatafield-unit-font-size, 0.75em);
                }
    </style>
    <div id="wrapper">
        <div id="title"></div>
        <div id="value">
            <span id="number"></span><span id="unit"></span>
        </div>
    </div>
`;

customElements.define("navdatafield-view", WT_NavDataFieldView);

class WT_NavDataBarController extends WT_DataStoreController {
    /**
     * Creates and adds a data field setting to this controller. The index of the setting is automatically set to the next available
     * index based on the number of settings already added to this controller.
     * @param {String} defaultValue - the default value of the setting to add.
     * @returns {WT_NavDataBarFieldSetting} the setting that was added.
     */
    addDataFieldSetting(defaultValue) {
        let setting = new WT_NavDataBarFieldSetting(this, this._settings.length, defaultValue);
        this.addSetting(setting);
        return setting;
    }

    /**
     * Gets the setting for the data field at the specified index.
     * @param {Number} index - the index of the data field.
     * @returns {WT_NavDataBarFieldSetting} a data field setting.
     */
    getDataFieldSetting(index) {
        return this._settings[index];
    }
}

class WT_NavDataBarFieldSetting extends WT_DataStoreSetting {
    constructor(controller, index, defaultValue, autoUpdate = true, isPersistent = true, keyRoot = WT_NavDataBarFieldSetting.KEY_ROOT) {
        super(controller, `${keyRoot}_${index}`, defaultValue, autoUpdate, isPersistent);

        this._index = index;
    }

    /**
     * @readonly
     * @property {Number} index - the index of the nav data field this setting controls.
     * @type {Number}
     */
    get index() {
        return this._index;
    }

    update() {
        this.model.setDataFieldInfo(this._index, this.model.getNavDataInfo(this.getValue()));
    }
}
WT_NavDataBarFieldSetting.KEY_ROOT = "WT_NavDataBar_FieldAssignment";