/**
 * Model for a navigational map. The base model defines only the basic parameters of a map, which are its nominal range, target position, and rotation.
 * The model can be expanded with more parameters through the addition of optional modules. By default, three modules are automatically included:
 * * .airplane - contains parameters related to the status of the player aircraft.
 * * .weather - contains parameters related to the weather and outside environment.
 * * .autopilot - contains parameters related to the player aircraft's autopilot.
 * @property {LatLong} target - the target position (lat/long) of the map.
 * @property {Number} rotation - the rotation of the map in degrees. A value of 0 indicates North up, with increasing values proceeding clockwise.
 */
class WT_MapModel {
    constructor() {
        this._range = new WT_NumberUnit(0, WT_Unit.NMILE);
        this._optsManager = new WT_OptionsManager(this, WT_MapModel.OPTIONS_DEF);

        this.addModule(new WT_MapModelAirplaneModule());
        this.addModule(new WT_MapModelWeatherModule());
        this.addModule(new WT_MapModelAutopilotModule());
    }

    /**
     * @property {WT_NumberUnit} range - the nominal range of the map.
     * @type {WT_NumberUnit}
     */
    get range() {
        return this._range.copy();
    }

    set range(range) {
        this._range.copyFrom(range);
    }

    /**
     * Sets this model's options with an options object.
     * @param {*} opts - the options object containing the new option values.
     */
    setOptions(opts) {
        this._optsManager.setOptions(opts);
    }

    /**
     * Adds a module to this model. After a module is added, it can be referenced as a property of this model,
     * whose name is given by the module's name property.
     * @param {WT_MapModelModule} module - the module to add.
     */
    addModule(module) {
        this[module.name] = module;
        let optsDef = {};
        optsDef[`${module.name}Options`] = {default: {}, auto: true};
        this._optsManager.addOptions(optsDef);
    }

    /**
     * Removes a module from this model.
     * @param {WT_MapModelModule} module - the module to remove.
     */
    removeModule(module) {
        this.removeModuleByName(module.name);
    }

    /**
     * Removes a module from this model by name.
     * @param {String} name - the name of the module to remove.
     */
    removeModuleByName(name) {
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

/**
 * A module for WT_MapModel.
 */
class WT_MapModelModule {
    /**
     * @param {String} name - the name of the new module. Once the module is added to a model, it will be accessed from the model using its name.
     */
    constructor(name) {
        this._name = name;

        this._optsManager = new WT_OptionsManager(this, WT_MapModelModule.OPTIONS_DEF);
    }

    /**
     * @readonly
     * @property {String} name - the name of this module.
     * @type {String}
     */
    get name() {
        return this._name;
    }

    /**
     * Sets this module's options with an options object.
     * @param {*} opts - the options object containing the new option values.
     */
    setOptions(opts) {
        this._optsManager.setOptions(opts);
    }
}

class WT_MapModelAirplaneModule extends WT_MapModelModule {
    constructor(name = WT_MapModelAirplaneModule.NAME_DEFAULT) {
        super(name);
    }

    /**
     * @readonly
     * @property {LatLong} position - the current position of the airplane on the earth.
     * @type {LatLong}
     */
    get position() {
        return new LatLong(SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude"), SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude"));
    }

    /**
     * @readonly
     * @property {Number} headingTrue - the true heading of the airplane in degrees.
     * @type {Number}
     */
    get headingTrue() {
        return SimVar.GetSimVarValue("PLANE HEADING DEGREES TRUE", "degree");
    }

    /**
     * @readonly
     * @property {Number} trackTrue - the true track of the airplane in degrees.
     * @type {Number}
     */
    get trackTrue() {
        return SimVar.GetSimVarValue("GPS GROUND TRUE TRACK", "degree");
    }

    /**
     * @readonly
     * @property {Number} turnSpeed - the current turn speed of the airplane in degrees per second.
     * @type {Number}
     */
    get turnSpeed() {
        return SimVar.GetSimVarValue("DELTA HEADING RATE", "degrees per second");
    }

    /**
     * @readonly
     * @property {Number} magVar - the magnetic variation, in degrees, at the current position of the airplane.
     * @type {Number}
     */
    get magVar() {
        return SimVar.GetSimVarValue("GPS MAGVAR", "degree");
    }

    /**
     * @readonly
     * @property {WT_NumberUnit} altitude - the current altitude of the airplane. Default unit is feet.
     * @type {WT_NumberUnit}
     */
    get altitude() {
        return new WT_NumberUnit(SimVar.GetSimVarValue("PLANE ALTITUDE", "feet"), WT_Unit.FOOT);
    }

    /**
     * @readonly
     * @property {WT_NumberUnit} altitudeIndicated - the current indicated altitude of the airplane. Default unit is feet.
     * @type {WT_NumberUnit}
     */
    get altitudeIndicated() {
        return new WT_NumberUnit(SimVar.GetSimVarValue("INDICATED ALTITUDE", "feet"), WT_Unit.FOOT);
    }

    /**
     * @readonly
     * @property {WT_NumberUnit} groundSpeed - the current ground speed of the airplane. Default unit is knots.
     * @type {WT_NumberUnit}
     */
    get groundSpeed() {
        return new WT_NumberUnit(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots"), WT_Unit.KNOT);
    }

    /**
     * @readonly
     * @property {WT_NumberUnit} tas - the current true airspeed of the airplane. Default unit is knots.
     * @type {WT_NumberUnit}
     */
    get tas() {
        return new WT_NumberUnit(SimVar.GetSimVarValue("AIRSPEED TRUE", "knots"), WT_Unit.KNOT);
    }

    /**
     * @readonly
     * @property {WT_NumberUnit} verticalSpeed - the current vertical speed of the airplane. Default unit is feet per minute.
     * @type {WT_NumberUnit}
     */
    get verticalSpeed() {
        return new WT_NumberUnit(SimVar.GetSimVarValue("VERTICAL SPEED", "feet per minute"), WT_CompoundUnit.FPM);
    }

    /**
     * @readonly
     * @property {Boolean} isOnGround - whether the airplane is currently on the ground.
     * @type {Boolean}
     */
    get isOnGround() {
        return SimVar.GetSimVarValue("SIM ON GROUND", "bool");
    }

    /**
     * @readonly
     * @property {WT_NumberUnit} fuelOnboard - the current amount of fuel remaining on the airplane. Default unit is gallons.
     * @type {WT_NumberUnit}
     */
    get fuelOnboard() {
        return new WT_NumberUnit(SimVar.GetSimVarValue("FUEL TOTAL QUANTITY", "gallons"), WT_Unit.GALLON);
    }

    /**
     * @readonly
     * @property {WT_NumberUnit} fuelFlowTotal - the current total fuel consumption of the airplane. Default unit is gallons per hour.
     * @type {WT_NumberUnit}
     */
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

    /**
     * @readonly
     * @property {WT_NumberUnit} windSpeed - the current wind speed at the airplane's position. Default unit is knots.
     * @type {WT_NumberUnit}
     */
    get windSpeed() {
        return new WT_NumberUnit(SimVar.GetSimVarValue("AMBIENT WIND VELOCITY", "knots"), WT_Unit.KNOT);
    }

    /**
     * @readonly
     * @property {Number} windDirection - the current wind direction at the airplane's position in degrees.
     * @type {Number}
     */
    get windDirection() {
        return SimVar.GetSimVarValue("AMBIENT WIND DIRECTION", "degree");
    }

    /**
     * @readonly
     * @property {WT_NumberUnit} airPressure - the current air pressure at the airplane's position. Default unit is inches of mercury.
     * @type {WT_NumberUnit}
     */
    get airPressure() {
        return new WT_NumberUnit(SimVar.GetSimVarValue("AMBIENT PRESSURE", "inHg"), WT_Unit.IN_HG);
    }

    /**
     * @readonly
     * @property {WT_NumberUnit} temperature - the current air temperature at the airplane's position. Default unit is degrees Celsius.
     * @type {WT_NumberUnit}
     */
    get temperature() {
        return new WT_NumberUnit(SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "Celsius"), WT_Unit.CELSIUS);
    }
}
WT_MapModelWeatherModule.NAME_DEFAULT = "weather";

class WT_MapModelAutopilotModule extends WT_MapModelModule {
    constructor(name = WT_MapModelAutopilotModule.NAME_DEFAULT) {
        super(name);
    }

    /**
     * @readonly
     * @property {WT_NumberUnit} altitudeTarget - the current autopilot target altitude. Default unit is feet.
     * @type {WT_NumberUnit}
     */
    get altitudeTarget() {
        return new WT_NumberUnit(SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR", "feet"), WT_Unit.FOOT);
    }
}
WT_MapModelAutopilotModule.NAME_DEFAULT = "autopilot";