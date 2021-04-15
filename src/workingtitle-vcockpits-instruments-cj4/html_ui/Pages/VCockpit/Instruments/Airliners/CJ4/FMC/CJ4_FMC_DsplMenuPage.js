class CJ4_FMC_DsplMenuPage {
    static ShowPage1(fmc) {
        fmc.clearDisplay();

        // get map symbols and render template
        const loNavaidsActive = fmc._templateRenderer.renderSwitch(["LO NAVAIDS"], (CJ4_MapSymbols.hasSymbol(CJ4_MapSymbol.NAVAIDS) - 1));
        const intersectionsActive = fmc._templateRenderer.renderSwitch(["INTERS"], (CJ4_MapSymbols.hasSymbol(CJ4_MapSymbol.INTERSECTS) - 1));
        const airportsActive = fmc._templateRenderer.renderSwitch(["APTS"], (CJ4_MapSymbols.hasSymbol(CJ4_MapSymbol.AIRPORTS) - 1));
        const altitudeActive = fmc._templateRenderer.renderSwitch(["ALTITUDE"], (CJ4_MapSymbols.hasSymbol(CJ4_MapSymbol.CONSTRAINTS) - 1));
        const termWptsActive = fmc._templateRenderer.renderSwitch(["TERM WPTS"], (CJ4_MapSymbols.hasSymbol(CJ4_MapSymbol.TERMWPTS) - 1));
        const vnavWindowSwitch = fmc._templateRenderer.renderSwitch(["OFF", "ON", "VNAV"], WTDataStore.get("WT_CJ4_MFD_DATA_WINDOW", 1));

        fmc.onLeftInput[2] = () => {
            CJ4_MapSymbols.toggleSymbol(CJ4_MapSymbol.NAVAIDS).then(() => {
                CJ4_FMC_DsplMenuPage.ShowPage1(fmc);
            });
        };

        fmc.onLeftInput[3] = () => {
            CJ4_MapSymbols.toggleSymbol(CJ4_MapSymbol.INTERSECTS).then(() => {
                CJ4_FMC_DsplMenuPage.ShowPage1(fmc);
            });
        };

        fmc.onLeftInput[4] = () => {
            CJ4_MapSymbols.toggleSymbol(CJ4_MapSymbol.TERMWPTS).then(() => {
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
            CJ4_MapSymbols.toggleSymbol(CJ4_MapSymbol.AIRPORTS).then(() => {
                CJ4_FMC_DsplMenuPage.ShowPage1(fmc);
            });
        };

        fmc.onLeftInput[5] = () => {
            let currentVal = WTDataStore.get("WT_CJ4_MFD_DATA_WINDOW", 1);
            currentVal++;
            if (currentVal === 3) {
                currentVal = 1;
            }
            WTDataStore.set("WT_CJ4_MFD_DATA_WINDOW", currentVal);
            CJ4_FMC_DsplMenuPage.ShowPage1(fmc);
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
            ["","DISPLAY [blue]"],
            [termWptsActive, "MFD[green]/PFD[disabled s-text]"],
            [" WINDOW[blue s-text]", "SIDE[blue] "],
            [vnavWindowSwitch, "L[green]/R[disabled s-text]>[disabled]"]
        ]);

        fmc.onPrevPage = () => {
            CJ4_FMC_DsplMenuPage.ShowPage2(fmc);
        };
        fmc.onNextPage = () => {
            CJ4_FMC_DsplMenuPage.ShowPage2(fmc);
        };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage2(fmc) {
        let rngSelDisabled = WTDataStore.get("WT_CJ4_RANGE_SEL_DISABLED", 0);
        const rngSelSwitch = fmc._templateRenderer.renderSwitch(["RNG: ALT SEL"], (rngSelDisabled == 1));
        const ndbsActive = fmc._templateRenderer.renderSwitch(["NDBS"], (CJ4_MapSymbols.hasSymbol(CJ4_MapSymbol.NDBS) - 1));
        const missedActive = fmc._templateRenderer.renderSwitch(["MISS APPR"], (CJ4_MapSymbols.hasSymbol(CJ4_MapSymbol.MISSEDAPPR) - 1));

        fmc.clearDisplay();
        fmc._templateRenderer.setTemplateRaw([
            [" LEFT DISPLAY MENU[blue]", "2/2 [blue]"],
            ["", "", "MFD MAP DISPLAY[blue s-text]"],
            [missedActive],
            [""],
            [ndbsActive],
            [""],
            [rngSelSwitch],
            [""],
            ["GNSS POS[s-text disabled]"],
            ["", "DISPLAY [blue s-text]"],
            ["ALTN FPLN[s-text disabled]", "MFD[green]/PFD[disabled s-text]"],
            ["", "SIDE [blue s-text]"],
            ["", "L[green]/R[disabled s-text]>[disabled]"]
        ]);

        fmc.onLeftInput[0] = () => {
            CJ4_MapSymbols.toggleSymbol(CJ4_MapSymbol.MISSEDAPPR).then(() => {
                CJ4_FMC_DsplMenuPage.ShowPage2(fmc);
            });
        };

        fmc.onLeftInput[1] = () => {
            CJ4_MapSymbols.toggleSymbol(CJ4_MapSymbol.NDBS).then(() => {
                CJ4_FMC_DsplMenuPage.ShowPage2(fmc);
            });
        };

        fmc.onLeftInput[2] = () => {
            rngSelDisabled = (rngSelDisabled == 1) ? 0 : 1;
            WTDataStore.set("WT_CJ4_RANGE_SEL_DISABLED", rngSelDisabled);
            CJ4_FMC_DsplMenuPage.ShowPage2(fmc);
        };

        fmc.onPrevPage = () => {
            CJ4_FMC_DsplMenuPage.ShowPage1(fmc);
        };
        fmc.onNextPage = () => {
            CJ4_FMC_DsplMenuPage.ShowPage1(fmc);
        };
        fmc.updateSideButtonActiveStatus();
    }
}
