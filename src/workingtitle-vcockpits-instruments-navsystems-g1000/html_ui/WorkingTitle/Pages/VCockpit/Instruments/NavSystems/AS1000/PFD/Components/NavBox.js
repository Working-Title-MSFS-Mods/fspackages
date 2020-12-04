class AS1000_PFD_Nav_Box_Model {
    /**
     * @param {WT_Unit_Chooser} unitChooser 
     * @param {FlightPlanManager} flightPlanManager 
     * @param {WT_Flight_Sim_Events} events 
     * @param {WT_Flight_Plan_Active_Leg_Information} activeLegInformation 
     */
    constructor(unitChooser, flightPlanManager, events, activeLegInformation) {
        this.unitChooser = unitChooser;
        this.flightPlanManager = flightPlanManager;
        this.events = events;

        this.leg = {
            from: new Subject(""),
            symbol: new Subject(""),
            to: new Subject(""),
            distance: new Subject(null),
            bearing: new Subject(null),
        };
        this.autopilot = {
            lateral: {
                armed: new Subject(""),
                active: new Subject(""),
            },
            status: new Subject(false),
            vertical: {
                active: new Subject(""),
                reference: new Subject(""),
                armed: new Subject(""),
            },
        };
        this.updateCounter = 0;

        this.onDisabled = new WT_Event();
        this.events.subscribe(event => {
            switch (event) {
                case "Autopilot_Manual_Off":
                    this.onDisabled.fire("manual");
                    break;
                case "Autopilot_Disc":
                    this.onDisabled.fire("disconnected");
                    break;
            }
        })

        activeLegInformation.activeLeg.subscribe(leg => {
            this.leg.from.value = leg.from;
            this.leg.symbol.value = leg.symbol;
            this.leg.to.value = leg.to;
            this.leg.distance.value = leg.distance;
            this.leg.bearing.value = leg.bearing;
        });
    }
    updateVerticalActive() {
        if (SimVar.GetSimVarValue("AUTOPILOT PITCH HOLD", "Boolean")) {
            this.autopilot.vertical.active.value = "PIT";
            this.autopilot.vertical.reference.value = "";
        } else if (SimVar.GetSimVarValue("AUTOPILOT AIRSPEED HOLD", "Boolean")) {
            this.autopilot.vertical.active.value = "FLC";
            if (SimVar.GetSimVarValue("L:XMLVAR_AirSpeedIsInMach", "Boolean")) {
                this.autopilot.vertical.reference.value = `M${fastToFixed(SimVar.GetSimVarValue("AUTOPILOT AIRSPEED HOLD VAR", "mach"), 3)}`;
            } else {
                this.autopilot.vertical.reference.value = this.unitChooser.chooseSpeed(`${fastToFixed(SimVar.GetSimVarValue("AUTOPILOT AIRSPEED HOLD VAR", "kilometers per hour"), 0)}KPH`, `${fastToFixed(SimVar.GetSimVarValue("AUTOPILOT AIRSPEED HOLD VAR", "knots"), 0)}KT`);
            }
        } else if (SimVar.GetSimVarValue("AUTOPILOT FLIGHT LEVEL CHANGE", "Boolean")) {
            this.autopilot.vertical.active.value = "FLC";
            this.autopilot.vertical.reference.value = `${fastToFixed(SimVar.GetSimVarValue("AUTOPILOT AIRSPEED HOLD VAR", "knots"), 0)}KT`;
        } else if (SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK", "Boolean")) {
            if (SimVar.GetSimVarValue("AUTOPILOT ALTITUDE ARM", "Boolean")) {
                this.autopilot.vertical.active.value = "ALT*";
            } else {
                this.autopilot.vertical.active.value = "ALT";
            }
            this.autopilot.vertical.reference.value = `${fastToFixed(SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR:2", "feet"), 0)}FT`;
        } else if (SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean")) {
            this.autopilot.vertical.active.value = "VS";
            this.autopilot.vertical.reference.value = this.unitChooser.chooseSpeed(`${fastToFixed(SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR", "meters per minute"), 0)}MPM`, `${fastToFixed(SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR", "feet per minute"), 0)}FPM`);
        } else if (SimVar.GetSimVarValue("AUTOPILOT GLIDESLOPE ACTIVE", "Boolean")) {
            this.autopilot.vertical.active.value = "GS";
            this.autopilot.vertical.reference.value = "";
        } else {
            this.autopilot.vertical.active.value = "";
            this.autopilot.vertical.reference.value = "";
        }
    }
    updateVerticalArmed() {
        if (SimVar.GetSimVarValue("AUTOPILOT ALTITUDE ARM", "Boolean")) {
            this.autopilot.vertical.armed.value = "ALT";
        } else if (SimVar.GetSimVarValue("AUTOPILOT GLIDESLOPE ARM", "Boolean")) {
            this.autopilot.vertical.armed.value = "GS";
        } else if (SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "Boolean")) {
            this.autopilot.vertical.armed.value = "ALTS";
        } else {
            this.autopilot.vertical.armed.value = "";
        }
    }
    updateStatus() {
        this.autopilot.status.value = SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool");
    }
    updateLateralActive() {
        if (SimVar.GetSimVarValue("AUTOPILOT WING LEVELER", "Boolean")) {
            this.autopilot.lateral.active.value = "LVL";
        } else if (SimVar.GetSimVarValue("AUTOPILOT BANK HOLD", "Boolean")) {
            this.autopilot.lateral.active.value = "ROL";
        } else if (SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Boolean")) {
            this.autopilot.lateral.active.value = "HDG";
        } else if (SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "Boolean")) {
            if (SimVar.GetSimVarValue("GPS DRIVES NAV1", "Boolean")) {
                this.autopilot.lateral.active.value = "GPS";
            } else {
                if (SimVar.GetSimVarValue("NAV HAS LOCALIZER:" + SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "Number"), "Boolean")) {
                    this.autopilot.lateral.active.value = "LOC";
                } else {
                    this.autopilot.lateral.active.value = "VOR";
                }
            }
        } else if (SimVar.GetSimVarValue("AUTOPILOT BACKCOURSE HOLD", "Boolean")) {
            this.autopilot.lateral.active.value = "BC";
        } else if (SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "Boolean")) {
            if (SimVar.GetSimVarValue("GPS DRIVES NAV1", "Boolean")) {
                this.autopilot.lateral.active.value = "GPS";
            } else {
                if (SimVar.GetSimVarValue("NAV HAS LOCALIZER:" + SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "Number"), "Boolean")) {
                    this.autopilot.lateral.active.value = "LOC";
                } else {
                    this.autopilot.lateral.active.value = "VOR";
                }
            }
        } else {
            this.autopilot.lateral.active.value = "";
        }
    }
    updateLateralArmed() {
        if (SimVar.GetSimVarValue("AUTOPILOT HEADING LOCK", "Bool") || SimVar.GetSimVarValue("AUTOPILOT WING LEVELER", "Bool")) {
            if (SimVar.GetSimVarValue("AUTOPILOT NAV1 LOCK", "Boolean")) {
                if (SimVar.GetSimVarValue("GPS DRIVES NAV1", "Boolean")) {
                    this.autopilot.lateral.armed.value = "GPS";
                } else {
                    if (SimVar.GetSimVarValue("NAV HAS LOCALIZER:" + SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "Number"), "Boolean")) {
                        this.autopilot.lateral.armed.value = "LOC";
                    } else {
                        this.autopilot.lateral.armed.value = "VOR";
                    }
                }
            } else if (SimVar.GetSimVarValue("AUTOPILOT BACKCOURSE HOLD", "Boolean")) {
                this.autopilot.lateral.armed.value = "BC";
            } else if (SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "Boolean")) {
                if (SimVar.GetSimVarValue("GPS DRIVES NAV1", "Boolean")) {
                    this.autopilot.lateral.armed.value = "GPS";
                } else {
                    if (SimVar.GetSimVarValue("NAV HAS LOCALIZER:" + SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "Number"), "Boolean")) {
                        this.autopilot.lateral.armed.value = "LOC";
                    } else {
                        this.autopilot.lateral.armed.value = "VOR";
                    }
                }
            } else {
                this.autopilot.lateral.armed.value = "";
            }
        } else {
            this.autopilot.lateral.armed.value = "";
        }
    }
    updateLeg() {
        let flightPlanActive = SimVar.GetSimVarValue("GPS IS ACTIVE FLIGHT PLAN", "boolean");
        if (flightPlanActive) {
            var legToName = SimVar.GetSimVarValue("GPS WP NEXT ID", "string");
            if (!legToName)
                legToName = "---";
            this.leg.to.value = legToName;
            if (this.flightPlanManager.getIsDirectTo()) {
                if (this.currentLegSymbol)
                    this.leg.symbol.value = '<img src="/Pages/VCockpit/Instruments/NavSystems/Shared/Images/GPS/direct_to.bmp" class="imgSizeM"/>';
                if (this.currentLegFrom)
                    this.leg.from.value = "";
            } else {
                var legFromName = SimVar.GetSimVarValue("GPS WP PREV ID", "string");
                if (!legFromName)
                    legFromName = "---";
                this.leg.from.value = legFromName;
                this.leg.symbol.value = '<img src="/Pages/VCockpit/Instruments/NavSystems/Shared/Images/GPS/course_to.bmp" class="imgSizeM"/>';
            }

            let distance = this.unitChooser.chooseDistance(SimVar.GetSimVarValue("GPS WP DISTANCE", "kilometers"), SimVar.GetSimVarValue("GPS WP DISTANCE", "nautical miles"));
            this.leg.distance.value = distance.toFixed(distance < 10 ? 1 : 0) + this.unitChooser.chooseDistance("KM", "NM");
            this.leg.bearing.value = Math.round(SimVar.GetSimVarValue("GPS WP BEARING", "degree")) + "°";
        }
        else {
            this.leg.from.value = "";
            this.leg.symbol.value = "";
            this.leg.to.value = "";
            this.leg.distance.value = this.unitChooser.chooseDistance("__._KM", "__._NM");
            this.leg.bearing.value = "___°";
        }
    }
    update(dt) {
        switch (this.updateCounter) {
            case 0: this.updateStatus(); break;
            case 1: this.updateVerticalActive(); break;
            case 2: this.updateVerticalArmed(); break;
            case 3: this.updateLateralActive(); break;
            case 4: this.updateLateralArmed(); break;
            //case 5: this.updateLeg(); break;
        }
        this.updateCounter = (this.updateCounter + 1) % 6;
    }
}

class AS1000_PFD_Nav_Box_View extends WT_HTML_View {
    constructor() {
        super();
        this.disableType = "disconnected";
    }
    /**
     * @param {AS1000_PFD_Nav_Box_Model} model 
     */
    setModel(model) {
        model.autopilot.vertical.active.subscribe(value => this.elements.apVerticalActive.innerHTML = value);
        model.autopilot.vertical.armed.subscribe(value => this.elements.apVerticalArmed.innerHTML = value);
        model.autopilot.vertical.reference.subscribe(value => this.elements.apVerticalReference.innerHTML = value);

        model.autopilot.lateral.armed.subscribe(value => this.elements.apLateralArmed.innerHTML = value);
        model.autopilot.lateral.active.subscribe(value => this.elements.apLateralActive.innerHTML = value);

        model.autopilot.status.subscribe(this.updateAutoPilotStatus.bind(this));

        model.leg.from.subscribe(value => this.elements.legFrom.innerHTML = value);
        model.leg.to.subscribe(value => this.elements.legTo.innerHTML = value);
        model.leg.symbol.subscribe(value => this.elements.legSymbol.innerHTML = `<img src="${value}" />`);

        model.unitChooser.observeDistance(
            model.leg.distance.observable.pipe(
                WT_RX.distinctMap(distance => distance !== null ? `${distance.toFixed(distance < 10 ? 1 : 0)}KM` : "")
            ),
            model.leg.distance.observable.pipe(
                rxjs.operators.map(v => v * 0.539957),
                WT_RX.distinctMap(distance => distance !== null ? `${distance.toFixed(distance < 10 ? 1 : 0)}NM` : "")
            )
        ).subscribe(text => this.elements.legDistance.innerHTML = text);

        model.leg.bearing.observable.pipe(
            WT_RX.distinctMap(bearing => bearing !== null ? `${bearing.toFixed(0)}°` : "")
        ).subscribe(text => this.elements.legBearing.innerHTML = text);

        model.onDisabled.subscribe(type => {
            this.disableType = type;
            setTimeout(() => this.disableType = "disconnected", 200);
        });
    }
    updateAutoPilotStatus(status) {
        if (status) {
            clearTimeout(this.apStatusTimeout);
            this.elements.apStatus.setAttribute("status", "enabled");
        } else {
            switch (this.disableType) {
                case "manual": {
                    clearTimeout(this.apStatusTimeout);
                    this.elements.apStatus.setAttribute("status", "disabling");
                    this.apStatusTimeout = setTimeout(() => {
                        this.elements.apStatus.setAttribute("status", "disabled");
                    }, 5000);
                    break;
                }
                case "disconnected": {
                    clearTimeout(this.apStatusTimeout);
                    this.elements.apStatus.setAttribute("status", "disconnected");
                    this.apStatusTimeout = setTimeout(() => {
                        this.elements.apStatus.setAttribute("status", "disabled");
                    }, 5000);
                    break;
                }
            }
        }
    }
}
customElements.define("g1000-nav-box", AS1000_PFD_Nav_Box_View);