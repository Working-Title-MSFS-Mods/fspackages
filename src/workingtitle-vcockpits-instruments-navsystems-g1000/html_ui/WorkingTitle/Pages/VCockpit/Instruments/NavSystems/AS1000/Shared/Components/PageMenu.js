class WT_Page_Menu_Option {
    constructor(text, onClick = null) {
        this.text = text;
        this.onClick = onClick;
        this.enabled = this.onClick !== null;
    }
    click() {
        if (this.enabled) {
            this.onClick();
            return true;
        }
        return false;
    }
}

class WT_Page_Menu_Model {
    constructor(options) {
        this.options = options;
        this.onSelectedOption = new WT_Event();
    }
    selectOption(option) {
        if (option.click()) {
            this.onSelectedOption.fire();
        }
    }
}

class WT_Page_Menu_Input_Layer extends Selectables_Input_Layer {
    constructor(view) {
        super(new Selectables_Input_Layer_Dynamic_Source(view, "li:not([disabled])"));
        this.view = view;
    }
    onCLR() {
        this.view.exit();
    }
    onNavigationPush() {
        this.view.exit();
    }
    onMenuPush() {
        this.view.exit();
    }
}

class WT_Show_Page_Menu_Handler {
    /**
     * @param {WT_Page_Menu_Model} model 
     */
    show(model) {
        throw new Error("WT_Page_Menu_Handler.show not implemented");
    }
}

class WT_Page_Menu_View extends WT_HTML_View {
    constructor() {
        super();
        this.inputLayer = new WT_Page_Menu_Input_Layer(this);
        this.onExit = new WT_Event();
    }
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;
        const template = document.getElementById('menu-screen');
        this.appendChild(template.content.cloneNode(true));
        super.connectedCallback();
    }
    /**
     * @param {WT_Page_Menu_Option} model 
     */
    setModel(model) {
        this.elements.options.innerHTML = "";
        DOMUtilities.AppendChildren(this.elements.options, model.options.map(option => {
            let element = document.createElement("li");
            if (!option.enabled) {
                element.setAttribute("disabled", "");
            }
            element.textContent = option.text;
            element.addEventListener("selected", e => {
                this.exit();
                model.selectOption(option);
            });
            return element;
        }));
    }
    enter(inputStack) {
        this.inputHandle = inputStack.push(this.inputLayer);
        this.inputHandle.onPopped.subscribe(() => {
            this.onExit.fire();
        });
    }
    exit() {
        if (this.inputHandle) {
            this.inputHandle = this.inputHandle.pop();
        }
    }
}
customElements.define("g1000-page-menu", WT_Page_Menu_View);