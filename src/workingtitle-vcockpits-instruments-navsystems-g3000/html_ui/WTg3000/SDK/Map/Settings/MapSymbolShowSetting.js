/**
 * A setting controlling whether a type of map symbol should be visible.
 */
class WT_MapSymbolShowSetting extends WT_MapSetting {
    /**
     * @param {WT_MapSettingModel} model - the setting model with which to associate the new setting.
     * @param {String} symbolID - the identifier of the map symbol type controlled by this setting.
     * @param {String} moduleName - the name of the map model module where the option controlled by the new setting is located.
     * @param {String} optionName - the name of the option controlled by the new setting.
     * @param {String} key - the data store key of the new setting.
     * @param {WT_MapSetting} dcltrSetting - the declutter setting to use to override this setting when decluttering the map view.
     * @param {Boolean} autoUpdate - whether the new setting should automatically call its update() method whenever its value
     *                               changes.
     * @param {Boolean} [defaultValue] - the value to which the new setting should default if it is not persistent or if a value cannot
     *                                   be retrieved from the data store.
     * @param {Boolean} [isSyncable] - whether the new setting is sync-able. True by default.
     * @param {Boolean} [isPersistent] - whether the new setting persists across sessions.
     */
    constructor(model, symbolID, moduleName, optionName, key, dcltrSetting, autoUpdate, defaultValue = true, isSyncable = true, isPersistent = true) {
        super(model, key, defaultValue, isSyncable, autoUpdate, isPersistent);

        this._dcltrSetting = dcltrSetting;
        this._dcltrSetting.addListener(this._dcltrSettingChanged.bind(this));

        this._symbolID = symbolID;
        this._moduleName = moduleName;
        this._optionName = optionName;
    }

    get symbolID() {
        return this._symbolID;
    }

    get dcltrSetting() {
        return this._dcltrSetting;
    }

    update() {
        this.mapModel[this._moduleName][this._optionName] =
            this.getValue() &&
            !this.dcltrSetting.isDecluttered(this.symbolID);
    }

    _dcltrSettingChanged(setting, newValue, oldValue) {
        if (this._autoUpdate) {
            this.update();
        }
    }
}

/**
 * A setting controlling map declutter. An arbitrary number of declutter levels are supported.
 */
class WT_MapDCLTRSetting extends WT_MapSetting {
    /**
     * @param {WT_MapSettingModel} model - the setting model with which to associate the new setting.
     * @param {WT_NumberUnit[]} dcltrTable - an array of map zoom ranges.
     * @param {WT_NumberUnit} defaultValue - the default maximum range of the new setting.
     * @param {Boolean} [isSyncable] - whether the new setting is sync-able. True by default.
     * @param {Boolean} [isPersistent] - whether the new setting persists across sessions.
     * @param {String} [key] - the data store key of the new setting.
     */
    constructor(model, dcltrTable, defaultValue = 0, isSyncable = true, isPersistent = true, key = WT_MapDCLTRSetting.KEY_DEFAULT) {
        super(model, key, defaultValue, isSyncable, false, isPersistent);
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
     * @param {WT_MapSettingModel} model - the setting model with which to associate the new setting.
     * @param {String} key - the data store key of the new setting.
     * @param {WT_NumberUnit[]} ranges - an array of map zoom ranges.
     * @param {WT_NumberUnit} defaultRange - the default maximum range of the new setting.
     * @param {Boolean} autoUpdate - whether the new setting should automatically call its update() method whenever its value
     *                               changes.
     * @param {Boolean} [isSyncable] - whether the new setting is sync-able. True by default.
     * @param {Boolean} [isPersistent] - whether the new setting persists across sessions.
     */
    constructor(model, key, componentName, optionName, ranges, defaultRange, autoUpdate, isSyncable = true, isPersistent = true) {
        super(model, key, ranges.findIndex(range => range.equals(defaultRange)), isSyncable, autoUpdate, isPersistent);

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
        this.mapModel[this._componentName][this._optionName] = this.getRange();
    }
}