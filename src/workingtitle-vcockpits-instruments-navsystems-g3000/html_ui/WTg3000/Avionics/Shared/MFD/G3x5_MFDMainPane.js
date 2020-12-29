class WT_G3x5_MFDMainPane extends NavSystemElement {
    constructor(instrumentID, icaoWaypointFactory, icaoSearchers, flightPlanManager, citySearcher) {
        super();

        this._instrumentID = instrumentID;
        this._icaoWaypointFactory = icaoWaypointFactory;
        this._icaoSearchers = icaoSearchers;
        this._flightPlanManager = flightPlanManager;
        this._citySearcher = citySearcher;

        this._mode = WT_G3x5_MFDMainPaneModeSetting.Mode.FULL;

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

        this._controller = new WT_DataStoreController(this.instrumentID, null);
        this._controller.addSetting(this._modeSetting = new WT_G3x5_MFDMainPaneModeSetting(this._controller));
        this._modeSetting.addListener(this._onModeSettingChanged.bind(this));

        /**
         * @type {WT_G3x5_MFDHalfPane}
         */
        this._left = new WT_G3x5_MFDHalfPane(this.htmlElement.querySelector(`mfd-halfpane[slot="left"]`), this.instrumentID, "LEFT", this._icaoWaypointFactory, this._icaoSearchers, this._flightPlanManager, this._citySearcher);

        /**
         * @type {WT_G3x5_MFDHalfPane}
         */
        this._right = new WT_G3x5_MFDHalfPane(this.htmlElement.querySelector(`mfd-halfpane[slot="right"]`), this.instrumentID, "RIGHT", this._icaoWaypointFactory, this._icaoSearchers, this._flightPlanManager, this._citySearcher);

        this._controller.init();
        this._controller.update();
    }

    _onModeSettingChanged(setting, newValue, oldValue) {
        this._setMode(newValue);
    }

    _setMode(mode) {
        let halfRefresh = mode === WT_G3x5_MFDMainPaneModeSetting.Mode.HALF;
        if (this._left) {
            this._left.setHalfRefresh(halfRefresh);
            this._right.setHalfRefresh(halfRefresh);
        }
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
WT_G3x5_MFDMainPane.LEFT_TSC_COLOR = "#97d9d5";
WT_G3x5_MFDMainPane.RIGHT_TSC_COLOR = "#d08dff";
WT_G3x5_MFDMainPane.BOTH_TSC_COLOR = "#2c22ff";


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
    constructor(htmlElement, instrumentID, halfPaneID, icaoWaypointFactory, icaoSearchers, flightPlanManager, citySearcher) {
        this._htmlElement = htmlElement;

        let id = `${instrumentID}-${halfPaneID}`;

        let defaultControl = halfPaneID === "LEFT" ? WT_G3x5_MFDHalfPaneControlSetting.Touchscreen.LEFT | WT_G3x5_MFDHalfPaneControlSetting.Touchscreen.RIGHT : 0;

        this._controller = new WT_DataStoreController(id, null);
        this._controller.addSetting(this._controlSetting = new WT_G3x5_MFDHalfPaneControlSetting(this._controller, defaultControl));
        this._controller.addSetting(this._displaySetting = new WT_G3x5_MFDHalfPaneDisplaySetting(this._controller));
        this._controlSetting.addListener(this._onControlSettingChanged.bind(this));
        this._displaySetting.addListener(this._onDisplaySettingChanged.bind(this));

        this._navMap = new WT_G3x5NavMap(id, icaoWaypointFactory, icaoSearchers, flightPlanManager, citySearcher);
        this._weatherRadar = new WT_G3x5WeatherRadar(id);

        this._displayMode;
        this._halfRefresh = false;

        this._refreshCounter = 0;

        this._initChildren();

        this._setDisplayMode(WT_G3x5_MFDHalfPaneDisplaySetting.Display.NAVMAP);
        this._setControl(defaultControl);

        this._controller.init();
        this._controller.update();
    }

    _initChildren() {
        this._navMap.init(this.htmlElement);
        this._weatherRadar.init(this.htmlElement);
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

    _onControlSettingChanged(setting, newValue, oldValue) {
        this._setControl(newValue);
    }

    _onDisplaySettingChanged(setting, newValue, oldValue) {
        this._setDisplayMode(newValue);
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

    _setControl(value) {
        this.htmlElement.setControl(value);
    }

    _setDisplayMode(mode) {
        this._displayMode = mode;
        if (mode === WT_G3x5_MFDHalfPaneDisplaySetting.Display.NAVMAP) {
            this._weatherRadar.sleepBing();
        } else {
            this._weatherRadar.wakeBing();
        }
        this.htmlElement.setDisplay(mode);
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

    setControl(value) {
        switch (value) {
            case WT_G3x5_MFDHalfPaneControlSetting.Touchscreen.LEFT:
                this._titledPane.setAttribute("control", "left");
                break;
            case WT_G3x5_MFDHalfPaneControlSetting.Touchscreen.RIGHT:
                this._titledPane.setAttribute("control", "right");
                break;
            case WT_G3x5_MFDHalfPaneControlSetting.Touchscreen.LEFT | WT_G3x5_MFDHalfPaneControlSetting.Touchscreen.RIGHT:
                this._titledPane.setAttribute("control", "both");
                break;
            default:
                this._titledPane.setAttribute("control", "none");
        }
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
                border: solid 1px white;
                border-radius: 3px;
            }
                slot {
                    display: block;
                    position: relative;
                    width: 100%;
                    height: 100%;
                }
            #titledpane[control=left] {
                position: absolute;
                background-color: ${WT_G3x5_MFDMainPane.LEFT_TSC_COLOR};
                --pane-title-border-color: transparent;
                border: solid 1px black;
            }
            #titledpane[control=right] {
                position: absolute;
                background-color: ${WT_G3x5_MFDMainPane.RIGHT_TSC_COLOR};
                --pane-title-border-color: transparent;
                border: solid 1px black;
            }
            #titledpane[control=both] {
                position: absolute;
                background-color: ${WT_G3x5_MFDMainPane.BOTH_TSC_COLOR};
                --pane-title-border-color: transparent;
                border: solid 1px black;
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

    hasControl(touchscreen, all = false) {
        let value = this.getValue();
        if (all) {
            return (value & touchscreen) === touchscreen;
        } else {
            return (value & touchscreen) !== 0;
        }
    }

    addControl(touchscreen) {
        this.setValue(this.getValue() | touchscreen);
    }

    removeControl(touchscreen) {
        this.setValue(this.getValue() & (~touchscreen));
    }
}
WT_G3x5_MFDHalfPaneControlSetting.KEY = "WT_MFDHalfPane_Control"
/**
 * @enum {Number}
 */
WT_G3x5_MFDHalfPaneControlSetting.Touchscreen = {
    LEFT: 1,
    RIGHT: 1 << 1
}

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