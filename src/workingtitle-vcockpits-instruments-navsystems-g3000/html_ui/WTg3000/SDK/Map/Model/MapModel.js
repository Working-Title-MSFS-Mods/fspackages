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
        this._target = new WT_GeoPoint(0, 0);
        this._range = new WT_NumberUnit(5, WT_Unit.NMILE);

        this._optsManager = new WT_OptionsManager(this, WT_MapModel.OPTIONS_DEF);

        this.addModule(new WT_MapModelAirplaneModule());
        this.addModule(new WT_MapModelWeatherModule());
        this.addModule(new WT_MapModelAutopilotModule());
    }

    /**
     * @property {WT_GeoPoint} target - the target point of the map.
     * @type {WT_GeoPoint}
     */
    get target() {
        return this._target.readonly();
    }

    set target(target) {
        this._target.set(target);
    }

    /**
     * @property {WT_NumberUnit} range - the nominal range of the map.
     * @type {WT_NumberUnit}
     */
    get range() {
        return this._range.readonly();
    }

    set range(range) {
        this._range.set(range);
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
    target: {},
    range: {},
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
     * @property {WT_AirplaneModel} model - model object for the player aircraft.
     * @type {WT_AirplaneModel}
     */
    get model() {
        return WT_AirplaneModel.INSTANCE;
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