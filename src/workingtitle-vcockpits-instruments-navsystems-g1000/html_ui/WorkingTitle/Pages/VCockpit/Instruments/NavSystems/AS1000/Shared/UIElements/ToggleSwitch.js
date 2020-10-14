class WT_Toggle_Switch extends HTMLElement {
    constructor() {
        super();
        this._index = 0;
        this.elements = {
            text: null
        };
        this.values = ["Off", "On"];
        this.addEventListener("increment", this.next.bind(this));
        this.addEventListener("decrement", this.previous.bind(this));
    }
    setValues(values) {
        this.values = values;
    }
    get value() {
        return this.values[this.index];
    }
    set value(value) {
        let index = this.values.indexOf(value);
        if (index != -1) {
            this.index = index;
        }
    }
    get index() {
        return this._index;
    }
    set index(index) {
        this._index = index;
        this.updateDisplayValue();
    }
    fireChangeEvent() {
        let evt = document.createEvent("HTMLEvents");
        evt.initEvent("change", true, true);
        this.dispatchEvent(evt);
    }
    updateDisplayValue() {
        this.elements.text.textContent = this.values[this.index];
        if (this.index < this.values.length - 1) {
            this.setAttribute("showNext", "show");
        } else {
            this.removeAttribute("showNext", "show");
        }

        if (this.index > 0) {
            this.setAttribute("showPrevious", "show");
        } else {
            this.removeAttribute("showPrevious", "show");
        }
    }
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;

        this.elements.text = document.createElement("div");
        this.appendChild(this.elements.text);

        if (this.hasAttribute("values")) {
            this.values = this.getAttribute("values").split(",");
        }
        this.value = this.getAttribute("value");
        this.updateDisplayValue();
    }
    next() {
        this.index = Math.min(this.values.length - 1, this.index + 1);
        this.fireChangeEvent();
    }
    previous() {
        this.index = Math.max(0, this.index - 1);
        this.fireChangeEvent();
    }
}
customElements.define("toggle-switch", WT_Toggle_Switch);