class WT_TSCButton extends HTMLElement {
    constructor() {
        super();

        let wrapperStyle = this._initWrapperStyle();
        let labelBoxStyle = this._initLabelBoxStyle();
        let labelStyle = this._initLabelStyle();

        this._style = document.createElement("style");
        let baseStyle = document.createTextNode(`
            :host {
                display: block;
                background: linear-gradient(#5f7283 0.4vh, #1f3445, black 2vh);
                background-color: black;
                border: 3px solid #404040;
                border-radius: 4px;
                position: relative;
                text-align: center;
                color: white;
            }
            :host([enabled=true][primed=true]) {
                background: linear-gradient(#62f0f5, #0eb8d4 8%, #018cb5 30%, #0285ac 90%);
                border: 0.5vh solid #32a1bd;
            }
            :host([enabled=false]) {
                filter: grayscale(50%) brightness(40%);
            }

            ${wrapperStyle}
            ${labelBoxStyle}
            ${labelStyle}
        `);
        this._style.appendChild(baseStyle);

        this._wrapper = document.createElement("div");
        this._wrapper.id = "wrapper";
        this._labelBox = document.createElement("div");
        this._labelBox.id = "labelbox";
        this._label = document.createElement("div");
        this._label.id = "label";
        this._labelBox.appendChild(this._label);
        this._wrapper.appendChild(this._labelBox);

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._wrapper);

        this._listeners = [];

        this._enabled = true;
        this._primed = false;
        this.setAttribute("enabled", "true");
    }

    _initWrapperStyle() {
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

    _initLabelBoxStyle() {
        return `
            #labelbox {
                position: absolute;
                width: 100%;
                height: 100%;
            }
        `;
    }

    _initLabelStyle() {
        return `
            #label {
                position: absolute;
                width: 100%;
                top: 50%;
                transform: translateY(-50%);
            }
        `;
    }

    static get observedAttributes() {
        return ["enabled", "primed", "labeltext"];
    }

    get enabled() {
        return this.getAttribute("enabled");
    }

    set enabled(value) {
        this.setAttribute("enabled", value);
    }

    get labelText() {
        return this._label.innerHTML;
    }

    set labelText(value) {
        this.setAttribute("labeltext", value + "");
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
            case "labeltext":
                this._setLabelText(newValue);
                break;
        }
    }

    connectedCallback() {
        this.shadowRoot.appendChild(this._style);
        this._label = this.shadowRoot.querySelector(`#label`);
        this.addEventListener("mousedown", this._onMouseDown.bind(this));
        this.addEventListener("mouseup", this._onMouseUp.bind(this));
        this.addEventListener("mouseleave", this._onMouseLeave.bind(this));
    }

    disconnectedCallback() {
        this.clearButtonListeners();
    }

    _setLabelText(value) {
        this._label.innerHTML = value;
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

customElements.define("tsc-button", WT_TSCButton);

class WT_TSCStatusBarButton extends WT_TSCButton {
    constructor() {
        super();

        this._style.appendChild(document.createTextNode(`
            #statusbar {
                position: absolute;
                width: 50%;
                height: 10%;
                left: 25%;
                bottom: 12%;
                border-radius: var(--statusbar-border-radius, 0.5vh);
                background-color: var(--statusbar-color-off, grey);
            }
            #statusbar[state=on] {
                background-color: var(--statusbar-color-on, lawngreen);
            }
        `));

        this._statusBar = document.createElement("div");
        this._statusBar.id = "statusbar";

        this._wrapper.appendChild(this._statusBar);
    }

    _initLabelBoxStyle() {
        return `
            #labelbox {
                position: absolute;
                width: 100%;
                top: 0%;
                bottom: 30%;
            }
        `;
    }

    static get observedAttributes() {
        return [...WT_TSCButton.observedAttributes, "toggle"];
    }

    get toggle() {
        return this.getAttribute("toggle");
    }

    set toggle(value) {
        this.setAttribute("toggle", value);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        if (name === "toggle") {
            this._setToggle(newValue);
        }
    }

    _setToggle(value) {
        this._statusBar.setAttribute("state", value);
    }
}

customElements.define("tsc-button-statusbar", WT_TSCStatusBarButton);

class WT_TSCValueButton extends WT_TSCButton {
    constructor() {
        super();

        this._style.appendChild(document.createTextNode(`
            #valuebox {
                position: absolute;
                width: 100%;
                top: 55%;
                bottom: 0%;
            }

            #value {
                position: absolute;
                width: 100%;
                top: 50%;
                transform: translateY(-50%);
                color: var(--value-color, #67e8ef);
                font-size: var(--value-font-size, 1em);
            }
        `));

        this._valueBox = document.createElement("div");
        this._valueBox.id = "valuebox";
        this._value = document.createElement("div");
        this._value.id = "value";
        this._valueBox.appendChild(this._value);

        this._wrapper.appendChild(this._valueBox);
    }

    _initLabelBoxStyle() {
        return `
            #labelbox {
                position: absolute;
                width: 100%;
                top: 0%;
                bottom: 60%;
            }
        `;
    }

    static get observedAttributes() {
        return [...WT_TSCButton.observedAttributes, "valuetext"];
    }

    get valueText() {
        return this._value.innerHTML;
    }

    set valueText(value) {
        this.setAttribute("valuetext", value);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        if (name === "valuetext") {
            this._setValueText(newValue);
        }
    }

    _setValueText(value) {
        this._value.innerHTML = value;
    }
}

customElements.define("tsc-button-value", WT_TSCValueButton);

class WT_TSCImageButton extends WT_TSCButton {
    constructor() {
        super();

        this._style.appendChild(document.createTextNode(`
            #img {
                position: absolute;
                left: 50%;
                transform: translateX(-50%);
                max-width: 90%;
                top: 5%;
                height: 50%;
            }
        `));

        this._img = document.createElement("img");
        this._img.id = "img";
        this._wrapper.appendChild(this._img);
    }

    _initLabelBoxStyle() {
        return `
            #labelbox {
                position: absolute;
                width: 100%;
                top: 55%;
                bottom: 5%;
            }
        `;
    }

    static get observedAttributes() {
        return [...WT_TSCButton.observedAttributes, "imgsrc"];
    }

    get imgSrc() {
        return this._img.src;
    }

    set imgSrc(value) {
        this.setAttribute("imgsrc", value);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        if (name === "imgsrc") {
            this._img.src = newValue;
        }
    }
}

customElements.define("tsc-button-img", WT_TSCImageButton);

class WT_TSCContentButton extends WT_TSCButton {
    constructor() {
        super();

        this._content = document.createElement("slot");
        this._content.name = "content";
        this._content.style.display = "block";
        this._content.style.width = "100%";
        this._content.style.height = "100%";

        this._wrapper.appendChild(this._content);
    }

    _initLabelBoxStyle() {
        return `
            #labelbox {
                display: none;
            }
        `;
    }
}

customElements.define("tsc-button-content", WT_TSCContentButton);