class WT_MapSymbolShowSetting extends WT_MapSetting {
    /**
     *
     * @param {WT_MapController} controller - the controller with which to associate the new setting.
     * @param {String} componentName
     * @param {String} symbolID
     * @param {String} optionName
     * @param {String} key
     * @param {WT_MapSetting} dcltrSetting
     * @param {Boolean} [isSyncable] - whether any settings belonging to the new group are sync-able. True by default.
     */
    constructor(controller, symbolID, componentName, optionName, key, dcltrSetting, isSyncable = true, isPersistent = true) {
        super(controller, key, true, isSyncable, true, isPersistent);

        this._dcltrSetting = dcltrSetting;
        this._dcltrSetting.addListener(this._dcltrSettingChanged.bind(this));

        this._symbolID = symbolID;
        this._componentName = componentName;
        this._optionName = optionName;
    }

    get symbolID() {
        return this._symbolID;
    }

    get showSetting() {
        return this._showSetting;
    }

    get dcltrSetting() {
        return this._dcltrSetting;
    }

    update() {
        this.model[this._componentName][this._optionName] =
            this.getValue() &&
            !this.dcltrSetting.isDecluttered(this.symbolID);
    }

    _dcltrSettingChanged(setting, newValue, oldValue) {
        this.update();
    }
}

/**
 * A setting controlling map declutter. An arbitrary number of declutter levels are supported.
 */
class WT_MapDCLTRSetting extends WT_MapSetting {
    /**
     * @param {WT_MapController} controller - the controller with which to associate the new setting.
     * @param {WT_NumberUnit[]} dcltrTable - an array of map zoom ranges.
     * @param {WT_NumberUnit} defaultValue - the default maximum range of the new setting.
     * @param {Boolean} [isSyncable] - whether the new setting is sync-able. True by default.
     * @param {Boolean} [isPersistent] - whether the new setting persists across sessions.
     * @param {String} [key] - the data store key of the new setting.
     */
    constructor(controller, dcltrTable, defaultValue = 0, isSyncable = true, isPersistent = true, key = WT_MapDCLTRSetting.KEY_DEFAULT) {
        super(controller, key, defaultValue, isSyncable, false, isPersistent);
        this._dcltrTable = dcltrTable;
    }

    isDecluttered(symbolID) {
        let value = this._dcltrTable[this.getValue()][symbolID];
        return value === true;
    }
}
WT_MapDCLTRSetting.KEY_DEFAULT = "WT_Map_DCLTR";

/**
 * A setting controlling the maximum zoom range at which a type of map symbol remains visible.
 */
class WT_MapSymbolRangeSetting extends WT_MapSetting {
    /**
     * @param {WT_MapController} controller - the controller with which to associate the new setting.
     * @param {String} key - the data store key of the new setting.
     * @param {WT_NumberUnit[]} ranges - an array of map zoom ranges.
     * @param {WT_NumberUnit} defaultRange - the default maximum range of the new setting.
     * @param {Boolean} [isSyncable] - whether the new setting is sync-able. True by default.
     * @param {Boolean} [isPersistent] - whether the new setting persists across sessions.
     */
    constructor(controller, key, componentName, optionName, ranges, defaultRange, isSyncable = true, isPersistent = true) {
        super(controller, key, ranges.findIndex(range => range.equals(defaultRange)), isSyncable, true, isPersistent);

        this._componentName = componentName;
        this._optionName = optionName;
        this._ranges = ranges;
    }

    get ranges() {
        return this._ranges;
    }

    getRange() {
        return this.ranges[this.getValue()];
    }

    update() {
        this.model[this._componentName][this._optionName] = this.getRange();
    }
}