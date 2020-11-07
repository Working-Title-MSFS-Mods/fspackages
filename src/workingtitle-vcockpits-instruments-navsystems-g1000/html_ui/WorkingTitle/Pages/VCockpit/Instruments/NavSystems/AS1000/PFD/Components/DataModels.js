class WT_Barometric_Pressure {
    constructor() {
        this.altUnit = new Subject(WT_Barometric_Pressure.IN_MG);
        this.pressure = new Subject(0);
        this.altimeterIndex = 1;
    }
    setInMG() {
        this.altUnit.value = WT_Barometric_Pressure.IN_MG;
    }
    setHpa() {
        this.altUnit.value = WT_Barometric_Pressure.HPA;
    }
    setStandard() {
        SimVar.SetSimVarValue("KOHLSMAN SETTING STD", "Bool", 0);
    }
    update(dt) {
        if (this.pressure.hasSubscribers()) {
            switch (this.altUnit.value) {
                case WT_Barometric_Pressure.IN_MG:
                    this.pressure.value = parseFloat(SimVar.GetSimVarValue(`KOHLSMAN SETTING HG:${this.altimeterIndex}`, "inches of mercury"))
                    break;
                case WT_Barometric_Pressure.HPA:
                    this.pressure.value = parseFloat(SimVar.GetSimVarValue(`KOHLSMAN SETTING MB:${this.altimeterIndex}`, "Millibars"))
                    break;
            }
        }
    }
    incrementBaro() {
        SimVar.SetSimVarValue("K:KOHLSMAN_INC", "number", this.altimeterIndex);
    }
    decrementBaro() {
        SimVar.SetSimVarValue("K:KOHLSMAN_DEC", "number", this.altimeterIndex);
    }
    getPressure() {
        return SimVar.GetSimVarValue(`KOHLSMAN SETTING HG:${this.altimeterIndex}`, "inches of mercury");
    }
}
WT_Barometric_Pressure.IN_MG = "IN";
WT_Barometric_Pressure.HPA = "HPA";

class WT_Minimums {
    constructor() {
        this.mode = new Subject();
        this.source = new Subject();
        this.value = new Subject();
        this.state = new Subject();

        this.mode.subscribe(mode => {
            this.wasUpper = false;
        });
        this.wasUpper = false;

        this.modes = new Subject([0, 1]);
        /*let raElem = this.gps.instrumentXmlConfig.getElementsByTagName("RadarAltitude");
        if (raElem.length > 0) {
            this.haveRadarAltitude = raElem[0].textContent == "True";
        }*/
    }
    setModes(modes) {
        this.modes.value = modes;
    }
    setMode(mode) {
        SimVar.SetSimVarValue("L:AS3000_MinimalsMode", "number", mode);
    }
    setAltitude(value) {
        SimVar.SetSimVarValue("L:AS3000_MinimalsValue", "number", value);
    }
    update(dt) {
        const mode = SimVar.GetSimVarValue("L:AS3000_MinimalsMode", "number");
        const value = SimVar.GetSimVarValue("L:AS3000_MinimalsValue", "number");
        this.mode.value = mode;
        switch (mode) {
            case 0:
                this.value.value = null;
                break;
            case 1:
                this.source.value = "BARO MIN";
                this.value.value = value;
                break;
            case 2:
                this.source.value = "COMP MIN";
                this.value.value = value;
                break;
            case 3:
                this.source.value = "RA MIN";
                this.value.value = value;
                break;
        }
        let state = "";
        switch (mode) {
            case 1:
                let currHeight = SimVar.GetSimVarValue("INDICATED ALTITUDE", "feet");
                if (!this.wasUpper || currHeight > (value + 100)) {
                    state = "";
                    if (!this.wasUpper && currHeight > (value + 100)) {
                        this.wasUpper = true;
                    }
                } else if (currHeight > value) {
                    state = "near";
                } else {
                    state = "low";
                }
                break;
            case 2:
                break;
            case 3:
                let currentBaroAlt = SimVar.GetSimVarValue("INDICATED ALTITUDE", "feet");
                let currentRAAlt = SimVar.GetSimVarValue("RADIO HEIGHT", "feet");
                Avionics.Utils.diffAndSetAttribute(this.altimeter, "minimum-altitude", (value + currentBaroAlt - currentRAAlt).toString());
                if (!this.wasUpper || currentRAAlt > (value + 100)) {
                    state = "";
                    if (!this.wasUpper && currentRAAlt > (value + 100)) {
                        this.wasUpper = true;
                    }
                }
                else if (currentRAAlt > value) {
                    state = "near";
                }
                else {
                    state = "low";
                }
                break;
        }
        this.state.value = state;
    }
}