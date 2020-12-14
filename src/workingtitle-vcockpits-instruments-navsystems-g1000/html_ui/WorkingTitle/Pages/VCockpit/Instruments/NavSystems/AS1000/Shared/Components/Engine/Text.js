class XMLTextZone extends HTMLElement {
    constructor() {
        super(...arguments);
        this.height = 15;
    }
    connectedCallback() {
        this.leftText = DOMUtilities.createElement("div", { class: "left-text" });
        this.appendChild(this.leftText);

        this.centerText = DOMUtilities.createElement("div", { class: "center-text" });
        this.appendChild(this.centerText);

        this.rightText = DOMUtilities.createElement("div", { class: "right-text" });
        this.appendChild(this.rightText);
    }
    setLeftText(_value) {
        if (this.leftText.textContent != _value) {
            this.leftText.textContent = _value;
        }
    }
    setCenterText(_value) {
        if (this.centerText.textContent != _value) {
            this.centerText.textContent = _value;
        }
    }
    setRightText(_value) {
        if (this.rightText.textContent != _value) {
            this.rightText.textContent = _value;
        }
    }
    setLeftFontSize(_value) {
        this.leftText.setAttribute("font-size", _value);
    }
    setCenterFontSize(_value) {
        this.centerText.setAttribute("font-size", _value);
    }
    setRightFontSize(_value) {
        this.rightText.setAttribute("font-size", _value);
    }
    setLeftClass(_value) {
        this.leftText.classList.add(_value);
    }
    setCenterClass(_value) {
        this.centerText.classList.add(_value);
    }
    setRightClass(_value) {
        this.rightText.classList.add(_value);
    }
    update(_context) {
        if (this.leftCallback) {
            this.setLeftText(this.leftCallback.getValueAsString(_context));
        }
        if (this.centerCallback) {
            this.setCenterText(this.centerCallback.getValueAsString(_context));
        }
        if (this.rightCallback) {
            this.setRightText(this.rightCallback.getValueAsString(_context));
        }
        if (this.leftColor) {
            Avionics.Utils.diffAndSetAttribute(this.leftText, "color", this.leftColor.getValueAsString(_context));
        }
        if (this.centerColor) {
            Avionics.Utils.diffAndSetAttribute(this.centerText, "color", this.centerColor.getValueAsString(_context));
        }
        if (this.rightColor) {
            Avionics.Utils.diffAndSetAttribute(this.rightText, "color", this.rightColor.getValueAsString(_context));
        }
    }
}
customElements.define('glasscockpit-xmltextzone', XMLTextZone);