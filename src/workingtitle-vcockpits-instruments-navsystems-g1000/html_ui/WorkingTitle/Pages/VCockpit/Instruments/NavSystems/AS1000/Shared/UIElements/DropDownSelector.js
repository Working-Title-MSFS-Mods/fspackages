class WT_Drop_Down_Selector_Input_Layer extends Selectables_Input_Layer {
    constructor(dropDown, source) {
        super(source, true);
        this.dropDown = dropDown;
    }
    onCLR() {
        this.dropDown.cancel();
    }
    onHighlightedElement(element) {
        if (this.dropDown)
            this.dropDown.selectionUpdated(element.getAttribute("value"));
    }
}

class WT_Drop_Down_Selector extends HTMLElement {
    constructor() {
        super();
        this.options = [];
        this._value = null;
        this.emptyValue = "&nbsp;";
        this.elements = {
            value: null,
            popup: null
        };

        DOMUtilities.AddScopedEventListener(this, "drop-down-selector-option", "selected", this.onOptionSelected.bind(this));
        this.addEventListener("selected", (e) => { if (e.detail.element == this && this.options.length > 0) this.enter(e) });
    }
    get value() {
        return this._value;
    }
    set value(value) {
        this._value = value;
        for (let option of this.getOptions()) {
            if (option.getAttribute("value") == value) {
                this.updateSelectedValue(option.innerHTML);
            }
        }
    }
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;

        for (let optionNode of this.querySelectorAll("drop-down-selector-option")) {
            this.options.push(optionNode);
        }

        const template = `
            <div class="value"></div>
            <div class="popup scrollable-container"></div>
        `;

        this.innerHTML = template;

        this.elements.value = this.querySelector(".value");
        this.elements.popup = this.querySelector(".popup");

        for (let option of this.options) {
            this.elements.popup.appendChild(option);
        }
        if (this.options.length > 0) {
            this.value = this.options[0].getAttribute("value");
        }
        if (this.hasAttribute("empty-value")) {
            this.emptyValue = this.getAttribute("empty-value");
        }
    }
    clearOptions() {
        this._value = null;
        this.options = [];
        this.updateSelectedValue(this.emptyValue);
        this.elements.popup.innerHTML = "";
    }
    addOption(value, text, enabled = true) {
        let option = document.createElement("drop-down-selector-option");
        option.setAttribute("value", value);
        if (!enabled)
            option.setAttribute("disabled", "");
        option.innerHTML = text;
        this.options.push(option);
        this.elements.popup.appendChild(option);
        if (this.options.length == 1) {
            this.value = this.options[0].getAttribute("value");
        }
    }
    getOptions() {
        return this.options;
    }
    updateSelectedValue(html) {
        this.elements.value.innerHTML = html;
    }
    selectionUpdated(value) {
        this.value = value;
        let evt = document.createEvent("HTMLEvents");
        evt.initEvent("input", true, true);
        this.dispatchEvent(evt);
    }
    shouldUpdateOnSelection() {
        return this.hasAttribute("updateOnSelection");
    }
    back() {
        this.exit();
    }
    cancel() {
        this.value = this.previousValue;
        let evt = document.createEvent("HTMLEvents");
        evt.initEvent("input", true, true);
        this.dispatchEvent(evt);
        this.exit();
    }
    enter(e) {
        if (this.options.length == 0)
            return;

        this.previousValue = this.value;
        this.setAttribute("ACTIVE", "ACTIVE");

        const inputStack = e.detail.inputStack;
        let selectedOption = null;
        let i = 0;
        for (let option of this.getOptions()) {
            if (option.getAttribute("value") == this.value)
                selectedOption = option;
            i++;
        }
        const inputLayer = new WT_Drop_Down_Selector_Input_Layer(this, new Selectables_Input_Layer_Dynamic_Source(this.elements.popup, "drop-down-selector-option:not([disabled])"));
        inputLayer.onDeactivateEvent.subscribe(() => {
            this.removeAttribute("ACTIVE");
        });

        inputLayer.selectElement(selectedOption);
        inputLayer.setExitHandler(this);
        this.inputHandler = inputStack.push(inputLayer);
    }
    exit() {
        if (this.inputHandler) {
            this.inputHandler = this.inputHandler.pop();
        }
    }
    onOptionSelected(e, node) {
        e.stopPropagation();
        this.value = node.getAttribute("value");

        let evt = document.createEvent("HTMLEvents");
        evt.initEvent("change", true, true);
        this.dispatchEvent(evt);

        this.exit();
        return false;
    }
}
customElements.define("drop-down-selector", WT_Drop_Down_Selector);