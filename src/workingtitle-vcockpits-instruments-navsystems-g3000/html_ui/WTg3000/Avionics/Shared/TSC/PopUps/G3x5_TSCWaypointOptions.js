class WT_G3x5_TSCWaypointOptions extends WT_G3x5_TSCPopUpElement {
    constructor() {
        super();

        this._icaoSettingListener = this._onICAOSettingChanged.bind(this);
        this._mfdPaneDisplaySettingListener = this._onMFDPaneDisplaySettingChanged.bind(this);
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCWaypointOptionsHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createHTMLElement() {
        return new WT_G3x5_TSCWaypointOptionsHTMLElement();
    }

    _initButtonListeners() {
        this.htmlElement.drctButton.addButtonListener(this._onDRCTButtonPressed.bind(this));
        this.htmlElement.showMapButton.addButtonListener(this._onShowMapButtonPressed.bind(this));
    }

    async _initFromHTMLElement() {
        await WT_Wait.awaitCallback(() => this.htmlElement.isInitialized, this);
        this._initButtonListeners();
        this._updateButtons();
    }

    onInit() {
        this._htmlElement = this._createHTMLElement();
        this.popUpWindow.appendChild(this.htmlElement);
        this._initFromHTMLElement();
    }

    _cleanUpContext() {
        if (this.context) {
            this.context.icaoSetting.removeListener(this._icaoSettingListener);
            this.context.mfdPaneDisplaySetting.removeListener(this._mfdPaneDisplaySettingListener);
        }
    }

    _isShowOnMapActive() {
        let isPaneDisplaySettingCorrect = this.context.mfdPaneDisplaySetting.getValue() === this.context.showOnMapOnDisplayMode;
        let isICAOSettingCorrect = this.context.icaoSetting.getValue() === this.context.waypoint.icao;
        return isPaneDisplaySettingCorrect && isICAOSettingCorrect;
    }

    _updateDRCTButton() {
        this.htmlElement.drctButton.enabled = `${this.context && this.context.waypoint}`;
    }

    _updateShowOnMapButton() {
        if (this.context && this.context.waypoint) {
            this.htmlElement.showMapButton.enabled = "true";
            this.htmlElement.showMapButton.toggle = this._isShowOnMapActive() ? "on" : "off";
        } else {
            this.htmlElement.showMapButton.enabled = "false";
            this.htmlElement.showMapButton.toggle = "off";
        }
    }

    _updateButtons() {
        if (this.htmlElement && this.htmlElement.isInitialized) {
            this._updateDRCTButton();
            this._updateShowOnMapButton();
        }
    }

    _updateFromContext() {
        if (this.context) {
            this.context.icaoSetting.addListener(this._icaoSettingListener);
            this.context.mfdPaneDisplaySetting.addListener(this._mfdPaneDisplaySettingListener);
        }

        this._updateButtons();
    }

    _onICAOSettingChanged(setting, newValue, oldValue) {
        this._updateButtons();
    }

    _onMFDPaneDisplaySettingChanged(setting, newValue, oldValue) {
        this._updateButtons();
    }

    _onDRCTButtonPressed(button) {
        this.instrument.closePopUpElement();
        this.instrument.SwitchToPageName("MFD", "Direct To");
    }

    _toggleShowOnMap() {
        if (this._isShowOnMapActive()) {
            this.context.mfdPaneDisplaySetting.setValue(this.context.showOnMapOffDisplayMode);
        } else {
            this.context.icaoSetting.setValue(this.context.waypoint.icao);
            this.context.mfdPaneDisplaySetting.setValue(this.context.showOnMapOnDisplayMode);
        }
    }

    _onShowMapButtonPressed(button) {
        if (!this.context) {
            return;
        }

        this._toggleShowOnMap();
    }
}

class WT_G3x5_TSCWaypointOptionsHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCWaypointOptionsHTMLElement.TEMPLATE;
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
     * @type {WT_TSCImageButton}
     */
    get drctButton() {
        return this._drctButton;
    }

    /**
     * @readonly
     * @type {WT_TSCStatusBarButton}
     */
    get showMapButton() {
        return this._showMapButton;
    }

    async _defineChildren() {
        [
            this._drctButton,
            this._showMapButton
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#directto`, WT_TSCImageButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#map`, WT_TSCStatusBarButton)
        ]);
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }
}
WT_G3x5_TSCWaypointOptionsHTMLElement.NAME = "wt-tsc-waypointoptions";
WT_G3x5_TSCWaypointOptionsHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCWaypointOptionsHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            border-radius: 5px;
            border: 3px solid var(--wt-g3x5-bordergray);
            background: black;
        }

        #wrapper {
            position: absolute;
            left: var(--waypointoptions-padding-left, 0.25em);
            top: var(--waypointoptions-padding-top, 0.25em);
            width: calc(100% - var(--waypointoptions-padding-left, 0.25em) - var(--waypointoptions-padding-right, 0.25em));
            height: calc(100% - var(--waypointoptions-padding-top, 0.25em) - var(--waypointoptions-padding-bottom, 0.25em));
            display: flex;
            flex-flow: column nowrap;
            align-items: stretch;
            color: white;
        }
            .button {
                height: var(--nearestwaypoints-options-button-height, 3em);
                margin-bottom: var(--nearestwaypoints-options-button-margin, 0.25em);
            }
            #directto {
                --button-img-image-height: 100%;
            }
    </style>
    <div id="wrapper">
        <wt-tsc-button-img id="directto" class="button" imgsrc="/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_MAP_DIRECT_TO_1.png"></wt-tsc-button-img>
        <wt-tsc-button-statusbar id="map" class="button" labeltext="Show On Map"></wt-tsc-button-statusbar>
    </div>
`;

customElements.define(WT_G3x5_TSCWaypointOptionsHTMLElement.NAME, WT_G3x5_TSCWaypointOptionsHTMLElement);