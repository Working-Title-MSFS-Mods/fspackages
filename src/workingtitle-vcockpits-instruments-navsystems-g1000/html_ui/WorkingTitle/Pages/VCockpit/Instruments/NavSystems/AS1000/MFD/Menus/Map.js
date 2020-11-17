class WT_Map_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_MFD_Soft_Key_Menu_Handler} menuHandler 
     */
    constructor(menuHandler) {
        super(false);

        this.menuHandler = menuHandler;
    }
}