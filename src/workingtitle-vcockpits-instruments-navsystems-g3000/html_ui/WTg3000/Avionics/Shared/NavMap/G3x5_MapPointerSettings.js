class WT_G3x5_MapPointerShowSetting extends WT_MapSetting {
    constructor(model, autoUpdate = false, defaultValue = false) {
        super(model, WT_G3x5_MapPointerShowSetting.KEY, defaultValue, false, autoUpdate, false)
    }

    update() {
        this.mapModel.pointer.show = this.getValue();
    }
}
WT_G3x5_MapPointerShowSetting.KEY = "WT_Map_CursorShow";