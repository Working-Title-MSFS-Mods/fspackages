class WT_WeatherRadarSetting extends WT_DataStoreSetting {
    constructor(controller, propertyName, key, defaultValue, autoUpdate = true, isPersistent = false) {
        super(controller, key, defaultValue, autoUpdate, isPersistent);

        this._propertyName = propertyName;
    }

    update() {
        this.model[this._propertyName] = this.getValue();
    }
}

class WT_WeatherRadarRangeSetting extends WT_DataStoreSetting {
    constructor(controller, ranges, defaultRange, autoUpdate = true, isPersistent = false, key = WT_WeatherRadarRangeSetting.KEY) {
        super(controller, key, ranges.findIndex(range => range.equals(defaultRange)), autoUpdate, isPersistent);
        this._ranges = ranges;
    }

    /**
     * @readonly
     * @property {WT_NumberUnit[]} ranges
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
        this.model.range = this.getRange();
    }
}
WT_WeatherRadarRangeSetting.KEY = "WT_WeatherRadar_Range";