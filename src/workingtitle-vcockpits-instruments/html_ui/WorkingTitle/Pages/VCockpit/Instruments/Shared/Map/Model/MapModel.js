class WT_MapModel {
    constructor() {
        this._range = new WT_NumberUnit(0, WT_Unit.NMILE);
        this._optsManager = new WT_OptionsManager(this, WT_MapModel.OPTIONS_DEF);

        this.addComponent(new WT_MapModelAirplaneComponent());
        this.addComponent(new WT_MapModelWeatherComponent());
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

class WT_MapModelComponent {
    constructor(name) {
        this._name = name;

        this._optsManager = new WT_OptionsManager(this, WT_MapModelComponent.OPTIONS_DEF);
    }

    get name() {
        return this._name;
    }

    setOptions(opts) {
        this._optsManager.setOptions(opts);
    }
}

class WT_MapModelAirplaneComponent extends WT_MapModelComponent {
    constructor(name = WT_MapModelAirplaneComponent.NAME_DEFAULT) {
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
}
WT_MapModelAirplaneComponent.NAME_DEFAULT = "airplane";

class WT_MapModelWeatherComponent extends WT_MapModelComponent {
    constructor(name = WT_MapModelWeatherComponent.NAME_DEFAULT) {
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
WT_MapModelWeatherComponent.NAME_DEFAULT = "weather";