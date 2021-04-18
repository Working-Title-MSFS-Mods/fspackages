/**
 * A map model controller that uses the data store to sync a map model across instruments. In addition to syncing a single
 * model across instruments, the map controller also supports syncing user-configurable settings across multiple map models.
 */
class WT_MapSettingModel extends WT_DataStoreSettingModel {
    /**
     * @param {String} id - the unique string ID of the new setting model.
     * @param {WT_MapModel} mapModel - the map model associated with the new setting model.
     * @param {WT_MapView} mapView - the map view associated with the new setting model.
     */
    constructor(id, mapModel, mapView) {
        super(id);

        this._mapModel = mapModel;
        this._mapView = mapView;

        WTDataStore.addListener(this._onSyncPendingChanged.bind(this), `${this.id}.${WT_MapSettingModel.SYNC_ID_PENDING_KEY}`);
        WTDataStore.addListener(this._onSyncActiveChanged.bind(this), `${this.id}.${WT_MapSettingModel.SYNC_ID_ACTIVE_KEY}`);
    }

    /**
     * The map model associated with this setting model.
     * @readonly
     * @type {WT_MapModel}
     */
    get mapModel() {
        return this._mapModel;
    }

    /**
     * The map view associated with this setting model.
     * @readonly
     * @type {WT_MapView}
     */
    get mapView() {
        return this._mapView;
    }

    _onSyncPendingChanged(key, newValue, oldValue) {
        let syncID = newValue;
        if (syncID) {
            let source = WT_MapSettingModel._getSyncSource(syncID);
            if (source === this.id) {
                for (let setting of this._settings) {
                    if (setting.isSyncable) {
                        setting.syncTo(syncID);
                    }
                }
            }
        }
        WTDataStore.set(`${this.id}.${WT_MapSettingModel.SYNC_ID_ACTIVE_KEY}`, syncID);
    }

    _onSyncActiveChanged(key, newValue, oldValue) {
        let syncID = newValue;
        if (syncID) {
            let source = WT_MapSettingModel._getSyncSource(syncID);
            if (source !== this.id) {
                for (let setting of this._settings) {
                    if (setting.isSyncable) {
                        setting.syncFrom(syncID);
                    }
                }
            }
        }
    }

    _onSyncRecordChanged(syncID, setting, key, newValue, oldValue) {
        if (WT_MapSettingModel._getActiveSyncID(this.id) === syncID) {
            setting.syncFrom(syncID);
        }
    }

    _registerSyncListenerHelper(root, current) {
        if (!current.isSyncable) {
            return;
        }

        if (current.key) {
            let syncID = WT_MapSettingModel.SyncID[WT_MapSettingModel.SyncMode.ALL];
            WTDataStore.addListener(this._onSyncRecordChanged.bind(this, syncID, root), `${syncID}.${current.key}`);
        } else {
            for (let recurse of current.getSettings()) {
                this._registerSyncListenerHelper(root, recurse);
            }
        }
    }

    _registerSyncListener(setting) {
        this._registerSyncListenerHelper(setting, setting);
    }

    /**
     * Adds a setting to this controller.
     * @param {WT_MapSettingLike} setting
     */
    addSetting(setting) {
        this._settings.push(setting);
        this._registerSyncListener(setting);
    }

    static _getSyncSource(syncID) {
        return WTDataStore.get(`${syncID}.${WT_MapSettingModel.SYNC_SOURCE_KEY}`, "");
    }

    static _getActiveSyncID(settingModelID) {
        return WTDataStore.get(`${settingModelID}.${WT_MapSettingModel.SYNC_ID_ACTIVE_KEY}`, "");
    }

    /**
     * Sets the value of a setting.
     * @param {String} id - the string ID of the controller to which the setting belongs.
     * @param {String} settingKey - the data store key of the setting.
     * @param {*} value - the new value of the setting.
     */
    static setSettingValue(id, settingKey, value, isSyncable) {
        let synced = false;
        if (isSyncable) {
            let syncID = WT_MapSettingModel._getActiveSyncID(id);
            if (syncID) {
                WTDataStore.set(`${syncID}.${settingKey}`, value);
                synced = true;
            }
        }
        if (!synced) {
            super.setSettingValue(id, settingKey, value);
        }
    }

    static getSyncMode(settingModelID) {
        return WTDataStore.get(`${settingModelID}.${WT_MapSettingModel.SYNC_MODE_KEY}`, WT_MapSettingModel.SyncMode.OFF);
    }

    static setSyncMode(settingModelID, syncMode, sourceID) {
        let syncID = WT_MapSettingModel.SyncID[syncMode];
        WTDataStore.set(`${settingModelID}.${WT_MapSettingModel.SYNC_MODE_KEY}`, syncMode);
        if (syncMode !== WT_MapSettingModel.SyncMode.OFF) {
            WTDataStore.set(`${syncID}.${WT_MapSettingModel.SYNC_SOURCE_KEY}`, sourceID);
        }
        WTDataStore.set(`${settingModelID}.${WT_MapSettingModel.SYNC_ID_PENDING_KEY}`, syncID);
    }
}
WT_MapSettingModel.SYNC_MODE_KEY = "WT_Map_Sync_Mode";
WT_MapSettingModel.SYNC_ID_ACTIVE_KEY = "WT_Map_Sync_ID_Active";
WT_MapSettingModel.SYNC_ID_PENDING_KEY = "WT_Map_Sync_ID_Pending";
WT_MapSettingModel.SYNC_SOURCE_KEY = "WT_Map_Sync_Source";

/**
 * @enum {Number}
 */
WT_MapSettingModel.SyncMode = {
    OFF: 0,
    ALL: 1,
    LEFT: 2,
    RIGHT: 3
}
WT_MapSettingModel.SyncID = [
    "",
    "MapSyncAll",
    "MapSyncLeft",
    "MapSyncRight"
];

/**
 * @typedef {WT_MapSetting|WT_MapSettingGroup} WT_MapSettingLike
 */

/**
 * A class that represents a player-configurable map setting and defines how MapInstrument should respond to changes in that setting.
 * Each WT_MapSetting object is associated with a particular WT_MapElement object which defines which map instrument the setting is tied to.
 */
class WT_MapSetting extends WT_DataStoreSetting {
    /**
     * @param {WT_MapSettingModel} model - the model with which to associate the new setting.
     * @param {String} key - the data store key of the new setting.
     * @param {*} [defaultValue=0] - the value to which the new setting should default if it is not persistent or if a value cannot be retrieved
     *                               from the data store.
     * @param {Boolean} [isSyncable] - whether the new setting is sync-able. True by default.
     * @param {Boolean} [autoUpdate] - whether the new setting should automatically call its update() method whenever its value
     *                                 changes. True by default.
     * @param {Boolean} [isPersistent] - whether the new setting persists across sessions.
     */
    constructor(model, key, defaultValue = 0, isSyncable = false, autoUpdate = true, isPersistent = false) {
        super(model, key, defaultValue, autoUpdate, isPersistent);

        this._isSyncable = isSyncable;
    }

    /**
     * The map model associated with this setting.
     * @readonly
     * @type {WT_MapModel}
     */
    get mapModel() {
        return this._model.mapModel;
    }

    /**
     * The map view associated with this setting.
     * @readonly
     * @type {WT_MapView}
     */
    get mapView() {
        return this._model.mapView;
    }

    /**
     * Whether this setting is sync-able.
     * @readonly
     * @type {Boolean}
     */
    get isSyncable() {
        return this._isSyncable;
    }

    /**
     * Sets the value of this setting.
     * @param {*} value - the new value.
     */
    setValue(value) {
        WT_MapSettingModel.setSettingValue(this._model.id, this.key, value, this.isSyncable);
    }

    /**
     * Copies the value of this setting from a sync record.
     * @param {String} syncID - the ID of the sync record from which to copy.
     */
    syncFrom(syncID) {
        let newValue = WT_DataStoreSettingModel.getSettingValue(syncID, this.key, this.defaultValue);
        WTDataStore.set(this._fullDataStoreKey, newValue);
    }

    /**
     * Copies the value of this setting to a sync record.
     * @param {String} syncID - the ID of the sync record to which to copy.
     */
    syncTo(syncID) {
        WT_DataStoreSettingModel.setSettingValue(syncID, this.key, this.getValue());
    }
}

/**
 * This is a convenience class for bundling together multiple map settings that should logically be handled as a group.
 */
class WT_MapSettingGroup extends WT_DataStoreSettingGroup {
    /**
     * @param {WT_MapSettingModel} model - the setting model with which to associate the new setting group.
     * @param {Iterable<WT_MapSettingLike>} [settings] - an Iterable of WT_MapSetting or WT_MapSettingGroup objects to be added to this group.
     * @param {Boolean} [isSyncable] - whether any settings belonging to the new group are sync-able. False by default.
     * @param {Boolean} [autoUpdate] - whether the new setting group should automatically call its update() method whenever the value
     *                                 of any of its constituent settings changes. False by default.
     */
    constructor(model, settings = [], isSyncable = false, autoUpdate = false) {
        super(model, settings, autoUpdate);

        this._isSyncable = isSyncable;
    }

    /**
     * The map model associated with this setting group.
     * @readonly
     * @type {WT_MapModel}
     */
    get mapModel() {
        return this._model.mapModel;
    }

    /**
     * The map view associated with this setting group.
     * @readonly
     * @type {WT_MapView}
     */
    get mapView() {
        return this._model.mapView;
    }

    /**
     * Whether this setting group is sync-able.
     * @readonly
     * @type {Boolean}
     */
    get isSyncable() {
        return this._isSyncable;
    }

    /**
     * Copies the values of all settings in this group from a sync record.
     * @param {string} syncID - the ID of the sync record from which to copy.
     */
    syncFrom(syncID) {
        for (let setting of this._settings) {
            if (setting.isSyncable) {
                setting.syncFrom(syncID);
            }
        }
    }

    /**
     * Copies the values of all settings in this group to a sync record.
     * @param {String} syncID - the ID of the sync record to which to copy.
     */
    syncTo(syncID) {
        for (let setting of this._settings) {
            if (setting.isSyncable) {
                setting.syncTo(syncID);
            }
        }
    }
}

class WT_MapTargetSetting extends WT_MapSetting {
    constructor(model, defaultValue = WT_MapTargetSetting.Mode.TRACK_PLANE, autoUpdate = false, isPersistent = false, key = WT_MapTargetSetting.KEY_DEFAULT) {
        super(model, key, defaultValue, false, autoUpdate, isPersistent);
    }
}
WT_MapTargetSetting.KEY_DEFAULT = "WT_Map_Target";
WT_MapTargetSetting.Mode = {
    TRACK_PLANE: 0,
    TRACK_LATLONG: 1
};

class WT_MapRangeSetting extends WT_MapSetting {
    /**
     *
     * @param {WT_MapSettingModel} model - the setting model with which to associate the new setting.
     * @param {WT_NumberUnit[]} ranges - an array of possible range values of the new setting.
     * @param {WT_NumberUnit} defaultRange - the default range of the new setting.
     * @param {Boolean} [isSyncable] - whether the fuel ring settings are sync-able. True by default.
     * @param {Boolean} [autoUpdate] - whether the new setting group should automatically call its update() method whenever the value
     *                                 of any of its constituent settings changes. True by default.
     * @param {Boolean} [isPersistent] - whether the fuel ring settings persist across sessions. True by default.
     * @param {String} [key] - the data store key of the new setting.
     */
    constructor(model, ranges, defaultRange, isSyncable = true, autoUpdate = true, isPersistent = false, key = WT_MapRangeSetting.KEY_DEFAULT) {
        super(model, key, ranges.findIndex(range => range.equals(defaultRange)), isSyncable, autoUpdate, isPersistent);

        this._ranges = Array.from(ranges);
        this._rangesReadOnly = new WT_ReadOnlyArray(this._ranges);
    }

    /**
     * An array of this setting's possible range values.
     * @readonly
     * @type {WT_ReadOnlyArray<WT_NumberUnit>}
     */
    get ranges() {
        return this._rangesReadOnly;
    }

    /**
     * Gets this setting's current range value.
     * @returns {WT_NumberUnitReadOnly} this setting's current range value.
     */
    getRange() {
        return this._ranges[this.getValue()].readonly();
    }

    /**
     * Sets this setting's range value.
     * @param {WT_NumberUnit} newRange - the new range.
     */
    setRange(newRange) {
        let index = this._ranges.findIndex(range => range.equals(newRange));
        if (index >= 0) {
            this.setValue(index);
        }
    }

    /**
     * Increases or decreases this setting's range by a certain amount of range levels.
     * @param {Number} deltaIndex - the difference between the index of the new range level and the index of the
     *                              current range level.
     */
    changeRange(deltaIndex) {
        let currentIndex = this.getValue();
        let targetIndex = Math.max(0, Math.min(this.ranges.length - 1, currentIndex + deltaIndex));
        this.setValue(targetIndex);
    }

    update() {
        this.mapModel.range = this.getRange();
    }
}
WT_MapRangeSetting.KEY_DEFAULT = "WT_Map_Zoom";