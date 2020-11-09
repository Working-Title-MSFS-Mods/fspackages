class WT_PFD_Wind_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_PFD_Menu_Handler} menus 
     * @param {WT_PFD_Wind_Model} wind
     * @param {WT_PFD_Alert_Key} alertsKey
     */
    constructor(menus, wind, alertsKey) {
        super(false);
        this.mode1 = new WT_Soft_Key("OPTN 1", () => wind.setMode(1));
        this.mode2 = new WT_Soft_Key("OPTN 2", () => wind.setMode(2));
        this.mode3 = new WT_Soft_Key("OPTN 3", () => wind.setMode(3));
        this.off = new WT_Soft_Key("OFF", () => wind.setMode(0));
        wind.mode.subscribe(mode => {
            this.mode1.selected = mode == 1;
            this.mode2.selected = mode == 2;
            this.mode3.selected = mode == 3;
            this.off.selected = mode == 0;
        });
        this.addSoftKey(3, this.mode1);
        this.addSoftKey(4, this.mode2);
        this.addSoftKey(5, this.mode3);
        this.addSoftKey(6, this.off);
        this.addSoftKey(11, menus.backKey);
        this.addSoftKey(12, alertsKey);
    }
}