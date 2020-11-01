class WT_Brightness_Settings {
    constructor(setup = true) {
        this.mfd = new Subject(SimVar.GetSimVarValue(`L:XMLVAR_AS1000_MFD_Brightness`, "number"));
        this.pfd = new Subject(SimVar.GetSimVarValue(`L:XMLVAR_AS1000_PFD_Brightness`, "number"));
        if (setup) {
            this.setPfdBrightness(WTDataStore.get(`MFD.Brightness`, 100));
            this.setMfdBrightness(WTDataStore.get(`PFD.Brightness`, 100));
        }
    }
    clamp(value, min, max) {
        return Math.max(Math.min(value, max), min);
    }
    setPfdBrightness(brightness) {
        brightness = this.clamp(brightness, 0, 100);
        WTDataStore.set(`PFD.Brightness`, brightness);
        SimVar.SetSimVarValue(`L:XMLVAR_AS1000_PFD_Brightness`, "number", brightness);
        this.pfd.value = brightness;
    }
    setMfdBrightness(brightness) {
        brightness = this.clamp(brightness, 0, 100);
        WTDataStore.set(`MFD.Brightness`, brightness);
        SimVar.SetSimVarValue(`L:XMLVAR_AS1000_MFD_Brightness`, "number", brightness);
        this.mfd.value = brightness;
    }
}