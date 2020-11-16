class WT_MapModelTerrainComponent extends WT_MapModelComponent {
    constructor(name = WT_MapModelTerrainComponent.NAME_DEFAULT) {
        super(name);

        this._optsManager.addOptions(WT_MapModelTerrainComponent.OPTIONS_DEF);
    }
}
WT_MapModelTerrainComponent.NAME_DEFAULT = "terrain";
WT_MapModelTerrainComponent.TerrainMode = {
    OFF: 0,
    ABSOLUTE: 1,
    RELATIVE: 2
};
WT_MapModelTerrainComponent.OPTIONS_DEF = {
    mode: {default: WT_MapModelTerrainComponent.TerrainMode.OFF, auto: true}
};