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
            AS3000_MapElement.VARNAME_NORTHUP_ACTIVE_ROOT,
            AS3000_MapElement.VARNAME_NORTHUP_RANGE_ROOT,
            AS3000_MapElement.NORTHUP_RANGE_DEFAULT
        ]
    }
    
    init(root) {
        this.instrument = root.querySelector("map-instrument");
        if (this.instrument) {
            TemplateElement.callNoBinding(this.instrument, () => {
                this.onTemplateLoaded();
            });
        }
        this.instrument.zoomRanges = AS3000_MapElement.ZOOM_RANGES_DEFAULT;
        this.instrument.rangeDefinition = this;
        this.instrument.rotationHandler = this;
        this.instrument.rangeRingElement = new SvgRangeRingElement();
        this.instrument.rangeCompassElement = new SvgRangeCompassElement();
        this.setHdgUp();
        
        SimVar.SetSimVarValue(AS3000_MapElement.VARNAME_ORIENTATION_ROOT + this.simVarNameID, "number", 0); // set default map orientation (0 = hdg, 1 = trk, 2 = north)
        SimVar.SetSimVarValue(AS3000_MapElement.VARNAME_DETAIL_ROOT + this.simVarNameID, "number", 0);      // set default declutter (0 = none, 1 = DCLTR1, 2 = DCLTR2, 3 = least)
        
        for (let [attr, val] of this.lastSymbolVis) {
            SimVar.SetSimVarValue(AS3000_MapElement.VARNAME_SYMBOL_VIS_ROOT.get(attr) + this.simVarNameID, "number", 1);
        }
        this.initDcltrSettings();
        
        // initialize symbol range
        SimVar.SetSimVarValue(AS3000_MapElement.VARNAME_AIRSPACE_RANGE_ROOT + this.simVarNameID, "number", this.instrument.zoomRanges.indexOf(AS3000_MapElement.AIRSPACE_RANGE_DEFAULT));
        SimVar.SetSimVarValue(AS3000_MapElement.VARNAME_AIRPORT_SMALL_RANGE_ROOT + this.simVarNameID, "number", this.instrument.zoomRanges.indexOf(AS3000_MapElement.AIRPORT_SMALL_RANGE_DEFAULT));
        SimVar.SetSimVarValue(AS3000_MapElement.VARNAME_AIRPORT_MEDIUM_RANGE_ROOT + this.simVarNameID, "number", this.instrument.zoomRanges.indexOf(AS3000_MapElement.AIRPORT_MEDIUM_RANGE_DEFAULT));
        SimVar.SetSimVarValue(AS3000_MapElement.VARNAME_AIRPORT_LARGE_RANGE_ROOT + this.simVarNameID, "number", this.instrument.zoomRanges.indexOf(AS3000_MapElement.AIRPORT_LARGE_RANGE_DEFAULT));
        SimVar.SetSimVarValue(AS3000_MapElement.VARNAME_VOR_RANGE_ROOT + this.simVarNameID, "number", this.instrument.zoomRanges.indexOf(AS3000_MapElement.VOR_RANGE_DEFAULT));
        SimVar.SetSimVarValue(AS3000_MapElement.VARNAME_INT_RANGE_ROOT + this.simVarNameID, "number", this.instrument.zoomRanges.indexOf(AS3000_MapElement.INT_RANGE_DEFAULT));
        SimVar.SetSimVarValue(AS3000_MapElement.VARNAME_NDB_RANGE_ROOT + this.simVarNameID, "number", this.instrument.zoomRanges.indexOf(AS3000_MapElement.NDB_RANGE_DEFAULT));
        SimVar.SetSimVarValue(AS3000_MapElement.VARNAME_ROAD_HIGHWAY_RANGE_ROOT + this.simVarNameID, "number", this.instrument.zoomRanges.indexOf(AS3000_MapElement.ROAD_HIGHWAY_RANGE_DEFAULT));
        SimVar.SetSimVarValue(AS3000_MapElement.VARNAME_ROAD_TRUNK_RANGE_ROOT + this.simVarNameID, "number", this.instrument.zoomRanges.indexOf(AS3000_MapElement.ROAD_TRUNK_RANGE_DEFAULT));
        SimVar.SetSimVarValue(AS3000_MapElement.VARNAME_ROAD_PRIMARY_RANGE_ROOT + this.simVarNameID, "number", this.instrument.zoomRanges.indexOf(AS3000_MapElement.ROAD_PRIMARY_RANGE_DEFAULT));
        
        // "Other" settings
        SimVar.SetSimVarValue(AS3000_MapElement.VARNAME_NORTHUP_ACTIVE_ROOT + this.simVarNameID, "number", 0);
        SimVar.SetSimVarValue(AS3000_MapElement.VARNAME_NORTHUP_RANGE_ROOT + this.simVarNameID, "number", this.instrument.zoomRanges.indexOf(AS3000_MapElement.NORTHUP_RANGE_DEFAULT));
        SimVar.SetSimVarValue(AS3000_MapElement.VARNAME_WIND_SHOW_ROOT + this.simVarNameID, "number", 0);
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
        this.updateSymbolVisibility();
        this.updateSymbolRange();
    }
    
    updateOrientation() {
        let orientation = SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_ORIENTATION_ROOT + this.simVarNameID, "number");
        
        // handle Auto North Up
        if (SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_NORTHUP_ACTIVE_ROOT + this.simVarNameID, "number") == 1) {
            if (this.instrument.getDisplayRange() >= this.instrument.zoomRanges[SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_NORTHUP_RANGE_ROOT + this.simVarNameID, "number")]) {
                orientation = 2;
            }
        }
        
        if (this.orientation != orientation) {
            switch (orientation) {
            case 0:
                this.setHdgUp();
                break;
            case 1:
                this.setTrkUp();
                break;
            case 2:
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
        if (this.orientation == 2) {
            return (_context.bottom - _context.top) / 4;
        } else {
            return (_context.bottom - _context.top) / 3;
        }
    }
    
    getRotation() {
        switch (this.orientation) {
            case 0: return -SimVar.GetSimVarValue("PLANE HEADING DEGREES TRUE", "degree");
            case 1: return -SimVar.GetSimVarValue("GPS GROUND TRUE TRACK", "degree");
        }
        return 0;
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
    }
    
    // returns key-value pairs for declutter settings for a given declutter level
    getDcltrSettings(_level) {
        return this.dcltrSettings[_level];
    }
    
    syncMasterToSetting(_root) {
        SimVar.SetSimVarValue(_root + AS3000_MapElement.VARNAME_SYNC_ALL_ID, "number", SimVar.GetSimVarValue(_root + this.simVarNameID, "number"));
    }
    
    syncSettingToMaster(_root) {
        SimVar.SetSimVarValue(_root + this.simVarNameID, "number", SimVar.GetSimVarValue(_root + AS3000_MapElement.VARNAME_SYNC_ALL_ID, "number"));
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
        if (SimVar.GetSimVarValue(AS3000_MapElement.VARNAME_SYNC, "number") == 1) {
            SimVar.SetSimVarValue(_root + AS3000_MapElement.VARNAME_SYNC_ALL_ID, "number", _val);
        }
    }
}
AS3000_MapElement.ZOOM_RANGES_DEFAULT = [250 / 6076, 500 / 6076, 750 / 6076, 1000 / 6076, 0.25, 0.5, 0.75, 1, 1.5, 2.5, 4, 5, 7.5, 10, 15, 25, 40, 50, 75, 100, 150, 250, 400, 500, 750, 1000]; // NM

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

AS3000_MapElement.VARNAME_SYMBOL_VIS_ROOT = new Map([
        ["show-roads", "L:AS3000_Map_Roads_Show"],
        ["show-cities", "L:AS3000_Map_Cities_Show"],
        ["show-airspaces", "L:AS3000_Map_Cities_Show"],
        ["show-airways", "L:AS3000_Map_Airways_Show"],
        ["show-vors", "L:AS3000_Map_VORs_Show"],
        ["show-ndbs", "L:AS3000_Map_NDBs_Show"],
        ["show-intersections", "L:AS3000_Map_Intersections_Show"],
        ["show-airports", "L:AS3000_Map_Airports_Show"]
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

AS3000_MapElement.AIRSPACE_RANGE_DEFAULT = 50;
AS3000_MapElement.AIRSPACE_RANGE_MAX = 150;

AS3000_MapElement.AIRPORT_SMALL_RANGE_DEFAULT = 25;
AS3000_MapElement.AIRPORT_SMALL_RANGE_MAX = 150;
AS3000_MapElement.AIRPORT_MEDIUM_RANGE_DEFAULT = 50;
AS3000_MapElement.AIRPORT_MEDIUM_RANGE_MAX = 400;
AS3000_MapElement.AIRPORT_LARGE_RANGE_DEFAULT = 100;
AS3000_MapElement.AIRPORT_LARGE_RANGE_MAX = 1000;

AS3000_MapElement.VOR_RANGE_DEFAULT = 50;
AS3000_MapElement.VOR_RANGE_MAX = 250;
AS3000_MapElement.INT_RANGE_DEFAULT = 25;
AS3000_MapElement.INT_RANGE_MAX = 50;
AS3000_MapElement.NDB_RANGE_DEFAULT = 25;
AS3000_MapElement.NDB_RANGE_MAX = 50;

AS3000_MapElement.ROAD_HIGHWAY_RANGE_DEFAULT = 50;
AS3000_MapElement.ROAD_HIGHWAY_RANGE_MAX = 400;
AS3000_MapElement.ROAD_TRUNK_RANGE_DEFAULT = 15;
AS3000_MapElement.ROAD_TRUNK_RANGE_MAX = 150;
AS3000_MapElement.ROAD_PRIMARY_RANGE_DEFAULT = 4;
AS3000_MapElement.ROAD_PRIMARY_RANGE_MAX = 25;

AS3000_MapElement.VARNAME_NORTHUP_ACTIVE_ROOT = "L:AS3000_NorthUpAbove_Active";
AS3000_MapElement.VARNAME_NORTHUP_RANGE_ROOT = "L:AS3000_NorthUpAbove_Range";
AS3000_MapElement.NORTHUP_RANGE_DEFAULT = 1000;
AS3000_MapElement.VARNAME_WIND_SHOW_ROOT = "L:AS3000_Wind_Show";