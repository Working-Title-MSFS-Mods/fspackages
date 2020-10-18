class AS3000_MapElement extends MapInstrumentElement {
    constructor(_simVarNameID) {
        super();
        this.simVarNameID = _simVarNameID;
        
        this.orientation = 0;
        this.lastSync = 0;
        //this.lastDcltr = 0;
        this.lastSymbolVis = new Map([
            ["show-roads", 1],
            ["show-cities", 1],
            ["show-airspaces", 1],
            ["show-airways", 1],
            ["show-vors", 1],
            ["show-ndbs", 1],
            ["show-intersections", 1],
            ["show-airports", 1]
        ]);
        
        this.settingsToSync = [
            AS3000_MapElement.VARNAME_ORIENTATION_ROOT,
            AS3000_MapElement.VARNAME_DETAIL_ROOT,
            AS3000_MapElement.VARNAME_TERRAIN_MODE_ROOT,
            AS3000_MapElement.VARNAME_ROAD_SHOW_ROOT,
            AS3000_MapElement.VARNAME_CITY_SHOW_ROOT,
            AS3000_MapElement.VARNAME_AIRSPACE_SHOW_ROOT,
            AS3000_MapElement.VARNAME_AIRWAY_SHOW_ROOT,
            AS3000_MapElement.VARNAME_VOR_SHOW_ROOT,
            AS3000_MapElement.VARNAME_NDB_SHOW_ROOT,
            AS3000_MapElement.VARNAME_INT_SHOW_ROOT,
            AS3000_MapElement.VARNAME_AIRPORT_SHOW_ROOT,
            AS3000_MapElement.VARNAME_AIRSPACE_RANGE_ROOT,
            AS3000_MapElement.VARNAME_AIRPORT_SMALL_RANGE_ROOT,
            AS3000_MapElement.VARNAME_AIRPORT_MEDIUM_RANGE_ROOT,
            AS3000_MapElement.VARNAME_AIRPORT_LARGE_RANGE_ROOT,
            AS3000_MapElement.VARNAME_VOR_RANGE_ROOT,
            AS3000_MapElement.VARNAME_INT_RANGE_ROOT,
            AS3000_MapElement.VARNAME_NDB_RANGE_ROOT,
            AS3000_MapElement.VARNAME_ROAD_HIGHWAY_RANGE_ROOT,
            AS3000_MapElement.VARNAME_ROAD_TRUNK_RANGE_ROOT,
            AS3000_MapElement.VARNAME_ROAD_PRIMARY_RANGE_ROOT,
            AS3000_MapElement.VARNAME_CITY_SMALL_RANGE_ROOT,
            AS3000_MapElement.VARNAME_CITY_MEDIUM_RANGE_ROOT,
            AS3000_MapElement.VARNAME_CITY_LARGE_RANGE_ROOT,
            AS3000_MapElement.VARNAME_NORTHUP_ACTIVE_ROOT,
            AS3000_MapElement.VARNAME_NORTHUP_RANGE_ROOT,
            AS3000_MapElement.VARNAME_TRACK_VECTOR_SHOW_ROOT,
            AS3000_MapElement.VARNAME_TRACK_VECTOR_LOOKAHEAD_ROOT,
            AS3000_MapElement.VARNAME_FUEL_RING_SHOW_ROOT,
            AS3000_MapElement.VARNAME_FUEL_RING_RESERVE_ROOT,
            AS3000_MapElement.VARNAME_ALTITUDE_INTERCEPT_SHOW_ROOT
        ];
        
        this.revertToDefault = true;
    }
    
    onTemplateLoaded() {
        super.onTemplateLoaded();
        
        if (SimVar.GetSimVarValue("ATC MODEL", "string") == "TT:ATCCOM.AC_MODEL_TBM9.0.text") {
            this.revertToDefault = false;
        }
        
        if (this.revertToDefault) {
            this.instrument.setAttribute("show-cities", false);
            this.instrument.mapConfigId = 1;
            return;
        }
        
        this.instrument.zoomRanges = AS3000_MapElement.ZOOM_RANGES_DEFAULT;
        this.instrument.setZoom(this.instrument.zoomRanges.indexOf(AS3000_MapElement.ZOOM_RANGE_DEFAULT));
        this.instrument.rangeDefinition = this;
        this.instrument.rotationHandler = this;
        this.instrument.rangeRingElement = new SvgRangeRingElement();
        this.instrument.rangeCompassElement = new SvgRangeCompassElement();
        this.instrument.trackVectorElement = new SvgTrackVectorElement();
        this.instrument.fuelRingElement = new SvgFuelRingElement();
        this.instrument.altitudeInterceptElement = new SvgAltitudeInterceptElement();
        this.setHdgUp();
        
        this.setSimVarFromStorage(AS3000_MapElement.VARNAME_ORIENTATION_ROOT, WT_AS3000_Map.Orientation.HDG); // set default map orientation (0 = hdg, 1 = trk, 2 = north)
        this.setSimVarFromStorage(AS3000_MapElement.VARNAME_DETAIL_ROOT, 0); // set default declutter (0 = none, 1 = DCLTR1, 2 = DCLTR2, 3 = least)

        for (let [attr, val] of this.lastSymbolVis) {
            this.setSimVarFromStorage(AS3000_MapElement.VARNAME_SYMBOL_VIS_ROOT.get(attr), 1);
        }
        this.initDcltrSettings();
        
        // "Sensor" settings
        this.setSimVarFromStorage(AS3000_MapElement.VARNAME_TERRAIN_MODE_ROOT, WT_AS3000_Map.TerrainMode.OFF);
        
        // initialize symbol range
        this.setSimVarFromStorage(AS3000_MapElement.VARNAME_AIRSPACE_RANGE_ROOT, this.instrument.zoomRanges.indexOf(AS3000_MapElement.AIRSPACE_RANGE_DEFAULT));
        this.setSimVarFromStorage(AS3000_MapElement.VARNAME_AIRPORT_SMALL_RANGE_ROOT, this.instrument.zoomRanges.indexOf(AS3000_MapElement.AIRPORT_SMALL_RANGE_DEFAULT));
        this.setSimVarFromStorage(AS3000_MapElement.VARNAME_AIRPORT_MEDIUM_RANGE_ROOT, this.instrument.zoomRanges.indexOf(AS3000_MapElement.AIRPORT_MEDIUM_RANGE_DEFAULT));
        this.setSimVarFromStorage(AS3000_MapElement.VARNAME_AIRPORT_LARGE_RANGE_ROOT, this.instrument.zoomRanges.indexOf(AS3000_MapElement.AIRPORT_LARGE_RANGE_DEFAULT));
        this.setSimVarFromStorage(AS3000_MapElement.VARNAME_VOR_RANGE_ROOT, this.instrument.zoomRanges.indexOf(AS3000_MapElement.VOR_RANGE_DEFAULT));
        this.setSimVarFromStorage(AS3000_MapElement.VARNAME_INT_RANGE_ROOT, this.instrument.zoomRanges.indexOf(AS3000_MapElement.INT_RANGE_DEFAULT));
        this.setSimVarFromStorage(AS3000_MapElement.VARNAME_NDB_RANGE_ROOT, this.instrument.zoomRanges.indexOf(AS3000_MapElement.NDB_RANGE_DEFAULT));
        this.setSimVarFromStorage(AS3000_MapElement.VARNAME_ROAD_HIGHWAY_RANGE_ROOT, this.instrument.zoomRanges.indexOf(AS3000_MapElement.ROAD_HIGHWAY_RANGE_DEFAULT));
        this.setSimVarFromStorage(AS3000_MapElement.VARNAME_ROAD_TRUNK_RANGE_ROOT, this.instrument.zoomRanges.indexOf(AS3000_MapElement.ROAD_TRUNK_RANGE_DEFAULT));
        this.setSimVarFromStorage(AS3000_MapElement.VARNAME_ROAD_PRIMARY_RANGE_ROOT, this.instrument.zoomRanges.indexOf(AS3000_MapElement.ROAD_PRIMARY_RANGE_DEFAULT));
        this.setSimVarFromStorage(AS3000_MapElement.VARNAME_CITY_SMALL_RANGE_ROOT, this.instrument.zoomRanges.indexOf(AS3000_MapElement.CITY_SMALL_RANGE_DEFAULT));
        this.setSimVarFromStorage(AS3000_MapElement.VARNAME_CITY_MEDIUM_RANGE_ROOT, this.instrument.zoomRanges.indexOf(AS3000_MapElement.CITY_MEDIUM_RANGE_DEFAULT));
        this.setSimVarFromStorage(AS3000_MapElement.VARNAME_CITY_LARGE_RANGE_ROOT, this.instrument.zoomRanges.indexOf(AS3000_MapElement.CITY_LARGE_RANGE_DEFAULT));
        
        // "Other" settings
        this.setSimVarFromStorage(AS3000_MapElement.VARNAME_NORTHUP_ACTIVE_ROOT, 0);
        this.setSimVarFromStorage(AS3000_MapElement.VARNAME_NORTHUP_RANGE_ROOT, this.instrument.zoomRanges.indexOf(AS3000_MapElement.NORTHUP_RANGE_DEFAULT));
        this.setSimVarFromStorage(AS3000_MapElement.VARNAME_NORTHUP_ACTIVE_ROOT, 0);
        this.setSimVarFromStorage(AS3000_MapElement.VARNAME_NORTHUP_RANGE_ROOT, this.instrument.zoomRanges.indexOf(AS3000_MapElement.NORTHUP_RANGE_DEFAULT));
        this.setSimVarFromStorage(AS3000_MapElement.VARNAME_TRACK_VECTOR_SHOW_ROOT, 0);
        this.setSimVarFromStorage(AS3000_MapElement.VARNAME_TRACK_VECTOR_LOOKAHEAD_ROOT, AS3000_MapElement.TRACK_VECTOR_LOOKAHEAD_VALUES.indexOf(AS3000_MapElement.TRACK_VECTOR_LOOKAHEAD_DEFAULT));
        this.setSimVarFromStorage(AS3000_MapElement.VARNAME_WIND_SHOW_ROOT, 0);
        this.setSimVarFromStorage(AS3000_MapElement.VARNAME_FUEL_RING_SHOW_ROOT, 0);
        this.setSimVarFromStorage(AS3000_MapElement.VARNAME_FUEL_RING_RESERVE_ROOT, AS3000_MapElement.VARNAME_FUEL_RING_RESERVE_DEFAULT);
        this.setSimVarFromStorage(AS3000_MapElement.VARNAME_ALTITUDE_INTERCEPT_SHOW_ROOT, 0);
    }

    setSimVarFromStorage(_root, _default) {
        let value = WTDataStore.get(`${this.simVarNameID}.${_root}`, _default);
        let key = _root + this.simVarNameID;
        SimVar.SetSimVarValue(key, "number", value);
    }
    
    initDcltrSettings() {
        this.dcltrSettings = [new Map(), new Map(), new Map(), new Map()];
        
        // no declutter
        this.dcltrSettings[0].set("show-roads", true);
        this.dcltrSettings[0].set("show-cities", true);
        this.dcltrSettings[0].set("show-airspaces", true);
        this.dcltrSettings[0].set("show-airways", true);
        this.dcltrSettings[0].set("show-vors", true);
        this.dcltrSettings[0].set("show-ndbs", true);
        this.dcltrSettings[0].set("show-intersections", true);
        this.dcltrSettings[0].set("show-airports", true);
        
        // DCLTR1
        this.dcltrSettings[1].set("show-roads", false);
        this.dcltrSettings[1].set("show-cities", false);
        this.dcltrSettings[1].set("show-airspaces", true);
        this.dcltrSettings[1].set("show-airways", true);
        this.dcltrSettings[1].set("show-vors", true);
        this.dcltrSettings[1].set("show-ndbs", true);
        this.dcltrSettings[1].set("show-intersections", true);
        this.dcltrSettings[1].set("show-airports", true);
        
        // DCLTR2
        this.dcltrSettings[2].set("show-roads", false);
        this.dcltrSettings[2].set("show-cities", false);
        this.dcltrSettings[2].set("show-airspaces", false);
        this.dcltrSettings[2].set("show-airways", false);
        this.dcltrSettings[2].set("show-vors", false);
        this.dcltrSettings[2].set("show-ndbs", false);
        this.dcltrSettings[2].set("show-intersections", false);
        this.dcltrSettings[2].set("show-airports", true);
        
        // Least
        this.dcltrSettings[3].set("show-roads", false);
        this.dcltrSettings[3].set("show-cities", false);
        this.dcltrSettings[3].set("show-airspaces", false);
        this.dcltrSettings[3].set("show-airways", false);
        this.dcltrSettings[3].set("show-vors", false);
        this.dcltrSettings[3].set("show-ndbs", false);
        this.dcltrSettings[3].set("show-intersections", false);
        this.dcltrSettings[3].set("show-airports", false);
    }
    
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        
        if (this.revertToDefault) {
            return;
        }
        
        let sync = SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_SYNC, "number");
        if (sync != this.lastSync) {
            if (sync == 1) {
                // Sync All
                let initIndex = SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_SYNC_INITID, "number");
                if (initIndex >= 0) {
                    let initID = AS3000_MapElement.SYNC_INITID_ARRAY[initIndex];
                    if (initID == this.simVarNameID) {
                        this.syncMasterToAllSettings();
                        SimVar.SetSimVarValue(AS3000_MapElement.VARNAME_SYNC_INITID, "number", -1);
                    }
                }
            }
            this.lastSync = sync;
        }
        
        if (sync == 1) {
            for (let varNameRoot of this.settingsToSync) {
                this.syncSettingToMaster(varNameRoot);
            }
        }
        
        this.updateOrientation();
        this.updateTerrain();
        this.updateSymbolVisibility();
        this.updateSymbolRange();
        this.updateTrackVector();
        this.updateFuelRing();
        this.updateAltitudeIntercept();
    }
    
    updateOrientation() {
        let orientation = SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_ORIENTATION_ROOT + this.simVarNameID, "number");
        
        // handle Auto North Up
        if (SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_NORTHUP_ACTIVE_ROOT + this.simVarNameID, "number") == 1) {
            if (this.instrument.getDisplayRange() >= this.instrument.zoomRanges[SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_NORTHUP_RANGE_ROOT + this.simVarNameID, "number")]) {
                orientation = WT_AS3000_Map.Orientation.NORTH;
            }
        }
        
        if (this.orientation != orientation) {
            switch (orientation) {
            case WT_AS3000_Map.Orientation.HDG:
                this.setHdgUp();
                break;
            case WT_AS3000_Map.Orientation.TRK:
                this.setTrkUp();
                break;
            case WT_AS3000_Map.Orientation.NORTH:
                this.setNorthUp();
                break;
            }
            this.orientation = orientation;
        }
    }
    
    setHdgUp() {
        this.instrument.planeTrackedPosY = 2 / 3;
        this.instrument.showRangeRing = false;
        this.instrument.showRangeCompass = true;
        Avionics.Utils.diffAndSet(this.instrument.mapOrientationElement, "HDG UP");
    }
    
    setTrkUp() {
        this.instrument.planeTrackedPosY = 2 / 3;
        this.instrument.showRangeRing = false;
        this.instrument.showRangeCompass = true;
        Avionics.Utils.diffAndSet(this.instrument.mapOrientationElement, "TRK UP");
    }
    
    setNorthUp() {
        this.instrument.planeTrackedPosY = 0.5;
        this.instrument.showRangeRing = true;
        this.instrument.showRangeCompass = false;
        Avionics.Utils.diffAndSet(this.instrument.mapOrientationElement, "NORTH UP");
    }
    
    getRangeDefinition(_context) {
        if (this.orientation == WT_AS3000_Map.Orientation.NORTH) {
            return (_context.bottom - _context.top) / 4;
        } else {
            return (_context.bottom - _context.top) / 3;
        }
    }
    
    getRotation() {
        switch (this.orientation) {
            case WT_AS3000_Map.Orientation.TRK:
                if (!SimVar.GetSimVarValue("SIM ON GROUND", "bool")) {
                    return -SimVar.GetSimVarValue("GPS GROUND TRUE TRACK", "degree");
                }
            case WT_AS3000_Map.Orientation.HDG: return -SimVar.GetSimVarValue("PLANE HEADING DEGREES TRUE", "degree");
        }
        return 0;
    }
    
    updateTerrain() {
        let mode = SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_TERRAIN_MODE_ROOT + this.simVarNameID, "number");
        if (mode == WT_AS3000_Map.TerrainMode.RELATIVE && SimVar.GetSimVarValue("SIM ON GROUND", "bool")) {
            mode = WT_AS3000_Map.TerrainMode.OFF;
        }
        this.instrument.mapConfigId = mode;
        if (mode == WT_AS3000_Map.TerrainMode.RELATIVE) {
            this.instrument.bingMapRef = EBingReference.PLANE;
        } else {
            this.instrument.bingMapRef = EBingReference.SEA;
        }
    }
    
    updateSymbolVisibility() {
        let dcltr = SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_DETAIL_ROOT + this.simVarNameID, "number");
        let changedValues = new Map();
        for (let [attr, lastVal] of this.lastSymbolVis) {
            let currentVal = (SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_SYMBOL_VIS_ROOT.get(attr) + this.simVarNameID, "number") == 1) && this.getDcltrSettings(dcltr).get(attr);
            if (currentVal != lastVal) {
                this.instrument.setAttribute(attr, currentVal);
            }
            changedValues.set(attr, currentVal);
        }
        for (let [attr, currentVal] of changedValues) {
            this.lastSymbolVis.set(attr, currentVal);
        }
    }
    
    updateSymbolRange() {
        this.instrument.airspaceMaxRangeIndex = SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_AIRSPACE_RANGE_ROOT + this.simVarNameID, "number");
        this.instrument.smallAirportMaxRangeIndex = SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_AIRPORT_SMALL_RANGE_ROOT + this.simVarNameID, "number");
        this.instrument.medAirportMaxRangeIndex = SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_AIRPORT_MEDIUM_RANGE_ROOT + this.simVarNameID, "number");
        this.instrument.largeAirportMaxRangeIndex = SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_AIRPORT_LARGE_RANGE_ROOT + this.simVarNameID, "number");
        this.instrument.vorMaxRangeIndex = SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_VOR_RANGE_ROOT + this.simVarNameID, "number");
        this.instrument.intMaxRangeIndex = SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_INT_RANGE_ROOT + this.simVarNameID, "number");
        this.instrument.ndbMaxRangeIndex = SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_NDB_RANGE_ROOT + this.simVarNameID, "number");
        this.instrument.roadHighwayMaxRangeIndex = SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_ROAD_HIGHWAY_RANGE_ROOT + this.simVarNameID, "number");
        this.instrument.roadTrunkMaxRangeIndex = SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_ROAD_TRUNK_RANGE_ROOT + this.simVarNameID, "number");
        this.instrument.roadPrimaryMaxRangeIndex = SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_ROAD_PRIMARY_RANGE_ROOT + this.simVarNameID, "number");
        this.instrument.smallCityMaxRangeIndex = SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_CITY_SMALL_RANGE_ROOT + this.simVarNameID, "number");
        this.instrument.medCityMaxRangeIndex = SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_CITY_MEDIUM_RANGE_ROOT + this.simVarNameID, "number");
        this.instrument.largeCityMaxRangeIndex = SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_CITY_LARGE_RANGE_ROOT + this.simVarNameID, "number");
    }
    
    updateTrackVector() {
        let show = SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_TRACK_VECTOR_SHOW_ROOT + this.simVarNameID, "number") == 1;
        let lookahead = AS3000_MapElement.TRACK_VECTOR_LOOKAHEAD_VALUES[SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_TRACK_VECTOR_LOOKAHEAD_ROOT + this.simVarNameID, "number")];
        
        this.instrument.showTrackVector = show;
        this.instrument.trackVectorElement.lookahead = lookahead;
    }
    
    updateFuelRing() {
        if (this.instrument.fuelRingElement) {
            let show = SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_FUEL_RING_SHOW_ROOT + this.simVarNameID, "number") == 1;
            let reserveTime = SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_FUEL_RING_RESERVE_ROOT + this.simVarNameID, "number");
            
            this.instrument.showFuelRing = show;
            this.instrument.fuelRingElement.reserveFuelTime = reserveTime;
        }
    }
    
    updateAltitudeIntercept() {
        this.instrument.showAltitudeIntercept = SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_ALTITUDE_INTERCEPT_SHOW_ROOT + this.simVarNameID, "number") == 1;
    }
    
    // returns key-value pairs for declutter settings for a given declutter level
    getDcltrSettings(_level) {
        return this.dcltrSettings[_level];
    }
    
    syncMasterToSetting(_root) {
        SimVar.SetSimVarValue(_root + AS3000_MapElement.VARNAME_SYNC_ALL_ID, "number", SimVar.GetSimVarValue(_root + this.simVarNameID, "number"));
    }
    
    syncSettingToMaster(_root) {
        let newVal = SimVar.GetSimVarValue(_root + AS3000_MapElement.VARNAME_SYNC_ALL_ID, "number");
        SimVar.SetSimVarValue(_root + this.simVarNameID, "number", newVal);
        WTDataStore.set(`${this.simVarNameID}.${_root}`, newVal);
    }
    
    syncMasterToAllSettings() {
        for (let varNameRoot of this.settingsToSync) {
            this.syncMasterToSetting(varNameRoot);
        }
    }
    
    static getSyncInitIDIndex(_id) {
        return AS3000_MapElement.SYNC_INITID_ARRAY.indexOf(_id);
    }
    
    static setSyncedSettingVar(_root, _id, _val) {
        SimVar.SetSimVarValue(_root + _id, "number", _val);
        WTDataStore.set(`${_id}.${_root}`, _val);
        if (SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_SYNC, "number") == 1) {
            SimVar.SetSimVarValue(_root + AS3000_MapElement.VARNAME_SYNC_ALL_ID, "number", _val);
        }
    }
}
AS3000_MapElement.ZOOM_RANGES_DEFAULT = [250 / 6076, 500 / 6076, 750 / 6076, 1000 / 6076, 0.25, 0.5, 0.75, 1, 1.5, 2.5, 4, 5, 7.5, 10, 15, 25, 40, 50, 75, 100, 150, 250, 400, 500, 750, 1000]; // NM
AS3000_MapElement.ZOOM_RANGE_DEFAULT = 5;

AS3000_MapElement.VARNAME_ORIENTATION_ROOT = "L:AS3000_Map_Orientation";

AS3000_MapElement.VARNAME_SYNC = "L:AS3000_Map_Sync";
AS3000_MapElement.VARNAME_SYNC_INITID = "L:AS3000_Map_Sync_InitID";
AS3000_MapElement.SYNC_INITID_ARRAY = ["_PFD", "_MFD"];                     // horrible hack because I can't get SetSimVar to work for strings
AS3000_MapElement.VARNAME_SYNC_ALL_ID = "_SyncAll";

AS3000_MapElement.VARNAME_DETAIL_ROOT = "L:AS3000_Map_Dcltr";
AS3000_MapElement.DETAIL_DISPLAY_TEXT = [
        "All",
        "DCLTR 1",
        "DCLTR 2",
        "Least"
];

AS3000_MapElement.VARNAME_TERRAIN_MODE_ROOT = "L:AS3000_Map_Terrain_Mode";
AS3000_MapElement.TERRAIN_MODE_DISPLAY_TEXT = [
        "Off",
        "Absolute",
        "Relative"
];

AS3000_MapElement.VARNAME_ROAD_SHOW_ROOT = "L:AS3000_Map_Road_Show";
AS3000_MapElement.VARNAME_CITY_SHOW_ROOT = "L:AS3000_Map_City_Show";
AS3000_MapElement.VARNAME_AIRSPACE_SHOW_ROOT = "L:AS3000_Map_Airspace_Show";
AS3000_MapElement.VARNAME_AIRWAY_SHOW_ROOT = "L:AS3000_Map_Airway_Show";
AS3000_MapElement.VARNAME_VOR_SHOW_ROOT = "L:AS3000_Map_VOR_Show";
AS3000_MapElement.VARNAME_NDB_SHOW_ROOT = "L:AS3000_Map_NDB_Show";
AS3000_MapElement.VARNAME_INT_SHOW_ROOT = "L:AS3000_Map_Intersection_Show";
AS3000_MapElement.VARNAME_AIRPORT_SHOW_ROOT = "L:AS3000_Map_Airport_Show";
AS3000_MapElement.VARNAME_SYMBOL_VIS_ROOT = new Map([
        ["show-roads", AS3000_MapElement.VARNAME_ROAD_SHOW_ROOT],
        ["show-cities", AS3000_MapElement.VARNAME_CITY_SHOW_ROOT],
        ["show-airspaces", AS3000_MapElement.VARNAME_AIRSPACE_SHOW_ROOT],
        ["show-airways", AS3000_MapElement.VARNAME_AIRWAY_SHOW_ROOT],
        ["show-vors", AS3000_MapElement.VARNAME_VOR_SHOW_ROOT],
        ["show-ndbs", AS3000_MapElement.VARNAME_NDB_SHOW_ROOT],
        ["show-intersections", AS3000_MapElement.VARNAME_INT_SHOW_ROOT],
        ["show-airports", AS3000_MapElement.VARNAME_AIRPORT_SHOW_ROOT]
]);

AS3000_MapElement.VARNAME_AIRSPACE_RANGE_ROOT = "L:AS3000_Map_Airspace_Range";
AS3000_MapElement.VARNAME_AIRPORT_SMALL_RANGE_ROOT = "L:AS3000_Map_Airport_Small_Range";
AS3000_MapElement.VARNAME_AIRPORT_MEDIUM_RANGE_ROOT = "L:AS3000_Map_Airport_Med_Range";
AS3000_MapElement.VARNAME_AIRPORT_LARGE_RANGE_ROOT = "L:AS3000_Map_Airport_Large_Range";
AS3000_MapElement.VARNAME_VOR_RANGE_ROOT = "L:AS3000_Map_VOR_Range";
AS3000_MapElement.VARNAME_INT_RANGE_ROOT = "L:AS3000_Map_INT_Range";
AS3000_MapElement.VARNAME_NDB_RANGE_ROOT = "L:AS3000_Map_NDB_Range";

AS3000_MapElement.VARNAME_ROAD_HIGHWAY_RANGE_ROOT = "L:AS3000_Map_Road_Highway_Range";
AS3000_MapElement.VARNAME_ROAD_TRUNK_RANGE_ROOT = "L:AS3000_Map_Road_Trunk_Range";
AS3000_MapElement.VARNAME_ROAD_PRIMARY_RANGE_ROOT = "L:AS3000_Map_Road_Primary_Range";
AS3000_MapElement.VARNAME_CITY_SMALL_RANGE_ROOT = "L:AS3000_Map_City_Small_Range";
AS3000_MapElement.VARNAME_CITY_MEDIUM_RANGE_ROOT = "L:AS3000_Map_City_Med_Range";
AS3000_MapElement.VARNAME_CITY_LARGE_RANGE_ROOT = "L:AS3000_Map_City_Large_Range";

AS3000_MapElement.AIRSPACE_RANGE_DEFAULT = 50;
AS3000_MapElement.AIRSPACE_RANGE_MAX = 150;

AS3000_MapElement.AIRPORT_SMALL_RANGE_DEFAULT = 15;
AS3000_MapElement.AIRPORT_SMALL_RANGE_MAX = 150;
AS3000_MapElement.AIRPORT_MEDIUM_RANGE_DEFAULT = 50;
AS3000_MapElement.AIRPORT_MEDIUM_RANGE_MAX = 400;
AS3000_MapElement.AIRPORT_LARGE_RANGE_DEFAULT = 100;
AS3000_MapElement.AIRPORT_LARGE_RANGE_MAX = 1000;

AS3000_MapElement.VOR_RANGE_DEFAULT = 50;
AS3000_MapElement.VOR_RANGE_MAX = 250;
AS3000_MapElement.INT_RANGE_DEFAULT = 7.5;
AS3000_MapElement.INT_RANGE_MAX = 50;
AS3000_MapElement.NDB_RANGE_DEFAULT = 25;
AS3000_MapElement.NDB_RANGE_MAX = 50;

AS3000_MapElement.ROAD_HIGHWAY_RANGE_DEFAULT = 50;
AS3000_MapElement.ROAD_HIGHWAY_RANGE_MAX = 400;
AS3000_MapElement.ROAD_TRUNK_RANGE_DEFAULT = 15;
AS3000_MapElement.ROAD_TRUNK_RANGE_MAX = 150;
AS3000_MapElement.ROAD_PRIMARY_RANGE_DEFAULT = 4;
AS3000_MapElement.ROAD_PRIMARY_RANGE_MAX = 25;

AS3000_MapElement.CITY_SMALL_RANGE_DEFAULT = 25;
AS3000_MapElement.CITY_SMALL_RANGE_MAX = 100;
AS3000_MapElement.CITY_MEDIUM_RANGE_DEFAULT = 50;
AS3000_MapElement.CITY_MEDIUM_RANGE_MAX = 400;
AS3000_MapElement.CITY_LARGE_RANGE_DEFAULT = 100;
AS3000_MapElement.CITY_LARGE_RANGE_MAX = 1000;

AS3000_MapElement.VARNAME_NORTHUP_ACTIVE_ROOT = "L:AS3000_Map_NorthUpAbove_Active";
AS3000_MapElement.VARNAME_NORTHUP_RANGE_ROOT = "L:AS3000_Map_NorthUpAbove_Range";
AS3000_MapElement.NORTHUP_RANGE_DEFAULT = 1000;
AS3000_MapElement.VARNAME_TRACK_VECTOR_SHOW_ROOT = "L:AS3000_Map_TrackVector_Show";
AS3000_MapElement.VARNAME_TRACK_VECTOR_LOOKAHEAD_ROOT = "L:AS3000_Map_TrackVector_Lookahead";
AS3000_MapElement.TRACK_VECTOR_LOOKAHEAD_DEFAULT = 60;
AS3000_MapElement.TRACK_VECTOR_LOOKAHEAD_VALUES = [30, 60, 120, 300, 600, 1200];
AS3000_MapElement.VARNAME_WIND_SHOW_ROOT = "L:AS3000_Map_Wind_Show";
AS3000_MapElement.VARNAME_FUEL_RING_SHOW_ROOT = "L:AS3000_Map_FuelRing_Show";
AS3000_MapElement.VARNAME_FUEL_RING_RESERVE_ROOT = "L:AS3000_Map_FuelRing_Reserve";
AS3000_MapElement.VARNAME_FUEL_RING_RESERVE_DEFAULT = 45;
AS3000_MapElement.VARNAME_ALTITUDE_INTERCEPT_SHOW_ROOT = "L:AS3000_Map_AltitudeIntercept_Show";

const WT_AS3000_Map = {
    Orientation: {
        HDG: 0,
        TRK: 1,
        NORTH: 2
    },
    
    TerrainMode: {
        OFF: 0,
        ABSOLUTE: 1,
        RELATIVE: 2
    }
}