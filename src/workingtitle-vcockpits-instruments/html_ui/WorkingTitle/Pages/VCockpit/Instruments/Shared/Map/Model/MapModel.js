class WT_MapModel {
    constructor() {
        this._range = new WT_NumberUnit(0, WT_Unit.NMILE);
        this._optsManager = new WT_OptionsManager(this, WT_MapModel.OPTIONS_DEF);

        this.addComponent(new WT_MapModelAirplaneModule());
        this.addComponent(new WT_MapModelWeatherModule());
        this.addComponent(new WT_MapModelAutopilotModule());
    }

    get range() {
        return this._range.copy();
    }

    set range(range) {
        this._range.copyFrom(range);
    }

    setOptions(opts) {
        this._optsManager.setOptions(opts);
    }

    addComponent(component) {
        this[component.name] = component;
        let optsDef = {};
        optsDef[`${component.name}Options`] = {default: {}, auto: true};
        this._optsManager.addOptions(optsDef);
    }

    removeComponent(component) {
        this.removeComponentByName(component.name);
    }

    removeComponentByName(name) {
        if (!this[name]) {
            return;
        }

        let removed = this[name];
        this._optsManager.removeOptions([`${removed.name}Options`]);
        delete this[name];
    }
}
WT_MapModel.OPTIONS_DEF = {
    target: {default: new LatLong(0, 0), auto: true},
    range: {default: new WT_NumberUnit(5, WT_Unit.NMILE), auto: false},
    rotation: {default: 0, auto: true}
};

class WT_MapModelModule {
    constructor(name) {
        this._name = name;

        this._optsManager = new WT_OptionsManager(this, WT_MapModelModule.OPTIONS_DEF);
    }

    get name() {
        return this._name;
    }

    setOptions(opts) {
        this._optsManager.setOptions(opts);
    }
}

class WT_MapModelAirplaneModule extends WT_MapModelModule {
    constructor(name = WT_MapModelAirplaneModule.NAME_DEFAULT) {
        super(name);
    }

    get position() {
        return new LatLong(SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude"), SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude"));
    }

    get headingTrue() {
        return SimVar.GetSimVarValue("PLANE HEADING DEGREES TRUE", "degree");
    }

    get trackTrue() {
        return SimVar.GetSimVarValue("GPS GROUND TRUE TRACK", "degree");
    }

    get turnSpeed() {
        return SimVar.GetSimVarValue("DELTA HEADING RATE", "degrees per second");
    }

    get magVar() {
        return SimVar.GetSimVarValue("GPS MAGVAR", "degree");
    }

    get altitude() {
        return new WT_NumberUnit(SimVar.GetSimVarValue("PLANE ALTITUDE", "feet"), WT_Unit.FOOT);
    }

    get altitudeIndicated() {
        return new WT_NumberUnit(SimVar.GetSimVarValue("INDICATED ALTITUDE", "feet"), WT_Unit.FOOT);
    }

    get groundSpeed() {
        return new WT_NumberUnit(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots"), WT_Unit.KNOT);
    }

    get tas() {
        return new WT_NumberUnit(SimVar.GetSimVarValue("AIRSPEED TRUE", "knots"), WT_Unit.KNOT);
    }

    get verticalSpeed() {
        return new WT_NumberUnit(SimVar.GetSimVarValue("VERTICAL SPEED", "feet per minute"), WT_CompoundUnit.FPM);
    }

    get isOnGround() {
        return SimVar.GetSimVarValue("SIM ON GROUND", "bool");
    }

    get fuelOnboard() {
        return new WT_NumberUnit(SimVar.GetSimVarValue("FUEL TOTAL QUANTITY", "gallons"), WT_Unit.GALLON);
    }

    get fuelFlowTotal() {
        let numEngines = SimVar.GetSimVarValue("NUMBER OF ENGINES", "number");
        let fuelFlow = 0;
        for (let i = 1; i <= numEngines; i++ ) {
            fuelFlow += SimVar.GetSimVarValue("ENG FUEL FLOW GPH:" + i, "gallons per hour");
        }
        return new WT_NumberUnit(fuelFlow, WT_Unit.GPH);
    }
}
WT_MapModelAirplaneModule.NAME_DEFAULT = "airplane";

class WT_MapModelWeatherModule extends WT_MapModelModule {
    constructor(name = WT_MapModelWeatherModule.NAME_DEFAULT) {
        super(name);
    }

    get windSpeed() {
        return new WT_NumberUnit(SimVar.GetSimVarValue("AMBIENT WIND VELOCITY", "knots"), WT_Unit.KNOT);
    }

    get windDirection() {
        return SimVar.GetSimVarValue("AMBIENT WIND DIRECTION", "degree");
    }

    get airPressure() {
        return new WT_NumberUnit(SimVar.GetSimVarValue("AMBIENT PRESSURE", "inHg"), WT_Unit.IN_HG);
    }

    get temperature() {
        return new WT_NumberUnit(SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "Celsius"), WT_Unit.CELSIUS);
    }
}
WT_MapModelWeatherModule.NAME_DEFAULT = "weather";

class WT_MapModelAutopilotModule extends WT_MapModelModule {
    constructor(name = WT_MapModelAutopilotModule.NAME_DEFAULT) {
        super(name);
    }

    get altitudeTarget() {
        return new WT_NumberUnit(SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR", "feet"), WT_Unit.FOOT);
    }
}
WT_MapModelAutopilotModule.NAME_DEFAULT = "autopilot";