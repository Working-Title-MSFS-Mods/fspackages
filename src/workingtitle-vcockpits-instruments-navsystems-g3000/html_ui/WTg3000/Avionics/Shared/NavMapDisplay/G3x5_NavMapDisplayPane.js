class WT_G3x5_NavMapDisplayPane extends WT_G3x5_DisplayPane {
    /**
     * @param {String} paneID
     * @param {WT_G3x5_PaneSettings} paneSettings
     * @param {WT_G3x5_BaseInstrument} instrument
     * @param {WT_G3x5_NavMap} navMap
     */
    constructor(paneID, paneSettings, instrument, navMap) {
        super(paneID, paneSettings);

        this._navMap = navMap;
        this._instrument = instrument;
        this._isAwake = false;
        this._activeInset = null;
        this._isInit = false;
    }

    /**
     * @readonly
     * @type {WT_G3x5_NavMap}
     */
    get navMap() {
        return this._navMap;
    }

    _updateFromSize() {
        if (!this._isInit) {
            return;
        }

        if (this._activeInset) {
            this._activeInset.setSize(this.size);
        }
    }

    getTitle() {
        return "Navigation Map";
    }

    _initMap() {
        this.navMap.init(this._htmlElement.querySelector(`map-view`));
    }

    _initInsets() {
        this._flightPlanTextInset = new WT_G3x5_NavMapDisplayPaneFlightPlanTextInset(this._htmlElement.flightPlanTextInsetHTMLElement, this._instrument, this.paneSettings.navMapFlightPlanTextInsetDistance);
    }

    _initSettingListeners() {
        this.paneSettings.navMapInset.addListener(this._onInsetSettingChanged.bind(this));
    }

    _initSettings() {
        this.paneSettings.navMapInset.init();
        this._initSettingListeners();
    }

    async _initFromHTMLElement() {
        await WT_Wait.awaitCallback(() => this._htmlElement.isInitialized, this);
        this._initMap();
        this._initInsets();
        this._initSettings();
        this._isInit = true;
        if (this._isAwake) {
            this.navMap.wake();
        }
        this._updateInsetMode();
    }

    init(viewElement) {
        /**
         * @type {WT_G3x5_NavMapDisplayPaneHTMLElement}
         */
        this._htmlElement = viewElement;
        this._initFromHTMLElement();
    }

    _setActiveInset(inset) {
        if (this._activeInset === inset) {
            return;
        }

        if (this._activeInset) {
            this._activeInset.sleep();
        }
        if (inset && this._isAwake) {
            inset.wake();
            inset.setSize(this.size);
        }
        this._activeInset = inset;
    }

    _updateInsetMode() {
        this._htmlElement.setInsetMode(this.paneSettings.navMapInset.mode);
        let newActiveInset;
        switch (this.paneSettings.navMapInset.mode) {
            case WT_G3x5_NavMapDisplayInsetSetting.Mode.FLIGHT_PLAN_TEXT:
                newActiveInset = this._flightPlanTextInset;
                break;
            default:
                newActiveInset = null;
        }

        this._setActiveInset(newActiveInset);
    }

    _onInsetSettingChanged(setting, newValue, oldValue) {
        this._updateInsetMode();
    }

    wake() {
        this._isAwake = true;

        if (this._isInit) {
            this.navMap.wake();
            if (this._activeInset) {
                this._activeInset.wake();
                this._activeInset.setSize(this.size);
            }
        }
    }

    sleep() {
        this._isAwake = false;

        if (this._isInit) {
            this.navMap.sleep();
            if (this._activeInset) {
                this._activeInset.sleep();
            }
        }
    }

    update() {
        if (!this._isInit) {
            return;
        }

        this.navMap.update();
        if (this._activeInset) {
            this._activeInset.update();
        }
    }
}

class WT_G3x5_NavMapDisplayPaneHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._insetMode = WT_G3x5_NavMapDisplayInsetSetting.Mode.NONE;
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_NavMapDisplayPaneHTMLElement.TEMPLATE;
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get isInitialized() {
        return this._isInit;
    }

    /**
     * @readonly
     * @type {WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetHTMLElement}
     */
    get flightPlanTextInsetHTMLElement() {
        return this._flightPlanTextInset;
    }

    async _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);

        this._flightPlanTextInset = await WT_CustomElementSelector.select(this.shadowRoot, `#flightplantext`, WT_G3x5_NavMapDisplayPaneFlightPlanTextInsetHTMLElement);
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
        this._updateFromInsetMode();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _updateFromInsetMode() {
        this._wrapper.setAttribute("inset", WT_G3x5_NavMapDisplayPaneHTMLElement.INSET_MODE_ATTRIBUTES[this._insetMode]);
    }

    /**
     *
     * @param {WT_G3x5_NavMapDisplayInsetSetting.Mode} mode
     */
    setInsetMode(mode) {
        if (this._insetMode === mode) {
            return;
        }

        this._insetMode = mode;
        if (this._isInit) {
            this._updateFromInsetMode();
        }
    }
}
WT_G3x5_NavMapDisplayPaneHTMLElement.INSET_MODE_ATTRIBUTES = [
    "none",
    "flightplantext"
];
WT_G3x5_NavMapDisplayPaneHTMLElement.NAME = "wt-navmapdisplaypane";
WT_G3x5_NavMapDisplayPaneHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_NavMapDisplayPaneHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            width: 100%;
            height: 100%;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
            display: grid;
            grid-template-rows: 1fr 0;
            grid-template-rows: 100%;
        }
        #wrapper[inset="flightplantext"] {
            grid-template-rows: 1fr var(--navmapdisplaypane-inset-height, 33%);
        }
            #map {
                display: block;
                position: relative;
                width: 100%;
                height: 100%;
            }
            #insets {
                position: relative;
            }
                .inset {
                    display: none;
                    position: relative;
                    width: 100%;
                    height: 100%;
                }
                #wrapper[inset="flightplantext"] #flightplantext {
                    display: block;
                    font-size: var(--navmapdisplaypane-flightplantextinset-font-size, 1em);
                }
    </style>
    <div id="wrapper">
        <slot name="map" id="map"></slot>
        <div id="insets">
            <wt-navmapdisplaypane-flightplantextinset id="flightplantext" class="inset"></wt-navmapdisplaypane-flightplantextinset>
        </div>
    </div>
`;

customElements.define(WT_G3x5_NavMapDisplayPaneHTMLElement.NAME, WT_G3x5_NavMapDisplayPaneHTMLElement);