class CJ4_FMC_DsplMenuPage {
    static ShowPage1(fmc) {
        fmc.clearDisplay();
        fmc._templateRenderer.setTemplateRaw([
            [" LEFT DISPLAY MENU[blue]", "1/2 [blue]"],
            ["", "", "MFD MAP DISPLAY[blue]"],
            ["NEAREST APTS[s-text]", "ETA[s-text]"],
            [""],
            ["HI NAVAIDS[green]", "SPEED"],
            [""],
            ["LO NAVAIDS", "ALTITUDE"],
            [""],
            ["INTERS", "APTS"],
            [""],
            ["TERM WPTS", "MISS APPR"],
            ["WINDOW[blue s-text]", "SIDE[blue]"],
            ["OFF/[s-text]ON[green]/VNAV[s-text]", "L[green]/[white]R[s-text]>"]
        ]);
        fmc.onPrevPage = () => { CJ4_FMC_DsplMenuPage.ShowPage2(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_DsplMenuPage.ShowPage2(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage2(fmc) {
        fmc.clearDisplay();
        fmc._templateRenderer.setTemplateRaw([
            [" LEFT DISPLAY MENU[blue]", "2/2 [blue]"],
            ["", "", "MFD MAP DISPLAY[blue s-text]"],
            ["MISS APPR[s-text]"],
            [""],
            ["NDBS[s-text]"],
            [""],
            ["RNG: ALT SEL[green]"],
            [""],
            ["GNSS POS[green]"],
            ["", "DISPLAY [blue s-text]"],
            ["ALTN FPLN[s-text]", "MFD[green]/[white]PFD>[s-text white]"],
            ["", "SIDE [blue s-text]"],
            ["", "L[green]/[white]R[s-text]>"]
        ]);
        fmc.onPrevPage = () => { CJ4_FMC_DsplMenuPage.ShowPage1(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_DsplMenuPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
}
//# sourceMappingURL=CJ4_FMC_FMCCommPage.js.map