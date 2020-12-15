class XMLHeader extends HTMLElement {
    constructor() {
        super(...arguments);
        this.height = 15;
    }
    connectedCallback() {
        this.appendChild(document.createElement("div"));
        this.textElement = this.appendChild(document.createElement("label"));
        this.appendChild(document.createElement("div"));
    }
    setText(_value) {
        if (this.textElement.textContent != _value) {
            this.textElement.textContent = _value;
        }
    }
    setFontSize(_value) {
        this.textElement.style.fontSize = _value;
    }
    update(_context) {
    }
}
customElements.define('glasscockpit-xmlheader', XMLHeader);