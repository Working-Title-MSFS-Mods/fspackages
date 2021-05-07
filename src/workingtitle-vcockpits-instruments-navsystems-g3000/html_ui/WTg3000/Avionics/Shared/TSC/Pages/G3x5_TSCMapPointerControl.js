class WT_G3x5_TSCMapPointerControl extends WT_G3x5_TSCPageElement {
    constructor(homePageGroup, homePageName, instrumentID, halfPaneID) {
        super(homePageGroup, homePageName);

        this._instrumentID = instrumentID;
        this._halfPaneID = halfPaneID;

        let mapID = `${instrumentID}-${halfPaneID}`;
        this._mapSettingModelID = mapID;
        this._eventHandler = new WT_G3x5_NavMapPointerEventHandler(mapID);
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCMapPointerControlHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createHTMLElement() {
        return new WT_G3x5_TSCMapPointerControlHTMLElement();
    }

    _initListeners() {
        this.htmlElement.addTouchPadListener(this._onTouchEvent.bind(this));
    }

    init(root) {
        this.container.title = WT_G3x5_TSCMapPointerControl.TITLE;

        this._htmlElement = this._createHTMLElement();
        root.appendChild(this.htmlElement);
        this._initListeners();
    }

    /**
     *
     * @param {WT_TSCTouchPadEvent} event
     */
    _onTouchEvent(event) {
        this._eventHandler.fireScrollEvent(event.deltaPos);
    }

    _activateLabelBar() {
        this.instrument.setTopKnobText("Pan/Point Push: Pan Off");
        this.instrument.setBottomKnobText("-Range+ Push: Pan Off");
    }

    _deactivateLabelBar() {
        this.instrument.setTopKnobText("");
        this.instrument.setBottomKnobText("-Range+ Push: Pan");
    }

    onEnter() {
        super.onEnter();

        this._activateLabelBar();
        this.htmlElement.open();
        WT_MapSettingModel.setSettingValue(this._mapSettingModelID, WT_G3x5_MapPointerShowSetting.KEY, true);
    }

    onExit() {
        super.onExit();

        this._deactivateLabelBar();
        this.htmlElement.close();
        WT_MapSettingModel.setSettingValue(this._mapSettingModelID, WT_G3x5_MapPointerShowSetting.KEY, false);
    }

    onEvent(event) {
        switch (event) {
            case "TopKnob_Push":
                this.instrument.goBack();
                break;
        }
    }
}
WT_G3x5_TSCMapPointerControl.TITLE = "Map Pointer Control";
WT_G3x5_TSCMapPointerControl.SCROLL_KNOB_QUANTUM = 10; // pixels

class WT_G3x5_TSCMapPointerControlHTMLElement extends HTMLElement {
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
        return WT_G3x5_TSCMapPointerControlHTMLElement.TEMPLATE;
    }

    async _defineChildren() {
        this._touchPad = await WT_CustomElementSelector.select(this.shadowRoot, `#touchpad`, WT_TSCTouchPad);
    }

    _initListeners() {
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
     * @param {(buttonID:WT_G3x5_TSCMapPointerControlHTMLElement.ButtonID) => void} listener
     */
    addButtonListener(listener) {
        this._buttonListeners.push(listener);
    }

    /**
     *
     * @param {(buttonID:WT_G3x5_TSCMapPointerControlHTMLElement.ButtonID) => void} listener
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
WT_G3x5_TSCMapPointerControlHTMLElement.ButtonID = {
};
WT_G3x5_TSCMapPointerControlHTMLElement.NAME = "wt-tsc-mappointercontrol";
WT_G3x5_TSCMapPointerControlHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCMapPointerControlHTMLElement.TEMPLATE.innerHTML = `
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
            left: var(--mappointercontrol-padding-left, 0.2em);
            top: var(--mappointercontrol-padding-top, 0.2em);
            width: calc(100% - var(--mappointercontrol-padding-left, 0.2em) - var(--mappointercontrol-padding-right, 0.2em));
            height: calc(100% - var(--mappointercontrol-padding-top, 0.2em) - var(--mappointercontrol-padding-bottom, 0.2em));
            display: grid;
            grid-template-rows: var(--mappointercontrol-header-height, 4em) 1fr;
            grid-template-columns: 100%;
            grid-gap: var(--mappointercontrol-header-margin-bottom, 0.2em) 0;
        }
            #header {
                position: relative;
                display: grid;
                grid-template-rows: 100%;
                grid-template-columns: repeat(5, 1fr);
                grid-gap: 0 var(--mappointercontrol-header-grid-column-gap, 0.5em);
            }
                #directto {
                    --button-img-image-height: 100%;
                }
            #touchpad {
                border: var(--mappointercontrol-touchpad-border, 2px solid white);
                border-radius: var(--mappointercontrol-touchpad-border-radius, 5px);
                background-size: var(--mappointercontrol-touchpad-grid-width, 1.5em) var(--mappointercontrol-touchpad-grid-height, 1.5em);
                background-image: linear-gradient(to right, var(--mappointercontrol-touchpad-grid-line-vertical, grey 1px), transparent 1px), linear-gradient(to bottom, var(--mappointercontrol-touchpad-grid-line-horizontal, grey 1px), transparent 1px);
                background-position: center;
            }
    </style>
    <div id="wrapper">
        <div id="header">
            <wt-tsc-button-img id="directto" class="button" imgsrc="/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_MAP_DIRECT_TO_1.png" enabled="false"></wt-tsc-button-img>
            <wt-tsc-button-label id="info" class="button" labeltext="Info" enabled="false"></wt-tsc-button-label>
            <wt-tsc-button-label id="insertfpln" class="button" labeltext="Insert in FPL" enabled="false"></wt-tsc-button-label>
            <wt-tsc-button-label id="createwaypoint" class="button" labeltext="Create WPT" enabled="false"></wt-tsc-button-label>
            <wt-tsc-button-label id="brgdis" class="button" labeltext="BRG/DIS" enabled="false"></wt-tsc-button-label>
        </div>
        <wt-tsc-touchpad id="touchpad"></wt-tsc-touchpad>
    </div>
`;

customElements.define(WT_G3x5_TSCMapPointerControlHTMLElement.NAME, WT_G3x5_TSCMapPointerControlHTMLElement);