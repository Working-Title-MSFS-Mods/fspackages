class CJ4_FMC_MsgPage {
    static ShowPage1(fmc) { // Message page
        fmc.clearDisplay();
        fmc._templateRenderer.setTemplateRaw([
            ["MESSAGES[blue]","1/1 [blue]"],
            ["-----NEW MESSAGES-------"],
            [""],
            [""],
            [""],
            ["-----OLD MESSAGES-------"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""]
        ])
    }
}