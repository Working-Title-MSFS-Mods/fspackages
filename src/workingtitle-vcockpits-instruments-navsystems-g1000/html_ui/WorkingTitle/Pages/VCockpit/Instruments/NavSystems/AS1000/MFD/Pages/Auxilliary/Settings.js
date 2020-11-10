class WT_System_Settings_Model extends WT_Model {
    /**
     * @param {WT_Settings} settings 
     */
    constructor(settings, softKeyController) {
        super();
        this.settings = settings;
        this.softKeyController = softKeyController;
        this.menu = this.initMenu();

        this.onResetSettings = new WT_Event();
    }
    updateSetting(setting, value) {
        console.log(`Modified: ${setting} -> ${value}`);
        this.settings.setValue(setting, value);
    }
    initMenu() {
        const menu = new WT_Soft_Key_Menu(true);
        menu.options.showMap = false;
        menu.addSoftKey(10, new WT_Soft_Key("DFLTS", this.resetToDefaults.bind(this)));
        return menu;
    }
    resetToDefaults() {
        this.settings.reset();
        this.onResetSettings.fire();
    }
    save() {
        this.settings.save();
    }
    showMenu() {
        this.previousMenu = this.softKeyController.currentMenu;
        this.softKeyController.setMenu(this.menu);
    }
    restoreMenu() {
        this.softKeyController.setMenu(this.previousMenu);
    }
}

class WT_System_Settings_View extends WT_HTML_View {
    connectedCallback() {
        let template = document.getElementById('aux-settings');
        let templateContent = template.content;

        this.appendChild(templateContent.cloneNode(true));

        super.connectedCallback();

        this.isInitialised = false;
        this.addEventListener("change", (e) => {
            if (!this.isInitialised)
                return;
            this.model.updateSetting(e.target.dataset.setting, e.target.value);
            this.model.save();
        });

        this.inputLayer = new Selectables_Input_Layer(new Selectables_Input_Layer_Dynamic_Source(this, "drop-down-selector, numeric-input, toggle-switch"));
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
        this.model.showMenu();
    }
    deactivate() {
        this.model.restoreMenu();
    }
}
customElements.define("g1000-aux-settings", WT_System_Settings_View);