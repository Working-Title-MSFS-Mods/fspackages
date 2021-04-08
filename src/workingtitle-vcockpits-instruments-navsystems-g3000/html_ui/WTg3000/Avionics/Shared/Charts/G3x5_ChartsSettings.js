class WT_G3x5_ChartsICAOSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = WT_G3x5_ChartsICAOSetting.DEFAULT, key = WT_G3x5_ChartsICAOSetting.KEY) {
        super(model, key, defaultValue, false, false);
    }
}
WT_G3x5_ChartsICAOSetting.KEY = "WT_Charts_ICAO";
WT_G3x5_ChartsICAOSetting.DEFAULT = "";

class WT_G3x5_ChartsChartIDSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = WT_G3x5_ChartsChartIDSetting.DEFAULT, key = WT_G3x5_ChartsChartIDSetting.KEY) {
        super(model, key, defaultValue, false, false);
    }
}
WT_G3x5_ChartsChartIDSetting.KEY = "WT_Charts_ChartID";
WT_G3x5_ChartsChartIDSetting.DEFAULT = "";

class WT_G3x5_ChartsRotationSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = WT_G3x5_ChartsRotationSetting.DEFAULT, key = WT_G3x5_ChartsRotationSetting.KEY) {
        super(model, key, defaultValue, false, false);
    }

    getRotation() {
        return this.getValue() * 90;
    }

    rotateCCW() {
        this.setValue((this.getValue() + 3) % 4); // add by 3 instead of subtracting 1 to avoid negative values
    }

    rotateCW() {
        this.setValue((this.getValue() + 1) % 4);
    }
}
WT_G3x5_ChartsRotationSetting.KEY = "WT_Charts_Rotation";
WT_G3x5_ChartsRotationSetting.DEFAULT = 0;