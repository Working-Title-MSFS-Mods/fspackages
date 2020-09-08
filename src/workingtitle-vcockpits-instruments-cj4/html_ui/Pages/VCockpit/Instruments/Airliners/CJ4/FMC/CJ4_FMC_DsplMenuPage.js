class CJ4_FMC_DsplMenuPage {
    static ShowPage1(fmc) {
        fmc.clearDisplay();
        fmc.setTemplate([
            ["LEFT DISPLAY MENU[color]blue", "1", "2"],
            ["", "", "MAP DISPLAY[color]blue"],
            ["NEAREST APTS", "ETA"],
            [""],
            ["HI NAVAIDS", "SPEED"],
            [""],
            ["LO NAVAIDS", "ALTITUDE"],
            [""],
            ["INTERS", "APTS"],
            [""],
            ["TERM WPTS", "MISS APPR"],
            ["WINDOW[color]blue", "SIDE[color]blue"],
            ["OFF/ON/VNAV", "L/R>"]
        ]);
        fmc.onPrevPage = () => { CJ4_FMC_DsplMenuPage.ShowPage2(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_DsplMenuPage.ShowPage2(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage2(fmc) {
        fmc.clearDisplay();
        fmc.setTemplate([
            ["LEFT DISPLAY MENU[color]blue", "2", "2"],
            ["", "", "MAP DISPLAY[color]blue"],
            ["NDBS"],
            [""],
            ["RNG: ALT SEL"],
            [""],
            ["LRN POS"],
            [""],
            ["ALTN FPLN"],
            [""],
            [""],
            ["", "SIDE[color]blue"],
            ["", "L/R>"]
        ]);
        fmc.onPrevPage = () => { CJ4_FMC_DsplMenuPage.ShowPage1(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_DsplMenuPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
}
//# sourceMappingURL=CJ4_FMC_FMCCommPage.js.map