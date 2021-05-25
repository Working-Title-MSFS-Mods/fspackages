class WT_G3x5_TrafficSystem {
    /**
     * @param {WT_PlayerAirplane} airplane
     * @param {WT_TrafficTracker} trafficTracker
     * @param {Object} [options]
     */
    constructor(airplane, trafficTracker, options) {
        this._airplane = airplane;

        this._operatingMode = 0;
        this._sensitivity = this._createSensitivity();

        this._tas = new WT_TrafficAvoidanceSystem(airplane, this._sensitivity.getProtectedRadius(), this._sensitivity.getProtectedHeight(), trafficTracker);
        /**
         * @type {Map<WT_TrafficAvoidanceSystemIntruder,WT_G3x5_TrafficSystemIntruderEntry>}
         */
        this._intruderEntries = new Map();
        /**
         * @type {WT_G3x5_TrafficSystemIntruderEntry[]}
         */
        this._entriesSorted = [];
        this._entriesCulled = [];
        this._entriesCulledReadOnly = new WT_ReadOnlyArray(this._entriesCulled);

        this._entryUpdateOptions = {};

        this._initOptionsManager();
        this._initOptions(options);

        this._initSettingModel();
        this._initIntruderListeners();

        this._lastUpdateTime = 0;
    }

    /**
     * @returns {WT_G3x5_TrafficSystemSensitivity}
     */
    _createSensitivity() {
    }

    _initOptionsManager() {
        this._optsManager = new WT_OptionsManager(this, WT_G3x5_TrafficSystem.OPTION_DEFS);
    }

    _initOptions(options) {
        this._optsManager.setOptions(options);
    }

    _initSettingModel() {
    }

    _initIntruderListeners() {
        this._tas.addIntruderListener(WT_TrafficAvoidanceSystem.IntruderEventType.CREATE, this._onIntruderCreated.bind(this));
        this._tas.addIntruderListener(WT_TrafficAvoidanceSystem.IntruderEventType.UPDATE, this._onIntruderUpdated.bind(this));
        this._tas.addIntruderListener(WT_TrafficAvoidanceSystem.IntruderEventType.REMOVE, this._onIntruderRemoved.bind(this));
    }

    /**
     *
     * @param {WT_G3x5_TrafficSystemIntruderEntry} a
     * @param {WT_G3x5_TrafficSystemIntruderEntry} b
     * @returns {Number}
     */
    _intruderEntryComparator(a, b) {
        let intruderA = a.intruder;
        let intruderB = b.intruder;
        // always sort intruders with valid predictions first
        if (intruderA.isPredictionValid && !intruderB.isPredictionValid) {
            return -1;
        } else if (!intruderA.isPredictionValid && intruderB.isPredictionValid) {
            return 1;
        } else if (intruderA.isPredictionValid) {
            // always sort intruders predicted to violate protected zone first
            if (intruderA.tcaNorm <= 1 && intruderB.tcaNorm > 1) {
                return -1;
            } else if (intruderA.tcaNorm > 1 && intruderB.tcaNorm <= 1) {
                return 1;
            } else {
                // if both are predicted to violate protected zone, sort by TCA.
                // Otherwise sort by how close they approach the protected zone at TCA.
                let tcaComparison = intruderA.tca.compare(intruderB.tca);
                let normComparison = intruderA.tcaNorm - intruderB.tcaNorm;
                let firstComparison;
                let secondComparison;
                if (intruderA.tca <= 1) {
                    firstComparison = tcaComparison;
                    secondComparison = normComparison;
                } else {
                    firstComparison = normComparison;
                    secondComparison = tcaComparison;
                }
                if (firstComparison === 0) {
                    return secondComparison;
                } else {
                    return firstComparison;
                }
            }
        } else {
            return 0;
        }
    }

    /**
     * @readonly
     * @type {Number}
     */
    get operatingMode() {
        return this._operatingMode;
    }

    /**
     * @readonly
     * @type {WT_ReadOnlyArray<WT_TrafficAvoidanceSystemIntruder>}
     */
    get intruders() {
        return this._entriesCulledReadOnly;
    }

    /**
     *
     * @returns {Boolean}
     */
    isStandby() {
    }

    _setOperatingMode(mode) {
        this._operatingMode = mode;
        this._entryUpdateOptions.operatingMode = mode;
    }

    _createIntruderEntry(intruder) {
    }

    _onIntruderCreated(eventType, intruder) {
        let entry = this._createIntruderEntry(intruder);
        this._intruderEntries.set(intruder, entry);
        this._entriesSorted.push(entry);
    }

    _updateIntruderEntry(entry) {
        entry.update(this._entryUpdateOptions);
    }

    _onIntruderUpdated(eventType, intruder) {
        let entry = this._intruderEntries.get(intruder);
        if (entry) {
            this._updateIntruderEntry(entry);
        }
    }

    _onIntruderRemoved(eventType, intruder) {
        let entry = this._intruderEntries.get(intruder);
        if (entry) {
            this._intruderEntries.delete(intruder);
            this._entriesSorted.splice(this._entriesSorted.indexOf(entry), 1);
        }
    }

    _updateOnGround() {
        this._entryUpdateOptions.isOnGround = this._airplane.sensors.isOnGround();
    }

    _updateSensitivity() {
        this._sensitivity.update();
    }

    _updateProtectedZone() {
        this._tas.lookaheadTime = this._sensitivity.getLookaheadTime();
        this._tas.ownAirplane.protectedRadius = this._sensitivity.getProtectedRadius();
        this._tas.ownAirplane.protectedHeight = this._sensitivity.getProtectedHeight();
    }

    _updateTAS() {
        this._tas.ownAirplane.protectedRadius = this._protectedRadius;
        this._tas.ownAirplane.protectedHeight = this._protectedHeight;
        this._tas.update();
    }

    _clearEntriesCulled() {
        if (this._entriesCulled.length > 0) {
            this._entriesCulled.splice(0, this._entriesCulled.length);
        }
    }

    _updateEntriesArray() {
        this._entriesSorted.sort(this._intruderEntryComparator.bind(this));
        this._clearEntriesCulled();
        this._entriesSorted.forEach((entry, index) => {
            if (index < this.maxIntruderCount && entry.intruder.isPredictionValid) {
                this._entriesCulled.push(entry);
            }
        }, this);
    }

    _doUpdate(currentTime) {
        this._updateOnGround();
        this._updateSensitivity();
        this._updateProtectedZone();
        this._updateTAS();
        this._updateEntriesArray();
        this._lastUpdateTime = currentTime;
    }

    update() {
        let currentTime = SimVar.GetSimVarValue("E:ABSOLUTE TIME", "seconds");
        if (currentTime - this._lastUpdateTime >= this.updateInterval) {
            this._doUpdate(currentTime);
        }
    }
}
WT_G3x5_TrafficSystem.ID = "WT_TrafficSystem";
WT_G3x5_TrafficSystem.OPTION_DEFS = {
    updateInterval: {default: 1, auto: true}, // seconds
    maxIntruderCount: {default: Infinity, auto: true}
};

/**
 * @abstract
 */
class WT_G3x5_TrafficSystemIntruderEntry {
    /**
     * @param {WT_TrafficAvoidanceSystemIntruder} intruder
     */
    constructor(intruder) {
        this._intruder = intruder;
    }

    /**
     * @readonly
     * @type {WT_TrafficAvoidanceSystemIntruder}
     */
    get intruder() {
        return this._intruder;
    }

    /**
     * @readonly
     * @type {Number}
     */
    get alertLevel() {
    }

    update(options) {
    }
}

class WT_G3x5_TrafficSystemSensitivity {
    /**
     * @param {WT_PlayerAirplane} airplane
     * @param {WT_NumberUnit[]} lookaheadTimes
     * @param {WT_NumberUnit[]} protectedRadii
     * @param {WT_NumberUnit[]} protectedHeights
     */
    constructor(airplane, lookaheadTimes, protectedRadii, protectedHeights) {
        this._airplane = airplane;
        this._lookaheadTimes = lookaheadTimes.map(value => value.readonly());
        this._protectedRadii = protectedRadii.map(value => value.readonly());
        this._protectedHeights = protectedHeights.map(value => value.readonly());
        this._level = 0;

        this._tempFeet = WT_Unit.FOOT.createNumber(0);
    }

    /**
     * The current sensitivity level.
     * @readonly
     * @type {Number}
     */
    get level() {
        return this._level;
    }

    /**
     * Gets the lookahead time for the current sensitivity level.
     * @returns {WT_NumberUnitReadOnly}
     */
    getLookaheadTime() {
        return this._lookaheadTimes[this.level];
    }

    /**
     * Gets the radius of the protected zone for the current sensitivity level.
     * @returns {WT_NumberUnitReadOnly}
     */
    getProtectedRadius() {
        return this._protectedRadii[this.level];
    }

    /**
     * Gets the height of the protected zone for the current sensitivity level.
     * @returns {WT_NumberUnitReadOnly}
     */
    getProtectedHeight() {
        return this._protectedHeights[this.level];
    }

    update() {
    }
}

class WT_G3x5_TrafficSystemOperatingModeSetting extends WT_DataStoreSetting {
    /**
     *
     * @param {WT_DataStoreSettingModel} model
     * @param {*} defaultValue
     * @param {Boolean} autoUpdate
     */
    constructor(model, defaultValue, autoUpdate, key = WT_G3x5_TrafficSystemOperatingModeSetting.KEY) {
        super(model, key, defaultValue, autoUpdate, false);
    }
}
WT_G3x5_TrafficSystemOperatingModeSetting.KEY = "WT_TrafficSystem_OperatingMode";