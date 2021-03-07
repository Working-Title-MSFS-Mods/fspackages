class WT_SpeedBugCollection {
    constructor(id) {
        this._bugs = [];
        this._controller = new WT_DataStoreController(id, null);
    }

    /**
     * @readonly
     * @property {String} id
     * @type {String}
     */
    get id() {
        return this._controller.id;
    }

    countBugs() {
        return this._bugs.length;
    }

    getBug(name) {
        return this._bugs.find(bug => bug.name === name);
    }

    addBug(name, defaultSpeed) {
        this._bugs.push(new WT_SpeedBug(name, defaultSpeed, this._controller));
    }

    forEachBug(func) {
        this._bugs.forEach(func);
    }
}

class WT_SpeedBug {
    /**
     * @param {String} name
     * @param {WT_NumberUnit} defaultSpeed
     * @param {WT_DataStoreController} controller
     */
    constructor(name, defaultSpeed, controller) {
        this._name = name;
        this._defaultSpeed = WT_Unit.KNOT.createNumber(defaultSpeed.asUnit(WT_Unit.KNOT));
        this._speed = this._defaultSpeed.copy();
        this._show = false;

        this._listeners = [];

        this._initSettings(controller);
    }

    _initSettings(controller) {
        this._initSpeedSetting(controller);
        this._initShowSetting(controller);
    }

    _initSpeedSetting(controller) {
        this._speedSetting = new WT_SpeedBugSpeedSetting(controller, this);
        this._speedSetting.addListener(this._onSpeedSettingChanged.bind(this));
        this._speedSetting.init();
    }

    _initShowSetting(controller) {
        this._showSetting = new WT_SpeedBugShowSetting(controller, this);
        this._showSetting.addListener(this._onShowSettingChanged.bind(this));
        this._showSetting.init();
    }

    /**
     * @readonly
     * @property {String} name
     * @type {String}
     */
    get name() {
        return this._name;
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} defaultSpeed
     * @type {WT_NumberUnitReadOnly}
     */
    get defaultSpeed() {
        return this._defaultSpeed.readonly();
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} speed
     * @type {WT_NumberUnitReadOnly}
     */
    get speed() {
        return this._speed;
    }

    /**
     * @readonly
     * @property {Boolean} show
     * @type {Boolean}
     */
    get show() {
        return this._show;
    }

    setSpeed(speed) {
        this._speedSetting.setValue(speed.asUnit(WT_Unit.KNOT));
    }

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
     * @param {WT_DataStoreController} controller
     * @param {WT_SpeedBug} bug
     */
    constructor(controller, bug) {
        super(controller, `${WT_SpeedBugSpeedSetting.KEY_PREFIX}_${bug.name}_${WT_SpeedBugSpeedSetting.KEY_SUFFIX}`, bug.defaultSpeed.number, false, false);

        this._bug = bug;
    }
}
WT_SpeedBugSpeedSetting.KEY_PREFIX = "WT_SpeedBug";
WT_SpeedBugSpeedSetting.KEY_SUFFIX = "Speed";

class WT_SpeedBugShowSetting extends WT_DataStoreSetting {
    constructor(controller, bug, defaultValue = false) {
        super(controller, `${WT_SpeedBugShowSetting.KEY_PREFIX}_${bug.name}_${WT_SpeedBugShowSetting.KEY_SUFFIX}`, defaultValue, false, false);

        this._bug = bug;
    }
}
WT_SpeedBugShowSetting.KEY_PREFIX = "WT_SpeedBug";
WT_SpeedBugShowSetting.KEY_SUFFIX = "Show";