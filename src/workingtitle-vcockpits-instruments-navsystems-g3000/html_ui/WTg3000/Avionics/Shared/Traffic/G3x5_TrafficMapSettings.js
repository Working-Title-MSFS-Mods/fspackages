class WT_G3x5_TrafficMapRangeSetting extends WT_MapRangeSetting {
    /**
     * @param {WT_MapSettingModel} model - the setting model with which to associate the new setting.
     * @param {WT_NumberUnit[]} ranges - an array of possible range values of the new setting.
     * @param {WT_NumberUnit} defaultRange - the default range of the new setting.
     * @param {Boolean} [autoUpdate] - whether the new setting should automatically call its update() method whenever its value
     *                                 changes. False by default.
     */
    constructor(model, ranges, defaultRange, autoUpdate = false) {
        super(model, ranges, defaultRange, false, autoUpdate);
    }

    getInnerRange() {
        let index = this.getValue();
        return (index > 0) ? this._ranges[index - 1] : WT_G3x5_TrafficMapRangeSetting.ZERO_RANGE.readonly();
    }

    update() {
        super.update();

        this.mapModel.traffic.outerRange = this.getRange();
        this.mapModel.traffic.innerRange = this.getInnerRange();
    }
}
WT_G3x5_TrafficMapRangeSetting.ZERO_RANGE = WT_Unit.NMILE.createNumber(0);

class WT_G3x5_TrafficMapAltitudeModeSetting extends WT_MapSetting {
    constructor(model, autoUpdate = true, defaultValue = WT_G3x5_MapModelTrafficModule.AltitudeMode.RELATIVE, key = WT_G3x5_TrafficMapAltitudeModeSetting.KEY) {
        super(model, key, defaultValue, false, autoUpdate, true);
    }

    update() {
        this.mapModel.traffic.altitudeMode = this.getValue();
    }
}
WT_G3x5_TrafficMapAltitudeModeSetting.KEY = "WT_Traffic_Altitude_Mode";
/**
 * @enum {Number}
 */
WT_G3x5_TrafficMapAltitudeModeSetting.Mode = {
    RELATIVE: 0,
    ABSOLUTE: 1
};

class WT_G3x5_TrafficMapAltitudeRestrictionSetting extends WT_MapSetting {
    /**
     * @param {WT_MapSettingModel} model
     * @param {Boolean} [autoUpdate]
     * @param {{above:WT_NumberUnit, below:WT_NumberUnit}[]} altitudes
     * @param {WT_G3x5_MapModelTrafficModule.AltitudeRestrictionMode} [defaultValue]
     * @param {String} [key]
     */
    constructor(model, autoUpdate = true, restrictions = WT_G3x5_TrafficMapAltitudeRestrictionSetting.ALTITUDES_DEFAULT, defaultValue = WT_G3x5_MapModelTrafficModule.AltitudeRestrictionMode.UNRESTRICTED, key = WT_G3x5_TrafficMapAltitudeRestrictionSetting.KEY) {
        super(model, key, defaultValue, false, autoUpdate, true);

        this._restrictions = restrictions;
        this._restrictionsReadOnly = new WT_ReadOnlyArray(restrictions);
    }

    /**
     * @readonly
     * @type {WT_ReadOnlyArray<{above:WT_NumberUnit, below:WT_NumberUnit}>}
     */
    get restrictions() {
        return this._restrictionsReadOnly;
    }

    /**
     *
     * @returns {{above:WT_NumberUnit, below:WT_NumberUnit}}
     */
    getRestriction() {
        return this.restrictions.get(this.getValue());
    }

    update() {
        let index = this.getValue();
        this.mapModel.traffic.altitudeRestrictionMode = index;

        let restriction = this.restrictions.get(index);
        this.mapModel.traffic.altitudeRestrictionAbove = restriction.above;
        this.mapModel.traffic.altitudeRestrictionBelow = restriction.below;
    }
}
WT_G3x5_TrafficMapAltitudeRestrictionSetting.KEY = "WT_Traffic_Altitude_Restriction";
WT_G3x5_TrafficMapAltitudeRestrictionSetting.ALTITUDES_DEFAULT = [
    {
        above: WT_Unit.FOOT.createNumber(9900),
        below: WT_Unit.FOOT.createNumber(9900)
    },
    {
        above: WT_Unit.FOOT.createNumber(9900),
        below: WT_Unit.FOOT.createNumber(2700)
    },
    {
        above: WT_Unit.FOOT.createNumber(2700),
        below: WT_Unit.FOOT.createNumber(2700)
    },
    {
        above: WT_Unit.FOOT.createNumber(2700),
        below: WT_Unit.FOOT.createNumber(9900)
    }
];

class WT_G3x5_TrafficMapMotionVectorModeSetting extends WT_MapSetting {
    constructor(model, autoUpdate = true, defaultValue = WT_G3x5_MapModelTrafficModule.MotionVectorMode.OFF, key = WT_G3x5_TrafficMapMotionVectorModeSetting.KEY) {
        super(model, key, defaultValue, false, autoUpdate, true);
    }

    update() {
        this.mapModel.traffic.motionVectorMode = this.getValue();
    }
}
WT_G3x5_TrafficMapMotionVectorModeSetting.KEY = "WT_Traffic_MotionVector_Mode";

class WT_G3x5_TrafficMapMotionVectorLookaheadSetting extends WT_MapSetting {
    constructor(model, autoUpdate = true, lookaheadValues = WT_G3x5_TrafficMapMotionVectorLookaheadSetting.LOOKAHEAD_VALUES_DEFAULT, defaultValue = WT_G3x5_TrafficMapMotionVectorLookaheadSetting.LOOKAHEAD_DEFAULT, key = WT_G3x5_TrafficMapMotionVectorLookaheadSetting.KEY) {
        let defaultIndex = lookaheadValues.findIndex(value => value.equals(defaultValue));
        super(model, key, defaultIndex, false, autoUpdate, true);

        this._lookaheadValues = lookaheadValues;
        this._lookaheadValuesReadOnly = new WT_ReadOnlyArray(lookaheadValues.map(value => value.readonly()));
    }

    /**
     * @readonly
     * @type {WT_ReadOnlyArray<WT_NumberUnitReadOnly>}
     */
    get lookaheadValues() {
        return this._lookaheadValuesReadOnly;
    }

    /**
     *
     * @returns {WT_NumberUnitReadOnly}
     */
    getLookahead() {
        return this.lookaheadValues.get(this.getValue());
    }

    update() {
        this.mapModel.traffic.motionVectorLookahead = this.getLookahead();
    }
}
WT_G3x5_TrafficMapMotionVectorLookaheadSetting.KEY = "WT_Traffic_MotionVector_Lookahead";
WT_G3x5_TrafficMapMotionVectorLookaheadSetting.LOOKAHEAD_VALUES_DEFAULT = [30, 60, 120, 300].map(value => WT_Unit.SECOND.createNumber(value));
WT_G3x5_TrafficMapMotionVectorLookaheadSetting.LOOKAHEAD_DEFAULT = WT_Unit.SECOND.createNumber(60);

class WT_G3x5_NavMapTrafficShowSetting extends WT_MapSetting {
    constructor(model, autoUpdate, defaultValue = false, key = WT_G3x5_NavMapTrafficShowSetting.KEY) {
        super(model, key, defaultValue, true, autoUpdate, true);
    }

    update() {
        this.mapModel.traffic.show = this.getValue();
    }
}
WT_G3x5_NavMapTrafficShowSetting.KEY = "WT_Map_Traffic_Show";