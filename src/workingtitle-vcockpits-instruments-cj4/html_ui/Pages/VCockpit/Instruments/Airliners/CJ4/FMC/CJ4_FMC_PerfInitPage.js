class CJ4_FMC_PerfInitPage {
    static ShowPage1(fmc) {
        fmc.clearDisplay();
        const advSwitch = fmc._templateRenderer.renderSwitch(["ENABLE", "DISABLE"], 1);
        fmc._templateRenderer.setTemplateRaw([
            ["", "", "PERF MENU[blue]"],
            [""],
            ["<PERF INIT", "FUEL MGMT>"],
            [""],
            ["<VNAV SETUP[disabled]", "FLT LOG>"], //Page 3, 4, 5 ----12
            [""],
            ["<TAKEOFF", "APPROACH>"], //Page 6, 7, 8 ---13, 14, 15
            [""],
            [""],
            [" ADVISORY VNAV[blue]"],
            [advSwitch],
            [" VNAV PLAN SPD[blue]"],
            ["        --- KT[s-text white]"]
        ]);
        fmc.onLeftInput[0] = () => { CJ4_FMC_PerfInitPage.ShowPage2(fmc); };
        fmc.onLeftInput[1] = () => { CJ4_FMC_PerfInitPage.ShowPage3(fmc); };
        fmc.onLeftInput[2] = () => { CJ4_FMC_TakeoffRefPage.ShowPage1(fmc); };
        fmc.onRightInput[0] = () => { CJ4_FMC_FuelMgmtPage.ShowPage1(fmc); };
        fmc.onRightInput[1] = () => { CJ4_FMC_PerfInitPage.ShowPage12(fmc); };
        fmc.onRightInput[2] = () => { CJ4_FMC_ApproachRefPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage2(fmc) { //PERF INIT
        fmc.clearDisplay();
		
        let crzAltCell = "□□□□□";
		let zFW = 0;
		let paxNumber = "/170[d-text]LB[s-text]";
		let bow = 10280;
        if (fmc.cruiseFlightLevel) {
            crzAltCell = fmc.cruiseFlightLevel;
        }
        fmc.onRightInput[0] = () => {
            let value = fmc.inOut;
            fmc.clearUserInput();
            if (fmc.setCruiseFlightLevelAndTemperature(value)) {
                CJ4_FMC_PerfInitPage.ShowPage2(fmc);
            }
        };
        let fuelQuantityLeft = Math.trunc(6.7 * SimVar.GetSimVarValue("FUEL LEFT QUANTITY", "Gallons"));
        let fuelQuantityRight = Math.trunc(6.7 * SimVar.GetSimVarValue("FUEL RIGHT QUANTITY", "Gallons"));
        let fuelQuantityTotal = fuelQuantityRight + fuelQuantityLeft;
        let fuelCell = Math.trunc(fuelQuantityTotal);

		if (fmc.zFWActive == 1) {
			zFW = fmc.zFWPilotInput;
			bow = "-----";
			fmc.paxNumber = "--";
			paxNumber = "--";
			fmc.cargoWeight = "----";
		} else {
			zFW = 10280 + (fmc.paxNumber * 170) + fmc.cargoWeight;
		}
		fmc.grossWeight = zFW + fuelCell;
		
		if (zFW > 12500) {
			zFW = zFW + "[yellow]";
		}
		
		

        fmc._templateRenderer.setTemplateRaw([
            [" ACT PERF INIT[blue]","",""],
            [" BOW[blue]", "CRZ ALT[blue] "],
            [bow + "[d-text]LB[s-text]", "FL" + crzAltCell],
            [" PASS/WT[blue]"],
            [" " + fmc.paxNumber + paxNumber],
            [" CARGO[blue]", "= ZFW[blue] "],
            [" " + fmc.cargoWeight + "[d-text] LB[s-text]", zFW + " LB[s-text]"],
            [" SENSED FUEL[blue]", "= GWT[blue] "],
            [" " + fuelCell + "[d-text] LB[s-text]", fmc.grossWeight + " LB[s-text]"],
            ["------------------------[blue]"],
            ["", "TAKEOFF>"],
            ["", ""],
            ["", "VNAV SETUP>"]
        ]);
        fmc.onLeftInput[1] = () => {
            fmc.paxNumber = fmc.inOut;
            zFW = ((fmc.inOut * 170) + fmc.cargoWeight + fmc.basicOperatingWeight) / 2200;
            fmc.clearUserInput();
            { CJ4_FMC_PerfInitPage.ShowPage2(fmc); }
        };
        fmc.onLeftInput[2] = () => {
            fmc.cargoWeight = parseInt(fmc.inOut); //ParseInt changes from string to number
            zFW = (fmc.cargoWeight + (fmc.paxNumber * 170) + fmc.basicOperatingWeight) / 2200;
            fmc.clearUserInput();
            { CJ4_FMC_PerfInitPage.ShowPage2(fmc); }
        };
		fmc.onRightInput[2] = () => {
			if (fmc.inOut == FMCMainDisplay.clrValue){
				fmc.zFWActive = 0;
				fmc.paxNumber = 0;
				fmc.cargoWeight = 0;
			} else {
            zFW = parseInt(fmc.inOut);
			fmc.zFWPilotInput = parseInt(fmc.inOut);
			fmc.zFWActive = 1;
			}
			fmc.clearUserInput();
            CJ4_FMC_PerfInitPage.ShowPage2(fmc);
        };
        fmc.onRightInput[4] = () => { CJ4_FMC_TakeoffRefPage.ShowPage1(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage3(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage3(fmc) { //VNAV SETUP Page 1
        fmc.clearDisplay();
        fmc._templateRenderer.setTemplateRaw([
            [" ACT VNAV CLIMB[blue]", "1/3[blue]"],
            [" TGT SPEED[blue]", "TRANS ALT [blue]"],
            ["240/.64", "18000"],
            [" SPD/ALT LIMIT[blue]"],
            ["250/10000"],
            [""],
            ["---/-----"],
            [""],
            [""],
            [""],
            [""],
            ["-----------------------[blue]"],
            ["", "PERF INIT>"]
        ]);
        fmc.onPrevPage = () => { CJ4_FMC_PerfInitPage.ShowPage5(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_PerfInitPage.ShowPage4(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage2(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage4(fmc) { //VNAV SETUP Page 2
        fmc.clearDisplay();
        fmc._templateRenderer.setTemplateRaw([
            [" ACT VNAV CRUISE[blue]", "2/3[blue]"],
            [" TGT SPEED[blue]", "CRZ ALT [blue]"],
            ["300/.74", "crzAltCell"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["-----------------------[blue]"],
            ["", "PERF INIT>"]
        ]);
        fmc.onPrevPage = () => { CJ4_FMC_PerfInitPage.ShowPage3(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_PerfInitPage.ShowPage5(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage2(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage5(fmc) { //VNAV SETUP Page 3
        fmc.clearDisplay();

        let vnavDescentIas = WTDataStore.get('CJ4_vnavDescentIas', 290);
        let vnavDescentMach = WTDataStore.get('CJ4_vnavDescentMach', 0.74);
        let vpa = WTDataStore.get('CJ4_vpa', 3);
        let arrivalSpeedLimit = WTDataStore.get('CJ4_arrivalSpeedLimit', 250);
        let arrivalSpeedLimitAltitude = WTDataStore.get('CJ4_arrivalSpeedLimitAltitude', 10000);
        let arrivalTransitionFl = WTDataStore.get('CJ4_arrivalTransitionFl', 180);

        fmc._templateRenderer.setTemplateRaw([
            [" ACT VNAV DESCENT[blue]", "3/3[blue]"],
            [" TGT SPEED[blue]", "TRANS FL [blue]"],
            [vnavDescentMach + "/" + vnavDescentIas, "FL" + arrivalTransitionFl],
            [" SPD/ALT LIMIT[blue]"],
            [arrivalSpeedLimit + "/" + arrivalSpeedLimitAltitude],
            ["", "VPA [blue]"],
            ["---/-----", vpa + "\xB0"],
            [""],
            ["<VNAV WPTS", "VNAV MONITOR>"],
            [""],
            [""],
            ["-----------------------[blue]"],
            ["<DESC INFO", "PERF INIT>"]
        ]);
        fmc.onPrevPage = () => { CJ4_FMC_PerfInitPage.ShowPage4(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_PerfInitPage.ShowPage3(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage2(fmc); };

        fmc.onLeftInput[0] = () => {
            let value = fmc.inOut.split("/");
            value[0] = parseFloat(value[0]).toPrecision(2);
            value[1] = parseInt(value[1]);
            if (value.length == 2 && value[0] >= 0.4 && value[0] <= 0.77 && value[1] >= 110 && value[1] <= 305) {
                vnavDescentMach = value[0];
                vnavDescentIas = value[1];
                WTDataStore.set('CJ4_vnavDescentMach', vnavDescentMach);
                WTDataStore.set('CJ4_vnavDescentIas', vnavDescentIas);
            }
            else {
                fmc.showErrorMessage("INVALID");
            }
            fmc.clearUserInput();
            CJ4_FMC_PerfInitPage.ShowPage2(fmc);
        };

        fmc.onLeftInput[1] = () => {
            let value = fmc.inOut.split("/");
            value[0] = parseInt(value[0]);
            value[1] = parseInt(value[1]);
            if (value.length == 2 && value[0] > 0 && value[0] <= 305 && value[1] >= 0 && value[1] <= 45000) {
                arrivalSpeedLimit = value[0];
                arrivalSpeedLimitAltitude = value[1];
                WTDataStore.set('CJ4_arrivalSpeedLimit', arrivalSpeedLimit);
                WTDataStore.set('CJ4_arrivalSpeedLimitAltitude', arrivalSpeedLimitAltitude);
            }
            else {
                fmc.showErrorMessage("INVALID");
            }
            fmc.clearUserInput();
            CJ4_FMC_PerfInitPage.ShowPage2(fmc);
        };

        fmc.onRightInput[0] = () => {
            let value = parseInt(fmc.inOut);
            if (value >= 0 && value <= 450) {
                arrivalTransitionFl = value;
                WTDataStore.set('CJ4_arrivalTransitionFl', arrivalTransitionFl);
            }
            else {
                fmc.showErrorMessage("INVALID");
            }
            fmc.clearUserInput();
            CJ4_FMC_PerfInitPage.ShowPage2(fmc);
        };

        fmc.onRightInput[2] = () => {
            let value = parseFloat(fmc.inOut).toPrecision(2);
            if (value > 0 && value <= 6) {
                vpa = value;
                WTDataStore.set('CJ4_vpa', vpa);
            }
            else {
                fmc.showErrorMessage("INVALID");
            }
            fmc.clearUserInput();
            CJ4_FMC_PerfInitPage.ShowPage2(fmc);
        };

        fmc.onRightInput[3] = () => {
            CJ4_FMC_PerfInitPage.ShowPage7(fmc);
        };

        fmc.onLeftInput[3] = () => {
            CJ4_FMC_PerfInitPage.ShowPage6(fmc);
        };

        
        fmc.updateSideButtonActiveStatus();
    }

    static ShowPage12(fmc) { //FLIGHT LOG
        fmc.clearDisplay();

        // Set takeoff time
        let toTime = "---";
        const takeOffTime = SimVar.GetSimVarValue("L:TAKEOFF_TIME", "seconds");
        if(takeOffTime && takeOffTime > 0){
            const hours = Math.floor(takeOffTime / 60 / 60);
            const hoursString = hours > 9 ? "" + hours : "0" + hours;

            const minutes = Math.floor(takeOffTime / 60) - (hours * 60);
            const minutesString = minutes > 9 ? "" + minutes : "0" + minutes;
            toTime = hoursString + ":" + minutesString;
        }

        // Set landing time
        let ldgTime = "---";
        const landingTime = SimVar.GetSimVarValue("L:LANDING_TIME", "seconds");
        if(landingTime && landingTime > 0){
            const hours = Math.floor(landingTime / 60 / 60);
            const hoursString = hours > 9 ? "" + hours : "0" + hours;

            const minutes = Math.floor(landingTime / 60) - (hours * 60);
            const minutesString = minutes > 9 ? "" + minutes : "0" + minutes;
            ldgTime = hoursString + ":" + minutesString;
        }

        // Set enroute time
        let eteTime = "---";
        const enrouteTime = SimVar.GetSimVarValue("L:ENROUTE_TIME", "seconds");
        if(enrouteTime && enrouteTime > 0){
            const hours = Math.floor(enrouteTime / 60 / 60);
            const hoursString = hours > 9 ? "" + hours : "0" + hours;

            const minutes = Math.floor(enrouteTime / 60) - (hours * 60);
            const minutesString = minutes > 9 ? "" + minutes : "0" + minutes;
            eteTime = hoursString + ":" + minutesString;
        }

        let fuelUsed = "---";
        let avgTas = "---";
        let avgGs = "---";
        let airDis = "---";
        let gndDis = "---";
        fmc._templateRenderer.setTemplateRaw([
            ["", "", "FLIGHT LOG[blue]"],
            [" T/O[s-text blue]", "LDG [s-text blue]", "EN ROUTE[s-text blue]"],
            [toTime, ldgTime, eteTime],
            [" FUEL USED[blue]", "AVG TAS/GS [blue]"],
            [fuelUsed, avgTas + "/" + avgGs],
            [" AIR DIST[blue]", "GND DIST [blue]"],
            [airDis, gndDis],
            ["     NM[s-text]", "NM[s-text]"],
            [""],
            [""],
            [""],
            ["-------------------------[blue]"],
            ["", "PERF MENU>"]
        ]);
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }

    static ShowPage6(fmc) { //VNAV WPTS
        fmc.clearDisplay();

        let waypoints = [];
        let rows = [
            [""], [""], [""], [""], [""], [""], [""], [""], [""]
        ];

        //FETCH WAYPOINTS WITH CONSTRAINTS
        if (fmc.flightPlanManager.getWaypointsWithAltitudeConstraints()) {
            waypoints = fmc.flightPlanManager.getWaypointsWithAltitudeConstraints();
            console.log("waypoints.length: " + waypoints.length);
            if (waypoints.length > 0) {
                console.log("waypoints.length > 0");
                for (let i = 0; i < 9; i++) {
                    let wpt = waypoints[i];
                    let waypointIdent = wpt.ident;
                    let type = "none";
                    let altitudeConstraint = "none";
                    if (wpt && wpt.legAltitudeDescription && wpt.legAltitudeDescription > 0) {
                        if (wpt.legAltitudeDescription == 1 && wpt.legAltitude1 > 100) {
                            altitudeConstraint = wpt.legAltitude1.toFixed(0) >= 18000 ? "FL" + wpt.legAltitude1.toFixed(0) / 100
                                : wpt.legAltitude1.toFixed(0);
                            type = "AT"
                        }
                        else if (wpt.legAltitudeDescription == 2 && wpt.legAltitude1 > 100) {
                            altitudeConstraint = wpt.legAltitude1.toFixed(0) >= 18000 ? "FL" + wpt.legAltitude1.toFixed(0) / 100 + "A"
                                : wpt.legAltitude1.toFixed(0) + "A";
                            type = "ABOVE"
                        }
                        else if (wpt.legAltitudeDescription == 3 && wpt.legAltitude1 > 100) {
                            altitudeConstraint = wpt.legAltitude1.toFixed(0) >= 18000 ? "FL" + wpt.legAltitude1.toFixed(0) / 100 + "B"
                                : wpt.legAltitude1.toFixed(0) + "B";
                            type = "BELOW"
                            }
                        else if (wpt.legAltitudeDescription == 4 && wpt.legAltitude2 > 100 && wpt.legAltitude1 > 100) {
                            let altitudeConstraintA = wpt.legAltitude2.toFixed(0) >= 18000 ? "FL" + wpt.legAltitude2.toFixed(0) / 100 + "A"
                                : wpt.legAltitude2.toFixed(0) + "A";
                            let altitudeConstraintB = wpt.legAltitude1.toFixed(0) >= 18000 ? "FL" + wpt.legAltitude1.toFixed(0) / 100 + "B"
                                : wpt.legAltitude1.toFixed(0) + "B";
                            altitudeConstraint = altitudeConstraintB + altitudeConstraintA;
                            type = "BOTH"
                        }
                        altitudeConstraint = altitudeConstraint.padStart(6, " ");
                    }
                rows[i] = [waypointIdent + "[s-text]", altitudeConstraint + "[s-text]", type + "[s-text]"];
                }
            }
        }

        fmc._templateRenderer.setTemplateRaw([
            [" VNAV WAYPOINTS[blue]", "1/1[blue]"],
            [" WAYPOINT[blue]", "CONSTRAINT [blue]", "TYPE[blue]"],
            ...rows,
            ["-----------------------[blue]"],
            ["", "VNAV DESCENT>"]
        ]);
        //fmc.onPrevPage = () => { CJ4_FMC_PerfInitPage.ShowPage3(fmc); };
        //fmc.onNextPage = () => { CJ4_FMC_PerfInitPage.ShowPage5(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage5(fmc); };
        fmc.updateSideButtonActiveStatus();
    }

    static ShowPage7(fmc) { //VNAV MONITOR
        fmc.clearDisplay();

        fmc.registerPeriodicPageRefresh(() => {
            let waypoints = [];

            //let currWindDirection = Math.trunc(SimVar.GetSimVarValue("AMBIENT WIND DIRECTION", "degrees"));
            //let currWindSpeed = Math.trunc(SimVar.GetSimVarValue("AMBIENT WIND VELOCITY", "knots"));
            let currPos = new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"));
            let groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
            //let fromWaypoint = fmc.flightPlanManager.getPreviousActiveWaypoint();
            let toWaypoint = fmc.flightPlanManager.getActiveWaypoint();
            //let apCurrentHeading = SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK DIR", "Degrees");	
            //let currTrack = SimVar.GetSimVarValue("GPS GROUND MAGNETIC TRACK", "degrees");
            //let xtk = SimVar.GetSimVarValue("GPS WP CROSS TRK", "meters") * (0.000539957); //meters to NM conversion
            //let dtk = toWaypoint.bearingInFP.toFixed(0);
            //let distanceToWaypoint = Avionics.Utils.computeDistance(currPos, toWaypoint.infos.coordinates);
            //let bearingToWaypoint = Avionics.Utils.computeGreatCircleHeading(currPos, toWaypoint.infos.coordinates);
            //let currCrosswind = Math.trunc(currWindSpeed * (Math.sin((track * Math.PI / 180) - (currWindDirection * Math.PI / 180))));
            let apCurrentAltitude = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR", "Feet");
            let apCurrentVerticalSpeed = SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR", "Feet/minute");
            let altitude = SimVar.GetSimVarValue("PLANE ALTITUDE", "Feet");
            let destination = undefined;
                    
            //let activeWaypointTargetAltitude = undefined;
            //let activeWaypointDistance = fmc.flightPlanManager.getDistanceToActiveWaypoint();
            let desiredFPA = WTDataStore.get('CJ4_vpa', 3);

            //let windCorrection = 180 * Math.asin(currCrosswind / groundSpeed) / Math.PI;
            //previous waypoint data
            if (fmc.flightPlanManager.getPreviousActiveWaypoint()) {
                let prevWaypoint = fmc.flightPlanManager.getPreviousActiveWaypoint();
                prevWaypointIdent = new String(fmc.flightPlanManager.getPreviousActiveWaypoint().ident);
                prevWaypointDist = new Number(Avionics.Utils.computeDistance(currPos, prevWaypoint.infos.coordinates));
            }

            //current active waypoint data
            if (fmc.flightPlanManager.getActiveWaypoint()) {
                let activeWaypoint = fmc.flightPlanManager.getActiveWaypoint();
                activeWaypointIdent = new String(fmc.flightPlanManager.getActiveWaypoint().ident);
                activeWaypointDist = new Number(fmc.flightPlanManager.getDistanceToActiveWaypoint());
                //activeWaypointEte = groundSpeed < 50 ? new String("-:--")
                //    : new Date(fmc.flightPlanManager.getETEToActiveWaypoint() * 1000).toISOString().substr(11, 5);
            }

            //next waypoint data
            if (fmc.flightPlanManager.getNextActiveWaypoint()) {
                let nextWaypoint = fmc.flightPlanManager.getNextActiveWaypoint();
                nextWaypointIdent = new String(fmc.flightPlanManager.getNextActiveWaypoint().ident);
                nextWaypointDist = new Number(activeWaypointDist + Avionics.Utils.computeDistance(fmc.flightPlanManager.getActiveWaypoint().infos.coordinates, nextWaypoint.infos.coordinates));
                //nextWaypointEte = groundSpeed < 50 ? new String("-:--")
                //    : new Date(this.calcETEseconds(nextWaypointDist, groundSpeed) * 1000).toISOString().substr(11, 5);
            }

            //destination data
            if (fmc.flightPlanManager.getDestination()) {
                destination = fmc.flightPlanManager.getDestination();
                destinationIdent = new String(fmc.flightPlanManager.getDestination().ident);
                let destinationDistanceDirect = Avionics.Utils.computeDistance(currPos, destination.infos.coordinates);
                let destinationDistanceFlightplan = 0;
                destinationDistance = destinationDistanceDirect;
                if (activeWaypoint) {
                    destinationDistanceFlightplan = new Number(destination.cumulativeDistanceInFP - activeWaypoint.cumulativeDistanceInFP + activeWaypointDist);
                }
                else {
                    destinationDistanceFlightplan = destination.cumulativeDistanceInFP;
                }
                destinationDistance = destinationDistanceDirect > destinationDistanceFlightplan ? destinationDistanceDirect
                    : destinationDistanceFlightplan;
            }

            //let setHeading = dtk;
            //let vsDeviation = desiredVerticalSpeed < 0 ? desiredVerticalSpeed - apCurrentVerticalSpeed
            //    :desiredVerticalSpeed > 0 ? apCurrentVerticalSpeed - desiredVerticalSpeed
            //    :apCurrentVerticalSpeed;
            
            let vnavTargetDistance = undefined;
            let vnavTargetAltitude = undefined;
            let topOfDescent = undefined;

            //FETCH WAYPOINTS WITH CONSTRAINTS
            if (fmc.flightPlanManager.getWaypointsWithAltitudeConstraints()) {
                waypoints = fmc.flightPlanManager.getWaypointsWithAltitudeConstraints();
            }

            //IF THERE ARE NO CONSTRAINTS
            if (destination) {
                console.log("destination");
                let runways = destination.infos.oneWayRunways;
                let destinationElevation = runways[0].elevation * 3.28;
                vnavTargetAltitude = destinationElevation + 1500;
                topOfDescent = 10 + ((altitude - destinationElevation + 1500) / (Math.tan(desiredFPA * (Math.PI / 180)))) / 6076.12;
                vnavTargetDistance = destinationDistance - 10;
            }

            //IF THERE ARE CONSTRAINTS
            if (waypoints.length > 0 && destination) {
                console.log("waypoints.length > 0");
                for (let i = waypoints.length - 1; i >= 0; i--) {
                    let waypoint = waypoints[i];
                    let legAltitudeDescription = waypoint.legAltitudeDescription
                    if (legAltitudeDescription == 1) { //AT CASE
                        vnavTargetAltitude = waypoint.legAltitude1;
                        vnavTargetDistance = waypoint == activeWaypoint ? activeWaypointDist
                            : waypoint.cumulativeDistanceInFP - activeWaypoint.cumulativeDistanceInFP + activeWaypointDist;
                        topOfDescent = ((altitude - vnavTargetAltitude) / (Math.tan(desiredFPA * (Math.PI / 180)))) / 6076.12;
                        vnavTargetWaypoint = waypoint;
                    }
                    else if (legAltitudeDescription == 2) { //ABOVE CASE
                        let distanceFromVnavTargetWaypoint = vnavTargetWaypoint.cumulativeDistanceInFP - waypoint.cumulativeDistanceInFP;
                        let vnavTargetAltitudeAtWaypoint = vnavTargetAltitude + (6076.12 * distanceFromVnavTargetWaypoint * (Math.tan(desiredFPA * (Math.PI / 180))));
                        if (vnavTargetAltitudeAtWaypoint < waypoint.legAltitude1) {
                            vnavTargetAltitude = waypoint.legAltitude1;
                            vnavTargetDistance = vnavTargetDistance - distanceFromVnavTargetWaypoint;
                            topOfDescent = ((altitude - vnavTargetAltitude) / (Math.tan(desiredFPA * (Math.PI / 180)))) / 6076.12;
                            vnavTargetWaypoint = waypoint;
                        }
                    }
                    else if (legAltitudeDescription == 3) { //BELOW CASE
                        let distanceFromVnavTargetWaypoint = vnavTargetWaypoint.cumulativeDistanceInFP - waypoint.cumulativeDistanceInFP;
                        let vnavTargetAltitudeAtWaypoint = vnavTargetAltitude + (6076.12 * distanceFromVnavTargetWaypoint * (Math.tan(desiredFPA * (Math.PI / 180))));
                        if (vnavTargetAltitudeAtWaypoint > waypoint.legAltitude1) {
                            vnavTargetAltitude = waypoint.legAltitude1;
                            vnavTargetDistance = vnavTargetDistance - distanceFromVnavTargetWaypoint;
                            topOfDescent = ((altitude - vnavTargetAltitude) / (Math.tan(desiredFPA * (Math.PI / 180)))) / 6076.12;
                            vnavTargetWaypoint = waypoint;
                        }
                    }
                    else if (legAltitudeDescription == 4) { //ABOVE AND BELOW CASE
                        let distanceFromVnavTargetWaypoint = vnavTargetWaypoint.cumulativeDistanceInFP - waypoint.cumulativeDistanceInFP;
                        let vnavTargetAltitudeAtWaypoint = vnavTargetAltitude + (6076.12 * distanceFromVnavTargetWaypoint * (Math.tan(desiredFPA * (Math.PI / 180))));
                        if (vnavTargetAltitudeAtWaypoint > waypoint.legAltitude1) {
                            vnavTargetAltitude = waypoint.legAltitude1;
                            vnavTargetDistance = vnavTargetDistance - distanceFromVnavTargetWaypoint;
                            topOfDescent = ((altitude - vnavTargetAltitude) / (Math.tan(desiredFPA * (Math.PI / 180)))) / 6076.12;
                            vnavTargetWaypoint = waypoint;
                        }
                        else if (vnavTargetAltitudeAtWaypoint < waypoint.legAltitude2) {
                            vnavTargetAltitude = waypoint.legAltitude2;
                            vnavTargetDistance = vnavTargetDistance - distanceFromVnavTargetWaypoint;
                            topOfDescent = ((altitude - vnavTargetAltitude) / (Math.tan(desiredFPA * (Math.PI / 180)))) / 6076.12;
                            vnavTargetWaypoint = waypoint;
                        }
                    }
                    i--;
                }
            }

            //PREPARE VNAV VARIABLES
            let desiredVerticalSpeed = -101.2686667 * groundSpeed * Math.tan(desiredFPA * (Math.PI / 180));
            let desiredAltitude = vnavTargetAltitude + (Math.tan(desiredFPA * (Math.PI / 180)) * vnavTargetDistance * 6076.12);
            let altDeviation = altitude - desiredAltitude;
            let setVerticalSpeed = 0;

            if (vnavTargetDistance > topOfDescent) {
                setVerticalSpeed = 0;
            }
            else {
                if (altDeviation >= 500) {
                    setVerticalSpeed = desiredVerticalSpeed * 1.5;
                }
                else if (altDeviation <= -500) {
                    setVerticalSpeed = desiredVerticalSpeed * 0;
                }
                else if (altDeviation >= 400) {
                    setVerticalSpeed = desiredVerticalSpeed * 1.4;
                }
                else if (altDeviation <= -400) {
                    setVerticalSpeed = desiredVerticalSpeed * 0;
                }
                else if (altDeviation >= 300) {
                    setVerticalSpeed = desiredVerticalSpeed * 1.3;
                }
                else if (altDeviation <= -300) {
                    setVerticalSpeed = desiredVerticalSpeed * 0.25;
                }
                else if (altDeviation >= 200) {
                    setVerticalSpeed = desiredVerticalSpeed * 1.2;
                }
                else if (altDeviation <= -200) {
                    setVerticalSpeed = desiredVerticalSpeed * 0.5;
                }
                else if (altDeviation >= 100) {
                    setVerticalSpeed = desiredVerticalSpeed * 1.1;
                }
                else if (altDeviation <= -100) {
                    setVerticalSpeed = desiredVerticalSpeed * 0.8;
                }
                else if (altDeviation >= 20) {
                    setVerticalSpeed = desiredVerticalSpeed * 1.05;
                }
                else if (altDeviation <= -20) {
                    setVerticalSpeed = desiredVerticalSpeed * 0.9;
                }
                else {
                    setVerticalSpeed = desiredVerticalSpeed;
                }
            }

            console.log("setVerticalSpeed: " + setVerticalSpeed.toFixed(0));
            //SimVar.SetSimVarValue('K:HEADING_BUG_SET', 'degrees', setHeading.toFixed(0));

            // let deltaVS = setVerticalSpeed - apCurrentVerticalSpeed;
            // let iMax = deltaVS > 0 ? Math.min(deltaVS / 100)
            //     : deltaVS < 0 ? Math.max(deltaVS / 100)
            //         : 0;
            // let iMaxAbs = Math.abs(iMax);
            // for (let i = 0; i < iMaxAbs; i++) {
            //     if (deltaVS < 0) {
            //         SimVar.SetSimVarValue("K:AP_VS_VAR_DEC", "number", 0);
            //     }
            //     else if (deltaVS > 0) {
            //         SimVar.SetSimVarValue("K:AP_VS_VAR_INC", "number", 0);
            //     }
            // }
            //SimVar.SetSimVarValue("K:AP_VS_VAR_SELECT", "feet per minute", setVerticalSpeed.toFixed(0));
            Coherent.call("AP_VS_VAR_SET_ENGLISH", 0, setVerticalSpeed);


            let distanceToTod = vnavTargetDistance > topOfDescent ? vnavTargetDistance - topOfDescent : "N/A";
            fmc._templateRenderer.setTemplateRaw([
                ["", "", "WORKING TITLE VPATH" + "[blue]"],
                [" target altitude[blue]", "target distance [blue]"],
                [vnavTargetAltitude.toFixed(0) + "ft", vnavTargetDistance.toFixed(1) + "nm"],
                [" VNAV Target[blue]", "ground speed [blue]"],
                [vnavTargetWaypoint.ident + "ft", groundSpeed.toFixed(0) + ""],
                [" target FPA[blue]", "target VS [blue]"],
                [desiredFPA.toFixed(0) + "°", desiredVerticalSpeed.toFixed(0) + "fpm"],
                [" alt dev[blue]", "ap vs [blue]"],
                [altDeviation.toFixed(0) + "ft", apCurrentVerticalSpeed.toFixed(0) + "fpm"],
                [" set vertical speed[blue]", "TOD Dist"],
                [setVerticalSpeed.toFixed(0) + "fpm[green]", distanceToTod + ""],
                [""],
                ["", "VNAV DESCENT>"]
            ]);

        }, 1000, true);
    fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage5(fmc); };

    fmc.updateSideButtonActiveStatus();
    }

}
//# sourceMappingURL=CJ4_FMC_PerfInitPage.js.map