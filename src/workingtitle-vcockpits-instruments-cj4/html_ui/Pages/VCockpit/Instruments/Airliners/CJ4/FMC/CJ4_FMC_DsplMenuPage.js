class CJ4_FMC_DsplMenuPage {

    static toggleSymbol(_symbol) {
        return new Promise(function (resolve) {
            let symbols = SimVar.GetSimVarValue("L:CJ4_MAP_SYMBOLS", "number");
            if (symbols == -1)
                resolve(); // if it fails, it fails
            symbols ^= (1 << _symbol);
            SimVar.SetSimVarValue("L:CJ4_MAP_SYMBOLS", "number", symbols).then(() => {
                resolve();
            });
        });
    }

    static hasSymbol(_symbol) {
        let symbols = SimVar.GetSimVarValue("L:CJ4_MAP_SYMBOLS", "number");
        if (symbols == -1)
            return 0;
        if (symbols & (1 << _symbol))
            return 1;
        return 0;
    }

    static ShowPage1(fmc) {
        fmc.clearDisplay();

        // get map symbols and render template
        let loNavaidsActive = fmc._templateRenderer.renderSwitch(["LO NAVAIDS"], (this.hasSymbol(CJ4_MapSymbol.NAVAIDS) - 1));
        let intersectionsActive = fmc._templateRenderer.renderSwitch(["INTERS"], (this.hasSymbol(CJ4_MapSymbol.INTERSECTS) - 1));
        let airportsActive = fmc._templateRenderer.renderSwitch(["APTS"], (this.hasSymbol(CJ4_MapSymbol.AIRPORTS) - 1));
        let altitudeActive = fmc._templateRenderer.renderSwitch(["ALTITUDE"], (this.hasSymbol(CJ4_MapSymbol.CONSTRAINTS) - 1));
        let termWptsActive = fmc._templateRenderer.renderSwitch(["TERM WPTS"], (this.hasSymbol(CJ4_MapSymbol.TERMWPTS) - 1));

        fmc.onLeftInput[2] = () => {
            this.toggleSymbol(CJ4_MapSymbol.NAVAIDS).then(() => {
                CJ4_FMC_DsplMenuPage.ShowPage1(fmc);
            });
        };

        fmc.onLeftInput[3] = () => {
            this.toggleSymbol(CJ4_MapSymbol.INTERSECTS).then(() => {
                CJ4_FMC_DsplMenuPage.ShowPage1(fmc);
            });
        };

        fmc.onLeftInput[4] = () => {
            this.toggleSymbol(CJ4_MapSymbol.TERMWPTS).then(() => {
                CJ4_FMC_DsplMenuPage.ShowPage1(fmc);
            });
        };

        // TODO: disabled because of errors with mapinstrument
        // fmc.onRightInput[2] = () => {
        //     this.toggleSymbol(CJ4_MapSymbol.CONSTRAINTS).then(() => {
        //         CJ4_FMC_DsplMenuPage.ShowPage1(fmc);
        //     });
        // };

        fmc.onRightInput[3] = () => {
            this.toggleSymbol(CJ4_MapSymbol.AIRPORTS).then(() => {
                CJ4_FMC_DsplMenuPage.ShowPage1(fmc);
            });
        };

        fmc._templateRenderer.setTemplateRaw([
            [" LEFT DISPLAY MENU[blue]", "1/2 [blue]"],
            ["", "", "MFD MAP DISPLAY[blue]"],
            ["NEAREST APTS[s-text disabled]", "ETA[s-text disabled]"],
            [""],
            ["HI NAVAIDS[s-text disabled]", "SPEED[s-text disabled]"],
            [""],
            [loNavaidsActive, altitudeActive + "[disabled s-text]"],
            [""],
            [intersectionsActive, airportsActive],
            [""],
            [termWptsActive, "MISS APPR[s-text disabled]"],
            ["WINDOW[blue s-text]", "SIDE[blue]"],
            ["OFF/[s-text]ON[green]/VNAV[s-text]", "L[green]/[white]R[s-text]>"]
        ]);

        fmc.onPrevPage = () => { CJ4_FMC_DsplMenuPage.ShowPage2(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_DsplMenuPage.ShowPage2(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage2(fmc) {
        let rngSelDisabled = WTDataStore.get("WT_CJ4_RANGE_SEL_DISABLED", 0);
        let rngSelSwitch = (rngSelDisabled == 0) ? "green" : "";
        let ndbsActive = fmc._templateRenderer.renderSwitch(["NDBS"], (this.hasSymbol(CJ4_MapSymbol.NDBS) - 1));

        fmc.clearDisplay();
        fmc._templateRenderer.setTemplateRaw([
            [" LEFT DISPLAY MENU[blue]", "2/2 [blue]"],
            ["", "", "MFD MAP DISPLAY[blue s-text]"],
            ["MISS APPR[s-text disabled]"],
            [""],
            [ndbsActive],
            [""],
            ["RNG: ALT SEL[s-text " + rngSelSwitch + "]"],
            [""],
            ["GNSS POS[s-text disabled]"],
            ["", "DISPLAY [blue s-text]"],
            ["ALTN FPLN[s-text disabled]", "MFD[green]/[white]PFD>[s-text white]"],
            ["", "SIDE [blue s-text]"],
            ["", "L[green]/[white]R[s-text]>"]
        ]);

        fmc.onLeftInput[1] = () => {
            this.toggleSymbol(CJ4_MapSymbol.NDBS).then(() => {
                CJ4_FMC_DsplMenuPage.ShowPage2(fmc);
            });
        };

        fmc.onLeftInput[2] = () => {
            rngSelDisabled = (rngSelDisabled == 1) ? 0 : 1;
            WTDataStore.set("WT_CJ4_RANGE_SEL_DISABLED", rngSelDisabled);
            CJ4_FMC_DsplMenuPage.ShowPage2(fmc);
        };

        fmc.onPrevPage = () => { CJ4_FMC_DsplMenuPage.ShowPage1(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_DsplMenuPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
}

// don't love this code copy here, but you gotta do what you gotta do
var CJ4_MapSymbol;
(function (CJ4_MapSymbol) {
    CJ4_MapSymbol[CJ4_MapSymbol["TRAFFIC"] = 0] = "TRAFFIC";
    CJ4_MapSymbol[CJ4_MapSymbol["CONSTRAINTS"] = 1] = "CONSTRAINTS";
    CJ4_MapSymbol[CJ4_MapSymbol["AIRSPACES"] = 2] = "AIRSPACES";
    CJ4_MapSymbol[CJ4_MapSymbol["AIRWAYS"] = 3] = "AIRWAYS";
    CJ4_MapSymbol[CJ4_MapSymbol["AIRPORTS"] = 4] = "AIRPORTS";
    CJ4_MapSymbol[CJ4_MapSymbol["INTERSECTS"] = 5] = "INTERSECTS";
    CJ4_MapSymbol[CJ4_MapSymbol["NAVAIDS"] = 6] = "NAVAIDS";
    CJ4_MapSymbol[CJ4_MapSymbol["NDBS"] = 7] = "NDBS";
    CJ4_MapSymbol[CJ4_MapSymbol["TERMWPTS"] = 8] = "TERMWPTS";
})(CJ4_MapSymbol || (CJ4_MapSymbol = {}));

//# sourceMappingURL=CJ4_FMC_FMCCommPage.js.map