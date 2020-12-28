/**
 * A manager for options properties. The manager defines a set of options and their default values for a parent object and optionally creates
 * getters and setters for those options in the parent object. Option values may be set and retrieved en bloc using options objects.
 * Options may also be dynamically added and removed.
 */
class WT_OptionsManager {
    /**
     * @param {Object} parent - the parent object for which to manage options.
     * @param {Object} optionDefs - an object that defines a set of options. The option definition object should have one property per option,
     *                              whose value is an object with two properties: default and auto. The default property defines the default
     *                              value of the option. The auto property indicates whether the manager should automatically create a getter
     *                              and setter in the parent object for the option.
     */
    constructor(parent, optionDefs) {
        this.parent = parent;
        this._optionDefs = {};

        this.addOptions(optionDefs);
    }

    _initOption(opt, optionDef) {
        this._optionDefs[opt] = {
            default: optionDef.default === undefined ? undefined : optionDef.default,
            auto: optionDef.auto === undefined ? false : optionDef.auto,
            observed: optionDef.observed === undefined ? false : optionDef.observed,
            equals: optionDef.equals,
            readOnly: optionDef.readOnly === undefined ? false : optionDef.readOnly
        };

        if (this._optionDefs[opt].auto) {
            let definition = {
                get() {return this[`_${opt}`];},
                configurable: true
            };
            if (!this._optionDefs[opt].readOnly) {
                if (this._optionDefs[opt].observed) {
                    let equals = this._optionDefs[opt].equals
                    definition["set"] = function(value) {
                        let changed = false;
                        let old = this[`_${opt}`];
                        if (equals) {
                            changed = !equals(old, value);
                        } else {
                            changed = (value !== old);
                        }
                        if (changed) {
                            this[`_${opt}`] = value;
                            this.onOptionChanged(opt, old, value);
                        }
                    };
                } else {
                    definition["set"] = function(value) {this[`_${opt}`] = value;};
                }
            }
            Object.defineProperty(this.parent, opt, definition);
        }
        if (!this._optionDefs[opt].readOnly && this._optionDefs[opt].default !== undefined) {
            this.parent[opt] = optionDef.default;
        }
    }

    _cleanupOption(opt) {
        delete this.parent[opt];
        delete this._optionDefs[opt];
    }

    /**
     * Gets whether an option is defined in this manager.
     * @param {String} opt - the name of the option.
     * @returns {Boolean} whether the option is defined in this manager.
     */
    hasOption(opt) {
        return this._optionDefs[opt] !== undefined;
    }

    /**
     * Adds options to this manager.
     * @param {Object} optionDefs - an object that defines a set of options. The option definition object should have one property per option,
     *                              whose value is an object with two properties: default and auto. The default property defines the default
     *                              value of the option. The auto property indicates whether the manager should automatically create a getter
     *                              and setter in the parent object for the option.
     */
    addOptions(optionDefs) {
        for (let opt in optionDefs) {
            if (!this.hasOption(opt)) {
                this._initOption(opt, optionDefs[opt]);
            }
        }
    }

    /**
     * Removes options from this manager. This will also remove associated getters and setters from the parent object.
     * @param {Iterable<String>} options - an iterable of names of options to remove.
     */
    removeOptions(options) {
        for (let opt of options) {
            if (this.hasOption(opt)) {
                this._cleanupOption(opt);
            }
        }
    }

    /**
     * Sets the values of an arbitrary number of options en bloc.
     * @param {Object} optionsObj - an object containing one property for each option to set whose value is the new value to set for the option.
     */
    setOptions(optionsObj) {
        for (let opt in optionsObj) {
            if (this.hasOption(opt) && !this._optionDefs[opt].readOnly) {
                this.parent[opt] = optionsObj[opt];
            }
        }
    }

    /**
     * Retrieves the values of an arbitrary number of options en bloc.
     * @param {Object} optionsObj - an object containing one property for each option for which to retrieve a value. The value of each property will be
     *                              replaced with the current option value of the property's associated option.
     */
    getOptions(optionsObj) {
        for (let opt in optionsObj) {
            if (this.hasOption(opt)) {
                optionsObj[opt] = this.parent[opt];
            }
        }
    }

    /**
     * Retrieves the values of an arbitrary number of options en bloc.
     * @param {Iterable<String>} options - an iterable of names of options whose values should be retrieved.
     * @returns {Object} an object containing one property for each option whose value was retrieved. The value of each property is set to the current
     *                   option value of the property's associated option.
     */
    getOptionsFromList(options) {
        let optionsObj = {};
        for (let opt of options) {
            if (this.hasOption(opt)) {
                optionsObj[opt] = this.parent[opt];
            }
        }
        return optionsObj;
    }
}

/**
 * @typedef {WT_OptionsDefinition}
 * @property {*} [default] - the default (initial) value of the option. Undefined by default.
 * @property {Boolean} [auto] - whether to automatically create a getter and setter for the option. False by default.
 * @property {Boolean} [observed] - whether to observe the option for changes. False by default. When an observed option changes values,
 *                                  a call is made to the .onOptionChanged() method of the option's parent object. This operation is only
 *                                  performed automatically if the option's auto property is set to true.
 * @property {Function} [equals] - an optional equality function to use when determining equality for two values of the option. The
 *                                 function should accept two arguments and return true if and only if the two arguments are to be
 *                                 considered equal. Used to determine whether .onOptionChanged() should be called when the option's value
 *                                 is set. If an explicit comparator function is not provided, then the built-in strict equality (===)
 *                                 operator is used.
 * @property {Boolean} [readonly] - whether the option is considered to be read-only. False by default. Read-only options can (optionally) have a
 *                                  default value, but otherwise cannot be changed via the .setOptions() method. Additionally, if the auto property
 *                                  for the option is true, a setter will not be created for the option.
 */