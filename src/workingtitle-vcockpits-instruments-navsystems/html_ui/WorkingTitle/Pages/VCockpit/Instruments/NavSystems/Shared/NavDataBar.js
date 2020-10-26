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
            timeFormat: WT_TimeFormatter.Format.HH_MM_OR_MM_SS
        }
        let timeFormatter = new WT_TimeFormatter(timeOpts);

        let flightPlanManager = this.gps.currFlightPlanManager;

        this._infos = [
            new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION[0], new WT_NumberUnit(0, WT_Unit.DEGREE), "PLANE HEADING DEGREES MAGNETIC", "degree", bearingFormatter, "", {showDefault:val=>false}),
            new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION[1], new WT_NumberUnit(0, WT_Unit.NMILE), "GPS WP DISTANCE", "nautical miles", distanceFormatter, "", {showDefault:val=>false}),
            new WT_NavInfo(WT_NavDataBar.INFO_DESCRIPTION[2], new WT_NumberUnit(0, WT_Unit.NMILE), {
                    getCurrentValue: function() {
                        let currentWaypoint = flightPlanManager.getActiveWaypoint();
                        let destination = flightPlanManager.getDestination();
                        if (!currentWaypoint || !destination) {
                            return 0;
                        }

                        return destination.cumulativeDistanceInFP - currentWaypoint.cumulativeDistanceInFP + flightPlanManager.getDistanceToActiveWaypoint();
                    }
                }, distanceFormatter, "", {showDefault:val=>false}),

            new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION[3], new WT_NumberUnit(0, WT_Unit.DEGREE), "GPS WP DESIRED TRACK", "degree", bearingFormatter, "", {showDefault:val=>false}),
            new WT_NavInfo(WT_NavDataBar.INFO_DESCRIPTION[4], new WT_NumberUnit(0, WT_Unit.HOUR), {
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
                }, timeFormatter, "__:__", {showDefault:val=>val==0}),

            new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION[5], new WT_NumberUnit(0, WT_Unit.SECOND),"GPS ETE", "seconds", timeFormatter, "__:__", {showDefault:val=>val==0}),
            new WT_NavInfoUTCTime(WT_NavDataBar.INFO_DESCRIPTION[6], new WT_NumberUnit(0, WT_Unit.SECOND), {
                    getCurrentValue: function() {
                        let currentTime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");
                        let ete = SimVar.GetSimVarValue("GPS WP ETE", "seconds");
                        return (currentTime + ete) % (24 * 3600);
                    }
                }, timeFormatter, "__:__", {showDefault:val=>false}),

            new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION[7], new WT_NumberUnit(0, WT_Unit.SECOND), "GPS WP ETE", "seconds", timeFormatter, "__:__", {showDefault:val=>val==0}),
            new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION[8], new WT_NumberUnit(0, WT_Unit.GALLON), "FUEL TOTAL QUANTITY", "gallons", volumeFormatter, "", {showDefault:val=>false}),
            new WT_NavInfo(WT_NavDataBar.INFO_DESCRIPTION[9], new WT_NumberUnit(0, WT_Unit.GALLON), {
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
                }, volumeFormatter, "", {showDefault:val=>false}),

            new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION[10], new WT_NumberUnit(0, WT_CompoundUnit.KNOT), "GPS GROUND SPEED", "knots", speedFormatter, "", {showDefault:val=>false}),
            new WT_NavInfoUTCTime(WT_NavDataBar.INFO_DESCRIPTION[11], new WT_NumberUnit(0, WT_Unit.SECOND), {
                    getCurrentValue: function() {
                        let currentTime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");
                        let enr = SimVar.GetSimVarValue("GPS ETE", "seconds");
                        return (currentTime + enr) % (24 * 3600);
                    }
                }, timeFormatter, "__:__", {showDefault:val=>false}),

            new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION[12], new WT_NumberUnit(0, WT_CompoundUnit.KNOT), "AIRSPEED TRUE", "knots", speedFormatter, "", {showDefault:val=>false}),
            new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION[13], new WT_NumberUnit(0, WT_Unit.DEGREE), "GPS WP TRACK ANGLE ERROR", "degree", bearingFormatter, "", {showDefault:val=>false}),
            new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION[14], new WT_NumberUnit(0, WT_Unit.DEGREE), "GPS GROUND MAGNETIC TRACK", "degree", bearingFormatter, "", {showDefault:val=>false}),
            new WT_NavInfoSimVar(WT_NavDataBar.INFO_DESCRIPTION[15], new WT_NumberUnit(0, WT_Unit.METER), "GPS WP CROSS TRK", "meters", distanceFormatter, "", {showDefault:val=>false}, [WT_Unit.NMILE]),
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
    constructor(description, value, valueGetter, numberFormatter, defaultText, defaultChecker, displayUnits = []) {
        this.shortName = description.shortName;
        this.longName = description.longName;
        this._value = value;
        this._numberFormatter = numberFormatter;
        this.valueGetter = valueGetter;
        this.defaultText = defaultText;
        this.defaultChecker = defaultChecker;
        this._displayUnits = Array.from(displayUnits);
        if (this._displayUnits.length == 0) {
            this._displayUnits[0] = value.refUnit;
        }
        this._value.unit = this._displayUnits[0];
    }

    get value() {
        return this._value.number;
    }

    get unit() {
        return this._value.unit;
    }

    set unit(val) {
        this._value.unit = val;
    }

    getDisplayNumber() {
        this._value.refNumber = this.valueGetter.getCurrentValue();
        let displayText;
        if (this.defaultChecker.showDefault(this._value.number)) {
            displayText = this.defaultText;
        } else {
            displayText = this._numberFormatter.getFormattedNumber(this._value);
        }
        return displayText;
    }

    getDisplayUnit() {
        return this._numberFormatter.getFormattedUnit(this._value);
    }
}

class WT_NavInfoSimVar extends WT_NavInfo {
    constructor(description, value, simVarName, simVarUnit, numberFormatter, defaultText, defaultChecker, displayUnits = []) {
        super(description, value, {getCurrentValue:()=>SimVar.GetSimVarValue(this.simVarName, this.simVarUnit)}, numberFormatter, defaultText, defaultChecker, displayUnits);
        this.simVarName = simVarName;
        this.simVarUnit = simVarUnit;
    }
}

class WT_NavInfoUTCTime extends WT_NavInfo {
    getDisplayUnit() {
        return "UTC";
    }
}