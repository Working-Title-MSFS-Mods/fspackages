class WT_Soft_Key_Menu_Input_Layer extends Input_Layer {
    /**
     * @param {WT_Soft_Key_Controller} softKeyMenuController 
     */
    constructor(softKeyMenuController) {
        super();
        this.softKeyMenuController = softKeyMenuController;
    }
    onSoftKey(index, inputStack) {
        this.softKeyMenuController.activateSoftKey(inputStack, index);
    }
}

class WT_Soft_Key extends HTMLElement {
    constructor(text, onClick) {
        super();
        this.text = text;
        this.onClick = onClick;
        this.hoverTimeout = null;
    }
    setOnClick(onClick) {
        this.onClick = onClick;
    }
    activate(inputStack) {
        if (this.hasAttribute("disabled"))
            return;
        if (this.onClick) {
            this.onClick();
            this.setAttribute("hover", "hover");
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = setTimeout(() => this.removeAttribute("hover"), 100);
        }
    }
    set selected(selected) {
        selected ? this.setAttribute("selected", "selected") : this.removeAttribute("selected");
    }
    set text(text) {
        this.textContent = text;
    }
    set disabled(disabled) {
        disabled ? this.setAttribute("disabled", "disabled") : this.removeAttribute("disabled");
    }
}
customElements.define("g1000-soft-key", WT_Soft_Key);

class WT_Soft_Key_Menu {
    constructor(defaultButtons) {
        this.softKeys = [];
        this.options = {
            showDebug: defaultButtons,
            showEngine: defaultButtons,
            showMap: defaultButtons,
            showChecklist: defaultButtons,
        }
    }
    disableDefaultButtons() {
        this.options.showDebug = true;
        this.options.showEngine = true;
        this.options.showMap = true;
        this.options.showChecklist = true;
    }
    /**
     * @param {int} index 
     * @param {WT_Soft_Key} softKey 
     */
    addSoftKey(index, softKey) {
        this.softKeys[index - 1] = softKey;
        return softKey;
    }
    clearSoftKeys() {
        this.softKeys = [];
    }
    activate() {

    }
    deactivate() {

    }
}

class WT_Soft_Key_Menu_Stack {
    constructor() {
        this.stack = [];
    }
    push(softKeyMenu) {
        this.stack.push(softKeyMenu);
        return {
            stackSize: this.s
        }
    }
}

class WT_Soft_Key_Controller extends HTMLElement {
    constructor() {
        super();
        this.engineMenu = null;
        this.mapMenu = null;
        this.numButtons = 12;
        this.buttonElements = [];
        this.currentMenu = null;

        this.defaultButtons = {
            engine: new WT_Soft_Key("ENGINE"),
            map: new WT_Soft_Key("MAP"),
            checklist: new WT_Soft_Key("CHKLIST"),
        };
        this.defaultButtons.checklist.disabled = true;

        this.inputLayer = new WT_Soft_Key_Menu_Input_Layer(this);
    }
    connectedCallback() {
        for (let i = 0; i < this.numButtons; i++) {
            let element = document.createElement("div");
            this.buttonElements.push(element);
            this.appendChild(element);
        }
    }
    setDefaultButtons(engine, debug, map, checklist) {
        this.defaultButtons = {
            engine: engine,
            debug: debug,
            map: map,
            checklist: checklist,
        };
    }
    handleInput(inputStack) {
        inputStack.push(this.inputLayer);
    }
    /**
     * @param {WT_Soft_Key_Menu} softKeyMenu 
     */
    setMenu(softKeyMenu) {
        if (this.currentMenu) {
            this.currentMenu.deactivate();
        }
        this.currentMenu = softKeyMenu;

        for (let button of this.buttonElements) {
            button.innerHTML = "";
        }

        let buttonsDone = {};
        if (softKeyMenu != null) {
            softKeyMenu.activate();

            if (softKeyMenu.options.showEngine) {
                this.buttonElements[0].appendChild(this.defaultButtons.engine);
                buttonsDone[0] = true;
            }
            if (softKeyMenu.options.showDebug) {
                this.buttonElements[1].appendChild(this.defaultButtons.debug);
                buttonsDone[1] = true;
            }
            if (softKeyMenu.options.showMap) {
                this.buttonElements[2].appendChild(this.defaultButtons.map);
                buttonsDone[2] = true;
            }
            if (softKeyMenu.options.showChecklist) {
                this.buttonElements[11].appendChild(this.defaultButtons.checklist);
                buttonsDone[11] = true;
            }

            for (let softKeyIndex in softKeyMenu.softKeys) {
                let softKey = softKeyMenu.softKeys[softKeyIndex];
                this.buttonElements[softKeyIndex].appendChild(softKey);
                buttonsDone[softKeyIndex] = true;
            }
        }

        for (let i = 0; i < this.numButtons; i++) {
            if (!buttonsDone[i]) {
                let softKey = new WT_Soft_Key("", null);
                this.buttonElements[i].appendChild(softKey);
            }
        }
    }
    /**
     * @param {Input_Stack} inputStack 
     * @param {number} index 
     */
    activateSoftKey(inputStack, index) {
        let buttonContainer = this.buttonElements[index - 1];
        if (buttonContainer.children.length == 0)
            return;
        let softKey = buttonContainer.children[0];
        if (softKey) {
            softKey.activate(inputStack);
        }
    }
}
customElements.define("g1000-soft-key-menu", WT_Soft_Key_Controller);