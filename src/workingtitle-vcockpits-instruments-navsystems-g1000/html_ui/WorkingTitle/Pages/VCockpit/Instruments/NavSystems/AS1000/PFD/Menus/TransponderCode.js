class WT_PFD_Transponder_Code_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_PFD_Menu_Handler} menus 
     * @param {WT_Transponder_Model} transponderModel 
     */
    constructor(menus, transponderModel) {
        super(false);
        this.menus = menus;
        this.transponderModel = transponderModel;
        this.transponderTempCode = "";
        for (let i = 0; i <= 7; i++) {
            this.addSoftKey(i + 1, new WT_Soft_Key(i, this.addNumber.bind(this, i.toFixed(0))));
        }
        this.addSoftKey(9, new WT_Soft_Key("IDENT"));
        this.addSoftKey(10, new WT_Soft_Key("BKSP", this.backspace.bind(this)));
        this.addSoftKey(11, menus.backKey);
        this.addSoftKey(12, menus.alertsKey);
    }
    backspace() {
        if (this.transponderTempCode.length > 0) {
            this.transponderTempCode = this.transponderTempCode.slice(0, this.transponderTempCode.length - 1);
            this.transponderModel.setEditCode(this.transponderTempCode);
        }
    }
    addNumber(number) {
        this.transponderTempCode += number;
        this.transponderModel.setEditCode(this.transponderTempCode);
        if (this.transponderTempCode.length == 4) {
            this.transponderModel.setSquawk(this.transponderTempCode);
            this.menus.back();
        }
    };
    deactivate() {
        this.transponderTempCode = "";
        this.transponderModel.setEditCode(null);
    }
}