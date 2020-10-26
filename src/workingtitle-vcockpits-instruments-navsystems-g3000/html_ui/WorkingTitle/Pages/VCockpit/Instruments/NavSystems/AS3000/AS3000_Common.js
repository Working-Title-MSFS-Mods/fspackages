class AS3000_MapElement extends WT_MapElement {
    constructor(_simVarNameID) {
        super(_simVarNameID);

        this.revertToDefault = true;
    }

    onTemplateLoaded() {
        super.onTemplateLoaded();

        this.instrument.zoomRanges = AS3000_MapElement.ZOOM_RANGES_DEFAULT;
        this.instrument.setZoom(this.instrument.zoomRanges.indexOf(AS3000_MapElement.ZOOM_RANGE_DEFAULT));
        this.instrument.rangeRingElement = new SvgRangeRingElement();
        this.instrument.rangeCompassElement = new SvgRangeCompassElement();
        this.instrument.trackVectorElement = new SvgTrackVectorElement();
        this.instrument.fuelRingElement = new SvgFuelRingElement();
        this.instrument.altitudeInterceptElement = new SvgAltitudeInterceptElement();

        let autoNorthUpSetting = new WT_MapAutoNorthUpSetting(this, AS3000_MapElement.NORTHUP_RANGE_DEFAULT);
        let orientationSetting = new WT_AS3000MapOrientationSetting(this, autoNorthUpSetting);
        this.addSetting(autoNorthUpSetting);
        this.addSetting(orientationSetting);

        let dcltrSetting = new WT_MapDcltrSetting(this, [
            [],
            [["show-roads", false], ["show-cities", false]],
            [["show-roads", false], ["show-cities", false], ["show-airspaces", false], ["show-airways", false], ["show-vors", false], ["show-ndbs", false], ["show-intersections", false]],
            [["show-roads", false], ["show-cities", false], ["show-airspaces", false], ["show-airways", false], ["show-vors", false], ["show-ndbs", false], ["show-intersections", false], ["show-airports", false]]
        ]);
        this.addSetting(new WT_MapSymbolVisSettingGroup(this, dcltrSetting));

        this.addSetting(new WT_MapSymbolRangeSetting(this, AS3000_MapElement.VARNAME_AIRSPACE_RANGE_ROOT, "airspaceMaxRangeIndex", AS3000_MapElement.AIRSPACE_RANGE_DEFAULT));
        this.addSetting(new WT_MapSymbolRangeSetting(this, AS3000_MapElement.VARNAME_AIRPORT_SMALL_RANGE_ROOT, "smallAirportMaxRangeIndex", AS3000_MapElement.AIRPORT_SMALL_RANGE_DEFAULT));
        this.addSetting(new WT_MapSymbolRangeSetting(this, AS3000_MapElement.VARNAME_AIRPORT_MEDIUM_RANGE_ROOT, "medAirportMaxRangeIndex", AS3000_MapElement.AIRPORT_MEDIUM_RANGE_DEFAULT));
        this.addSetting(new WT_MapSymbolRangeSetting(this, AS3000_MapElement.VARNAME_AIRPORT_LARGE_RANGE_ROOT, "largeAirportMaxRangeIndex", AS3000_MapElement.AIRPORT_LARGE_RANGE_DEFAULT));
        this.addSetting(new WT_MapSymbolRangeSetting(this, AS3000_MapElement.VARNAME_VOR_RANGE_ROOT, "vorMaxRangeIndex", AS3000_MapElement.VOR_RANGE_DEFAULT));
        this.addSetting(new WT_MapSymbolRangeSetting(this, AS3000_MapElement.VARNAME_INT_RANGE_ROOT, "intMaxRangeIndex", AS3000_MapElement.INT_RANGE_DEFAULT));
        this.addSetting(new WT_MapSymbolRangeSetting(this, AS3000_MapElement.VARNAME_NDB_RANGE_ROOT, "ndbMaxRangeIndex", AS3000_MapElement.NDB_RANGE_DEFAULT));
        this.addSetting(new WT_MapSymbolRangeSetting(this, AS3000_MapElement.VARNAME_ROAD_HIGHWAY_RANGE_ROOT, "roadHighwayMaxRangeIndex", AS3000_MapElement.ROAD_HIGHWAY_RANGE_DEFAULT));
        this.addSetting(new WT_MapSymbolRangeSetting(this, AS3000_MapElement.VARNAME_ROAD_TRUNK_RANGE_ROOT, "roadTrunkMaxRangeIndex", AS3000_MapElement.ROAD_TRUNK_RANGE_DEFAULT));
        this.addSetting(new WT_MapSymbolRangeSetting(this, AS3000_MapElement.VARNAME_ROAD_PRIMARY_RANGE_ROOT, "roadPrimaryMaxRangeIndex", AS3000_MapElement.ROAD_PRIMARY_RANGE_DEFAULT));
        this.addSetting(new WT_MapSymbolRangeSetting(this, AS3000_MapElement.VARNAME_CITY_SMALL_RANGE_ROOT, "smallCityMaxRangeIndex", AS3000_MapElement.CITY_SMALL_RANGE_DEFAULT));
        this.addSetting(new WT_MapSymbolRangeSetting(this, AS3000_MapElement.VARNAME_CITY_MEDIUM_RANGE_ROOT, "medCityMaxRangeIndex", AS3000_MapElement.CITY_MEDIUM_RANGE_DEFAULT));
        this.addSetting(new WT_MapSymbolRangeSetting(this, AS3000_MapElement.VARNAME_CITY_LARGE_RANGE_ROOT, "largeCityMaxRangeIndex", AS3000_MapElement.CITY_LARGE_RANGE_DEFAULT));

        // "Sensor" settings
        this.addSetting(new WT_MapTerrainModeSetting(this));

        // "Other" settings
        this.addSetting(new WT_MapTrackVectorSetting(this));
        this.addSetting(new WT_MapSetting(this, AS3000_MapElement.VARNAME_WIND_SHOW_ROOT, true));
        this.addSetting(new WT_MapFuelRingSetting(this));
        this.addSetting(new WT_MapAltitudeInterceptSetting(this));

        this.callSettingsOnTemplateLoaded();
    }
}
AS3000_MapElement.ZOOM_RANGES_DEFAULT = [250 / 6076, 500 / 6076, 750 / 6076, 1000 / 6076, 0.25, 0.5, 0.75, 1, 1.5, 2.5, 4, 5, 7.5, 10, 15, 25, 40, 50, 75, 100, 150, 250, 400, 500, 750, 1000]; // NM
AS3000_MapElement.ZOOM_RANGE_DEFAULT = 5;

AS3000_MapElement.DETAIL_DISPLAY_TEXT = [
        "All",
        "DCLTR 1",
        "DCLTR 2",
        "Least"
];

AS3000_MapElement.TERRAIN_MODE_DISPLAY_TEXT = [
        "Off",
        "Absolute",
        "Relative"
];

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

AS3000_MapElement.NORTHUP_RANGE_DEFAULT = 1000;
AS3000_MapElement.VARNAME_WIND_SHOW_ROOT = "L:AS3000_Map_Wind_Show";

AS3000_MapElement.Orientation = {
    HDG: 0,
    TRK: 1,
    NORTH: 2
};

class WT_AS3000MapOrientationSetting extends WT_MapOrientationSetting {
    constructor(_mapElement, _autoNorthUpSetting = null) {
        super(_mapElement);
        this.autoNorthUpSetting = _autoNorthUpSetting;
        this.orientation = -1;
    }

    onTemplateLoaded() {
        super.onTemplateLoaded();
        this.mapElement.instrument.rangeDefinition = this;
    }

    onUpdate() {
        let orientation = this.getValue();

        // handle Auto North Up
        if (this.autoNorthUpSetting && this.autoNorthUpSetting.isActive()) {
            if (this.mapElement.instrument.getDisplayRange() >= this.mapElement.instrument.zoomRanges[this.autoNorthUpSetting.getRangeIndex()]) {
                orientation = AS3000_MapElement.Orientation.NORTH;
            }
        }

        if (this.orientation != orientation) {
            switch (orientation) {
            case AS3000_MapElement.Orientation.HDG:
                this.setHdgUp();
                break;
            case AS3000_MapElement.Orientation.TRK:
                this.setTrkUp();
                break;
            case AS3000_MapElement.Orientation.NORTH:
                this.setNorthUp();
                break;
            }
            this.orientation = orientation;
        }
    }

    setHdgUp() {
        this.mapElement.instrument.planeTrackedPosY = 2 / 3;
        this.mapElement.instrument.showRangeRing = false;
        this.mapElement.instrument.showRangeCompass = true;
        Avionics.Utils.diffAndSet(this.mapElement.instrument.mapOrientationElement, "HDG UP");
    }

    setTrkUp() {
        this.mapElement.instrument.planeTrackedPosY = 2 / 3;
        this.mapElement.instrument.showRangeRing = false;
        this.mapElement.instrument.showRangeCompass = true;
        Avionics.Utils.diffAndSet(this.mapElement.instrument.mapOrientationElement, "TRK UP");
    }

    setNorthUp() {
        this.mapElement.instrument.planeTrackedPosY = 0.5;
        this.mapElement.instrument.showRangeRing = true;
        this.mapElement.instrument.showRangeCompass = false;
        Avionics.Utils.diffAndSet(this.mapElement.instrument.mapOrientationElement, "NORTH UP");
    }

    getRotation() {
        switch (this.orientation) {
            case AS3000_MapElement.Orientation.TRK:
                if (!SimVar.GetSimVarValue("SIM ON GROUND", "bool")) {
                    return -SimVar.GetSimVarValue("GPS GROUND TRUE TRACK", "degree");
                }
            case AS3000_MapElement.Orientation.HDG: return -SimVar.GetSimVarValue("PLANE HEADING DEGREES TRUE", "degree");
        }
        return 0;
    }

    getRangeDefinition(_context) {
        if (this.orientation == AS3000_MapElement.Orientation.NORTH) {
            return (_context.bottom - _context.top) / 4;
        } else {
            return (_context.bottom - _context.top) / 3;
        }
    }
}