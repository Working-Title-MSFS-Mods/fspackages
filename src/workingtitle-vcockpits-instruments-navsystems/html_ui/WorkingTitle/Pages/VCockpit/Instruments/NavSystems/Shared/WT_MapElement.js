class WT_MapElement extends MapInstrumentElement {
    // _settings should be an iterable of WT_MapSetting or WT_MapSettingGroup objects
    constructor(_simVarNameID, _settings = [], _syncVarName = WT_MapElement.VARNAME_SYNC, _syncInitVarName = WT_MapElement.VARNAME_SYNC_INIT_DEFAULT) {
        super();
        this.simVarNameID = _simVarNameID;
        this.syncVarName = _syncVarName;
        this.syncInitVarName = _syncInitVarName;
        
        this._settings = Array.from(_settings);
        this._settingsToSync = [];
        for (let setting of this._settings) {
            if (setting.toSync) {
                this._settingsToSync.push(setting);
            }
        }
        
        this._lastSync = 0;
    }
    
    addSetting(_setting) {
        this._settings.push(_setting);
        if (_setting.toSync) {
            this._settingsToSync.push(_setting);
        }
    }
    
    callSettingsOnTemplateLoaded() {
        for (let setting of this._settings) {
            setting.onTemplateLoaded();
        }
    }
    
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        
        let sync = SimVar.GetSimVarValue(this.syncVarName, "number");
        if (sync != this._lastSync) {
            if (sync == WT_MapElement.Sync.ALL) {
                let initIndex = SimVar.GetSimVarValue(this.syncInitVarName, "number");
                if (initIndex >= 0) {
                    let initID = WT_MapElement.SYNC_INITID_ARRAY[initIndex];
                    if (initID == this.simVarNameID) {
                        this.syncMasterToAllSettings();
                        SimVar.SetSimVarValue(this.syncInitVarName, "number", -1);
                    }
                }
            }
            this._lastSync = sync;
        }
        
        if (sync == WT_MapElement.Sync.ALL) {
            for (let setting of this._settingsToSync) {
                setting.syncFrom(WT_MapElement.VARNAME_SYNC_ALL_ID);
            }
        }
        
        for (let setting of this._settings) {
            setting.onUpdate();
        }
    }
    
    syncMasterToAllSettings() {
        for (let setting of this._settingsToSync) {
            setting.syncTo(WT_MapElement.VARNAME_SYNC_ALL_ID);
        }
    }
    
    static getSyncInitIDIndex(_id) {
        return WT_MapElement.SYNC_INITID_ARRAY.indexOf(_id);
    }
    
    static setSyncedSettingVar(_root, _id, _val) {
        WT_MapElement.setSettingVar(_root, _id, _val);
        if (SimVar.GetSimVarValue(WT_MapElement.VARNAME_SYNC, "number") == 1) {
            WT_MapElement.setSettingVar(_root, WT_MapElement.VARNAME_SYNC_ALL_ID, _val);
        }
    }
    
    static setSettingVar(_root, _id, _val) {
        SimVar.SetSimVarValue(_root + _id, "number", _val);
        WTDataStore.set(`${_id}.${_root}`, _val);
    }
}
WT_MapElement.VARNAME_SYNC = "L:WT_Map_Sync";
WT_MapElement.SYNC_INITID_ARRAY = ["_PFD", "_MFD"];
WT_MapElement.VARNAME_SYNC_ALL_ID = "_SyncAll";
WT_MapElement.VARNAME_SYNC_INIT_DEFAULT = "L:WT_Map_Sync_Init";

WT_MapElement.Sync = {
    OFF: 0,
    ALL: 1
};

class WT_MapSetting {
    constructor(_mapElement, _simVarNameRoot, _toSync, _defaultValue = 0, _useStorage = true) {
        this.mapElement = _mapElement;
        this.simVarNameRoot = _simVarNameRoot;
        this._toSync = _toSync;
        this.defaultValue = _defaultValue;
        this.useStorage = _useStorage;
    }
    
    get toSync() {
        return this._toSync;
    }
    
    setFromStorage() {
        let value = WTDataStore.get(`${this.mapElement.simVarNameID}.${this.simVarNameRoot}`, this.defaultValue);
        this.setValue(value);
    }
    
    setValue(_val) {
        SimVar.SetSimVarValue(this.simVarNameRoot + this.mapElement.simVarNameID, "number", _val);
    }
    
    getValue() {
        return SimVar.GetSimVarValue(this.simVarNameRoot + this.mapElement.simVarNameID, "number");
    }
    
    syncTo(_syncID) {
        SimVar.SetSimVarValue(this.simVarNameRoot + _syncID, "number", this.getValue());
    }
    
    syncFrom(_syncID) {
        let newVal = SimVar.GetSimVarValue(this.simVarNameRoot + _syncID, "number");
        this.setValue(newVal, this.mapElement.simVarNameID);
    }
    
    onTemplateLoaded() {
        if (this.useStorage) {
            this.setFromStorage();
        } else {
            setValue(this.defaultValue);
        }
    }
    
    onUpdate() {
    }
}

// convenience class for managing settings that logically should be handled as a group
class WT_MapSettingGroup {
    // _settings should be an iterable of WT_MapSetting or WT_MapSettingGroup objects
    constructor(_mapElement, _toSync, _settings = []) {
        this.mapElement = _mapElement;
        this._toSync = _toSync;
        
        this._settings = Array.from(_settings);
    }
    
    get toSync() {
        return this._toSync;
    }
    
    addSetting(_setting) {
        this._settings.push(_setting);
    }
    
    syncTo(_syncID) {
        for (let setting of this._settings) {
            if (setting.toSync) {
                setting.syncTo(_syncID);
            }
        }
    }
    
    syncFrom(_syncID) {
        for (let setting of this._settings) {
            if (setting.toSync) {
                setting.syncFrom(_syncID);
            }
        }
    }
    
    onTemplateLoaded() {
        for (let setting of this._settings) {
            setting.onTemplateLoaded();
        }
    }
    
    onUpdate() {
        for (let setting of this._settings) {
            setting.onUpdate();
        }
    }
}

class WT_MapOrientationSetting extends WT_MapSetting {
    constructor(_mapElement, _simVarNameRoot = WT_MapOrientationSetting.VARNAME_ROOT_DEFAULT, _toSync = true) {
        super(_mapElement, _simVarNameRoot, _toSync);
    }
    
    onTemplateLoaded() {
        super.onTemplateLoaded();
        this.mapElement.instrument.rotationHandler = this;
    }
}
WT_MapOrientationSetting.VARNAME_ROOT_DEFAULT = "L:WT_Map_Orientation";

class WT_MapTerrainModeSetting extends WT_MapSetting {
    constructor(_mapElement, _simVarNameRoot = WT_MapTerrainModeSetting.VARNAME_ROOT_DEFAULT, _toSync = true) {
        super(_mapElement, _simVarNameRoot, _toSync);
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

class WT_MapDcltrSetting extends WT_MapSetting {
    /*
     * _dcltrDefinitions should be an ordered iterable over declutter level definitions.
     * Each level definition should be an iterable over key-value pairs where key = name of visibility attribute and value = bool.
     * Attributes not explicity defined will default to true.
     */
    constructor(_mapElement, _dcltrDefinitions, _simVarNameRoot = WT_MapDcltrSetting.VARNAME_ROOT_DEFAULT, _toSync = true) {
        super(_mapElement, _simVarNameRoot, _toSync);
        
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

class WT_MapSymbolVisSetting extends WT_MapSetting {
    constructor(_mapElement, _attrName, _simVarNameRoot, _dcltrSetting = null, _toSync = true, _defaultValue = 1) {
        super(_mapElement, _simVarNameRoot, _toSync, _defaultValue);
        
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

class WT_MapSymbolVisSettingGroup extends WT_MapSettingGroup {
    constructor(_mapElement, _dcltrSetting, _toSync = true) {
        super(_mapElement, _toSync);
        
        this.dcltrSetting = _dcltrSetting;
        this.addSetting(_dcltrSetting);
        
        for (let [attrName, simVarNameRoot] of WT_MapSymbolVisSettingGroup.VARNAME_ATTRIBUTES_ROOT) {
            this.addSetting(new WT_MapSymbolVisSetting(_mapElement, attrName, simVarNameRoot, this.dcltrSetting));
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

class WTMapSymbolRangeSetting extends WT_MapSetting {
    constructor(_mapElement, _simVarNameRoot, _attrName, _defaultRange, _toSync = true) {
        super(_mapElement, _simVarNameRoot, _toSync, _mapElement.instrument.zoomRanges.indexOf(_defaultRange));
        this.attrName = _attrName;
    }
    
    onUpdate() {
        this.mapElement.instrument[this.attrName] = this.getValue();
    }
}

class WT_MapAutoNorthUpSetting extends WT_MapSettingGroup {
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

class WT_MapTrackVectorSetting extends WT_MapSettingGroup {
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

class WT_MapFuelRingSetting extends WT_MapSettingGroup {
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

class WT_MapAltitudeInterceptSetting extends WT_MapSetting {
    constructor(_mapElement, _simVarNameRoot = WT_MapAltitudeInterceptSetting.VARNAME_SHOW_ROOT_DEFAULT, _toSync = true) {
        super(_mapElement, _simVarNameRoot, _toSync);
    }
    
    onUpdate() {
        this.mapElement.instrument.showAltitudeIntercept = (this.getValue() == 1);
    }
}
WT_MapAltitudeInterceptSetting.VARNAME_SHOW_ROOT_DEFAULT = "L:WT_Map_AltitudeIntercept_Show";