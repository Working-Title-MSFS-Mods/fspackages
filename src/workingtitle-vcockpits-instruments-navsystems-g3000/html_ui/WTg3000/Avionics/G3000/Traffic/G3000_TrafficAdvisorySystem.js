class WT_G3000_TrafficAdvisorySystem extends WT_G3x5_TrafficSystem {
    /**
     * @param {WT_PlayerAirplane} airplane
     * @param {WT_TrafficTracker} trafficTracker
     * @param {Object} [options]
     */
    constructor(airplane, trafficTracker, options) {
        super(airplane, trafficTracker, options);

        /**
         * @type {WT_G3000_TrafficAdvisorySystemIntruderEntry[]}
         */
        this._taEntries = [];
        this._taEntriesReadOnly = new WT_ReadOnlyArray(this._taEntries);
    }

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
     * @readonly
     * @type {WT_ReadOnlyArray<WT_G3000_TrafficAdvisorySystemIntruderEntry>}
     */
    get trafficAdvisories() {
        return this._taEntriesReadOnly;
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
            case "taOnHysteresis":
            case "taOffHysteresis":
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

    /**
     *
     * @param {WT_G3000_TrafficAdvisorySystemIntruderEntry} entry
     */
    _updateIntruderEntry(entry) {
        let wasTA = entry.alertLevel === WT_G3000_TrafficAdvisorySystem.AlertLevel.TRAFFIC_ADVISORY;
        super._updateIntruderEntry(entry);
        let isTA = entry.alertLevel === WT_G3000_TrafficAdvisorySystem.AlertLevel.TRAFFIC_ADVISORY;
        if (wasTA !== isTA) {
            if (isTA) {
                this._taEntries.push(entry);
            } else {
                this._taEntries.splice(this._taEntries.indexOf(entry), 1);
            }
        }
    }

    _onIntruderRemoved(eventType, intruder) {
        super._onIntruderRemoved(eventType, intruder);

        let index = this._taEntries.findIndex(entry => entry.intruder === intruder);
        if (index >= 0) {
            this._taEntries.splice(index, 1);
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
WT_G3000_TrafficAdvisorySystem.OPTION_DEFS = {
    taOnHysteresis: {default: 2, auto: true, observed: true},    // seconds
    taOffHysteresis: {default: 8, auto: true, observed: true},   // seconds
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
 * @property {Boolean} isOnGround
 * @property {Number} taHysteresis
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

        this._taOnTime = 0;
        this._taOffTime = 0;
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
    _updateNonTAAlertLevel(options) {
        this.intruder.predictSeparation(this.intruder.lastUpdatedTime, this._lastHorizontalSeparation, this._lastVerticalSeparation);
        if (this._lastHorizontalSeparation.compare(options.proximityAdvisoryParams.horizontalSeparation) <= 0 && this._lastVerticalSeparation.compare(options.proximityAdvisoryParams.verticalSeparation) <= 0) {
            this._alertLevel = WT_G3000_TrafficAdvisorySystem.AlertLevel.PROXIMITY_ADVISORY;
        } else {
            this._alertLevel = WT_G3000_TrafficAdvisorySystem.AlertLevel.NON_THREAT;
        }
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

        let isTA = false;
        let currentTime = this.intruder.lastUpdatedTime.asUnit(WT_Unit.SECOND);
        if (options.isOnGround) {
            // suppress traffic advisories while own aircraft is on the ground
            if (this._alertLevel === WT_G3000_TrafficAdvisorySystem.AlertLevel.TRAFFIC_ADVISORY) {
                this._taOffTime = currentTime;
            }
        } else if (this.intruder.tcaNorm <= 1) {
            if (this._alertLevel !== WT_G3000_TrafficAdvisorySystem.AlertLevel.TRAFFIC_ADVISORY) {
                let dt = currentTime - this._taOffTime;
                if (dt >= options.taOnHysteresis) {
                    isTA = true;
                    this._taOnTime = currentTime;
                }
            } else {
                isTA = true;
            }
        } else if (this._alertLevel === WT_G3000_TrafficAdvisorySystem.AlertLevel.TRAFFIC_ADVISORY) {
            let dt = currentTime - this._taOnTime;
            if (dt >= options.taOffHysteresis) {
                this._taOffTime = currentTime;
            } else {
                isTA = true;
            }
        }

        if (isTA) {
            this._alertLevel = WT_G3000_TrafficAdvisorySystem.AlertLevel.TRAFFIC_ADVISORY;
        } else {
            this._updateNonTAAlertLevel(options);
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