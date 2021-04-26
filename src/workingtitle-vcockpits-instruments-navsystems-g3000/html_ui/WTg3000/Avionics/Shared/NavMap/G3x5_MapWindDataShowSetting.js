class WT_G3x5_MapWindDataShowSetting extends WT_MapSetting {
    constructor(model, autoUpdate, defaultValue = false, isSyncable = true, isPersistent = true, key = WT_G3x5_MapWindDataShowSetting.KEY) {
        super(model, key, defaultValue, isSyncable, autoUpdate, isPersistent);
    }

    update() {
        this.mapModel.wind.show = this.getValue();
    }
}
WT_G3x5_MapWindDataShowSetting.KEY = "WT_Map_WindData_Show";