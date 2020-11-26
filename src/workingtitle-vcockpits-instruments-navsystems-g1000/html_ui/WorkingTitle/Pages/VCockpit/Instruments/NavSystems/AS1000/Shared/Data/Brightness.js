class WT_Brightness_Settings {
    /**
     * @param {WT_Clock} clock 
     */
    constructor(clock) {
        this.clock = clock;

        this.mfd = new Subject(SimVar.GetSimVarValue(`L:XMLVAR_AS1000_MFD_Brightness`, "number"));
        this.pfd = new Subject(SimVar.GetSimVarValue(`L:XMLVAR_AS1000_PFD_Brightness`, "number"));
        this.mfdMode = new Subject(WTDataStore.get(`MFD.BrightnessMode`, "Manual"));
        this.pfdMode = new Subject(WTDataStore.get(`PFD.BrightnessMode`, "Manual"));

        this.currentTime = 0;

        this.setPfdBrightness(WTDataStore.get(`MFD.Brightness`, 100));
        this.setMfdBrightness(WTDataStore.get(`PFD.Brightness`, 100));

        this.mfdMode.subscribe(mode => {
            if (mode == "Manual") {
                SimVar.SetSimVarValue(`L:XMLVAR_AS1000_MFD_Brightness`, "number", this.mfd.value);
            }
        });
        this.pfdMode.subscribe(mode => {
            if (mode == "Manual") {
                SimVar.SetSimVarValue(`L:XMLVAR_AS1000_PFD_Brightness`, "number", this.pfd.value);
            }
        });

        this.clock.localTime.subscribe(time => this.currentTime = time);
    }
    clamp(value, min, max) {
        return Math.max(Math.min(value, max), min);
    }
    setPfdBrightness(brightness) {
        brightness = this.clamp(brightness, 0, 100);
        WTDataStore.set(`PFD.Brightness`, brightness);
        if (this.pfdMode.value == "Manual") {
            SimVar.SetSimVarValue(`L:XMLVAR_AS1000_PFD_Brightness`, "number", brightness);
        }
        this.pfd.value = brightness;
    }
    setMfdBrightness(brightness) {
        brightness = this.clamp(brightness, 0, 100);
        WTDataStore.set(`MFD.Brightness`, brightness);
        if (this.mfdMode.value == "Manual") {
            SimVar.SetSimVarValue(`L:XMLVAR_AS1000_MFD_Brightness`, "number", brightness);
        }
        this.mfd.value = brightness;
    }
    setPfdMode(mode) {
        this.pfdMode.value = mode;
        WTDataStore.set(`PFD.BrightnessMode`, mode);
    }
    setMfdMode(mode) {
        this.mfdMode.value = mode;
        WTDataStore.set(`MFD.BrightnessMode`, mode);
    }
    update(dt) {
        const autoMfd = this.mfdMode.value == "Auto";
        const autoPfd = this.pfdMode.value == "Auto";
        if (autoMfd || autoPfd) {
            const getSecondsFromMidnight = date => date.getSeconds() + (60 * date.getMinutes()) + (60 * 60 * date.getHours());
            const clamp = x => Math.max(-1, Math.min(1, x)) * 0.5 + 0.5;
            const sunrise = getSecondsFromMidnight(this.clock.getSunrise());
            const sunset = getSecondsFromMidnight(this.clock.getSunset());
            const current = this.currentTime;
            const sunriseOffset = current - sunrise;
            const sunsetOffset = sunset - current;
            const sunriseModifier = clamp(sunriseOffset / 3600);
            const sunsetModifier = clamp(sunsetOffset / 3600);
            const brightness = sunriseModifier * sunsetModifier;
            if (autoPfd)
                SimVar.SetSimVarValue(`L:XMLVAR_AS1000_PFD_Brightness`, "number", brightness * 100);
            if (autoMfd)
                SimVar.SetSimVarValue(`L:XMLVAR_AS1000_MFD_Brightness`, "number", brightness * 100);
        }
    }
}