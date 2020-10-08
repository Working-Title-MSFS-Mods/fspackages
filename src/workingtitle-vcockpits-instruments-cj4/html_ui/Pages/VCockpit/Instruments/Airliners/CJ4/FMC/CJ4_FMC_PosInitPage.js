class CJ4_FMC_PosInitPage {
    static ShowPage1(fmc) {
        let currPos = new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude")).toDegreeString();
        // console.log(currPos);
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
        fmc._templateRenderer.setTemplateRaw([
            ["", "1/2 [blue]", "POS INIT[blue]"],
            [" FMS POS[blue]"],
            [currPos + ""],
            [" AIRPORT[blue]"],
            [originCell, originPos],
            [" PILOT/REF WPT[blue]"],
            [refAirport, refAirportCoordinates],
            ["", "SET POS TO GNSS [blue]"],
            ["", currPos],
            ["", "SET POS      [blue]"],
            ["", irsPos],
            ["--------------------------[blue]"],
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
        fmc.registerPeriodicPageRefresh(() => {
            let currPos = new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude")).toDegreeString();
            let groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
            fmc._templateRenderer.setTemplateRaw([
                ["", "2/2 [blue]", "POS INIT[blue]"],
                [" FMC POS[blue]", "GS [blue]"],
                [currPos + "", groundSpeed + ""],
                [" GNSS1 POS[blue]"],
                [currPos + "", groundSpeed + ""],
                [" GNSS2 POS[blue]"],
                [currPos + "", groundSpeed + ""],
                [""],
                [""],
                [""],
                [""],
                ["-----------------------[blue]"],
                ["<INDEX", "FPLN>"]
            ]);
        }, 1000, true);

        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_RoutePage.ShowPage1(fmc); };
        fmc.onPrevPage = () => { CJ4_FMC_PosInitPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
}
//# sourceMappingURL=CJ4_FMC_PosInitPage.js.map