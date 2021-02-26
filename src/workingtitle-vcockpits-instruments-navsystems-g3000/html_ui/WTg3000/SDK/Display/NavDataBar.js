/**
 * This class implements the Navigation data bar (also referred to as navigation status bar) found on Garmin units.
 * It has support for an arbitrary number of data bar fields.
 */
class WT_NavDataBarModel {
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
        let flightPlanManager = this._fpm;
        let airplaneModel = WT_PlayerAirplane.INSTANCE;

        this._infos = {
            BRG: new WT_NavDataInfoSimVarNavAngle(WT_NavDataBarModel.INFO_DESCRIPTION.BRG, new WT_NavAngleUnit(true), "PLANE HEADING DEGREES MAGNETIC", "degree", {
                updateLocation(location) {
                    airplaneModel.position(location);
                }
            }),
            DIS: new WT_NavDataInfoSimVarNumber(WT_NavDataBarModel.INFO_DESCRIPTION.DIS, WT_Unit.NMILE, "GPS WP DISTANCE", "nautical miles"),
            DTG: new WT_NavDataInfoCustomNumber(WT_NavDataBarModel.INFO_DESCRIPTION.DTG, WT_Unit.NMILE, {
                updateValue(value) {
                    return flightPlanManager.distanceToDestination(true, value);
                }
            }),
            DTK: new WT_NavDataInfoSimVarNavAngle(WT_NavDataBarModel.INFO_DESCRIPTION.DTK, new WT_NavAngleUnit(true), "GPS WP DESIRED TRACK", "degree", {
                updateLocation(location) {
                    airplaneModel.position(location);
                }
            }),
            END: new WT_NavDataInfoCustomNumber(WT_NavDataBarModel.INFO_DESCRIPTION.END, WT_Unit.HOUR, {
                tempGal: new WT_NumberUnit(0, WT_Unit.GALLON),
                tempGPH: new WT_NumberUnit(0, WT_Unit.GPH),
                updateValue(value) {
                    let fuelRemaining = airplaneModel.fuelOnboard(this.tempGal);
                    let fuelFlow = airplaneModel.fuelFlowTotal(this.tempGPH);
                    if (fuelFlow.number == 0) {
                        value.set(0);
                    } else {
                        value.set(fuelRemaining.number / fuelFlow.number);
                    }
                }
            }),
            ENR: new WT_NavDataInfoSimVarNumber(WT_NavDataBarModel.INFO_DESCRIPTION.ENR, WT_Unit.SECOND,"GPS ETE", "seconds"),
            ETA: new WT_NavDataInfoCustomNumber(WT_NavDataBarModel.INFO_DESCRIPTION.ETA, WT_Unit.SECOND, {
                updateValue(value) {
                    let currentTime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");
                    let ete = SimVar.GetSimVarValue("GPS WP ETE", "seconds");
                    value.set((currentTime + ete) % (24 * 3600));
                }
            }),
            ETE: new WT_NavDataInfoSimVarNumber(WT_NavDataBarModel.INFO_DESCRIPTION.ETE, WT_Unit.SECOND, "GPS WP ETE", "seconds"),
            FOB: new WT_NavDataInfoSimVarNumber(WT_NavDataBarModel.INFO_DESCRIPTION.FOB, WT_Unit.GALLON, "FUEL TOTAL QUANTITY", "gallons"),
            FOD: new WT_NavDataInfoCustomNumber(WT_NavDataBarModel.INFO_DESCRIPTION.FOD, WT_Unit.GALLON, {
                tempGal: new WT_NumberUnit(0, WT_Unit.GALLON),
                tempGPH: new WT_NumberUnit(0, WT_Unit.GPH),
                updateValue(value) {
                    let fuelRemaining = airplaneModel.fuelOnboard(this.tempGal);
                    let fuelFlow = airplaneModel.fuelFlowTotal(this.tempGPH);
                    let enr = SimVar.GetSimVarValue("GPS ETE", "seconds") / 3600;
                    value.set(fuelRemaining.number - enr * fuelFlow.number);
                }
            }),
            GS: new WT_NavDataInfoSimVarNumber(WT_NavDataBarModel.INFO_DESCRIPTION.GS, WT_Unit.KNOT, "GPS GROUND SPEED", "knots"),
            LDG: new WT_NavDataInfoCustomNumber(WT_NavDataBarModel.INFO_DESCRIPTION.LDG, WT_Unit.SECOND, {
                updateValue(value) {
                    let currentTime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");
                    let enr = SimVar.GetSimVarValue("GPS ETE", "seconds");
                    value.set((currentTime + enr) % (24 * 3600));
                }
            }),
            TAS: new WT_NavDataInfoSimVarNumber(WT_NavDataBarModel.INFO_DESCRIPTION.TAS, WT_Unit.KNOT, "AIRSPEED TRUE", "knots"),
            TKE: new WT_NavDataInfoSimVarNumber(WT_NavDataBarModel.INFO_DESCRIPTION.TKE, WT_Unit.DEGREE, "GPS WP TRACK ANGLE ERROR", "degree"),
            TRK: new WT_NavDataInfoSimVarNavAngle(WT_NavDataBarModel.INFO_DESCRIPTION.TRK, new WT_NavAngleUnit(true), "GPS GROUND MAGNETIC TRACK", "degree", {
                updateLocation(location) {
                    airplaneModel.position(location);
                }
            }),
            XTK: new WT_NavDataInfoSimVarNumber(WT_NavDataBarModel.INFO_DESCRIPTION.XTK, WT_Unit.METER, "GPS WP CROSS TRK", "meters")
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
WT_NavDataBarModel.INFO_DESCRIPTION = {
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
 * A type of nav data info that can be assigned to a data field on the navigational data bar.
 */
class WT_NavDataInfo {
    /**
     * @param {Object} description - a description object containing the short name and long name of the new nav data info.
     */
    constructor(description) {
        this._shortName = description.shortName;
        this._longName = description.longName;
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
     * Gets this nav data info's current value.
     * @returns {*} this nav data info's current value.
     */
    getValue() {
        return null;
    }
}

/**
 * A nav data info type whose value is a WT_NumberUnit object.
 * @abstract
 */
class WT_NavDataInfoNumber extends WT_NavDataInfo {
    /**
     * @param {Object} description - a description object containing the short name and long name of the new nav data info.
     * @param {WT_Unit} unit - the unit of the new nav data info's number value. The display unit type of the new nav data
     *                         info will also be initialized to this unit.
     */
    constructor(description, unit) {
        super(description);

        this._value = new WT_NumberUnit(0, unit);
        this._displayUnit = unit;
    }

    _updateValue() {
    }

    /**
     * Gets this nav data info's current value.
     * @returns {WT_NumberUnitReadOnly} this nav data info's current value.
     */
    getValue() {
        this._updateValue();
        return this._value.readonly();
    }

    /**
     * Gets this nav data info's display unit type.
     * @returns {WT_Unit} this nav data info's display unit type.
     */
    getDisplayUnit() {
        return this._displayUnit;
    }

    /**
     * Sets this nav data info's display unit type. Only unit types of the same family as the unit type of this nav
     * data info's number value are allowed.
     * @param {WT_Unit} unit - the new display unit type.
     */
    setDisplayUnit(unit) {
        if (unit.family !== this._value.unit.family) {
            return;
        }

        this._displayUnit = unit;
    }
}

class WT_NavDataInfoCustomNumber extends WT_NavDataInfoNumber {
    /**
     * @param {Object} description - a description object containing the short name and long name of the new nav data info.
     * @param {WT_Unit} unit - the unit of the new nav data info's number value.
     * @param {{updateValue(value:WT_NumberUnit)}} valueUpdater - an object that is used to update the numeric value of the new nav data info.
     */
    constructor(description, unit, valueUpdater) {
        super(description, unit);

        this._valueUpdater = valueUpdater;
    }

    _updateValue() {
        this._valueUpdater.updateValue(this._value);
    }
}

/**
 * A nav data info type with a value of type WT_NumberUnit that updates its value using SimVars.
 */
class WT_NavDataInfoSimVarNumber extends WT_NavDataInfoNumber {
    /**
     * @param {Object} description - a description object containing the short name and long name of the new nav data info.
     * @param {WT_Unit} unit - the unit of the new nav data info's number value.
     * @param {String} simVarName - the key to use when retrieving the SimVar value.
     * @param {String} simVarUnit - the unit to use when retrieving the SimVar value.
     */
    constructor(description, unit, simVarName, simVarUnit) {
        super(description, unit);

        this._simVarName = simVarName;
        this._simVarUnit = simVarUnit;
    }

    _updateValue() {
        this._value.set(SimVar.GetSimVarValue(this._simVarName, this._simVarUnit));
    }
}

/**
 * A nav data info type with a WT_NumberUnit value that has a unit type of WT_NavAngleUnit that updates its value using SimVars.
 */
class WT_NavDataInfoSimVarNavAngle extends WT_NavDataInfoSimVarNumber {
    /**
     * @param {Object} description - a description object containing the short name and long name of the new nav data info.
     * @param {WT_Unit} unit - the unit of the new nav data info's number value.
     * @param {String} simVarName - the key to use when retrieving the SimVar value.
     * @param {String} simVarUnit - the unit to use when retrieving the SimVar value.
     * @param {{updateLocation(value:WT_GeoPoint)}} locationUpdater - an object that is used to update the reference location of the
     *                                                                nav angle unit of the new nav data info's value.
     */
    constructor(description, unit, simVarName, simVarUnit, locationUpdater) {
        super(description, unit, simVarName, simVarUnit);

        this._locationUpdater = locationUpdater;
        this._location = new WT_GeoPoint(0, 0);
    }

    _updateLocation() {
        this._locationUpdater.updateLocation(this._location);
        this._value.unit.setLocation(this._location);
    }

    /**
     * Gets this nav data info's current value.
     * @returns {WT_NumberUnitReadOnly} this nav data info's current value.
     */
    getValue() {
        this._updateValue();
        this._updateLocation();
        return this._value.readonly();
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
     * @type {WT_NavDataBarModel}
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
        let timeFormatter = new WT_TimeFormatter(timeOpts);

        let utcOpts = {
            timeFormat: WT_TimeFormatter.Format.HH_MM
        }
        let utcFormatter = new WT_TimeFormatter(utcOpts);

        this._formatters = {
            BRG: new WT_NavDataFieldViewDegreeFormatter(bearingFormatter),
            DIS: new WT_NavDataFieldViewNumberFormatter(distanceFormatter),
            DTG: new WT_NavDataFieldViewNumberFormatter(distanceFormatter),
            DTK: new WT_NavDataFieldViewDegreeFormatter(bearingFormatter),
            END: new WT_NavDataFieldViewTimeFormatter(timeFormatter, "__:__"),
            ENR: new WT_NavDataFieldViewTimeFormatter(timeFormatter, "__:__"),
            ETA: new WT_NavDataFieldViewUTCFormatter(utcFormatter),
            ETE: new WT_NavDataFieldViewTimeFormatter(timeFormatter, "__:__"),
            FOB: new WT_NavDataFieldViewNumberFormatter(volumeFormatter),
            FOD: new WT_NavDataFieldViewNumberFormatter(volumeFormatter),
            GS: new WT_NavDataFieldViewNumberFormatter(speedFormatter),
            LDG: new WT_NavDataFieldViewUTCFormatter(utcFormatter),
            TAS: new WT_NavDataFieldViewNumberFormatter(speedFormatter),
            TKE: new WT_NavDataFieldViewDegreeFormatter(bearingFormatter),
            TRK: new WT_NavDataFieldViewDegreeFormatter(bearingFormatter),
            XTK: new WT_NavDataFieldViewNumberFormatter(distanceFormatter),
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
     * @param {WT_NavDataBarModel} model - a nav data bar model.
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

class WT_NavDataFieldViewFormatter {
    /**
     * Gets the display HTML string of a nav data info's current value.
     * @param {WT_NavDataInfo} navDataInfo - a nav data info object.
     * @returns {String} the HTML string of the nav data info's current value.
     */
    getDisplayHTML(navDataInfo) {
        return "";
    }
}

class WT_NavDataFieldViewNumberFormatter extends WT_NavDataFieldViewFormatter {
    /**
     * @param {WT_NumberFormatter} formatter
     */
    constructor(formatter) {
        super();

        this._formatter = formatter;
    }

    /**
     * Gets the number part of the formatted display text of a nav data info's value.
     * @param {WT_NavDataInfoNumber} navDataInfo - a nav data info object.
     * @returns {String} a formatted text representation of a nav data info's current value.
     */
    _getNumberText(navDataInfo) {
        return this._formatter.getFormattedNumber(navDataInfo.getValue(), navDataInfo.getDisplayUnit());
    }

    /**
     * Gets the unit part of the formatted display text of a nav data info's value.
     * @param {WT_NavDataInfoNumber} navDataInfo - a nav data info object.
     * @returns {String} a formatted text representation of a nav data info's current display unit.
     */
    _getUnitText(navDataInfo) {
        return this._formatter.getFormattedUnit(navDataInfo.getValue(), navDataInfo.getDisplayUnit());
    }

    /**
     * Gets the display HTML string of a nav data info's current value.
     * @param {WT_NavDataInfoNumber} navDataInfo - a nav data info object.
     * @returns {String} the HTML string of the nav data info's current value.
     */
    getDisplayHTML(navDataInfo) {
        return `<span>${this._getNumberText(navDataInfo)}</span><span class="${WT_NavDataFieldView.UNIT_CLASS}">${this._getUnitText(navDataInfo)}</span>`;
    }
}

class WT_NavDataFieldViewDegreeFormatter extends WT_NavDataFieldViewNumberFormatter {
    /**
     * Gets the display HTML string of a nav data info's current value.
     * @param {WT_NavDataInfoNumber} navDataInfo - a nav data info object.
     * @returns {String} the HTML string of the nav data info's current value.
     */
    getDisplayHTML(navDataInfo) {
        return `${this._getNumberText(navDataInfo)}${this._getUnitText(navDataInfo)}`;
    }
}

class WT_NavDataFieldViewTimeFormatter extends WT_NavDataFieldViewNumberFormatter {
    constructor(formatter, defaultText) {
        super(formatter);

        this._defaultText = defaultText;
    }

    /**
     * Gets the number part of the formatted display text of a nav data info's value.
     * @param {WT_NavDataInfo} navDataInfo - a nav data info object.
     * @returns {String} a formatted text representation of a nav data info's current value.
     */
    _getNumberText(navDataInfo) {
        let value = navDataInfo.getValue();
        return value.number === 0 ? this._defaultText : this._formatter.getFormattedNumber(value);
    }

    /**
     * Gets the unit part of the formatted display text of a nav data info's value.
     * @param {WT_NavDataInfo} navDataInfo - a nav data info object.
     * @returns {String} a formatted text representation of a nav data info's current display unit.
     */
    _getUnitText(navDataInfo) {
        return "";
    }
}

class WT_NavDataFieldViewUTCFormatter extends WT_NavDataFieldViewNumberFormatter {
    /**
     * Gets the unit part of the formatted display text of a nav data info's value.
     * @param {WT_NavDataInfo} navDataInfo - a nav data info object.
     * @returns {String} a formatted text representation of a nav data info's current display unit.
     */
    _getUnitText(navDataInfo) {
        return "UTC";
    }
}

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
        this._value = this.shadowRoot.querySelector(`#value`);
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
    }

    _clear() {
        this._title.innerHTML = "";
        this._value.innerHTML = "";
    }

    /**
     *
     * @param {WT_NavDataInfo} navDataInfo
     * @param {WT_NavDataFieldViewFormatter} formatter
     */
    update(navDataInfo, formatter) {
        if (!this._isInit) {
            return;
        }

        if (navDataInfo) {
            this._title.innerHTML = navDataInfo.shortName;
            this._value.innerHTML = formatter.getDisplayHTML(navDataInfo);
        } else {
            this._clear();
        }
    }
}
WT_NavDataFieldView.UNIT_CLASS = "unit";
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
                .${WT_NavDataFieldView.UNIT_CLASS} {
                    font-size: var(--navdatafield-unit-font-size, 0.75em);
                }
    </style>
    <div id="wrapper">
        <div id="title"></div>
        <div id="value">
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