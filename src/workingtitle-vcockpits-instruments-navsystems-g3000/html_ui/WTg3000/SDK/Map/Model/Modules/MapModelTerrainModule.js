class WT_MapModelTerrainModule extends WT_MapModelModule {
    constructor(name = WT_MapModelTerrainModule.NAME_DEFAULT) {
        super(name);

        this._optsManager.addOptions(WT_MapModelTerrainModule.OPTIONS_DEF);
    }
}
WT_MapModelTerrainModule.NAME_DEFAULT = "terrain";
WT_MapModelTerrainModule.TerrainMode = {
    OFF: 0,
    ABSOLUTE: 1,
    RELATIVE: 2
};
WT_MapModelTerrainModule.OPTIONS_DEF = {
    mode: {default: WT_MapModelTerrainModule.TerrainMode.OFF, auto: true},
    showIsolines: {default: false, auto: true}
};