class WT_G5000_TSCTrafficMapSettings extends WT_G3x5_TSCTrafficMapSettings {
    constructor(homePageGroup, homePageName, trafficSystemID, xpdrID) {
        super(homePageGroup, homePageName, trafficSystemID);

        this._initXPDRSettingModel(xpdrID);
    }

    _initXPDRSettingModel(xpdrID) {
        this._xpdrSettingModel = new WT_DataStoreSettingModel(xpdrID);
        this._xpdrSettingModel.addSetting(this._xpdrTCASModeSetting = new WT_G5000_TransponderTCASModeSetting(this._xpdrSettingModel));
    }

    _createOperatingModeSubPage() {
        return new WT_G5000_TSCTrafficOperatingModeSettings(this, this._xpdrTCASModeSetting);
    }

    onUpdate(deltaTime) {
        this._operatingModeSubPage.update();
    }
}

class WT_G5000_TSCNavMapTrafficSettings extends WT_G3x5_TSCNavMapTrafficSettings {
    constructor(homePageGroup, homePageName, trafficSystemID, xpdrID, instrumentID, halfPaneID) {
        super(homePageGroup, homePageName, trafficSystemID, instrumentID, halfPaneID);

        this._initXPDRSettingModel(xpdrID);
    }

    _initXPDRSettingModel(xpdrID) {
        this._xpdrSettingModel = new WT_DataStoreSettingModel(xpdrID);
        this._xpdrSettingModel.addSetting(this._xpdrTCASModeSetting = new WT_G5000_TransponderTCASModeSetting(this._xpdrSettingModel));
    }

    _createOperatingModeSubPage() {
        return new WT_G5000_TSCTrafficOperatingModeSettings(this, this._xpdrTCASModeSetting);
    }

    onUpdate(deltaTime) {
        this._operatingModeSubPage.update();
    }
}

class WT_G5000_TSCTrafficOperatingModeSettings extends WT_G3x5_TSCTrafficOperatingModeSettings {
    /**
     * @param {WT_G3x5_TSCTrafficSettings} parentPage
     * @param {WT_G5000_TransponderTCASModeSetting} xpdrTCASModeSetting
     */
    constructor(parentPage, xpdrTCASModeSetting) {
        super(parentPage);

        this.htmlElement.setContext({
            subPage: this,
            xpdr: this.parentPage.instrument.airplane.navCom.getTransponder(1),
            xpdrTCASModeSetting: xpdrTCASModeSetting
        });
    }

    _createHTMLElement() {
        return new WT_G5000_TSCTrafficOperatingModeSettingsHTMLElement();
    }

    update() {
        this.htmlElement.update();
    }
}

class WT_G5000_TSCTrafficOperatingModeSettingsHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {{subPage:WT_G3x5_TSCTrafficAltitudeSettings, xpdr:WT_AirplaneTransponder, xpdrTCASModeSetting:WT_G5000_TransponderTCASModeSetting}}
         */
        this._context = null;
        this._oldContext = null;
        this._isInit = false;

        this._xpdrTCASModeSettingListener = this._onXPDRTCASModeSettingChanged.bind(this);
    }

    _getTemplate() {
        return WT_G5000_TSCTrafficOperatingModeSettingsHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        let taOnlyButton = this.shadowRoot.querySelector(`#taonly`);
        let altitudeReportingButton = this.shadowRoot.querySelector(`#altreporting`);
        let onButton = this.shadowRoot.querySelector(`#on`);
        let standbyButton = this.shadowRoot.querySelector(`#standby`);
        if (taOnlyButton instanceof WT_TSCStatusBarButton &&
            altitudeReportingButton instanceof WT_TSCStatusBarButton &&
            onButton instanceof WT_TSCStatusBarButton &&
            standbyButton instanceof WT_TSCStatusBarButton) {

            this._taOnlyButton = new WT_CachedElement(taOnlyButton);
            this._altitudeReportingButton = new WT_CachedElement(altitudeReportingButton);
            this._onButton = new WT_CachedElement(onButton);
            this._standbyButton = new WT_CachedElement(standbyButton);
            return true;
        } else {
            return false;
        }
    }

    _initButtonListeners() {
        this._taOnlyButton.element.addButtonListener(this._onTAOnlyButtonPressed.bind(this));
        this._altitudeReportingButton.element.addButtonListener(this._onAltitudeReportingButtonPressed.bind(this));
        this._onButton.element.addButtonListener(this._onOnButtonPressed.bind(this));
        this._standbyButton.element.addButtonListener(this._onStandbyButtonPressed.bind(this));
    }

    async _connectedCallbackHelper() {
        await WT_Wait.awaitCallback(this._defineChildren.bind(this));
        this._initButtonListeners();
        this._isInit = true;
        if (this._context) {
            this._updateFromContext();
        }
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _cleanUpContext() {
        this._oldContext.xpdrTCASModeSetting.removeListener(this._xpdrTCASModeSettingListener);
    }

    _initXPDRTCASModeSettingListener() {
        this._context.xpdrTCASModeSetting.addListener(this._xpdrTCASModeSettingListener);
        this._xpdrTCASMode = this._context.xpdrTCASModeSetting.getValue();
    }

    _updateFromContext() {
        if (this._oldContext) {
            this._cleanUpContext();
        }

        if (this._context) {
            this._initXPDRTCASModeSettingListener();
        }
    }

    setContext(context) {
        if (this._context === context) {
            return;
        }

        let oldContext = this._context;
        this._context = context;
        if (this._isInit) {
            this._oldContext = oldContext;
            this._updateFromContext();
        }
    }

    _setXPDRMode(mode) {
        this._context.xpdr.setMode(mode);
    }

    _setXPDRTCASMode(mode) {
        this._context.xpdrTCASModeSetting.setValue(mode);
    }

    _onTAOnlyButtonPressed(button) {
        this._setXPDRMode(WT_AirplaneTransponder.Mode.ALT);
        this._setXPDRTCASMode(WT_G5000_TransponderTCASModeSetting.Mode.TA_ONLY);
    }

    _onAltitudeReportingButtonPressed(button) {
        this._setXPDRMode(WT_AirplaneTransponder.Mode.ALT);
        this._setXPDRTCASMode(WT_G5000_TransponderTCASModeSetting.Mode.STANDBY);
    }

    _onOnButtonPressed(button) {
        this._setXPDRMode(WT_AirplaneTransponder.Mode.ON);
        this._setXPDRTCASMode(WT_G5000_TransponderTCASModeSetting.Mode.STANDBY);
    }

    _onStandbyButtonPressed(button) {
        this._setXPDRMode(WT_AirplaneTransponder.Mode.STANDBY);
        this._setXPDRTCASMode(WT_G5000_TransponderTCASModeSetting.Mode.STANDBY);
    }

    _onXPDRTCASModeSettingChanged(setting, newValue, oldValue) {
        this._xpdrTCASMode = newValue;
    }

    _updateTAOnlyButton(xpdrMode) {
        let isToggleOn = xpdrMode === WT_AirplaneTransponder.Mode.ALT && this._xpdrTCASMode === WT_G5000_TransponderTCASModeSetting.Mode.TA_ONLY;
        this._taOnlyButton.setAttribute("toggle", `${isToggleOn ? "on" : "off"}`);
    }

    _updateAltitudeReportingButton(xpdrMode) {
        let isToggleOn = xpdrMode === WT_AirplaneTransponder.Mode.ALT && this._xpdrTCASMode === WT_G5000_TransponderTCASModeSetting.Mode.STANDBY;
        this._altitudeReportingButton.setAttribute("toggle", `${isToggleOn ? "on" : "off"}`);
    }

    _updateOnButton(xpdrMode) {
        let isToggleOn = xpdrMode === WT_AirplaneTransponder.Mode.ON;
        this._onButton.setAttribute("toggle", `${isToggleOn ? "on" : "off"}`);
    }

    _updateStandbyButton(xpdrMode) {
        let isToggleOn = xpdrMode === WT_AirplaneTransponder.Mode.STANDBY;
        this._standbyButton.setAttribute("toggle", `${isToggleOn ? "on" : "off"}`);
    }

    _updateDisplay() {
        let xpdrMode = this._context.xpdr.mode();
        this._updateTAOnlyButton(xpdrMode);
        this._updateAltitudeReportingButton(xpdrMode);
        this._updateOnButton(xpdrMode);
        this._updateStandbyButton(xpdrMode);
    }

    update() {
        if (!this._isInit || !this._context) {
            return;
        }

        this._updateDisplay();
    }
}
WT_G5000_TSCTrafficOperatingModeSettingsHTMLElement.NAME = "wt-tsc-trafficsettings-operatingmode";
WT_G5000_TSCTrafficOperatingModeSettingsHTMLElement.TEMPLATE = document.createElement("template");
WT_G5000_TSCTrafficOperatingModeSettingsHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            border-radius: 3px;
            background: linear-gradient(#1f3445, black 25px);
            background-color: black;
            border: 3px solid var(--wt-g3x5-bordergray);
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
        }
            #title {
                margin: 0.5em;
                text-align: center;
                font-size: var(--trafficsettings-title-font-size, 0.75em);
                color: white;
            }
            #buttons {
                position: relative;
                left: var(--trafficsettings-button-margin-horizontal, 0.1em);
                width: calc(100% - 2 * var(--trafficsettings-button-margin-horizontal, 0.1em));
            }
            .button {
                position: relative;
                left: 50%;
                width: 100%;
                height: var(--trafficsettings-button-height, 3em);
                transform: translateX(-50%);
                margin-bottom: var(--trafficsettings-button-margin-vertical, 0.1em);
            }
    </style>
    <div id="wrapper">
        <div id="title">XPDR/TCAS Mode</div>
        <div id="buttons">
            <wt-tsc-button-statusbar id="auto" class="button" labeltext="Auto" enabled="false"></wt-tsc-button-statusbar>
            <wt-tsc-button-statusbar id="taonly" class="button" labeltext="TA Only"></wt-tsc-button-statusbar>
            <wt-tsc-button-statusbar id="altreporting" class="button" labeltext="ALT Reporting"></wt-tsc-button-statusbar>
            <wt-tsc-button-statusbar id="on" class="button" labeltext="On"></wt-tsc-button-statusbar>
            <wt-tsc-button-statusbar id="standby" class="button" labeltext="Standby"></wt-tsc-button-statusbar>
        </div>
    </div>
`;

customElements.define(WT_G5000_TSCTrafficOperatingModeSettingsHTMLElement.NAME, WT_G5000_TSCTrafficOperatingModeSettingsHTMLElement);