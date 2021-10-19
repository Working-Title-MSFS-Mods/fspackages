/**
 * A view which displays a number and associated unit.
 */
class WT_NumberUnitView extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._numberText = "";
        this._unitText = "";
        this._isInit = false;
    }

    _getTemplate() {
        return WT_NumberUnitView.TEMPLATE;
    }

    _defineChildren() {
        this._number = this.shadowRoot.querySelector(`#number`);
        this._unit = this.shadowRoot.querySelector(`#unit`);
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
        this._updateFromNumberText();
        this._updateFromUnitText();
    }

    _updateFromNumberText() {
        this._number.textContent = this._numberText;
    }

    /**
     * Sets the text value of this view's number component.
     * @param {String} text The new text value.
     */
    setNumberText(text) {
        if (this._numberText === text) {
            return;
        }

        this._numberText = text;
        if (this._isInit) {
            this._updateFromNumberText();
        }
    }

    _updateFromUnitText() {
        this._unit.textContent = this._unitText;
    }

    /**
     * Sets the text value of this view's unit component.
     * @param {String} text The new text value.
     */
    setUnitText(text) {
        if (this._unitText === text) {
            return;
        }

        this._unitText = text;
        if (this._isInit) {
            this._updateFromUnitText();
        }
    }
}
WT_NumberUnitView.NAME = "wt-numberunit";
WT_NumberUnitView.TEMPLATE = document.createElement("template");
WT_NumberUnitView.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #unit {
            font-size: var(--numberunit-unit-font-size, 0.75em);
        }
    </style>
    <span id="number"></span><span id="unit"></span>
`;

customElements.define(WT_NumberUnitView.NAME, WT_NumberUnitView);