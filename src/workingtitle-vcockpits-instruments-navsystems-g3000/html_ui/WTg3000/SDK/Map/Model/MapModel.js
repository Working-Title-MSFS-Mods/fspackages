/**
 * Model for a navigational map. The base model defines only the basic parameters of a map, which are its nominal range, target position, and rotation.
 * The model can be expanded with more parameters through the addition of optional modules. By default, three modules are automatically included:
 * * .weather - contains parameters related to the weather and outside environment.
 * * .autopilot - contains parameters related to the player aircraft's autopilot.
 * * .units - contains parameters related to the display of measurement units.
 * @property {LatLong} target - the target position (lat/long) of the map.
 * @property {Number} rotation - the rotation of the map in degrees. A value of 0 indicates North up, with increasing values proceeding clockwise.
 */
class WT_MapModel {
    /**
     * @param {WT_PlayerAirplane} airplane - the player airplane.
     */
    constructor(airplane) {
        this._airplane = airplane;
        this._target = new WT_GeoPoint(0, 0);
        this._range = new WT_NumberUnit(5, WT_Unit.NMILE);

        this._optsManager = new WT_OptionsManager(this, WT_MapModel.OPTIONS_DEF);

        this.addModule(new WT_MapModelUnitsModule());
    }

    /**
     * The target point of the map.
     * @type {WT_GeoPoint}
     */
    get target() {
        return this._target.readonly();
    }

    set target(target) {
        this._target.set(target);
    }

    /**
     * The nominal range of the map.
     * @type {WT_NumberUnit}
     */
    get range() {
        return this._range.readonly();
    }

    set range(range) {
        this._range.set(range);
    }

    /**
     * The player airplane.
     * @readonly
     * @type {WT_PlayerAirplane}
     */
    get airplane() {
        return this._airplane;
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

class WT_MapModelUnitsModule extends WT_MapModelModule {
    constructor(name = WT_MapModelUnitsModule.NAME_DEFAULT) {
        super(name);

        this._optsManager.addOptions(WT_MapModelUnitsModule.OPTIONS_DEF);
    }
}
WT_MapModelUnitsModule.NAME_DEFAULT = "units";
WT_MapModelUnitsModule.OPTIONS_DEF = {
    bearing: {default: new WT_NavAngleUnit(true), auto: true},
    distance: {default: WT_Unit.NMILE, auto: true},
    speed: {default: WT_Unit.KNOT, auto: true},
    verticalSpeed: {default: WT_Unit.FPM, auto: true},
    altitude: {default: WT_Unit.FOOT, auto: true}
};