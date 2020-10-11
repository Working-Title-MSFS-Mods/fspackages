class WT_PFD_References_Page extends WT_HTML_View {
    constructor() {
        super();
        this.inputLayer = new Selectables_Input_Layer(new Selectables_Input_Layer_Dynamic_Source(this));
    }
    enter(inputStack) {
        this.inputHandle = inputStack.push(this.inputLayer);
    }
    exit() {
        if (this.inputHandle) {
            this.inputHandle.pop();
            this.inputHandle = null;
        }
    }
}
customElements.define("wt-timer-references-page", WT_PFD_References_Page);