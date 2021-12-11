class WT_G3x5_ChartsICAOSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = WT_G3x5_ChartsICAOSetting.DEFAULT, key = WT_G3x5_ChartsICAOSetting.KEY) {
        super(model, key, defaultValue, true, false);

        this._icao = defaultValue;
    }

    /**
     * @readonly
     * @type {String}
     */
    get icao() {
        return this._icao;
    }

    update() {
        this._icao = this.getValue();
    }
}
WT_G3x5_ChartsICAOSetting.KEY = "WT_Charts_ICAO";
WT_G3x5_ChartsICAOSetting.DEFAULT = "";

class WT_G3x5_ChartsChartIDSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = WT_G3x5_ChartsChartIDSetting.DEFAULT, key = WT_G3x5_ChartsChartIDSetting.KEY) {
        super(model, key, defaultValue, true, false);

        this._chartID = defaultValue;
    }

    /**
     * @readonly
     * @type {String}
     */
    get chartID() {
        return this._chartID;
    }

    update() {
        this._chartID = this.getValue();
    }
}
WT_G3x5_ChartsChartIDSetting.KEY = "WT_Charts_ChartID";
WT_G3x5_ChartsChartIDSetting.DEFAULT = "";

class WT_G3x5_ChartsLightModeSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = WT_G3x5_ChartsLightModeSetting.DEFAULT, key = WT_G3x5_ChartsLightModeSetting.KEY) {
        super(model, key, defaultValue, false, false);
    }
}
WT_G3x5_ChartsLightModeSetting.KEY = "WT_Charts_LightMode";
/**
 * @enum {Number}
 */
WT_G3x5_ChartsLightModeSetting.Mode = {
    NIGHT: 0,
    DAY: 1,
    AUTO: 2
};
WT_G3x5_ChartsLightModeSetting.DEFAULT = WT_G3x5_ChartsLightModeSetting.Mode.DAY;

class WT_G3x5_ChartsLightThresholdSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = WT_G3x5_ChartsLightThresholdSetting.DEFAULT, key = WT_G3x5_ChartsLightThresholdSetting.KEY) {
        super(model, key, defaultValue, false, false);
    }
}
WT_G3x5_ChartsLightThresholdSetting.KEY = "WT_Charts_LightThreshold";
WT_G3x5_ChartsLightThresholdSetting.DEFAULT = 0.25;

class WT_G3x5_ChartsRotationSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = WT_G3x5_ChartsRotationSetting.DEFAULT, key = WT_G3x5_ChartsRotationSetting.KEY) {
        super(model, key, defaultValue, false, false);
    }

    getRotation() {
        return this.getValue() * 90;
    }

    resetRotation() {
        this.setValue(0);
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

class WT_G3x5_ChartsZoomSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = WT_G3x5_ChartsZoomSetting.DEFAULT, scaleFactors = WT_G3x5_ChartsZoomSetting.SCALE_FACTORS, key = WT_G3x5_ChartsZoomSetting.KEY) {
        super(model, key, defaultValue, false, false);

        this._scaleFactors = scaleFactors;
        this._scaleFactorsReadOnly = new WT_ReadOnlyArray(this._scaleFactors);
    }

    /**
     * @readonly
     * @type {WT_ReadOnlyArray<Number>}
     */
    get scaleFactors() {
        return this._scaleFactorsReadOnly;
    }

    getScaleFactor() {
        return this._scaleFactors[this.getValue()];
    }

    resetZoom() {
        this.setValue(0);
    }

    changeZoom(delta) {
        let current = this.getValue();
        let target = Math.max(0, Math.min(this._scaleFactors.length - 1, current + delta));
        this.setValue(target);
    }
}
WT_G3x5_ChartsZoomSetting.KEY = "WT_Charts_Zoom";
WT_G3x5_ChartsZoomSetting.SCALE_FACTORS = [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10];
WT_G3x5_ChartsZoomSetting.DEFAULT = 0;

class WT_G3x5_ChartsSectionSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = WT_G3x5_ChartsSectionSetting.DEFAULT, key = WT_G3x5_ChartsSectionSetting.KEY) {
        super(model, key, defaultValue, false, false);
    }
}
WT_G3x5_ChartsSectionSetting.KEY = "WT_Charts_Section";
WT_G3x5_ChartsSectionSetting.DEFAULT = WT_G3x5_ChartsModel.SectionMode.ALL;