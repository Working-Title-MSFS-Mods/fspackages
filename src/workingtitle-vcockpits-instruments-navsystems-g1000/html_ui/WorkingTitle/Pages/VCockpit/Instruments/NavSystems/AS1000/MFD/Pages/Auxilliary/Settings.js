class AS1000_System_Settings_Model extends AS1000_Model {
    /**
     * @param {AS1000_Settings} settings 
     */
    constructor(settings, softKeyController) {
        super();
        this.settings = settings;
        this.softKeyController = softKeyController;
        this.menu = this.initMenu();
    }
    updateSetting(setting, value) {
        console.log(`Modified: ${setting} -> ${value}`);
        this.settings.setValue(setting, value);
    }
    initMenu() {
        let menu = new AS1000_Soft_Key_Menu(true);
        menu.options.showMap = false;
        menu.addSoftKey(10, new AS1000_Soft_Key("DFLTS", this.resetToDefaults.bind(this)));
        return menu;
    }
    resetToDefaults() {

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

class AS1000_System_Settings_View extends AS1000_HTML_View {
    connectedCallback() {
        let template = document.getElementById('aux-settings');
        let templateContent = template.content;

        this.appendChild(templateContent.cloneNode(true));

        super.connectedCallback();

        this.addEventListener("change", (e) => {
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
customElements.define("g1000-aux-settings", AS1000_System_Settings_View);