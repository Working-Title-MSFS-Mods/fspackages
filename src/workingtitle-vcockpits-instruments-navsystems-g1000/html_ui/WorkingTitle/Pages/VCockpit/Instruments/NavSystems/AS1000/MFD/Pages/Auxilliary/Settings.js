class WT_System_Settings_Model extends WT_Model {
    /**
     * @param {WT_Settings} settings 
     */
    constructor(settings) {
        super();
        this.settings = settings;
        this.onResetSettings = new WT_Event();
    }
    updateSetting(setting, value) {
        this.settings.setValue(setting, value);
    }
    resetToDefaults() {
        this.settings.reset();
        this.onResetSettings.fire();
    }
    save() {
        this.settings.save();
    }
}

class WT_System_Settings_View extends WT_HTML_View {
    /**
     * @param {WT_MFD_Soft_Key_Menu_Handler} softKeyMenuHandler 
     */
    constructor(update$, softKeyMenuHandler) {
        super();
        this.softKeyMenuHandler = softKeyMenuHandler;

        this.subscriptions = new Subscriptions();

        this.channelSpacing$ = WT_RX.observeSimVar(update$, "COM SPACING MODE:1", "enum").pipe(
            rxjs.operators.map(spacing => spacing == 0 ? "25 kHz" : "8.33 kHz"),
        );
    }
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;

        const template = document.getElementById('aux-settings');
        this.appendChild(template.content.cloneNode(true));

        super.connectedCallback();

        this.isInitialised = false;
        this.addEventListener("change", (e) => {
            if (!this.isInitialised)
                return;
            this.model.updateSetting(e.target.dataset.setting, e.target.value);
            this.model.save();
        });

        this.menu = this.initMenu();
        this.inputLayer = new Selectables_Input_Layer(new Selectables_Input_Layer_Dynamic_Source(this));
    }
    /**
     * @param {AS1000_Settings_Model} model 
     */
    setModel(model) {
        this.model = model;
        this.isInitialised = true;
        model.onResetSettings.subscribe(() => this.populateSettings());

        this.populateSettings();
    }
    populateSettings() {
        for (let input of this.querySelectorAll("[data-setting]")) {
            input.value = this.model.settings.getValue(input.dataset.setting);
        }
    }
    initMenu() {
        const menu = new WT_Soft_Key_Menu(true);
        menu.options.showMap = false;
        menu.addSoftKey(10, new WT_Soft_Key("DFLTS", () => this.model.resetToDefaults()));
        return menu;
    }
    enter(inputStack) {
        this.inputStack = inputStack;
        this.inputStackHandle = inputStack.push(this.inputLayer);
    }
    back() {
        this.exit();
    }
    exit() {
        if (this.inputStackHandle) {
            this.inputStackHandle.pop();
            this.inputStackHandle = null;
        }
    }
    activate() {
        this.menuHandler = this.softKeyMenuHandler.show(this.menu);
        this.subscriptions.add(
            this.channelSpacing$.subscribe(spacing => this.elements.channelSpacing.value = spacing)
        );
    }
    deactivate() {
        if (this.menuHandler)
            this.menuHandler = this.menuHandler.pop();
        this.subscriptions.unsubscribe();
    }
    setChannelSpacing() {
        SimVar.SetSimVarValue("K:COM_1_SPACING_MODE_SWITCH", "number", 0);
        SimVar.SetSimVarValue("K:COM_2_SPACING_MODE_SWITCH", "number", 0);
    }
}
customElements.define("g1000-aux-settings", WT_System_Settings_View);