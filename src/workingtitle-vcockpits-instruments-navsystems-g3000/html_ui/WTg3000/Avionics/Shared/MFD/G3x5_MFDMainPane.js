class WT_G3x5_MFDMainPane extends NavSystemElement {
    constructor(instrumentID, icaoWaypointFactory, icaoSearchers, flightPlanManager) {
        super();

        this._instrumentID = instrumentID;
        this._icaoWaypointFactory = icaoWaypointFactory;
        this._icaoSearchers = icaoSearchers;
        this._flightPlanManager = flightPlanManager;

        this._controller = new WT_DataStoreController(`${instrumentID}`, null);

        this._mode;

        this._updateCounter = 0;
    }

    /**
     * @readonly
     * @property {String} instrumentID
     * @type {String}
     */
    get instrumentID() {
        return this._instrumentID;
    }

    /**
     * @readonly
     * @property {WT_G3000MFDMainPaneHTMLElement} htmlElement
     * @type {WT_G3000MFDMainPaneHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     * @readonly
     * @property {WT_DataStoreController} controller
     * @type {WT_DataStoreController}
     */
    get controller() {
        return this._controller;
    }

    /**
     *
     * @param {HTMLElement} root
     */
    init(root) {
        this._htmlElement = root;

        /**
         * @type {WT_G3x5_MFDHalfPane}
         */
        this._left = new WT_G3x5_MFDHalfPane(this.htmlElement.querySelector(`mfd-halfpane[slot="left"]`), this.instrumentID, "LEFT", this._icaoWaypointFactory, this._icaoSearchers, this._flightPlanManager);

        /**
         * @type {WT_G3x5_MFDHalfPane}
         */
        this._right = new WT_G3x5_MFDHalfPane(this.htmlElement.querySelector(`mfd-halfpane[slot="right"]`), this.instrumentID, "RIGHT", this._icaoWaypointFactory, this._icaoSearchers, this._flightPlanManager);

        this._setMode(WT_G3x5_MFDMainPaneModeSetting.Mode.FULL);
    }

    _setMode(mode) {
        let halfRefresh = mode === WT_G3x5_MFDMainPaneModeSetting.Mode.HALF;
        this._left.setHalfRefresh(halfRefresh);
        this._right.setHalfRefresh(halfRefresh);
        this.htmlElement.setMode(mode);
        this._mode = mode;
    }

    _updateHalfPanes(updateCounter) {
        this._left.update(updateCounter % 2);
        if (this._mode === WT_G3x5_MFDMainPaneModeSetting.Mode.HALF) {
            this._right.update((updateCounter + 1) % 2);
        }
    }

    onUpdate(deltaTime) {
        this._updateHalfPanes(this._updateCounter);
        this._updateCounter = this._updateCounter + 1;
    }

    onEvent(event) {
    }
}

class WT_G3000MFDMainPaneHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3000MFDMainPaneHTMLElement.TEMPLATE_SHADOW.content.cloneNode(true));

        this._showWeather = false;
    }

    connectedCallback() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);
    }

    setMode(mode) {
        switch (mode) {
            case WT_G3x5_MFDMainPaneModeSetting.Mode.HALF:
                this._wrapper.setAttribute("state", "half");
                break;
            default:
                this._wrapper.setAttribute("state", "full");
        }
    }
}
WT_G3000MFDMainPaneHTMLElement.TEMPLATE_SHADOW = document.createElement("template");
WT_G3000MFDMainPaneHTMLElement.TEMPLATE_SHADOW.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            background-color: black;
            display: grid;
            grid-template-columns: 100%;
            grid-template-rows: auto;
        }
            mfd-halfpane {
                position: relative;
                width: 100%;
                height: 100%;
            }
            #left {
                display: block;
            }
            #right {
                display: none;
            }
        #wrapper[state="half"] {
            grid-template-columns: 50% 50%;
        }
            #wrapper[state="half"] #right {
                display: block;
            }
    </style>
    <div id="wrapper">
        <slot name="left" id="left"></slot>
        <slot name="right" id="right"></slot>
    </div>
`;

customElements.define("mfd-mainpane", WT_G3000MFDMainPaneHTMLElement);

class WT_G3x5_MFDHalfPane {
    constructor(htmlElement, instrumentID, halfPaneID, icaoWaypointFactory, icaoSearchers, flightPlanManager) {
        this._htmlElement = htmlElement;

        let id = `${instrumentID}-${halfPaneID}`;

        this._controller = new WT_DataStoreController(id, null);

        this._navMap = new WT_G3x5NavMap(id, icaoWaypointFactory, icaoSearchers, flightPlanManager);
        this._weatherRadar = new WT_G3x5WeatherRadar(id);

        this._displayMode;
        this._halfRefresh = false;

        this._refreshCounter = 0;

        this._init();
    }

    _init() {
        this._navMap.init(this.htmlElement);
        this._weatherRadar.init(this.htmlElement);
        this._setDisplayMode(WT_G3x5_MFDHalfPaneDisplaySetting.Display.NAVMAP);
    }

    /**
     * @readonly
     * @property {WT_G3x5_MFDHalfPaneHTMLElement} htmlElement
     * @type {WT_G3x5_MFDHalfPaneHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     * @readonly
     * @property {WT_DataStoreController} controller
     * @type {WT_DataStoreController}
     */
    get controller() {
        return this._controller;
    }

    /**
     * @returns {Number}
     */
    displayMode() {
        return this._displayMode;
    }

    /**
     * @returns {Boolean}
     */
    halfRefresh() {
        return this._halfRefresh;
    }

    setHalfRefresh(value) {
        this._halfRefresh = value;
    }

    _setDisplayMode(mode) {
        this._displayMode = mode;
        this.htmlElement.setDisplay(mode);
    }

    _updateDisplayMode() {
        if (this._weatherRadar.isVisible() && this._displayMode !== WT_G3x5_MFDHalfPaneDisplaySetting.Display.WEATHER) {
            this._setDisplayMode(WT_G3x5_MFDHalfPaneDisplaySetting.Display.WEATHER);
        } else if (!this._weatherRadar.isVisible() && this._displayMode === WT_G3x5_MFDHalfPaneDisplaySetting.Display.WEATHER) {
            this._weatherRadar.sleepBing();
            this._setDisplayMode(WT_G3x5_MFDHalfPaneDisplaySetting.Display.NAVMAP);
        }
    }

    _updateChildren() {
        switch (this._displayMode) {
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.NAVMAP:
                this._navMap.update();
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.WEATHER:
                this._weatherRadar.update();
                break;
        }
    }

    update(updateCycle) {
        this._updateDisplayMode();

        if (!this.halfRefresh() || updateCycle === 0) {
            this._updateChildren();
        }
    }
}

class WT_G3x5_MFDHalfPaneHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_MFDHalfPaneHTMLElement.TEMPLATE_SHADOW.content.cloneNode(true));

    }

    connectedCallback() {
        this._titledPane = this.shadowRoot.querySelector(`#titledpane`);
        this._navMap = this.shadowRoot.querySelector(`#navMap`);
        this._weatherRadar = this.shadowRoot.querySelector(`#weatherRadar`);
    }

    _setTitle(title) {
        this._titledPane.titleText = title;
    }

    setColor(color) {
        this._titledPane.style.backgroundColor = color;
    }

    setDisplay(display) {
        switch (display) {
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.NAVMAP:
                this._navMap.style.display = "block";
                this._weatherRadar.style.display = "none";
                this._setTitle("Navigation Map");
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.WEATHER:
                this._navMap.style.display = "none";
                this._weatherRadar.style.display = "block";
                this._setTitle("Weather Radar");
                break;
        }
    }
}
WT_G3x5_MFDHalfPaneHTMLElement.TEMPLATE_SHADOW = document.createElement("template");
WT_G3x5_MFDHalfPaneHTMLElement.TEMPLATE_SHADOW.innerHTML = `
    <style>
        :host {
            display: block;
            width: 100%;
            height: 100%;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            background-color: black;
        }
            #titledpane {
                position: absolute;
                left: 1px;
                right: 1px;
                top: 1px;
                bottom: 1px;
                border: solid 1px black;
                border-radius: 3px;
            }
                slot {
                    display: block;
                    position: relative;
                    width: 100%;
                    height: 100%;
                }
    </style>
    <div id="wrapper">
        <pane-titled id="titledpane" titletext="">
            <slot slot="content" id="navMap" class="content" name="navMap"></slot>
            <slot slot="content" id="weatherRadar" class="content" name="weatherRadar"></slot>
        </pane-titled>
    </div>
`;

customElements.define("mfd-halfpane", WT_G3x5_MFDHalfPaneHTMLElement);

class WT_G3x5_MFDMainPaneModeSetting extends WT_DataStoreSetting {
    constructor(controller, defaultValue = WT_G3x5_MFDMainPaneModeSetting.Mode.FULL, autoUpdate = false, isPersistent = false, key = WT_G3x5_MFDMainPaneModeSetting.KEY) {
        super(controller, key, defaultValue, autoUpdate, isPersistent);
    }
}
WT_G3x5_MFDMainPaneModeSetting.KEY = "WT_MFDMainPane_Mode"
/**
 * @enum {Number}
 */
WT_G3x5_MFDMainPaneModeSetting.Mode = {
    FULL: 0,
    HALF: 1
}

class WT_G3x5_MFDHalfPaneControlSetting extends WT_DataStoreSetting {
    constructor(controller, defaultValue = 0, autoUpdate = false, isPersistent = false, key = WT_G3x5_MFDHalfPaneControlSetting.KEY) {
        super(controller, key, defaultValue, autoUpdate, isPersistent);
    }
}
WT_G3x5_MFDHalfPaneControlSetting.KEY = "WT_MFDHalfPane_Control"

class WT_G3x5_MFDHalfPaneDisplaySetting extends WT_DataStoreSetting {
    constructor(controller, defaultValue = WT_G3x5_MFDHalfPaneDisplaySetting.Display.NAVMAP, autoUpdate = false, isPersistent = false, key = WT_G3x5_MFDHalfPaneDisplaySetting.KEY) {
        super(controller, key, defaultValue, autoUpdate, isPersistent);
    }
}
WT_G3x5_MFDHalfPaneDisplaySetting.KEY = "WT_MFDHalfPane_Display"
/**
 * @enum {Number}
 */
WT_G3x5_MFDHalfPaneDisplaySetting.Display = {
    NAVMAP: 0,
    WEATHER: 1
}