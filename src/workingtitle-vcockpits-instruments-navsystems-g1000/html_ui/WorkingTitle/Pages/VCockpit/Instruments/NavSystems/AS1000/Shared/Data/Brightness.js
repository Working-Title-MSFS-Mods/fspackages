class WT_Brightness_Settings {
    /**
     * @param {WT_Clock} clock 
     */
    constructor(clock) {
        this.clock = clock;

        this.mfd = new Subject(SimVar.GetSimVarValue(`L:XMLVAR_AS1000_MFD_Brightness`, "number"));
        this.pfd = new Subject(SimVar.GetSimVarValue(`L:XMLVAR_AS1000_PFD_Brightness`, "number"));
        this.mfdMode = new Subject(WTDataStore.get(`MFD.BrightnessMode`, "Auto"));
        this.pfdMode = new Subject(WTDataStore.get(`PFD.BrightnessMode`, "Auto"));

        this.setPfdBrightness(WTDataStore.get(`MFD.Brightness`, 100));
        this.setMfdBrightness(WTDataStore.get(`PFD.Brightness`, 100));

        const getSecondsFromMidnight = date => date.getSeconds() + (60 * date.getMinutes()) + (60 * 60 * date.getHours());
        const autoBrightness$ = rxjs.combineLatest(
            this.clock.sunrise.pipe(rxjs.operators.map(getSecondsFromMidnight)),
            this.clock.sunset.pipe(rxjs.operators.map(getSecondsFromMidnight)),
            this.clock.localTime.pipe(WT_RX.distinctUntilSignificantChange(WT_Brightness_Settings.AUTO_BRIGHTNESS_UPDATE_FREQUENCY)),
            (sunrise, sunset, localTime) => {
                const clamp = x => Math.max(-1, Math.min(1, x)) * 0.5 + 0.5;
                const sunriseOffset = localTime - sunrise;
                const sunsetOffset = sunset - localTime;
                const sunriseModifier = clamp(sunriseOffset / WT_Brightness_Settings.AUTO_BRIGHTNESS_INTERPOLATION_DURATION);
                const sunsetModifier = clamp(sunsetOffset / WT_Brightness_Settings.AUTO_BRIGHTNESS_INTERPOLATION_DURATION);
                return sunriseModifier * sunsetModifier * 100;
            }
        ).pipe(
            WT_RX.shareReplay()
        )

        const mfdManualBrightness$ = this.mfd.observable;
        this.mfdMode.observable.pipe(
            rxjs.operators.switchMap(mode => mode == "Auto" ? autoBrightness$ : mfdManualBrightness$)
        ).subscribe(brightness => {
            SimVar.SetSimVarValue(`L:XMLVAR_AS1000_MFD_Brightness`, "number", brightness);
        });

        const pfdManualBrightness$ = this.pfd.observable;
        this.pfdMode.observable.pipe(
            rxjs.operators.switchMap(mode => mode == "Auto" ? autoBrightness$ : pfdManualBrightness$)
        ).subscribe(brightness => {
            SimVar.SetSimVarValue(`L:XMLVAR_AS1000_PFD_Brightness`, "number", brightness);
        });
    }
    clamp(value, min, max) {
        return Math.max(Math.min(value, max), min);
    }
    setPfdBrightness(brightness) {
        brightness = this.clamp(brightness, 0, 100);
        WTDataStore.set(`PFD.Brightness`, brightness);
        this.pfd.value = brightness;
    }
    setMfdBrightness(brightness) {
        brightness = this.clamp(brightness, 0, 100);
        WTDataStore.set(`MFD.Brightness`, brightness);
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
    }
}
WT_Brightness_Settings.AUTO_BRIGHTNESS_UPDATE_FREQUENCY = 60;
WT_Brightness_Settings.AUTO_BRIGHTNESS_INTERPOLATION_DURATION = 1800;