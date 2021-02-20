let ModSettingsPage1Instance = undefined;

class CJ4_FMC_ModSettingsPageOne {
    constructor(fmc) {
        this._fmc = fmc;

        this._pilotDefault = "--------";
        this._pilotId = WTDataStore.get('simbriefPilotId', this._pilotDefault);

        this._ngDefault = "NOT LINKED[disabled]";
        this._ngStatus = !ngApi.isAccountLinked ? this._ngDefault : "LINKED[green]";

        const potValue = SimVar.GetSimVarValue("LIGHT POTENTIOMETER:28", "number");
        if (potValue == 1) {
            this._lightMode = CJ4_FMC_ModSettingsPage.LIGHT_MODE.ON;
        } else if (potValue == 0.05) {
            this._lightMode = CJ4_FMC_ModSettingsPage.LIGHT_MODE.DIM;
        } else {
            this._lightMode = CJ4_FMC_ModSettingsPage.LIGHT_MODE.OFF;
        }

        this._cj4Units = WTDataStore.get('WT_CJ4_Units', 0);

        this._gpuSetting = SimVar.GetSimVarValue("EXTERNAL POWER ON", "number");

        this._gpuAvailable = SimVar.GetSimVarValue("EXTERNAL POWER AVAILABLE", "number") == 1;
        if (!this._gpuAvailable) {
            this._gpuSetting = 0;
        }

        this._yokeHide = SimVar.GetSimVarValue("L:XMLVAR_YOKEHidden1", "number");

        this._fpSync = WTDataStore.get('WT_CJ4_FPSYNC', 0);

    }

    get lightMode() {
        return this._lightMode;
    }
    set lightMode(value) {
        if (value == 3) value = 0;
        this._lightMode = value;

        // set simvar
        CJ4_FMC_ModSettingsPage.setPassCabinLights(value);
        WTDataStore.set('passCabinLights', value);

        this.invalidate();
    }

    get pilotId() {
        return this._pilotId;
    }
    set pilotId(value) {
        this._pilotId = value;

        // set datastore
        WTDataStore.set('simbriefPilotId', value);

        this.invalidate();
    }

    get cj4Units() {
        return this._cj4Units;
    }
    set cj4Units(value) {
        if (value == 2) value = 0;
        this._cj4Units = value;

        // set datastore
        WTDataStore.set('WT_CJ4_Units', value);

        this.invalidate();
    }

    get gpuSetting() {
        return this._gpuSetting;
    }
    set gpuSetting(value) {
        if (value == 2) value = 0;
        this._gpuSetting = value;

        // set simvar
        SimVar.SetSimVarValue("K:TOGGLE_EXTERNAL_POWER", "number", value);

        this.invalidate();
    }

    get yokeHide() {
        return this._yokeHide;
    }
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

    get fpSync() {
        return this._fpSync;
    }
    set fpSync(value) {
        if (value == 2) value = 0;
        this._fpSync = value;

        // set datastore
        WTDataStore.set('WT_CJ4_FPSYNC', value);

        this.invalidate();
    }

    render() {
        const lightSwitch = this._fmc._templateRenderer.renderSwitch(["OFF", "DIM", "ON"], this.lightMode);
        const pilotIdDisplay = (this.pilotId !== this._pilotDefault) ? this.pilotId + "[green]" : this._pilotDefault;
        const unitsSwitch = this._fmc._templateRenderer.renderSwitch(["IMPERIAL", "METRIC"], this.cj4Units);
        let gpuSettingSwitch = this._fmc._templateRenderer.renderSwitch(["OFF", "ON"], this.gpuSetting);
        const yokeHideSwitch = this._fmc._templateRenderer.renderSwitch(["NO", "YES"], this.yokeHide);
        const fpSyncSwitch = this._fmc._templateRenderer.renderSwitch(["OFF", "ON"], this.fpSync);

        if (!this._gpuAvailable) {
            gpuSettingSwitch = "NO EXT PWR[disabled]";
        }

        this._fmc._templateRenderer.setTemplateRaw([
            ["", "1/1[blue] ", "WT MOD SETTINGS[yellow]"],
            [" CABIN LIGHTS[blue]", "FP SYNC[blue]"],
            [lightSwitch, fpSyncSwitch],
            [" SIMBRIEF PILOT ID[blue]"],
            [pilotIdDisplay, ""],
            [" FMS/MFD UNITS[blue]"],
            [unitsSwitch],
            [" GROUND POWER UNIT[blue]"],
            [gpuSettingSwitch],
            [" HIDE YOKE[blue]", "NG LINK"],
            [yokeHideSwitch, this._ngStatus],
            [""],
            ["< BACK", ""]
        ]);
    }

    bindEvents() {
        this._fmc.onLeftInput[0] = () => {
            this.lightMode = this.lightMode + 1;
        };
        this._fmc.onRightInput[0] = () => {
            this.fpSync = this.fpSync + 1;
        };
        this._fmc.onLeftInput[1] = () => {
            const idValue = this._fmc.inOut;
            this.pilotId = idValue == FMCMainDisplay.clrValue ? "" : idValue;
            this._fmc.clearUserInput();
        };
        this._fmc.onLeftInput[2] = () => {
            this.cj4Units = this.cj4Units + 1;
        };
        this._fmc.onLeftInput[3] = () => {
            if (this._gpuAvailable) this.gpuSetting = this.gpuSetting + 1;
        };
        this._fmc.onLeftInput[4] = () => {
            this.yokeHide = this.yokeHide + 1;
        };
        this._fmc.onRightInput[4] = () => {
            this._fmc.setMsg("LINKING NAVIGRAPH...[yellow]");
            ngApi.linkAccount().then((s) => {
                this._fmc.setMsg("NAVIGRAPH LINKED[green]");
                this.invalidate();
            });
        };
        this._fmc.onLeftInput[5] = () => {
            CJ4_FMC_InitRefIndexPage.ShowPage2(this._fmc);
        };
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
        if (value == CJ4_FMC_ModSettingsPage.LIGHT_MODE.OFF) {
            potValue = 0;
        } else if (value == CJ4_FMC_ModSettingsPage.LIGHT_MODE.DIM) {
            potValue = 5;
        }

        SimVar.SetSimVarValue("K:LIGHT_POTENTIOMETER_28_SET", "number", potValue);
    }

    static ShowPage1(fmc) {
        fmc.clearDisplay();

        // create page instance and init 
        ModSettingsPage1Instance = new CJ4_FMC_ModSettingsPageOne(fmc);
        ModSettingsPage1Instance.invalidate();
    }
}

CJ4_FMC_ModSettingsPage.LIGHT_MODE = {
    OFF: 0,
    DIM: 1,
    ON: 2,
};