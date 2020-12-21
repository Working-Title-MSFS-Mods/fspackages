/**
 * This class implements the Navigational data bar (also referred to as navigation status bar) found on Garmin units.
 * It has support for an arbitrary number of data bar fields; outside code or subclasses define the exact number
 * by setting the length of the .dataFields array. Data fields are set using data store. Static methods are
 * provided to facilitate an interface between data store, WT_NavDataBar, and controllers.
 */
class WT_NavDataBar extends NavSystemElement {
    constructor() {
        super(...arguments);
        this._t = 0;
    }

    init(root) {
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

        let flightPlanManager = this.gps.currFlightPlanManager;

        this._infos = {
            BRG: new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION.BRG, new WT_NumberUnit(0, WT_Unit.DEGREE), "PLANE HEADING DEGREES MAGNETIC", "degree", bearingFormatter),
            DIS: new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION.DIS, new WT_NumberUnit(0, WT_Unit.NMILE), "GPS WP DISTANCE", "nautical miles", distanceFormatter),
            DTG: new WT_NavInfo(WT_NavDataBar.INFO_DESCRIPTION.DTG, new WT_NumberUnit(0, WT_Unit.NMILE), {
                    getCurrentValue: function() {
                        let currentWaypoint = flightPlanManager.getActiveWaypoint();
                        let destination = flightPlanManager.getDestination();
                        if (!currentWaypoint || !destination) {
                            return 0;
                        }

                        return destination.cumulativeDistanceInFP - currentWaypoint.cumulativeDistanceInFP + flightPlanManager.getDistanceToActiveWaypoint();
                    }
                }, distanceFormatter),

            DTK: new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION.DTK, new WT_NumberUnit(0, WT_Unit.DEGREE), "GPS WP DESIRED TRACK", "degree", bearingFormatter),
            END: new WT_NavInfo(WT_NavDataBar.INFO_DESCRIPTION.END, new WT_NumberUnit(0, WT_Unit.HOUR), {
                    getCurrentValue: function() {
                        let fuelRemaining = SimVar.GetSimVarValue("FUEL TOTAL QUANTITY", "gallons");

                        let numEngines = SimVar.GetSimVarValue("NUMBER OF ENGINES", "number");
                        let fuelFlow = 0;
                        for (let i = 1; i <= numEngines; i++ ) {
                            fuelFlow += SimVar.GetSimVarValue("ENG FUEL FLOW GPH:" + i, "gallons per hour");
                        }
                        if (fuelFlow == 0) {
                            return 0;
                        } else {
                            return fuelRemaining / fuelFlow;
                        }
                    }
                }, timeFormatter, {showDefault: number => number == 0 ? "__:__" : null}),

            ENR: new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION.ENR, new WT_NumberUnit(0, WT_Unit.SECOND),"GPS ETE", "seconds", timeFormatter, {showDefault: number => number == 0 ? "__:__" : null}),
            ETA: new WT_NavInfoUTCTime(WT_NavDataBar.INFO_DESCRIPTION.ETA, new WT_NumberUnit(0, WT_Unit.SECOND), {
                    getCurrentValue: function() {
                        let currentTime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");
                        let ete = SimVar.GetSimVarValue("GPS WP ETE", "seconds");
                        return (currentTime + ete) % (24 * 3600);
                    }
                }, utcFormatter),

            ETE: new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION.ETE, new WT_NumberUnit(0, WT_Unit.SECOND), "GPS WP ETE", "seconds", timeFormatter, {showDefault: number => number == 0 ? "__:__" : null}),
            FOB: new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION.FOB, new WT_NumberUnit(0, WT_Unit.GALLON), "FUEL TOTAL QUANTITY", "gallons", volumeFormatter),
            FOD: new WT_NavInfo(WT_NavDataBar.INFO_DESCRIPTION.FOD, new WT_NumberUnit(0, WT_Unit.GALLON), {
                    getCurrentValue: function() {
                        let fuelRemaining = SimVar.GetSimVarValue("FUEL TOTAL QUANTITY", "gallons");
                        let enr = SimVar.GetSimVarValue("GPS ETE", "seconds") / 3600;

                        let numEngines = SimVar.GetSimVarValue("NUMBER OF ENGINES", "number");
                        let fuelFlow = 0;
                        for (let i = 1; i <= numEngines; i++ ) {
                            fuelFlow += SimVar.GetSimVarValue("ENG FUEL FLOW GPH:" + i, "gallons per hour");
                        }
                        return fuelRemaining - enr * fuelFlow;
                    }
                }, volumeFormatter),

            GS: new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION.GS, new WT_NumberUnit(0, WT_Unit.KNOT), "GPS GROUND SPEED", "knots", speedFormatter),
            LDG: new WT_NavInfoUTCTime(WT_NavDataBar.INFO_DESCRIPTION.LDG, new WT_NumberUnit(0, WT_Unit.SECOND), {
                    getCurrentValue: function() {
                        let currentTime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");
                        let enr = SimVar.GetSimVarValue("GPS ETE", "seconds");
                        return (currentTime + enr) % (24 * 3600);
                    }
                }, utcFormatter),

            TAS: new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION.TAS, new WT_NumberUnit(0, WT_Unit.KNOT), "AIRSPEED TRUE", "knots", speedFormatter),
            TKE: new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION.TKE, new WT_NumberUnit(0, WT_Unit.DEGREE), "GPS WP TRACK ANGLE ERROR", "degree", bearingFormatter),
            TRK: new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION.TRK, new WT_NumberUnit(0, WT_Unit.DEGREE), "GPS GROUND MAGNETIC TRACK", "degree", bearingFormatter),
            XTK: new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION.XTK, new WT_NumberUnit(0, WT_Unit.METER), "GPS WP CROSS TRK", "meters", distanceFormatter),
        };
        this._infos.XTK.unit = WT_Unit.NMILE;

        this.dataFields = [];
    }

    onEnter() {
    }

    onUpdate(_deltaTime) {
        this._t++;
        if (this._t > 30) {
            this.gps.currFlightPlanManager.updateFlightPlan();
            this._t = 0;
        }

        for (let i = 0; i < this.dataFields.length; i++) {
            this.dataFields[i].setInfo(this._infos[WT_NavDataBar.getFieldInfoIndex(i)]);
            this.dataFields[i].update();
        }
    }

    onExit() {
    }

    onEvent(_event) {
    }

    /**
     * Gets the index of the nav info assigned to a specific data field from the data store.
     * @param {number} fieldIndex - the index of the field to query.
     * @param {number} [defaultValue=0] - the default value to return if no value can be retrieved from the data store.
     * @returns {string} the identifier of the nav info assigned to the data field at index fieldIndex.
     */
    static getFieldInfoIndex(fieldIndex, defaultValue = "BRG") {
        return WTDataStore.get(`${WT_NavDataBar.VARNAME_FIELD_INFO}.${fieldIndex}`, defaultValue);
    }

    /**
     * Gets the description of the nav info assigned to a specific data field.
     * @param {number} fieldIndex - the index of the field to query.
     * @returns {object} an object containing a description of the nav info assigned to the data field at index fieldIndex.
     *                   The object has two properties: shortName and longName.
     */
    static getFieldInfoDescription(fieldIndex) {
        return WT_NavDataBar.INFO_DESCRIPTION[WT_NavDataBar.getFieldInfoIndex(fieldIndex)];
    }

    /**
     * Sets the nav info assigned to a specific data field through the data store.
     * @param {number} fieldIndex - the index of the field to change.
     * @param {string} infoID - the identifier of the nav info to assign.
     */
    static setFieldInfoIndex(fieldIndex, infoID) {
        WTDataStore.set(`${WT_NavDataBar.VARNAME_FIELD_INFO}.${fieldIndex}`, infoID);
    }
}
WT_NavDataBar.VARNAME_FIELD_INFO = "NavBar_Field_Info";
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
 * @property {string} shortName - the short name of this nav info.
 * @property {string} longName - the long name of this nav info.
 * @property {object} valueGetter - the object that gets the current value of this nav info.
 */
class WT_NavInfo {
    /**
     * @param {object} description - a description object containing the short name and long name of the nav info in the .shortName and .longName properties, respectively.
     * @param {WT_NumberUnit} value - the starting value of the nav info. This will also indirectly determine the reference unit used by the nav info.
     * @param {object} valueGetter - an object that gets the current value of the nav info by implementing the .getCurrentValue() method.
     * @param {WT_NumberFormatter} numberFormatter - a formatting definition to use when displaying the nav info's value.
     * @param [defaultChecker] - an object that determines when to display default text by implementing the .showDefault(number) method, where number is the value of the nav info.
     *                         .showDefault(number) should return the default text to display when appropriate and either null, undefined, or the empty string otherwise.
     */
    constructor(description, value, valueGetter, numberFormatter, defaultChecker = {showDefault: number => null}) {
        this.shortName = description.shortName;
        this.longName = description.longName;
        this._value = value;
        this._numberFormatter = numberFormatter;
        this.valueGetter = valueGetter;
        this._defaultChecker = defaultChecker;
    }

    /**
     * Gets the number part of the formatted display text of this nav info's value.
     * @returns {string} a formatted text representation of this nav info's current value.
     */
    getDisplayNumber() {
        this._value.set(this.valueGetter.getCurrentValue());
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
class WT_NavInfoSimVar extends WT_NavInfo {
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
        super(description, value, {getCurrentValue:()=>SimVar.GetSimVarValue(this.simVarName, this.simVarUnit)}, numberFormatter, defaultChecker);
        this.simVarName = simVarName;
        this.simVarUnit = simVarUnit;
    }
}

/**
 * A convenience class for implementing a nav info type whose value is a UTC time.
 */
class WT_NavInfoUTCTime extends WT_NavInfo {
    getDisplayUnit() {
        return "UTC";
    }
}