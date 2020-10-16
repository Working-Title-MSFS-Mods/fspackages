let ModSettingsPage1Instance = undefined;

class CJ4_FMC_ModSettingsPageOne {
    constructor(fmc) {
        this._fmc = fmc;
        
        this._simbriefUser = WTDataStore.get('simbriefUser');

        let potValue = SimVar.SetSimVarValue("K:LIGHT_POTENTIOMETER_28_SET", "number");
        if (potValue == 100) {
            this._lightMode = CJ4_FMC_ModSettingsPage.LIGHT_MODE.ON;
        }
        else if (potValue == 5) {
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

    get simbriefUser() { return this._simbriefUser; }
    set simbriefUser(value) {
        this._simbriefUser = value;

        // set datastore
        WTDataStore.set('simbriefUser', value);

        this.invalidate();
    }

    render() {
        let lightSwitch = this._fmc._templateRenderer.renderSwitch(["OFF", "DIM", "ON"], this.lightMode);
        let simbriefUserDisplay = this.simbriefUser ? this.simbriefUser + "[green]" : "--------";

        this._fmc._templateRenderer.setTemplateRaw([
            ["", "1/1[blue] ", "WT MOD SETTINGS[yellow]"],
            ["Cabin Lights[blue]", "Simbrief Username[blue]"],
            [lightSwitch, simbriefUserDisplay],
            [""],
            ["", ""],
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
        this._fmc.onRightInput[0] = () => {
            value = fmc.inOut;
            this.simbriefUser = value === FMCMainDisplay.clrValue ? undefined : value;
            fmc.clearUserInput();
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