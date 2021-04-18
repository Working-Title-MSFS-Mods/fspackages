class WT_TSCButton extends HTMLElement {
    constructor() {
        super();

        this._style = document.createElement("style");

        let style = this._createStyle();
        this._style.appendChild(document.createTextNode(style));

        this._wrapper = document.createElement("div");
        this._wrapper.id = "wrapper";
        this._appendChildren();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._wrapper);

        this._listeners = [];

        if (this.enabled !== "false") {
            this.enabled = "true";
        }
    }

    _createHostStyle() {
        return `
            :host {
                display: block;
                background: var(--button-background, linear-gradient(#5f7283 0.4vh, #1f3445, black 2vh));
                background-color: var(--button-background-color, black);
                border: var(--button-border, 3px solid #404040);
                border-radius: var(--button-border-radius, 4px);
                position: relative;
                text-align: var(--button-text-align, center);
                color: var(--button-color, white);
                overflow: hidden;
            }
            :host([highlight=true]) {
                background: linear-gradient(#7dddff 0.4vh, #008cb4 2vh);
                border-color: #7dddff;
            }
            :host([highlight=true][primed=false]) {
                color: black;
            }
            :host([enabled=true][primed=true]) {
                background: linear-gradient(#62f0f5, #0eb8d4 8%, #018cb5 30%, #0285ac 90%);
                border: 0.5vh solid #32a1bd;
            }
            :host([enabled=false]) {
                filter: grayscale(50%) brightness(40%);
            }
        `;
    }

    _createWrapperStyle() {
        return `
            #wrapper {
                position: absolute;
                left: 1%;
                top: 1%;
                right: 1%;
                bottom: 1%;
            }
        `;
    }

    _createStyle() {
        let hostStyle = this._createHostStyle();
        let wrapperStyle = this._createWrapperStyle();

        return `
            ${hostStyle}
            ${wrapperStyle}
        `;
    }

    _appendChildren() {
    }

    static get observedAttributes() {
        return ["enabled", "primed"];
    }

    get enabled() {
        return this.getAttribute("enabled");
    }

    set enabled(value) {
        this.setAttribute("enabled", value);
    }

    get highlight() {
        return this.getAttribute("highlight");
    }

    set highlight(value) {
        this.setAttribute("highlight", value);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "enabled":
                this._setEnabled(newValue === "true");
                break;
            case "primed":
                if (newValue !== this._primed + "") {
                    this.setAttribute("primed", this._primed);
                }
                break;
        }
    }

    _initState() {
        this._setEnabled(this.enabled === "true");
        this._setPrimed(false);
    }

    connectedCallback() {
        this._initState();
        this.shadowRoot.appendChild(this._style);
        this.addEventListener("mousedown", this._mouseDownListener = this._onMouseDown.bind(this));
        this.addEventListener("mouseup", this._mouseUpListener = this._onMouseUp.bind(this));
        this.addEventListener("mouseleave", this._mouseLeaveListener = this._onMouseLeave.bind(this));
    }

    disconnectedCallback() {
        this.removeEventListener("mousedown", this._mouseDownListener);
        this.removeEventListener("mouseup", this._mouseUpListener);
        this.removeEventListener("mouseleave", this._mouseLeaveListener);
        this.clearButtonListeners();
    }

    _setEnabled(value) {
        this._enabled = value;
        if (!this._enabled) {
            this._setPrimed(false);
        }
    }

    _setPrimed(value) {
        if (this._primed != value) {
            this._primed = value;
            this.setAttribute("primed", this._primed + "");
        }
    }

    _onPressed() {
        Coherent.call("PLAY_INSTRUMENT_SOUND", "tone_NavSystemTouch_touch");
        for (let listener of this._listeners) {
            listener(this);
        }
    }

    _onMouseDown(event) {
        if (this._enabled) {
            this._setPrimed(true);
        }
    }

    _onMouseUp(event) {
        let primed = this._primed;
        this._setPrimed(false);
        if (primed && this._enabled) {
            this._onPressed();
        }
    }

    _onMouseLeave(event) {
        this._setPrimed(false);
    }

    addButtonListener(listener) {
        this._listeners.push(listener);
    }

    removeButtonListener(listener) {
        let index = this._listeners.indexOf(listener);
        if (index >= 0) {
            this._listeners.splice(index, 1);
        }
    }

    clearButtonListeners() {
        this._listeners = [];
    }
}
WT_TSCButton.NAME = "wt-tsc-button";

customElements.define(WT_TSCButton.NAME, WT_TSCButton);

class WT_TSCLabeledButton extends WT_TSCButton {
    _createLabelBoxStyle() {
        return `
            #labelbox {
                position: absolute;
                width: 100%;
                height: 100%;
            }
        `;
    }

    _createLabelStyle() {
        return `
            #label {
                position: absolute;
                width: 100%;
                top: 50%;
                transform: translateY(-50%);
            }
        `;
    }

    _createStyle() {
        let style = super._createStyle();
        let labelBoxStyle = this._createLabelBoxStyle();
        let labelStyle = this._createLabelStyle();

        return `
            ${style}
            ${labelBoxStyle}
            ${labelStyle}
        `;
    }

    _appendLabel() {
        this._labelBox = document.createElement("div");
        this._labelBox.id = "labelbox";
        this._label = document.createElement("div");
        this._label.id = "label";
        this._labelBox.appendChild(this._label);
        this._wrapper.appendChild(this._labelBox);
    }

    _appendChildren() {
        this._appendLabel();
    }

    static get observedAttributes() {
        return [...WT_TSCButton.observedAttributes, "labeltext"];
    }

    get labelText() {
        return this._label.innerHTML;
    }

    set labelText(value) {
        this.setAttribute("labeltext", value + "");
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "labeltext") {
            this._setLabelText(newValue);
        } else {
            super.attributeChangedCallback(name, oldValue, newValue);
        }
    }

    connectedCallback() {
        super.connectedCallback();
        this._label = this.shadowRoot.querySelector(`#label`);
    }

    _setLabelText(value) {
        this._label.innerHTML = value;
    }
}
WT_TSCLabeledButton.NAME = "wt-tsc-button-label";

customElements.define(WT_TSCLabeledButton.NAME, WT_TSCLabeledButton);

class WT_TSCStatusBarButton extends WT_TSCLabeledButton {
    _createLabelBoxStyle() {
        return `
            #labelbox {
                position: absolute;
                width: 100%;
                top: 0%;
                bottom: 30%;
            }
        `;
    }

    _createStatusBarStyle() {
        return `
            #statusbar {
                position: absolute;
                width: 50%;
                height: 10%;
                left: 25%;
                bottom: 12%;
                border-radius: var(--button-statusbar-border-radius, 0.5vh);
                background-color: var(--button-statusbar-color-off, grey);
            }
            #statusbar[state=on] {
                background-color: var(--button-statusbar-color-on, lawngreen);
            }
        `;
    }

    _createStyle() {
        let style = super._createStyle();
        let statusBarStyle = this._createStatusBarStyle();

        return `
            ${style}
            ${statusBarStyle}
        `;
    }

    _appendStatusBar() {
        this._statusBar = document.createElement("div");
        this._statusBar.id = "statusbar";

        this._wrapper.appendChild(this._statusBar);
    }

    _appendChildren() {
        super._appendChildren();

        this._appendStatusBar();
    }

    static get observedAttributes() {
        return [...WT_TSCLabeledButton.observedAttributes, "toggle"];
    }

    get toggle() {
        return this.getAttribute("toggle");
    }

    set toggle(value) {
        this.setAttribute("toggle", value);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "toggle") {
            this._setToggle(newValue);
        } else {
            super.attributeChangedCallback(name, oldValue, newValue);
        }
    }

    _setToggle(value) {
        this._statusBar.setAttribute("state", value);
    }
}
WT_TSCStatusBarButton.NAME = "wt-tsc-button-statusbar";

customElements.define(WT_TSCStatusBarButton.NAME, WT_TSCStatusBarButton);

class WT_TSCValueButton extends WT_TSCLabeledButton {
    _createLabelBoxStyle() {
        return `
            #labelbox {
                position: absolute;
                width: 100%;
                top: 5%;
                height: 40%;
            }
        `;
    }

    _createValueBoxStyle() {
        return `
            #valuebox {
                position: absolute;
                width: 100%;
                top: 55%;
                height: 40%;
            }
        `;
    }

    _createValueStyle() {
        return `
            #value {
                position: absolute;
                width: 100%;
                top: 50%;
                transform: translateY(-50%);
                color: var(--button-value-color, white);
                font-size: var(--button-value-font-size, 1em);
            }
        `;
    }

    _createStyle() {
        let style = super._createStyle();
        let valueBoxStyle = this._createValueBoxStyle();
        let valueStyle = this._createValueStyle();

        return `
            ${style}
            ${valueBoxStyle}
            ${valueStyle}
        `;
    }

    _appendValue() {
        this._valueBox = document.createElement("div");
        this._valueBox.id = "valuebox";
        this._value = document.createElement("div");
        this._value.id = "value";
        this._valueBox.appendChild(this._value);

        this._wrapper.appendChild(this._valueBox);
    }

    _appendChildren() {
        super._appendChildren();

        this._appendValue();
    }

    static get observedAttributes() {
        return [...WT_TSCLabeledButton.observedAttributes, "valuetext"];
    }

    get valueText() {
        return this._value.innerHTML;
    }

    set valueText(value) {
        this.setAttribute("valuetext", value);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "valuetext") {
            this._setValueText(newValue);
        } else {
            super.attributeChangedCallback(name, oldValue, newValue);
        }
    }

    _setValueText(value) {
        this._value.innerHTML = value;
    }
}
WT_TSCValueButton.NAME = "wt-tsc-button-value";

customElements.define(WT_TSCValueButton.NAME, WT_TSCValueButton);

class WT_TSCImageButton extends WT_TSCLabeledButton {
    _createLabelBoxStyle() {
        return `
            #labelbox {
                position: absolute;
                left: 0%;
                top: var(--button-img-label-top, 50%);
                width: 100%;
                height: var(--button-img-label-height, 50%);
            }
        `;
    }

    _createImageStyle() {
        return `
            #img {
                position: absolute;
                left: 50%;
                top: var(--button-img-image-top, 5%);
                max-width: 90%;
                height: var(--button-img-image-height, 50%);
                transform: translateX(-50%);
            }
        `;
    }

    _createStyle() {
        let style = super._createStyle();
        let imageStyle = this._createImageStyle();

        return `
            ${style}
            ${imageStyle}
        `;
    }

    _appendImage() {
        this._img = document.createElement("img");
        this._img.id = "img";
        this._wrapper.appendChild(this._img);
    }

    _appendChildren() {
        super._appendChildren();

        this._appendImage();
    }

    static get observedAttributes() {
        return [...WT_TSCLabeledButton.observedAttributes, "imgsrc"];
    }

    get imgSrc() {
        return this._img.src;
    }

    set imgSrc(value) {
        this.setAttribute("imgsrc", value);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "imgsrc") {
            this._img.src = newValue;
        } else {
            super.attributeChangedCallback(name, oldValue, newValue);
        }
    }
}
WT_TSCImageButton.NAME = "wt-tsc-button-img";

customElements.define(WT_TSCImageButton.NAME, WT_TSCImageButton);

class WT_TSCStatusBarImageButton extends WT_TSCStatusBarButton {
    _createLabelBoxStyle() {
        return `
            #labelbox {
                position: absolute;
                left: 0%;
                top: var(--button-statusbarimg-label-top, 50%);
                width: 100%;
                height: var(--button-statusbarimg-label-height, 30%);
            }
        `;
    }

    _createStatusBarStyle() {
        return `
            #statusbar {
                position: absolute;
                left: 25%;
                bottom: 6%;
                width: 50%;
                height: 10%;
                border-radius: var(--button-statusbar-border-radius, 0.5vh);
                background-color: var(--button-statusbar-color-off, grey);
            }
            #statusbar[state=on] {
                background-color: var(--button-statusbar-color-on, lawngreen);
            }
        `;
    }

    _createImageStyle() {
        return `
            #img {
                position: absolute;
                left: 50%;
                top: var(--button-statusbarimg-image-top, 5%);
                max-width: 90%;
                height: var(--button-statusbarimg-image-height, 45%);
                transform: translateX(-50%);
            }
        `;
    }

    _createStyle() {
        let style = super._createStyle();
        let imageStyle = this._createImageStyle();

        return `
            ${style}
            ${imageStyle}
        `;
    }

    _appendImage() {
        this._img = document.createElement("img");
        this._img.id = "img";
        this._wrapper.appendChild(this._img);
    }

    _appendChildren() {
        super._appendChildren();

        this._appendImage();
    }

    static get observedAttributes() {
        return [...WT_TSCStatusBarButton.observedAttributes, "imgsrc"];
    }

    get imgSrc() {
        return this._img.src;
    }

    set imgSrc(value) {
        this.setAttribute("imgsrc", value);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "imgsrc") {
            this._img.src = newValue;
        } else {
            super.attributeChangedCallback(name, oldValue, newValue);
        }
    }
}
WT_TSCStatusBarImageButton.NAME = "wt-tsc-button-statusbarimg";

customElements.define(WT_TSCStatusBarImageButton.NAME, WT_TSCStatusBarImageButton);

class WT_TSCContentButton extends WT_TSCButton {
    _appendChildren() {
        this._content = document.createElement("slot");
        this._content.name = "content";
        this._content.style.display = "block";
        this._content.style.width = "100%";
        this._content.style.height = "100%";

        this._wrapper.appendChild(this._content);
    }
}

customElements.define("wt-tsc-button-content", WT_TSCContentButton);