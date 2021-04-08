class WT_Map_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_MFD_Soft_Key_Menu_Handler} menuHandler
     * @param {WT_Map_Setup} mapSetup
     */
    constructor(menuHandler, mapSetup) {
        super(false);
        this.menuHandler = menuHandler;

        const buttons = {
            traffic: new WT_Soft_Key("TRAFFIC"),
            profile: new WT_Soft_Key("PROFILE"),
            topo: new WT_Soft_Key("TOPO", () => mapSetup.toggleValue("topographyEnabled")),
            terrain: new WT_Soft_Key("TERRAIN", () => mapSetup.toggleValue("terrainDataEnabled")),
            airways: new WT_Soft_Key("AIRWAYS"),
            stormScope: new WT_Soft_Key("STRMSCP"),
            nexrad: new WT_Soft_Key("NEXRAD", () => mapSetup.toggleValue("nexradEnabled")),
            xmLightning: new WT_Soft_Key("XM LTNG"),
            metar: new WT_Soft_Key("METAR"),
            legend: new WT_Soft_Key("LEGEND"),
        };

        buttons.traffic.disabled = true;
        buttons.profile.disabled = true;
        buttons.airways.disabled = true;
        buttons.stormScope.disabled = true;
        buttons.xmLightning.disabled = true;
        buttons.metar.disabled = true;
        buttons.legend.disabled = true;

        this.addSoftKey(1, buttons.traffic);
        this.addSoftKey(2, buttons.profile);
        this.addSoftKey(3, buttons.topo);
        this.addSoftKey(4, buttons.terrain);
        this.addSoftKey(5, buttons.airways);
        this.addSoftKey(6, buttons.stormScope);
        this.addSoftKey(7, buttons.nexrad);
        this.addSoftKey(8, buttons.xmLightning);
        this.addSoftKey(9, buttons.metar);
        this.addSoftKey(10, buttons.legend);
        this.addSoftKey(11, menuHandler.backKey);

        mapSetup.observe("topographyEnabled").subscribe(value => buttons.topo.selected = value);
        mapSetup.observe("terrainDataEnabled").subscribe(value => buttons.terrain.selected = value);
        mapSetup.observe("nexradEnabled").subscribe(value => buttons.nexrad.selected = value);
    }
}