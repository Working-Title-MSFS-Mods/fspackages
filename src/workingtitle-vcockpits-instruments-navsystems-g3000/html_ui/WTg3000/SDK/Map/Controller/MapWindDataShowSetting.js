class WT_MapWindDataShowSetting extends WT_MapSetting {
    constructor(controller, defaultValue = false, isSyncable = true, isPersistent = true, key = WT_MapWindDataShowSetting.KEY) {
        super(controller, key, defaultValue, isSyncable, true, isPersistent);
    }

    update() {
        this.model.wind.show = this.getValue();
    }
}
WT_MapWindDataShowSetting.KEY = "WT_Map_WindData_Show";