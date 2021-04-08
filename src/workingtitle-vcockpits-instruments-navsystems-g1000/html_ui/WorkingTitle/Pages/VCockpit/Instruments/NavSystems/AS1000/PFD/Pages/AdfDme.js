class WT_PFD_ADF_DME_View extends WT_HTML_View {
    constructor() {
        super();
        this.inputLayer = new Selectables_Input_Layer(new Selectables_Input_Layer_Dynamic_Source(this));
        this.frequencySelected = new Subject(false);
    }
    connectedCallback() {
        super.connectedCallback();
        this.frequencySelected.subscribe(selected => this.elements.entToTransfer.style.display = selected ? "block" : "none");
        this.elements.adfFrequency.addEventListener("focus", () => this.frequencySelected.value = true);
        this.elements.adfFrequency.addEventListener("blur", () => this.frequencySelected.value = false);
        this.elements.adfFrequency.addEventListener("selected", this.swapActive.bind(this));
    }
    swapActive() {
        SimVar.SetSimVarValue("K:ADF1_RADIO_SWAP", "number", 0);
    }
    setDmeMode(mode) {
        SimVar.SetSimVarValue("L:Glasscockpit_DmeSource", "Number", mode == "NAV1" ? 1 : 2);
    }
    /**
     * @param {Input_Stack} inputStack 
     */
    enter(inputStack) {
        this.inputHandle = inputStack.push(this.inputLayer);
    }
    exit() {
        if (this.inputHandle) {
            this.inputHandle = this.inputHandle.pop();
        }
    }
    update(dt) {
        this.elements.active.textContent = parseFloat(SimVar.GetSimVarValue("ADF ACTIVE FREQUENCY:1", "KHz")).toFixed(1);
    }
}
customElements.define("g1000-pfd-adf-dme", WT_PFD_ADF_DME_View);