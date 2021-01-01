class WT_G3x5_TSCWeatherRadarSettings extends WT_G3x5_TSCPageElement {
    constructor(homePageGroup, homePageName, instrumentID, halfPaneID) {
        super(homePageGroup, homePageName);

        this._controllerID = `${instrumentID}-${halfPaneID}`;

        this._model = new WT_WeatherRadarModel();
        this._controller = new WT_DataStoreController(this.controllerID, this.model);

        this.controller.addSetting(this._modeSetting = new WT_WeatherRadarSetting(this.controller, "mode", WT_G3x5WeatherRadar.MODE_KEY, WT_G3x5WeatherRadar.MODE_DEFAULT, true, false));
        this.controller.addSetting(this._displaySetting = new WT_WeatherRadarSetting(this.controller, "display", WT_G3x5WeatherRadar.DISPLAY_KEY, WT_G3x5WeatherRadar.DISPLAY_DEFAULT, true, false));
        this.controller.addSetting(this._scanModeSetting = new WT_WeatherRadarSetting(this.controller, "scanMode", WT_G3x5WeatherRadar.SCAN_MODE_KEY, WT_G3x5WeatherRadar.SCAN_MODE_DEFAULT, true, false));
        this.controller.addSetting(this._bearingLineSetting = new WT_WeatherRadarSetting(this.controller, "showBearingLine", WT_G3x5WeatherRadar.BEARING_LINE_SHOW_KEY, WT_G3x5WeatherRadar.BEARING_LINE_SHOW_DEFAULT, true, false));
        this.controller.addSetting(this._rangeSetting = new WT_WeatherRadarRangeSetting(this.controller, WT_G3x5WeatherRadar.RANGES, WT_G3x5WeatherRadar.RANGE_DEFAULT));

        this.controller.update();
    }

    /**
     * @readonly
     * @property {String} controllerID - the ID of the radar this settings page controls.
     * @type {String}
     */
    get controllerID() {
        return this._controllerID;
    }

    /**
     * @readonly
     * @property {WT_WeatherRadarModel} model - the model for the radar this settings page controls.
     * @type {WT_WeatherRadarModel}
     */
    get model() {
        return this._model;
    }

    /**
     * @readonly
     * @property {WT_DataStoreController} controller - the controller for the radar this settings page controls.
     * @type {WT_DataStoreController}
     */
    get controller() {
        return this._controller;
    }

    init(root) {
        this.container.title = "Weather Radar Settings";

        /**
         * @type {WT_G3x5_TSCWeatherRadarSettingsHTMLElement}
         */
        this._htmlElement = root.querySelector(`tsc-weatherradarsettings`);

        this._radarMode = new WT_G3x5_TSCWeatherRadarMode(this, this._htmlElement.radarModeElement, this._modeSetting);
        this._controls = new WT_G3x5_TSCWeatherRadarControls(this, this._htmlElement.controlsElement, this._modeSetting, this._displaySetting, this._scanModeSetting);
        this._features = new WT_G3x5_TSCWeatherRadarFeatures(this, this._htmlElement.featuresElement, this._modeSetting, this._bearingLineSetting);
    }

    onUpdate(deltaTime) {
        this._radarMode.update();
    }

    changeRange(delta) {
        let target = Math.max(0, Math.min(this._rangeSetting.ranges.length - 1, this._rangeSetting.getValue() + delta));
        this._rangeSetting.setValue(target);
    }
}

class WT_G3x5_TSCWeatherRadarSettingsHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCWeatherRadarSettingsHTMLElement.TEMPLATE.content.cloneNode(true));

        this._radarMode = new WT_G3x5_TSCWeatherRadarModeHTMLElement();
        this._controls = new WT_G3x5_TSCWeatherRadarControlsHTMLElement();
        this._features = new WT_G3x5_TSCWeatherRadarFeaturesHTMLElement();
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCWeatherRadarModeHTMLElement} radarModeElement
     * @type {WT_G3x5_TSCWeatherRadarModeHTMLElement}
     */
    get radarModeElement() {
        return this._radarMode;
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCWeatherRadarControlsHTMLElement} controlsElement
     * @type {WT_G3x5_TSCWeatherRadarControlsHTMLElement}
     */
    get controlsElement() {
        return this._controls;
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCWeatherRadarFeaturesHTMLElement} controlsElement
     * @type {WT_G3x5_TSCWeatherRadarFeaturesHTMLElement}
     */
    get featuresElement() {
        return this._features;
    }

    _attachChildren() {
        this._radarMode.setAttribute("slot", "radarmode");
        this._controls.setAttribute("slot", "controls");
        this._features.setAttribute("slot", "features");
        this.appendChild(this._radarMode);
        this.appendChild(this._controls);
        this.appendChild(this._features);
    }

    connectedCallback() {
        this._attachChildren();
    }
}
WT_G3x5_TSCWeatherRadarSettingsHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCWeatherRadarSettingsHTMLElement.TEMPLATE.innerHTML = `
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
        }
    </style>
    <div id="wrapper">
        <slot name="radarmode"></slot>
        <slot name="controls"></slot>
        <slot name="features"></slot>
    </div>
`;

class WT_G3x5_TSCWeatherRadarSettingsSubPage {
    /**
     * @param {WT_G3x5_TSCWeatherRadarSettings} parent
     * @param {HTMLElement} htmlElement
     */
    constructor(parent, htmlElement) {
        this._parent = parent;
        this._htmlElement = htmlElement;
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCWeatherRadarSettings} parent - the controller for the radar this sub page controls.
     * @type {WT_G3x5_TSCWeatherRadarSettings}
     */
    get parent() {
        return this._parent;
    }

    /**
     * @readonly
     * @property {WT_WeatherRadarModel} model - the controller for the radar this sub page controls.
     * @type {WT_WeatherRadarModel}
     */
    get model() {
        return this._parent.model;
    }

    /**
     * @readonly
     * @property {WT_DataStoreController} controller - the controller for the radar this sub page controls.
     * @type {WT_DataStoreController}
     */
    get controller() {
        return this._parent.controller;
    }

    /**
     * @readonly
     * @property {HTMLElement} htmlElement
     * @type {HTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    update() {
    }
}

customElements.define("tsc-weatherradarsettings", WT_G3x5_TSCWeatherRadarSettingsHTMLElement);

class WT_G3x5_TSCWeatherRadarMode extends WT_G3x5_TSCWeatherRadarSettingsSubPage {
    /**
     * @param {WT_G3x5_TSCWeatherRadarSettings} parent
     * @param {HTMLElement} htmlElement
     * @param {WT_DataStoreSetting} modeSetting
     */
    constructor(parent, htmlElement, modeSetting) {
        super(parent, htmlElement);

        this.htmlElement.standbyButton.addButtonListener(this._onStandbyButtonPressed.bind(this));
        this.htmlElement.onButton.addButtonListener(this._onOnButtonPressed.bind(this));

        this._modeSetting = modeSetting;
        this._modeSetting.addListener(this._onSettingChanged.bind(this));

        this._updateButtons();
    }

    _onStandbyButtonPressed() {
        this._modeSetting.setValue(WT_WeatherRadarModel.Mode.STANDBY);
    }

    _onOnButtonPressed() {
        this._modeSetting.setValue(WT_WeatherRadarModel.Mode.ON);
    }

    _updateButtons() {
        this.htmlElement.standbyButton.toggle = this._modeSetting.getValue() === WT_WeatherRadarModel.Mode.STANDBY ? "on" : "off";
        this.htmlElement.onButton.toggle = this._modeSetting.getValue() === WT_WeatherRadarModel.Mode.ON ? "on" : "off";
    }

    _onSettingChanged(setting, newValue, oldValue) {
        this._updateButtons();
    }
}

class WT_G3x5_TSCWeatherRadarModeHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCWeatherRadarModeHTMLElement.TEMPLATE.content.cloneNode(true));

        this._standbyButton = new WT_TSCStatusBarButton();
        this._standbyButton.setAttribute("labeltext", "Standby");
        this._standbyButton.classList.add(WT_G3x5_TSCWeatherRadarModeHTMLElement.BUTTON_CLASS);
        this._onButton = new WT_TSCStatusBarButton();
        this._onButton.setAttribute("labeltext", "Radar On");
        this._onButton.classList.add(WT_G3x5_TSCWeatherRadarModeHTMLElement.BUTTON_CLASS);
    }

    /**
     * @readonly
     * @property {WT_TSCStatusBarButton} standbyButton
     * @type {WT_TSCStatusBarButton}
     */
    get standbyButton() {
        return this._standbyButton;
    }

    /**
     * @readonly
     * @property {WT_TSCStatusBarButton} onButton
     * @type {WT_TSCStatusBarButton}
     */
    get onButton() {
        return this._onButton;
    }

    _attachButtons() {
        this._standbyButton.setAttribute("slot", "buttons");
        this._onButton.setAttribute("slot", "buttons");
        this.appendChild(this._standbyButton);
        this.appendChild(this._onButton);
    }

    connectedCallback() {
        this._attachButtons();
    }
}
WT_G3x5_TSCWeatherRadarModeHTMLElement.BUTTON_CLASS = "weatherRadarModeButton";
WT_G3x5_TSCWeatherRadarModeHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCWeatherRadarModeHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            border-radius: 3px;
            background: linear-gradient(#1f3445, black 3vh);
            background-color: black;
            border: 0.4vh solid #454b4e;
            color: white;
            font-size: 4vh;
            text-align: center;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
        }
            #title {
                margin: 0.5em;
            }
    </style>
    <div id="wrapper">
        <div id="title">Radar Mode</div>
        <div>
            <slot name="buttons" id="buttons"></slot>
        </div>
    </div>
`;

customElements.define("tsc-weatherradarsettings-mode", WT_G3x5_TSCWeatherRadarModeHTMLElement);

class WT_G3x5_TSCWeatherRadarControls extends WT_G3x5_TSCWeatherRadarSettingsSubPage {
    /**
     * @param {WT_G3x5_TSCWeatherRadarSettings} parent
     * @param {HTMLElement} htmlElement
     * @param {WT_DataStoreSetting} modeSetting
     * @param {WT_DataStoreSetting} displaySetting
     * @param {WT_DataStoreSetting} scanModeSetting
     */
    constructor(parent, htmlElement, modeSetting, displaySetting, scanModeSetting) {
        super(parent, htmlElement);

        this._modeSetting = modeSetting;

        this._initDisplayWindowContext();
        this._initScanModeWindowContext();

        this._displayManager = new WT_TSCSettingValueButtonManager(this.parent.gps, this.htmlElement.displayButton, displaySetting, this.parent.gps.selectionListWindow1, this._displayWindowContext, value => WT_G3x5_TSCWeatherRadarControls.DISPLAY_TEXTS[value]);
        this._scanModeManager = new WT_TSCSettingValueButtonManager(this.parent.gps, this.htmlElement.scanModeButton, scanModeSetting, this.parent.gps.selectionListWindow1, this._scanModeWindowContext, value => WT_G3x5_TSCWeatherRadarControls.SCAN_MODE_TEXTS[value]);

        this._modeSetting.addListener(this._onModeSettingChanged.bind(this));

        this._initButtons();
    }

    _initDisplayWindowContext() {
        let elementHandler = new WT_TSCStandardSelectionElementHandler(WT_G3x5_TSCWeatherRadarControls.DISPLAY_TEXTS);
        this._displayWindowContext = {
            title: "Weather Radar Display",
            subclass: "standardDynamicSelectionListWindow",
            closeOnSelect: true,
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            homePageGroup: this.parent.homePageGroup,
            homePageName: this.parent.homePageName
        };
    }

    _initScanModeWindowContext() {
        let elementHandler = new WT_TSCStandardSelectionElementHandler(WT_G3x5_TSCWeatherRadarControls.SCAN_MODE_TEXTS);
        this._scanModeWindowContext = {
            title: "Weather Radar Scan Mode",
            subclass: "standardDynamicSelectionListWindow",
            closeOnSelect: true,
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            homePageGroup: this.parent.homePageGroup,
            homePageName: this.parent.homePageName
        };
    }

    _initButtons() {
        this.htmlElement.displayButton.valueText = WT_G3x5_TSCWeatherRadarControls.DISPLAY_TEXTS[this._displayManager.setting.getValue()];
        this.htmlElement.scanModeButton.valueText = WT_G3x5_TSCWeatherRadarControls.SCAN_MODE_TEXTS[this._scanModeManager.setting.getValue()];
        this._enableButtons(this._modeSetting.getValue() === WT_WeatherRadarModel.Mode.ON);
    }

    _enableButtons(value) {
        this.htmlElement.enabled = value ? "true" : "false";
    }

    _onModeSettingChanged(setting, newValue, oldValue) {
        this._enableButtons(newValue === WT_WeatherRadarModel.Mode.ON);
    }
}
WT_G3x5_TSCWeatherRadarControls.DISPLAY_TEXTS = ["Off", "Weather"];
WT_G3x5_TSCWeatherRadarControls.SCAN_MODE_TEXTS = ["Horizontal", "Vertical"];

class WT_G3x5_TSCWeatherRadarControlsHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCWeatherRadarControlsHTMLElement.TEMPLATE.content.cloneNode(true));

        this._displayButton = new WT_TSCValueButton();
        this._displayButton.setAttribute("labeltext", "Display");
        this._displayButton.classList.add(WT_G3x5_TSCWeatherRadarControlsHTMLElement.BUTTON_CLASS);
        this._scanModeButton = new WT_TSCValueButton();
        this._scanModeButton.setAttribute("labeltext", "Scan Mode");
        this._scanModeButton.classList.add(WT_G3x5_TSCWeatherRadarControlsHTMLElement.BUTTON_CLASS);
        this._sectorScanButton = new WT_TSCValueButton();
        this._sectorScanButton.setAttribute("labeltext", "Sector Scan");
        this._sectorScanButton.valueText = "Full";
        this._sectorScanButton.enabled = "false";
        this._sectorScanButton.classList.add(WT_G3x5_TSCWeatherRadarControlsHTMLElement.BUTTON_CLASS);
        this._calibratedGainButton = new WT_TSCStatusBarButton();
        this._calibratedGainButton.setAttribute("labeltext", "Calibrated<br>Gain");
        this._calibratedGainButton.toggle = "on";
        this._calibratedGainButton.enabled = "false";
        this._calibratedGainButton.classList.add(WT_G3x5_TSCWeatherRadarControlsHTMLElement.BUTTON_CLASS);
    }

    static get observedAttributes() {
        return ["enabled"];
    }

    /**
     * @readonly
     * @property {WT_TSCValueButton} displayButton
     * @type {WT_TSCValueButton}
     */
    get displayButton() {
        return this._displayButton;
    }

    /**
     * @readonly
     * @property {WT_TSCValueButton} scanModeButton
     * @type {WT_TSCValueButton}
     */
    get scanModeButton() {
        return this._scanModeButton;
    }

    get enabled() {
        return this.getAttribute("enabled");
    }

    set enabled(value) {
        this.setAttribute("enabled", value);
    }

    _attachButtons() {
        this._displayButton.setAttribute("slot", "buttons");
        this._scanModeButton.setAttribute("slot", "buttons");
        this._sectorScanButton.setAttribute("slot", "buttons");
        this._calibratedGainButton.setAttribute("slot", "buttons");
        this.appendChild(this._displayButton);
        this.appendChild(this._scanModeButton);
        this.appendChild(this._sectorScanButton);
        this.appendChild(this._calibratedGainButton);
    }

    connectedCallback() {
        this._attachButtons();
    }

    _setEnabled(value) {
        let buttonEnabled = value ? "true" : "false";
        this._displayButton.enabled = buttonEnabled;
        this._scanModeButton.enabled = buttonEnabled;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "enabled") {
            this._setEnabled(newValue === "true");
        }
    }
}
WT_G3x5_TSCWeatherRadarControlsHTMLElement.BUTTON_CLASS = "weatherRadarControlsButton";
WT_G3x5_TSCWeatherRadarControlsHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCWeatherRadarControlsHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            border-radius: 3px;
            background: linear-gradient(#1f3445, black 3vh);
            background-color: black;
            border: 0.4vh solid #454b4e;
            color: white;
            font-size: 4vh;
            text-align: center;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-columns: 1.3fr 1fr;
            grid-template-rows: auto;
        }
            #title {
                margin: 0.5em;
            }
    </style>
    <div id="wrapper">
        <div id="left">
            <div id="title">Controls</div>
            <div>
                <slot name="buttons" id="buttons"></slot>
            </div>
        </div>
        <div id="right">
        </div>
    </div>
`;

customElements.define("tsc-weatherradarsettings-controls", WT_G3x5_TSCWeatherRadarControlsHTMLElement);

class WT_G3x5_TSCWeatherRadarFeatures extends WT_G3x5_TSCWeatherRadarSettingsSubPage {
    /**
     * @param {WT_G3x5_TSCWeatherRadarSettings} parent
     * @param {HTMLElement} htmlElement
     * @param {WT_DataStoreSetting} modeSetting
     * @param {WT_DataStoreSetting} bearingLineSetting
     */
    constructor(parent, htmlElement, modeSetting, bearingLineSetting) {
        super(parent, htmlElement);

        this._modeSetting = modeSetting;
        this._bearingLineSetting = bearingLineSetting;

        this.htmlElement.bearingLineButton.addButtonListener(this._onBearingLineButtonPressed.bind(this));
        this._bearingLineSetting.addListener(this._onBearingLineSettingChanged.bind(this));

        this._modeSetting.addListener(this._onModeSettingChanged.bind(this));

        this._initButtons();
    }

    _initButtons() {
        this._updateBearingLineButton();
        this._enableButtons(this._modeSetting.getValue() === WT_WeatherRadarModel.Mode.ON);
    }

    _updateBearingLineButton() {
        this.htmlElement.bearingLineButton.toggle = this._bearingLineSetting.getValue() ? "on" : "off";
    }

    _onBearingLineSettingChanged(setting, newValue, oldValue) {
        this._updateBearingLineButton();
    }

    _onBearingLineButtonPressed(button) {
        this._bearingLineSetting.setValue(!this._bearingLineSetting.getValue());
    }

    _enableButtons(value) {
        this.htmlElement.enabled = value ? "true" : "false";
    }

    _onModeSettingChanged(setting, newValue, oldValue) {
        this._enableButtons(newValue === WT_WeatherRadarModel.Mode.ON);
    }
}

class WT_G3x5_TSCWeatherRadarFeaturesHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCWeatherRadarFeaturesHTMLElement.TEMPLATE.content.cloneNode(true));

        this._gndClutterButton = new WT_TSCStatusBarButton();
        this._gndClutterButton.setAttribute("labeltext", "GND Clutter<br>Suppression");
        this._gndClutterButton.classList.add(WT_G3x5_TSCWeatherRadarFeaturesHTMLElement.BUTTON_CLASS);
        this._gndClutterButton.enabled = "false";
        this._bearingLineButton = new WT_TSCStatusBarButton();
        this._bearingLineButton.setAttribute("labeltext", "Bearing Line");
        this._bearingLineButton.classList.add(WT_G3x5_TSCWeatherRadarFeaturesHTMLElement.BUTTON_CLASS);
        this._turbulenceButton = new WT_TSCStatusBarButton();
        this._turbulenceButton.setAttribute("labeltext", "Turbulence<br>Detection");
        this._turbulenceButton.classList.add(WT_G3x5_TSCWeatherRadarFeaturesHTMLElement.BUTTON_CLASS);
        this._turbulenceButton.enabled = "false";
        this._altCompButton = new WT_TSCStatusBarButton();
        this._altCompButton.setAttribute("labeltext", "Altitude<br>Comp Tilt");
        this._altCompButton.classList.add(WT_G3x5_TSCWeatherRadarFeaturesHTMLElement.BUTTON_CLASS);
        this._altCompButton.enabled = "false";
        this._wxWatchButton = new WT_TSCStatusBarButton();
        this._wxWatchButton.setAttribute("labeltext", "WX WATCH");
        this._wxWatchButton.classList.add(WT_G3x5_TSCWeatherRadarFeaturesHTMLElement.BUTTON_CLASS);
        this._wxWatchButton.enabled = "false";
        this._wxAlertButton = new WT_TSCStatusBarButton();
        this._wxAlertButton.setAttribute("labeltext", "WX Alert");
        this._wxAlertButton.classList.add(WT_G3x5_TSCWeatherRadarFeaturesHTMLElement.BUTTON_CLASS);
        this._wxAlertButton.enabled = "false";
    }

    static get observedAttributes() {
        return ["enabled"];
    }

    /**
     * @readonly
     * @property {WT_TSCStatusBarButton} bearingLineButton
     * @type {WT_TSCStatusBarButton}
     */
    get bearingLineButton() {
        return this._bearingLineButton;
    }

    get enabled() {
        return this.getAttribute("enabled");
    }

    set enabled(value) {
        this.setAttribute("enabled", value);
    }

    _attachButtons() {
        this._gndClutterButton.setAttribute("slot", "buttons");
        this._bearingLineButton.setAttribute("slot", "buttons");
        this._turbulenceButton.setAttribute("slot", "buttons");
        this._altCompButton.setAttribute("slot", "buttons");
        this._wxWatchButton.setAttribute("slot", "buttons");
        this._wxAlertButton.setAttribute("slot", "buttons");
        this.appendChild(this._gndClutterButton);
        this.appendChild(this._bearingLineButton);
        this.appendChild(this._turbulenceButton);
        this.appendChild(this._altCompButton);
        this.appendChild(this._wxWatchButton);
        this.appendChild(this._wxAlertButton);
    }

    connectedCallback() {
        this._attachButtons();
    }

    _setEnabled(value) {
        let buttonEnabled = value ? "true" : "false";
        this._bearingLineButton.enabled = buttonEnabled;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "enabled") {
            this._setEnabled(newValue === "true");
        }
    }
}
WT_G3x5_TSCWeatherRadarFeaturesHTMLElement.BUTTON_CLASS = "weatherRadarFeaturesButton";
WT_G3x5_TSCWeatherRadarFeaturesHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCWeatherRadarFeaturesHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            border-radius: 3px;
            background: linear-gradient(#1f3445, black 3vh);
            background-color: black;
            border: 0.4vh solid #454b4e;
            color: white;
            font-size: 4vh;
            text-align: center;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
        }
            #title {
                margin: 0.5em;
            }
            #buttons {
                display: block;
                position: absolute;
                top: 1.8em;
                bottom: 3%;
                width: 100%;
                overflow-x: hidden;
                overflow-y: scroll;
            }
                #buttons::-webkit-scrollbar {
                    width: 1vw;
                }
                #buttons::-webkit-scrollbar-track {
                    background: none;
                }
                #buttons::-webkit-scrollbar-thumb {
                    background: white;
                }
    </style>
    <div id="wrapper">
        <div id="title">Controls</div>
        <slot name="buttons" id="buttons"></slot>
    </div>
`;

customElements.define("tsc-weatherradarsettings-features", WT_G3x5_TSCWeatherRadarFeaturesHTMLElement);