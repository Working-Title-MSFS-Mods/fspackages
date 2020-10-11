class WT_PFD_Mini_Page_Input_Layer extends Input_Layer {
    constructor(controller) {
        super();
        this.controller = controller;
    }
    onCLR(inputStack) {
        this.controller.closePage();
    }
    onNavigationPush(inputStack) {
        this.controller.closePage();
    }
}

class WT_PFD_Mini_Page_Controller extends WT_HTML_View {
    constructor() {
        super();
        this.currentPage = null;
        this.inputLayer = new WT_PFD_Mini_Page_Input_Layer(this);
    }
    connectedCallback() {
        this.pages = {
            references: this.querySelector("wt-timer-references-page"),
            nearest: this.querySelector("wt-nearest"),
        }
    }
    /**
     * @param {Input_Stack} inputStack 
     */
    handleInput(inputStack) {
        this.inputStack = inputStack;
        this.inputStack.push(this.inputLayer);
    }
    closePage() {
        if (this.currentPage) {
            this.currentPage.removeAttribute("visible");
            this.currentPage.exit();
            this.currentPage = null;
        }
    }
    showPage(page) {
        if (this.currentPage) {
            if (this.currentPage == page) {
                this.closePage();
                return;
            }
            this.closePage();
        }
        this.currentPage = page;
        this.currentPage.setAttribute("visible", "visible");
        this.currentPage.enter(this.inputStack);
    }
    showTimerReferences() {
        this.showPage(this.pages.references);
    }
    showFlightPlan() {

    }
    showDirectTo() {

    }
    showProcedures() {

    }
    showNearest() {
        this.showPage(this.pages.nearest);
    }
    update(dt) {
        if (this.currentPage) {
            this.currentPage.update(dt);
        }
    }
}
customElements.define("wt-mini-page-container", WT_PFD_Mini_Page_Controller);