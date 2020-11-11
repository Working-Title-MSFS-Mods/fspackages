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
        console.log(`Modified: ${setting} -> ${value}`);
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
    constructor(softKeyMenuHandler) {
        super();
        this.softKeyMenuHandler = softKeyMenuHandler;
    }
    connectedCallback() {
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
    }
    deactivate() {
        if (this.menuHandler)
            this.menuHandler = this.menuHandler.pop();
    }
}
customElements.define("g1000-aux-settings", WT_System_Settings_View);