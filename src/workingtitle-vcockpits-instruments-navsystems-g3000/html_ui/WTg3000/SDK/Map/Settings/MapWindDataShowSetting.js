class WT_MapWindDataShowSetting extends WT_MapSetting {
    constructor(model, defaultValue = false, isSyncable = true, isPersistent = true, key = WT_MapWindDataShowSetting.KEY) {
        super(model, key, defaultValue, isSyncable, true, isPersistent);
    }

    update() {
        this.mapModel.wind.show = this.getValue();
    }
}
WT_MapWindDataShowSetting.KEY = "WT_Map_WindData_Show";