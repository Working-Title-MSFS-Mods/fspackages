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
    static calcDistance(currentDistance, currentWaypoint, newWaypoint) {
        let waypointDistance = Avionics.Utils.computeDistance(currentWaypoint.infos.coordinates, newWaypoint.infos.coordinates);
        return currentDistance + waypointDistance;
    }

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
            let prevWaypoint = fmc.flightPlanManager.getPreviousActiveWaypoint() == undefined ? "-----"
                : fmc.flightPlanManager.getPreviousActiveWaypoint();
            let activeWaypoint = fmc.flightPlanManager.getActiveWaypoint() == undefined ? "-----"
                : fmc.flightPlanManager.getActiveWaypoint();
            let destination = fmc.flightPlanManager.getDestination();

            let activewptdist = fmc.flightPlanManager.getDistanceToActiveWaypoint() == undefined ? "----"
                : fmc.flightPlanManager.getDistanceToActiveWaypoint();
            let activewptete = (groundSpeed < 50 || fmc.flightPlanManager.getETEToActiveWaypoint() == undefined) ? "--:--"
                : new Date(fmc.flightPlanManager.getETEToActiveWaypoint() * 1000).toISOString().substr(11, 5);
        
            let nextWaypoint = fmc.flightPlanManager.getNextActiveWaypoint() == undefined ? "-----"
                : fmc.flightPlanManager.getNextActiveWaypoint().ident;
            
            let nextWaypointdist = "----";
            if (activewptdist && activeWaypoint && fmc.flightPlanManager.getNextActiveWaypoint()) {
                nextWaypointdist = this.calcDistance(activewptdist, activeWaypoint, nextWaypoint);
            };
            
            let nextwptete = (groundSpeed < 50 || nextWaypointdist == "----") ? "--:--"
                : new Date(this.calcETEseconds(nextWaypointdist, groundSpeed) * 1000).toISOString().substr(11, 5);
            
            let directDestinationDistance = 0;
            if (destination.infos.coordinates) {
                directDestinationDistance = Avionics.Utils.computeDistance(currPos,destination.infos.coordinates);
            };

            let FPdestinationDistance = 0
            if (fmc.flightPlanManager.getPreviousActiveWaypoint() && fmc.flightPlanManager.getDestination().cumulativeDistanceInFP) {
                FPdestinationDistance = fmc.flightPlanManager.getDestination().cumulativeDistanceInFP
                - fmc.flightPlanManager.getPreviousActiveWaypoint().cumulativeDistanceInFP
                - Avionics.Utils.computeDistance(currPos,prevWaypoint.infos.coordinates);
            };

            let destinationDistance = 0
            if (directDestinationDistance > FPdestinationDistance) {
                destinationDistance = directDestinationDistance;
            } else {
                destinationDistance = FPdestinationDistance;
            }

            let destete = (groundSpeed < 50 || destinationDistance == 0) ? "--:--"
                : new Date(this.calcETEseconds(destinationDistance, groundSpeed) * 1000).toISOString().substr(11, 5);
            
            let prevWaypointdist = prevWaypoint = "-----" ? "----"
                : Avionics.Utils.computeDistance(currPos,prevWaypoint.infos.coordinates);

            fmc.setTemplate([
                ["PROGRESS[color]blue"],
                ["LAST", "DIST[color]blue", "ETE[color]blue", "FUEL-LB[color]blue"],
                [prevWaypoint.ident + "[color]blue", Math.trunc(prevWaypointdist) + "[color]blue", ""],
                ["TO[color]blue"],
                [activeWaypoint.ident + "[color]green", Math.trunc(activewptdist) + "[color]green", activewptete + "[color]green", "1100"],
                ["NEXT[color]blue"],
                [nextWaypoint + "", Math.trunc(nextWaypointdist) + "", nextwptete + "", "1140"],
                ["DEST[color]blue"],
                [destination.ident + "", Math.trunc(destinationDistance) + "", destete + "", "730"],
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

        let windDirection = Math.trunc(SimVar.GetSimVarValue("AMBIENT WIND DIRECTION", "degrees"));
        let windSpeed = Math.trunc(SimVar.GetSimVarValue("AMBIENT WIND VELOCITY", "knots"));
        let sat = Math.trunc(SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "celsius"));
        let track = SimVar.GetSimVarValue("GPS GROUND MAGNETIC TRACK", "degrees");
        let tas = Math.trunc(SimVar.GetSimVarValue("AIRSPEED TRUE", "knots"));
        let xtk = SimVar.GetSimVarValue("GPS WP CROSS TRK", "meters") * (0.000539957); //meters to NM conversion
        console.log("xtk:" + xtk)

        let isaDev = Math.trunc(this.calcISADEV(sat, SimVar.GetSimVarValue("PLANE ALTITUDE", "feet")));

        let headwind = Math.trunc(fmc.windSpeed * (Math.cos((track * Math.PI / 180) - (windDirection * Math.PI / 180))));
        let crosswind = Math.trunc(fmc.windSpeed * (Math.sin((track * Math.PI / 180) - (windDirection * Math.PI / 180))));

        let crosswinddirection = crosswind > 0 ? "R"
            : crosswind < 0 ? "L"
            : "";

        let headwindDirection = headwind > 0 ? "H"
            : headwind < 0 ? "T"
            : "";

        let xtkDirection = xtk > 0 ? "R"
            : xtk < 0 ? "L"
            : "";

        fmc.setTemplate([
            ["PROGRESS[color]blue", "2/2[color]blue"],
            ["HEADWIND[color]blue", "CROSSWIND[color]blue"],
            [headwindDirection + " " + Math.abs(headwind) + " KT", crosswinddirection + " " + Math.abs(crosswind) + " KT"],
            ["WIND[color]blue", "SAT/ISA DEV[color]blue"],
            [windDirection + "/" + windSpeed , sat + "\xB0" + "C/" + isaDev + "\xB0" + "C"],
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
    static ShowPage18(fmc) { //DATABASE INITIAL
        fmc.clearDisplay();

        let ident = "-----";

        if (fmc.flightPlanManager.getDestination()) {
            let identpos = fmc.flightPlanManager.getDestination();
            if (identpos) {
                ident = identpos.ident;
            }
        };

        fmc.setTemplate([
            ["DATABASE[color]blue"],
            ["IDENT[color]blue"],
            [[ident] + ""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["------------------[color]blue" + "PILOT"],
            ["", "WPT LIST>"],
            [""],
            ["<INDEX", "DEFINE WPT>"]
        ]);
        
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage19(fmc) { //DATABASE AIRPORT
        fmc.clearDisplay();
        fmc.setTemplate([
            ["DATABASE[color]blue"],
            ["IDENT[color]blue", "LONG RWY[color]blue"],
            [""],
            ["ARP LOCATION[color]blue", "MAG VAR[color]blue"],
            [""],
            ["NAME[color]blue"],
            [""],
            ["RUNWAY LENGTH[color]blue", "ELEV[color]blue"],
            ["<FEET/METERS"],
            ["------------------------[color]blue"],
            ["<LOCALIZERS"],
            [""],
            ["<RUNWAYS", "TERM WPTS>"]
        ]);
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage20(fmc) { //DATABASE NAVAID
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
        fmc.setTemplate([
            ["ACT ARRIVAL DATA[color]blue"],
            ["ARR AIRPORT[color]blue"],
            ["destination"],
            ["APPR[color]blue", "FREQ[color]blue"],
            ["appr", ""],
            ["GS ANGLE[color]blue"],
            ["3.00"],
            ["LOC TRUE BRG[color]blue"],
            [""],
            ["RWY THRESHOLD ALT[color]blue"],
            [""],
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