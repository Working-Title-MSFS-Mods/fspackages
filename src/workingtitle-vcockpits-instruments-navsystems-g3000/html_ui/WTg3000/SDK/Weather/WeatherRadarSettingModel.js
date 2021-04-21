class WT_WeatherRadarSettingModel extends WT_DataStoreSettingModel {
    constructor(id, weatherRadarModel) {
        super(id);

        this._weatherRadarModel = weatherRadarModel;
    }

    /**
     * @readonly
     * @type {WT_WeatherRadarModel}
     */
    get weatherRadarModel() {
        return this._weatherRadarModel;
    }
}

class WT_WeatherRadarSetting extends WT_DataStoreSetting {
    /**
     * @param {WT_WeatherRadarSettingModel} model - the model with which to associate the new setting.
     * @param {String} key - the data store key of the new setting.
     * @param {*} [defaultValue] - the value to which the new setting should default if it is not persistent or if a value cannot be retrieved
     *                             from the data store.
     * @param {Boolean} [autoUpdate] - whether the new setting should automatically call its update() method whenever its value
     *                                 changes. True by default.
     * @param {Boolean} [isPersistent] - whether the new setting persists across sessions.
     */
    constructor(model, key, defaultValue = 0, autoUpdate = true, isPersistent = false) {
        super(model, key, defaultValue, autoUpdate, isPersistent);
    }

    /**
     * The weather radar model associated with this setting.
     * @readonly
     * @type {WT_WeatherRadarModel}
     */
    get weatherRadarModel() {
        return this._model.weatherRadarModel;
    }
}

class WT_WeatherRadarGenericSetting extends WT_WeatherRadarSetting {
    constructor(controller, propertyName, key, defaultValue, autoUpdate = true, isPersistent = false) {
        super(controller, key, defaultValue, autoUpdate, isPersistent);

        this._propertyName = propertyName;
    }

    update() {
        this.weatherRadarModel[this._propertyName] = this.getValue();
    }
}

class WT_WeatherRadarRangeSetting extends WT_WeatherRadarSetting {
    constructor(controller, ranges, defaultRange, autoUpdate = true, isPersistent = false, key = WT_WeatherRadarRangeSetting.KEY) {
        super(controller, key, ranges.findIndex(range => range.equals(defaultRange)), autoUpdate, isPersistent);
        this._ranges = ranges;
    }

    /**
     * @readonly
     * @type {WT_NumberUnit[]}
     */
    get ranges() {
        return this._ranges;
    }

    /**
     *
     * @returns {WT_NumberUnit}
     */
    getRange() {
        return this._ranges[this.getValue()];
    }

    /**
     *
     * @param {WT_NumberUnit} newRange
     */
    setRange(newRange) {
        let index = this._ranges.findIndex(range => range.equals(newRange));
        if (index >= 0) {
            this.setValue(index);
        }
    }

    update() {
        this.weatherRadarModel.range = this.getRange();
    }
}
WT_WeatherRadarRangeSetting.KEY = "WT_WeatherRadar_Range";