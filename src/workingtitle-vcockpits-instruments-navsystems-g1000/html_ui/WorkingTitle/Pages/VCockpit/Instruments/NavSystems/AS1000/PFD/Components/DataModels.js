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
        SimVar.SetSimVarValue("KOHLSMAN SETTING HG:1", 29.92);
    }
    update(dt) {
        if (this.pressure.hasSubscribers()) {
            switch (this.altUnit.value) {
                case WT_Barometric_Pressure.IN_MG:
                    this.pressure.value = SimVar.GetSimVarValue(`KOHLSMAN SETTING HG:${this.altimeterIndex}`, "inches of mercury").toFixed(2)
                    break;
                case WT_Barometric_Pressure.HPA:
                    this.pressure.value = SimVar.GetSimVarValue(`KOHLSMAN SETTING MB:${this.altimeterIndex}`, "Millibars").toFixed(0)
                    break;
            }
        }
    }
}
WT_Barometric_Pressure.IN_MG = "in_mg";
WT_Barometric_Pressure.HPA = "hpa";