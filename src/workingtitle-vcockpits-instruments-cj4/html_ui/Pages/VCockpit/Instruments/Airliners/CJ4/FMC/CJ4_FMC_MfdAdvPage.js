class CJ4_FMC_MfdAdvPage {
    static ShowPage1(fmc) {
        fmc.clearDisplay();
        fmc._templateRenderer.setTemplateRaw([
            [" LEFT DISPLAY ADVANCE[blue]"],
            [" ACT PLAN MAP CENTER[s-text blue]"],
            ["<PREV WPT"],
            [""],
            ["<NEXT WPT"],
            [""],
            ["<TO WPT"],
            [" CTR WPT[s-text blue]"],
            ["<-----"],
            [""],
            [""],
            ["", "SIDE [s-text blue]"],
            ["", "L[green]/[white]R[s-text]>"]
        ]);
        fmc.updateSideButtonActiveStatus();
    }
	static ShowPage2(fmc) {
        fmc.clearDisplay();
        fmc._templateRenderer.setTemplateRaw([
            [" LEFT DISPLAY ADVANCE[blue]"],
            ["    TEXT DISPLAY[s-text blue]"],
            ["<PREV PAGE"],
            [""],
            ["<NEXT PAGE"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["", "SIDE [s-text blue]"],
            ["", "L[green]/[white]R[s-text]>"]
        ]);
        fmc.updateSideButtonActiveStatus();
    }
}
