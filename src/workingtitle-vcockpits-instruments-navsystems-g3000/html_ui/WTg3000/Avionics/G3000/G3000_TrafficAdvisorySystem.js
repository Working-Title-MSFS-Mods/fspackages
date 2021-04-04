class WT_G3000_TrafficAdvisorySystem extends WT_G3x5_TrafficSystem {
    /**
     * @returns {WT_G3000_TrafficSystemSensitivity}
     */
    _createSensitivity() {
        return new WT_G3000_TrafficAdvisorySystemSensitivity(this._airplane);
    }

    _initOptionsManager() {
        super._initOptionsManager();

        this._optsManager.addOptions(WT_G3000_TrafficAdvisorySystem.OPTION_DEFS);
    }

    _initSettingModel() {
        this._settingModel = new WT_DataStoreSettingModel(WT_G3x5_TrafficSystem.ID);

        let operatingModeSetting = new WT_G3000_TrafficSystemOperatingModeSetting(this._settingModel);
        this._settingModel.addSetting(operatingModeSetting);

        operatingModeSetting.addListener(this._onOperatingModeSettingChanged.bind(this));

        this._settingModel.init();
        this._setOperatingMode(operatingModeSetting.getValue());
    }

    /**
     *
     * @returns {Boolean}
     */
    isStandby() {
        return this.operatingMode === WT_G3000_TrafficAdvisorySystem.OperatingMode.STANDBY;
    }

    onOptionChanged(option, oldValue, newValue) {
        switch (option) {
            case "proximityAdvisoryParams":
                this._entryUpdateOptions[option] = newValue;
                break;
        }
    }

    _onOperatingModeSettingChanged(setting, newValue, oldValue) {
        this._setOperatingMode(newValue);
    }

    _createIntruderEntry(intruder) {
        return new WT_G3000_TrafficAdvisorySystemIntruderEntry(intruder);
    }

    _doUpdate(currentTime) {
        if (this.operatingMode !== WT_G3000_TrafficAdvisorySystem.OperatingMode.OPERATING) {
            this._clearEntriesCulled();
            return;
        }

        this._updateSensitivity();

        super._doUpdate(currentTime);
    }
}
WT_G3000_TrafficAdvisorySystem.OPTION_DEFS = {
    proximityAdvisoryParams: {default: {
        horizontalSeparation: WT_Unit.NMILE.createNumber(6),
        verticalSeparation: WT_Unit.FOOT.createNumber(1200)
    }, auto: true, observed: true}
};
/**
 * @enum {Number}
 */
WT_G3000_TrafficAdvisorySystem.OperatingMode = {
    STANDBY: 0,
    OPERATING: 1
};
/**
 * @enum {Number}
 */
WT_G3000_TrafficAdvisorySystem.AlertLevel = {
    UNKNOWN: 0,
    NON_THREAT: 1,
    PROXIMITY_ADVISORY: 2,
    TRAFFIC_ADVISORY: 3
}

/**
 * @typedef WT_G3000_TrafficAdvisorySystemIntruderEntryUpdateOptions
 * @property {WT_G5000_TCASII.OperatingMode} operatingMode
 * @property {{horizontalSeparation:WT_NumberUnit, verticalSeparation:WT_NumberUnit}} proximityAdvisoryParams
 */

class WT_G3000_TrafficAdvisorySystemSensitivity extends WT_G3x5_TrafficSystemSensitivity {
    /**
     * @param {WT_PlayerAirplane} airplane
     */
    constructor(airplane) {
        super(airplane, WT_G3000_TrafficAdvisorySystemSensitivity.LOOKAHEAD_TIMES, WT_G3000_TrafficAdvisorySystemSensitivity.PROTECTED_RADII, WT_G3000_TrafficAdvisorySystemSensitivity.PROTECTED_HEIGHTS)

        this._tempFeet = WT_Unit.FOOT.createNumber(0);
    }

    update() {
        let radarAltitudeFeet = this._airplane.sensors.radarAltitude(this._tempFeet).number;
        let trueAltitudeFeet = this._airplane.navigation.altitude(this._tempFeet).number;
        if (radarAltitudeFeet > 1500) {
            if (trueAltitudeFeet > 20000) {
                this._level = 4;
            } else if (trueAltitudeFeet > 10000) {
                this._level = 3;
            } else if (trueAltitudeFeet > 5000) {
                this._level = 2;
            } else {
                this._level = 1;
            }
        } else {
            this._level = 0;
        }
    }
}
WT_G3000_TrafficAdvisorySystemSensitivity.LOOKAHEAD_TIMES =     [30,    35,     40,     45,     48].map(value => WT_Unit.SECOND.createNumber(value));
WT_G3000_TrafficAdvisorySystemSensitivity.PROTECTED_RADII =     [0.20,  0.35,   0.55,   0.80,   1.10].map(value => WT_Unit.NMILE.createNumber(value));
WT_G3000_TrafficAdvisorySystemSensitivity.PROTECTED_HEIGHTS =   [800,   1400,   1400,   1400,   1400].map(value => WT_Unit.FOOT.createNumber(value));

class WT_G3000_TrafficAdvisorySystemIntruderEntry extends WT_G3x5_TrafficSystemIntruderEntry {
    /**
     * @param {WT_G3x5_TrafficSystemIntruderEntry} intruder
     */
    constructor(intruder) {
        super(intruder);

        this._alertLevel = WT_G3000_TrafficAdvisorySystem.AlertLevel.UNKNOWN;
        this._lastHorizontalSeparation = WT_Unit.NMILE.createNumber(0);
        this._lastVerticalSeparation = WT_Unit.FOOT.createNumber(0);
    }

    /**
     * @readonly
     * @type {WT_G3000_TrafficAdvisorySystem.AlertLevel}
     */
    get alertLevel() {
        return this._alertLevel;
    }

    /**
     *
     * @param {WT_G3000_TrafficAdvisorySystemIntruderEntryUpdateOptions} options
     */
    _updateAlertLevel(options) {
        if (!this.intruder.isPredictionValid) {
            this._alertLevel = WT_G3000_TrafficAdvisorySystem.AlertLevel.UNKNOWN;
            return;
        }

        this.intruder.predictSeparation(this.intruder.lastUpdatedTime, this._lastHorizontalSeparation, this._lastVerticalSeparation);
        if (this.intruder.tcaNorm <= 1) {
            this._alertLevel = WT_G3000_TrafficAdvisorySystem.AlertLevel.TRAFFIC_ADVISORY;
        } else {
            if (this._lastHorizontalSeparation.compare(options.proximityAdvisoryParams.horizontalSeparation) <= 0 && this._lastVerticalSeparation.compare(options.proximityAdvisoryParams.verticalSeparation) <= 0) {
                this._alertLevel = WT_G3000_TrafficAdvisorySystem.AlertLevel.PROXIMITY_ADVISORY;
            } else {
                this._alertLevel = WT_G3000_TrafficAdvisorySystem.AlertLevel.NON_THREAT;
            }
        }
    }

    /**
     *
     * @param {WT_G3000_TrafficAdvisorySystemIntruderEntryUpdateOptions} options
     */
    update(options) {
        this._updateAlertLevel(options);
    }
}

class WT_G3000_TrafficSystemOperatingModeSetting extends WT_G3x5_TrafficSystemOperatingModeSetting {
    /**
     *
     * @param {WT_DataStoreSettingModel} model
     * @param {WT_G3000_TrafficAdvisorySystem.OperatingMode} [defaultValue]
     */
    constructor(model, defaultValue = WT_G3000_TrafficSystemOperatingModeSetting.DEFAULT) {
        super(model, defaultValue, false);
    }
}
WT_G3000_TrafficSystemOperatingModeSetting.DEFAULT = WT_G3000_TrafficAdvisorySystem.OperatingMode.OPERATING;