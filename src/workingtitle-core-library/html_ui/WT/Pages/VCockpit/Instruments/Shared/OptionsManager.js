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
            readOnly: optionDef.readOnly === undefined ? false : optionDef.readOnly
        };

        if (this._optionDefs[opt].auto) {
            let definition = {
                get() {return this[`_${opt}`];},
                configurable: true
            };
            if (!this._optionDefs[opt].readOnly) {
                if (this._optionDefs[opt].observed) {
                    definition["set"] = function(value) {
                        let old = this[`_${opt}`];
                        if (old !== value) {
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