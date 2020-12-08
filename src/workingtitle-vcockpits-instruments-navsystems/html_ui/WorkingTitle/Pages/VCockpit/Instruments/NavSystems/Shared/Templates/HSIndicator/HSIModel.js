class HSIIndicatorModel {
    /**
     * @param {rxjs.Observable} update$ 
     * @param {WT_Plane_State} planeState 
     */
    constructor(update$, planeState) {
        this.flightPhase = new Subject();
        this.cdi = {
            sourceId: new Subject(null),
            source: new Subject("FMS"),
            bearing: new Subject(0),
            bearingAmount: new Subject(0),
            deviation: new Subject(0),
            deviationAmount: new Subject(0),
            displayDeviation: new Subject(false),
            toFrom: new Subject("0")
        };
        this.bearing = [
            {
                ids: [0, 1, 3, 4],
                sourceId: new Subject(),
                source: new Subject(""),
                ident: new Subject(""),
                distance: new Subject(null),
                bearing: new Subject(0),
                bearingGoal: 0,
                display: new Subject(),
                displayNeedle: new Subject(false),
            },
            {
                ids: [0, 2, 3, 4],
                sourceId: new Subject(),
                source: new Subject(""),
                ident: new Subject(""),
                distance: new Subject(null),
                bearing: new Subject(0),
                bearingGoal: 0,
                display: new Subject(),
                displayNeedle: new Subject(false),
            }
        ];
        this.dme = {
            sourceId: new Subject(),
            source: new Subject(""),
            display: new Subject(false),
            ident: new Subject(""),
            distance: new Subject(null),
        };

        this.crossTrackFullError = 2;
        this.crossTrackGoal = 0;
        this.crossTrackCurrent = 0;

        this.bearingGoal = 0;
        this.bearingCurrent = 0;

        SimVar.SetSimVarValue("L:PFD_DME_Displayed", "number", WTDataStore.get("HSI.ShowDme", false) ? 1 : 0);
        SimVar.SetSimVarValue("L:PFD_BRG1_Source", "number", WTDataStore.get("HSI.Brg1Src", 0));
        SimVar.SetSimVarValue("L:PFD_BRG2_Source", "number", WTDataStore.get("HSI.Brg2Src", 0));

        this.updateIndex = 0;
        this.lastUpdate = performance.now() / 1000;

        this.rotation = planeState.heading;
        this.track = planeState.inAir.pipe(
            rxjs.operators.switchMap(inAir => inAir ? WT_RX.observeSimVar(update$, "GPS GROUND MAGNETIC TRACK", "degrees") : rxjs.of(0))
        );
        this.heading = WT_RX.observeSimVar(update$, "AUTOPILOT HEADING LOCK DIR", "degree");
        this.turnRate = planeState.turnRate;
    }
    updateCdi(dt) {
        let now = performance.now() / 1000;
        dt = now - this.lastUpdate;
        this.lastUpdate = now;

        this.cdi.sourceId.value = SimVar.GetSimVarValue("GPS DRIVES NAV1", "Bool") ? 3 : SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "Number");
        switch (this.cdi.sourceId.value) {
            case 1:
                this.cdi.displayDeviation.value = SimVar.GetSimVarValue("NAV HAS NAV:1", "boolean") != 0;
                if (SimVar.GetSimVarValue("NAV HAS LOCALIZER:1", "Bool")) {
                    this.cdi.source.value = "LOC1";
                    this.bearingGoal = SimVar.GetSimVarValue("NAV LOCALIZER:1", "degree");
                }
                else {
                    this.cdi.source.value = "VOR1";
                    this.bearingGoal = SimVar.GetSimVarValue("NAV OBS:1", "degree");
                }
                this.crossTrackGoal = SimVar.GetSimVarValue("NAV CDI:1", "number") / 127;
                this.cdi.toFrom.value = SimVar.GetSimVarValue("NAV TOFROM:1", "Enum");
                break;
            case 2:
                this.cdi.displayDeviation.value = SimVar.GetSimVarValue("NAV HAS NAV:2", "boolean") != 0;
                if (SimVar.GetSimVarValue("NAV HAS LOCALIZER:2", "Bool")) {
                    this.cdi.source.value = "LOC2";
                    this.bearingGoal = SimVar.GetSimVarValue("NAV LOCALIZER:2", "degree");
                }
                else {
                    this.cdi.source.value = "VOR2";
                    this.bearingGoal = SimVar.GetSimVarValue("NAV OBS:2", "degree");
                }
                this.crossTrackGoal = SimVar.GetSimVarValue("NAV CDI:2", "number") / 127;
                this.cdi.toFrom.value = SimVar.GetSimVarValue("NAV TOFROM:2", "Enum");
                break;
            case 3:
                this.cdi.source.value = "FMS";
                this.cdi.displayDeviation.value = SimVar.GetSimVarValue("GPS WP NEXT ID", "string") != "";
                this.bearingGoal = SimVar.GetSimVarValue("GPS WP DESIRED TRACK", "degree");
                switch (SimVar.GetSimVarValue("L:GPS_Current_Phase", "number")) {
                    case 1:
                        this.crossTrackFullError = 0.3;
                        this.flightPhase.value = "DPRT";
                        break;
                    case 2:
                        this.crossTrackFullError = 1.0;
                        this.flightPhase.value = "TERM";
                        break;
                    case 4:
                        this.crossTrackFullError = 4.0;
                        this.flightPhase.value = "OCN";
                        break;
                    default:
                        this.crossTrackFullError = 2.0;
                        this.flightPhase.value = "ENR";
                        break;
                }
                this.cdi.deviation.value = parseFloat(SimVar.GetSimVarValue("GPS WP CROSS TRK", "nautical mile"));
                this.crossTrackGoal = this.cdi.deviation.value / this.crossTrackFullError;
                this.cdi.toFrom.value = 1;
                break;
        }

        this.crossTrackGoal = Math.max(Math.min(this.crossTrackGoal, 1), -1);

        this.crossTrackCurrent += (this.crossTrackGoal - this.crossTrackCurrent) * Math.min(1, 1 - Math.pow(0.01, dt * 3));
        this.bearingCurrent += this.getAngleDelta(this.bearingCurrent, this.bearingGoal) * Math.min(1, 1 - Math.pow(0.01, dt * 3));
        this.bearing[0].bearing.value = this.bearing[0].bearing.value + this.getAngleDelta(this.bearing[0].bearing.value, this.bearing[0].bearingGoal) * Math.min(1, 1 - Math.pow(0.01, dt));
        this.bearing[1].bearing.value = this.bearing[1].bearing.value + this.getAngleDelta(this.bearing[1].bearing.value, this.bearing[1].bearingGoal) * Math.min(1, 1 - Math.pow(0.01, dt));

        this.cdi.deviationAmount.value = this.crossTrackCurrent;
        this.cdi.bearing.value = this.bearingGoal;
        this.cdi.bearingAmount.value = this.bearingCurrent;
    }
    getAngleDelta(a, b) {
        return (b - a + 180) % 360 - 180;
    }
    updateBearing(id, bearing) {
        bearing.sourceId.value = SimVar.GetSimVarValue(`L:PFD_BRG${id}_Source`, "Number");
        bearing.display.value = bearing.sourceId.value != 0;
        switch (bearing.sourceId.value) {
            case 1:
                bearing.source.value = "NAV1";
                if (SimVar.GetSimVarValue("NAV HAS NAV:1", "Bool")) {
                    bearing.ident.value = SimVar.GetSimVarValue("NAV IDENT:1", "string");
                    bearing.distance.value = SimVar.GetSimVarValue("NAV HAS DME:1", "Bool") ? parseFloat(SimVar.GetSimVarValue("NAV DME:1", "nautical miles")) : null;
                    bearing.bearingGoal = (180 + SimVar.GetSimVarValue("NAV RADIAL:1", "degree")) % 360;
                    bearing.displayNeedle.value = true;
                }
                else {
                    bearing.ident.value = null;
                    bearing.distance.value = null;
                    bearing.displayNeedle.value = false;
                    //bearing.bearing.value = "";
                }
                break;
            case 2:
                bearing.source.value = "NAV2";
                if (SimVar.GetSimVarValue("NAV HAS NAV:2", "Bool")) {
                    bearing.ident.value = SimVar.GetSimVarValue("NAV IDENT:2", "string");
                    bearing.distance.value = SimVar.GetSimVarValue("NAV HAS DME:2", "Bool") ? parseFloat(SimVar.GetSimVarValue("NAV DME:2", "nautical miles")) : null;
                    bearing.bearingGoal = (180 + SimVar.GetSimVarValue("NAV RADIAL:2", "degree")) % 360;
                    bearing.displayNeedle.value = true;
                }
                else {
                    bearing.ident.value = null;
                    bearing.distance.value = null;
                    bearing.displayNeedle.value = false;
                    //bearing.bearing.value = "";
                }
                break;
            case 3:
                bearing.source.value = "GPS";
                bearing.ident.value = SimVar.GetSimVarValue("GPS WP NEXT ID", "string");
                bearing.distance.value = parseFloat(SimVar.GetSimVarValue("GPS WP DISTANCE", "nautical miles"));
                bearing.bearingGoal = SimVar.GetSimVarValue("GPS WP BEARING", "degree");
                bearing.displayNeedle.value = SimVar.GetSimVarValue("GPS WP NEXT ID", "string") != "";
                break;
            case 4:
                bearing.source.value = "ADF";
                bearing.distance.value = null;
                if (SimVar.GetSimVarValue("ADF SIGNAL:1", "number")) {
                    bearing.ident.value = parseFloat(SimVar.GetSimVarValue("ADF ACTIVE FREQUENCY:1", "KHz")).toFixed(1);
                    bearing.bearingGoal = (SimVar.GetSimVarValue("ADF RADIAL:1", "degree") + SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree")) % 360;
                    bearing.displayNeedle.value = true;
                }
                else {
                    bearing.ident.value = null;
                    bearing.displayNeedle.value = false;
                }
                break;
        }
    }
    updateDme() {
        this.dme.display.value = SimVar.GetSimVarValue("L:PFD_DME_Displayed", "number");
        /*if (this.logic_dmeDisplayed) {
            this.setAttribute("show_dme", "true");
        }
        else {
            this.setAttribute("show_dme", "false");
        }*/
        this.dme.sourceId.value = SimVar.GetSimVarValue("L:Glasscockpit_DmeSource", "Number");
        switch (this.dme.sourceId.value) {
            case 0:
                SimVar.SetSimVarValue("L:Glasscockpit_DmeSource", "Number", 1);
            case 1:
                this.dme.source.value = "NAV1";
                if (SimVar.GetSimVarValue("NAV HAS DME:1", "Bool")) {
                    this.dme.ident.value = fastToFixed(SimVar.GetSimVarValue("NAV ACTIVE FREQUENCY:1", "MHz"), 2);
                    this.dme.distance.value = SimVar.GetSimVarValue("NAV DME:1", "nautical miles");
                }
                else {
                    this.dme.ident.value = "";
                    this.dme.distance.value = null;
                }
                break;
            case 2:
                this.dme.source.value = "NAV2";
                if (SimVar.GetSimVarValue("NAV HAS DME:2", "Bool")) {
                    this.dme.ident.value = fastToFixed(SimVar.GetSimVarValue("NAV ACTIVE FREQUENCY:2", "MHz"), 2);
                    this.dme.distance.value = SimVar.GetSimVarValue("NAV DME:2", "nautical miles");
                }
                else {
                    this.dme.ident.value = "";
                    this.dme.distance.value = null;
                }
                break;
        }
    }
    update(dt) {
        this.updateCdi(dt);
        this.updateBearing(1, this.bearing[0]);
        this.updateBearing(2, this.bearing[1]);
        this.updateDme();
    }
    toggleDme() {
        let display = this.dme.display.value ? 0 : 1;
        WTDataStore.set("HSI.ShowDme", display == 1);
        SimVar.SetSimVarValue("L:PFD_DME_Displayed", "number", display);
    }
    cycleCdi() {
        this.cdi.sourceId.value = (this.cdi.sourceId.value % 3) + 1;
        let isGPSDrived = SimVar.GetSimVarValue("GPS DRIVES NAV1", "Bool");
        if (this.cdi.sourceId.value == 2 && !SimVar.GetSimVarValue("NAV AVAILABLE:2", "Bool")) {
            this.cdi.sourceId.value = 3;
        }
        if (this.cdi.sourceId.value == 3 != isGPSDrived) {
            SimVar.SetSimVarValue("K:TOGGLE_GPS_DRIVES_NAV1", "Bool", 0);
        }
        if (this.cdi.sourceId.value != 3) {
            SimVar.SetSimVarValue("K:AP_NAV_SELECT_SET", "number", this.cdi.sourceId.value);
        }
    }
    cycleBearing(id) {
        const bearing = this.bearing[id - 1];
        let newId = 0;
        for (let i = 0; i < bearing.ids.length - 1; i++) {
            if (bearing.ids[i] == bearing.sourceId.value) {
                newId = bearing.ids[i + 1];
            }
        }
        SimVar.SetSimVarValue(`L:PFD_BRG${id}_Source`, "number", newId);
        WTDataStore.set(`HSI.Brg${id}Src`, newId);
    }
}