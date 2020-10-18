let ModSettingsPage1Instance = undefined;

class CJ4_FMC_ModSettingsPageOne {
    constructor(fmc) {
        this._fmc = fmc;
        
        this._pilotDefault = "--------";
        this._pilotId = WTDataStore.get('simbriefPilotId', this._pilotDefault);

        let potValue = SimVar.GetSimVarValue("LIGHT POTENTIOMETER:28", "number");
        // let potValue = 100;
        if (potValue == 1) {
            this._lightMode = CJ4_FMC_ModSettingsPage.LIGHT_MODE.ON;
        }
        else if (potValue == 0.05) {
            this._lightMode = CJ4_FMC_ModSettingsPage.LIGHT_MODE.DIM;
        }
        else {
            this._lightMode = CJ4_FMC_ModSettingsPage.LIGHT_MODE.OFF;
        }
    }

    get lightMode() { return this._lightMode; }
    set lightMode(value) {
        if (value == 3) value = 0;
        this._lightMode = value;

        // set simvar
        let potValue = 100;
        if (value == CJ4_FMC_ModSettingsPage.LIGHT_MODE.OFF) potValue = 0;
        else if (value == CJ4_FMC_ModSettingsPage.LIGHT_MODE.DIM) potValue = 5;

        SimVar.SetSimVarValue("K:LIGHT_POTENTIOMETER_28_SET", "number", potValue);

        this.invalidate();
    }

    get pilotId() { return this._pilotId; }
    set pilotId(value) {
        this._pilotId = value;

        // set datastore
        WTDataStore.set('simbriefPilotId', value);

        this.invalidate();
    }

    render() {
        let lightSwitch = this._fmc._templateRenderer.renderSwitch(["OFF", "DIM", "ON"], this.lightMode);
        let pilotIdDisplay = (this.pilotId !== this._pilotDefault) ? this.pilotId + "[green]" : this._pilotDefault;

        this._fmc._templateRenderer.setTemplateRaw([
            ["", "1/1[blue] ", "WT MOD SETTINGS[yellow]"],
            [" CABIN LIGHTS[blue]"],
            [lightSwitch],
            [" SIMBRIEF PILOT ID[blue]"],
            [pilotIdDisplay, ""],
            [""],
            ["", ""],
            [""],
            ["", ""],
            [""],
            ["", ""],
            [""],
            ["< BACK", ""]
        ]);
    }

    bindEvents() {
        this._fmc.onLeftInput[0] = () => { this.lightMode = this.lightMode + 1; };
        this._fmc.onLeftInput[1] = () => {
            let idValue = this._fmc.inOut;
            this.pilotId = idValue == "CLR" ? "" : idValue;
            this._fmc.clearUserInput();
        };
        this._fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage2(this._fmc); };
    }

    invalidate() {
        this._fmc.clearDisplay();
        this.render();
        this.bindEvents();
    }
}

class CJ4_FMC_ModSettingsPage {
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