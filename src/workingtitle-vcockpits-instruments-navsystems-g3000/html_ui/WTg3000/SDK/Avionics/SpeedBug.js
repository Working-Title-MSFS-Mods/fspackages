/**
 * A collection of speed bugs.
 */
class WT_SpeedBugCollection {
    /**
     * @param {String} id - a unique ID to assign to the new collection.
     */
    constructor(id) {
        this._bugs = [];
        this._bugsReadOnly = new WT_ReadOnlyArray(this._bugs);
        this._settingModel = new WT_DataStoreSettingModel(id);
    }

    /**
     * This collection's unique ID.
     * @readonly
     * @type {String}
     */
    get id() {
        return this._settingModel.id;
    }

    /**
     * A read-only array of the speed bugs in this collection.
     * @readonly
     * @type {WT_ReadOnlyArray<WT_SpeedBug>}
     */
    get array() {
        return this._bugsReadOnly;
    }

    /**
     * Counts the number of speed bugs in this collection.
     * @returns {Number} the number of speed bugs in this collection.
     */
    countBugs() {
        return this._bugs.length;
    }

    /**
     * Finds a speed bug in this collection by name.
     * @param {String} name - the name of the speed bug for which to search.
     * @returns {WT_SpeedBug} the
     */
    getBug(name) {
        return this._bugs.find(bug => bug.name === name);
    }

    /**
     * Adds a speed bug to this collection.
     * @param {String} name - the name of the new speed bug.
     * @param {WT_NumberUnit} defaultSpeed - the default speed of the new speed bug.
     */
    addBug(name, defaultSpeed) {
        this._bugs.push(new WT_SpeedBug(name, defaultSpeed, this._settingModel));
    }
}

/**
 * A speed bug.
 */
class WT_SpeedBug {
    /**
     * @param {String} name - the name of the new speed bug.
     * @param {WT_NumberUnit} defaultSpeed - the default speed of the new speed bug.
     * @param {WT_DataStoreSettingModel} settingModel - the setting model to use for the new speed bug's settings.
     */
    constructor(name, defaultSpeed, settingModel) {
        this._name = name;
        this._defaultSpeed = WT_Unit.KNOT.createNumber(defaultSpeed.asUnit(WT_Unit.KNOT));
        this._speed = this._defaultSpeed.copy();
        this._show = false;

        this._listeners = [];

        this._initSettings(settingModel);
    }

    _initSettings(settingModel) {
        this._initSpeedSetting(settingModel);
        this._initShowSetting(settingModel);
    }

    _initSpeedSetting(settingModel) {
        this._speedSetting = new WT_SpeedBugSpeedSetting(settingModel, this);
        this._speedSetting.addListener(this._onSpeedSettingChanged.bind(this));
        this._speedSetting.init();
    }

    _initShowSetting(settingModel) {
        this._showSetting = new WT_SpeedBugShowSetting(settingModel, this);
        this._showSetting.addListener(this._onShowSettingChanged.bind(this));
        this._showSetting.init();
    }

    /**
     * The name of this speed bug.
     * @readonly
     * @type {String}
     */
    get name() {
        return this._name;
    }

    /**
     * The default speed of this speed bug.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get defaultSpeed() {
        return this._defaultSpeed.readonly();
    }

    /**
     * The current set speed of this speed bug.
     * @readonly
     * @type {WT_NumberUnitReadOnly}
     */
    get speed() {
        return this._speed;
    }

    /**
     * Whether this speed bug should be shown.
     * @readonly
     * @type {Boolean}
     */
    get show() {
        return this._show;
    }

    /**
     * Sets this speed bug's speed.
     * @param {WT_NumberUnit} speed - the new speed.
     */
    setSpeed(speed) {
        this._speedSetting.setValue(speed.asUnit(WT_Unit.KNOT));
    }

    /**
     * Sets whether this speed bug should be shown.
     * @param {Boolean} value - whether this speed bug should be shown.
     */
    setShow(value) {
        this._showSetting.setValue(value);
    }

    _notifyListeners(event) {
        let speedBug = this;
        this._listeners.forEach(listener => listener(speedBug, event));
    }

    _onSpeedSettingChanged(setting, newValue, oldValue) {
        this._speed.set(newValue);
        this._notifyListeners(WT_SpeedBug.Event.SPEED_CHANGED);
    }

    _onShowSettingChanged(setting, newValue, oldValue) {
        this._show = newValue;
        this._notifyListeners(WT_SpeedBug.Event.SHOW_CHANGED);
    }

    addListener(listener) {
        this._listeners.push(listener);
    }

    removeListener(listener) {
        let index = this._listeners.indexOf(listener);
        if (index >= 0) {
            this._listeners.splice(index, 1);
        }
    }
}
/**
 * @enum {String}
 */
WT_SpeedBug.Event = {
    SPEED_CHANGED: "speed",
    SHOW_CHANGED: "show"
}

class WT_SpeedBugSpeedSetting extends WT_DataStoreSetting {
    /**
     * @param {WT_DataStoreSettingModel} model
     * @param {WT_SpeedBug} bug
     */
    constructor(model, bug) {
        super(model, `${WT_SpeedBugSpeedSetting.KEY_PREFIX}_${bug.name}_${WT_SpeedBugSpeedSetting.KEY_SUFFIX}`, bug.defaultSpeed.number, false, false);

        this._bug = bug;
    }
}
WT_SpeedBugSpeedSetting.KEY_PREFIX = "WT_SpeedBug";
WT_SpeedBugSpeedSetting.KEY_SUFFIX = "Speed";

class WT_SpeedBugShowSetting extends WT_DataStoreSetting {
    constructor(model, bug, defaultValue = false) {
        super(model, `${WT_SpeedBugShowSetting.KEY_PREFIX}_${bug.name}_${WT_SpeedBugShowSetting.KEY_SUFFIX}`, defaultValue, false, false);

        this._bug = bug;
    }
}
WT_SpeedBugShowSetting.KEY_PREFIX = "WT_SpeedBug";
WT_SpeedBugShowSetting.KEY_SUFFIX = "Show";