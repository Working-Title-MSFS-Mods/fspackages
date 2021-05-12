class WT_G3x5_NavMapDisplayPane extends WT_G3x5_DisplayPane {
    constructor(paneID, paneSettings, navMap) {
        super(paneID, paneSettings);

        this._navMap = navMap;
    }

    /**
     * @readonly
     * @type {WT_G3x5_NavMap}
     */
    get navMap() {
        return this._navMap;
    }

    getTitle() {
        return "Navigation Map";
    }

    _initMap(viewElement) {
        this.navMap.init(viewElement.querySelector(`map-view`));
    }

    _initSettingListeners() {
        this.paneSettings.navMapInset.addListener(this._onInsetSettingChanged.bind(this));
        this._updateInsetMode();
    }

    _initSettings() {
        this.paneSettings.navMapInset.init();
        this._initSettingListeners();
    }

    init(viewElement) {
        this._htmlElement = viewElement;
        this._initMap(viewElement);
        this._initSettings();
    }

    _updateInsetMode() {
        this._htmlElement.setInsetMode(this.paneSettings.navMapInset.mode);
    }

    _onInsetSettingChanged(setting, newValue, oldValue) {
        this._updateInsetMode();
    }

    wake() {
        this.navMap.wake();
    }

    sleep() {
        this.navMap.sleep();
    }

    update() {
        this.navMap.update();
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

    async _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);
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
    "flightplan"
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
        #wrapper[inset="flightplan"] {
            grid-template-rows: 1fr var(--navmapdisplaypane-inset-height, 33%);
        }
            #map {
                display: block;
                position: relative;
                width: 100%;
                height: 100%;
            }
    </style>
    <div id="wrapper">
        <slot name="map" id="map"></slot>
        <div id="inset">
        </div>
    </div>
`;

customElements.define(WT_G3x5_NavMapDisplayPaneHTMLElement.NAME, WT_G3x5_NavMapDisplayPaneHTMLElement);