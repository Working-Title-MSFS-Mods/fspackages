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