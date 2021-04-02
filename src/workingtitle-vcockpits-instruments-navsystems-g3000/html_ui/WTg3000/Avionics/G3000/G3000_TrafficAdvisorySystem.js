class WT_G3000_TrafficAdvisorySystem extends WT_G3x5_TrafficSystem {
    constructor(airplane, trafficTracker) {
        super(airplane, trafficTracker);

        this._sensitivity = new WT_G3000_TrafficAdvisorySystemSensitivity(airplane);
    }

    _initOptionsManager() {
        super._initOptionsManager();

        this._entryUpdateOptions = {};
        this._optsManager.addOptions(WT_G3000_TrafficAdvisorySystem.OPTION_DEFS);
    }

    _initSettingModel() {
        this._settingModel = new WT_DataStoreSettingModel(WT_G3x5_TrafficSystem.ID);

        let operatingModeSetting = new WT_G3000_TrafficSystemOperatingModeSetting(this._settingModel);
        this._settingModel.addSetting(operatingModeSetting);

        operatingModeSetting.addListener(this._onOperatingModeSettingChanged.bind(this));

        this._settingModel.init();
    }

    /**
     * @readonly
     * @type {WT_G3000_TrafficAdvisorySystemSensitivity.Level}
     */
    get sensitivity() {
        return this._sensitivity.level;
    }

    onOptionChanged(option, oldValue, newValue) {
        switch (option) {
            case "trafficAdvisorySensAParams":
            case "trafficAdvisorySensBParams":
            case "proximityAdvisoryParams":
                this._entryUpdateOptions[option] = newValue;
                break;
        }
    }

    _onOperatingModeSettingChanged(setting, newValue, oldValue) {
        this._operatingMode = newValue;
    }

    _createIntruderEntry(intruder) {
        return new WT_G3000_TrafficAdvisorySystemIntruderEntry(intruder);
    }

    _updateIntruderEntry(entry) {
        entry.update(this.sensitivity, this._entryUpdateOptions);
    }

    _updateSensitivity() {
        this._sensitivity.update();
    }

    _updateProtectedZone() {
        if (!this._isProtectedZoneInit) {
            this._protectedRadius.set(WT_G3000_TrafficAdvisorySystem.PROTECTED_RADIUS);
            this._protectedHeight.set(WT_G3000_TrafficAdvisorySystem.PROTECTED_HEIGHT);
            this._isProtectedZoneInit = true;
        }
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
WT_G3000_TrafficAdvisorySystem.PROTECTED_RADIUS = WT_Unit.NMILE.createNumber(2);
WT_G3000_TrafficAdvisorySystem.PROTECTED_HEIGHT = WT_Unit.FOOT.createNumber(2000);
WT_G3000_TrafficAdvisorySystem.OPTION_DEFS = {
    trafficAdvisorySensAParams: {default: {
        tca: WT_Unit.SECOND.createNumber(20),
        horizontalSeparation: WT_Unit.NMILE.createNumber(0.2),
        verticalSeparation: WT_Unit.FOOT.createNumber(600)
    }, auto: true, observed: true},
    trafficAdvisorySensBParams: {default: {
        tca: WT_Unit.SECOND.createNumber(30),
        horizontalSeparation: WT_Unit.NMILE.createNumber(0.55),
        verticalSeparation: WT_Unit.FOOT.createNumber(800)
    }, auto: true, observed: true},
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
 * @typedef WT_G3000_TrafficAdvisoryIntruderEntryUpdateOptions
 * @property {{tca:WT_NumberUnit, horizontalSeparation:WT_NumberUnit, verticalSeparation:WT_NumberUnit}} trafficAdvisorySensAParams
 * @property {{tca:WT_NumberUnit, horizontalSeparation:WT_NumberUnit, verticalSeparation:WT_NumberUnit}} trafficAdvisorySensBParams
 * @property {{horizontalSeparation:WT_NumberUnit, verticalSeparation:WT_NumberUnit}} proximityAdvisoryParams
 */

class WT_G3000_TrafficAdvisorySystemSensitivity {
    /**
     * @param {WT_PlayerAirplane} airplane
     */
    constructor(airplane) {
        this._airplane = airplane;
        this._level = WT_G3000_TrafficAdvisorySystemSensitivity.Level.B;

        this._tempFeet = WT_Unit.FOOT.createNumber(0);
    }

    /**
     * @readonly
     * @type {WT_G3000_TrafficAdvisorySystemSensitivity.Level}
     */
    get level() {
        return this._level;
    }

    update() {
        if (this._airplane.controls.isGearHandleDown() || this._airplane.sensors.radarAltitude(this._tempFeet).compare(WT_G3000_TrafficAdvisorySystemSensitivity.LEVEL_A_RA_THRESHOLD) < 0) {
            this._level = WT_G3000_TrafficAdvisorySystemSensitivity.Level.A;
        } else {
            this._level = WT_G3000_TrafficAdvisorySystemSensitivity.Level.B;
        }
    }
}
WT_G3000_TrafficAdvisorySystemSensitivity.LEVEL_A_RA_THRESHOLD = WT_Unit.FOOT.createNumber(2000);
/**
 * @enum {Number}
 */
WT_G3000_TrafficAdvisorySystemSensitivity.Level = {
    A: 0,
    B: 1
};

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
     * @param {{tca:WT_NumberUnit, horizontalSeparation:WT_NumberUnit, verticalSeparation:WT_NumberUnit}} trafficAdvisoryParams
     * @param {{horizontalSeparation:WT_NumberUnit, verticalSeparation:WT_NumberUnit}} proximityAdvisoryParams
     */
    _updateAlertLevelSensitivity(trafficAdvisoryParams, proximityAdvisoryParams) {
        this.intruder.predictSeparation(this.intruder.lastUpdatedTime, this._lastHorizontalSeparation, this._lastVerticalSeparation);
        if (this.intruder.tcaNorm <= 1 && (this.intruder.tca.compare(trafficAdvisoryParams.tca) <= 0 ||
            (this._lastHorizontalSeparation.compare(trafficAdvisoryParams.horizontalSeparation) <= 0 && this._lastVerticalSeparation.compare(trafficAdvisoryParams.verticalSeparation) <= 0))) {
            this._alertLevel = WT_G3000_TrafficAdvisorySystem.AlertLevel.TRAFFIC_ADVISORY;
        } else {
            if (this._lastHorizontalSeparation.compare(proximityAdvisoryParams.horizontalSeparation) <= 0 && this._lastVerticalSeparation.compare(proximityAdvisoryParams.verticalSeparation) <= 0) {
                this._alertLevel = WT_G3000_TrafficAdvisorySystem.AlertLevel.PROXIMITY_ADVISORY;
            } else {
                this._alertLevel = WT_G3000_TrafficAdvisorySystem.AlertLevel.NON_THREAT;
            }
        }
    }

    /**
     *
     * @param {WT_G3000_TrafficAdvisorySystemSensitivity.Level} sensitivity
     * @param {WT_G3000_TrafficAdvisoryIntruderEntryUpdateOptions} options
     */
    _updateAlertLevel(sensitivity, options) {
        if (!this.intruder.isPredictionValid) {
            this._alertLevel = WT_G3000_TrafficAdvisorySystem.AlertLevel.UNKNOWN;
            return;
        }

        if (sensitivity === WT_G3000_TrafficAdvisorySystemSensitivity.Level.A) {
            this._updateAlertLevelSensitivity(options.trafficAdvisorySensAParams, options.proximityAdvisoryParams);
        } else {
            this._updateAlertLevelSensitivity(options.trafficAdvisorySensBParams, options.proximityAdvisoryParams);
        }
    }

    /**
     *
     * @param {WT_G3000_TrafficAdvisorySystemSensitivity.Level} sensitivity
     * @param {WT_G3000_TrafficAdvisoryIntruderEntryUpdateOptions} options
     */
    update(sensitivity, options) {
        this._updateAlertLevel(sensitivity, options);
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
WT_G3000_TrafficSystemOperatingModeSetting.DEFAULT = WT_G3000_TrafficAdvisorySystem.OperatingMode.STANDBY;