class CJ4_FMC_InitRefIndexPage {
    static ShowPage1(fmc) {
        fmc.clearDisplay();
        fmc._templateRenderer.setTemplateRaw([
            ["", "1/2[blue] ", "INDEX[blue]"],  //Page 1 ---- 2
            [""],
            ["<MCDU MENU", "GNSS1 POS>"], //Page 3, 4 ---- 9
            [""],
            ["<DATALINK[disabled]", "FREQUENCY>"], //Page XXX ---- CJ4_FMC_FrequencyPage
            [""],
            ["<STATUS", "FIX>[disabled]"], //Page 2 ---- 11
            [""],
            ["<POS INIT", "HOLD>[disabled]"], //N/A ---- 12
            [" FMS1[s-text]"],
            ["<VORDME CTL[disabled]", "PROG>"], //Page 6 ---- 13, 14
            [" FMS1[s-text]"],
            ["<GNSS CTL[disabled]", "SEC FPLN>[disabled]"] //Page 7 ---- 15
        ]);
        fmc.onLeftInput[0] = () => { CJ4_FMC_InitRefIndexPage.ShowPage3(fmc); };
        fmc.onLeftInput[1] = () => { CJ4_FMC_InitRefIndexPage.ShowPage30(fmc); };
        fmc.onLeftInput[2] = () => { CJ4_FMC_InitRefIndexPage.ShowPage5(fmc); };
        fmc.onLeftInput[3] = () => { CJ4_FMC_PosInitPage.ShowPage1(fmc); };
        fmc.onLeftInput[4] = () => { CJ4_FMC_InitRefIndexPage.ShowPage6(fmc); };
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage7(fmc); };
        fmc.onRightInput[0] = () => { CJ4_FMC_InitRefIndexPage.ShowPage9(fmc); };
        fmc.onRightInput[1] = () => { CJ4_FMC_FrequencyPage.ShowMainPage(fmc); };
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
        fmc._templateRenderer.setTemplateRaw([
            ["", "2/2[blue] ", "INDEX[blue]"],
            [""],
            ["<FMS CTL[disabled]", "ROUTE MENU>"], //Page 27 ---- 17
            [""],
            ["<ABOUT", "DATABASE>"], // Page 27 ---- 18, 19, 20, 21
            [""],
            ["<MOD SET", "DB DISK OPS>[disabled]"], //Page XX
            [""],
            ["", "DEFAULTS>[disabled]"], //Page 22, 23, 24
            [""],
            ["", "ARR DATA>"], //Page 25
            [""],
            ["", "TEMP COMP>[disabled]"] //Page 26
        ]);
        fmc.onLeftInput[0] = () => { CJ4_FMC_InitRefIndexPage.ShowPage8(fmc); };
        fmc.onLeftInput[1] = () => { CJ4_FMC_InitRefIndexPage.ShowPage27(fmc); };
        fmc.onLeftInput[2] = () => { CJ4_FMC_ModSettingsPage.ShowPage1(fmc); };
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
        fmc._templateRenderer.setTemplateRaw([
            ["MCDU MENU[blue]"],
            [""],
            ["<FMS 1", "GPS 1 POS>"],
            [""],
            ["<DL[disabled]"],
            [""],
            ["<DBU[disabled]"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""]
        ]);
        fmc.onLeftInput[0] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.onLeftInput[1] = () => { CJ4_FMC_InitRefIndexPage.ShowPage30(fmc); };
        fmc.onRightInput[0] = () => { CJ4_FMC_InitRefIndexPage.ShowPage9(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage4(fmc) { //MCDU MENU PG2
        fmc.clearDisplay();
        fmc._templateRenderer.setTemplateRaw([
            ["RESET CONTROL[blue]"],
            [""],
            ["", "", "THIS WILL RESET YOUR[yellow]"],
            ["", "", "ON-SIDE FMC (FMC 1)[yellow]"],
            [""],
            ["", "", "SOME DATA MAY BE LOST[yellow]"],
            [""],
            ["DO YOU WANT TO CONTINUE?[yellow]"],
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

            const navDataRange = SimVar.GetGameVarValue('FLIGHT NAVDATA DATE RANGE', 'string');

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
            fmc._templateRenderer.setTemplateRaw([
                ["", "1/2[blue] ", "STATUS[blue]"],
                [" NAV DATA[blue]"],
                ["WORLD"],
                [" ACTIVE DATA BASE[blue]"],
                [navDataRange],
                [" SEC DATA BASE[blue]"],
                [formatDate(secEndDate) + " " + formatDate(secStartDate)],
                [" UTC[blue]", "DATE[blue] "],
                [hourspad + ":" + minutesspad, formatDate(zuluDate) + ""],
                [" PROGRAM[blue]"],
                ["SCID 832-0883-000"],
                ["-----------------------[blue]"],
                ["<INDEX", "POS INIT>"]
            ]);
        }, 1000, true);

        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PosInitPage.ShowPage1(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage32(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage32(fmc) { //IDENT
        fmc.clearDisplay();
        const mtow = WT_ConvertUnit.getWeight(1, "17110 LB", "7761 KG").Unit;
        
        fmc._templateRenderer.setTemplateRaw([
            ["", "2/2[blue]", "IDENT[blue]"],
            [" MODEL[blue]", "VARIANT [blue]"],
            ["525C-001", "CJ4"],
            [" MTOW[blue]", "ENGINES [blue]"],
            [mtow, "FJ44-4A"],
            [""],
            [""],
            [" VSPD DATA BASE[blue]"],
            ["096-0891-003"],
            [""],
            [""],
            ["--------------------------[blue]"],
            ["<INDEX", "POS INIT>"]
        ]);

        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PosInitPage.ShowPage1(fmc); };
        fmc.onPrevPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage5(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage5(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage6(fmc) { //VOR CTL
        fmc.clearDisplay();
        fmc._templateRenderer.setTemplateRaw([
            ["", "", "FMS1 VOR/DME CONTROL[blue]"],
            [""],
            ["---", "---"],
            ["", "", "NAVAID INHIBIT[blue]"],
            ["---", "---"],
            [""],
            ["---", "---"],
            [""],
            ["---", "---"],
            [" VOR USAGE[blue]", "DME USAGE[blue] "],
            ["YES/[white]NO[green]", "YES[green]/NO"],
            ["-------------------------[blue]"],
            ["<INDEX"]
        ]);
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage7(fmc) { //GNSS CTL
        fmc.clearDisplay();
        fmc._templateRenderer.setTemplateRaw([
            ["", "", "FMS1 GPS CONTROL[blue]"],
            [""],
            [" <ENABLED> GNSS1[green]", "STATUS> "],
            [""],
            [" <ENABLED> GNSS2[green]", "STATUS> "],
            [""],
            [""],
            [""],
            [""],
            ["", "4/4  ENABLED[green] "],
            ["<NPA RAIM", "SELECT SBAS>"],
            [""],
            ["<INDEX"]
        ]);
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.onRightInput[0] = () => { CJ4_FMC_InitRefIndexPage.ShowPage9(fmc); };
        fmc.onRightInput[1] = () => { CJ4_FMC_InitRefIndexPage.ShowPage9(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage8(fmc) { //FMS CONTROL
        fmc.clearDisplay();
        fmc._templateRenderer.setTemplateRaw([
            ["", "", "FMS CONTROL[blue]"],
            [" FMS COORD MODE[blue]"],
            ["SYNC[white s-text]/[white]INDEP[green]"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["-----------------------[blue]"],
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

        let satnum = getRandomIntInclusive(7, 14);

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
            let currLat = currPos.slice(0, 9)
            let currLon = currPos.slice(9)

            // TODO: the left/right alignment (distance to border) for time/date in RW doesnt fit the usual header template, so we need a special case here 
            // TODO: the center labels would need to be text-align:right but they are center because of the enclosing span with text-align center, find a solution (same for values)
            //       so the labels are on the left now for better looks
            fmc._templateRenderer.setTemplateRaw([
                [hourspad + ":" + minutesspad + "[s-text]", month + "/" + day + "/" + year + "[s-text]", "GPS 1[blue]"],
                [""],
                [" LATITUDE[s-text]", "LONGITUDE[s-text] "],
                [currLat + "[green]", currLon + "[green]"],
                [""],
                //["   TRACK ANGLE[s-text text-right]", Math.round(SimVar.GetSimVarValue("GPS GROUND TRUE TRACK", "degrees")) + "°" + "[s-text text-left green]"],
                //["  GROUND SPEED[s-text text-right]", Math.round(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots")) + "[s-text text-left green]"],
                ["   TRACK ANGLE[s-text]", Math.round(SimVar.GetSimVarValue("GPS GROUND TRUE TRACK", "degrees")) + "°TRUE [s-text green]"],
                ["  GROUND SPEED[s-text]", Math.round(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots")) + "[s-text green]    "],
                [""],
                ["    RAIM LIMIT[s-text]", "0.10 NM  [s-text green]"],
                ["PROBABLE ERROR[s-text]", "0.05 NM  [s-text green]"],
                //["RAIM LIMIT[s-text text-right]", "0.10 NM[s-text text-left green]"],
                //["PROBABLE ERROR[s-text text-right]", "0.05 NM[s-text text-left green]"],
                [""],
                ["  GPS MODE:[s-text text-right]", " NAV[s-text text-left green]"],
                ["SATELLITES:[s-text text-right]", " " + satnum + "[s-text text-left green]"]
                //["GPS MODE:[s-text text-right]", "NAV[s-text text-left green]"],
                //["SATELLITES:[s-text text-right]", satnum + "[s-text text-left green]"]
            ]);
        }, 1000, true);

        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage11(fmc) { //FIX
        fmc.clearDisplay();
        fmc._templateRenderer.setTemplateRaw([
            ["", "", "FIX INFO[blue]"],
            [" REF[blue]"],
            ["fix name"],
            [" RAD CROSS[blue]", "LAT CROSS[blue] "],
            ["degree", "---\xB0--.--"],
            [" DIST CROSS[blue]", "LON CROSS[blue] "],
            ["dist", "---\xB0--.--"],
            [""],
            ["<ABEAM REF"],
            [""],
            ["", "", "ABEAM REF"],
            [" CRS[blue]  DIST[blue]", "ETE[blue]  FUEL[blue] "],
            [""]
        ]);
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage12(fmc) { //HOLD
        fmc.clearDisplay();
        fmc._templateRenderer.setTemplateRaw([
            [" ACT LEGS[blue]", "1/1[blue] "],
            ["FIX   ENTRY[blue]", "HOLD SPD[blue]"],
            ["fix" + "   DIRECT", "FAA/ICAO"],
            ["QUAD/RADIAL[blue]", "MAX KIAS[blue]"],
            ["NW/290\xB0", "265"],
            ["INBD CRS/DIR[blue]", "FIX ETA[blue]"],
            ["110\xB0 / R TURN", "time"],
            ["LEG TIME[blue]", "EFC TIME[blue]"],
            ["2.2 MIN", "18:35"],
            ["LEG DIST[blue]"],
            ["15.0 NM", "NEW HOLD>"],
            ["-------- HOLD AT -------[blue]"],
            ["□□□□□", "LEG WIND>"]
        ]);
        fmc.updateSideButtonActiveStatus();
    }
    //method to calculate ETE
    static calcETEseconds(distance, currGS) {
        return (distance / currGS) * 3600;
    }
    static ShowPage13(fmc) { //PROG Pg 1
        fmc.clearDisplay();
        const fuelHeading = WT_ConvertUnit.getWeight(1, " FUEL-LB[s-text blue]", " FUEL-KG[s-text blue]").Unit;

        fmc.registerPeriodicPageRefresh(() => {

            fmc._templateRenderer.setTemplateRaw([
                [" PROGRESS[blue]", "1/2[blue] "],
                [" LAST[s-text blue]", "DIST  ETE" + fuelHeading],
                ["----", "---      ----- [s-text blue]"],
                [" TO[s-text blue]",],
                ["-----[s-text]", "--- -:-- ----- [s-text]"],
                [" NEXT[s-text blue]"],
                ["-----[s-text]", "--- -:-- ----- [s-text]"],
                [" DEST[s-text blue]"],
                ["-----[s-text]", "--- -:-- ----- [s-text]"],
                [" ALTN[s-text blue]"],
                ["-----[s-text]", "--- -:-- ----- [s-text]"],
                [" NAVIGATION[s-text blue]"],
                [""]
            ]);
            if (fmc.flightPlanManager.getDestination()) {

                let currPos = new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"));
                let groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
                let fuelQuantityLeft = Math.trunc(6.7 * SimVar.GetSimVarValue("FUEL LEFT QUANTITY", "Gallons"));
                let fuelQuantityRight = Math.trunc(6.7 * SimVar.GetSimVarValue("FUEL RIGHT QUANTITY", "Gallons"));
                let fuelQuantityTotal = fuelQuantityRight + fuelQuantityLeft;
                let totalFuelFlow = Math.round(SimVar.GetSimVarValue("L:CJ4 FUEL FLOW:1", "Pounds per hour"))
                + Math.round(SimVar.GetSimVarValue("L:CJ4 FUEL FLOW:2", "Pounds per hour"));

                //default values
                let prevWaypointIdent = "-----";
                let prevWaypointDist = "----";
                let activeWaypointIdent = "-----";
                let activeWaypointDist = "----";
                let activeWaypointEte = "-:--";
                let nextWaypointIdent = "-----";
                let nextWaypointDist = "----";
                let nextWaypointEte = "-:--";
                let destinationIdent = "----";
                let destinationDistance = "----";
                let destinationEte = "-:--";
                let activeWaypointFuel = "-----";
                let nextWaypointFuel = "-----";
                let destinationFuel = "-----";

                //previous waypoint data
                if (fmc.flightPlanManager.getPreviousActiveWaypoint()) {
                    let prevWaypoint = fmc.flightPlanManager.getPreviousActiveWaypoint();
                    prevWaypointIdent = new String(fmc.flightPlanManager.getPreviousActiveWaypoint().ident);
                    prevWaypointDist = new Number(Avionics.Utils.computeDistance(currPos, prevWaypoint.infos.coordinates));
                }

                //current active waypoint data
                if (fmc.flightPlanManager.getActiveWaypoint()) {
                    let activeWaypoint = fmc.flightPlanManager.getActiveWaypoint();
                    activeWaypointIdent = new String(activeWaypoint.ident);
                    activeWaypointDist = new Number(fmc.flightPlanManager.getDistanceToActiveWaypoint());
                    activeWaypointEte = groundSpeed < 50 ? new String("-:--")
                        : new Date(fmc.flightPlanManager.getETEToActiveWaypoint() * 1000).toISOString().substr(11, 5);
                    activeWaypointFuel = groundSpeed < 50 ? new String("-----")
                        : WT_ConvertUnit.getWeight(fuelQuantityTotal - (totalFuelFlow * activeWaypointDist / groundSpeed)).Value;
                }

                //next waypoint data
                if (fmc.flightPlanManager.getNextActiveWaypoint()) {
                    let nextWaypoint = fmc.flightPlanManager.getNextActiveWaypoint();
                    nextWaypointIdent = new String(fmc.flightPlanManager.getNextActiveWaypoint().ident);
                    nextWaypointDist = new Number(activeWaypointDist + Avionics.Utils.computeDistance(fmc.flightPlanManager.getActiveWaypoint().infos.coordinates, nextWaypoint.infos.coordinates));
                    nextWaypointEte = groundSpeed < 50 ? new String("-:--")
                        : new Date(this.calcETEseconds(nextWaypointDist, groundSpeed) * 1000).toISOString().substr(11, 5);
                    nextWaypointFuel = groundSpeed < 50 ? new String("-----")
                        : WT_ConvertUnit.getWeight(fuelQuantityTotal - (totalFuelFlow * nextWaypointDist / groundSpeed)).Value;
                }

                //destination data
                if (fmc.flightPlanManager.getDestination()) {
                    let destination = fmc.flightPlanManager.getDestination();
                    destinationIdent = new String(fmc.flightPlanManager.getDestination().ident);
                    let destinationDistanceDirect = Avionics.Utils.computeDistance(currPos, destination.infos.coordinates);
                    let destinationDistanceFlightplan = 0;
                    destinationDistance = destinationDistanceDirect;
                    if (fmc.flightPlanManager.getActiveWaypoint()) {
                        destinationDistanceFlightplan = new Number(destination.cumulativeDistanceInFP - fmc.flightPlanManager.getActiveWaypoint().cumulativeDistanceInFP + activeWaypointDist);
                    }
                    else {
                        destinationDistanceFlightplan = destination.cumulativeDistanceInFP;
                    }
                    destinationDistance = destinationDistanceDirect > destinationDistanceFlightplan ? destinationDistanceDirect
                        : destinationDistanceFlightplan;
                    destinationEte = groundSpeed < 50 || destinationDistance <= 0.1 ? new String("-:--")
                        : new Date(this.calcETEseconds(destinationDistance, groundSpeed) * 1000).toISOString().substr(11, 5);
                    destinationFuel = groundSpeed < 50 ? new String("-----")
                        : WT_ConvertUnit.getWeight(fuelQuantityTotal - (totalFuelFlow * destinationDistance / groundSpeed)).Value;
                }

                const prevWaypointDistanceConst = prevWaypointDist >= 100 ? prevWaypointDist.toFixed(0) : prevWaypointDist.toFixed(1);
                const activeWaypointDistanceConst = activeWaypointDist >= 100 ? activeWaypointDist.toFixed(0) : activeWaypointDist.toFixed(1);
                const nextWaypointDistanceConst = nextWaypointDist >= 100 ? nextWaypointDist.toFixed(0) : nextWaypointDist.toFixed(1);
                const destWaypointDistanceConst = destinationDistance >= 100 ? destinationDistance.toFixed(0) : destinationDistance.toFixed(1);
                const activeWaypointFuelConst = activeWaypointFuel == "-----" ? "-----" : activeWaypointFuel.toFixed(0).padStart(5, " ");
                const nextWaypointFuelConst = nextWaypointFuel == "-----" ? "-----" : nextWaypointFuel.toFixed(0).padStart(5, " ");
                const destinationFuelConst = destinationFuel == "-----" ? "-----" : destinationFuel.toFixed(0).padStart(5, " ");

                fmc._templateRenderer.setTemplateRaw([
                    [" PROGRESS[blue]", "1/2[blue] "],
                    [" LAST[s-text blue]", "DIST  ETE" + fuelHeading],
                    [prevWaypointIdent + "[blue]", prevWaypointDistanceConst + "       ----- [s-text blue]"],
                    [" TO[s-text blue]",],
                    [activeWaypointIdent + "[s-text magenta]", activeWaypointDistanceConst + "  " + activeWaypointEte + " " + activeWaypointFuelConst + " [s-text magenta]"],
                    [" NEXT[s-text blue]"],
                    [nextWaypointIdent + "[s-text]", nextWaypointDistanceConst + "  " + nextWaypointEte + " " + nextWaypointFuelConst + " [s-text]"],
                    [" DEST[s-text blue]"],
                    [destinationIdent + "[s-text]", destWaypointDistanceConst + "  " + destinationEte + " " + destinationFuelConst + " [s-text]"],
                    [" ALTN[s-text blue]"],
                    ["-----[s-text]", "----  -:-- ----- [s-text]"],
                    [" NAVIGATION[s-text blue]"],
                    [""]
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
            let satDisp = sat >= 0 ? "+" + sat : sat;
            let track = SimVar.GetSimVarValue("GPS GROUND MAGNETIC TRACK", "degrees");
            let tas = Math.trunc(SimVar.GetSimVarValue("AIRSPEED TRUE", "knots"));
            let xtk = SimVar.GetSimVarValue("GPS WP CROSS TRK", "meters") * (0.000539957); //meters to NM conversion
            //console.log("xtk:" + xtk)

            let isaDev = Math.trunc(this.calcISADEV(sat, SimVar.GetSimVarValue("PLANE ALTITUDE", "feet")));
            let isaDevDisp = isaDev >= 0 ? "+" + isaDev : isaDev;

            let currHeadwind = Math.trunc(currWindSpeed * (Math.cos((track * Math.PI / 180) - (currWindDirection * Math.PI / 180))));
            let currCrosswind = Math.trunc(currWindSpeed * (Math.sin((track * Math.PI / 180) - (currWindDirection * Math.PI / 180))));

            let headwindDirection = currHeadwind > 0 ? "HEADWIND"
            : currHeadwind < 0 ? "TAILWIND"
                : "TAILWIND";

            let crosswinddirection = currCrosswind > 0 ? "L"
                : currCrosswind < 0 ? "R"
                : "";

            let xtkDirection = xtk > 0 ? "L"
                : xtk < 0 ? "R"
                : "";

            fmc._templateRenderer.setTemplateRaw([
                [" PROGRESS[blue]", "2/2 [blue]"],
                [" " + headwindDirection + "[s-text blue]", "CROSSWIND [s-text blue]"],
                [Math.abs(currHeadwind) + " KT", crosswinddirection + " " + Math.abs(currCrosswind) + " KT"],
                [" WIND[blue]", "SAT/ISA DEV [blue]"],
                [currWindDirection + "M/" + currWindSpeed + " KT", satDisp + "\xB0" + "C/" + isaDevDisp + "\xB0" + "C"],
                [" XTK[blue]", "TAS [blue]"],
                [xtkDirection + " " + Math.abs(xtk.toFixed(2)) + " NM", tas + " KT"],
                [""],
                [""],
                [""],
                [""],
                ["", "", "POS ACCURACY[s-text blue]"],
                ["", "----", "0.06"]
            ]);

        }, 1000, true);

        fmc.onPrevPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage13(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage13(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage15(fmc) { //SEC FPLN
        fmc.clearDisplay();
        fmc._templateRenderer.setTemplateRaw([
            ["SEC FPLN[blue]", "1/2 [blue]"],
            [" ORIGIN[blue]", "DEST [blue]", "DIST[blue]"],
            ["□□□□", "□□□□", "----"],
            [" ROUTE[blue]", "ALTN [blue]"],
            ["----------", "----"],
            [" FLT NO[blue]", "ORIG RWY [blue]"],
            ["--------"],
            [" VIA[blue]", "TO [blue]"],
            ["-----", "-----"],
            ["-----------------------[blue]"],
            ["<ROUTE MENU"],
            [""],
            ["<SEC LEGS"]
        ]);
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage17(fmc) { //ROUTE MENU
        fmc.clearDisplay();
        let pilotId = WTDataStore.get('simbriefPilotId', '');
        let fplnRecallDisplay = pilotId == "" ? "<FPLN RECALL[disabled]" : "<FPLN RECALL[d-text]";
        let pilotIdDisplay = pilotId == "" ? "" : "PILOT ID: " + pilotId + "[s-text green]"
        fmc._templateRenderer.setTemplateRaw([
            ["", "", "ROUTE MENU[blue]"],
            [""],
            ["<PILOT ROUTE LIST[disabled]"],
            [""],
            ["<DISK ROUTE LIST[disabled]"],
            [""],
            [fplnRecallDisplay],
            [pilotIdDisplay],
            ["<FPLN WIND[disabled]"],
            [""],
            [""],
            ["-----------------------[blue]"],
            ["<SEC FPLN[disabled]"]
        ]);
        fmc.onLeftInput[2] = () => {
            if (pilotId != "") {
                CJ4_FMC_FplnRecallPage.ShowPage1(fmc);
            }
            else {
                fmc.showErrorMessage("NO PILOT ID[red]");
                CJ4_FMC_ModSettingsPage.ShowPage1(fmc);
            }
            };
        // fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage15(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage18(fmc, databaseWaypoint) { //DATABASE INITIAL
        fmc.clearDisplay();

        let databaseIdentCell = "□□□□□";
        let databaseWaypointType = "";

        if (databaseWaypoint) {
            databaseIdentCell = databaseWaypoint.ident;
            //console.log("icao: " + databaseWaypoint.icao);
            databaseWaypointType = databaseWaypoint.icao.slice(0, 1);
            //console.log("databaseWaypointType: " + databaseWaypointType);
        }

        fmc.onLeftInput[0] = () => {
            let value = fmc.inOut;
            if (value && value !== "") {
                fmc.clearUserInput();
                fmc.setMsg("Working...");
                fmc.getOrSelectWaypointByIdent(value, (w) => {
                    fmc.setMsg();
                    if (w) {
                        if (w.icao.slice(0, 1) == "A") {
                            CJ4_FMC_InitRefIndexPage.ShowPage19(fmc, w);
                        }
                        else if (w.icao.slice(0, 1) == "V") {
                            CJ4_FMC_InitRefIndexPage.ShowPage20(fmc, w);
                        }
                        else if (w.icao.slice(0, 1) == "W") {
                            CJ4_FMC_InitRefIndexPage.ShowPage21(fmc, w);
                        }
                        else if (w.icao.slice(0, 1) == "N") {
                            CJ4_FMC_InitRefIndexPage.ShowPage31(fmc, w);
                        }
                    }
                    else {
                        CJ4_FMC_InitRefIndexPage.ShowPage18(fmc);
                    }
                });
            }
        };

        fmc._templateRenderer.setTemplateRaw([
            ["", "", "DATA BASE[blue]"],
            [" IDENT[blue]"],
            [databaseIdentCell],
            [" LOCATION[blue]"],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["-----------------------[blue]", "PILOT[s-text] "],
            ["", "WPT LIST>"],
            [""],
            ["<INDEX", "DEFINE WPT>"]
        ]);

        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage19(fmc, databaseWaypoint, runwayUnitsReload) { //DATABASE AIRPORT
        fmc.clearDisplay();

        const systemUnits = WT_ConvertUnit.isMetric() ? 1 : 0;
        let runwayUnits = runwayUnitsReload === 0 || runwayUnitsReload === 1 ? runwayUnitsReload : systemUnits;
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
        if (longestRunwayMod == "L" || longestRunwayMod == "C" || longestRunwayMod == "R") {
            if (longestRunwayDesignation.length == 2) {
                longestRunwayOutput = "0" + longestRunwayDesignation;
            } else {
                longestRunwayOutput = longestRunwayDesignation;
            }
        } else {
            if (longestRunwayDesignation.length == 2) {
                longestRunwayOutput = longestRunwayDesignation;
            } else {
                longestRunwayOutput = "0" + longestRunwayDesignation;
            }
        }
        let longestRunwayNumberOnly = new Number(longestRunwayOutput.slice(0, 2));
        let longestRunwayOppositeNumber = longestRunwayNumberOnly < 19 ? longestRunwayNumberOnly + 18
            : longestRunwayNumberOnly - 18;
        let longestRunwayOppositeMod = "";
        let longestRunwayOppositeDesignator = "";
        if (longestRunwayMod == "L" || longestRunwayMod == "C" || longestRunwayMod == "R") {
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

        let wptCoordinatesAlt = databaseWaypoint.infos.coordinates.toString();
        let altIndex = wptCoordinatesAlt.indexOf("alt");
        let latIndex = wptCoordinatesAlt.indexOf("lat");
        let longIndex = wptCoordinatesAlt.indexOf("long");
        let latNum = new Number(wptCoordinatesAlt.substring(latIndex + 4, longIndex - 2));
        let latText = latNum < 0 ? "S " + Math.abs(latNum)
            : "N " + latNum;
        let lonNum = new Number(wptCoordinatesAlt.substring(longIndex + 5, altIndex - 2));
        let lonText = lonNum < 0 ? "W " + Math.abs(lonNum)
            : "E " + lonNum;

        const longestRunwayDisplay = runwayUnits == 1 ? Math.trunc(longestRunwayLength) + " M" : Math.trunc(longestRunwayLengthFeet) + " FT";
        const elevationDisplay = Math.trunc(longestRunwayElevation) + " FT";
        let runwayLengthSwitch = fmc._templateRenderer.renderSwitch(["FEET", "METERS"], runwayUnits);

        fmc._templateRenderer.setTemplateRaw([
            ["", "", "DATA BASE[blue]"],
            [" IDENT[blue]", "LONG RWY [blue]"],
            [airportIdent + " AIRPORT", longestRunwayDisplay + ""],
            [" ARP LOCATION[blue]", "MAG VAR[blue]"],
            [latText + "/" + lonText, "N/A"],
            [" NAME[blue]"],
            [databaseWaypoint.infos.name + ""],
            ["RUNWAY LENGTH[blue]", "ELEV[blue]"],
            ["<[white]" + runwayLengthSwitch, elevationDisplay + ""],
            ["-----------------------[blue]"],
            ["<LOCALIZERS"],
            [""],
            ["<RUNWAYS", "TERM WPTS>"]
        ]);

        fmc.onLeftInput[0] = () => {
            let value = fmc.inOut;
            if (value && value !== "") {
                fmc.clearUserInput();
                fmc.setMsg("Working...");
                fmc.getOrSelectWaypointByIdent(value, (w) => {
                    fmc.setMsg();
                    if (w) {
                        if (w.icao.slice(0, 1) == "A") {
                            CJ4_FMC_InitRefIndexPage.ShowPage19(fmc, w, runwayUnits);
                        }
                        else if (w.icao.slice(0, 1) == "V") {
                            CJ4_FMC_InitRefIndexPage.ShowPage20(fmc, w);
                        }
                        else if (w.icao.slice(0, 1) == "W") {
                            CJ4_FMC_InitRefIndexPage.ShowPage21(fmc, w);
                        }
                        else if (w.icao.slice(0, 1) == "N") {
                            CJ4_FMC_InitRefIndexPage.ShowPage31(fmc, w);
                        }
                    }
                    else {
                        CJ4_FMC_InitRefIndexPage.ShowPage18(fmc);
                    }
                });
            }
        };
        fmc.onLeftInput[3] = () => {
            runwayUnits = runwayUnits == 1 ? 0 : 1;
            CJ4_FMC_InitRefIndexPage.ShowPage19(fmc, databaseWaypoint, runwayUnits);
        };
        //fmc.onPrevPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage18(fmc, databaseWaypoint); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage20(fmc, databaseWaypoint) { //DATABASE VOR
        fmc.clearDisplay();

        let simMagVar = databaseWaypoint.infos.magneticVariation.toFixed(0)
        let magVar = (simMagVar > 180) ? simMagVar - 360 + "E" : (simMagVar < 180) ? simMagVar + "W" : 0;
        let vorType = databaseWaypoint.infos.type == 1 ? "VOR"
            : databaseWaypoint.infos.type == 2 ? "VOR-DME"
                : databaseWaypoint.infos.type == 3 ? "VOR-DME"
                    : databaseWaypoint.infos.type == 4 ? "VORTAC"
                        : databaseWaypoint.infos.type == 5 ? "VORTAC"
                            : databaseWaypoint.infos.type == 6 ? "VOR"
                                : "VOR";
        let vorClass = databaseWaypoint.infos.vorClass == 1 ? "Terminal"
            : databaseWaypoint.infos.vorClass == 2 ? "Low Alt"
                : databaseWaypoint.infos.vorClass == 3 ? "High Alt"
                    : databaseWaypoint.infos.vorClass == 4 ? "ILS"
                        : databaseWaypoint.infos.vorClass == 5 ? "VOT"
                            : "Unknown";
        let vorWeather = databaseWaypoint.infos.weatherBroadcast == 0 ? "No"
            : "Yes"
        let vorCoordinatesAlt = new String(databaseWaypoint.infos.coordinates);
        let vorIndex = vorCoordinatesAlt.indexOf("alt");
        let vorCoordinates = vorCoordinatesAlt.substring(0, vorIndex);
        //console.log("vorIndex:" + vorIndex);
        //console.log("vorCoordinatesAlt:" + vorCoordinatesAlt);

        fmc._templateRenderer.setTemplateRaw([
            ["", "", "DATA BASE[blue]"],
            [" IDENT[blue]", "FREQ[blue] "],
            [databaseWaypoint.infos.ident + "", databaseWaypoint.infos.frequencyMHz.toFixed(2) + ""],
            [" LOCATION[blue]", "MAG VAR [blue]"],
            [vorCoordinates + "", magVar + ""],
            [" CLASS[blue]", "TYPE [blue]"],
            [vorClass + "", vorType + ""],
            [" WEATHER[blue]"],
            [vorWeather + ""],
            [""],
            ["", ""],
            [""],
            ["<INDEX", ""]
        ]);

        fmc.onLeftInput[0] = () => {
            let value = fmc.inOut;
            if (value && value !== "") {
                fmc.clearUserInput();
                fmc.setMsg("Working...");
                fmc.getOrSelectWaypointByIdent(value, (w) => {
                    fmc.setMsg();
                    if (w) {
                        if (w.icao.slice(0, 1) == "A") {
                            CJ4_FMC_InitRefIndexPage.ShowPage19(fmc, w);
                        }
                        else if (w.icao.slice(0, 1) == "V") {
                            CJ4_FMC_InitRefIndexPage.ShowPage20(fmc, w);
                        }
                        else if (w.icao.slice(0, 1) == "W") {
                            CJ4_FMC_InitRefIndexPage.ShowPage21(fmc, w);
                        }
                        else if (w.icao.slice(0, 1) == "N") {
                            CJ4_FMC_InitRefIndexPage.ShowPage31(fmc, w);
                        }
                    }
                    else {
                        CJ4_FMC_InitRefIndexPage.ShowPage18(fmc);
                    }
                });
            }
        };

        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        //fmc.onPrevPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage18(fmc, databaseWaypoint); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage21(fmc, databaseWaypoint) { //DATABASE WAYPOINT
        fmc.clearDisplay();

        let wptRegion = databaseWaypoint.infos.region;
        let wptCoordinatesAlt = new String(databaseWaypoint.infos.coordinates);
        let wptIndex = wptCoordinatesAlt.indexOf("alt");
        let wptCoordinates = wptCoordinatesAlt.substring(0, wptIndex);
        //console.log("region: " + databaseWaypoint.infos.region);

        fmc._templateRenderer.setTemplateRaw([
            ["", "", "DATA BASE[blue]"],
            [" IDENT[blue]", "REGION [blue]"],
            [databaseWaypoint.infos.ident + "", wptRegion + ""],
            [" LOCATION[blue]"],
            [wptCoordinates + ""],
            [""],
            [""],
            [""],
            [""],
            ["------------Pilot[blue]"],
            ["", "WPT LIST>"],
            [""],
            ["<INDEX", "DEFINE WPT>"]
        ]);

        fmc.onLeftInput[0] = () => {
            let value = fmc.inOut;
            if (value && value !== "") {
                fmc.clearUserInput();
                fmc.setMsg("Working...");
                fmc.getOrSelectWaypointByIdent(value, (w) => {
                    fmc.setMsg();
                    if (w) {
                        if (w.icao.slice(0, 1) == "A") {
                            CJ4_FMC_InitRefIndexPage.ShowPage19(fmc, w);
                        }
                        else if (w.icao.slice(0, 1) == "V") {
                            CJ4_FMC_InitRefIndexPage.ShowPage20(fmc, w);
                        }
                        else if (w.icao.slice(0, 1) == "W") {
                            CJ4_FMC_InitRefIndexPage.ShowPage21(fmc, w);
                        }
                        else if (w.icao.slice(0, 1) == "N") {
                            CJ4_FMC_InitRefIndexPage.ShowPage31(fmc, w);
                        }
                    }
                    else {
                        CJ4_FMC_InitRefIndexPage.ShowPage18(fmc);
                    }
                });
            }
        };

        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        //fmc.onPrevPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage18(fmc, databaseWaypoint); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage31(fmc, databaseWaypoint) { //DATABASE NDB
        fmc.clearDisplay();

        //let simMagVar = databaseWaypoint.infos.magneticVariation.toFixed(0)
        //let magVar = (simMagVar > 180) ? simMagVar - 360 + "E" : (simMagVar < 180) ? simMagVar + "W" : 0;
        let ndbType = databaseWaypoint.infos.type == 1 ? "Compass Point"
            : databaseWaypoint.infos.type == 2 ? "MH"
                : databaseWaypoint.infos.type == 3 ? "H"
                    : databaseWaypoint.infos.type == 4 ? "HH"
                        : "Unknown";
        let ndbWeather = databaseWaypoint.infos.weatherBroadcast == 0 ? "No" : "Yes";
        let ndbCoordinatesAlt = new String(databaseWaypoint.infos.coordinates);
        let ndbIndex = ndbCoordinatesAlt.indexOf("alt");
        let ndbCoordinates = ndbCoordinatesAlt.substring(0, ndbIndex);

        fmc._templateRenderer.setTemplateRaw([
            ["", "", "DATA BASE[blue]"],
            [" IDENT[blue]", "FREQ [blue]"],
            [databaseWaypoint.infos.ident + "", databaseWaypoint.infos.frequencyMHz.toFixed(3) + ""],
            [" LOCATION[blue]"],
            [ndbCoordinates + ""],
            [" TYPE[blue]", "WEATHER [blue]"],
            [ndbType + "", ndbWeather + ""],
            ["", ""],
            ["", ""],
            [""],
            ["", ""],
            [""],
            ["<INDEX", ""]
        ]);

        fmc.onLeftInput[0] = () => {
            let value = fmc.inOut;
            if (value && value !== "") {
                fmc.clearUserInput();
                fmc.setMsg("Working...");
                fmc.getOrSelectWaypointByIdent(value, (w) => {
                    fmc.setMsg();
                    if (w) {
                        if (w.icao.slice(0, 1) == "A") {
                            CJ4_FMC_InitRefIndexPage.ShowPage19(fmc, w);
                        }
                        else if (w.icao.slice(0, 1) == "V") {
                            CJ4_FMC_InitRefIndexPage.ShowPage20(fmc, w);
                        }
                        else if (w.icao.slice(0, 1) == "W") {
                            CJ4_FMC_InitRefIndexPage.ShowPage21(fmc, w);
                        }
                        else if (w.icao.slice(0, 1) == "N") {
                            CJ4_FMC_InitRefIndexPage.ShowPage31(fmc, w);
                        }
                    }
                    else {
                        CJ4_FMC_InitRefIndexPage.ShowPage18(fmc);
                    }
                });
            }
        };

        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        //fmc.onPrevPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage18(fmc, databaseWaypoint); };
        fmc.updateSideButtonActiveStatus();
    }

    static ShowPage22(fmc) { //DEFAULTS Page 1
        fmc.clearDisplay();
        fmc._templateRenderer.setTemplateRaw([
            ["", "1/5[blue]", "DEFAULTS[blue]"],
            [" BOW[blue]"],
            ["10280" + "LB[s-text]"],
            [" AVG PASS WT[blue]"],
            ["  170 LB"],
            [" RESERVE FUEL[blue]"],
            ["  750 LB"],
            [""],
            [""],
            [""],
            [""],
            [" MAX MAP SYMB[blue]"],
            ["40"]
        ]);
        fmc.onPrevPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage24(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage23(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage23(fmc) { //DEFAULTS Page 2
        fmc.clearDisplay();
        fmc._templateRenderer.setTemplateRaw([
            ["", "2/5[blue]", "DEFAULTS[blue]"],
            [" CLIMB SPEED[blue]"],
            ["240/.64"],
            [" CRUISE SPEED[blue]"],
            ["300/.74"],
            [" DESCENT SPEED[blue]"],
            [".74/290"],
            [" DESCENT ANGLE[blue]"],
            ["3.0\xB0"],
            [" SPD/ALT LIMIT[blue]"],
            ["250/10000"],
            [" FL/TRANS ALT[blue]"],
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
        fmc._templateRenderer.setTemplateRaw([
            ["", "3/5[blue]", "DEFAULTS[blue]"],
            [" DME USAGE[blue]"],
            ["YES[green]/[white]NO[white s-text]"],
            [" VOR USAGE[blue]"],
            ["YES[green]/[white]NO[white s-text]"],
            [" NEAREST APTS MIN RWY[blue]"],
            [" 4000 FT"],
            [" FLIGHT LOG ON LDG[blue]"],
            ["YES[white s-text]/[white]NO[green]"],
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
        fmc._templateRenderer.setTemplateRaw([
            ["", "4/5[blue]", "DEFAULTS[blue]"],
            [" TEMP COMP[blue]"],
            ["ON[s-text]/[white]OFF[green]"],
            ["D SPL TMP@ FINAL VPA[blue]"],
            ["UNCOMP[s-text]/[white]COMP[green]"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""]
        ]);
        fmc.onPrevPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage24(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_InitRefIndexPage.ShowPage29(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage29(fmc) { //DEFAULTS Page 5
        fmc.clearDisplay();
        fmc._templateRenderer.setTemplateRaw([
            ["", "5/5[blue]", "DEFAULTS[blue]"],
            ["", "", "TAKEOFF & APPROACH REF[blue]"],
            [""],
            [" T/O FLAPS[blue]"],
            ["0[s-text]/[white]15[green]"],
            [" A/I[blue]"],
            ["OFF[green]/[white]ON[green]"],
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
    static ShowPage25ErrorMsg(fmc, msg, rskText) {
         fmc._templateRenderer.setTemplateRaw([
            [" ACT[blue]", "ARRIVAL DATA  [blue]"],
            [" " + msg],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["-----------------------[blue]"],
            ["<INDEX", rskText + ">"]
        ]);
    }
    static ShowPage25(fmc) { //ARR DATA
        fmc.clearDisplay();
        
        let arrAirportText = "";
        let approachText = "";
        let rwyThresholdAltText = "";
        let freqText = "---.--";
        let gsAngleText = "-.--°";
        let locTrueBrgText = "---T";
        
        let rightSelectionKeyProc = undefined;

        let destination = fmc.flightPlanManager.getDestination();
        if (!destination) {
            CJ4_FMC_InitRefIndexPage.ShowPage25ErrorMsg(fmc, "NO DEST SELECTED", "FPLN");
            rightSelectionKeyProc = CJ4_FMC_RoutePage.ShowPage1;
        } else {
            let approach = fmc.flightPlanManager.getApproach();
            if (!approach.name && !fmc.vfrLandingRunway) {
                CJ4_FMC_InitRefIndexPage.ShowPage25ErrorMsg(fmc, "NO APPROACH SELECTED", "ARRIVAL");
                rightSelectionKeyProc = CJ4_FMC_DepArrPage.ShowArrivalPage;
            } else {
                arrAirportText = destination.ident;
                if (destination.infos) {
                    arrAirportText = arrAirportText + "/" + destination.infos.name;
                }

                approachText = approach.name || "RW" + Avionics.Utils.formatRunway(fmc.vfrLandingRunway.designation);
                let approachRunway = fmc.flightPlanManager.getApproachRunway() || fmc.vfrLandingRunway;
                rwyThresholdAltText = Math.trunc(approachRunway.elevation * 3.28) + " FT";
                if (approachText.trim().startsWith("ILS")) {
                    freqText = fmc.flightPlanManager.getApproachNavFrequency().toFixed(2);
                    locTrueBrgText = Math.trunc(approachRunway.direction).toString().padStart(3, "0") + "T";
                    gsAngleText = "3.00°";
                }
                
                fmc._templateRenderer.setTemplateRaw([
                    [" ACT[blue]", "ARRIVAL DATA  [blue]"],
                    [" ARR AIRPORT[blue]"],
                    [arrAirportText],
                    [" APPR[blue]", "FREQ [blue]"],
                    [approachText, freqText],
                    [" GS ANGLE[blue]"],
                    [gsAngleText],
                    [" LOC TRUE BRG[blue]"],
                    [locTrueBrgText],
                    [" RWY THRESHOLD ALT[blue]"],
                    [rwyThresholdAltText],
                    ["-----------------------[blue]"],
                    ["<INDEX", "LEGS>"]
                ]);
                rightSelectionKeyProc = CJ4_FMC_LegsPage.ShowPage1;
            }
        }

        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.onRightInput[5] = () => { rightSelectionKeyProc(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage26(fmc) { //TEMP COMP
        fmc.clearDisplay();

        let destinationIdent = "";
        let approachName = "";
        let approachFrequency = "";
        let destination = "";
        let appRunway = "";
        let approach = "";
        let originIdent = "";

        if (fmc.flightPlanManager.getDestination()) {
            destination = fmc.flightPlanManager.getDestination();
            destinationIdent = new String(destination.ident);
        }
        if (fmc.flightPlanManager.getOrigin()) {
            origin = fmc.flightPlanManager.getOrigin();
            originIdent = new String(origin.ident);
        }
        if (fmc.flightPlanManager.getApproach()) {
            approach = fmc.flightPlanManager.getApproach();
            approachName = approach.name;
            approachFrequency = fmc.flightPlanManager.getApproachNavFrequency();
        }
        if (fmc.flightPlanManager.getApproachRunway()) {
            appRunway = fmc.flightPlanManager.getApproachRunway();
        }

        let appRunwayDirection = new Number(appRunway.direction);
        let appRunwayElevation = new Number(appRunway.elevation * 3.28);

        fmc._templateRenderer.setTemplateRaw([
            ["", "", "ACT TEMP COMP[blue]"],
            ["", "", "APPROACH AIRPORT DATA[blue]"],
            [""],
            [" SEL APT[blue]", "OAT [blue]"],
            [originIdent + "/" + destinationIdent, " +10C"],
            ["", "ISA DEV [blue]"],
            ["", "-3C"],
            ["", "TEMP COMP [blue]"],
            ["", "ON[s-text]" + "/[white]" + "OFF[green]"],
            [" MSL ALT[blue]", "CORR COMP ALT [blue]"],
            [appRunwayElevation + " FT", "FT"],
            ["-----------------------[blue]"],
            ["<INDEX", "APPR REF>"]
        ]);
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage13(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage27(fmc) { //ABOUT
        fmc.clearDisplay();
        fmc._templateRenderer.setTemplateRaw([
            ["", "", "MODIFIED BY:[blue]"],
            ["", "", "Working Title MSFS Mods[green]"],
            [""],
            ["github.com/[white s-text]"],
            ["Working-Title-MSFS-Mods[white s-text]"],
            [""],
            [" VERSION[blue]"],
            ["0.7.0[s-text white]"],
            [""],
            [""],
            [""],
            [""],
            ["<INDEX"]
        ]);
        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
    static ShowPage30(fmc) { //DATALINK
        fmc.clearDisplay();

        fmc.registerPeriodicPageRefresh(() => {

            let simtime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");
            let hours = new String(Math.trunc(simtime / 3600));
            let minutes = new String(Math.trunc(simtime / 60) - (hours * 60));
            let hourspad = hours.padStart(2, "0");
            let minutesspad = minutes.padStart(2, "0");

            fmc._templateRenderer.setTemplateRaw([
                ["DL[blue]", "1/2[blue]", "DATALINK MENU[blue]"],
                [""],
                ["<RCVD MSGS[disabled]", "ATS LOG>[disabled]"],
                [""],
                ["<SEND MSGS[disabled]", "DEPART CLX>[disabled]"],
                [""],
                ["<WEATHER[disabled]", "OCEANIC CLX>[disabled]"],
                [""],
                ["<TWIP[disabled]"],
                [""],
                ["<ATIS[disabled]"],
                ["        NO COMM[green s-text]"],
                ["<RETURN [white]" + hourspad + "[blue s-text]" + ":[blue s-text]" + minutesspad + "[blue s-text]"]
            ]);
            fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
            fmc.updateSideButtonActiveStatus();
        }, 1000, true);
    }
}
//# sourceMappingURL=CJ4_FMC_InitRefIndexPage.js.map