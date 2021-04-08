class WT_PFD_Inset_Map_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_PFD_Menu_Handler} menus 
     * @param {WT_PFD_Inset_Map} map
     * @param {WT_PFD_Alert_Key} alertsKey
     */
    constructor(menus, map, alertsKey) {
        super(false);

        this.map = map;
        this.addSoftKey(1, new WT_Soft_Key("OFF", () => {
            map.disable();
            menus.back();
        }));

        this.addSoftKey(11, menus.backKey);
        this.addSoftKey(12, alertsKey);
    }
    activate() {
        this.map.enable();
    }
}