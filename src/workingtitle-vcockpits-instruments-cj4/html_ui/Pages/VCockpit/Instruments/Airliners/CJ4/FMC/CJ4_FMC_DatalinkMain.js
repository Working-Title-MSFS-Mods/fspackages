let _atisOrg;
let rcvdATIS = new Array();
let atisURL = `https://api.flybywiresim.com/atis/`; // Use FBW's API for all ATIS requests until a better solution can be found
let tafURL = `https://api.flybywiresim.com/taf/`; // self explanatory
let metarURL = `https://api.flybywiresim.com/metar/`; // also self explanatory
let hoppieURL = `http://www.hoppie.nl/acars/system/connect.html` // Hoppie connection URL
let atisSources = { 0: "FAA", 1: "VATSIM" }; // Translate numeric identifiers into their text identifiers
let metarSources = { 0: "MS", 1: "VATSIM" };
let procTime = { 0: false, 1: true };
let _reqStatus = "";
let _tafReqStatus = "";
let _atisStatus;
let _requesting;
let tafOne = "----";
let tafTwo = "----";
let tafThree = "----";
let tafFour = "----";
let tafFive = "----";
let tafSix = "----";
let tafOne_Temp;
let tafTwo_Temp;
let tafThree_Temp;
let tafFour_Temp;
let tafFive_Temp;
let tafSix_Temp;
let atsFlightId;
let facility;
let atisIdent;
let depOrig;
let depDest;
let depGate;
let depRmks;
let _altTafReqStatus = "";
let isOnSpecialPage = "";
let processing = false;

class CJ4_FMC_DatalinkMain {

    static ShowPage1(fmc) {
        console.log("ShowPage1 was called")
        fmc.clearDisplay();  // ATIS

        /* let reportingModes = ["🠓START AUTO-UPDATES", "🠓STOP AUTO-UPDATES", "  SINGLE REPORT"];
         let reportingIndex = WTDataStore.get('WT_CJ4_ATISMode', 0); See below */

        fmc.registerPeriodicPageRefresh(() => {

            let simtime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");
            let hours = new String(Math.trunc(simtime / 3600));
            let minutes = new String(Math.trunc(simtime / 60) - (hours * 60));
            let hourspad = hours.padStart(2, "0");
            let minutesspad = minutes.padStart(2, "0");

            let depApt = !(fmc.flightPlanManager.getOrigin()) ? "□□□□" : fmc.flightPlanManager.getOrigin().ident;
            // let reportingModeSwitch = reportingModes[reportingIndex];  -- Disabled for now

            if (_atisOrg) depApt = _atisOrg;

            fmc._templateRenderer.setTemplateRaw([
                ["DL[blue]", "", "ATIS REQ[blue]"],
                [""],
                ["AIRPORT[blue]"],
                [depApt],
                ["  SERVICE TYPE[blue]"],
                ["🠓ARRIVAL/DEP ATIS"],
                ["  REPORTING MODE[blue]"],
                [`🠓SINGLE REPORT`],
                [""],
                ["", `${_reqStatus ? _reqStatus : ""}`],
                ["", "SEND"], // waiting for asterisk implementation
                [""],
                ["<RETURN [white]" + hourspad + "[blue s-text]" + ":[blue s-text]" + minutesspad + "[blue s-text]", `${_atisStatus ? "ATIS>" : ""}`]
            ]);

            fmc.onLeftInput[0] = () => {
                let userInput = fmc.inOut;
                if (userInput && userInput !== "") {
                    fmc.clearUserInput();
                    fmc.setMsg("Working...");
                    fmc.dataManager.GetAirportByIdent(userInput).then(airport => {
                        fmc.setMsg();
                        if (airport) {
                            _atisOrg = airport.ident;
                            this.ShowPage1(fmc);
                        } else {
                            fmc.showErrorMessage("NOT IN DATABASE");
                        }
                    });
                }
            };

            fmc.onRightInput[4] = () => {

                if (!depApt || depApt === "" || depApt === "□□□□" || _requesting === true) return;

                _reqStatus = "REQ[blue]";
                isOnSpecialPage = "Page1";

                let userChoice = WTDataStore.get("WT_ATIS_Source", 0);
                let processingTime = WTDataStore.get("WT_CJ4_DL_Time", 0);
                let atisSrc = atisSources[userChoice];
                let processingUserChoice = procTime[processingTime];

                if (processingUserChoice === true) {
                    setTimeout(handleAtisLoad, 15000);
                } else {
                    handleAtisLoad();
                }
                function handleAtisLoad() {
                    WTUtils.loadFile(`${atisURL}${depApt}?source=${atisSrc}`, (data) => {
                        let json;
                        json = JSON.parse(data);

                        if (!json || json === "") {
                            _atisStatus = true;
                            _reqStatus = "RCVD[blue]";

                            console.log('Received ATIS messages are ' + rcvdATIS);

                            WTDataStore.set("WT_ATIS_Time", hourspad + "[blue s-text]" + ":[blue s-text]" + minutesspad + "[blue s-text]");
                            WTDataStore.set("WT_ATIS_Message", `ATIS FOR ${depApt} UNAVAILABLE`);
                            WTDataStore.set("WT_ATIS_Viewed", false);

                            if (isOnSpecialPage === "Page1") {
                                return CJ4_FMC_DatalinkMain.ShowPage1(fmc)
                            };
                        };

                        _atisStatus = true;
                        _reqStatus = "RCVD[blue]";

                        WTDataStore.set("WT_ATIS_Time", hourspad + "[blue s-text]" + ":[blue s-text]" + minutesspad + "[blue s-text]");
                        WTDataStore.set("WT_ATIS_Message", `${json.combined}`);

                        if (isOnSpecialPage === "Page1") {
                            return CJ4_FMC_DatalinkMain.ShowPage1(fmc)
                        };


                    }, (e) => {
                        let json;
                        json = JSON.parse(e);

                        console.log("Alternate Operation")

                        if (!json || json === "" || json.statusCode === 404) {
                            _atisStatus = true;
                            _reqStatus = "RCVD[blue]";

                            console.log('Received ATIS messages are ' + rcvdATIS);

                            WTDataStore.set("WT_ATIS_Time", hourspad + "[blue s-text]" + ":[blue s-text]" + minutesspad + "[blue s-text]");
                            WTDataStore.set("WT_ATIS_Message", `ATIS FOR ${depApt} UNAVAILABLE`);

                            if (isOnSpecialPage === "Page1") {
                                return CJ4_FMC_DatalinkMain.ShowPage1(fmc)
                            };
                        } else {
                            fmc.setMsg("ATIS NOT AVAILABLE");
                        };
                        return;
                    });

                    if (isOnSpecialPage === "Page1") {
                        return CJ4_FMC_DatalinkMain.ShowPage1(fmc)
                    };

                }
            };
            fmc.onRightInput[5] = () => { if (_atisStatus === true) this.ShowPage2(fmc); };
            fmc.onLeftInput[5] = () => { isOnSpecialPage = ""; CJ4_FMC_InitRefIndexPage.ShowPage30(fmc); };
            fmc.updateSideButtonActiveStatus();
        }, 1000, true);

    }

    static ShowPage2(fmc) {
        isOnSpecialPage = "";
        let initVal = 0;
        this.handleAtisDisplay(fmc, "", initVal);
    }

    static ShowPage3(fmc) {
        fmc.clearDisplay(); // WEATHER

        isOnSpecialPage = "Page3";

        if (processing === false) _altTafReqStatus = ""; // Sometimes the system may not be able to respond fast enough, so we'll do one more check.

        let simtime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");
        let hours = new String(Math.trunc(simtime / 3600));
        let minutes = new String(Math.trunc(simtime / 60) - (hours * 60));
        let hourspad = hours.padStart(2, "0");
        let minutesspad = minutes.padStart(2, "0");

        fmc.registerPeriodicPageRefresh(() => {

        fmc._templateRenderer.setTemplateRaw([
            ["DL[blue]", "", "WEATHER[blue]"],
            [""],
            ["<REQ[disabled]", "VIEW>[disabled]", "SIGMETS[disabled]"],
            [`${_altTafReqStatus ? _altTafReqStatus + "[blue]" : ""}`],
            ["<REQ", "VIEW>", "TERMINAL WX"],
            [""],
            ["<REQ[disabled]", "VIEW>[disabled]", "WINDS ALOFT[disabled]"],
            [""],
            ["<REQ[disabled]", "VIEW>[disabled]", "GRAPHICAL WX[disabled]"],
            [""],
            [""],
            [""],
            ["<RETURN [white]" + hourspad + "[blue s-text]" + ":[blue s-text]" + minutesspad + "[blue s-text]"]
        ]);

    }, 1000, true);

        _altTafReqStatus = "";

       /* fmc.onLeftInput[0] = () => { CJ4_FMC_DatalinkMain.ShowPage6(fmc); }; */
        fmc.onLeftInput[1] = () => { isOnSpecialPage = "Page4"; CJ4_FMC_DatalinkMain.ShowPage4(fmc); };
        fmc.onRightInput[1] = () => { CJ4_FMC_DatalinkMain.ShowPage5(fmc); };
        fmc.onLeftInput[5] = () => { isOnSpecialPage = ""; CJ4_FMC_InitRefIndexPage.ShowPage30(fmc); };
    }

    static ShowPage4(fmc) {
        fmc.clearDisplay(); // TERMINAL WX REQ

        let simtime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");
        let hours = new String(Math.trunc(simtime / 3600));
        let minutes = new String(Math.trunc(simtime / 60) - (hours * 60));
        let hourspad = hours.padStart(2, "0");
        let minutesspad = minutes.padStart(2, "0");

        fmc.registerPeriodicPageRefresh(() => {

        fmc._templateRenderer.setTemplateRaw([
            ["DL[blue]", "", "REQ TERMINAL WX[blue]"],
            [""],
            [`${processing ? tafOne_Temp : tafOne}`, `${processing ? tafTwo_Temp : tafTwo}`],
            [""],
            [`${processing ? tafThree_Temp : tafThree}`, `${processing ? tafFour_Temp : tafFour}`],
            [""],
            [`${processing ? tafFive_Temp : tafFive}`, `${processing ? tafSix_Temp : tafSix}`],
            [""],
            [""],
            ["", `${_tafReqStatus ? _tafReqStatus : ""}`],
            ["", "SEND"],
            [""],
            ["<RETURN [white]" + hourspad + "[blue s-text]" + ":[blue s-text]" + minutesspad + "[blue s-text]"]
        ]);

    }, 1000, true);

        fmc.onLeftInput[0] = () => { this.handleTafInput(fmc, "1L"); };
        fmc.onLeftInput[1] = () => { this.handleTafInput(fmc, "2L"); };
        fmc.onLeftInput[2] = () => { this.handleTafInput(fmc, "3L"); };
        fmc.onRightInput[0] = () => { this.handleTafInput(fmc, "1R"); };
        fmc.onRightInput[1] = () => { this.handleTafInput(fmc, "2R"); };
        fmc.onRightInput[2] = () => { this.handleTafInput(fmc, "3R"); };
        fmc.onRightInput[4] = () => { this.handleTafQuery(fmc); };
        fmc.onLeftInput[5] = () => { _tafReqStatus = ""; isOnSpecialPage = "Page3"; CJ4_FMC_DatalinkMain.ShowPage3(fmc); };
    }

    static ShowPage5(fmc) {
        fmc.clearDisplay(); // TERMINAL WX VIEW

        isOnSpecialPage = "Page5";
        _altTafReqStatus = "";

        let simtime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");
        let hours = new String(Math.trunc(simtime / 3600));
        let minutes = new String(Math.trunc(simtime / 60) - (hours * 60));
        let hourspad = hours.padStart(2, "0");
        let minutesspad = minutes.padStart(2, "0");

        let rcvdTafOne = WTDataStore.get("WT_CJ4_TafOne", `TAF FOR ${tafOne} UNAVAILABLE`);
        let rcvdTafTwo = WTDataStore.get("WT_CJ4_TafTwo", `TAF FOR ${tafTwo} UNAVAILABLE`);
        let rcvdTafThree = WTDataStore.get("WT_CJ4_TafThree", `TAF FOR ${tafThree} UNAVAILABLE`);
        let rcvdTafFour = WTDataStore.get("WT_CJ4_TafFour", `TAF FOR ${tafFour} UNAVAILABLE`);
        let rcvdTafFive = WTDataStore.get("WT_CJ4_TafFive", `TAF FOR ${tafFive} UNAVAILABLE`);
        let rcvdTafSix = WTDataStore.get("WT_CJ4_TafSix", `TAF FOR ${tafSix} UNAVAILABLE`);

        let rcvdMetarOne = WTDataStore.get("WT_CJ4_MetarOne", `METAR FOR ${tafOne} UNAVAILABLE`);
        let rcvdMetarTwo = WTDataStore.get("WT_CJ4_MetarTwo", `METAR FOR ${tafTwo} UNAVAILABLE`);
        let rcvdMetarThree = WTDataStore.get("WT_CJ4_MetarThree", `METAR FOR ${tafThree} UNAVAILABLE`);
        let rcvdMetarFour = WTDataStore.get("WT_CJ4_MetarFour", `METAR FOR ${tafFour} UNAVAILABLE`);
        let rcvdMetarFive = WTDataStore.get("WT_CJ4_MetarFive", `METAR FOR ${tafFive} UNAVAILABLE`);
        let rcvdMetarSix = WTDataStore.get("WT_CJ4_MetarSix", `METAR FOR ${tafSix} UNAVAILABLE`);

        rcvdTafOne = (rcvdMetarOne.includes("METAR") ? rcvdMetarOne : "METAR " + rcvdMetarOne) + " " + rcvdTafOne;
        rcvdTafTwo = (rcvdMetarTwo.includes("METAR") ? rcvdMetarTwo : "METAR " + rcvdMetarTwo) + " " + rcvdTafTwo;
        rcvdTafThree = (rcvdMetarThree.includes("METAR") ? rcvdMetarThree : "METAR " + rcvdMetarThree) + " " + rcvdTafThree;
        rcvdTafFour = (rcvdMetarFour.includes("METAR") ? rcvdMetarFour : "METAR " + rcvdMetarFour) + " " + rcvdTafFour;
        rcvdTafFive = (rcvdMetarFive.includes("METAR") ? rcvdMetarFive : "METAR " + rcvdMetarFive) + " " + rcvdTafFive;
        rcvdTafSix = (rcvdMetarSix.includes("METAR") ? rcvdMetarSix : "METAR " + rcvdMetarSix) + " " + rcvdTafSix;

        fmc.registerPeriodicPageRefresh(() => {

        fmc._templateRenderer.setTemplateRaw([
            ["DL[blue]", "", "VIEW TERMINAL WX[blue]"],
            [""],
            [tafOne !== "----" ? `<${tafOne}` : "<----", tafTwo !== "----" ? `<${tafTwo}` : "---->",],
            [""],
            [tafThree !== "----" ? `<${tafThree}` : "<----", tafFour !== "----" ? `<${tafFour}` : "---->"],
            [""],
            [tafFive !== "----" ? `<${tafFive}` : "<----", tafSix !== "----" ? `<${tafSix}` : "---->"],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN [white]" + hourspad + "[blue s-text]" + ":[blue s-text]" + minutesspad + "[blue s-text]"]
        ]);

    } ,1000, true);

        console.log(rcvdTafThree);

        fmc.onLeftInput[0] = () => { if (tafOne === "----") return; this.handleTafDisplay(fmc, "", rcvdTafOne, 0, tafOne); };
        fmc.onLeftInput[1] = () => { if (tafThree === "----") return; this.handleTafDisplay(fmc, "", rcvdTafThree, 0, tafThree); };
        fmc.onLeftInput[2] = () => { if (tafFive === "----") return; this.handleTafDisplay(fmc, "", rcvdTafFive, 0, tafFive); };
        fmc.onRightInput[0] = () => { if (tafTwo === "----") return; this.handleTafDisplay(fmc, "", rcvdTafTwo, 0, tafTwo); };
        fmc.onRightInput[1] = () => { if (tafFour === "----") return; this.handleTafDisplay(fmc, "", rcvdTafFour, 0, tafFour); };
        fmc.onRightInput[2] = () => { if (tafSix === "----") return; this.handleTafDisplay(fmc, "", rcvdTafSix, 0, tafSix); };
        fmc.onLeftInput[5] = () => { _tafReqStatus = ""; isOnSpecialPage = ""; CJ4_FMC_DatalinkMain.ShowPage3(fmc); };
    }

     /*static ShowPage7(fmc) {
        fmc.clearDisplay(); // Departure Clearance via Hoppie

        let simtime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");
        let hours = new String(Math.trunc(simtime / 3600));
        let minutes = new String(Math.trunc(simtime / 60) - (hours * 60));
        let hourspad = hours.padStart(2, "0");
        let minutesspad = minutes.padStart(2, "0");

        let logonCode = WTDataStore.get("WT_CJ4_HoppieLogon", "");

        if(SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string")){
            atsFlightId = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string");
        }

        if(fmc.flightPlanManager.getCurrentFlightPlan().hasOrigin){
            depOrig = fmc.flightPlanManager.getOrigin().ident;
        }

        
        if(fmc.flightPlanManager.getCurrentFlightPlan().hasDestination){
            depDest = fmc.flightPlanManager.getDestination().ident;
        }

        fmc.registerPeriodicPageRefresh(() => {

        fmc._templateRenderer.setTemplateRaw([
            ["DL[blue]", "1/2", "DEPART CLX RQ[blue]"],
            [""],
            ["ATS FLT ID[blue]", "FACILITY[blue]"],
            [`${atsFlightId ? atsFlightId : "□□□□□□□"}`,`${facility ? facility : "□□□□□□□□"}`],
            ["A/C TYPE[blue]","ATIS[blue]"],
            [`C25C`,`${atisIdent ? atisIdent : "□"}`],
            ["ORIG STA[blue]","DEST STA[blue]"],
            [`${depOrig ? depOrig : "□□□□"}`,`${depDest ? depDest : "□□□□"}`],
            ["GATE[blue]"],
            [`${depGate ? depGate : "□□□□□"}`], 
            ["","SEND"],
            [""],
            ["<RETURN [white]" + hourspad + "[blue s-text]" + ":[blue s-text]" + minutesspad + "[blue s-text]"]
        ]);

        fmc.onLeftInput[0] = () =>{
        let userInput = fmc.inOut;
        if(!userInput) return fmc.showErrorMessage("ENTER FLIGHT ID");
        if(userInput.length <= 7){
            atsFlightId = userInput;
            fmc.clearUserInput();
            CJ4_FMC_DatalinkMain.ShowPage7(fmc);
        }else{  
            return fmc.showErrorMessage("SHORTEN FLIGHT NUMBER");
        }
        };
        fmc.onRightInput[0] = () =>{
            let userInput = fmc.inOut;
            if(!userInput) return fmc.showErrorMessage("ENTER FACILITY CODE");
            if(userInput.length > 4) return fmc.showErrorMessage("SHORTEN FACILITY CODE");
            if(!logonCode) return fmc.showErrorMessage("MISSING LOGON CODE");
            if(!atsFlightId) return fmc.showErrorMessage("ENTER FLT ID FIRST");
           /* let request = new XMLHttpRequest();
            request.onreadystatechange = () => {
                console.log("Ready state changed.")
                if (request.readyState === 4) {
                    console.log("Ready state is 4.")
                    console.log(request.status);
                    console.log(request.response);
                    if (request.status === 200) {
                       let data = request.response;
                       if(data.includes(`{${userInput}}` && data.includes("OK"))){
                        WTDataStore.set("WT_CJ4_HoppieFacility", userInput); // Temporarily cache the facility using DataStores
                    }else{
                        console.log("Data is " + data);
                        return fmc.showErrorMessage("INVALID FACILITY CODE");
                    }
                    }else{
                        console.log(request.status);
                        console.log("Response is " + request.responseXML);
                        return fmc.showErrorMessage("UNKNOWN ERROR");
                    }
                }
            }
                request.open("GET", `${hoppieURL}?logon=${logonCode}&from=${atsFlightId}&to=${userInput}&type=ping&packet=${userInput}`, true);
                request.responseType = "document";
                request.send();*/
           /* WTUtils.loadFile(`${hoppieURL}?logon=${logonCode}&from=${atsFlightId}&to=${userInput}&type=ping&packet=${userInput}`, (data) =>{
                if(data.includes(`{${userInput}}` && data.includes("OK"))){
                    WTDataStore.set("WT_CJ4_HoppieFacility", userInput); // Temporarily cache the facility using DataStores
                }else{
                    console.log("Data is " + data);
                    return fmc.showErrorMessage("INVALID FACILITY CODE");
                }
            }, (err)=>{
                console.log(err);
                return fmc.showErrorMessage("UNKNOWN ERROR");
            });
            facility = WTDataStore.get("WT_CJ4_HoppieFacility", "");
            console.log(facility);
            fmc.clearUserInput();
            if(!facility) return;
            };
        fmc.onLeftInput[2] = () => {
            let userInput = fmc.inOut;
            if(!userInput) return fmc.showErrorMessage("ENTER ORIG STA");
            fmc.dataManager.GetAirportByIdent(userInput).then(airport => {
                fmc.clearUserInput();
                if (airport) {
                   depOrig = airport.ident;
                   CJ4_FMC_DatalinkMain.ShowPage7(fmc);
                } else {
                    fmc.showErrorMessage("NOT IN DATABASE");
                }
            });
        }
        fmc.onRightInput[2] = () => {
            let userInput = fmc.inOut;
            if(!userInput) return fmc.showErrorMessage("ENTER DEST STA");
            fmc.dataManager.GetAirportByIdent(userInput).then(airport => {
                fmc.clearUserInput();
                if (airport) {
                   depDest = airport.ident;
                   CJ4_FMC_DatalinkMain.ShowPage7(fmc);
                } else {
                    fmc.showErrorMessage("NOT IN DATABASE");
                }
            });
        }
        fmc.onLeftInput[3] = () => {
            if(!fmc.inOut) return fmc.showErrorMessage("ENTER GATE NO");
            if(fmc.inOut.length <= 5){
            depGate = fmc.inOut;
            fmc.clearUserInput();
            CJ4_FMC_DatalinkMain.ShowPage7(fmc);
            }else{
                return fmc.showErrorMessage("SHORTEN GATE ID");
            }
        }
        fmc.onRightInput[4] = () => { 

        };
        fmc.onLeftInput[5] = () => {CJ4_FMC_InitRefIndexPage.ShowPage30(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_DatalinkMain.ShowPage8(fmc); };
        }, 1000, true);
    }

    static ShowPage8(fmc) {
        fmc.clearDisplay(); // Dep Clx Page 2

        let simtime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");
        let hours = new String(Math.trunc(simtime / 3600));
        let minutes = new String(Math.trunc(simtime / 60) - (hours * 60));
        let hourspad = hours.padStart(2, "0");
        let minutesspad = minutes.padStart(2, "0");

        fmc.registerPeriodicPageRefresh(() => {

        fmc._templateRenderer.setTemplateRaw([
            ["DL[blue]", "2/2", "DEPART CLX RQ[blue]"],
            ["REMARKS[blue]"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""], 
            ["","SEND"],
            [""],
            ["<RETURN [white]" + hourspad + "[blue s-text]" + ":[blue s-text]" + minutesspad + "[blue s-text]"]
        ]);

        fmc._templateRenderer.renderScratchpadRaw(fmc._templateRenderer.getTRow(2));
        fmc._templateRenderer.renderScratchpadRaw(fmc._templateRenderer.getTRow(4));
        fmc._templateRenderer.renderScratchpadRaw(fmc._templateRenderer.getTRow(6));
        fmc._templateRenderer.renderScratchpadRaw(fmc._templateRenderer.getTRow(8));
        fmc.onRightInput[4] = () => {   
        };
        fmc.onLeftInput[5] = () => {CJ4_FMC_InitRefIndexPage.ShowPage30(fmc); };
        fmc.onPrevPage = () => { CJ4_FMC_DatalinkMain.ShowPage7(fmc); };
        }, 1000, true);
    }

    /*static ShowPage6(fmc) {
        fmc.clearDisplay(); // SIGMET REQ

        isOnSpecialPage = "Page6";

        let simtime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");
        let hours = new String(Math.trunc(simtime / 3600));
        let minutes = new String(Math.trunc(simtime / 60) - (hours * 60));
        let hourspad = hours.padStart(2, "0");
        let minutesspad = minutes.padStart(2, "0");

        fmc._templateRenderer.setTemplateRaw([
            ["DL[blue]", "", "REQ SIGMETS[blue]"],
            [""],
            ["ORIG"],
            [`${sigmetOrig ? sigmetOrig : "□□□□"}`],
            ["DEST"],
            [`${sigmetDest ? sigmetDest : "□□□□"}`],
            [""],
            [""],
            [""],
            ["",`${_sigmetReqStatus ? _sigmetReqStatus : ""}`],
            ["","SEND"],
            [""],
            ["<RETURN [white]" + hourspad + "[blue s-text]" + ":[blue s-text]" + minutesspad + "[blue s-text]"]
        ]);

        fmc.onLeftInput[0] = () => { this.handleSigmetInput(fmc, "orig"); };
        fmc.onLeftInput[1] = () => { this.handleSigmetInput(fmc, "dest"); };
        fmc.onRightInput[4] = () => { this.handleSigmetQuery(fmc); };
        fmc.onLeftInput[5] = () => { isOnSpecialPage = ""; CJ4_FMC_DatalinkMain.ShowPage3(fmc); };
    }*/

    static handleTafDisplay(fmc, stat, taf, val, apt) {
        fmc.clearDisplay(); // Display TAF

        let pgVal = val;
        let msgVal;

        if (taf.includes("UNAVAILABLE") && taf.includes("TAF FOR")) {
            msgVal = 1;
        }
        else {
            msgVal = Math.ceil(taf.length / (24 * 4)); // One single page can only fit 24*4 characters
            console.log(msgVal);
        }

        if (stat === true && pgVal + 2 <= msgVal) { // For whatever reason if you do not add 2 to pgVal you'll have 2 extra empty pages 
            pgVal += 1;
        }
        else if (stat === false && pgVal !== 0) {
            pgVal -= 1;
        }

        fmc.registerPeriodicPageRefresh(() => {

            let simtime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");
            let hours = new String(Math.trunc(simtime / 3600));
            let minutes = new String(Math.trunc(simtime / 60) - (hours * 60));
            let hourspad = hours.padStart(2, "0");
            let minutesspad = minutes.padStart(2, "0");

            console.log("Unmodified pgVal is " + pgVal);
            console.log("Modified pgVal is " + `${pgVal + 1}`);

            fmc._templateRenderer.setTemplateRaw([
                ["DL[blue]", `${pgVal + 1}/${msgVal}[blue]`, `${apt} WX[blue]`],
                [""],
                [`${taf.substring(0 + (96 * pgVal), 24 + (96 * pgVal)) === "" ? "" : taf.substring(0 + (96 * pgVal), 24 + (96 * pgVal))}`],
                [""],
                [`${taf.substring(24 + (96 * pgVal), 48 + (96 * pgVal)) === "" ? "" : taf.substring(24 + (96 * pgVal), 48 + (96 * pgVal))}`],
                [""],
                [`${taf.substring(48 + (96 * pgVal), 72 + (96 * pgVal)) === "" ? "" : taf.substring(48 + (96 * pgVal), 72 + (96 * pgVal))}`],
                [``],
                [`${taf.substring(72 + (96 * pgVal), 96 + (96 * pgVal)) === "" ? "" : taf.substring(72 + (96 * pgVal), 96 + (96 * pgVal))}`],
                [""],
                [""],
                [""],
                ["<RETURN [white]" + hourspad + "[blue s-text]" + ":[blue s-text]" + minutesspad + "[blue s-text]"]
            ]);

            fmc.onLeftInput[5] = () => { CJ4_FMC_DatalinkMain.ShowPage5(fmc); };
            fmc.onNextPage = () => { this.handleTafDisplay(fmc, true, taf, pgVal, apt) };
            fmc.onPrevPage = () => { this.handleTafDisplay(fmc, false, taf, pgVal, apt) };
            fmc.updateSideButtonActiveStatus();

        }, 1000, true);
    }



    static handleTafInput(fmc, lsk) {
        let userInput = fmc.inOut;
        if (userInput && userInput !== "") {
            fmc.clearUserInput();
            fmc.setMsg("Working...");
            fmc.dataManager.GetAirportByIdent(userInput).then(airport => {
                fmc.setMsg();
                if (airport) {
                    switch (lsk) {
                        case "1L":
                            tafOne = airport.ident;
                            break;
                        case "2L":
                            tafThree = airport.ident;
                            break;
                        case "3L":
                            tafFive = airport.ident;
                            break;
                        case "1R":
                            tafTwo = airport.ident;
                            break;
                        case "2R":
                            tafFour = airport.ident;
                            break;
                        case "3R":
                            tafSix = airport.ident;
                            break;
                    }
                    this.ShowPage4(fmc);
                } else {
                    fmc.showErrorMessage("NOT IN DATABASE");
                }
            });
        }
    }

    static handleTafQuery(fmc) {

        let metarSrc = WTDataStore.get("WT_CJ4_METAR_Source", 0);
        let procsTime = WTDataStore.get("WT_CJ4_DL_Time", 0);
        let cooldown = WTDataStore.get("WT_CJ4_Weather_RateLimit", "");
        let userChoice = metarSources[metarSrc];
        let userProcChoice = procTime[procsTime];

        _tafReqStatus = "REQ[blue]";

        console.log(cooldown)

        if (cooldown && ((Date.now() - cooldown) < 30000)) {
            _tafReqStatus = "";
            console.log("Current time is " + Date.now());
            console.log("cooldown is " + cooldown);
            console.log("Subtracted time is " + (Date.now() - cooldown));
            return fmc.showErrorMessage(`WAIT ${Math.round((30000 - (Date.now() - cooldown)) / 1000)} SECONDS`)
        } // Prevent spamming the FBW API

        if (userProcChoice === true) {
            tafOne_Temp = tafOne;
            tafTwo_Temp = tafTwo;
            tafThree_Temp = tafThree;
            tafFour_Temp = tafFour;
            tafFive_Temp = tafFive;
            tafSix_Temp = tafSix;
            processing = true;
            tafOne = "----";
            tafTwo = "----";
            tafThree = "----";
            tafFour = "----";
            tafFive = "----";
            tafSix = "----";
            setTimeout(() => {
                tafOne = tafOne_Temp;
                tafTwo = tafTwo_Temp;
                tafThree = tafThree_Temp;
                tafFour = tafFour_Temp;
                tafFive = tafFive_Temp;
                tafSix = tafSix_Temp;
                processing = false;
                this.saveTafContent(userChoice, fmc);
            }, 15000)
        }
        else {
            this.saveTafContent(userChoice, fmc);
        }

        _altTafReqStatus = "REQ";

        this.ShowPage4(fmc);

    }

    static saveTafContent(userChoice, fmc) {
        for (const tafCurrent of [tafOne, tafTwo, tafThree, tafFour, tafFive, tafSix]) { // I need to rewrite this somehow. It pains me to see an if waterfall.
            if (tafCurrent !== '----') {
                WTUtils.loadFile(`${tafURL}${tafCurrent}`, (data) => {
                    let tafJson = JSON.parse(data);
                    if (tafCurrent === tafOne) {
                        WTDataStore.set("WT_CJ4_TafOne", tafJson.taf);
                    }
                    if (tafCurrent === tafTwo) {
                        WTDataStore.set("WT_CJ4_TafTwo", tafJson.taf);
                    }
                    if (tafCurrent === tafThree) {
                        WTDataStore.set("WT_CJ4_TafThree", tafJson.taf);
                    }
                    if (tafCurrent === tafFour) {
                        WTDataStore.set("WT_CJ4_TafFour", tafJson.taf);
                    }
                    if (tafCurrent === tafFive) {
                        WTDataStore.set("WT_CJ4_TafFive", tafJson.taf);
                    }
                    if (tafCurrent === tafSix) {
                        WTDataStore.set("WT_CJ4_TafSix", tafJson.taf);
                    }
                }, () => {
                    if (tafCurrent === tafOne) {
                        WTDataStore.set("WT_CJ4_TafOne", `TAF FOR ${tafCurrent} UNAVAILABLE`);
                    }
                    if (tafCurrent === tafTwo) {
                        WTDataStore.set("WT_CJ4_TafTwo", `TAF FOR ${tafCurrent} UNAVAILABLE`);
                    }
                    if (tafCurrent === tafThree) {
                        WTDataStore.set("WT_CJ4_TafThree", `TAF FOR ${tafCurrent} UNAVAILABLE`);
                    }
                    if (tafCurrent === tafFour) {
                        WTDataStore.set("WT_CJ4_TafFour", `TAF FOR ${tafCurrent} UNAVAILABLE`);
                    }
                    if (tafCurrent === tafFive) {
                        WTDataStore.set("WT_CJ4_TafFive", `TAF FOR ${tafCurrent} UNAVAILABLE`);
                    }
                    if (tafCurrent === tafSix) {
                        WTDataStore.set("WT_CJ4_TafSix", `TAF FOR ${tafCurrent} UNAVAILABLE`);
                    }
                });

                if (tafCurrent !== '----') {
                    WTUtils.loadFile(`${metarURL}${tafCurrent}?source=${userChoice}`, (data) => {
                        let metarJson = JSON.parse(data);
                        if (tafCurrent === tafOne) {
                            WTDataStore.set("WT_CJ4_MetarOne", metarJson.metar);
                        }
                        if (tafCurrent === tafTwo) {
                            WTDataStore.set("WT_CJ4_MetarTwo", metarJson.metar);
                        }
                        if (tafCurrent === tafThree) {
                            WTDataStore.set("WT_CJ4_MetarThree", metarJson.metar);
                        }
                        if (tafCurrent === tafFour) {
                            WTDataStore.set("WT_CJ4_MetarFour", metarJson.metar);
                        }
                        if (tafCurrent === tafFive) {
                            WTDataStore.set("WT_CJ4_MetarFive", metarJson.metar);
                        }
                        if (tafCurrent === tafSix) {
                            WTDataStore.set("WT_CJ4_MetarSix", metarJson.metar);
                        }
                    }, () => {
                        if (tafCurrent === tafOne) {
                            WTDataStore.set("WT_CJ4_MetarOne", `METAR FOR ${tafCurrent} UNAVAILABLE`);
                        }
                        if (tafCurrent === tafTwo) {
                            WTDataStore.set("WT_CJ4_MetarTwo", `METAR FOR ${tafCurrent} UNAVAILABLE`);
                        }
                        if (tafCurrent === tafThree) {
                            WTDataStore.set("WT_CJ4_MetarThree", `METAR FOR ${tafCurrent} UNAVAILABLE`);
                        }
                        if (tafCurrent === tafFour) {
                            WTDataStore.set("WT_CJ4_MetarFour", `METAR FOR ${tafCurrent} UNAVAILABLE`);
                        }
                        if (tafCurrent === tafFive) {
                            WTDataStore.set("WT_CJ4_MetarFive", `METAR FOR ${tafCurrent} UNAVAILABLE`);
                        }
                        if (tafCurrent === tafSix) {
                            WTDataStore.set("WT_CJ4_MetarSix", `METAR FOR ${tafCurrent} UNAVAILABLE`);
                        }
                    });
                }
            }
            WTDataStore.set("WT_CJ4_Weather_RateLimit", Date.now());
        };

        for (const tafCurrent of [tafOne, tafTwo, tafThree, tafFour, tafFive, tafSix]) {
            if (tafCurrent !== '----') { // check that we've not been bamboozled
                _tafReqStatus = "RCVD[blue]";
            }
        }

        _altTafReqStatus = "RCVD";

        if (isOnSpecialPage === "Page4") {
            return CJ4_FMC_DatalinkMain.ShowPage4(fmc);
        }
        else if (isOnSpecialPage === "Page3") {
            return CJ4_FMC_DatalinkMain.ShowPage3(fmc);
        }
        else if (isOnSpecialPage === "Page5") {
            return CJ4_FMC_DatalinkMain.ShowPage5(fmc);
        }
    }

    static handleAtisDisplay(fmc, stat, val) {
        fmc.clearDisplay(); // ATIS REVIEW

        let pgVal = val;
        let msgVal;

        _reqStatus = "";
        _atisStatus = false;

        let time = WTDataStore.get("WT_ATIS_Time", "00:00Z");
        let atisMessage = WTDataStore.get("WT_ATIS_Message", "ATIS NOT AVAILABLE");

        if (atisMessage === "ATIS NOT AVAILABLE") {
            msgVal = 1;
        }
        else {
            msgVal = Math.ceil(atisMessage.length / (24 * 4)); // One single page can only fit 24*4 characters
            console.log(msgVal);
        }

        if (stat === true && pgVal + 2 <= msgVal) { // For whatever reason if you do not add 2 to pgVal you'll have 2 extra empty pages 
            pgVal += 1;
        }
        else if (stat === false && pgVal !== 0) {
            pgVal -= 1;
        }

        fmc.registerPeriodicPageRefresh(() => {

            let simtime = SimVar.GetSimVarValue("E:ZULU TIME", "seconds");
            let hours = new String(Math.trunc(simtime / 3600));
            let minutes = new String(Math.trunc(simtime / 60) - (hours * 60));
            let hourspad = hours.padStart(2, "0");
            let minutesspad = minutes.padStart(2, "0");

            console.log("Unmodified pgVal is " + pgVal);
            console.log("Modified pgVal is " + `${pgVal + 1}`);

            fmc._templateRenderer.setTemplateRaw([
                ["DL[blue]", `${pgVal + 1}/${msgVal}[blue]`, "ATIS REVIEW[blue]"],
                [`${time}Z[blue]`, "", `RCVD[blue]    `],
                [`${atisMessage.substring(0 + (96 * pgVal), 24 + (96 * pgVal)) === "" ? "" : atisMessage.substring(0 + (96 * pgVal), 24 + (96 * pgVal))}`],
                [""],
                [`${atisMessage.substring(24 + (96 * pgVal), 48 + (96 * pgVal)) === "" ? "" : atisMessage.substring(24 + (96 * pgVal), 48 + (96 * pgVal))}`],
                [""],
                [`${atisMessage.substring(48 + (96 * pgVal), 72 + (96 * pgVal)) === "" ? "" : atisMessage.substring(48 + (96 * pgVal), 72 + (96 * pgVal))}`],
                [``],
                [`${atisMessage.substring(72 + (96 * pgVal), 96 + (96 * pgVal)) === "" ? "" : atisMessage.substring(72 + (96 * pgVal), 96 + (96 * pgVal))}`],
                [""],
                ["", "REQ>"],
                [""],
                ["<RETURN [white]" + hourspad + "[blue s-text]" + ":[blue s-text]" + minutesspad + "[blue s-text]"]
            ]);

            fmc.onRightInput[4] = () => { isOnSpecialPage = "Page1"; this.ShowPage1(fmc); };
            fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage30(fmc); };
            fmc.onNextPage = () => { this.handleAtisDisplay(fmc, true, pgVal) };
            fmc.onPrevPage = () => { this.handleAtisDisplay(fmc, false, pgVal) };
            fmc.updateSideButtonActiveStatus();

        }, 1000, true);
    }

    /*static handleSigmetInput(fmc, type) {
        let userInput = fmc.inOut;
        if (userInput && userInput !== "") {
            fmc.clearUserInput();
            fmc.setMsg("Working...");
            fmc.dataManager.GetAirportByIdent(userInput).then(airport => {
                fmc.setMsg();
                if (airport) {
                    if (type === "orig") sigmetOrig = airport.ident;
                    else sigmetDest = airport.ident;
                    this.ShowPage6(fmc);
                } else {
                    fmc.showErrorMessage("NOT IN DATABASE");
                }
            });
        }
    };

    static handleSigmetQuery(fmc){
        _sigmetReqStatus = "REQ[blue]";

        WTUtils.loadFile(sigmetURL, (data) =>{
            console.log("Data is " + data);
            console.log(JSON.parse(data));
            console.log(JSON.stringify(data));
        },(e)=>{
            console.log(e);
        });
    }*/
}