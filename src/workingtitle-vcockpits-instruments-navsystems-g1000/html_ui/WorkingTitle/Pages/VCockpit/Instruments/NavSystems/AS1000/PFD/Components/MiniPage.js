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
            references: this.querySelector("g1000-pfd-timer-references-page"),
            nearest: this.querySelector("g1000-pfd-nearest-airports"),
            adfDme: this.querySelector("g1000-pfd-adf-dme"),
            setupMenu: this.querySelector("g1000-pfd-setup-menu"),
        }
    }
    addPage(key, view) {
        this.pages[key] = view;
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
        return this.currentPage.enter(this.inputStack);
    }
    showTimerReferences() {
    }
    showFlightPlan() {

    }
    showProcedures() {

    }
    showNearest() {
        this.showPage(this.pages.nearest);
    }
    showAdfDme() {
        this.showPage(this.pages.adfDme);
    }
    showSetupMenu() {
        this.showPage(this.pages.setupMenu);
    }
    update(dt) {
        if (this.currentPage) {
            this.currentPage.update(dt);
        }
    }
}
customElements.define("g1000-pfd-mini-page-container", WT_PFD_Mini_Page_Controller);