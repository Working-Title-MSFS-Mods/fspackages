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
}
WT_Barometric_Pressure.IN_MG = "IN";
WT_Barometric_Pressure.HPA = "HPA";