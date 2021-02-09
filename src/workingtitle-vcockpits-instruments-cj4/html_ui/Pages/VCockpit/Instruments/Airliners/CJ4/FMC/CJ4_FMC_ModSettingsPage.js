let ModSettingsPage1Instance = undefined;
let ModSettingsPage2Instance = undefined;

class CJ4_FMC_ModSettingsPageOne {
    constructor(fmc) {
        this._fmc = fmc;

        this._pilotDefault = "--------";
        this._pilotId = WTDataStore.get('simbriefPilotId', this._pilotDefault);

        let potValue = SimVar.GetSimVarValue("LIGHT POTENTIOMETER:28", "number");
        if (potValue == 1) {
            this._lightMode = CJ4_FMC_ModSettingsPage.LIGHT_MODE.ON;
        }
        else if (potValue == 0.05) {
            this._lightMode = CJ4_FMC_ModSettingsPage.LIGHT_MODE.DIM;
        }
        else {
            this._lightMode = CJ4_FMC_ModSettingsPage.LIGHT_MODE.OFF;
        }

        this._cj4Units = WTDataStore.get('WT_CJ4_Units', 0);

        this._atisSrc = WTDataStore.get('WT_ATIS_Source', 0);

        this._gpuSetting = SimVar.GetSimVarValue("EXTERNAL POWER ON", "number");

        this._gpuAvailable = SimVar.GetSimVarValue("EXTERNAL POWER AVAILABLE", "number") == 1;
        if (!this._gpuAvailable) {
            this._gpuSetting = 0;
        }

        this._yokeHide = SimVar.GetSimVarValue("L:XMLVAR_YOKEHidden1", "number");

        this._fpSync = WTDataStore.get('WT_CJ4_FPSYNC', 0);

    }

    get lightMode() { return this._lightMode; }
    set lightMode(value) {
        if (value == 3) value = 0;
        this._lightMode = value;

        // set simvar
        CJ4_FMC_ModSettingsPage.setPassCabinLights(value);
        WTDataStore.set('passCabinLights', value);

        this.invalidate();
    }

    get pilotId() { return this._pilotId; }
    set pilotId(value) {
        this._pilotId = value;

        // set datastore
        WTDataStore.set('simbriefPilotId', value);

        this.invalidate();
    }

    get cj4Units() { return this._cj4Units; }
    set cj4Units(value) {
        if (value == 2) value = 0;
        this._cj4Units = value;

        // set datastore
        WTDataStore.set('WT_CJ4_Units', value);

        this.invalidate();
    }

    get atisSrc() { return this._atisSrc; }
    set atisSrc(value) {
        if (value == 2) value = 0;
        this._atisSrc = value;

        // set datastore
        WTDataStore.set('WT_ATIS_Source', value);

        this.invalidate();
    }

    get gpuSetting() { return this._gpuSetting; }
    set gpuSetting(value) {
        if (value == 2) value = 0;
        this._gpuSetting = value;

        // set simvar
        SimVar.SetSimVarValue("K:TOGGLE_EXTERNAL_POWER", "number", value);

        this.invalidate();
    }

    get yokeHide() { return this._yokeHide; }
    set yokeHide(value) {
        if (value == 2) value = 0;
        this._yokeHide = value;

        // set simvar
        SimVar.SetSimVarValue("L:XMLVAR_YOKEHidden1", "number", value);
        SimVar.SetSimVarValue("L:XMLVAR_YOKEHidden2", "number", value);

        // set datastore
        WTDataStore.set('WT_CJ4_HideYoke', value);

        this.invalidate();
    }

    get fpSync() { return this._fpSync; }
    set fpSync(value) {
        if (value == 2) value = 0;
        this._fpSync = value;

        // set datastore
        WTDataStore.set('WT_CJ4_FPSYNC', value);

        this.invalidate();
    }

    render() {
        let lightSwitch = this._fmc._templateRenderer.renderSwitch(["OFF", "DIM", "ON"], this.lightMode);
        let pilotIdDisplay = (this.pilotId !== this._pilotDefault) ? this.pilotId + "[green]" : this._pilotDefault;
        let unitsSwitch = this._fmc._templateRenderer.renderSwitch(["IMPERIAL", "METRIC"], this.cj4Units);
        let gpuSettingSwitch = this._fmc._templateRenderer.renderSwitch(["OFF", "ON"], this.gpuSetting);
        let yokeHideSwitch = this._fmc._templateRenderer.renderSwitch(["NO", "YES"], this.yokeHide);
        let fpSyncSwitch = this._fmc._templateRenderer.renderSwitch(["OFF", "ON"], this.fpSync);
        let atisSrcSwitch = this._fmc._templateRenderer.renderSwitch(["FAA", "VATSIM"], this.atisSrc);

        if (!this._gpuAvailable) {
            gpuSettingSwitch = "NO EXT PWR[disabled]";
        }

        this._fmc._templateRenderer.setTemplateRaw([
            ["", "1/2[blue] ", "WT MOD SETTINGS[yellow]"],
            [" CABIN LIGHTS[blue]", "FP SYNC[blue]"],
            [lightSwitch, fpSyncSwitch],
            [" SIMBRIEF PILOT ID[blue]"],
            [pilotIdDisplay, ""],
            [" FMS/MFD UNITS[blue]"],
            [unitsSwitch],
            [" GROUND POWER UNIT[blue]"],
            [gpuSettingSwitch],
            [" HIDE YOKE[blue]","ATIS SOURCE[blue]"],
            [yokeHideSwitch, atisSrcSwitch],
            [""],
            ["< BACK", ""]
        ]);
    }

    bindEvents() {
        this._fmc.onLeftInput[0] = () => { this.lightMode = this.lightMode + 1; };
        this._fmc.onRightInput[0] = () => { this.fpSync = this.fpSync + 1; };
        this._fmc.onLeftInput[1] = () => {
            let idValue = this._fmc.inOut;
            this.pilotId = idValue == FMCMainDisplay.clrValue ? "" : idValue;
            this._fmc.clearUserInput();
        };
        this._fmc.onLeftInput[2] = () => { this.cj4Units = this.cj4Units + 1; };
        this._fmc.onLeftInput[3] = () => { if (this._gpuAvailable) this.gpuSetting = this.gpuSetting + 1; };
        this._fmc.onLeftInput[4] = () => { this.yokeHide = this.yokeHide + 1; };
        this._fmc.onRightInput[4] = () => { this.atisSrc = this.atisSrc + 1; };
        this._fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage2(this._fmc); };
        this._fmc.onNextPage = () =>{CJ4_FMC_ModSettingsPage.ShowPage2(this._fmc); };
    }

    invalidate() {
        this._fmc.clearDisplay();
        this.render();
        this.bindEvents();
    }
}

class CJ4_FMC_ModSettingsPageTwo {
    constructor(fmc) {
        this._fmc = fmc;
        this._metarSrc = WTDataStore.get("WT_CJ4_METAR_Source", 0);
        this._dlProcTime = WTDataStore.get("WT_CJ4_DL_Time", 0);
        this._hoppieLogon = WTDataStore.get("WT_CJ4_HoppieLogon", "REFER TO MANUAL");

    }

    
    get metarSrc() { return this._metarSrc; }
    set metarSrc(value){
        if (value == 2) value = 0;
        this._metarSrc = value;

        // set datastore
        WTDataStore.set('WT_CJ4_METAR_Source', value);

        this.invalidate();
    }

    
    get dlProcTime() { return this._dlProcTime; }
    set dlProcTime(value){
        if (value == 2) value = 0;
        this._dlProcTime = value;

        // set datastore
        WTDataStore.set('WT_CJ4_DL_Time', value);

        this.invalidate();
    }

    render() {

        let metarSrcSwitch = this._fmc._templateRenderer.renderSwitch(["MSFS", "VATSIM"], this.metarSrc);
        let dlProcSwitch = this._fmc._templateRenderer.renderSwitch(["INSTANT", "15 SEC"], this.dlProcTime);

        this._fmc._templateRenderer.setTemplateRaw([
            ["", "2/2[blue] ", "WT MOD SETTINGS[yellow]"],
            ["METAR SOURCE[blue]"],
            [metarSrcSwitch],
            ["DATALINK PROCESSING TIME[blue]"],
            [dlProcSwitch],
            ["HOPPIE LOGON CODE[blue]"],
            [this._hoppieLogon],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""]
        ]);
    }

    bindEvents() {
        this._fmc.onLeftInput[0] = () => { this.metarSrc = this.metarSrc + 1; };
        this._fmc.onLeftInput[1] = () => { this.dlProcTime = this.dlProcTime + 1; };
        this._fmc.onPrevPage = () =>{CJ4_FMC_ModSettingsPage.ShowPage1(this._fmc); };
    }

    invalidate() {
        this._fmc.clearDisplay();
        this.render();
        this.bindEvents();
    }
}


class CJ4_FMC_ModSettingsPage {
    static setPassCabinLights(value) {
        let potValue = 100;
        if (value == CJ4_FMC_ModSettingsPage.LIGHT_MODE.OFF) potValue = 0;
        else if (value == CJ4_FMC_ModSettingsPage.LIGHT_MODE.DIM) potValue = 5;

        SimVar.SetSimVarValue("K:LIGHT_POTENTIOMETER_28_SET", "number", potValue);
    }

    static ShowPage1(fmc) {
        fmc.clearDisplay();

        // create page instance and init 
        ModSettingsPage1Instance = new CJ4_FMC_ModSettingsPageOne(fmc);
        ModSettingsPage1Instance.invalidate();
    }

    static ShowPage2(fmc) {
        fmc.clearDisplay(); 

        ModSettingsPage2Instance = new CJ4_FMC_ModSettingsPageTwo(fmc);
        ModSettingsPage2Instance.invalidate();
    }
}

CJ4_FMC_ModSettingsPage.LIGHT_MODE = {
    OFF: 0,
    DIM: 1,
    ON: 2,
};