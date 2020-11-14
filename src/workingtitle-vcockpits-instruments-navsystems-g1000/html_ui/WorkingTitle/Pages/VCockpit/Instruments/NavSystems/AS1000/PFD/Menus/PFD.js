class WT_PFD_PFD_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_PFD_Menu_Handler} menus 
     * @param {HSIIndicatorModel} hsiModel
     * @param {WT_Barometric_Pressure} barometricPressure
     * @param {WT_PFD_Synthetic_Vision_Menu} syntheticVisionMenu
     * @param {WT_PFD_Alt_Unit_Menu} altUnitMenu
     * @param {WT_PFD_Wind_Menu} windMenu
     */
    constructor(menus, hsiModel, barometricPressure, syntheticVisionMenu, altUnitMenu, windMenu) {
        super(false);
        this.addSoftKey(1, new WT_Soft_Key("SYN VIS", () => menus.goToMenu(syntheticVisionMenu)));
        this.addSoftKey(2, new WT_Soft_Key("DFLTS"));
        this.addSoftKey(3, new WT_Soft_Key("WIND", () => menus.goToMenu(windMenu)));
        this.addSoftKey(4, new WT_Soft_Key("DME", hsiModel.toggleDme.bind(hsiModel)));
        this.addSoftKey(5, new WT_Soft_Key("BRG1", hsiModel.cycleBearing.bind(hsiModel, 1)));
        this.addSoftKey(6, new WT_Soft_Key("HSI FRMT"));
        this.addSoftKey(7, new WT_Soft_Key("BRG2", hsiModel.cycleBearing.bind(hsiModel, 2)));
        this.addSoftKey(9, new WT_Soft_Key("ALT UNIT", () => menus.goToMenu(altUnitMenu)));
        this.addSoftKey(10, new WT_Soft_Key("STD BARO", () => barometricPressure.setStandard()));
        this.addSoftKey(11, menus.backKey);
        this.addSoftKey(12, menus.alertsKey);
    }
}