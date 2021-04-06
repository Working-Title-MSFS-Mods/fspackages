class WT_G3x5_ChartsICAOSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = "", key = WT_G3x5_ChartsICAOSetting.KEY) {
        super(model, key, defaultValue, false, false);
    }
}
WT_G3x5_ChartsICAOSetting.KEY = "WT_Charts_ICAO";

class WT_G3x5_ChartsChartIDSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = "", key = WT_G3x5_ChartsChartIDSetting.KEY) {
        super(model, key, defaultValue, false, false);
    }
}
WT_G3x5_ChartsChartIDSetting.KEY = "WT_Charts_ChartID";