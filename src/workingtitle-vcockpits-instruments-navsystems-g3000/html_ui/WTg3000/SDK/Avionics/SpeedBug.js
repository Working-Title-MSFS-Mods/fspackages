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
        this._setting = new WT_SpeedBugSetting(controller, this);
        this._setting.addListener(this._onSettingChanged.bind(this));
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

    setSpeed(speed) {
        this._setting.setValue(speed.asUnit(WT_Unit.KNOT));
    }

    _onSettingChanged(setting, newValue, oldValue) {
        this._speed.set(newValue);
    }
}

class WT_SpeedBugSetting extends WT_DataStoreSetting {
    /**
     * @param {WT_DataStoreController} controller
     * @param {WT_SpeedBug} bug
     */
    constructor(controller, bug) {
        super(controller, WT_SpeedBugSetting.KEY_PREFIX + bug.name, bug.defaultSpeed.number, false, false);

        this._bug = bug;
    }
}
WT_SpeedBugSetting.KEY_PREFIX = "WT_SpeedBug_";