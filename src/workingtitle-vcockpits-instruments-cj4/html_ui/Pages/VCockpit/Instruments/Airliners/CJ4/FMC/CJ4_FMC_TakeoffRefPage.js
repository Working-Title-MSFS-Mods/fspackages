class CJ4_FMC_TakeoffRefPage {
    static ShowPage1(fmc) { //TAKEOFF REF Page 1
        fmc.clearDisplay();
        let originIdent = "";
        let origin = fmc.flightPlanManager.getOrigin();
        if (origin) {
            originIdent = origin.ident;
        }
        let depRunwayDirection = "";
        let depRunwayElevation = "";
        let depRunwayLength = "";
        let depRunwayOutput = "";
        let depRunway = "";

        if (fmc.flightPlanManager.getDepartureRunway()) {
            depRunway = fmc.flightPlanManager.getDepartureRunway();
            depRunwayOutput = "RW" + fmc.getRunwayDesignation(depRunway);
            console.log("depRunwayOutput: " + depRunwayOutput);
            depRunwayDirection = new Number(depRunway.direction);
            depRunwayElevation = new Number(depRunway.elevation * 3.28);
            depRunwayLength = new Number((depRunway.length) * 3.28);
        }

        let headwind = "";
        let crosswind = "";
        let crosswindDirection = "";
        let headwindDirection = "";

        if (fmc.takeoffWindDir != "---") {
            headwind = Math.trunc(fmc.takeoffWindSpeed * (Math.cos((depRunwayDirection * Math.PI / 180) - (fmc.takeoffWindDir * Math.PI / 180))));
            crosswind = Math.trunc(fmc.takeoffWindSpeed * (Math.sin((depRunwayDirection * Math.PI / 180) - (fmc.takeoffWindDir * Math.PI / 180))));
            crosswindDirection = crosswind > 0 ? "L"
                : crosswind < 0 ? "R"
                    : "";
            headwindDirection = headwind > 0 ? "H"
                : headwind < 0 ? "T"
                    : "";
            headwind = Math.abs(headwind);
            crosswind = Math.abs(crosswind);
        }

        let depRunwayConditionActive = fmc.depRunwayCondition == 0 ? "DRY[green]/[white]WET[s-text]"
            : "DRY[s-text]/[white]WET[green]";

        //FIND SLOPE - disabled for now
        //let depRunwayNumberOnly = new Number(depRunwayOutput.slice(0,2));
        //let depRunwayOppositeNumber = depRunwayNumberOnly < 19 ? depRunwayNumberOnly + 18
        //    : depRunwayNumberOnly - 18;
        //let depRunwayOppositeMod = "";
        //let depRunwayOppositeDesignator = "";
        //if (depRunwayMod == ("L" || "C" || "R")) {
        //    depRunwayOppositeMod = depRunwayMod == "R" ? "L"
        //        : depRunwayMod == "C" ? "C"
        //        : depRunwayMod == "L" ? "R"
        //        : "";
        //    depRunwayOppositeDesignator = depRunwayOppositeNumber + depRunwayOppositeMod;
        //} else {
        //    depRunwayOppositeDesignator = depRunwayOppositeNumber;
        //}
        //let depRunwayOpposite = origin.infos.oneWayRunways.find(r => { return r.designation.indexOf(depRunwayOppositeDesignator) !== -1; });
        //console.log("Opposite Runway Designator: " + depRunwayOppositeDesignator);
        //console.log("Opposite Runway: " + depRunwayOpposite.designation);
        //console.log("Opposite Runway Elevation: " + (3.28 * depRunwayOpposite.elevation));
        //console.log("Current Runway: " + depRunwayDesignation);
        //console.log("Current Runway Elevation: " + depRunwayElevation);

        fmc.setTemplate([
            [originIdent + "   TAKEOFF REF[color]blue", "1", "3"],
            ["RWY ID[blue]", "WIND[blue]"],
            [depRunwayOutput + "", fmc.takeoffWindDir + "\xB0/" + fmc.takeoffWindSpeed],
            ["RWY WIND[blue]", "OAT[blue]"],
            [headwindDirection + headwind + " " + crosswindDirection + crosswind, fmc.takeoffOat + "\xB0C"],
            ["RWY LENGTH[blue]", "QNH[blue]"],
            [Math.round(depRunwayLength) + " FT", fmc.takeoffQnh + ""],
            ["RWY SLOPE[blue]", "P ALT[blue]"],
            ["0", fmc.takeoffPressAlt + " FT"],
            ["RWY COND[blue]"],
            [depRunwayConditionActive],
            [""],
            [""]
        ]);
        fmc.onRightInput[0] = () => {
            fmc.takeoffWindDir = new Number(fmc.inOut.slice(0, 3));
            fmc.takeoffWindSpeed = new Number(fmc.inOut.slice(4, 7));
            fmc.clearUserInput();
            { CJ4_FMC_TakeoffRefPage.ShowPage1(fmc); };
        }
        fmc.onRightInput[1] = () => {
            fmc.takeoffOat = new Number(fmc.inOut);
            fmc.clearUserInput();
            { CJ4_FMC_TakeoffRefPage.ShowPage1(fmc); };
        }
        fmc.onRightInput[2] = () => {

            let qnh = Number(fmc.inOut);
            if (qnh !== NaN && qnh > 28 && qnh < 34) {
                fmc.takeoffQnh = qnh.toFixed(2);
                fmc.takeoffPressAlt = Number(Math.trunc((((29.92 - fmc.takeoffQnh) * 1000) + depRunwayElevation)));
                fmc.clearUserInput();
            }
            else {
                fmc.showErrorMessage("INVALID");
            }

            CJ4_FMC_TakeoffRefPage.ShowPage1(fmc);
        }
        fmc.onLeftInput[4] = () => {
            if (fmc.depRunwayCondition == 0) {
                fmc.depRunwayCondition = 1;
            } else if (fmc.depRunwayCondition == 1) {
                fmc.depRunwayCondition = 0;
            }
            depRunwayConditionActive = fmc.depRunwayCondition == 0 ? "DRY"
                : "WET";
            fmc.clearUserInput();
            { CJ4_FMC_PerfInitPage.ShowPage6(fmc); };
        }

        fmc.onPrevPage = () => { CJ4_FMC_TakeoffRefPage.ShowPage3(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_TakeoffRefPage.ShowPage2(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage2(fmc) { //TAKEOFF REF Page 2
        fmc.clearDisplay();
        let grWtCell = "";
        let grossWeightValue = new Number(fmc.getWeight());
        if (isFinite(grossWeightValue)) {
            grWtCell = new Number((grossWeightValue * 2200).toFixed(0));
        }
        let tow = (grWtCell - 100);
        let depRunway = "";
        let depRunwayLength = "";
        let selectedRunway = fmc.flightPlanManager.getDepartureRunway();
        if (selectedRunway) {
            depRunway = "RW" + Avionics.Utils.formatRunway(selectedRunway.designation);
            depRunwayLength = new Number((selectedRunway.length) * 3.28);
        }
        let seaLevelDist = new Number((tow - 11000) * .1512) + 1568; //Finds the sea level distance based on weight
        fmc.endTakeoffDist = new Number((((tow - 11000) * .0000126) + .05775) * fmc.takeoffPressAlt) + seaLevelDist; //Finds the distance you would travel further than the sea level value for a given pressure altitude.  That value is then added to the previous line number to get the distance for a given weight and given altitude

        let takeoffWeightTempFactor = ((tow - 11000) * .000556) + 5.22; //Amount of feet per degree based on weight
        let takeoffTempFactor = (((tow - 11000) * .0001702) + 1.04) + takeoffWeightTempFactor; //Amount of feet per degree based on altitude which is then added to the weight factor

        if (tow > 15000 && fmc.takeoffOat > 5 && fmc.takeoffPressAlt > 4000) { //This line is for the exception where you are hot, high, and heavy, the OAT effects really make a big difference hence the 120 feet per degree factor
            fmc.endTakeoffDist = fmc.endTakeoffDist + (fmc.takeoffOat * 50);
        } else {
            if (fmc.takeoffOat > 0) { //Takeoff distance change by temp above 0
                fmc.endTakeoffDist = fmc.endTakeoffDist + (fmc.takeoffOat * takeoffTempFactor);
                console.log("A");
            }
            if (fmc.takeoffOat < 0) { //Takeoff distance change by temp below 0
                fmc.endTakeoffDist = fmc.endTakeoffDist + (fmc.takeoffOat * takeoffTempFactor);
            }
        }

        let v1 = ((tow - 11000) * .00229) + 85; //Sea level V Speeds at 0C for a given weight
        let vR = ((tow - 11000) * .00147) + 92;
        let v2 = ((tow - 11000) * .0009819) + 109;

        v1 = v1 + ((tow - 11000) * .00229);//Vspeed change based on weight
        vR = vR + ((tow - 11000) * .00147);
        v2 = v2 + ((tow - 11000) * .000818);

        v1 = v1 - (fmc.takeoffPressAlt * .000375); // Vspeed changed for pressure altitude
        vR = vR - (fmc.takeoffPressAlt * .000375);
        v2 = v2 - (fmc.takeoffPressAlt * .000625);

        let v1WeightFactorAbove = .055 + ((tow - 11000) * .00002733);  //Changes in V Speeds by temp by weight.  Below 0 degrees, the change is negligible so it's not included
        let vRWeightFactorAbove = .203 - ((tow - 11000) * .00001816);
        let v2WeightFactorAbove = .314 - ((tow - 11000) * .00005139);

        if (fmc.takeoffOat > 0) { //V speed adjustment based on temperature above zero
            v1 = v1 - (fmc.takeoffOat * v1WeightFactorAbove);
            vR = vR - (fmc.takeoffOat * vRWeightFactorAbove);
            v2 = v2 - (fmc.takeoffOat * v2WeightFactorAbove);
        }

        if (fmc.takeoffFlaps == 0) { //If takeoff flaps are set to 0
            fmc.endTakeoffDist = fmc.endTakeoffDist * 1.33;
            v1 = v1 + 9;
            vR = vR + 14;
            v2 = v2 + 14;
        }
        if (vR < v1) { //Ensures VR is never less than V1
            vR = v1 + 1;
        }
        if (fmc.depRunwayCondition == 1) { // If the runway is wet
            fmc.endTakeoffDist = fmc.endTakeoffDist * 1.1;
        }
        if (fmc.takeoffAntiIce == 1) { //If anti-ice is turned on
            fmc.endTakeoffDist = fmc.endTakeoffDist * 1.03;
        }

        let tailWindFactor = (((((tow - 11000) * .00000159) + .00275)) * fmc.takeoffPressAlt) + (((tow - 11000) * .0065) + 60); // Number of feet per 1kt of tailwind to add based on weight and altitude

        if (fmc.takeoffWindDir != "---") {
            let depRunwayDirection = new Number(selectedRunway.direction);
            let headwind = Math.trunc(fmc.takeoffWindSpeed * (Math.cos((depRunwayDirection * Math.PI / 180) - (fmc.takeoffWindDir * Math.PI / 180))));
            if (headwind > 0) {
                fmc.endTakeoffDist = fmc.endTakeoffDist - (headwind * 23);
            } else {
                fmc.endTakeoffDist = fmc.endTakeoffDist - (headwind * tailWindFactor);
            }
        }
        let takeoffFlapsActive = fmc.takeoffFlaps == 15 ? "0[s-text]/[white]15[green]"
            : "0";
        let takeoffAntiIceActive = fmc.takeoffAntiIce == 0 ? "OFF[green]/[white]ON[s-text]"
            : "OFF[s-text]/[white]ON[green]";
        fmc.setTemplate([
            ["TAKEOFF REF[color]blue", "2", "3"],
            ["A/I[blue]", "V[blue]1:[s-text blue] " + v1.toFixed(0).toString().padStart(3, "&nbsp;")],
            [takeoffAntiIceActive],
            ["T/O FLAPS[color]blue", "V[blue]R:[s-text blue] " + vR.toFixed(0).toString().padStart(3, "&nbsp;")],
            [takeoffFlapsActive],
            ["TOW/ GWT/MTOW[color]blue", "V[blue]2:[s-text blue] " + v2.toFixed(0).toString().padStart(3, "&nbsp;")],
            [tow + "/" + grWtCell + "/17110"],
            ["TOFL / " + depRunway + "[color]blue", "V[blue]T:[s-text blue] 140"],
            [fmc.endTakeoffDist.toFixed(0) + " / " + Math.round(depRunwayLength) + " FT"],
            [""],
            [""],
            [""],
            ["", "SEND>"]
        ]);
        fmc.onLeftInput[0] = () => {
            if (fmc.takeoffAntiIce == 0) {
                fmc.takeoffAntiIce = 1;
            } else if (fmc.takeoffAntiIce == 1) {
                fmc.takeoffAntiIce = 0;
            }
            takeoffAntiIceActive = fmc.takeoffAntiIce == 0 ? "OFF"
                : "ON";
            fmc.clearUserInput();
            { CJ4_FMC_TakeoffRefPage.ShowPage2(fmc); };
        }
        fmc.onLeftInput[1] = () => {
            if (fmc.takeoffFlaps == 15) {
                fmc.takeoffFlaps = 0;
            } else if (fmc.takeoffFlaps == 0) {
                fmc.takeoffFlaps = 15;
            }
            takeoffFlapsActive = fmc.takeoffFlaps == 0 ? "15"
                : "0";
            fmc.clearUserInput();
            { CJ4_FMC_TakeoffRefPage.ShowPage2(fmc); };
        }
        fmc.onRightInput[5] = () => {
            SimVar.SetSimVarValue("L:AIRLINER_V1_SPEED", "Knots", v1);
            SimVar.SetSimVarValue("L:AIRLINER_VR_SPEED", "Knots", vR);
            SimVar.SetSimVarValue("L:AIRLINER_V2_SPEED", "Knots", v2);
            //use VX for VT in CJ4
            SimVar.SetSimVarValue("L:AIRLINER_VX_SPEED", "Knots", 140);
            //new LVARS to track whether vSpeed is set by FMS or not, used in PFD Airspeed Indicator to manage color magenta vs cyan
            SimVar.SetSimVarValue("L:WT_CJ4_V1_FMCSET", "Bool", true);
            SimVar.SetSimVarValue("L:WT_CJ4_VR_FMCSET", "Bool", true);
            SimVar.SetSimVarValue("L:WT_CJ4_V2_FMCSET", "Bool", true);
            SimVar.SetSimVarValue("L:WT_CJ4_VT_FMCSET", "Bool", true);
        }
        fmc.onPrevPage = () => { CJ4_FMC_TakeoffRefPage.ShowPage1(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_TakeoffRefPage.ShowPage3(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage3(fmc) { //TAKEOFF REF Page 3
        fmc.clearDisplay();
        let originIdent = "";
        let origin = fmc.flightPlanManager.getOrigin();
        if (origin) {
            originIdent = origin.ident;
        }
        let grWtCell = "";
        let grossWeightValue = fmc.getWeight();
        if (isFinite(grossWeightValue)) {
            grWtCell = (grossWeightValue * 2200).toFixed(0);
        }
        let tow = (grWtCell - 100);
        fmc.setTemplate([
            [originIdent + " TAKEOFF REF[color]blue", "3", "3"],
            ["TOW/MTOW[color]blue"],
            [tow + "/17110"],
            ["", "STRUCTURAL LIMIT[color]blue"],
            ["", "17110"],
            ["", "PERFORMANCE LIMIT[color]blue"],
            ["", "17110"],
            ["", "RUNWAY LENGTH LIMIT[color]blue"],
            ["", "17110"],
            [""],
            [""],
            [""],
            [""]
        ]);
        fmc.onPrevPage = () => { CJ4_FMC_TakeoffRefPage.ShowPage2(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_TakeoffRefPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
}