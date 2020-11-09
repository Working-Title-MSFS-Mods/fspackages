class WT_PFD_Transponder_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_PFD_Menu_Handler} menus 
     * @param {WT_Transponder_Model} transponderModel 
     * @param {WT_PFD_Transponder_Code_Menu} transponderCodeMenu 
     */
    constructor(menus, transponderModel, transponderCodeMenu) {
        super(false);
        this.transponderModel = transponderModel;
        this.stby = new WT_Soft_Key("STBY", () => transponderModel.setMode(1));
        this.on = new WT_Soft_Key("ON", () => transponderModel.setMode(3));
        this.alt = new WT_Soft_Key("ALT", () => transponderModel.setMode(4));
        this.gnd = new WT_Soft_Key("GND", () => transponderModel.setMode(2));
        this.addSoftKey(3, this.stby);
        this.addSoftKey(4, this.on);
        this.addSoftKey(5, this.alt);
        this.addSoftKey(6, this.gnd);
        this.addSoftKey(7, new WT_Soft_Key("VFR", transponderModel.setVfrSquawk.bind(transponderModel)));
        this.addSoftKey(8, new WT_Soft_Key("CODE", () => menus.goToMenu(transponderCodeMenu)));
        this.addSoftKey(9, new WT_Soft_Key("IDENT"));
        this.addSoftKey(11, menus.backKey);
        this.addSoftKey(12, menus.alertsKey);

    }
    activate() {
        this.modeSubscription = this.transponderModel.mode.subscribe(mode => {
            this.stby.selected = mode == "STBY";
            this.on.selected = mode == "ON";
            this.alt.selected = mode == "ALT";
            this.gnd.selected = mode == "GND";
        });
    }
    deactivate() {
        if (this.modeSubscription)
            this.modeSubscription = this.modeSubscription();
    }
}