class WT_Brightness_Settings {
    /**
     * @param {WT_Clock} clock 
     */
    constructor(clock) {
        this.clock = clock;

        this.mfd = new rxjs.BehaviorSubject(SimVar.GetSimVarValue(`L:XMLVAR_AS1000_MFD_Brightness`, "number"));
        this.pfd = new rxjs.BehaviorSubject(SimVar.GetSimVarValue(`L:XMLVAR_AS1000_PFD_Brightness`, "number"));
        this.mfdMode = new rxjs.BehaviorSubject(WTDataStore.get(`MFD.BrightnessMode`, "Auto"));
        this.pfdMode = new rxjs.BehaviorSubject(WTDataStore.get(`PFD.BrightnessMode`, "Auto"));

        this.setPfdBrightness(WTDataStore.get(`MFD.Brightness`, 100));
        this.setMfdBrightness(WTDataStore.get(`PFD.Brightness`, 100));

        const autoBrightness$ = this.initAutoBrightness(clock);

        this.initBrightness(this.pfdMode, this.pfd, autoBrightness$, `L:XMLVAR_AS1000_PFD_Brightness`);
        this.initBrightness(this.mfdMode, this.mfd, autoBrightness$, `L:XMLVAR_AS1000_MFD_Brightness`);
    }
    initBrightness(mode$, brightness$, autoBrightness$, simvar) {
        return mode$.pipe(
            rxjs.operators.switchMap(mode => mode == "Auto" ? autoBrightness$ : brightness$)
        ).subscribe(brightness => {
            SimVar.SetSimVarValue(simvar, "number", brightness);
        });
    }
    /**
     * @param {WT_Clock} clock 
     */
    initAutoBrightness(clock) {
        const offset = 0.2; // Add a constant amount of "altitude" so brightness doesn't hit 0 exactly at sunrise/sunset
        const multiplier = 4; // How fast the brightness reaches max above the horizon
        return clock.sunPosition.pipe(
            rxjs.operators.pluck("altitude"),
            rxjs.operators.map(altitude => offset + altitude / (Math.PI / 2) * multiplier),
            WT_RX.clamp(),
            WT_RX.distinctMap(v => Math.floor(v * 100)),
            WT_RX.shareReplay()
        );
    }
    clamp(value, min, max) {
        return Math.max(Math.min(value, max), min);
    }
    setPfdBrightness(brightness) {
        brightness = this.clamp(brightness, 0, 100);
        WTDataStore.set(`PFD.Brightness`, brightness);
        this.pfd.next(brightness);
    }
    setMfdBrightness(brightness) {
        brightness = this.clamp(brightness, 0, 100);
        WTDataStore.set(`MFD.Brightness`, brightness);
        this.mfd.next(brightness);
    }
    setPfdMode(mode) {
        this.pfdMode.next(mode);
        WTDataStore.set(`PFD.BrightnessMode`, mode);
    }
    setMfdMode(mode) {
        this.mfdMode.next(mode);
        WTDataStore.set(`MFD.BrightnessMode`, mode);
    }
}