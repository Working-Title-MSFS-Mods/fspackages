class WT_PFD_Setup_Menu_Model {
    /**
     * @param {WT_Brightness_Settings} brightnessSettings 
     */
    constructor(brightnessSettings) {
        this.brightnessSettings = brightnessSettings;
    }
    setPfdBrightness(brightness) {
        this.brightnessSettings.setPfdBrightness(brightness);
    }
    setMfdBrightness(brightness) {
        this.brightnessSettings.setMfdBrightness(brightness);
    }
    setPfdMode(mode) {
        this.brightnessSettings.setPfdMode(mode);
    }
    setMfdMode(mode) {
        this.brightnessSettings.setMfdMode(mode);
    }
}

class WT_PFD_Setup_Menu_View extends WT_HTML_View {
    constructor() {
        super();
        this.inputLayer = new Selectables_Input_Layer(new Selectables_Input_Layer_Dynamic_Source(this));
    }
    /**
     * @param {WT_PFD_Setup_Menu_Model} model 
     */
    setModel(model) {
        this.model = model;
        model.brightnessSettings.pfd.subscribe(brightness => this.elements.pfdBrightness.value = brightness);
        model.brightnessSettings.mfd.subscribe(brightness => this.elements.mfdBrightness.value = brightness);
        model.brightnessSettings.pfdMode.subscribe(mode => this.elements.pfdMode.value = mode);
        model.brightnessSettings.mfdMode.subscribe(mode => this.elements.mfdMode.value = mode);
    }
    setPfdBrightness(brightness) {
        this.model.setPfdBrightness(brightness);
    }
    setMfdBrightness(brightness) {
        this.model.setMfdBrightness(brightness);
    }
    setPfdMode(mode) {
        this.model.setPfdMode(mode);
    }
    setMfdMode(mode) {
        this.model.setMfdMode(mode);
    }
    enter(inputStack) {
        this.inputHandle = inputStack.push(this.inputLayer);
    }
    exit() {
        if (this.inputHandle) {
            this.inputHandle = this.inputHandle.pop();
        }
    }
}
customElements.define("g1000-pfd-setup-menu", WT_PFD_Setup_Menu_View);