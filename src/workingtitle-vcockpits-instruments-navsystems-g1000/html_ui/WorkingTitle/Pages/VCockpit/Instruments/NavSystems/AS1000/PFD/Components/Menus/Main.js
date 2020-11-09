class WT_PFD_Main_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_PFD_Menu_Handler} menus 
     * @param {WT_PFD_Mini_Page_Controller} miniPageController 
     * @param {HSIIndicatorModel} hsiModel 
     * @param {WT_PFD_Inset_Map_Menu} insetMapMenu 
     * @param {WT_PFD_PFD_Menu} pfdMenu 
     * @param {WT_PFD_Transponder_Menu} transponderMenu 
     * @param {WT_PFD_Debug_Menu} transponderMenu 
     */
    constructor(menus, miniPageController, hsiModel, insetMapMenu, pfdMenu, transponderMenu, debugMenu) {
        super(false);
        this.addSoftKey(1, new WT_Soft_Key("DEBUG", () => menus.goToMenu(debugMenu)));
        this.addSoftKey(2, new WT_Soft_Key("INSET", () => menus.goToMenu(insetMapMenu)));
        this.addSoftKey(4, new WT_Soft_Key("PFD", () => menus.goToMenu(pfdMenu)));
        this.addSoftKey(5, new WT_Soft_Key("OBS"));
        this.addSoftKey(6, new WT_Soft_Key("CDI", () => hsiModel.cycleCdi()));
        this.addSoftKey(7, new WT_Soft_Key("DME", () => miniPageController.showAdfDme()));
        this.addSoftKey(8, new WT_Soft_Key("XPDR", () => menus.goToMenu(transponderMenu)));
        this.addSoftKey(9, new WT_Soft_Key("IDENT"));
        this.addSoftKey(10, new WT_Soft_Key("TMR/REF", () => miniPageController.showTimerReferences()));
        this.addSoftKey(11, new WT_Soft_Key("NRST", () => miniPageController.showNearest()));
        this.addSoftKey(12, menus.alertsKey);
    }
}