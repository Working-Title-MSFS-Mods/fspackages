class CJ4_FMC_PosInitPage {
    static ShowPage1(fmc) {
        let currPos = new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude")).toDegreeString();
        console.log(currPos);
        let originCell = "----";
		let originPos = "";
        if (fmc && fmc.flightPlanManager) {
            let origin = fmc.flightPlanManager.getOrigin();
            if (origin) {
                originCell = origin.ident;
				originPos = currPos;
            }
            else if (fmc.tmpOrigin) {
                originCell = fmc.tmpOrigin;
            }
        }
		let refAirport = "-----";
        if (fmc.refAirport && fmc.refAirport.ident) {
            refAirport = fmc.refAirport.ident;
        }
        let refAirportCoordinates = "";
        if (fmc.refAirport && fmc.refAirport.infos && fmc.refAirport.infos.coordinates) {
            refAirportCoordinates = fmc.refAirport.infos.coordinates.toDegreeString();
        }
        let irsPos = "□□□°□□.□ □□□□°□□.□";
        if (fmc.initCoordinates) {
            irsPos = fmc.initCoordinates;
        }
        fmc.clearDisplay();
        fmc.setTemplate([
            ["POS INIT[color]blue", "1", "2"],
            ["FMS POS" + "[color]blue"],
            [currPos],
            ["AIRPORT" + "[color]blue"],
            [originCell, originPos],
            ["PILOT/REF WPT" + "[color]blue"],
            [refAirport, refAirportCoordinates],
            ["", "SET POS TO GNSS" + "[color]blue"],
            ["", currPos],
            ["", "SET POS" + "[color]blue"],
            ["", irsPos],
            ["--------------------------" + "[color]blue"],
            ["<INDEX", "FPLN>"]
        ]);
        fmc.onLeftInput[0] = () => {
            fmc.inOut = currPos;
        };
        fmc.onRightInput[1] = () => {
			if (originCell != "----") {
            fmc.inOut = currPos;
			}
        };
		fmc.onLeftInput[2] = async () => {
            let value = fmc.inOut;
            fmc.inOut = "";
            if (await fmc.tryUpdateRefAirport(value)) {
                CJ4_FMC_PosInitPage.ShowPage1(fmc);
            }
        };
		fmc.onRightInput[2] = () => {
			fmc.inOut = refAirportCoordinates;
		};
        fmc.onRightInput[3] = () => {
            fmc.inOut = currPos;
        };
        fmc.onRightInput[4] = async () => {
            let value = fmc.inOut;
            fmc.inOut = "";
            if (await fmc.tryUpdateIrsCoordinatesDisplay(value)) {
                CJ4_FMC_PosInitPage.ShowPage1(fmc);
            }
        };
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
		fmc.onRightInput[5] = () => { CJ4_FMC_RoutePage.ShowPage1(fmc); };
        fmc.onPrevPage = () => { CJ4_FMC_PosInitPage.ShowPage3(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_PosInitPage.ShowPage2(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage2(fmc) {
        fmc.clearDisplay();
        fmc.setTemplate([
            ["POS REF", "2", "3"],
            ["FMC POS (GPS L)", "GS"],
            [""],
            ["IRS(3)"],
            [""],
            ["RNP/ACTUAL", "DME DME"],
            [""],
            [""],
            [""],
            ["-----------------", "GPS NAV"],
            ["<PURGE", "INHIBIT>"],
            [""],
            ["<INDEX", "BRG/DIST>"]
        ]);
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_RoutePage.ShowPage1(fmc); };
        fmc.onPrevPage = () => { CJ4_FMC_PosInitPage.ShowPage1(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_PosInitPage.ShowPage3(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage3(fmc) {
        fmc.clearDisplay();
        fmc.setTemplate([
            ["POS REF", "2", "3"],
            ["IRS L", "GS"],
            ["000°/0.0NM", "290KT"],
            ["IRS C", "GS"],
            ["000°/0.0NM", "290KT"],
            ["IRS R", "GS"],
            ["000°/0.0NM", "290KT"],
            ["GPS L", "GS"],
            ["000°/0.0NM", "290KT"],
            ["GPS R", "GS"],
            ["000°/0.0NM", "290KT"],
            ["__FMCSEPARATOR"],
            ["<INDEX", "LAT/LON>"]
        ]);
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_RoutePage.ShowPage1(fmc); };
        fmc.onPrevPage = () => { CJ4_FMC_PosInitPage.ShowPage2(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_PosInitPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
}
//# sourceMappingURL=CJ4_FMC_PosInitPage.js.map