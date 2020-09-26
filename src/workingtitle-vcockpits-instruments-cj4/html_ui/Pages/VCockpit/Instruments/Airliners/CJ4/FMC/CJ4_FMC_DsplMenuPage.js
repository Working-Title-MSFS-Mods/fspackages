class CJ4_FMC_DsplMenuPage {
    static ShowPage1(fmc) {
        fmc.clearDisplay();
		
		let loNavaidsActive = fmc.DSPLMENUloNavaids == 0 ? "LO NAVAIDS[white][s-text]"
            : "LO NAVAIDS[green]";
		
		let intersectionsActive = fmc.DSPLMENUintersections == 0 ? "INTERS[white][s-text]"
            : "INTERS[green]";
			
		let airportsActive = fmc.DSPLMENUairports == 0 ? "APTS[white][s-text]"
            : "APTS[green]";	
		
		let altitudeActive = fmc.DSPLMENUaltitude == 0 ? "ALTITUDE[white][s-text]"
            : "ALTITUDE[green]";
			
		
        fmc._templateRenderer.setTemplateRaw([
            [" LEFT DISPLAY MENU[blue]", "1/2 [blue]"],
            ["", "", "MFD MAP DISPLAY[blue]"],
            ["NEAREST APTS[s-text]", "ETA[s-text]"],
            [""],
            ["HI NAVAIDS[s-text]", "SPEED"],
            [""],
            [loNavaidsActive, altitudeActive],
            [""],
            [intersectionsActive, airportsActive],
            [""],
            ["TERM WPTS", "MISS APPR"],
            ["WINDOW[blue s-text]", "SIDE[blue]"],
            ["OFF/[s-text]ON[green]/VNAV[s-text]", "L[green]/[white]R[s-text]>"]
        ]);
		fmc.onLeftInput[2] = () => {
            if (fmc.DSPLMENUloNavaids == 0) {
				fmc.DSPLMENUcounter = fmc.DSPLMENUcounter + 64;
				SimVar.SetSimVarValue("L:CJ4_MAP_SYMBOLS", "Number", fmc.DSPLMENUcounter);
                fmc.DSPLMENUloNavaids = 1;
            } else if (fmc.DSPLMENUloNavaids == 1) {
				fmc.DSPLMENUcounter = fmc.DSPLMENUcounter - 64;
				SimVar.SetSimVarValue("L:CJ4_MAP_SYMBOLS", "Number", fmc.DSPLMENUcounter);
				fmc.DSPLMENUloNavaids = 0;
            }
            loNavaidsActive = fmc.DSPLMENUloNavaids == 0 ? "LO NAVAIDS[white][s-text]"
            : "LO NAVAIDS[green]";
				
            fmc.clearUserInput();
            { CJ4_FMC_DsplMenuPage.ShowPage1(fmc); };
        }
		
		fmc.onLeftInput[3] = () => {
            if (fmc.DSPLMENUintersections == 0) {
				fmc.DSPLMENUcounter = fmc.DSPLMENUcounter + 32;
				SimVar.SetSimVarValue("L:CJ4_MAP_SYMBOLS", "Number", fmc.DSPLMENUcounter);
                fmc.DSPLMENUintersections = 1;
            } else if (fmc.DSPLMENUintersections == 1) {
				fmc.DSPLMENUcounter = fmc.DSPLMENUcounter - 32;
				SimVar.SetSimVarValue("L:CJ4_MAP_SYMBOLS", "Number", fmc.DSPLMENUcounter);
				fmc.DSPLMENUintersections = 0;
            }
            intersectionsActive = fmc.DSPLMENUintersections == 0 ? "INTERS[white][s-text]"
            : "INTERS[green]";
				
            fmc.clearUserInput();
            { CJ4_FMC_DsplMenuPage.ShowPage1(fmc); };
        }
		
		fmc.onRightInput[2] = () => {
            if (fmc.DSPLMENUaltitude == 0) {
				fmc.DSPLMENUcounter = fmc.DSPLMENUcounter + 2;
				SimVar.SetSimVarValue("L:CJ4_MAP_SYMBOLS", "Number", fmc.DSPLMENUcounter);
                fmc.DSPLMENUaltitude = 1;
            } else if (fmc.DSPLMENUaltitude == 1) {
				fmc.DSPLMENUcounter = fmc.DSPLMENUcounter - 2;
				SimVar.SetSimVarValue("L:CJ4_MAP_SYMBOLS", "Number", fmc.DSPLMENUcounter);
				fmc.DSPLMENUaltitude = 0;
            }
            altitudeActive = fmc.DSPLMENUaltitude == 0 ? "ALTITUDE[white][s-text]"
            : "ALTITUDE[green]";
				
            fmc.clearUserInput();
            { CJ4_FMC_DsplMenuPage.ShowPage1(fmc); };
        }
		
		fmc.onRightInput[3] = () => {
            if (fmc.DSPLMENUairports == 0) {
				fmc.DSPLMENUcounter = fmc.DSPLMENUcounter + 16;
				SimVar.SetSimVarValue("L:CJ4_MAP_SYMBOLS", "Number", fmc.DSPLMENUcounter);
                fmc.DSPLMENUairports = 1;
            } else if (fmc.DSPLMENUairports == 1) {
				fmc.DSPLMENUcounter = fmc.DSPLMENUcounter - 16;
				SimVar.SetSimVarValue("L:CJ4_MAP_SYMBOLS", "Number", fmc.DSPLMENUcounter);
				fmc.DSPLMENUairports = 0;
            }
            airportsActive = fmc.DSPLMENUairports == 0 ? "APTS[white][s-text]"
            : "APTS[green]";
				
            fmc.clearUserInput();
            { CJ4_FMC_DsplMenuPage.ShowPage1(fmc); };
        }
		
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