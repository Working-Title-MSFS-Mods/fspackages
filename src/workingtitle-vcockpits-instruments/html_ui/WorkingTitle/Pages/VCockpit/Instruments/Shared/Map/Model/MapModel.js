class WT_MapModel {
    constructor() {
        this._range = new WT_NumberUnit(0, WT_Unit.NMILE);
        this._optsManager = new WT_OptionsManager(this, WT_MapModel.OPTIONS_DEF);

        this.addComponent(new WT_MapModelAirplaneComponent());
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

    get altitude() {
        return new WT_NumberUnit(SimVar.GetSimVarValue("PLANE ALTITUDE", "feet"), WT_Unit.FOOT);
    }

    get groundspeed() {
        return new WT_NumberUnit(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots"), WT_Unit.KNOT);
    }

    get tas() {
        return new WT_NumberUnit(SimVar.GetSimVarValue("AIRSPEED TRUE", "knots"), WT_Unit.KNOT);
    }

    get verticalSpeed() {
        return new WT_NumberUnit(SimVar.GetSimVarValue("VERTICAL SPEED", "feet per minute"), WT_CompoundUnit.FPM);
    }
}
WT_MapModelAirplaneComponent.NAME_DEFAULT = "airplane";