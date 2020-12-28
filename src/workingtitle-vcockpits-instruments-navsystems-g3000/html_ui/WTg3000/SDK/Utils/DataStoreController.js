class WT_DataStoreController {
    constructor(id, model) {
        this._id = id;
        this._model = model;

        /**
         * @type {WT_DataStoreSettingLike[]}
         */
        this._settings = [];
    }

    /**
     * @readonly
     * @property {String} id - this controller's unique string ID.
     * @type {String}
     */
    get id() {
        return this._id;
    }

    /**
     * @readonly
     * @property {*} model - the model associated with this controller.
     * @type {*}
     */
    get model() {
        return this._model;
    }

    /**
     * Adds a setting to this controller.
     * @param {WT_DataStoreSettingLike} setting
     */
    addSetting(setting) {
        this._settings.push(setting);
    }

    /**
     * Initializes all settings attached to this controller.
     */
    init() {
        for (let setting of this._settings) {
            setting.init();
        }
    }

    /**
     * Updates the model and/or view associated with this controller using the current values of all attached settings.
     */
    update() {
        for (let setting of this._settings) {
            setting.update();
        }
    }

    /**
     * Sets the value of a setting.
     * @param {String} id - the string ID of the controller to which the setting belongs.
     * @param {String} settingKey - the data store key of the setting.
     * @param {*} value - the new value of the setting.
     */
    static setSettingValue(id, settingKey, value) {
        WTDataStore.set(`${id}.${settingKey}`, value);
    }

    /**
     * Gets the current value of a setting.
     * @param {String} id - the string ID of the controller to which the setting belongs.
     * @param {String} settingKey - the data store key of the setting.
     * @param {*} [defaultValue=0] - the default value to return if value can be retrieved from the data store.
     * @returns {*} the current value of the specified setting, or the default value if no current value can be found.
     */
    static getSettingValue(id, settingKey, defaultValue = 0) {
        return WTDataStore.get(`${id}.${settingKey}`, defaultValue);
    }
}

/**
 * @typedef {WT_DataStoreSetting|WT_DataStoreSettingGroup} WT_DataStoreSettingLike
 */

/**
 * A controller setting backed by the data store.
 */
class WT_DataStoreSetting {
    /**
     * @param {WT_DataStoreController} controller - the controller with which to associate the new setting.
     * @param {String} key - the data store key of the new setting.
     * @param {*} [defaultValue=0] - the value to which the new setting should default if it is not persistent or if a value cannot be retrieved
     *                               from the data store.
     * @param {Boolean} [autoUpdate] - whether the new setting should automatically update its associated model/view whenever its value
     *                                 changes. True by default.
     * @param {Boolean} [isPersistent] - whether the new setting persists across sessions.
     */
    constructor(controller, key, defaultValue = 0, autoUpdate = true, isPersistent = false) {
        this._controller = controller;
        this._key = key;
        this._defaultValue = defaultValue;
        this._autoUpdate = autoUpdate;
        this._isPersistent = isPersistent;

        this._fullDataStoreKey = `${controller.id}.${key}`;

        this._listeners = [];

        WTDataStore.addListener(this._onDataStoreChanged.bind(this), this._fullDataStoreKey);
    }

    /**
     * @readonly
     * @property {*} model - the model this setting controls.
     * @type {*}
     */
    get model() {
        return this._controller.model;
    }

    /**
     * @readonly
     * @property {String} key - the data store key of this setting.
     * @type {String}
     */
    get key() {
        return this._key;
    }

    /**
     * @readonly
     * @property {Boolean} persistent - whether this setting persists across sessions.
     * @type {Boolean}
     */
    get isPersistent() {
        return this._isPersistent;
    }

    /**
     * @readonly
     * @property {*} defaultValue - the value to which this setting defaults if it is not persistent or if a value cannot be retrieved
     *                              from the data store.
     * @type {*}
     */
    get defaultValue() {
        return this._defaultValue;
    }

    /**
     * Sets the value of this setting.
     * @param {*} value - the new value.
     */
    setValue(value) {
        WTDataStore.set(this._fullDataStoreKey, value);
    }

    /**
     * @returns {*} the current value of this setting.
     */
    getValue() {
        return WTDataStore.get(this._fullDataStoreKey, this._defaultValue);
    }

    /**
     * Adds a listener function to this setting that will be called every time this setting's value changes.
     * @param {Function} listener - a listener function that takes three arguments: setting, newValue, and oldValue.
     */
    addListener(listener) {
        this._listeners.push(listener);
    }

    /**
     * Removes a listener from this setting.
     * @param {Function} listener - the listener function to remove.
     */
    removeListener(listener) {
        let index = this._listeners.indexOf(listener);
        if (index >= 0) {
            this._listeners.splice(index, 1);
        }
    }

    /**
     * Initializes this setting.
     */
    init() {
        if (!this.isPersistent) {
            this.setValue(this.defaultValue);
        } else {
            this.setValue(this.getValue());
        }
    }

    /**
     * Updates the model and/or view controlled by this setting.
     */
    update() {
    }

    _onValueChanged(newValue, oldValue) {
        if (newValue !== oldValue) {
            if (this._autoUpdate) {
                this.update();
            }
            for (let listener of this._listeners) {
                listener(this, newValue, oldValue);
            }
        }
    }

    _onDataStoreChanged(key, newValue, oldValue) {
        this._onValueChanged(newValue, oldValue);
    }
}

/**
 * This is a convenience class for bundling together multiple data store settings that should logically be handled as a group.
 */
class WT_DataStoreSettingGroup {
    /**
     * @param {WT_DataStoreController} controller - the WT_MapElement object to associate the setting group with.
     * @param {Iterable<WT_DataStoreSettingLike>} [settings] - an Iterable of WT_DataStoreSetting or WT_DataStoreSettingGroup objects to be added to this group.
     * @param {Boolean} [autoUpdate] - whether the new setting group should automatically update its associated model/view whenever the value
     *                                 of any of its consituent settings changes. False by default.
     */
    constructor(controller, settings = [], autoUpdate = false) {
        this._controller = controller;
        this._autoUpdate = autoUpdate;

        this._listeners = [];

        this._settings = Array.from(settings);
        for (let setting of this._settings) {
            setting.addListener(this._onChildSettingChanged.bind(this));
        }
    }

    /**
     * @readonly
     * @property {*} model - the model this setting group controls.
     * @type {*}
     */
    get model() {
        return this._controller.model;
    }

    /**
     * @returns {WT_DataStoreSettingLike[]}
     */
    getSettings() {
        return Array.from(this._settings);
    }

    /**
     * @returns {Array} an array of values of the settings in this group. The order is the same as that in which the settings were
     *                  originally added to this group.
     */
    getValue() {
        return this._settings.map(setting => setting.getValue());
    }

    /**
     * Adds a setting to this group.
     * @param {WT_DataStoreSettingLike} setting - the setting to add.
     */
    addSetting(setting) {
        this._settings.push(setting);
        setting.addListener(this._onChildSettingChanged.bind(this));
    }

    /**
     * Adds a listener function to this setting group that will be called every time the value of one of this group's settings
     * changes.
     * @param {Function} listener - a listener function that takes three arguments: setting, newValue, and oldValue.
     */
    addListener(listener) {
        this._listeners.push(listener);
    }

    /**
     * Removes a listener from this setting group.
     * @param {Function} listener - the listener function to remove.
     */
    removeListener(listener) {
        let index = this._listeners.indexOf(listener);
        if (index >= 0) {
            this._listeners.splice(index, 1);
        }
    }

    /**
     * Initializes this setting group by recursively initializing all settings belonging to this group.
     */
    init() {
        for (let setting of this._settings) {
            setting.init();
        }
    }

    /**
     * Updates the model and/or view controlled by this setting group.
     */
    update() {
        for (let setting of this._settings) {
            setting.update();
        }
    }

    _onChildSettingChanged(setting, newValue, oldValue) {
        if (this._autoUpdate) {
            this.update();
        }
        for (let listener of this._listeners) {
            listener(setting, newValue, oldValue);
        }
    }
}