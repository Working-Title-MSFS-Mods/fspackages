/**
 * A map model controller that uses the data store to sync a map model across instruments. In addition to syncing a single
 * model across instruments, the map controller also supports syncing user-configurable settings across multiple map models.
 */
class WT_MapController extends WT_DataStoreController {
    /**
     * @param {String} id - the unique string ID of the new controller.
     * @param {WT_MapModel} model - the model controlled by the new controller.
     * @param {WT_MapView} view - the view associated with the new controller's model.
     */
    constructor(id, model, view) {
        super(id, model);

        this._view = view;

        WTDataStore.addListener(this._onSyncPendingChanged.bind(this), `${this.id}.${WT_MapController.SYNC_ID_PENDING_KEY}`);
        WTDataStore.addListener(this._onSyncActiveChanged.bind(this), `${this.id}.${WT_MapController.SYNC_ID_ACTIVE_KEY}`);
    }

    /**
     * @readonly
     * @property {WT_MapView} view - the view associated with this controller.
     * @type {WT_MapView}
     */
    get view() {
        return this._view;
    }

    _onSyncPendingChanged(key, newValue, oldValue) {
        let syncID = newValue;
        if (syncID) {
            let source = WT_MapController._getSyncSource(syncID);
            if (source === this.id) {
                for (let setting of this._settings) {
                    if (setting.isSyncable) {
                        setting.syncTo(syncID);
                    }
                }
            }
        }
        WTDataStore.set(`${this.id}.${WT_MapController.SYNC_ID_ACTIVE_KEY}`, syncID);
    }

    _onSyncActiveChanged(key, newValue, oldValue) {
        let syncID = newValue;
        if (syncID) {
            let source = WT_MapController._getSyncSource(syncID);
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
        if (WT_MapController._getActiveSyncID(this.id) === syncID) {
            setting.syncFrom(syncID);
        }
    }

    _registerSyncListenerHelper(root, current) {
        if (!current.isSyncable) {
            return;
        }

        if (current.key) {
            let syncID = WT_MapController.SyncID[WT_MapController.SyncMode.ALL];
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
        return WTDataStore.get(`${syncID}.${WT_MapController.SYNC_SOURCE_KEY}`, "");
    }

    static _getActiveSyncID(controllerID) {
        return WTDataStore.get(`${controllerID}.${WT_MapController.SYNC_ID_ACTIVE_KEY}`, "");
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
            let syncID = WT_MapController._getActiveSyncID(id);
            if (syncID) {
                WTDataStore.set(`${syncID}.${settingKey}`, value);
                synced = true;
            }
        }
        if (!synced) {
            super.setSettingValue(id, settingKey, value);
        }
    }

    static getSyncMode(controllerID) {
        return WTDataStore.get(`${controllerID}.${WT_MapController.SYNC_MODE_KEY}`, WT_MapController.SyncMode.OFF);
    }

    static setSyncMode(controllerID, syncMode, sourceID) {
        let syncID = WT_MapController.SyncID[syncMode];
        WTDataStore.set(`${controllerID}.${WT_MapController.SYNC_MODE_KEY}`, syncMode);
        if (syncMode !== WT_MapController.SyncMode.OFF) {
            WTDataStore.set(`${syncID}.${WT_MapController.SYNC_SOURCE_KEY}`, sourceID);
        }
        WTDataStore.set(`${controllerID}.${WT_MapController.SYNC_ID_PENDING_KEY}`, syncID);
    }
}
WT_MapController.SYNC_MODE_KEY = "WT_Map_Sync_Mode";
WT_MapController.SYNC_ID_ACTIVE_KEY = "WT_Map_Sync_ID_Active";
WT_MapController.SYNC_ID_PENDING_KEY = "WT_Map_Sync_ID_Pending";
WT_MapController.SYNC_SOURCE_KEY = "WT_Map_Sync_Source";

/**
 * @enum {Number}
 */
WT_MapController.SyncMode = {
    OFF: 0,
    ALL: 1,
    LEFT: 2,
    RIGHT: 3
}
WT_MapController.SyncID = [
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
     * @param {WT_MapController} controller - the controller with which to associate the new setting.
     * @param {String} key - the data store key of the new setting.
     * @param {*} [defaultValue=0] - the value to which the new setting should default if it is not persistent or if a value cannot be retrieved
     *                               from the data store.
     * @param {Boolean} [isSyncable] - whether the new setting is sync-able. True by default.
     * @param {Boolean} [autoUpdate] - whether the new setting should automatically update its associated model/view whenever its value
     *                                 changes. True by default.
     * @param {Boolean} [isPersistent] - whether the new setting persists across sessions.
     */
    constructor(controller, key, defaultValue = 0, isSyncable = false, autoUpdate = true, isPersistent = false) {
        super(controller, key, defaultValue, autoUpdate, isPersistent);

        this._isSyncable = isSyncable;
    }

    /**
     * @readonly
     * @property {WT_MapView} view - the view this setting controls.
     * @type {WT_MapView}
     */
    get view() {
        return this._controller.view;
    }

    /**
     * @readonly
     * @property {Boolean} isSyncable - whether this setting is sync-able.
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
        WT_MapController.setSettingValue(this._controller.id, this.key, value, this.isSyncable);
    }

    /**
     * Copies the value of this setting from a sync record.
     * @param {String} syncID - the ID of the sync record from which to copy.
     */
    syncFrom(syncID) {
        let newValue = WT_DataStoreController.getSettingValue(syncID, this.key, this.defaultValue);
        WTDataStore.set(this._fullDataStoreKey, newValue);
    }

    /**
     * Copies the value of this setting to a sync record.
     * @param {String} syncID - the ID of the sync record to which to copy.
     */
    syncTo(syncID) {
        WT_DataStoreController.setSettingValue(syncID, this.key, this.getValue());
    }
}

/**
 * This is a convenience class for bundling together multiple map settings that should logically be handled as a group.
 */
class WT_MapSettingGroup extends WT_DataStoreSettingGroup {
    /**
     * @param {WT_MapController} controller - the WT_MapElement object to associate the setting group with.
     * @param {Iterable<WT_MapSettingLike>} [settings] - an Iterable of WT_MapSetting or WT_MapSettingGroup objects to be added to this group.
     * @param {Boolean} [isSyncable] - whether any settings belonging to the new group are sync-able. False by default.
     * @param {Boolean} [autoUpdate] - whether the new setting group should automatically update its associated model/view whenever the value
     *                                 of any of its consituent settings changes. False by default.
     */
    constructor(controller, settings = [], isSyncable = false, autoUpdate = false) {
        super(controller, settings, autoUpdate);

        this._isSyncable = isSyncable;
    }

    /**
     * @readonly
     * @property {WT_MapView} view - the view this setting group controls.
     * @type {WT_MapView}
     */
    get view() {
        return this._controller.view;
    }

    /**
     * @readonly
     * @property {Boolean} isSyncable - whether this setting is sync-able.
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
    constructor(controller, defaultValue = WT_MapTargetSetting.Mode.TRACK_PLANE, autoUpdate = false, isPersistent = false, key = WT_MapTargetSetting.KEY_DEFAULT) {
        super(controller, key, defaultValue, false, autoUpdate, isPersistent);
    }
}
WT_MapTargetSetting.KEY_DEFAULT = "WT_Map_Target";
WT_MapTargetSetting.Mode = {
    TRACK_PLANE: 0,
    TRACK_LATLONG: 1
};

class WT_MapRangeSetting extends WT_MapSetting {
    constructor(controller, ranges, defaultRange, isSyncable = true, autoUpdate = true, isPersistent = false, key = WT_MapRangeSetting.KEY_DEFAULT) {
        super(controller, key, ranges.findIndex(range => range.equals(defaultRange)), isSyncable, autoUpdate, isPersistent);
        this._ranges = ranges;
    }

    getRange() {
        return this._ranges[this.getValue()];
    }

    setRange(newRange) {
        let index = this._ranges.findIndex(range => range.equals(newRange));
        if (index >= 0) {
            this.setValue(index);
        }
    }

    update() {
        this.model.range = this.getRange();
    }
}
WT_MapRangeSetting.KEY_DEFAULT = "WT_Map_Zoom";