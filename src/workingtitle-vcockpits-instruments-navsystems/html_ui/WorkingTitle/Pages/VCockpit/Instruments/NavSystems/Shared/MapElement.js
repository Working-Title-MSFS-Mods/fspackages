/**
 * This class controls an underlying MapInstrument instance in response to player-configurable settings. It will also handle syncing of map settings across different instruments.
 * Setting-specific behavior is delegated to WT_MapSetting objects, an arbitrary number of which can be added to a WT_MapElement instance.
 * Therefore, the set of WT_MapSetting objects added to a WT_MapElement object will define which settings the latter will respond to.
 */
class WT_MapElement extends MapInstrumentElement {
    /**
     * @param _varNameID - A unique string identifier for the instrument to be controlled by the new WT_MapElement instance.
     * @param [_settings] - An Iterable of WT_MapSetting or WT_MapSettingGroup, representing settings that the new WT_MapElement will respond to. These settings will be automatically added to the new instance.
     */
    constructor(_varNameID, _settings = []) {
        super();
        this.varNameID = _varNameID;

        this._settings = Array.from(_settings);
        this._settingsToSync = [];
        for (let setting of this._settings) {
            if (setting.toSync) {
                this._settingsToSync.push(setting);
            }
        }
    }

    /**
     * Adds a setting to which this object will respond.
     * @param {(WT_MapSetting|WT_MapSettingGroup)} _setting.
     */
    addSetting(_setting) {
        this._settings.push(_setting);
        if (_setting.toSync) {
            this._settingsToSync.push(_setting);
        }
    }

    /**
     * Subclasses should call this method at an appropriate point in their onTemplateLoaded() method to trigger the initialization of all settings that have been added to this object.
     */
    callSettingsOnTemplateLoaded() {
        for (let setting of this._settings) {
            setting.onTemplateLoaded();
        }
    }

    /**
     * This method will be called on every update step.
     */
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);

        let initID = WT_MapElement.getSettingVar(WT_MapElement.VARNAME_SYNC_INIT_ROOT_DEFAULT, WT_MapElement.VARNAME_SYNC_ALL_ID, "");
        if (initID == this.varNameID) {
            this.syncAllSettingsToMaster();
            WT_MapElement.setSettingVar(WT_MapElement.VARNAME_SYNC_INIT_ROOT_DEFAULT, WT_MapElement.VARNAME_SYNC_ALL_ID, "");
            WT_MapElement.setSettingVar(WT_MapElement.VARNAME_SYNC_ROOT, WT_MapElement.VARNAME_SYNC_ALL_ID, WT_MapElement.Sync.ALL);
        } else {
            let sync = WT_MapElement.getSettingVar(WT_MapElement.VARNAME_SYNC_ROOT, WT_MapElement.VARNAME_SYNC_ALL_ID);
            if (sync == WT_MapElement.Sync.ALL) {
                for (let setting of this._settingsToSync) {
                    setting.syncFrom(WT_MapElement.VARNAME_SYNC_ALL_ID);
                }
            }
        }

        for (let setting of this._settings) {
            setting.onUpdate();
        }
    }

    /**
     * Copies the values of all settings added to this object into the master sync record.
     */
    syncAllSettingsToMaster() {
        for (let setting of this._settingsToSync) {
            setting.syncTo(WT_MapElement.VARNAME_SYNC_ALL_ID);
        }
    }

    /**
     * Sets the value of a setting and also updates the master sync record if appropriate. This method should be called by code responding to player UI input to change sync-able settings.
     * @param {string} _root - the identifier of the setting to change.
     * @param {string} _id - the identifier of the instrument to apply the change to.
     * @param _val - the new value of the setting.
     */
    static setSyncedSettingVar(_root, _id, _val) {
        WT_MapElement.setSettingVar(_root, _id, _val);
        if (WT_MapElement.getSettingVar(WT_MapElement.VARNAME_SYNC_ROOT, WT_MapElement.VARNAME_SYNC_ALL_ID) == 1) {
            WT_MapElement.setSettingVar(_root, WT_MapElement.VARNAME_SYNC_ALL_ID, _val);
        }
    }

    /**
     * Sets the value of a setting. This method will not update the master sync record. This method should be called by code responding to player UI input to change non-sync-able settings.
     * @param {string} _root - the identifier of the setting to change.
     * @param {string} _id - the identifier of the instrument to apply the change to.
     * @param _val - the new value of the setting.
     */
    static setSettingVar(_root, _id, _val) {
        WTDataStore.set(`${_id}.${_root}`, _val);
    }

    /**
     * Gets the current value of a setting.
     * @param {string} _root - the identifier of the setting.
     * @param {string} _id - the identifier of the instrument tied to the setting.
     * @param [_default=0] - the default value to return if no current value can be found.
     * @returns the current value of the specified setting, or the default value if no current value can be found.
     */
    static getSettingVar(_root, _id, _default = 0) {
        return WTDataStore.get(`${_id}.${_root}`, _default);
    }
}
WT_MapElement.VARNAME_SYNC_ROOT = "L:WT_Map_Sync";
WT_MapElement.VARNAME_SYNC_ALL_ID = "SyncAll";
WT_MapElement.VARNAME_SYNC_INIT_ROOT_DEFAULT = "L:WT_Map_Sync_Init";

WT_MapElement.Sync = {
    OFF: 0,
    ALL: 1
};

/**
 * A class that represents a player-configurable map setting and defines how MapInstrument should respond to changes in that setting.
 * Each WT_MapSetting object is associated with a particular WT_MapElement object which defines which map instrument the setting is tied to.
 */
class WT_MapSetting {
    /**
     * @param {WT_MapElement} _mapElement - the WT_MapElement object to associate the new setting with.
     * @param {string} _varNameRoot - the identifier of new setting.
     * @param {boolean} _toSync - whether the new setting is sync-able.
     * @param [_defaultValue=0] - the value this setting should default to if one cannot be retrieved from the data store.
     */
    constructor(_mapElement, _varNameRoot, _toSync, _defaultValue = 0) {
        this.mapElement = _mapElement;
        this.varNameRoot = _varNameRoot;
        this._toSync = _toSync;
        this.defaultValue = _defaultValue;
    }

    /**
     * @returns {boolean} whether this setting is sync-able.
     */
    get toSync() {
        return this._toSync;
    }

    /**
     * Sets the value of this setting.
     * @param _val - the new value.
     * @param {boolean} [_skipSync=false] - whether to skip copying the new value to the master sync record (this only has an effect if this setting is sync-able).
     */
    setValue(_val, _skipSync = false) {
        if (this.toSync && !_skipSync) {
            WT_MapElement.setSyncedSettingVar(this.varNameRoot, this.mapElement.varNameID, _val);
        } else {
            WT_MapElement.setSettingVar(this.varNameRoot, this.mapElement.varNameID, _val);
        }
    }

    /**
     * @returns the current value of this setting.
     */
    getValue() {
        return WT_MapElement.getSettingVar(this.varNameRoot, this.mapElement.varNameID, this.defaultValue);
    }

    /**
     * Copies the current value of this setting to a sync record.
     * @param {string} _syncID - the identifier of the sync record to copy to.
     */
    syncTo(_syncID) {
        WT_MapElement.setSettingVar(this.varNameRoot, _syncID, this.getValue());
    }

    /**
     * Set the current value of this setting to one stored in a sync record.
     * @param {string} _syncID - the identifier of the sync record to copy from.
     */
    syncFrom(_syncID) {
        let newVal = WT_MapElement.getSettingVar(this.varNameRoot, _syncID);
        this.setValue(newVal, true);
    }

    /**
     * This method is called from the onTemplateLoaded() method of the WT_MapElement object this setting is associated with.
     */
    onTemplateLoaded() {
    }

    /**
     * This method is called from the onUpdate() method of the WT_MapElement object this setting is associated with.
     */
    onUpdate() {
    }
}

/**
 * This is a convenience class for bundling together multiple map settings that should logically be handled as a group.
 */
class WT_MapSettingGroup {
    /**
     * @param {WT_MapElement} _mapElement - the WT_MapElement object to associate the setting group with.
     * @param {boolean} _toSync - whether the settings belonging to this group are sync-able.
     * @param [_settings] - an Iterable of WT_MapSetting or WT_MapSettingGroup objects to be added to this group.
     */
    constructor(_mapElement, _toSync, _settings = []) {
        this.mapElement = _mapElement;
        this._toSync = _toSync;

        this._settings = Array.from(_settings);
    }

    /**
     * @returns {Array} an array of setting string identifiers belonging to the settings in this group. The order is the same as that in which the settings were originally added to this group.
     */
    get varNameRoot() {
        return Array.from(this._settings, setting => setting.varNameRoot);
    }

    /**
     * @returns {boolean} whether the settings in this group are sync-able.
     */
    get toSync() {
        return this._toSync;
    }

    /**
     * @returns {Array} an array of values belonging to the settings in this group. The order is the same as that in which the settings were originally added to this group.
     */
    getValue() {
        return Array.from(this._settings, setting => setting.getValue());
    }

    /**
     * Adds a setting to this group.
     * @param {(WT_MapSetting|WT_MapSettingGroup)} _setting
     */
    addSetting(_setting) {
        this._settings.push(_setting);
    }

    /**
     * Copies the current values all settings in this group to a sync record.
     * @param {string} _syncID - the identifier of the sync record to copy to.
     */
    syncTo(_syncID) {
        for (let setting of this._settings) {
            if (setting.toSync) {
                setting.syncTo(_syncID);
            }
        }
    }

    /**
     * Sets the current values of all settings in this group to those stored in a sync record.
     * @param {string} _syncID - the identifier of the sync record to copy from.
     */
    syncFrom(_syncID) {
        for (let setting of this._settings) {
            if (setting.toSync) {
                setting.syncFrom(_syncID);
            }
        }
    }

    /**
     * This method is called from the onTemplateLoaded() method of the WT_MapElement object this setting group is associated with.
     * By default, this method will call the onTemplateLoaded() method of all settings added to this group.
     * Subclasses may override this method if initialization as a group is desired over one-by-one initialization.
     */
    onTemplateLoaded() {
        for (let setting of this._settings) {
            setting.onTemplateLoaded();
        }
    }

    /**
     * This method is called from the onUpdate() method of the WT_MapElement object this setting group is associated with.
     * By default, this method will call the onUpdate() method of all settings added to this group.
     * Subclasses may override this method if updating as a group is desired over one-by-one updating.
     */
    onUpdate() {
        for (let setting of this._settings) {
            setting.onUpdate();
        }
    }
}

/**
 * This class represents a setting controlling map orientation (rotation). This abstract class should be extended and the getRotation() method defined.
 * getRotation() will be called each update step and should return the rotation (in degrees) the map should adopt.
 * By convention, 0 degrees is the default orientation (north up) with positive deviation representing clockwise rotation.
 */
class WT_MapOrientationSetting extends WT_MapSetting {
    constructor(_mapElement, _varNameRoot = WT_MapOrientationSetting.VARNAME_ROOT_DEFAULT, _toSync = true) {
        super(_mapElement, _varNameRoot, _toSync);
    }

    onTemplateLoaded() {
        super.onTemplateLoaded();
        this.mapElement.instrument.rotationHandler = this;
    }
}
WT_MapOrientationSetting.VARNAME_ROOT_DEFAULT = "L:WT_Map_Orientation";

/**
 * This class represents a setting controlling map terrain display. Three modes are supported by default.
 * Terrain OFF disables display of terrain color information (all land will be colored as black).
 * Terrain ABSOLUTE enables display of terrain color information based on elevation above MSL.
 * Terrain RELATIVE enables display of terrain color information based on height above/below the plane.
 */
class WT_MapTerrainModeSetting extends WT_MapSetting {
    constructor(_mapElement, _varNameRoot = WT_MapTerrainModeSetting.VARNAME_ROOT_DEFAULT, _toSync = true) {
        super(_mapElement, _varNameRoot, _toSync);
    }

    onUpdate() {
        let mode = this.getValue();
        if (mode == WT_MapTerrainModeSetting.Mode.RELATIVE && SimVar.GetSimVarValue("SIM ON GROUND", "bool")) {
            mode = WT_MapTerrainModeSetting.Mode.OFF;
        }
        this.mapElement.instrument.mapConfigId = mode;
        if (mode == WT_MapTerrainModeSetting.Mode.RELATIVE) {
            this.mapElement.instrument.bingMapRef = EBingReference.PLANE;
        } else {
            this.mapElement.instrument.bingMapRef = EBingReference.SEA;
        }
    }
}
WT_MapTerrainModeSetting.VARNAME_ROOT_DEFAULT = "L:WT_Map_Terrain_Mode";
WT_MapTerrainModeSetting.Mode = {
    OFF: 0,
    ABSOLUTE: 1,
    RELATIVE: 2
};

/**
 * This class represents a setting controlling map declutter. An arbitrary number of declutter levels are supported.
 */
class WT_MapDcltrSetting extends WT_MapSetting {
    /**
     * @param {WT_MapElement} _mapElement - the WT_MapElement object to associate the new setting with
     * @param _dcltrDefinitions - an ordered Iterable of declutter level definitions. The first element will define the first declutter level, and so on.
     * A declutter level definition should itself be an Iterable of [key, value] pairs where key is a symbol visibility attribute and value is a boolean determining whether the attribute should be visible.
     * Invalid keys will be ignored. The list of acceptable keys is:
     * * show-roads
     * * show-cities
     * * show-airspaces
     * * show-airways
     * * show-vors
     * * show-ndbs
     * * show-intersections
     * * show-airports
     * @param {string} [_varNameRoot=WT_MapDcltrSetting.VARNAME_ROOT_DEFAULT] - the identifier of new setting.
     * @param {boolean} [_toSync=true] - whether the new setting is sync-able.
     */
    constructor(_mapElement, _dcltrDefinitions, _varNameRoot = WT_MapDcltrSetting.VARNAME_ROOT_DEFAULT, _toSync = true) {
        super(_mapElement, _varNameRoot, _toSync);

        this.dcltrLevels = [];
        for (let levelDef of _dcltrDefinitions) {
            let dcltrLevel = new Map(WT_MapDcltrSetting.DCLTR_DEFINITION_DEFAULT);
            for (let [attr, show] of levelDef) {
                if (dcltrLevel.has(attr)) {
                    dcltrLevel.set(attr, show);
                }
            }
            this.dcltrLevels.push(dcltrLevel);
        }
    }

    /**
     * @returns a Map of [key, value] pairs representing the definition of the current declutter level.
     */
    getDeclutterLevel() {
        return this.dcltrLevels[this.getValue()];
    }
}
WT_MapDcltrSetting.VARNAME_ROOT_DEFAULT = "L:WT_Map_Dcltr";
WT_MapDcltrSetting.DCLTR_DEFINITION_DEFAULT = new Map([
        ["show-roads", true],
        ["show-cities", true],
        ["show-airspaces", true],
        ["show-airways", true],
        ["show-vors", true],
        ["show-ndbs", true],
        ["show-intersections", true],
        ["show-airports", true]
]);

/**
 * This class represents a setting controlling the visibility of a map symbol type. This setting can take a value of either 0 (false) or 1 (true).
 */
class WT_MapSymbolVisSetting extends WT_MapSetting {
    /**
     * @param {WT_MapElement} _mapElement - the WT_MapElement object to associate the new setting with.
     * @param {string} _attrName - the name of the symbol visibility attribute controlled by the new setting.
     * @param {string} _varNameRoot - the identifier of new setting.
     * @param [_dcltrSetting] - a WT_MapDcltrSetting object to associate with the new setting.
     * If supplied, the symbol type controlled by the new setting will not be displayed if it is decluttered by the current declutter level.
     * @param {boolean} [_toSync=true] - whether the new setting is sync-able.
     * @param [_defaultValue=1]
     */
    constructor(_mapElement, _attrName, _varNameRoot, _dcltrSetting = null, _toSync = true, _defaultValue = 1) {
        super(_mapElement, _varNameRoot, _toSync, _defaultValue);

        this.attrName = _attrName;
        this.dcltrSetting = _dcltrSetting;
    }

    onUpdate() {
        let show = (this.getValue() == 1)
        if (this.dcltrSetting) {
            show = show && this.dcltrSetting.getDeclutterLevel().get(this.attrName);
        }
        this.mapElement.instrument.setAttribute(this.attrName, show);
    }
}

/**
 * This is a convenience class to group together different map symbol visibility settings along with a declutter setting.
 */
class WT_MapSymbolVisSettingGroup extends WT_MapSettingGroup {
    /**
     * By default, each new setting group is pre-populated with one setting for each symbol visibility attribute supported by MapInstrument.
     * The complete list is:
     * * show-roads
     * * show-cities
     * * show-airspaces
     * * show-airways
     * * show-vors
     * * show-ndbs
     * * show-intersections
     * * show-airports
     * @param {WT_MapElement} _mapElement - the WT_MapElement object to associate the new setting with.
     * @param {WT_MapDcltrSetting} _dcltrSetting - the declutter setting controlling the same group of map symbols.
     * @param {boolean} [_toSync=true] - whether the new setting is sync-able.
     */
    constructor(_mapElement, _dcltrSetting, _toSync = true) {
        super(_mapElement, _toSync);

        this.dcltrSetting = _dcltrSetting;
        this.addSetting(_dcltrSetting);

        for (let [attrName, varNameRoot] of WT_MapSymbolVisSettingGroup.VARNAME_ATTRIBUTES_ROOT) {
            this.addSetting(new WT_MapSymbolVisSetting(_mapElement, attrName, varNameRoot, this.dcltrSetting));
        }
    }
}
WT_MapSymbolVisSettingGroup.VARNAME_ATTRIBUTES_ROOT = new Map([
        ["show-roads", "L:WT_Map_Road_Show"],
        ["show-cities", "L:WT_Map_City_Show"],
        ["show-airspaces", "L:WT_Map_Airspace_Show"],
        ["show-airways", "L:WT_Map_Airway_Show"],
        ["show-vors", "L:WT_Map_VOR_Show"],
        ["show-ndbs", "L:WT_Map_NDB_Show"],
        ["show-intersections", "L:WT_Map_INT_Show"],
        ["show-airports", "L:WT_Map_Airport_Show"]
]);

/**
 * This class represents a setting controlling the maximum zoom range at which a type of map symbol remains visible.
 * Note that the setting is internally represented as a zoom index, rather than a range.
 * The list of valid map range visibility attributes that can be controlled by this class is as follows:
 * * airspaceMaxRangeIndex
 * * smallAirportMaxRangeIndex
 * * medAirportMaxRangeIndex
 * * largeAirportMaxRangeIndex
 * * vorMaxRangeIndex
 * * intMaxRangeIndex
 * * ndbMaxRangeIndex
 * * roadHighwayMaxRangeIndex
 * * roadTrunkMaxRangeIndex
 * * roadPrimaryMaxRangeIndex
 * * smallCityMaxRangeIndex
 * * medCityMaxRangeIndex
 * * largeCityMaxRangeIndex
 */
class WTMapSymbolRangeSetting extends WT_MapSetting {
    /**
     * @param {WT_MapElement} _mapElement - the WT_MapElement object to associate the new setting with.
     * @param {string} _varNameRoot - the identifier of new setting.
     * @param {string} _attrName - the name of the map range visibility attribute controlled by the new setting.
     * @param {number} _defaultRange - the default maximum range (in NM) of the new settings.
     * @param {boolean} [_toSync=true] - whether the new setting is sync-able.
     */
    constructor(_mapElement, _varNameRoot, _attrName, _defaultRange, _toSync = true) {
        super(_mapElement, _varNameRoot, _toSync, _mapElement.instrument.zoomRanges.indexOf(_defaultRange));
        this.attrName = _attrName;
    }

    onUpdate() {
        this.mapElement.instrument[this.attrName] = this.getValue();
    }
}

/**
 * This class represents a setting that forces a north-up map orientation above a certain map zoom range.
 * This class tracks two values - (1) whether the behavior is toggled on/off and (2) the map range threshold above which the auto north-up behavior is triggered.
 * This class does not implement the auto north-up behavior by itself; instead it should be paired with a WT_MapOrientationSetting object.
 */
class WT_MapAutoNorthUpSetting extends WT_MapSettingGroup {
    /**
     * @param {WT_MapElement} _mapElement - the WT_MapElement object to associate the new setting with.
     * @param {number} _defaultRange - the default threshold range (in NM).
     * @param {boolean} [_toSync=true] - whether the new setting is sync-able.
     */
    constructor(_mapElement, _defaultRange, _toSync = true) {
        super(_mapElement, _toSync);

        this.activeSetting = new WT_MapSetting(_mapElement, WT_MapAutoNorthUpSetting.VARNAME_ACTIVE_ROOT, _toSync);
        this.rangeSetting = new WT_MapSetting(_mapElement, WT_MapAutoNorthUpSetting.VARNAME_RANGE_ROOT, _toSync, _mapElement.instrument.zoomRanges.indexOf(_defaultRange));
        this.addSetting(this.activeSetting);
        this.addSetting(this.rangeSetting);
    }

    isActive() {
        return this.activeSetting.getValue() == 1;
    }

    getRangeIndex() {
        return this.rangeSetting.getValue();
    }
}
WT_MapAutoNorthUpSetting.VARNAME_ACTIVE_ROOT = "L:WT_Map_NorthUpAbove_Active";
WT_MapAutoNorthUpSetting.VARNAME_RANGE_ROOT = "L:WT_Map_NorthUpAbove_Range";

/**
 * This class represents a setting that controls the map's track vector overlay.
 * This class supports two player-configurable values: (1) whether to show the track vector, and (2) the lookahead time of the track vector.
 * The track vector is set to not be visible by default.
 */
class WT_MapTrackVectorSetting extends WT_MapSettingGroup {
    /**
     * @param {WT_MapElement} _mapElement - the WT_MapElement object to associate the new setting with.
     * @param [_lookaheadValues=WT_MapTrackVectorSetting.LOOKAHEAD_VALUES_DEFAULT] - an Iterable of the possible lookahead times (in seconds).
     * @param {number} [_lookaheadDefault=WT_MapTrackVectorSetting.LOOKAHEAD_DEFAULT] - the default lookahead time (in seconds).
     * @param {boolean} [_toSync=true] - whether the new setting is sync-able
     */
    constructor(_mapElement, _lookaheadValues = WT_MapTrackVectorSetting.LOOKAHEAD_VALUES_DEFAULT, _lookaheadDefault = WT_MapTrackVectorSetting.LOOKAHEAD_DEFAULT, _toSync = true) {
        super(_mapElement, _toSync);

        this.lookaheadValues = _lookaheadValues;
        this.activeSetting = new WT_MapSetting(_mapElement, WT_MapTrackVectorSetting.VARNAME_SHOW_ROOT, _toSync);
        this.lookaheadSetting = new WT_MapSetting(_mapElement, WT_MapTrackVectorSetting.VARNAME_LOOKAHEAD_ROOT, _toSync, this.lookaheadValues.indexOf(_lookaheadDefault));
        this.addSetting(this.activeSetting);
        this.addSetting(this.lookaheadSetting);
    }

    onUpdate() {
        super.onUpdate();

        let show = this.activeSetting.getValue() == 1;
        let lookahead = this.lookaheadValues[this.lookaheadSetting.getValue()];

        this.mapElement.instrument.showTrackVector = show;
        this.mapElement.instrument.trackVectorElement.lookahead = lookahead;
    }
}
WT_MapTrackVectorSetting.VARNAME_SHOW_ROOT = "L:WT_Map_TrackVector_Show";
WT_MapTrackVectorSetting.VARNAME_LOOKAHEAD_ROOT = "L:WT_Map_TrackVector_Lookahead";
WT_MapTrackVectorSetting.LOOKAHEAD_DEFAULT = 60;
WT_MapTrackVectorSetting.LOOKAHEAD_VALUES_DEFAULT = [30, 60, 120, 300, 600, 1200];

/**
 * This class represents a setting that controls the map's fuel ring overlay.
 * This class supports two player-configurable values: (1) whether to show the fuel ring, and (2) the reserve fuel time.
 * The fuel ring is set to not be visible by default.
 */
class WT_MapFuelRingSetting extends WT_MapSettingGroup {
    /**
     * @param {WT_MapElement} _mapElement - the WT_MapElement object to associate the new setting with.
     * @param {number} [_reserveDefault=WT_MapFuelRingSetting.VARNAME_RESERVE_DEFAULT] - the default reserve fuel time (in minutes).
     * @param {boolean} [_toSync=true] - whether the new setting is sync-able.
     */
    constructor(_mapElement, _reserveDefault = WT_MapFuelRingSetting.VARNAME_RESERVE_DEFAULT, _toSync = true) {
        super(_mapElement, _toSync);

        this.activeSetting = new WT_MapSetting(_mapElement, WT_MapFuelRingSetting.VARNAME_SHOW_ROOT, _toSync);
        this.reserveSetting = new WT_MapSetting(_mapElement, WT_MapFuelRingSetting.VARNAME_RESERVE_ROOT, _toSync, _reserveDefault);
        this.addSetting(this.activeSetting);
        this.addSetting(this.reserveSetting);
    }

    onUpdate() {
        super.onUpdate();

        if (this.mapElement.instrument.fuelRingElement) {
            let show = this.activeSetting.getValue() == 1;
            let reserveTime = this.reserveSetting.getValue();

            this.mapElement.instrument.showFuelRing = show;
            this.mapElement.instrument.fuelRingElement.reserveFuelTime = reserveTime;
        }
    }
}
WT_MapFuelRingSetting.VARNAME_SHOW_ROOT = "L:WT_Map_FuelRing_Show";
WT_MapFuelRingSetting.VARNAME_RESERVE_ROOT = "L:WT_Map_FuelRing_Reserve";
WT_MapFuelRingSetting.VARNAME_RESERVE_DEFAULT = 45;

/**
 * This class represents a setting that controls whether the map's altitude intercept arc overlay is visible.
 */
class WT_MapAltitudeInterceptSetting extends WT_MapSetting {
    /**
     * @param {WT_MapElement} _mapElement - the WT_MapElement object to associate the new setting with.
     * @param {string} [_varNameRoot=WT_MapAltitudeInterceptSetting.VARNAME_SHOW_ROOT_DEFAULT] - the identifier of the new setting.
     * @param {boolean} [_toSync=true] - whether the new setting is sync-able.
     */
    constructor(_mapElement, _varNameRoot = WT_MapAltitudeInterceptSetting.VARNAME_SHOW_ROOT_DEFAULT, _toSync = true) {
        super(_mapElement, _varNameRoot, _toSync);
    }

    onUpdate() {
        this.mapElement.instrument.showAltitudeIntercept = (this.getValue() == 1);
    }
}
WT_MapAltitudeInterceptSetting.VARNAME_SHOW_ROOT_DEFAULT = "L:WT_Map_AltitudeIntercept_Show";