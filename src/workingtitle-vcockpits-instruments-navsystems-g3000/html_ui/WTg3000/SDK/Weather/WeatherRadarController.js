class WT_WeatherRadarRangeSetting extends WT_DataStoreSetting {
    constructor(controller, ranges, defaultRange, autoUpdate = true, isPersistent = false, key = WT_WeatherRadarRangeSetting.KEY) {
        super(controller, key, ranges.findIndex(range => range.equals(defaultRange)), autoUpdate, isPersistent);
        this._ranges = ranges;
    }

    getRange() {
        return this._ranges[this.getValue()];
    }

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