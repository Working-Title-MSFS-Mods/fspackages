class AS1000_Toggle_Switch extends HTMLElement {
    constructor() {
        super();
        this._value = false;
        this.elements = {
            text: null
        };
        this.text = {
            true: "On",
            false: "Off",
        };
    }
    get value() {
        return this._value;
    }
    set value(value) {
        if (this._value !== value) {
            this._value = value;
            this.elements.text.textContent = this.value ? this.text.true : this.text.false;

            let evt = document.createEvent("HTMLEvents");
            evt.initEvent("change", true, true);
            this.dispatchEvent(evt);
        }
    }
    connectedCallback() {
        this.elements.text = document.createElement("div");
        this.appendChild(this.elements.text);

        this.value = this.getAttribute("value") == "1";
    }
    toggle() {
        this.value = !this.value;
    }
}
customElements.define("toggle-switch", AS1000_Toggle_Switch);