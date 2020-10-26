class WT_NavDataBar extends NavSystemElement {
    constructor() {
        super(...arguments);
        this._t = 0;
    }

    init(root) {
        let formattedNumberGetter = {getFormattedNumber: (unit, opts) => new WT_FormattedNumber(new WT_NumberUnit(0, unit), opts)};
        let formattedTimeGetter = {getFormattedNumber: (unit, opts) => new WT_FormattedTime(new WT_NumberUnit(0, unit), opts)};
        let bearingOpts = {
            precision: 1,
            unitSpaceBefore: false
        };
        let distanceOpts = {
            precision: 0.1,
            maxDigits: 3,
            unitSpaceBefore: false,
            unitCaps: true
        }
        let volumeOpts = {
            precision: 0.1,
            maxDigits: 3,
            unitSpaceBefore: false,
            unitCaps: true
        }
        let speedOpts = {
            precision: 1,
            unitSpaceBefore: false,
            unitCaps: true
        }

        let flightPlanManager = this.gps.currFlightPlanManager;

        this._infos = [
            new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION[0], "PLANE HEADING DEGREES MAGNETIC", "degree", WT_Unit.DEGREE, bearingOpts, formattedNumberGetter, "", {showDefault:val=>false}),
            new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION[1], "GPS WP DISTANCE", "nautical miles", WT_Unit.NMILE, distanceOpts, formattedNumberGetter, "", {showDefault:val=>false}),
            new WT_NavInfo(WT_NavDataBar.INFO_DESCRIPTION[2], {
                    getCurrentValue: function() {
                        let currentWaypoint = flightPlanManager.getActiveWaypoint();
                        let destination = flightPlanManager.getDestination();
                        if (!currentWaypoint || !destination) {
                            return 0;
                        }

                        return destination.cumulativeDistanceInFP - currentWaypoint.cumulativeDistanceInFP + flightPlanManager.getDistanceToActiveWaypoint();
                    }
                }, WT_Unit.NMILE, distanceOpts, formattedNumberGetter, "", {showDefault:val=>false}),

            new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION[3], "GPS WP DESIRED TRACK", "degree", WT_Unit.DEGREE, bearingOpts, formattedNumberGetter, "", {showDefault:val=>false}),
            new WT_NavInfo(WT_NavDataBar.INFO_DESCRIPTION[4], {
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
                }, WT_Unit.HOUR, {timeFormat: WT_FormattedTime.Format.HH_MM_OR_MM_SS}, formattedTimeGetter, "__:__", {showDefault:val=>val==0}),

            new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION[5], "GPS ETE", "seconds", WT_Unit.SECOND, {timeFormat: WT_FormattedTime.Format.HH_MM_OR_MM_SS}, formattedTimeGetter, "__:__", {showDefault:val=>val==0}),
            new WT_NavInfoUTCTime(WT_NavDataBar.INFO_DESCRIPTION[6], {
                    getCurrentValue: function() {
                        let currentTime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");
                        let ete = SimVar.GetSimVarValue("GPS WP ETE", "seconds");
                        return (currentTime + ete) % (24 * 3600);
                    }
                }, WT_Unit.SECOND, {timeFormat: WT_FormattedTime.Format.HH_MM}, formattedTimeGetter, "__:__", {showDefault:val=>false}),

            new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION[7], "GPS WP ETE", "seconds", WT_Unit.SECOND, {timeFormat: WT_FormattedTime.Format.HH_MM_OR_MM_SS}, formattedTimeGetter, "__:__", {showDefault:val=>val==0}),
            new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION[8], "FUEL TOTAL QUANTITY", "gallons", WT_Unit.GALLON, volumeOpts, formattedNumberGetter, "", {showDefault:val=>false}),
            new WT_NavInfo(WT_NavDataBar.INFO_DESCRIPTION[9], {
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
                }, WT_Unit.GALLON, volumeOpts, formattedNumberGetter, "", {showDefault:val=>false}),

            new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION[10], "GPS GROUND SPEED", "knots", WT_CompoundUnit.KNOT, speedOpts, formattedNumberGetter, "", {showDefault:val=>false}),
            new WT_NavInfoUTCTime(WT_NavDataBar.INFO_DESCRIPTION[11], {
                    getCurrentValue: function() {
                        let currentTime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");
                        let enr = SimVar.GetSimVarValue("GPS ETE", "seconds");
                        return (currentTime + enr) % (24 * 3600);
                    }
                }, WT_Unit.SECOND, {timeFormat: WT_FormattedTime.Format.HH_MM}, formattedTimeGetter, "__:__", {showDefault:val=>false}),

            new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION[12], "AIRSPEED TRUE", "knots", WT_CompoundUnit.KNOT, speedOpts, formattedNumberGetter, "", {showDefault:val=>false}),
            new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION[13], "GPS WP TRACK ANGLE ERROR", "degree", WT_Unit.DEGREE, bearingOpts, formattedNumberGetter, "", {showDefault:val=>false}),
            new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION[14], "GPS GROUND MAGNETIC TRACK", "degree", WT_Unit.DEGREE, bearingOpts, formattedNumberGetter, "", {showDefault:val=>false}),
            new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION[15], "GPS WP CROSS TRK", "meters", WT_Unit.METER, distanceOpts, formattedNumberGetter, "", {showDefault:val=>false}, [WT_Unit.NMILE]),
        ];

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

    static getFieldInfoIndex(fieldIndex, defaultValue = 0) {
        return WTDataStore.get(`${WT_NavDataBar.VARNAME_FIELD_INFO}.${fieldIndex}`, defaultValue);
    }

    static getFieldInfoDescription(fieldIndex) {
        return WT_NavDataBar.INFO_DESCRIPTION[WT_NavDataBar.getFieldInfoIndex(fieldIndex)];
    }

    static setFieldInfoIndex(fieldIndex, infoIndex) {
        WTDataStore.set(`${WT_NavDataBar.VARNAME_FIELD_INFO}.${fieldIndex}`, infoIndex);
    }
}
WT_NavDataBar.VARNAME_FIELD_INFO = "NavBar_Field_Info";
WT_NavDataBar.INFO_DESCRIPTION = [
    {shortName: "BRG", longName: "Bearing"},
    {shortName: "DIS", longName: "Distance to Next Waypoint"},
    {shortName: "DTG", longName: "Distance to Destination"},
    {shortName: "DTK", longName: "Desired Track"},
    {shortName: "END", longName: "Endurance"},
    {shortName: "ENR", longName: "ETE To Destination"},
    {shortName: "ETA", longName: "Estimated Time of Arrival"},
    {shortName: "ETE", longName: "Estimated Time Enroute"},
    {shortName: "FOB", longName: "Fuel Onboard"},
    {shortName: "FOD", longName: "Fuel over Destination"},
    {shortName: "GS", longName: "Groundspeed"},
    {shortName: "LDG", longName: "ETA at Final Destination"},
    {shortName: "TAS", longName: "True Airspeed"},
    {shortName: "TKE", longName: "Track Angle Error"},
    {shortName: "TRK", longName: "Track"},
    {shortName: "XTK", longName: "Cross-track Error"},
];

class WT_NavInfo {
    constructor(description, valueGetter, unit, numberDisplayOpts, formattedNumberGetter, defaultText, defaultChecker, displayUnits = []) {
        this.shortName = description.shortName;
        this.longName = description.longName;
        this._value = formattedNumberGetter.getFormattedNumber(unit, numberDisplayOpts);
        this.valueGetter = valueGetter;
        this.defaultText = defaultText;
        this.defaultChecker = defaultChecker;
        this._displayUnits = Array.from(displayUnits);
        if (this._displayUnits.length == 0) {
            this._displayUnits[0] = unit;
        }
        this._value.numberUnit.unit = this._displayUnits[0];
    }

    get value() {
        return this._value.numberUnit.number;
    }

    get unit() {
        return this._value.numberUnit.unit;
    }

    set unit(val) {
        this._value.numberUnit.unit = val;
    }

    getDisplayNumber() {
        this._value.numberUnit.refNumber = this.valueGetter.getCurrentValue();
        let displayText;
        if (this.defaultChecker.showDefault(this._value.numberUnit.number)) {
            displayText = this.defaultText;
        } else {
            displayText = this._value.getFormattedNumber();
        }
        return displayText;
    }

    getDisplayUnit() {
        return this._value.getFormattedUnit();
    }
}

class WT_NavInfoSimVar extends WT_NavInfo {
    constructor(description, simVarName, simVarUnit, unit, numberDisplayOpts, formattedNumberGetter, defaultText, defaultChecker, displayUnits = []) {
        super(description, {getCurrentValue:()=>SimVar.GetSimVarValue(this.simVarName, this.simVarUnit)}, unit, numberDisplayOpts, formattedNumberGetter, defaultText, defaultChecker, displayUnits);
        this.simVarName = simVarName;
        this.simVarUnit = simVarUnit;
    }
}

class WT_NavInfoUTCTime extends WT_NavInfo {
    getDisplayUnit() {
        return "UTC";
    }
}