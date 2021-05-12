class WT_G3x5_TSCChartsTouchControl extends WT_G3x5_TSCPageElement {
    /**
     * @param {String} homePageGroup
     * @param {String} homePageName
     * @param {WT_G3x5_TSCCharts} chartsPage
     */
    constructor(homePageGroup, homePageName, chartsPage) {
        super(homePageGroup, homePageName);

        this._chartsPage = chartsPage;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCChartsTouchControlHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createHTMLElement() {
        return new WT_G3x5_TSCChartsTouchControlHTMLElement();
    }

    _initListeners() {
        this.htmlElement.addButtonListener(this._onButtonPressed.bind(this));
        this.htmlElement.addTouchPadListener(this._onTouchEvent.bind(this));
    }

    init(root) {
        this.container.title = WT_G3x5_TSCChartsTouchControl.TITLE;

        this._htmlElement = this._createHTMLElement();
        root.appendChild(this.htmlElement);
        this._initListeners();
    }

    _openOptionsWindow() {
        this.instrument.chartsOptions.element.setContext({homePageGroup: this.homePageGroup, homePageName: this.homePageName, chartsPage: this._chartsPage});
        this.instrument.switchToPopUpPage(this.instrument.chartsOptions);
    }

    _onButtonPressed(buttonID) {
        switch (buttonID) {
            case WT_G3x5_TSCChartsTouchControlHTMLElement.ButtonID.ROTATE_CCW:
                this._chartsPage.rotateCCW();
                break;
            case WT_G3x5_TSCChartsTouchControlHTMLElement.ButtonID.ROTATE_CW:
                this._chartsPage.rotateCW();
                break;
            case WT_G3x5_TSCChartsTouchControlHTMLElement.ButtonID.OPTIONS:
                this._openOptionsWindow();
                break;
        }
    }

    /**
     *
     * @param {WT_TSCTouchPadEvent} event
     */
    _onTouchEvent(event) {
        this._chartsPage.scroll(event.deltaPos);
    }

    _activateLabelBar() {
        this.instrument.setTopKnobText("Pan/Point Push: Pan Off");
        this.instrument.setBottomKnobText("-Range+ Push: Pan Off");
    }

    _deactivateLabelBar() {
        this.instrument.setTopKnobText("");
        this.instrument.setBottomKnobText("-Range+ Push: Pan");
    }

    onFocusGained() {
        super.onFocusGained();

        this._activateLabelBar();
    }

    onFocusLost() {
        super.onFocusLost();

        this._deactivateLabelBar();
    }

    onEnter() {
        this.htmlElement.open();
    }

    onExit() {
        this.htmlElement.close();
    }

    onEvent(event) {
        switch (event) {
            case "TopKnob_Push":
                this.instrument.goBack();
                break;
        }
    }
}
WT_G3x5_TSCChartsTouchControl.TITLE = "Charts Pan/Zoom Control";
WT_G3x5_TSCChartsTouchControl.SCROLL_KNOB_QUANTUM = 10; // pixels

class WT_G3x5_TSCChartsTouchControlHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._isInit = false;

        this._touchPadListenerBuffer = [];
        /**
         * @type {((buttonID:WT_G3x5_TSCChartsTouchControlHTMLElement.ButtonID) => void)[]}
         */
        this._buttonListeners = [];
    }

    _getTemplate() {
        return WT_G3x5_TSCChartsTouchControlHTMLElement.TEMPLATE;
    }

    async _defineChildren() {
        [
            this._rotateCCWButton,
            this._optionsButton,
            this._rotateCWButton,
            this._touchPad
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#rotateccw`, WT_TSCImageButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#options`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#rotatecw`, WT_TSCImageButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#touchpad`, WT_TSCTouchPad)
        ]);
    }

    _initListeners() {
        this._rotateCCWButton.addButtonListener(this._onRotateCCWButtonPressed.bind(this));
        this._rotateCWButton.addButtonListener(this._onRotateCWButtonPressed.bind(this));
        this._optionsButton.addButtonListener(this._onOptionsButtonPressed.bind(this));
    }

    _processListenerBuffer() {
        this._touchPadListenerBuffer.forEach(listener => this._touchPad.addTouchListener(listener));
        this._touchPadListenerBuffer = null;
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._initListeners();
        this._processListenerBuffer();
        this._isInit = true;
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _notifyButtonListeners(buttonID) {
        this._buttonListeners.forEach(listener => listener(buttonID));
    }

    _onRotateCCWButtonPressed(button) {
        this._notifyButtonListeners(WT_G3x5_TSCChartsTouchControlHTMLElement.ButtonID.ROTATE_CCW);
    }

    _onRotateCWButtonPressed(button) {
        this._notifyButtonListeners(WT_G3x5_TSCChartsTouchControlHTMLElement.ButtonID.ROTATE_CW);
    }

    _onOptionsButtonPressed(button) {
        this._notifyButtonListeners(WT_G3x5_TSCChartsTouchControlHTMLElement.ButtonID.OPTIONS);
    }

    /**
     *
     * @param {(WT_TSCTouchPadEvent) => void} listener
     */
    addTouchPadListener(listener) {
        if (this._isInit) {
            this._touchPad.addTouchListener(listener);
        } else {
            this._touchPadListenerBuffer.push(listener);
        }
    }

    /**
     *
     * @param {(WT_TSCTouchPadEvent) => void} listener
     */
    removeTouchPadListener(listener) {
        if (this._isInit) {
            this._touchPad.removeTouchListener(listener);
        } else {
            let index = this._touchPadListenerBuffer.indexOf(listener);
            if (index >= 0) {
                this._touchPadListenerBuffer.splice(index, 1);
            }
        }
    }

    /**
     *
     * @param {(buttonID:WT_G3x5_TSCChartsTouchControlHTMLElement.ButtonID) => void} listener
     */
    addButtonListener(listener) {
        this._buttonListeners.push(listener);
    }

    /**
     *
     * @param {(buttonID:WT_G3x5_TSCChartsTouchControlHTMLElement.ButtonID) => void} listener
     */
    removeButtonListener(listener) {
        let index = this._buttonListeners.indexOf(listener);
        if (index >= 0) {
            this._buttonListeners.splice(index, 1);
        }
    }

    open() {
    }

    close() {
        this._touchPad.reset();
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_TSCChartsTouchControlHTMLElement.ButtonID = {
    ROTATE_CCW: 0,
    ROTATE_CW: 1,
    OPTIONS: 2
};
WT_G3x5_TSCChartsTouchControlHTMLElement.NAME = "wt-tsc-chartstouchcontrol";
WT_G3x5_TSCChartsTouchControlHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCChartsTouchControlHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            width: 100%;
            height: 100%;
            background-color: black;
            border: 3px solid #454b4e;
            border-radius: 3px;
        }

        #wrapper {
            position: absolute;
            left: var(--chartstouchcontrol-padding-left, 0.2em);
            top: var(--chartstouchcontrol-padding-top, 0.2em);
            width: calc(100% - var(--chartstouchcontrol-padding-left, 0.2em) - var(--chartstouchcontrol-padding-right, 0.2em));
            height: calc(100% - var(--chartstouchcontrol-padding-top, 0.2em) - var(--chartstouchcontrol-padding-bottom, 0.2em));
            display: grid;
            grid-template-rows: var(--chartstouchcontrol-header-height, 4em) 1fr;
            grid-template-columns: 100%;
            grid-gap: var(--chartstouchcontrol-header-margin-bottom, 0.2em) 0;
        }
            #header {
                position: relative;
                display: flex;
                flex-flow: row nowrap;
                justify-content: space-between;
                align-items: stretch;
            }
                .button {
                    width: var(--chartstouchcontrol-header-button-width, 6em);
                }
            #touchpad {
                border: var(--chartstouchcontrol-touchpad-border, 2px solid white);
                border-radius: var(--chartstouchcontrol-touchpad-border-radius, 5px);
                background-size: var(--chartstouchcontrol-touchpad-grid-width, 1.5em) var(--chartstouchcontrol-touchpad-grid-height, 1.5em);
                background-image: linear-gradient(to right, var(--chartstouchcontrol-touchpad-grid-line-vertical, grey 1px), transparent 1px), linear-gradient(to bottom, var(--chartstouchcontrol-touchpad-grid-line-horizontal, grey 1px), transparent 1px);
                background-position: center;
            }
    </style>
    <div id="wrapper">
        <div id="header">
            <wt-tsc-button-img id="rotateccw" class="button" labeltext="Rotate" imgsrc="/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_TSC_ROTATE_CCW.png"></wt-tsc-button-img>
            <wt-tsc-button-label id="options" class="button" labeltext="Charts Options"></wt-tsc-button-label>
            <wt-tsc-button-img id="rotatecw" class="button" labeltext="Rotate" imgsrc="/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_TSC_ROTATE_CW.png"></wt-tsc-button-img>
        </div>
        <wt-tsc-touchpad id="touchpad"></wt-tsc-touchpad>
    </div>
`;

customElements.define(WT_G3x5_TSCChartsTouchControlHTMLElement.NAME, WT_G3x5_TSCChartsTouchControlHTMLElement);