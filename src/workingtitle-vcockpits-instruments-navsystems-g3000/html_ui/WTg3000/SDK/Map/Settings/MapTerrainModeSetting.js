/**
 * This class represents a setting controlling map terrain display. Three modes are supported by default.
 * Terrain OFF disables display of terrain color information (all land will be colored as black).
 * Terrain ABSOLUTE enables display of terrain color information based on elevation above MSL.
 * Terrain RELATIVE enables display of terrain color information based on height above/below the plane.
 */
class WT_MapTerrainModeSetting extends WT_MapSetting {
    constructor(model, autoUpdate, defaultValue = WT_MapModelTerrainModule.TerrainMode.OFF, isSyncable = true, isPersistent = true, key = WT_MapTerrainModeSetting.KEY_DEFAULT) {
        super(model, key, defaultValue, isSyncable, autoUpdate, isPersistent);
    }

    update() {
        this.mapModel.terrain.mode = this.getValue();
    }
}
WT_MapTerrainModeSetting.KEY_DEFAULT = "WT_Map_Terrain_Mode";