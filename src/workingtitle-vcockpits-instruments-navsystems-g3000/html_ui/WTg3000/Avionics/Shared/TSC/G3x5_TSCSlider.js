class WT_G3x5_TSCSlider extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._min = WT_G3x5_TSCSlider.MIN_DEFAULT;
        this._max = WT_G3x5_TSCSlider.MAX_DEFAULT;
        this._step = WT_G3x5_TSCSlider.STEP_DEFAULT;
        this._value = this._validateValue((WT_G3x5_TSCSlider.MIN_DEFAULT + WT_G3x5_TSCSlider.MAX_DEFAULT) / 2);
        this._isInit = false;

        /**
         * @type {WT_G3x5_TSCSliderLabel[]}
         */
        this._topLabels = [];
        /**
         * @type {WT_G3x5_TSCSliderLabel[]}
         */
        this._bottomLabels = [];

        this._labelListener = this._onLabelValueChanged.bind(this);

        /**
         * @type {((slider:WT_G3x5_TSCSlider, oldValue:Number, newValue:Number) => void)[]}
         */
        this._listeners = [];
    }

    _getTemplate() {
        return WT_G3x5_TSCSlider.TEMPLATE;
    }

    async _defineChildren() {
        [
            this._decButton,
            this._incButton
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#decrease`, WT_TSCImageButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#increase`, WT_TSCImageButton)
        ]);

        this._rangeSlider = this.shadowRoot.querySelector(`#slider`);
        this._sliderBGLeftClip = this.shadowRoot.querySelector(`#sliderbgleftclip`);
        this._sliderBGRightClip = this.shadowRoot.querySelector(`#sliderbgrightclip`);
    }

    _initRangeSlider() {
        this._rangeSlider.addEventListener("input", this._onRangeSliderInput.bind(this));
    }

    _initButtonListeners() {
        this._decButton.addButtonListener(this._onDecButtonPressed.bind(this));
        this._incButton.addButtonListener(this._onIncButtonPressed.bind(this));
    }

    _initMin() {
        this._setMin(this._min);
    }

    _initMax() {
        this._setMax(this._max);
    }

    _initStep() {
        this._setStep(this._step);
    }

    _initState() {
        this._initMin();
        this._initMax();
        this._initStep();
        this._syncRangeSliderFromValue();
        this._updateBGClip();
        this._updateButtons();
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._initRangeSlider();
        this._initButtonListeners();
        this._isInit = true;
        this._initState();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    static get observedAttributes() {
        return ["min", "max", "step"];
    }

    /**
     * The minimum numeric value of this slider.
     * @type {Number}
     */
    get min() {
        return this._min;
    }

    set min(value) {
        this._min = value;
        this.setAttribute("min", value);
    }

    /**
     * The maximum numeric value of this slider.
     * @type {Number}
     */
    get max() {
        return this._max;
    }

    set max(value) {
        this._max = value;
        this.setAttribute("max", value);
    }

    /**
     * The interval separating valid numeric values this slider can represent.
     * @type {Number}
     */
    get step() {
        return this._step;
    }

    set step(value) {
        this._step = value;
        this.setAttribute("step", value);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "min":
                this._setMin(parseFloat(newValue));
                break;
            case "max":
                this._setMax(parseFloat(newValue));
                break;
            case "step":
                this._setStep(parseFloat(newValue));
                break;
        }
    }

    _validateValue(value) {
        return Math.max(this._min, Math.min(this._max, Math.round(value / this._step) * this._step));
    }

    _setMin(value) {
        this._min = value;
        this._setValue(this._value);

        if (this._isInit) {
            this._rangeSlider.min = value;
            this._syncRangeSliderFromValue();
        }
    }

    _setMax(value) {
        this._max = value;
        this._setValue(this._value);

        if (this._isInit) {
            this._rangeSlider.max = value;
            this._syncRangeSliderFromValue();
        }
    }

    _setStep(value) {
        this._step = value;
        this._setValue(this._value);

        if (this._isInit) {
            this._rangeSlider.step = value;
            this._syncRangeSliderFromValue();
        }
    }

    _syncRangeSliderFromValue() {
        this._rangeSlider.value = this._value;
    }

    _onRangeSliderInput(event) {
        this._setValue(this._rangeSlider.value);
    }

    _onDecButtonPressed(button) {
        this.setValue(this._value - this._step);
    }

    _onIncButtonPressed(button) {
        this.setValue(this._value + this._step);
    }

    /**
     *
     * @param {WT_G3x5_TSCSliderLabel} label
     */
    _updateLabelPosition(label) {
        let xPos = (label.getValue() - this._min) / (this._max - this._min);
        label.htmlElement.style.left = `${xPos * 100}%`;
    }

    _onLabelValueChanged(label, oldValue, newValue) {
        this._updateLabelPosition(label);
    }

    /**
     * Gets the current numeric value of this slider.
     * @returns {Number} the current numeric value of this slider.
     */
    getValue() {
        return this._value;
    }

    _updateBGClip() {
        let clipPercent = (this._value - this._min) / (this._max - this._min) * 100;
        let clipPercentLeft = Math.max(0.01, clipPercent); // clip path does not like 0-length clip bounds
        let clipPercentRight = Math.min(99.99, clipPercent);
        this._sliderBGLeftClip.style.webkitClipPath = `polygon(0 0,${clipPercentLeft}% 0,${clipPercentLeft}% 100%,0 100%)`;
        this._sliderBGRightClip.style.webkitClipPath = `polygon(${clipPercentRight}% 0,100% 0,100% 100%,${clipPercentRight}% 100%)`;
    }

    _updateButtons() {
        this._decButton.enabled = `${this._value > this._min}`;
        this._incButton.enabled = `${this._value < this._max}`;
    }

    _notifyListeners(oldValue, newValue) {
        this._listeners.forEach(listener => listener(this, oldValue, newValue));
    }

    _setValue(value) {
        let oldValue = this._value;
        this._value = this._validateValue(value);
        if (oldValue !== this._value) {
            this._notifyListeners(oldValue, this._value);
        }

        if (this._isInit) {
            this._updateBGClip();
            this._updateButtons();
        }
    }

    /**
     * Sets the numeric value of this slider.
     * @param {Number} value - the new value.
     */
    setValue(value) {
        this._setValue(value);

        if (this._isInit) {
            this._syncRangeSliderFromValue();
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCSliderLabel} label
     * @param {Boolean} top
     */
    _initLabel(label, top) {
        label.htmlElement.slot = top ? "toplabels" : "bottomlabels";
        label.htmlElement.style.position = "absolute";
        label.htmlElement.style.transform = "translateX(-50%)";
        this.appendChild(label.htmlElement);
        label.addValueListener(this._labelListener);
        this._updateLabelPosition(label);
    }

    /**
     *
     * @param {WT_G3x5_TSCSliderLabel} label
     * @param {Boolean} top
     */
    addLabel(label, top) {
        let array = top ? this._topLabels : this._bottomLabels;
        this._initLabel(label, top);
        array.push(label);
    }

    /**
     *
     * @param {WT_G3x5_TSCSliderLabel} label
     */
    _cleanUpLabel(label) {
        this.removeChild(label.htmlElement);
        label.removeValueListener(this._labelListener);
    }

    /**
     *
     * @param {WT_G3x5_TSCSliderLabel} label
     * @param {Boolean} top
     */
    removeLabel(label, top) {
        let array = top ? this._topLabels : this._bottomLabels;
        let index = array.indexOf(label);
        if (index >= 0) {
            this._cleanUpLabel(label);
            array.splice(index, 1);
        }
    }

    /**
     * Adds a listener function which will be called when this slider's value changes.
     * @param {(slider:WT_G3x5_TSCSlider, oldValue:Number, newValue:Number) => void} listener - the listener function to add.
     */
    addValueListener(listener) {
        this._listeners.push(listener);
    }

    /**
     * Removes a previously added listener function.
     * @param {(slider:WT_G3x5_TSCSlider, oldValue:Number, newValue:Number) => void} listener - the listener function to remove.
     */
    removeValueListener(listener) {
        let index = this._listeners.indexOf(listener);
        if (index >= 0) {
            this._listeners.splice(index, 1);
        }
    }
}
WT_G3x5_TSCSlider.MIN_DEFAULT = 1;
WT_G3x5_TSCSlider.MAX_DEFAULT = 100;
WT_G3x5_TSCSlider.STEP_DEFAULT = 1;
WT_G3x5_TSCSlider.NAME = "wt-tsc-slider";
WT_G3x5_TSCSlider.TEMPLATE = document.createElement("template");
WT_G3x5_TSCSlider.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper {
            position: absolute;
            left: var(--slider-padding-left, 0.2em);
            top: 50%;
            width: calc(100% - var(--slider-padding-left, 0.2em) - var(--slider-padding-right, 0.2em));
            height: calc(var(--slider-height, 4em) + var(--slider-label-top-height, 0px) + var(--slider-label-bottom-height, 0px) + 2 * var(--slider-label-track-margin, 0.2em));
            transform: translateY(-50%);
            display: grid;
            grid-template-rows: var(--slider-label-top-height, 0px) var(--slider-height, 4em) var(--slider-label-bottom-height, 0px);
            grid-template-columns: var(--slider-button-width, 4em) 1fr var(--slider-button-width, 4em);
            grid-gap: var(--slider-label-track-margin, 0.2em) var(--slider-button-track-margin, 0.2em);
        }
            .button {
                --button-img-image-top: 10%;
                --button-img-image-height: 80%;
            }
            #decrease {
                grid-area: 2 / 1;
            }
            #increase {
                grid-area: 2 / 3;
            }
            #slidercontainer {
                position: relative;
                border: var(--slider-track-border, 3px ridge var(--wt-g3x5-bordergray));
                border-radius: var(--slider-track-border-radius, 3px);
                background: linear-gradient(#5f7283 0.4vh, #1f3445, black 2vh);
                background-color: black;
                overflow: hidden;
                grid-area: 2 / 2;
            }
                #sliderBgContainer {
                    position: absolute;
                    left: 0%;
                    top: 0%;
                    width: 100%;
                    height: 100%;
                }
                    .sliderBgInset {
                        display: block;
                        position: absolute;
                        left: var(--slider-track-background-padding-left, 0.25em);
                        top: var(--slider-track-background-padding-top, 0.25em);
                        width: calc(100% - var(--slider-track-background-padding-left, 0.25em) - var(--slider-track-background-padding-right, 0.25em));
                        height: calc(100% - var(--slider-track-background-padding-top, 0.25em) - var(--slider-track-background-padding-bottom, 0.25em));
                    }
                    #sliderBgBacking {
                        border: var(--slider-track-background-border, 1px solid var(--wt-g3x5-bordergray));
                        border-radius: var(--slider-track-background-border-radius, 3px);
                        background-color: var(--slider-track-background-color, black);
                    }
                    .sliderBgClip {
                        position: absolute;
                        left: 0%;
                        top: 0%;
                        width: 100%;
                        height: 100%;
                        -webkit-clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
                    }
                #slider {
                    display: block;
                    -webkit-appearance: none;
                    position: absolute;
                    left: 0%;
                    top: 0%;
                    width: 100%;
                    height: 100%;
                    background: transparent;
                    margin: 0;
                    padding: 0;
                }
                #slider::-webkit-slider-runnable-track {
                    width: 100%;
                    height: 100%;
                    background: transparent;
                }
                #slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: var(--slider-thumb-width, 10%);
                    height: 100%;
                    background: var(--slider-thumb-background, #00b2bf);
                    border: var(--slider-thumb-border, solid 2px black);
                    border-radius: var(--slider-thumb-border-radius, 3px);
                    margin-top: 0;
                }
            .labels {
                display: block;
                position: relative;
                width: 100%;
                height: 100%;
            }
            #toplabels {
                grid-area: 1 / 2;
            }
            #bottomlabels {
                grid-area: 3 / 2;
            }
    </style>
    <div id="wrapper">
        <wt-tsc-button-img id="decrease" class="button" imgsrc="/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_ARROW_LEFT_MINUS.png"></wt-tsc-button-img>
        <div id="slidercontainer">
            <div id="sliderBgContainer">
                <div id="sliderBgBacking" class="sliderBgInset"></div>
                <div id="sliderbgleftclip" class="sliderBgClip">
                    <slot id="sliderbgleft" class="sliderBgInset" name="sliderbgleft"></slot>
                </div>
                <div id="sliderbgrightclip" class="sliderBgClip">
                    <slot id="sliderbgright" class="sliderBgInset" name="sliderbgright"></slot>
                </div>
            </div>
            <input type="range" id="slider" />
        </div>
        <wt-tsc-button-img id="increase" class="button" imgsrc="/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_ARROW_RIGHT_PLUS.png"></wt-tsc-button-img>
        <slot name="toplabels" id="toplabels" class="labels"></slot>
        <slot name="bottomlabels" id="bottomlabels" class="labels"></slot>
    </div>
`;

customElements.define(WT_G3x5_TSCSlider.NAME, WT_G3x5_TSCSlider);

class WT_G3x5_TSCSliderLabel {
    /**
     * @param {HTMLElement} htmlElement
     * @param {Number} [value]
     */
    constructor(htmlElement, value) {
        this._htmlElement = htmlElement;

        this._value = (typeof value === "number") ? value : 0;

        /**
         * @type {((label:WT_G3x5_TSCSliderLabel, oldValue:Number, newValue:Number) => void)[]}
         */
        this._listeners = [];
    }

    /**
     * @readonly
     * @type {HTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _notifyListeners(oldValue, newValue) {
        this._listeners.forEach(listener => listener(this, oldValue, newValue));
    }

    /**
     * Gets the current numeric value of this label.
     * @returns {Number} the current numeric value of this label.
     */
    getValue() {
        return this._value;
    }

    /**
     * Sets the numeric value of this label.
     * @param {Number} value - the new value.
     */
    setValue(value) {
        let oldValue = this._value;
        this._value = value;

        if (oldValue !== value) {
            this._notifyListeners(oldValue, value);
        }
    }

    /**
     * Adds a listener function which will be called when this label's value changes.
     * @param {(label:WT_G3x5_TSCSliderLabel, oldValue:Number, newValue:Number) => void} listener - the listener function to add.
     */
    addValueListener(listener) {
        this._listeners.push(listener);
    }

    /**
     * Removes a previously added listener function.
     * @param {(label:WT_G3x5_TSCSliderLabel, oldValue:Number, newValue:Number) => void} listener - the listener function to remove.
     */
    removeValueListener(listener) {
        let index = this._listeners.indexOf(listener);
        if (index >= 0) {
            this._listeners.splice(index, 1);
        }
    }
}