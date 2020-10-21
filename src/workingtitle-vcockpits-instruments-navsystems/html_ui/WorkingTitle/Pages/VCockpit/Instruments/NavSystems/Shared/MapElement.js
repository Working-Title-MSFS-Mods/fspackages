class WT_MapElement extends MapInstrumentElement {
    // _settings should be an iterable of WT_MapSetting or WT_MapSettingGroup objects
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

        let initID = WT_MapElement.getSettingVar(WT_MapElement.VARNAME_SYNC_INIT_ROOT_DEFAULT, WT_MapElement.VARNAME_SYNC_ALL_ID, "");
        if (initID == this.varNameID) {
            this.syncMasterToAllSettings();
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

    syncMasterToAllSettings() {
        for (let setting of this._settingsToSync) {
            setting.syncTo(WT_MapElement.VARNAME_SYNC_ALL_ID);
        }
    }

    static setSyncedSettingVar(_root, _id, _val) {
        WT_MapElement.setSettingVar(_root, _id, _val);
        if (WT_MapElement.getSettingVar(WT_MapElement.VARNAME_SYNC_ROOT, WT_MapElement.VARNAME_SYNC_ALL_ID) == 1) {
            WT_MapElement.setSettingVar(_root, WT_MapElement.VARNAME_SYNC_ALL_ID, _val);
        }
    }

    static setSettingVar(_root, _id, _val) {
        WTDataStore.set(`${_id}.${_root}`, _val);
    }

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

class WT_MapSetting {
    constructor(_mapElement, _varNameRoot, _toSync, _defaultValue = 0, _useStorage = true) {
        this.mapElement = _mapElement;
        this.varNameRoot = _varNameRoot;
        this._toSync = _toSync;
        this.defaultValue = _defaultValue;
        this.useStorage = _useStorage;
    }

    get toSync() {
        return this._toSync;
    }

    setValue(_val, _skipSync = false) {
        if (this.toSync && !_skipSync) {
            WT_MapElement.setSyncedSettingVar(this.varNameRoot, this.mapElement.varNameID, _val);
        } else {
            WT_MapElement.setSettingVar(this.varNameRoot, this.mapElement.varNameID, _val);
        }
    }

    getValue() {
        return WT_MapElement.getSettingVar(this.varNameRoot, this.mapElement.varNameID, this.defaultValue);
    }

    syncTo(_syncID) {
        WT_MapElement.setSettingVar(this.varNameRoot, _syncID, this.getValue());
    }

    syncFrom(_syncID) {
        let newVal = WT_MapElement.getSettingVar(this.varNameRoot, _syncID);
        this.setValue(newVal, true);
    }

    onTemplateLoaded() {
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

    get varNameRoot() {
        return Array.from(this._settings, setting => setting.varNameRoot);
    }

    get toSync() {
        return this._toSync;
    }

    getValue() {
        return Array.from(this._settings, setting => setting.getValue());
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
    constructor(_mapElement, _varNameRoot = WT_MapOrientationSetting.VARNAME_ROOT_DEFAULT, _toSync = true) {
        super(_mapElement, _varNameRoot, _toSync);
    }

    onTemplateLoaded() {
        super.onTemplateLoaded();
        this.mapElement.instrument.rotationHandler = this;
    }
}
WT_MapOrientationSetting.VARNAME_ROOT_DEFAULT = "L:WT_Map_Orientation";

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

class WT_MapDcltrSetting extends WT_MapSetting {
    /*
     * _dcltrDefinitions should be an ordered iterable over declutter level definitions.
     * Each level definition should be an iterable over key-value pairs where key = name of visibility attribute and value = bool.
     * Attributes not explicity defined will default to true.
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

class WT_MapSymbolVisSettingGroup extends WT_MapSettingGroup {
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

class WTMapSymbolRangeSetting extends WT_MapSetting {
    constructor(_mapElement, _varNameRoot, _attrName, _defaultRange, _toSync = true) {
        super(_mapElement, _varNameRoot, _toSync, _mapElement.instrument.zoomRanges.indexOf(_defaultRange));
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
    constructor(_mapElement, _varNameRoot = WT_MapAltitudeInterceptSetting.VARNAME_SHOW_ROOT_DEFAULT, _toSync = true) {
        super(_mapElement, _varNameRoot, _toSync);
    }

    onUpdate() {
        this.mapElement.instrument.showAltitudeIntercept = (this.getValue() == 1);
    }
}
WT_MapAltitudeInterceptSetting.VARNAME_SHOW_ROOT_DEFAULT = "L:WT_Map_AltitudeIntercept_Show";