class WT_Altimeter_Model {
    /**
     * @param {NavSystem} gps 
     * @param {WT_Barometric_Pressure} barometricPressure 
     * @param {WT_Minimums} minimums
     */
    constructor(gps, barometricPressure, minimums) {
        this.gps = gps;
        this.barometricPressure = barometricPressure;
        this.minimums = minimums;

        this.lastPressure = -10000;
        this.lastSelectedAltitude = -10000;
        this.selectedAltWasCaptured = false;
        this.blinkTime = 0;
        this.alertState = 0;
        this.altimeterIndex = 1;
        this.readyToSet = false;

        this.altitude = new Subject(0);
        this.vspeed = new Subject(0);
        this.referenceVSpeed = new Subject(0);
        this.referenceAltitude = new Subject(0);
        this.selectedAltitudeAlert = new Subject(null);
        this.verticalDeviation = {
            mode: new Subject(null),
            value: new Subject(0),
        }
        this.pressure = new Subject(0);
    }
    updateVdi() {
        const cdiSource = SimVar.GetSimVarValue("GPS DRIVES NAV1", "Bool") ? 3 : SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "Number");
        switch (cdiSource) {
            case 1:
                if (SimVar.GetSimVarValue("NAV HAS GLIDE SLOPE:1", "Bool")) {
                    this.verticalDeviation.mode.value = "GS";
                    this.verticalDeviation.value.value = SimVar.GetSimVarValue("NAV GSI:1", "number") / 127.0;
                } else {
                    this.verticalDeviation.mode.value = "None";
                }
                break;
            case 2:
                if (SimVar.GetSimVarValue("NAV HAS GLIDE SLOPE:2", "Bool")) {
                    this.verticalDeviation.mode.value = "GS";
                    this.verticalDeviation.value.value = SimVar.GetSimVarValue("NAV GSI:2", "number") / 127.0;
                } else {
                    this.verticalDeviation.mode.value = "None";
                }
                break;
            case 3:
                if (this.gps.currFlightPlanManager.isActiveApproach() && Simplane.getAutoPilotApproachType() == 10) {
                    this.verticalDeviation.mode.value = "GP";
                    this.verticalDeviation.value.value = SimVar.GetSimVarValue("GPS VERTICAL ERROR", "meters") / 150;
                } else if (SimVar.GetSimVarValue("NAV HAS GLIDE SLOPE:1", "Bool")) {
                    this.verticalDeviation.mode.value = "GSPreview";
                    this.verticalDeviation.value.value = SimVar.GetSimVarValue("NAV GSI:1", "number") / 127.0;
                } else {
                    if (SimVar.GetSimVarValue("NAV HAS GLIDE SLOPE:2", "Bool")) {
                        this.verticalDeviation.mode.value = "GSPreview";
                        this.verticalDeviation.value.value = SimVar.GetSimVarValue("NAV GSI:2", "number") / 127.0;
                    } else {
                        this.verticalDeviation.mode.value = "None";
                    }
                }
                break;
        }
    }
    update(dt) {
        const altitude = SimVar.GetSimVarValue("INDICATED ALTITUDE:" + this.altimeterIndex, "feet");
        const selectedAltitude = SimVar.GetSimVarValue("AUTOPILOT ALTITUDE LOCK VAR", "feet");
        const altitudeAtSelected = Math.abs(altitude - selectedAltitude) <= 200;
        const altitudeCloseToSelected = Math.abs(altitude - selectedAltitude) <= 1000;

        this.altitude.value = altitude;
        this.vspeed.value = Simplane.getVerticalSpeed();
        if (SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD", "bool")) {
            this.referenceVSpeed.value = SimVar.GetSimVarValue("AUTOPILOT VERTICAL HOLD VAR", "feet per minute");
        } else {
            this.referenceVSpeed.value = null;
        }
        if (selectedAltitude != this.lastSelectedAltitude) {
            this.referenceAltitude.value = selectedAltitude;
            this.lastSelectedAltitude = selectedAltitude;
            this.selectedAltWasCaptured = false;
        }
        if (!this.selectedAltWasCaptured) {
            if (altitudeAtSelected) {
                this.selectedAltWasCaptured = true;
                if (this.alertState < 2) {
                    this.blinkTime = 5000;
                }
                if (this.blinkTime > 0) {
                    this.selectedAltitudeAlert.value = Math.floor(this.blinkTime / 250) % 2 == 0 ? "BlueText" : "Empty";
                    this.blinkTime -= dt;
                } else {
                    this.selectedAltitudeAlert.value = "BlueText";
                }
            } else if (altitudeCloseToSelected) {
                if (this.alertState < 1) {
                    this.blinkTime = 5000;
                }
                if (this.blinkTime > 0) {
                    this.selectedAltitudeAlert.value = Math.floor(this.blinkTime / 250) % 2 == 0 ? "BlueBackground" : "BlueText";
                    this.blinkTime -= dt;
                } else {
                    this.selectedAltitudeAlert.value = "BlueBackground";
                }
            } else {
                this.alertState = 0;
                this.selectedAltitudeAlert.value = "BlueText";
            }
        } else {
            if (altitudeAtSelected) {
                if (this.alertState != 2) {
                    this.blinkTime = 5000;
                    this.alertState = 2;
                }
                if (this.blinkTime > 0) {
                    this.selectedAltitudeAlert.value = Math.floor(this.blinkTime / 250) % 2 == 0 ? "BlueText" : "Empty";
                    this.blinkTime -= dt;
                } else {
                    this.selectedAltitudeAlert.value = "BlueText";
                }
            } else {
                if (this.alertState != 3) {
                    this.blinkTime = 5000;
                    this.gps.playInstrumentSound("tone_altitude_alert_default");
                    this.alertState = 3;
                }
                if (this.blinkTime > 0) {
                    this.selectedAltitudeAlert.value = Math.floor(this.blinkTime / 250) % 2 == 0 ? "YellowText" : "Empty";
                    this.blinkTime -= dt;
                } else {
                    this.selectedAltitudeAlert.value = "YellowText";
                }
            }
        }
        this.updateVdi();
        this.pressure.value = SimVar.GetSimVarValue(`KOHLSMAN SETTING HG:${this.altimeterIndex}`, "inches of mercury");
    }
}