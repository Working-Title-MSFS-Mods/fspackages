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
            //console.log("depRunwayOutput: " + depRunwayOutput);
            depRunwayDirection = new Number(depRunway.direction);
            depRunwayElevation = new Number(depRunway.elevation * 3.28);
            depRunwayLength = new Number(depRunway.length);
        }

        if (fmc.manualQnh && fmc.manualQnh > 0) {
            fmc.takeoffQnh = fmc.manualQnh;
        }
        else {
            fmc.takeoffQnh = SimVar.GetSimVarValue("KOHLSMAN SETTING HG", "inHg");
        }

        fmc.takeoffPressAlt = Number(Math.trunc((((29.92 - fmc.takeoffQnh) * 1000) + depRunwayElevation)));

        let headwind = "";
        let crosswind = "";
        let crosswindDirection = "";
        let headwindDirection = "---";

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

        const depRunwayLengthText = WT_ConvertUnit.getLength(depRunwayLength).getString(0, " ", "[s-text]");
        const takeoffQnhText = WT_ConvertUnit.isMetric() ? WT_ConvertUnit.getQnh(fmc.takeoffQnh).toFixed(0) : fmc.takeoffQnh.toFixed(2);

        fmc._templateRenderer.setTemplateRaw([
            [originIdent, "1/3[blue] ", "TAKEOFF REF[blue]"],
            [" RWY ID[blue]", "WIND[blue] "],
            [depRunwayOutput + "[s-text]", fmc.takeoffWindDir.toString().padStart(3, "0") + "\xB0/" + fmc.takeoffWindSpeed.toString().padStart(3, " ") + "[s-text]"],
            [" RWY WIND[blue]", "OAT[blue] "],
            [headwindDirection + headwind + " " + crosswindDirection + crosswind + "[s-text]", (fmc.takeoffOat >= 0 ? "+" : "") + fmc.takeoffOat + "\xB0C" + "[s-text]"],
            [" RWY LENGTH[blue]", "QNH[blue] "],
            [depRunwayLengthText, takeoffQnhText + "[s-text]"],
            [" RWY SLOPE[blue]", "P ALT[blue] "],
            ["--.-%[s-text]", fmc.takeoffPressAlt + " FT[s-text]"],
            [" RWY COND[blue]"],
            [depRunwayConditionActive],
            [""],
            [""]
        ]);
        fmc.onRightInput[0] = () => {
            let windIn = fmc.inOut.split("/");
            if (windIn.length == 2 && windIn[0] <= 360 && windIn[0] >= 0 && windIn[1] >= 0) {
                fmc.takeoffWindDir = new Number(windIn[0]);
                fmc.takeoffWindSpeed = new Number(windIn[1]);
                fmc.toVSpeedStatus = CJ4_FMC.VSPEED_STATUS.NONE;
                fmc.clearUserInput();
            }
            else {
                fmc.showErrorMessage("INVALID");
            }
            { CJ4_FMC_TakeoffRefPage.ShowPage1(fmc); }
        };
        fmc.onRightInput[1] = () => {
            let tempIn = fmc.inOut;
            if (tempIn && isNaN(tempIn) || tempIn < -54 || tempIn > 54) {
                fmc.showErrorMessage("INVALID");
            }
            else if (tempIn) {
                fmc.takeoffOat = tempIn;
            }
            else {
                fmc.showErrorMessage("INVALID");
            }
            fmc.clearUserInput();
            { CJ4_FMC_TakeoffRefPage.ShowPage1(fmc); }
        };
        fmc.onRightInput[2] = () => {
            let qnhInput = Number(fmc.inOut);
            if (!isNaN(qnhInput)) {
                if (qnhInput > 28 && qnhInput < 32) {
                    fmc.takeoffQnh = qnhInput;
                    fmc.manualQnh = fmc.takeoffQnh;
                }
                else if (qnhInput > 280 && qnhInput < 320) {
                    fmc.takeoffQnh = qnhInput / 10;
                    fmc.manualQnh = fmc.takeoffQnh;
                }
                else if (qnhInput > 2800 && qnhInput < 3200) {
                    fmc.takeoffQnh = qnhInput / 100;
                    fmc.manualQnh = fmc.takeoffQnh;
                }
                else if (qnhInput > 940 && qnhInput < 1090) { //parse hPA input
                    fmc.takeoffQnh = qnhInput / 33.864;
                    fmc.manualQnh = fmc.takeoffQnh;
                }
                else {
                    fmc.showErrorMessage("INVALID");
                }
            }
            else {
                fmc.showErrorMessage("INVALID");
            }
            fmc.toVSpeedStatus = CJ4_FMC.VSPEED_STATUS.NONE;
            fmc.clearUserInput();
            CJ4_FMC_TakeoffRefPage.ShowPage1(fmc, fmc.takeoffQnh); //added ability to keep manually set QNH by passing var
        };

        fmc.onLeftInput[4] = () => {
            if (fmc.depRunwayCondition == 0) {
                fmc.depRunwayCondition = 1;
            } else if (fmc.depRunwayCondition == 1) {
                fmc.depRunwayCondition = 0;
            }
            depRunwayConditionActive = fmc.depRunwayCondition == 0 ? "DRY"
                : "WET";
            fmc.toVSpeedStatus = CJ4_FMC.VSPEED_STATUS.NONE;
            fmc.clearUserInput();
            { CJ4_FMC_TakeoffRefPage.ShowPage1(fmc); }
        };

        fmc.onPrevPage = () => { CJ4_FMC_TakeoffRefPage.ShowPage3(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_TakeoffRefPage.ShowPage2(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage2(fmc) { //TAKEOFF REF Page 2
        fmc.clearDisplay();
        let originIdent = "";
        let origin = fmc.flightPlanManager.getOrigin();
        if (origin) {
            originIdent = origin.ident;
        }
        let tow = (fmc.grossWeight - 100);
        let mtow = 17110;
        let vT = 140;
        let sendVS = "SEND>"
        let depRunway = "";
        let depRunwayLength = null;
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

        if (fmc.takeoffWindDir != "---" && selectedRunway) {
            let depRunwayDirection = new Number(selectedRunway.direction);
            let headwind = Math.trunc(fmc.takeoffWindSpeed * (Math.cos((depRunwayDirection * Math.PI / 180) - (fmc.takeoffWindDir * Math.PI / 180))));
            if (headwind > 0) {
                fmc.endTakeoffDist = fmc.endTakeoffDist - (headwind * 23);
            } else {
                fmc.endTakeoffDist = fmc.endTakeoffDist - (headwind * tailWindFactor);
            }
        }
        let takeoffFlapsActive = fmc.takeoffFlaps == 15 ? "0[s-text]/[white]15[green]"
            : "0[green]/[white]15[s-text]";
        let takeoffAntiIceActive = fmc.takeoffAntiIce == 0 ? "OFF[green]/[white]ON[s-text]"
            : "OFF[s-text]/[white]ON[green]";

        let vspeedSendMsg = "";
        if (fmc.toVSpeedStatus === CJ4_FMC.VSPEED_STATUS.INPROGRESS)
            vspeedSendMsg = "IN PROGRESS";
        else if (fmc.toVSpeedStatus === CJ4_FMC.VSPEED_STATUS.SENT)
            vspeedSendMsg = "COMPLETE";

        let vspeedColor = "";
        if (fmc.toVSpeedStatus === CJ4_FMC.VSPEED_STATUS.SENT)
            vspeedColor = "blue";

        if (!fmc.flightPlanManager.getDepartureRunway() || fmc.takeoffOat === "□□□") {
            fmc.endTakeoffDist = null;
            v1 = null;
            vR = null;
            v2 = null;
            vT = null;
            sendVS = "";
        }

        function formatNumber(num, pad = 3) {
            return ((num === null || isNaN(num) || num === undefined) ? "" : num.toFixed(0)).padStart(pad, " ");
        }

        const towText = formatNumber(WT_ConvertUnit.getWeight(tow).Value, 4) + (tow > 17110 ? "[yellow]" : "");
        const grossWeightText = formatNumber(WT_ConvertUnit.getWeight(fmc.grossWeight).Value, 4);
        const mtowText = formatNumber(WT_ConvertUnit.getWeight(mtow).Value, 4);
        const takeoffDistText = formatNumber(WT_ConvertUnit.getLength(fmc.endTakeoffDist / 3.28).Value, 4);
        const depRunwayLengthText = WT_ConvertUnit.getLength(depRunwayLength / 3.28).getString(0, " ", "[s-text]");

        fmc._templateRenderer.setTemplateRaw([
            [originIdent, "2/3[blue] ", "TAKEOFF REF[blue]"],
            [" A/I[blue]", "V[d-text blue]1:[s-text blue] " + formatNumber(v1) + "[s-text " + vspeedColor + "]"],
            [takeoffAntiIceActive],
            [" T/O FLAPS[blue]", "V[d-text blue]R:[s-text blue] " + formatNumber(vR) + "[s-text " + vspeedColor + "]"],
            [takeoffFlapsActive],
            [" TOW/GWT/MTOW[blue]", "V[d-text blue]2:[s-text blue] " + formatNumber(v2) + "[s-text " + vspeedColor + "]"],
            [towText + "/" + grossWeightText + "/" + mtowText + "[s-text]"],
            [" TOFL/ " + depRunway + "[blue]", "V[d-text blue]T:[s-text blue] " + formatNumber(vT) + "[s-text " + vspeedColor + "]"],
            [takeoffDistText + " / " + depRunwayLengthText],
            [""],
            [""],
            ["", vspeedSendMsg + " [s-text]"],
            ["", sendVS + "[s-text]"]
        ]);
        fmc.onLeftInput[0] = () => {
            if (fmc.takeoffAntiIce == 0) {
                fmc.takeoffAntiIce = 1;
            } else if (fmc.takeoffAntiIce == 1) {
                fmc.takeoffAntiIce = 0;
            }
            takeoffAntiIceActive = fmc.takeoffAntiIce == 0 ? "OFF[green]/[white]ON[s-text]"
                : "OFF[s-text]/[white]ON[green]";
            fmc.clearUserInput();
            { CJ4_FMC_TakeoffRefPage.ShowPage2(fmc); }
        };
        fmc.onLeftInput[1] = () => {
            if (fmc.takeoffFlaps == 15) {
                fmc.takeoffFlaps = 0;
            } else if (fmc.takeoffFlaps == 0) {
                fmc.takeoffFlaps = 15;
            }
            takeoffFlapsActive = fmc.takeoffFlaps == 0 ? "15"
                : "0";
            fmc.clearUserInput();
            { CJ4_FMC_TakeoffRefPage.ShowPage2(fmc); }
        };

        if (fmc.toVSpeedStatus !== CJ4_FMC.VSPEED_STATUS.INPROGRESS) {
            fmc.onRightInput[5] = () => {
                fmc.toVSpeedStatus = CJ4_FMC.VSPEED_STATUS.INPROGRESS;
                setTimeout(() => {
                    //added custom LVARS for all v speeds and FMC Set
                    SimVar.SetSimVarValue("L:WT_CJ4_V1_SPEED", "Knots", Math.round(v1));
                    SimVar.SetSimVarValue("L:WT_CJ4_V1_FMCSET", "Bool", true);
                }, 500);
                setTimeout(() => {
                    SimVar.SetSimVarValue("L:WT_CJ4_VR_SPEED", "Knots", Math.round(vR));
                    SimVar.SetSimVarValue("L:WT_CJ4_VR_FMCSET", "Bool", true);
                }, 1000);
                setTimeout(() => {
                    SimVar.SetSimVarValue("L:WT_CJ4_V2_SPEED", "Knots", Math.round(v2));
                    SimVar.SetSimVarValue("L:WT_CJ4_V2_FMCSET", "Bool", true);
                }, 1500);
                setTimeout(() => {
                    SimVar.SetSimVarValue("L:WT_CJ4_VT_SPEED", "Knots", 140);
                    SimVar.SetSimVarValue("L:WT_CJ4_VT_FMCSET", "Bool", true);
                    fmc.toVSpeedStatus = CJ4_FMC.VSPEED_STATUS.SENT;
                    CJ4_FMC_TakeoffRefPage.ShowPage2(fmc);
                }, 2000);
            };
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
        let tow = (fmc.grossWeight - 100);
        const towText = WT_ConvertUnit.getWeight(tow, "", "").getString(0, "") + (tow > 17110 ? "[yellow]" : "");
        const mtowText = WT_ConvertUnit.isMetric() ? "7761" : "17110";

        fmc._templateRenderer.setTemplateRaw([
            [originIdent, "3/3[blue] ", "TAKEOFF REF[blue]"],
            ["TOW/MTOW[blue]"],
            [towText + "/" + mtowText + "[s-text]"],
            ["", "STRUCTURAL LIMIT[blue]"],
            ["", mtowText + "[s-text]"],
            ["", "PERFORMANCE LIMIT[blue]"],
            ["", mtowText + "[s-text]"],
            ["", "RUNWAY LENGTH LIMIT[blue]"],
            ["", mtowText + "[s-text]"],
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