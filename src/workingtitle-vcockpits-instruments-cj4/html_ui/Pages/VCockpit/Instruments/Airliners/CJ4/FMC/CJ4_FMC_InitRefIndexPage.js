class CJ4_FMC_InitRefIndexPage {
    static ShowPage1(fmc) {
        fmc.clearDisplay();
        fmc.setTemplate([
            ["INDEX[color]blue", "1", "2"],  //Page 1 ---- 2
            [""],
            ["<MCDU MENU", "GNSS1 POS>"], //Page 3, 4 ---- 9
            [""],
            ["<STATUS", "FREQUENCY>"], //Page 5 ---- 10
            [""],
            ["<POS INIT", "FIX>"], // N/A ---- 11
            [""],
            ["<VORDME CTL", "HOLD>"], //Page 6 ---- 12
            [""],
            ["<GNSS CTL", "PROG>"], //Page 7 ---- 13, 14
            [""],
            ["<FMS CTL", "SEC FPLN>"] //Page 8 ---- 15
        ]);
        fmc.onLeftInput[0] = () => { CJ4_FMC_InitRefIndexPage.ShowPage3(fmc); };
        fmc.onLeftInput[1] = () => { CJ4_FMC_InitRefIndexPage.ShowPage5(fmc); };
        fmc.onLeftInput[2] = () => { CJ4_FMC_PosInitPage.ShowPage1(fmc); };
        fmc.onLeftInput[3] = () => { CJ4_FMC_InitRefIndexPage.ShowPage6(fmc); };
        fmc.onLeftInput[4] = () => { CJ4_FMC_InitRefIndexPage.ShowPage7(fmc); };
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage8(fmc); };
        fmc.onRightInput[0] = () => { CJ4_FMC_InitRefIndexPage.ShowPage9(fmc); };
        fmc.onRightInput[1] = () => { CJ4_FMC_InitRefIndexPage.ShowPage10(fmc); };
        fmc.onRightInput[2] = () => { CJ4_FMC_InitRefIndexPage.ShowPage11(fmc); };
        fmc.onRightInput[3] = () => { CJ4_FMC_InitRefIndexPage.ShowPage12(fmc); };
        fmc.onRightInput[4] = () => { CJ4_FMC_InitRefIndexPage.ShowPage13(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage15(fmc); };
        fmc.onPrevPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage2(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage2(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage2(fmc) { //Page 2 of INDEX
        fmc.clearDisplay();
        fmc.setTemplate([
            ["INDEX[color]blue", "2", "2"],
            [""],
            ["<ABOUT", "ROUTE MENU>"], //Page 27 ---- 17
            [""],
            ["<PERF INIT TEMP", "DATABASE>"], // Page 27 ---- 18, 19, 20, 21
            [""],
            ["", "DB DISK OPS>"], //Page XX
            [""],
            ["", "DEFAULTS>"], //Page 22, 23, 24
            [""],
            ["", "ARR DATA>"], //Page 25
            [""],
            ["", "TEMP COMP>"] //Page 26
        ]);
        fmc.onLeftInput[0] = () => { CJ4_FMC_InitRefIndexPage.ShowPage27(fmc); };
        fmc.onLeftInput[1] = () => { CJ4_FMC_PerfInitPage.ShowPage1(fmc); };
        fmc.onRightInput[0] = () => { CJ4_FMC_InitRefIndexPage.ShowPage17(fmc); };
        fmc.onRightInput[1] = () => { CJ4_FMC_InitRefIndexPage.ShowPage18(fmc); };
        //fmc.onRightInput[2] = () => { CJ4_FMC_InitRefIndexPage.ShowPage19(fmc); };
        fmc.onRightInput[3] = () => { CJ4_FMC_InitRefIndexPage.ShowPage22(fmc); };
        fmc.onRightInput[4] = () => { CJ4_FMC_InitRefIndexPage.ShowPage25(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage26(fmc); };
        fmc.onPrevPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage3(fmc) { //MCDU MENU
        fmc.clearDisplay();
        fmc.setTemplate([
            ["MCDU MENU[color]blue"],
            [""],
            ["", "FMS RESET>"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["", "LOGOFF>"]
        ]);
        fmc.onRightInput[0] = () => { CJ4_FMC_InitRefIndexPage.ShowPage4(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage4(fmc) { //MCDU MENU PG2
        fmc.clearDisplay();
        fmc.setTemplate([
            ["RESET CONTROL[color]blue"],
            [""],
            ["", "", "THIS WILL RESET YOUR[color]yellow"],
            ["", "", "ON-SIDE FMC (FMC 1)[color]yellow"],
            [""],
            ["", "", "SOME DATA MAY BE LOST[color]yellow"],
            [""],
            ["DO YOU WANT TO CONTINUE?[color]yellow"],
            [""],
            [""],
            [""],
            ["YES", "NO"],
            ["<RESET", "CANCEL>"]
        ]);
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage5(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage3(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage5(fmc) { //STATUS       
        fmc.clearDisplay();

        fmc.registerPeriodicPageRefresh(() => {

            let simtime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");
            let hours = new String(Math.trunc(simtime / 3600));
            let minutes = new String(Math.trunc(simtime / 60) - (hours * 60));
			let month = SimVar.GetSimVarValue("E:ZULU MONTH OF YEAR", "number");
			let day = SimVar.GetSimVarValue("E:ZULU DAY OF MONTH", "number");
			let year = SimVar.GetSimVarValue("E:ZULU YEAR", "number");

            let hourspad = hours.padStart(2, "0");
            let minutesspad = minutes.padStart(2, "0");
			
			let zuluDate = new Date(year, month - 1, day);  //This whole thing is so we can set the database dates to be 1 day before current date and 28 days after to simulate having a current databse.
			let startDate = new Date(year, month - 1, day);
			startDate.setDate(zuluDate.getDate() - 1);
			let endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
			endDate.setDate(startDate.getDate() + 28);
			
			let secStartDate = new Date(year, month - 1, day);
			secStartDate.setDate(zuluDate.getDate() - 2);
			let secEndDate = new Date(secStartDate.getFullYear(), secStartDate.getMonth(), secStartDate.getDate());
			secEndDate.setDate(secStartDate.getDate() - 27);
			
			
			const formatDate = (date) => {
				let year = date.getFullYear().toString().substr(2);
				let day = date.getDate().toString().padStart(2, "0");

				let month = "";
				switch (date.getMonth()) {
					case 0:
					  month = "JAN";
					  break;
					case 1:
					  month = "FEB";
					  break;
					case 2:
					  month = "MAR";
					  break;
					case 3:
					  month = "APR";
					  break;
					case 4:
					  month = "MAY";
					  break;
					case 5:
					  month = "JUN";
					  break;
					case 6:
					  month = "JUL";
					  break;
					case 7:
					  month = "AUG";
					  break;
					case 8:
					  month = "SEP";
					  break;
					case 9:
					  month = "OCT";
					  break;
					case 10:
					  month = "NOV";
					  break;
					case 11:
					  month = "DEC";
					  break;
				}
  
				return day + month + year;
			};
            fmc.setTemplate([
                ["STATUS[color]blue"],
                ["NAV DATA[color]blue"],
                ["WORLD"],
                ["ACTIVE DATA BASE[color]blue"],
                [formatDate(startDate) + " " + formatDate(endDate)],
                ["SEC DATA BASE[color]blue"],
                [formatDate(secEndDate) + " " + formatDate(secStartDate)],
                ["UTC[color]blue", "DATE[color]blue"],
                [hourspad + ":" + minutesspad + "z", formatDate(zuluDate)],
                ["PROGRAM[color]blue"],
                ["SCID 832-0883-000"],
                ["----------------" + "[color]blue"],
                ["<INDEX", "POS INIT>"]
            ]);
        }, 1000, true);
     
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PosInitPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage6(fmc) { //VOR CTL
        fmc.clearDisplay();
        fmc.setTemplate([
            ["FMS1 VOR CONTROL[color]blue"],
            [""],
            ["---", "---"],
            ["", "", "NAVAID INHIBIT[color]blue"],
            ["---", "---"],
            [""],
            ["---", "---"],
            [""],
            ["---", "---"],
            ["VOR AND DME USAGE[color]blue"],
            ["ENABLED[color]green" + "/DISABLED"],
            ["------------------------" + "[color]blue"],
            ["<INDEX"]
        ]);
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage7(fmc) { //GNSS CTL
        fmc.clearDisplay();
        fmc.setTemplate([
            ["FMS1 GPS CONTROL[color]blue"],
            ["", "POS DIFF[color]blue"],
            ["GPS1 <ENABLED>[color]green", "026\xB0 / 0.0"],
            [""],
            ["GPS2 <ENABLED>[color]green", "026\xB0 / 0.0"],
            [""],
            [""],
            ["SAT DESELECT[color]blue"],
            ["--"],
            ["DEST[color]blue", "ETA[color]blue", "APPR RAIM[color]blue"],
            ["dest", "ETA", "AVAILABLE"],
            ["----------------" + "[color]blue"],
            ["<INDEX"]
        ]);
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage8(fmc) { //FMS CONTROL
        fmc.clearDisplay();
        fmc.setTemplate([
            ["FMS CONTROL[color]blue"],
            [""],
            [""],
            ["FMS COORD MODE[color]blue"],
            ["ENABLE" + "[color]green" + "/INDEP"],
            [""],
            [""],
            ["", "", "SELECT SYNC MASTER[color]blue"],
            ["<FMS1", "CANCEL>"],
            [""],
            ["<FMS2"],
            [""],
            ["<INDEX"]
        ]);
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage9(fmc) { //GNSS POS
        fmc.clearDisplay();
        function getRandomIntInclusive(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive 
        }
        
        let satnum = getRandomIntInclusive(7,14);

        fmc.registerPeriodicPageRefresh(() => {

            let simtime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");
            let hours = new String(Math.trunc(simtime / 3600));
            let minutes = new String(Math.trunc(simtime / 60) - (hours * 60));

            let hourspad = hours.padStart(2, "0");
            let minutesspad = minutes.padStart(2, "0");

            let month = SimVar.GetSimVarValue("E:ZULU MONTH OF YEAR", "number");
            let day = SimVar.GetSimVarValue("E:ZULU DAY OF MONTH", "number");
            let year = SimVar.GetSimVarValue("E:ZULU YEAR", "number");

            let currPos = new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude")).toDegreeString();
            let currLat = currPos.slice(0,9)
            let currLon = currPos.slice(9)
           
            fmc.setTemplate([
                ["GPS 1[color]blue"],
                [hourspad + ":" + minutesspad + "z" + "[color]green", month + "/" + day + "/" + year + "[color]green"],
                ["LATITUDE", "LONGITUDE"],
                [currLat + "[color]green", currLon + "[color]green"],
                [""],
                ["TRACK ANGLE", Math.round(SimVar.GetSimVarValue("GPS GROUND TRUE TRACK", "degrees")) + "°" + "[color]green"],
                ["GROUND SPEED", Math.round(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots")) + "[color]green"],
                [""],
                ["RAIM LIMIT", "0.10 NM[color]green"],
                ["PROBABLE ERROR", "0.05 NM[color]green"],
                [""],
                ["GPS MODE:", "", "NAV[color]green"],
                ["SATELLITES:", "", satnum + "[color]green"]
            ]);
        }, 1000, true);
      
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage10(fmc) { //FREQUENCY
        fmc.clearDisplay();
        fmc.setTemplate([
            ["FREQUENCY[color]blue"],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["", "", "UNDER CONSTRUCTION"],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<INDEX"]
        ]);
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage11(fmc) { //FIX
        fmc.clearDisplay();
        fmc.setTemplate([
            ["FIX INFO [color]blue"],
            ["REF[color]blue"],
            ["fix name"],
            ["RAD CROSS[color]blue", "LAT CROSS[color]blue"],
            ["degree", "---\xB0--.--"],
            ["DIST CROSS[color]blue", "LON CROSS[color]blue"],
            ["dist", "---\xB0--.--"],
            [""],
            ["<ABEAM REF"],
            [""],
            ["", "", "ABEAM REF"],
            ["CRS[color]blue", "DIST[color]blue", "ETE[color]blue", "FUEL[color]blue"],
            [""]
        ]);
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage12(fmc) { //HOLD
        fmc.clearDisplay();
        fmc.setTemplate([
            ["ACT FPLN HOLD"],
            ["FIX   ENTRY[color]blue", "HOLD SPD[color]blue"],
            ["fix" + "   DIRECT", "FAA/ICAO"],
            ["QUAD/RADIAL[color]blue", "MAX KIAS[color]blue"],
            ["NW/290\xB0", "265"],
            ["INBD CRS/DIR[color]blue", "FIX ETA[color]blue"],
            ["110\xB0 / R TURN", "time"],
            ["LEG TIME[color]blue", "EFC TIME[color]blue"],
            ["2.2 MIN", "18:35"],
            ["LEG DIST[color]blue"],
            ["15.0 NM", "NEW HOLD>"],
            ["----------------" + "[color]blue"],
            [""]
        ]);
        fmc.updateSideButtonActiveStatus();
    }
    //static calcDistance(currentDistance, currentWaypoint, newWaypoint) {
    //    let waypointDistance = new Number(0)
    //    if (newWaypoint && currentDistance && currentWaypoint) {
    //        let newWaypointLatLon = newWaypoint.infos.coordinates != undefined ? new LatLong(newWaypoint.infos.coordinates)
    //            : new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"));
    //        waypointDistance = Avionics.Utils.computeDistance(currentWaypoint.infos.coordinates, newWaypointLatLon);
    //        return currentDistance + waypointDistance;
    //    }
    //}

    static calcETEseconds(distance, currGS) {
        return (distance / currGS) * 3600;
    }
    static ShowPage13(fmc) { //PROG Pg 1
        fmc.clearDisplay();

        fmc.registerPeriodicPageRefresh(() => {

		fmc.setTemplate([
            ["PROGRESS[color]blue", "1/2[color]blue"],
            ["LAST", "DIST[color]blue", "ETE[color]blue", "FUEL-LB[color]blue"],
            ["-----[color]blue", "----[color]blue", ""],
            ["TO[color]blue"],
            ["-----[color]green", "----[color]green", "--:--[color]green", "1100"],
            ["NEXT[color]blue"],
            ["-----", "----", "--:--", "1140"],
            ["DEST[color]blue"],
            ["-----", "----", "--:--", "730"],
            ["ALTN[color]blue"],
            ["----", "----", "--:--", "570"],
            ["NAVIGATION[color]blue"],
            ["DME/DME GPS1[color]green"]
        ]);
        if (fmc.flightPlanManager.getDestination()) {     
            
            let currPos = new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"));
            let groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");

            //default values
            let prevWaypointIdent = "-----";
            let prevWaypointDist = "----";
            let activeWaypointIdent = "-----";
            let activeWaypointDist = "----";
            let activeWaypointEte = "--:--";
            let nextWaypointIdent = "-----";
            let nextWaypointDist = "----";
            let nextWaypointEte = "--:--";
            let destinationIdent = "----";
            let destinationDistance = "----";
            let destinationEte = "--:--";

            //previous waypoint data
            if (fmc.flightPlanManager.getPreviousActiveWaypoint()) {
                let prevWaypoint = fmc.flightPlanManager.getPreviousActiveWaypoint();
                prevWaypointIdent = new String(fmc.flightPlanManager.getPreviousActiveWaypoint().ident);
                prevWaypointDist = new Number(Avionics.Utils.computeDistance(currPos,prevWaypoint.infos.coordinates));
            }
            
            //current active waypoint data
            if (fmc.flightPlanManager.getActiveWaypoint()) {
                let activeWaypoint = fmc.flightPlanManager.getActiveWaypoint();
                activeWaypointIdent = new String(fmc.flightPlanManager.getActiveWaypoint().ident);
                activeWaypointDist = new Number(fmc.flightPlanManager.getDistanceToActiveWaypoint());
                activeWaypointEte = groundSpeed < 50 ? new String("--:--")
                    : new Date(fmc.flightPlanManager.getETEToActiveWaypoint() * 1000).toISOString().substr(11, 5);
            }

            //next waypoint data
            if (fmc.flightPlanManager.getNextActiveWaypoint()) {
                let nextWaypoint = fmc.flightPlanManager.getNextActiveWaypoint();
                nextWaypointIdent = new String(fmc.flightPlanManager.getNextActiveWaypoint().ident);
                nextWaypointDist = new Number(activeWaypointDist + Avionics.Utils.computeDistance(fmc.flightPlanManager.getActiveWaypoint().infos.coordinates, nextWaypoint.infos.coordinates));
                nextWaypointEte = groundSpeed < 50 ? new String("--:--")
                    : new Date(this.calcETEseconds(nextWaypointdist, groundSpeed) * 1000).toISOString().substr(11, 5);
            }

            //destination data
            if (fmc.flightPlanManager.getDestination()) {
                let destination = fmc.flightPlanManager.getDestination();
                destinationIdent = new String(fmc.flightPlanManager.getDestination().ident);
                let destinationDistanceDirect = new Number(activeWaypointDist + Avionics.Utils.computeDistance(currPos, destination.infos.coordinates));
                let destinationDistanceFlightplan = new Number(destination.cumulativeDistanceInFP - fmc.flightPlanManager.getNextActiveWaypoint().cumulativeDistanceInFP + activeWaypointDist);
                destinationDistance = destinationDistanceDirect > destinationDistanceFlightplan ? destinationDistanceDirect
                    : destinationDistanceFlightplan;
                destinationEte = groundSpeed < 50 ? new String("--:--")
                    : new Date(this.calcETEseconds(destinationDistance, groundSpeed) * 1000).toISOString().substr(11, 5);
            }

            fmc.setTemplate([
                ["PROGRESS[color]blue"],
                ["LAST", "DIST[color]blue", "ETE[color]blue", "FUEL-LB[color]blue"],
                [prevWaypointIdent + "[color]blue", Math.trunc(prevWaypointDist) + "[color]blue", ""],
                ["TO[color]blue"],
                [activeWaypointIdent + "[color]green", Math.trunc(activeWaypointDist) + "[color]green", activeWaypointEte + "[color]green", "1100"],
                ["NEXT[color]blue"],
                [nextWaypointIdent + "", Math.trunc(nextWaypointDist) + "", nextWaypointEte + "", "1140"],
                ["DEST[color]blue"],
                [destinationIdent + "", Math.trunc(destinationDistance) + "", destinationEte + "", "730"],
                ["ALTN[color]blue"],
                ["----", "----", "--:--", "570"],
                ["NAVIGATION[color]blue"],
                ["DME/DME GPS1[color]green"]
            ]);
        }

        }, 1000, true);

        fmc.onPrevPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage14(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage14(fmc); };
        fmc.updateSideButtonActiveStatus();
    }

    //ISA Temp = 15 - (2 x 37000/1000) PLANE ALTITUDE
    //Headwind component: Wind Speed x Cos (Wind Direction - Heading)
    //Crosswind component: Wind Speed x Sin (Wind Direction - Heading)

    static calcISADEV(currentSAT, currentALT) {
        let isaTemp = 15 - (2 * (currentALT / 1000));
        return currentSAT - isaTemp;
    }

    static ShowPage14(fmc) { //PROG Pg 2
        fmc.clearDisplay();

        fmc.registerPeriodicPageRefresh(() => {

        let currWindDirection = Math.trunc(SimVar.GetSimVarValue("AMBIENT WIND DIRECTION", "degrees"));
        let currWindSpeed = Math.trunc(SimVar.GetSimVarValue("AMBIENT WIND VELOCITY", "knots"));
        let sat = Math.trunc(SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "celsius"));
        let track = SimVar.GetSimVarValue("GPS GROUND MAGNETIC TRACK", "degrees");
        let tas = Math.trunc(SimVar.GetSimVarValue("AIRSPEED TRUE", "knots"));
        let xtk = SimVar.GetSimVarValue("GPS WP CROSS TRK", "meters") * (0.000539957); //meters to NM conversion
        console.log("xtk:" + xtk)

        let isaDev = Math.trunc(this.calcISADEV(sat, SimVar.GetSimVarValue("PLANE ALTITUDE", "feet")));

        let currHeadwind = Math.trunc(currWindSpeed * (Math.cos((track * Math.PI / 180) - (currWindDirection * Math.PI / 180))));
        let currCrosswind = Math.trunc(currWindSpeed * (Math.sin((track * Math.PI / 180) - (currWindDirection * Math.PI / 180))));

        let crosswinddirection = currCrosswind > 0 ? "R"
            : currCrosswind < 0 ? "L"
            : "";

        let headwindDirection = currHeadwind > 0 ? "H"
            : currHeadwind < 0 ? "T"
            : "";

        let xtkDirection = xtk > 0 ? "R"
            : xtk < 0 ? "L"
            : "";

        fmc.setTemplate([
            ["PROGRESS[color]blue", "2/2[color]blue"],
            ["HEADWIND[color]blue", "CROSSWIND[color]blue"],
            [headwindDirection + " " + Math.abs(currHeadwind) + " KT", crosswinddirection + " " + Math.abs(currCrosswind) + " KT"],
            ["WIND[color]blue", "SAT/ISA DEV[color]blue"],
            [currWindDirection + "/" + currWindSpeed , sat + "\xB0" + "C/" + isaDev + "\xB0" + "C"],
            ["XTK[color]blue", "TAS[color]blue"],
            [xtkDirection + " " + Math.abs(xtk.toFixed(1)) + " NM", tas + " KT"],
            [""],
            [""],
            [""],
            [""],
            ["", "RNP[color]blue", "POS ACCURACY[color]blue"],
            ["", "----", "0.06"]
        ]);

        }, 1000, true);
        
        fmc.onPrevPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage13(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage13(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage15(fmc) { //SEC FPLN
        fmc.clearDisplay();
        fmc.setTemplate([
            ["SEC FPLN[color]blue"],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["", "", "UNDER CONSTRUCTION"],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<INDEX"]
        ]);
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage17(fmc) { //ROUTE MENU
        fmc.clearDisplay();
        fmc.setTemplate([
            ["ROUTE MENU[color]blue"],
            [""],
            ["<PILOT ROUTE LIST"],
            [""],
            ["<DISK ROUTE LIST"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["-----------------------[color]blue"],
            ["<SEC FPLN"]
        ]);
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage15(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage18(fmc, databaseWaypoint) { //DATABASE INITIAL
        fmc.clearDisplay();

        let databaseIdentCell = " ";
        let databaseWaypointType = "";

        if (databaseWaypoint) {
            databaseIdentCell = databaseWaypoint.ident;
            console.log("icao: " + databaseWaypoint.icao);
            databaseWaypointType = databaseWaypoint.icao.slice(0,1);
            console.log("databaseWaypointType: " + databaseWaypointType);
        }

        fmc.onLeftInput[0] = () => {
            let value = fmc.inOut;
            fmc.clearUserInput();
            fmc.getOrSelectWaypointByIdent(value, (w) => {
                if (w) {
                    CJ4_FMC_InitRefIndexPage.ShowPage18(fmc, w);
                }
            });
        };


        //if (fmc.flightPlanManager.getDestination()) {
        //    let identpos = fmc.flightPlanManager.getDestination();
        //    if (identpos) {
        //        ident = identpos.ident;
        //    }
        //};

        fmc.setTemplate([
            ["DATABASE[color]blue"],
            ["IDENT[color]blue"],
            ["[-----]"],
            ["SELECTED WAYPOINT[color]blue"],
            ["<" + databaseIdentCell + ""],
            [""],
            [""],
            [""],
            [""],
            ["------------------[color]blue" + "PILOT"],
            ["", "WPT LIST>"],
            [""],
            ["<INDEX", "DEFINE WPT>"]
        ]);
        
        fmc.onLeftInput[1] = () => {
            fmc.clearUserInput();
            if (databaseWaypointType == "A") {
                CJ4_FMC_InitRefIndexPage.ShowPage19(fmc, databaseWaypoint)
            }
            


        };

        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage19(fmc, databaseWaypoint) { //DATABASE AIRPORT
        fmc.clearDisplay();
        let airportIdent = databaseWaypoint.ident;
        let runways = databaseWaypoint.infos.oneWayRunways;
        let longestRunway = runways[0];
        let longestRunwaySort = 0;
        let longestRunwayLength = 0;
        for (let i = 1; i < runways.length; i++) {
                longestRunwayLength = runways[i].length
                if (longestRunwayLength > longestRunwaySort) {
                longestRunwaySort = longestRunwayLength;
                longestRunway = runways[i];
            }
        }
        let longestRunwayDesignation = new String(longestRunway.designation);
        let longestRunwayOutput = "";
        let longestRunwayMod = new String(longestRunwayDesignation.slice(-1));
            if (longestRunwayMod == "L" || "C" || "R") {
                if (longestRunwayDesignation.length == 2) {
                    longestRunwayOutput = "0" + longestRunwayDesignation;
                } else {
                    longestRunwayOutput = longestRunwayDesignation;
                }
            } else {
                if (depRunwayDesignation.length == 2) {
                    longestRunwayOutput = longestRunwayDesignation;
                } else {
                    longestRunwayOutput = "0" + longestRunwayDesignation;
                }
            }
        let longestRunwayNumberOnly = new Number(longestRunwayOutput.slice(0,2));
        let longestRunwayOppositeNumber = longestRunwayNumberOnly < 19 ? longestRunwayNumberOnly + 18
            : longestRunwayNumberOnly - 18;
        let longestRunwayOppositeMod = "";
        let longestRunwayOppositeDesignator = "";
        if (longestRunwayMod == "L" || "C" || "R") {
            longestRunwayOppositeMod = longestRunwayMod == "R" ? "L"
                : longestRunwayMod == "C" ? "C"
                : longestRunwayMod == "L" ? "R"
                : "";
            longestRunwayOppositeDesignator = longestRunwayOppositeNumber + longestRunwayOppositeMod;
        } else {
            longestRunwayOppositeDesignator = longestRunwayOppositeNumber;
        }
        //elevation needs to be changed to field elevation, need to determine infos.???
        let longestRunwayElevation = new Number(longestRunway.elevation * 3.28);
        let longestRunwayLengthFeet = new Number(longestRunwayLength * 3.28);





        
        fmc.setTemplate([
            ["DATABASE[color]blue"],
            ["IDENT[color]blue", "LONG RWY[color]blue"],
            [airportIdent + "", longestRunwayOutput + "/" + longestRunwayOppositeDesignator + " " + Math.trunc(longestRunwayLengthFeet) + " FT"],
            ["ARP LOCATION[color]blue", "MAG VAR[color]blue"],
            [""],
            ["NAME[color]blue"],
            [databaseWaypoint.infos.name + ""],
            ["RUNWAY LENGTH[color]blue", "ELEV[color]blue"],
            ["<FEET/METERS", Math.trunc(longestRunwayElevation) + " FT"],
            ["------------------------[color]blue"],
            ["<LOCALIZERS"],
            [""],
            ["<RUNWAYS", "TERM WPTS>"]
        ]);
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage20(fmc) { //DATABASE VOR
        fmc.clearDisplay();
        fmc.setTemplate([
            ["DATABASE[color]blue"],
            ["IDENT[color]blue", "FREQ[color]blue"],
            [""],
            ["VOR[color]blue", "MAG VAR[color]blue"],
            [""],
            ["DME[color]blue"],
            [""],
            ["NAME[color]blue", "ELEV[color]blue"],
            ["<FEET/METERS"],
            ["------------Pilot[color]blue"],
            ["", "WPT LIST>"],
            [""],
            ["<INDEX", "DEFINE WPT>"]
        ]);
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage21(fmc) { //DATABASE WAYPOINT
        fmc.clearDisplay();
        fmc.setTemplate([
            ["DATABASE[color]blue"],
            ["IDENT[color]blue", "FREQ[color]blue"],
            [""],
            ["LOCATION[color]blue", "MAG VAR[color]blue"],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["------------Pilot[color]blue"],
            ["", "WPT LIST>"],
            [""],
            ["<INDEX", "DEFINE WPT>"]
        ]);
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage30(fmc) { //DATABASE NDB
        fmc.clearDisplay();
        fmc.setTemplate([
            ["DATABASE[color]blue"],
            ["IDENT[color]blue", "FREQ[color]blue"],
            [""],
            ["VOR[color]blue", "MAG VAR[color]blue"],
            [""],
            ["DME[color]blue"],
            [""],
            ["NAME[color]blue", "ELEV[color]blue"],
            ["<FEET/METERS"],
            ["------------Pilot[color]blue"],
            ["", "WPT LIST>"],
            [""],
            ["<INDEX", "DEFINE WPT>"]
        ]);
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage22(fmc) { //DEFAULTS Page 1
        fmc.clearDisplay();
        fmc.setTemplate([
            ["DEFAULTS[color]blue", "1", "5"],
            ["BOW[color]blue"],
            ["10280 LB"],
            ["AVG PASS WT[color]blue"],
            ["  170 LB"],
            ["RESERVE FUEL[color]blue"],
            [" 750 LB"],
            [""],
            [""],
			[""],
            [""],
            [" MAX MAP SYMB[color]blue"],
            ["40"]
        ]);
        fmc.onPrevPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage24(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage23(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage23(fmc) { //DEFAULTS Page 2
        fmc.clearDisplay();
        fmc.setTemplate([
            ["DEFAULTS[color]blue", "2", "5"],
            ["CLIMB SPEED[color]blue"],
            ["240/.64"],
			["CRUISE SPEED[color]blue"],
            ["300/.74"],
            ["DESCENT SPEED[color]blue"],
            [".74/290"],
            ["DESCENT ANGLE[color]blue"],
            ["3.0\xB0"],
            ["SPD/ALT LIMIT[color]blue"],
            ["250/10000"],
            ["FL/TRANS ALT[color]blue"],
            ["FL180"],
            [""],
            [""]
        ]);
        fmc.onPrevPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage22(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage24(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage24(fmc) { //DEFAULTS Page 3
        fmc.clearDisplay();
        fmc.setTemplate([
            ["DEFAULTS[color]blue", "3", "5"],
            ["DME USAGE[color]blue"],
            ["YES/NO[color]green"],
            ["VOR USAGE[color]blue"],
            ["YES/NO[color]green"],
            ["NEAREST APTS MIN RWY[color]blue"],
            ["4000 FT"],
            ["FLIGHT LOG ON LDG[color]blue"],
            ["YES/NO[color]green"],
            [""],
            [""],
            [""],
            [""]
        ]);
        fmc.onPrevPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage23(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage28(fmc); };
        fmc.updateSideButtonActiveStatus();
	}
		static ShowPage28(fmc) { //DEFAULTS Page 4
        fmc.clearDisplay();
        fmc.setTemplate([
            ["DEFAULTS[color]blue", "4", "5"],
            ["ON/OFF[color]green"],
            ["DSPL TMP@ FINAL VPA"],
            ["UNCOMP/COMP"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""]
        ]);
        fmc.onPrevPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage28(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage29(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
	static ShowPage29(fmc) { //DEFAULTS Page 5
        fmc.clearDisplay();
        fmc.setTemplate([
            ["DEFAULTS[color]blue", "4", "5"],
            ["", "", "TAKEOFF & APPROACH REF[color]blue"],
            [""],
            ["T/O FLAPS"],
            ["0/15[color]green"],
            ["A/I[color]blue"],
            ["OFF/ON[color]green"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""]
        ]);
        fmc.onPrevPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage28(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage22(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage25(fmc) { //ARR DATA
        fmc.clearDisplay();

        //destination data
        let destinationIdent = "";
        let approachName = "";
        let approachFrequency = "";
        let destination = "";
        let appRunway = "";
        let approach = "";

        if (fmc.flightPlanManager.getDestination()) {
            destination = fmc.flightPlanManager.getDestination();
            destinationIdent = new String(fmc.flightPlanManager.getDestination().ident);
        }
        if (fmc.flightPlanManager.getApproach()) {
            approach = fmc.flightPlanManager.getApproach();
            approachName = fmc.flightPlanManager.getApproach().name;
            approachFrequency = fmc.flightPlanManager.getApproachNavFrequency();
        }
        if (fmc.flightPlanManager.getApproachRunway()) {
            appRunway = fmc.flightPlanManager.getApproachRunway();
        }

        let appRunwayDirection = new Number(appRunway.direction);
        let appRunwayElevation = new Number(appRunway.elevation * 3.28);

        fmc.setTemplate([
            ["ACT ARRIVAL DATA[color]blue"],
            ["ARR AIRPORT[color]blue"],
            [destinationIdent + " / " + destination.infos.name],
            ["APPR[color]blue", "FREQ[color]blue"],
            [approachName + "", approachFrequency.toFixed(2) + ""],
            ["GS ANGLE[color]blue"],
            ["3.00"],
            ["LOC TRUE BRG[color]blue"],
            [Math.trunc(appRunwayDirection) + ""],
            ["RWY THRESHOLD ALT[color]blue"],
            [Math.trunc(appRunwayElevation) + ""],
            ["------------------------[color]blue"],
            ["<INDEX", "LEGS>"]
        ]);
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_LegsPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage26(fmc) { //TEMP COMP
        fmc.clearDisplay();
        fmc.setTemplate([
            ["dest" + "   TEMP COMP[color]blue"],
            ["APPROACH AIRPORT DATA[color]blue"],
            [""],
            ["SEL APT[color]blue", "OAT[color]blue"],
            ["departure" + "/" + "dest", "+10C"],
            ["", "ISA DEV[color]blue"],
            ["", "-3C"],
            ["", "TEMP COMP[color]blue"],
            ["", "ON" + "/" + "OFF[color]green"],
            ["MSL ALT[color]blue", "COMP ALT[color]blue", "CORR[color]blue"],
            [""],
            ["------------------------[color]blue"],
            ["<INDEX"]
        ]);
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage27(fmc) { //ABOUT
        fmc.clearDisplay();
        fmc.setTemplate([
            [""],
            ["", "", "MODIFIED BY:"],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["", "", "VERSION:"],
            [""],
            [""],
            [""],
            [""],
            ["<INDEX"]
        ]);
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
}
//# sourceMappingURL=CJ4_FMC_InitRefIndexPage.js.map