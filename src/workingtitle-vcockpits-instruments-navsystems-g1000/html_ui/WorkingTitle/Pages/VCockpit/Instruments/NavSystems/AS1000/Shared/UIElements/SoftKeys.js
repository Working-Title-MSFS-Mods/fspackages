class AS1000_Soft_Key_Menu_Input_Layer extends Input_Layer {
    constructor(softKeyMenuController) {
        super();
        this.softKeyMenuController = softKeyMenuController;
    }

    onSoftKey(index, inputStack) {
        this.softKeyMenuController.activateSoftKey(index);
    }
}

class AS1000_Soft_Key extends HTMLElement {
    constructor(text, onClick) {
        super();
        this.text = text;
        this.onClick = onClick;
        this.hoverTimeout = null;
    }
    setOnClick(onClick) {
        this.onClick = onClick;
    }
    activate() {
        if (this.onClick) {
            this.onClick();
        }
        this.setAttribute("hover", "hover");
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = setTimeout(() => this.removeAttribute("hover"), 200);
    }
    set selected(selected) {
        selected ? this.setAttribute("selected", "selected") : this.removeAttribute("selected");
    }
    set text(text) {
        this.textContent = text;
    }
}
customElements.define("g1000-soft-key", AS1000_Soft_Key);

class AS1000_Soft_Key_Menu {
    constructor(defaultButtons) {
        this.softKeys = [];
        this.options = {
            showEngine: defaultButtons,
            showMap: defaultButtons,
            showChecklist: defaultButtons,
        }
    }
    disableDefaultButtons() {
        this.options.showEngine = true;
        this.options.showMap = true;
        this.options.showChecklist = true;
    }
    /**
     * @param {int} index 
     * @param {AS1000_Soft_Key} softKey 
     */
    addSoftKey(index, softKey) {
        this.softKeys[index - 1] = softKey;
    }
    clearSoftKeys() {
        this.softKeys = [];
    }
}

class AS1000_Soft_Key_Menu_Stack {
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

class AS1000_Soft_Key_Controller extends HTMLElement {
    constructor() {
        super();
        this.engineMenu = null;
        this.mapMenu = null;
        this.numButtons = 12;
        this.buttonElements = [];
        this.currentMenu = null;

        this.defaultButtons = {
            engine: new AS1000_Soft_Key("ENGINE"),
            map: new AS1000_Soft_Key("MAP"),
            checklist: new AS1000_Soft_Key("CHKLIST"),
        };

        this.inputLayer = new AS1000_Soft_Key_Menu_Input_Layer(this);
    }
    connectedCallback() {
        for (let i = 0; i < this.numButtons; i++) {
            let element = document.createElement("div");
            this.buttonElements.push(element);
            this.appendChild(element);
        }
    }
    setDefaultButtons(engine, map, checklist) {
        this.defaultButtons = {
            engine: engine,
            map: map,
            checklist: checklist,
        };
    }
    handleInput(inputStack) {
        inputStack.push(this.inputLayer);
    }
    /**
     * @param {AS1000_Soft_Key_Menu} softKeyMenu 
     */
    setMenu(softKeyMenu) {
        this.currentMenu = softKeyMenu;

        for (let button of this.buttonElements) {
            button.innerHTML = "";
        }

        let buttonsDone = {};

        if (softKeyMenu.options.showEngine) {
            this.buttonElements[0].appendChild(this.defaultButtons.engine);
            buttonsDone[0] = true;
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

        for (let i = 0; i < this.numButtons; i++) {
            if (!buttonsDone[i]) {
                let softKey = new AS1000_Soft_Key("", null);
                this.buttonElements[i].appendChild(softKey);
            }
        }
    }
    activateSoftKey(index) {
        let buttonContainer = this.buttonElements[index - 1];
        if (buttonContainer.children.length == 0)
            return;
        let softKey = buttonContainer.children[0];
        if (softKey) {
            softKey.activate();
        }
    }
}
customElements.define("g1000-soft-key-menu", AS1000_Soft_Key_Controller);