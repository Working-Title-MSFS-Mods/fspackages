class XMLHeader extends HTMLElement {
    constructor() {
        super(...arguments);
        this.height = 15;
    }
    connectedCallback() {
        let line = document.createElement("div");
        this.appendChild(line);

        this.textElement = document.createElement("label");
        this.appendChild(this.textElement);

        line = document.createElement("div");
        this.appendChild(line);
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