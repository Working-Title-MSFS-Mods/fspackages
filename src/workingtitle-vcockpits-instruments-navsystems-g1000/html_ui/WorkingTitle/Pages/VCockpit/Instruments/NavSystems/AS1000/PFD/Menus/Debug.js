class WT_PFD_Debug_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_PFD_Menu_Handler} menus 
     */
    constructor(menus) {
        super(false);
        this.addSoftKey(1, new WT_Soft_Key("Reload", () => {
            window.document.location.reload();
        }));
        this.addSoftKey(2, new WT_Soft_Key("Reload CSS", () => {
            for (let cssElement of document.querySelectorAll(`link[rel=stylesheet]`)) {
                let url = cssElement.getAttribute("href");
                url = url.split("?")[0];
                url = url + "?" + (new Date().getTime());
                cssElement.setAttribute("href", url);
            }
        }));
        this.addSoftKey(3, new WT_Soft_Key("VSpeed", () => {
            Coherent.call("AP_VS_VAR_SET_ENGLISH", 1, 200);
            SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 1);
        }));
        this.addSoftKey(11, menus.backKey);
    }
}