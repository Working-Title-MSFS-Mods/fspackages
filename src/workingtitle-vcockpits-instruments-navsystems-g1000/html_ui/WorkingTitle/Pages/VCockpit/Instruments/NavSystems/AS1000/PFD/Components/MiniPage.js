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
        this.inputLayer = new WT_PFD_Mini_Page_Input_Layer(this);
        this.pageStack = [];
    }
    connectedCallback() {
        this.pages = {
            references: this.querySelector("g1000-pfd-timer-references-page"),
            nearest: this.querySelector("g1000-pfd-nearest-airports"),
            adfDme: this.querySelector("g1000-pfd-adf-dme"),
            setupMenu: this.querySelector("g1000-pfd-setup-menu"),
        }
    }
    get rootPage() {
        return this.pageStack.length > 0 ? this.pageStack[0] : null;
    }
    get currentPage() {
        return this.pageStack.length > 0 ? this.pageStack[this.pageStack.length - 1] : null;
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
        if (this.pageStack.length > 0) {
            const currentPage = this.pageStack.pop();
            currentPage.removeAttribute("visible");
            currentPage.exit();
        }
    }
    closeAllPages() {
        while (this.pageStack.length > 0) {
            const currentPage = this.pageStack.pop();
            currentPage.removeAttribute("visible");
            currentPage.exit();
        }
    }
    showPage(page) {
        this.pageStack.push(page);
        page.setAttribute("visible", "visible");
        return page.enter(this.inputStack);
    }
    showPageRoot(page) {
        if (this.rootPage) {
            if (this.rootPage == page) {
                this.closeAllPages();
                return;
            }
            this.closeAllPages();
        }
        this.showPage(page);
    }
    showTimerReferences() {
        this.showPageRoot(this.pages.references);
    }
    showNearest() {
        this.showPageRoot(this.pages.nearest);
    }
    showAdfDme() {
        this.showPageRoot(this.pages.adfDme);
    }
    showSetupMenu() {
        this.showPageRoot(this.pages.setupMenu);
    }
    update(dt) {
        if (this.currentPage && this.currentPage.update) {
            this.currentPage.update(dt);
        }
    }
}
customElements.define("g1000-pfd-mini-page-container", WT_PFD_Mini_Page_Controller);