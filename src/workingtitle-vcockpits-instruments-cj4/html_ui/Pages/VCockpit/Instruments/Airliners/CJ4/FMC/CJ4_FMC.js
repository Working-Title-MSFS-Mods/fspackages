class CJ4_FMC extends FMCMainDisplay {
    constructor() {
        super(...arguments);
        this._registered = false;
        this._isRouteActivated = false;
        this._lastUpdateAPTime = NaN;
        this.refreshFlightPlanCooldown = 0;
        this.updateAutopilotCooldown = 0;
        this._hasSwitchedToHoldOnTakeOff = false;
        this._previousApMasterStatus = false;
        this._apMasterStatus = false;
        this._apHasDeactivated = false;
        this._hasReachedTopOfDescent = false;
        this._apCooldown = 500;
        this._wasInAltMode = false;
        this.reserveFuel = 750;
        this.paxNumber = 0;
        this.cargoWeight = 0;
        this.basicOperatingWeight = 10280;
        this.grossWeight = 10280;
        this.zFWActive = 0;
        this.zFWPilotInput = 0;
        this.takeoffOat = "□□□";
        this.landingOat = "□□□";
        this.takeoffQnh = "□□.□□";
        this.landingQnh = "□□.□□";
        this.takeoffWindDir = "---";
        this.takeoffWindSpeed = "---";
        this.landingWindDir = "---";
        this.landingWindSpeed = "---";
        this.takeoffPressAlt = "";
        this.landingPressAlt = "";
        this.depRunwayCondition = 0;
        this.arrRunwayCondition = 0;
        this.takeoffFlaps = 15;
        this.takeoffAntiIce = 0;
        this.endTakeoffDist = 0;
        this.initialFuelLeft = 0;
        this.initialFuelRight = 0;
        this.selectedRunwayOutput = "";
        this.toVSpeedStatus = CJ4_FMC.VSPEED_STATUS.NONE;
        this.appVSpeedStatus = CJ4_FMC.VSPEED_STATUS.NONE;
        this._fpHasChanged = false;
        this._activatingDirectTo = false;
        this._templateRenderer = undefined;
        this._msg = "";
        this._activatingDirectToExisting = false;
        this.vfrLandingRunway = undefined;
        this.modVfrRunway = false;
        this.deletedVfrLandingRunway = undefined;
        this.selectedWaypoint = undefined;
        this.selectMode = CJ4_FMC_LegsPage.SELECT_MODE.NONE;
        SimVar.SetSimVarValue("TRANSPONDER STATE:1", "number", 1);
        this.currentInput = undefined;
        this.previousInput = undefined;
        this._frameUpdates = 0;
        this._currentAP = undefined
        this._vnav = undefined;
        this._lnav = undefined;

        // modes
        this._isHdgActive = false;
        this._isNavActive = false;
        this._isLNavActive = true;
        this._isVsActive = false;
        this._isFlcActive = false;
    }
    get templateID() { return "CJ4_FMC"; }

    // Property for EXEC handling
    get fpHasChanged() { return this._fpHasChanged; }
    set fpHasChanged(value) {
        this._fpHasChanged = value;
        if (this._fpHasChanged) {
            this._templateRenderer.showExec();
        } else {
            this._templateRenderer.hideExec();
        }
    }

    connectedCallback() {
        super.connectedCallback();
        this.radioNav.init(NavMode.TWO_SLOTS);
        if (!this._registered) {
            RegisterViewListener("JS_LISTENER_KEYEVENT", () => {
                console.log("JS_LISTENER_KEYEVENT registered.");
                RegisterViewListener("JS_LISTENER_FACILITY", () => {
                    console.log("JS_LISTENER_FACILITY registered.");
                    this._registered = true;
                });
            });
        }
    }

    Init() {
        super.Init();

        // Maybe this gets rid of slowdown on first fpln mod
        this.flightPlanManager.copyCurrentFlightPlanInto(1);

        // init WT_FMC_Renderer.js
        this._templateRenderer = new WT_FMC_Renderer(this);

        this.maxCruiseFL = 450;
        this.onFplan = () => { CJ4_FMC_RoutePage.ShowPage1(this); };
        this.onLegs = () => { CJ4_FMC_LegsPage.ShowPage1(this); };
        this.onIdx = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(this); };
        this.onDepArr = () => { CJ4_FMC_DepArrPage.ShowPage1(this); };
        this.onDsplMenu = () => { CJ4_FMC_DsplMenuPage.ShowPage1(this); };
        this.onPerf = () => { CJ4_FMC_PerfInitPage.ShowPage1(this); };
        this.onMfdAdv = () => { CJ4_FMC_MfdAdvPage.ShowPage1(this); };
        this.onTun = () => { CJ4_FMC_NavRadioPage.ShowPage1(this); };
        this.onExec = () => {
            this.messageBox = "Working . . .";
            if (this.onExecPage) {
                console.log("if this.onExecPage");
                this.onExecPage();
            }
            else {
                // console.log("onExec Else");
                this._isRouteActivated = false;
                // console.log("onExec else this._isRouteActivated = false");
                this.fpHasChanged = false;
                // console.log("onExec else this.fpHasChanged = false");
                this.messageBox = "";
                // console.log("onExec else this.messageBox.innerHTML");
                this._activatingDirectTo = false;
                // console.log("onExec else this._activatingDirectTo = false");
            }
        };
        this.onExecPage = undefined;
        this.onExecDefault = () => {
            if (this.getIsRouteActivated() && !this._activatingDirectTo) {
                // console.log("running this.getIsRouteActivated() && !this._activatingDirectTo");
                this.insertTemporaryFlightPlan(() => {
                    this.copyAirwaySelections();
                    this._isRouteActivated = false;
                    SimVar.SetSimVarValue("L:FMC_EXEC_ACTIVE", "number", 0);
                    // console.log("done with onExec insert temp");
                    this.fpHasChanged = false;
                    // console.log("this.fpHasChanged = false");
                    this.messageBox = "";
                    if (this.refreshPageCallback) {
                        this.refreshPageCallback();
                    }
                });
            }
            else {
                // console.log("running onExecDefault else");
                this.fpHasChanged = false;
                // console.log("fpHasChanged = false");
                this.messageBox = "";
                this._isRouteActivated = false;
                SimVar.SetSimVarValue("L:FMC_EXEC_ACTIVE", "number", 0);
                if (this.refreshPageCallback) {
                    this._activatingDirectTo = false;
                    this.fpHasChanged = false;
                    // console.log("Else refreshPageCallback");
                    this.refreshPageCallback();
                }
            }
            this.onMsg = () => { CJ4_FMC_VNavSetupPage.ShowPage6(this); };
            this._activatingDirectToExisting = false;
        };

        CJ4_FMC_InitRefIndexPage.ShowPage5(this);

        //Timer for periodic page refresh
        this._pageRefreshTimer = null;

        //Hijaack and amend the standard FMC logic to work with the PL21 TUNE page
        let initRadioNav = super.initRadioNav.bind(this);
        this.initRadioNav = (_boot) => {
            initRadioNav(_boot);
            this.initializeStandbyRadios(_boot);
        };

        // set persisted heading
        //SimVar.SetSimVarValue('K:HEADING_BUG_SET:1', 'degrees', WTDataStore.get("AP_HEADING", Simplane.getHeadingMagnetic()));
        this._isLNavActive = SimVar.GetSimVarValue("L:WT_CJ4_LNAV_MODE", "number") == 0;
        //set init values for AP
        this._isHdgActive = SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Boolean");
        this._isNavActive = SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "Boolean");
        this._isVsActive = SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean");
        this._isFlcActive = SimVar.GetSimVarValue("AUTOPILOT FLIGHT LEVEL CHANGE", "Boolean");
        SimVar.SetSimVarValue("L:WT_CJ4_HDG_ON", "number", (this._isHdgActive ? 1 : 0));
        SimVar.SetSimVarValue("L:WT_CJ4_NAV_ON", "number", (this._isNavActive ? 1 : 0));
        SimVar.SetSimVarValue("L:WT_CJ4_VS_ON", "number", (this._isVsActive ? 1 : 0));
        SimVar.SetSimVarValue("L:WT_CJ4_FLC_ON", "number", (this._isFlcActive ? 1 : 0));

        // get HideYoke        
        let yokeHide = WTDataStore.get('WT_CJ4_HideYoke', 1);
        SimVar.SetSimVarValue("L:XMLVAR_YOKEHidden1", "number", yokeHide);
        SimVar.SetSimVarValue("L:XMLVAR_YOKEHidden2", "number", yokeHide);

        const fuelWeight = SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "pounds");
        this.initialFuelLeft = Math.trunc(SimVar.GetSimVarValue("FUEL LEFT QUANTITY", "gallons") * fuelWeight);
        this.initialFuelRight = Math.trunc(SimVar.GetSimVarValue("FUEL RIGHT QUANTITY", "gallons") * fuelWeight);
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        this.updateAutopilot();
        this.adjustFuelConsumption();
        this.updateFlightLog();
        this.updateCabinLights();
        this.updatePersistentHeading();

        this._frameUpdates++;
        if (this._frameUpdates > 64000) this._frameUpdates = 0;
    }
    onInputAircraftSpecific(input) {
        console.log("CJ4_FMC.onInputAircraftSpecific input = '" + input + "'");
        this.previousInput = this.currentInput;
        this.currentInput = input;
        if (input === "LEGS") {
            if (this.onLegs) {
                this.onLegs();
            }
            return true;
        }
        if (input === "FPLN") {
            if (this.onFplan) {
                this.onFplan();
            }
            return true;
        }
        if (input === "DSPL_MENU") {
            if (this.onDsplMenu) {
                this.onDsplMenu();
            }
            return true;
        }
        if (input === "IDX") {
            if (this.onIdx) {
                this.onIdx();
            }
            return true;
        }
        if (input === "PERF") {
            if (this.onPerf) {
                this.onPerf();
            }
            return true;
        }
        if (input === "MFD_ADV") {
            if (this.onMfdAdv) {
                this.onMfdAdv();
            }
            return true;
        }
        if (input === "TUN") {
            if (this.onTun) {
                this.onTun();
            }
            return true;
        }
        if (input === "DIR") {
            CJ4_FMC_DirectToPage.ShowPage(this);
        }
        if (input === "EXEC") {
            if (this.onExec) {
                this.onExec();
            }
            return true;
        }
        if (input === "MSG") {
            if (this.onMsg) {
                this.onMsg();
            }
            return true;
        }

        return false;
    }

    //Overwrite of FMCMainDisplay to disable always settings nav hold to GPS mode
    updateRadioNavState() {
        if (this.isPrimary) {
            let radioNavOn = this.isRadioNavActive();
            if (radioNavOn != this._radioNavOn) {
                this._radioNavOn = radioNavOn;
                if (!radioNavOn)
                    this.initRadioNav(false);
                if (this.refreshPageCallback)
                    this.refreshPageCallback();
            }
            let apNavIndex = 1;
            let gpsDriven = true;
            let apprHold = SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "Bool");
            if (apprHold) {
                if (this.canSwitchToNav()) {
                    let navid = 0;
                    let ils = this.radioNav.getBestILSBeacon();
                    if (ils.id > 0) {
                        navid = ils.id;
                    }
                    else {
                        let vor = this.radioNav.getBestVORBeacon();
                        if (vor.id > 0) {
                            navid = vor.id;
                        }
                    }
                    if (navid > 0) {
                        apNavIndex = navid;
                        let hasFlightplan = Simplane.getAutopilotGPSActive();
                        let apprCaptured = Simplane.getAutoPilotAPPRCaptured();
                        if (apprCaptured || !hasFlightplan) {
                            gpsDriven = false;
                        }
                    }
                }
            }
            if (apNavIndex != this._apNavIndex) {
                SimVar.SetSimVarValue("K:AP_NAV_SELECT_SET", "number", apNavIndex);
                this._apNavIndex = apNavIndex;
            }
        }
    }

    setMsg(value = "") {
        this._msg = value;
        this._templateRenderer.setMsg(value);
    }

    clearDisplay() {
        super.clearDisplay();
        this._templateRenderer.clearDisplay.apply(this);
        this.onPrevPage = EmptyCallback.Void;
        this.onNextPage = EmptyCallback.Void;

        this.unregisterPeriodicPageRefresh();
    }

    getOrSelectWaypointByIdent(ident, callback) {
        this.dataManager.GetWaypointsByIdent(ident).then((waypoints) => {
            const uniqueWaypoints = new Map();
            waypoints.forEach(wp => {
                if (wp) {
                    uniqueWaypoints.set(wp.icao, wp);
                }
            });
            waypoints = [...uniqueWaypoints.values()];
            if (!waypoints || waypoints.length === 0) {
                return callback(undefined);
            }
            if (waypoints.length === 1) {
                this.facilityLoader.UpdateFacilityInfos(waypoints[0]).then(() => {
                    return callback(waypoints[0]);
                });
            } else {
                CJ4_FMC_SelectWptPage.ShowPage(this, waypoints, ident, selectedWaypoint => {
                    this.facilityLoader.UpdateFacilityInfos(selectedWaypoint).then(() => {
                        return callback(selectedWaypoint);
                    });
                });
            }
        });
    }
    updateSideButtonActiveStatus() {
    }
    getIsRouteActivated() {
        return this._isRouteActivated;
    }
    activateRoute(callback = EmptyCallback.Void) {
        this._isRouteActivated = true;
        this.fpHasChanged = true;
        SimVar.SetSimVarValue("L:FMC_EXEC_ACTIVE", "number", 1);
        callback();
    }
    //function added to set departure enroute transition index
    setDepartureEnrouteTransitionIndex(departureEnrouteTransitionIndex, callback = EmptyCallback.Boolean) {
        this.ensureCurrentFlightPlanIsTemporary(() => {
            this.flightPlanManager.setDepartureEnRouteTransitionIndex(departureEnrouteTransitionIndex, () => {
                callback(true);
            });
        });
    }
    //function added to set arrival runway transition index
    setArrivalRunwayTransitionIndex(arrivalRunwayTransitionIndex, callback = EmptyCallback.Boolean) {
        this.ensureCurrentFlightPlanIsTemporary(() => {
            this.flightPlanManager.setArrivalRunwayIndex(arrivalRunwayTransitionIndex, () => {
                callback(true);
            });
        });
    }
    //function added to set arrival and runway transition
    setArrivalAndRunwayIndex(arrivalIndex, enrouteTransitionIndex, callback = EmptyCallback.Boolean) {
        this.ensureCurrentFlightPlanIsTemporary(() => {
            console.log("Setting Landing Runway");
            let landingRunway = this.flightPlanManager.getApproachRunway();
            console.log("Set Landing Runway");
            this.flightPlanManager.setArrivalProcIndex(arrivalIndex, () => {
                console.log("Set Arrival Procedure Index");
                this.flightPlanManager.setArrivalEnRouteTransitionIndex(enrouteTransitionIndex, () => {
                    console.log("Set Enroute Transition Index");
                    if (landingRunway) {
                        console.log("If Landing Runway");
                        let arrival = this.flightPlanManager.getArrival();
                        let arrivalRunwayIndex = arrival.runwayTransitions.findIndex(t => {
                            return t.name.indexOf(landingRunway.designation) != -1;
                        });
                        if (arrivalRunwayIndex >= -1) {
                            console.log("Setting Arrival Runway Index");
                            return this.flightPlanManager.setArrivalRunwayIndex(arrivalRunwayIndex, () => {
                                return callback(true);
                            });
                        }
                    }
                    return callback(true);
                });
            });
        });
    }

    updateAutopilot() {
        let now = performance.now();
        let dt = now - this._lastUpdateAPTime;
        this._lastUpdateAPTime = now;

        if (isFinite(dt)) {
            this.updateAutopilotCooldown -= dt;
        }
        if (SimVar.GetSimVarValue("L:AIRLINER_FMC_FORCE_NEXT_UPDATE", "number") === 1) {
            SimVar.SetSimVarValue("L:AIRLINER_FMC_FORCE_NEXT_UPDATE", "number", 0);
            this.updateAutopilotCooldown = -1;
        }
        if (this.updateAutopilotCooldown < 0) {
            let currentApMasterStatus = SimVar.GetSimVarValue("AUTOPILOT MASTER", "boolean");
            if (currentApMasterStatus != this._apMasterStatus) {
                this._apMasterStatus = currentApMasterStatus;
            }
            this._apHasDeactivated = !currentApMasterStatus && this._previousApMasterStatus;
            this._previousApMasterStatus = currentApMasterStatus;

            //RUN VNAV ALWAYS
            if (this._vnav === undefined) {
                this._vnav = new WT_BaseVnav(this.flightPlanManager);
                this._vnav.activate();
            }
            else {
                this._vnav.update();
            }

            //RUN LNAV ALWAYS
            if (this._lnav === undefined) {
                this._lnav = new WT_BaseLnav(this.flightPlanManager);
                this._lnav.activate();
            }
            else {
                this._lnav.update();
            }

            //PARSE CJ4 AP MODES
            const newIsVsActive = SimVar.GetSimVarValue("L:WT_CJ4_VS_ON", "number") == 1;
            const newIsFlcActive = SimVar.GetSimVarValue("L:WT_CJ4_FLC_ON", "number") == 1;
            const newIsHdgActive = SimVar.GetSimVarValue("L:WT_CJ4_HDG_ON", "number") == 1;
            const newIsNavActive = SimVar.GetSimVarValue("L:WT_CJ4_NAV_ON", "number") == 1;
            const newIsLnavActive = SimVar.GetSimVarValue("L:WT_CJ4_LNAV_MODE", "number") == 0;

            if (newIsHdgActive !== this._isHdgActive) {

                if (!newIsNavActive) { // nav is/becomes off
                    if (SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Boolean") !== newIsHdgActive) {
                        SimVar.SetSimVarValue("K:AP_PANEL_HEADING_HOLD", "number", 0);
                    }
                }

                if (newIsHdgActive) { // when turning hdg on
                    SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 1);
                }

                this._isHdgActive = newIsHdgActive;
            }

            if ((newIsNavActive !== this._isNavActive) || (newIsLnavActive !== this._isLNavActive)) {
                if (!this._isHdgActive) {
                    if (newIsNavActive) { // turning NAV on
                        if (newIsLnavActive) { // in lnav/FMS
                            SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 2);
                            if (!SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Boolean")) {
                                SimVar.SetSimVarValue("K:AP_PANEL_HEADING_HOLD", "number", 1);
                            }
                        } else {
                            SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 1);
                            if (!SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "Boolean")) {
                                SimVar.SetSimVarValue("K:AP_NAV1_HOLD", "number", 1);
                            }
                        }
                    } else {
                        if (SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "Boolean")) {
                            SimVar.SetSimVarValue("K:AP_NAV1_HOLD", "number", 0);
                        }
                        SimVar.SetSimVarValue("K:HEADING_SLOT_INDEX_SET", "number", 1);
                        if (SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Boolean")) {
                            SimVar.SetSimVarValue("K:AP_PANEL_HEADING_HOLD", "number", 0);
                        }
                    }
                }

                this._isNavActive = newIsNavActive;
                this._isLNavActive = newIsLnavActive;
            }

            const newSimVsValue = SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "number") == 1;

            if (newIsVsActive !== this._isVsActive) {
                if (!newIsFlcActive) {
                    if (newIsVsActive) {
                        //Coherent.call("AP_VS_VAR_SET_ENGLISH", 1, Simplane.getVerticalSpeed());
                        SimVar.SetSimVarValue("K:VS_SLOT_INDEX_SET", "number", 1);
                    }
                    if (newSimVsValue !== newIsVsActive) {
                        SimVar.SetSimVarValue("K:AP_PANEL_VS_HOLD", "number", 1);
                    }
                }
                this._isVsActive = newIsVsActive;
            } else if (this._isVsActive == true && newSimVsValue == false) {
                SimVar.SetSimVarValue("L:WT_CJ4_VS_ON", "number", 0);
                this._isVsActive = false;
            }

            const newSimFlcValue = SimVar.GetSimVarValue("AUTOPILOT FLIGHT LEVEL CHANGE", "number") == 1;
            if (newIsFlcActive !== this._isFlcActive) {
                if (!this._isVsActive) {
                    if (newSimFlcValue !== newIsFlcActive) {
                        SimVar.SetSimVarValue("K:FLIGHT_LEVEL_CHANGE", "number", 1);
                    }
                }
                this._isFlcActive = newIsFlcActive;
            } else if (newIsFlcActive == true && newSimFlcValue == false) {
                SimVar.SetSimVarValue("L:WT_CJ4_FLC_ON", "number", 0);
                this._isFlcActive = false;
            }

            const isVNAVActive = SimVar.GetSimVarValue("L:XMLVAR_VNAVButtonValue", "boolean") === 1;
            if (isVNAVActive) {
                // vnav turned on

                //ACTIVATE VNAV MODE
                if (this._currentAP === undefined) {
                    this._currentAP = new WT_VNavPathAutopilot(this.flightPlanManager);
                    this._currentAP.activate();
                }
                //UPDATE VNAV MODE
                else {
                    this._currentAP.update();
                }
            }
            else {
                if (this._currentAP) {
                    // vnav turned off, destroy it
                    this._currentAP.deactivate();
                    this._currentAP = undefined;
                }
            }

            SimVar.SetSimVarValue("SIMVAR_AUTOPILOT_AIRSPEED_MIN_CALCULATED", "knots", Simplane.getStallProtectionMinSpeed());
            SimVar.SetSimVarValue("SIMVAR_AUTOPILOT_AIRSPEED_MAX_CALCULATED", "knots", Simplane.getMaxSpeed(Aircraft.CJ4));

            // DONT DELETE: mach mode fix
            const machMode = Simplane.getAutoPilotMachModeActive();
            if (machMode) {
                const machAirspeed = Simplane.getAutoPilotMachHoldValue();
                Coherent.call("AP_MACH_VAR_SET", 0, parseFloat(machAirspeed.toFixed(2)));
            }

            this.updateAutopilotCooldown = this._apCooldown;
        }
    }
    //add new method to find correct runway designation (with leading 0)
    getRunwayDesignation(selectedRunway) {
        if (selectedRunway) {
            let selectedRunwayDesignation = new String(selectedRunway.designation);
            let selectedRunwayMod = new String(selectedRunwayDesignation.slice(-1));
            if (selectedRunwayMod == "L" || selectedRunwayMod == "C" || selectedRunwayMod == "R") {
                if (selectedRunwayDesignation.length == 2) {
                    this.selectedRunwayOutput = "0" + selectedRunwayDesignation;
                } else {
                    this.selectedRunwayOutput = selectedRunwayDesignation;
                }
            } else {
                if (selectedRunwayDesignation.length == 2) {
                    this.selectedRunwayOutput = selectedRunwayDesignation;
                } else {
                    this.selectedRunwayOutput = "0" + selectedRunwayDesignation;
                }
            }
        }
        return this.selectedRunwayOutput;
    }
    //end of new method to find runway designation

    /**
     * Registers a periodic page refresh with the FMC display.
     * @param {number} interval The interval, in ms, to run the supplied action.
     * @param {function} action An action to run at each interval. Can return a bool to indicate if the page refresh should stop.
     * @param {boolean} runImmediately If true, the action will run as soon as registered, and then after each
     * interval. If false, it will start after the supplied interval.
     */
    registerPeriodicPageRefresh(action, interval, runImmediately) {
        let refreshHandler = () => {
            let isBreak = action();
            if (isBreak) return;
            this._pageRefreshTimer = setTimeout(refreshHandler, interval);
        };

        if (runImmediately) {
            refreshHandler();
        }
        else {
            this._pageRefreshTimer = setTimeout(refreshHandler, interval);
        }
    }

    /**
     * Unregisters a periodic page refresh with the FMC display.
     */
    unregisterPeriodicPageRefresh() {
        if (this._pageRefreshTimer) {
            clearInterval(this._pageRefreshTimer);
        }
    }

    /**
     * Initializes the standby radios in the FMC.
     * @param {Boolean} isFirstBoot 
     */
    initializeStandbyRadios(isFirstBoot) {
        if (this.isPrimary) {
            if (isFirstBoot) {
                this.rcl1Frequency = this.radioNav.getVHFStandbyFrequency(this.instrumentIndex, 1);
                this.pre2Frequency = this.radioNav.getVHFStandbyFrequency(this.instrumentIndex, 2);
            }
            else {
                if (Math.abs(this.radioNav.getVHFStandbyFrequency(this.instrumentIndex, 1) - this.rcl1Frequency) > 0.005) {
                    this.radioNav.setVHFStandbyFrequency(this.instrumentIndex, 1, this.rcl1Frequency);
                }
                if (Math.abs(this.radioNav.getVHFStandbyFrequency(this.instrumentIndex, 2) - this.pre2Frequency) > 0.005) {
                    this.radioNav.setVHFStandbyFrequency(this.instrumentIndex, 2, this.pre2Frequency);
                }
            }
        }
    }

    /**
     * Adjusts fuel consumption by returning fuel to the tanks and updates the
     * local fuel consumption lvar.
     */
    adjustFuelConsumption() {

        const leftFuelQty = SimVar.GetSimVarValue("FUEL LEFT QUANTITY", "gallons");
        const rightFuelQty = SimVar.GetSimVarValue("FUEL RIGHT QUANTITY", "gallons");

        if (this.previousRightFuelQty === undefined && this.previousLeftFuelQty === undefined) {
            this.previousLeftFuelQty = leftFuelQty;
            this.previousRightFuelQty = rightFuelQty;
        }
        else {
            const thrustLeft = SimVar.GetSimVarValue("TURB ENG JET THRUST:1", "pounds");
            const thrustRight = SimVar.GetSimVarValue("TURB ENG JET THRUST:2", "pounds");

            const pphLeft = SimVar.GetSimVarValue("ENG FUEL FLOW PPH:1", "pounds per hour");
            const pphRight = SimVar.GetSimVarValue("ENG FUEL FLOW PPH:2", "pounds per hour");

            const leftFuelUsed = this.previousLeftFuelQty - leftFuelQty;
            const rightFuelUsed = this.previousRightFuelQty - rightFuelQty;

            const mach = SimVar.GetSimVarValue("AIRSPEED MACH", "mach");
            const tsfc = Math.pow(1 + (1.2 * mach), mach) * 0.58; //Inspiration: https://onlinelibrary.wiley.com/doi/pdf/10.1002/9780470117859.app4

            const leftFuelFlow = pphLeft > 5 ? Math.max(thrustLeft * tsfc, 150) : 0;
            const rightFuelFlow = pphRight > 5 ? Math.max(thrustRight * tsfc, 150) : 0;

            SimVar.SetSimVarValue("L:CJ4 FUEL FLOW:1", "pounds per hour", leftFuelFlow);
            SimVar.SetSimVarValue("L:CJ4 FUEL FLOW:2", "pounds per hour", rightFuelFlow);

            if ((rightFuelUsed > 0.005 && rightFuelUsed < 1) || (leftFuelUsed > 0.005 && rightFuelUsed < 1)) {

                let leftCorrectionFactor = 1;
                let rightCorrectionFactor = 1;

                if (pphLeft > 0) {
                    leftCorrectionFactor = leftFuelFlow / pphLeft;
                }

                if (pphRight > 0) {
                    rightCorrectionFactor = rightFuelFlow / pphRight;
                }

                const newLeftFuelQty = this.previousLeftFuelQty - (leftFuelUsed * leftCorrectionFactor);
                const newRightFuelQty = this.previousRightFuelQty - (rightFuelUsed * rightCorrectionFactor);

                SimVar.SetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "gallons", newLeftFuelQty);
                SimVar.SetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "gallons", newRightFuelQty);

                this.previousLeftFuelQty = newLeftFuelQty;
                this.previousRightFuelQty = newRightFuelQty;
            }
            else {
                this.previousLeftFuelQty = leftFuelQty;
                this.previousRightFuelQty = rightFuelQty;
            }
        }
    }

    // Copy airway selections from temporary to active flightplan
    copyAirwaySelections() {
        let temporaryFPWaypoints = this.flightPlanManager.getWaypoints(1);
        let activeFPWaypoints = this.flightPlanManager.getWaypoints(0);
        for (let i = 0; i < activeFPWaypoints.length; i++) {
            if (activeFPWaypoints[i].infos && temporaryFPWaypoints[i] && activeFPWaypoints[i].icao === temporaryFPWaypoints[i].icao && temporaryFPWaypoints[i].infos) {
                activeFPWaypoints[i].infos.airwayIn = temporaryFPWaypoints[i].infos.airwayIn;
                activeFPWaypoints[i].infos.airwayOut = temporaryFPWaypoints[i].infos.airwayOut;
            }
        }
    }

    updatePersistentHeading() {
        if (this._frameUpdates % 500 == 499) {
            WTDataStore.set("AP_HEADING", SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK DIR", "degree"));
        }
    }

    updateCabinLights() {
        if (this._frameUpdates % 100 == 0) {
            // TODO should go somewhere else later
            let batteryOn = SimVar.GetSimVarValue("ELECTRICAL MASTER BATTERY", "bool");
            if (!batteryOn) {
                CJ4_FMC_ModSettingsPage.setPassCabinLights(CJ4_FMC_ModSettingsPage.LIGHT_MODE.OFF);
            } else {
                CJ4_FMC_ModSettingsPage.setPassCabinLights(WTDataStore.get('passCabinLights', CJ4_FMC_ModSettingsPage.LIGHT_MODE.ON));
            }
        }
    }

    updateFlightLog() {
        const takeOffTime = SimVar.GetSimVarValue("L:TAKEOFF_TIME", "seconds");
        const landingTime = SimVar.GetSimVarValue("L:LANDING_TIME", "seconds");
        const onGround = SimVar.GetSimVarValue("SIM ON GROUND", "Bool");
        const altitude = SimVar.GetSimVarValue("PLANE ALT ABOVE GROUND", "number");
        const zuluTime = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");

        // Update takeoff time
        if (!takeOffTime) {
            if (!onGround && altitude > 15) {
                if (zuluTime) {
                    SimVar.SetSimVarValue("L:TAKEOFF_TIME", "seconds", zuluTime);
                }
            }
        }
        else if (takeOffTime && takeOffTime > 0 && landingTime && landingTime > 0) {
            if (!onGround && altitude > 15) {
                if (zuluTime) {
                    SimVar.SetSimVarValue("L:TAKEOFF_TIME", "seconds", zuluTime);
                }
                SimVar.SetSimVarValue("L:LANDING_TIME", "seconds", 0); // Reset landing time
                SimVar.SetSimVarValue("L:ENROUTE_TIME", "seconds", 0); // Reset enroute time
            }
        }


        if (takeOffTime && takeOffTime > 0) {
            // Update landing time
            if (onGround && (!landingTime || landingTime == 0)) {
                if (zuluTime) {
                    SimVar.SetSimVarValue("L:LANDING_TIME", "seconds", zuluTime);
                }
            }
            // Update enroute time
            if (!landingTime || landingTime == 0) {
                const enrouteTime = zuluTime - takeOffTime;
                SimVar.SetSimVarValue("L:ENROUTE_TIME", "seconds", enrouteTime);
            }
        }
    }
}


CJ4_FMC.VSPEED_STATUS = {
    NONE: 0,
    INPROGRESS: 1,
    SENT: 2,
};

registerInstrument("cj4-fmc", CJ4_FMC);
//# sourceMappingURL=CJ4_FMC.js.map
