class WT_Timer {
    constructor(id) {
        this._id = id;

        this._initialKey = `${WT_Timer.DATASTORE_KEY_INITIAL}-${id}`;
        this._activeKey = `${WT_Timer.DATASTORE_KEY_ACTIVE}-${id}`;
        this._modeKey = `${WT_Timer.DATASTORE_KEY_MODE}-${id}`;
        this._referenceKey = `${WT_Timer.DATASTORE_KEY_REFERENCE}-${id}`;
        this._valueKey = `${WT_Timer.DATASTORE_KEY_VALUE}-${id}`;

        this._value = new WT_TimerValue(this);
    }

    /**
     * @readonly
     * @property {String} id
     * @type {String}
     */
    get id() {
        return this._id;
    }

    /**
     * @readonly
     * @property {WT_NumberUnitReadOnly} value
     * @type {WT_NumberUnitReadOnly}
     */
    get value() {
        return this._value.readonly();
    }

    isPaused() {
        return !WTDataStore.get(this._activeKey, false);
    }

    getMode() {
        return WTDataStore.get(this._modeKey, WT_Timer.Mode.COUNT_UP);
    }

    _setInitial(value) {
        WTDataStore.set(this._initialKey, value);
    }

    _setActive(value) {
        WTDataStore.set(this._activeKey, value);
    }

    _setMode(value) {
        WTDataStore.set(this._modeKey, value);
    }

    _setReference(value) {
        WTDataStore.set(this._referenceKey, value);
    }

    _setValue(value) {
        WTDataStore.set(this._valueKey, value);
    }

    setMode(mode) {
        this.stop();
        this._setMode(mode);
    }

    /**
     *
     * @param {WT_NumberUnit} value
     */
    setInitialValue(value) {
        this._setInitial(value.asUnit(WT_Unit.SECOND));
    }

    syncToInitialValue() {
        this._setValue(WTDataStore.get(this._initialKey, 0));
        this._setReference(SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds"));
    }

    start() {
        if (!this.isPaused()) {
            return;
        }

        this._setActive(true);
        this._setReference(SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds"));
    }

    stop() {
        if (this.isPaused()) {
            return;
        }

        let currentTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds");
        this._updateValue(currentTime);
        this._setActive(false);
        this._setReference(currentTime);
    }

    reset() {
        if (this.getMode() === WT_Timer.Mode.COUNT_DOWN) {
            this._setValue(WTDataStore.get(this._initialKey, 0));
        } else {
            this._setValue(0);
        }
        this._setActive(false);
    }

    clear() {
        this._setInitial(0);
        this._setActive(false);
        this._setMode(WT_Timer.Mode.COUNT_UP);
        this._setValue(0);
    }

    _updateValue(currentTime) {
        if (this.isPaused()) {
            return;
        }

        let value = this._value.number;
        let sign = 0;
        switch (this.getMode()) {
            case WT_Timer.Mode.COUNT_UP:
                sign = 1;
                break;
            case WT_Timer.Mode.COUNT_DOWN:
                sign = -1;
                break;
        }
        value += sign * (currentTime - WTDataStore.get(this._referenceKey, 0));
        this._setValue(value);
    }

    _handleCountdownZero() {
        let value = this._value.number;
        if (!this.isPaused() && this.getMode() === WT_Timer.Mode.COUNT_DOWN && value <= 0) {
            value = Math.abs(value);
            this._setMode(WT_Timer.Mode.COUNT_UP);
            this._setValue(value);
        }
    }

    update() {
        let currentTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds");
        this._updateValue(currentTime);
        this._handleCountdownZero();
        this._setReference(currentTime);
    }
}
WT_Timer.DATASTORE_KEY_INITIAL = "WT_Timer_Initial";
WT_Timer.DATASTORE_KEY_ACTIVE = "WT_Timer_Active";
WT_Timer.DATASTORE_KEY_MODE = "WT_Timer_Mode";
WT_Timer.DATASTORE_KEY_REFERENCE = "WT_Timer_Reference";
WT_Timer.DATASTORE_KEY_VALUE = "WT_Timer_Value";
/**
 * @enum {Number}
 */
WT_Timer.Mode = {
    COUNT_UP: 0,
    COUNT_DOWN: 1
};

class WT_TimerValue extends WT_NumberUnit {
    /**
     * @param {WT_Timer} timer
     */
    constructor(timer) {
        super(0, WT_Unit.SECOND);

        this._timer = timer;
        this._valueKey = `${WT_Timer.DATASTORE_KEY_VALUE}-${this._timer.id}`;
    }

    _updateValue() {
        this._number = WTDataStore.get(this._valueKey, 0);
    }

    /**
     * @readonly
     * @property {Number} number
     * @type {Number}
     */
    get number() {
        this._updateValue();
        return super.number;
    }
}