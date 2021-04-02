class WT_G5000_TSCTrafficSettings extends WT_G3x5_TSCTrafficSettings {
    constructor(homePageGroup, homePageName, trafficSystemID, xpdrID, instrumentID, halfPaneID) {
        super(homePageGroup, homePageName, trafficSystemID, instrumentID, halfPaneID);

        this._xpdrID = xpdrID;

        this._initXPDRSettingModel();
    }

    _initXPDRSettingModel() {
        this._xpdrSettingModel = new WT_DataStoreSettingModel(this._xpdrID);
        this._xpdrSettingModel.addSetting(this._xpdrModeSetting = new WT_G5000_TransponderModeSetting(this._xpdrSettingModel, this._xpdrID));
    }

    _createOperatingModeSubPage() {
        return new WT_G5000_TSCTrafficOperatingModeSettings(this, this._xpdrModeSetting);
    }
}

class WT_G5000_TSCTrafficOperatingModeSettings extends WT_G3x5_TSCTrafficOperatingModeSettings {
    /**
     * @param {WT_G3x5_TSCTrafficSettings} parentPage
     * @param {WT_G5000_TransponderModeSetting} operatingModeSetting
     */
    constructor(parentPage, xpdrModeSetting) {
        super(parentPage);

        this.htmlElement.setContext({
            subPage: this,
            xpdrModeSetting: xpdrModeSetting
        });
    }

    _createHTMLElement() {
        return new WT_G5000_TSCTrafficOperatingModeSettingsHTMLElement();
    }
}

class WT_G5000_TSCTrafficOperatingModeSettingsHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {{subPage:WT_G3x5_TSCTrafficAltitudeSettings, xpdrModeSetting:WT_G5000_TransponderModeSetting}}
         */
        this._context = null;
        this._oldContext = null;
        this._isInit = false;
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

            this._taOnlyButton = taOnlyButton;
            this._altitudeReportingButton = altitudeReportingButton;
            this._onButton = onButton;
            this._standbyButton = standbyButton;
            return true;
        } else {
            return false;
        }
    }

    _initTAOnlyButtonManager() {
        this._taOnlyButtonManager = new WT_TSCSettingEnumStatusBarButtonManager(this._taOnlyButton, this._context.xpdrModeSetting, WT_G5000_TransponderModeSetting.Mode.TA_ONLY);
        this._taOnlyButtonManager.init();
    }

    _initAltitudeReportingButtonManager() {
        this._altitudeReportingButtonManager = new WT_TSCSettingEnumStatusBarButtonManager(this._altitudeReportingButton, this._context.xpdrModeSetting, WT_G5000_TransponderModeSetting.Mode.ALTITUDE_REPORTING);
        this._altitudeReportingButtonManager.init();
    }

    _initOnButtonManager() {
        this._onButtonManager = new WT_TSCSettingEnumStatusBarButtonManager(this._onButton, this._context.xpdrModeSetting, WT_G5000_TransponderModeSetting.Mode.ON);
        this._onButtonManager.init();
    }

    _initStandbyButtonManager() {
        this._standbyButtonManager = new WT_TSCSettingEnumStatusBarButtonManager(this._standbyButton, this._context.xpdrModeSetting, WT_G5000_TransponderModeSetting.Mode.STANDBY);
        this._standbyButtonManager.init();
    }

    _initButtonManagers() {
        this._initTAOnlyButtonManager();
        this._initAltitudeReportingButtonManager();
        this._initOnButtonManager();
        this._initStandbyButtonManager();
    }

    async _connectedCallbackHelper() {
        await WT_Wait.wait(this._defineChildren.bind(this));
        this._isInit = true;
        if (this._context) {
            this._updateFromContext();
        }
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _cleanUpContext() {
        this._taOnlyButtonManager.destroy();
        this._altitudeReportingButtonManager.destroy();
        this._onButtonManager.destroy();
        this._standbyButtonManager.destroy();
    }

    _updateFromContext() {
        if (this._oldContext) {
            this._cleanUpContext();
        }

        if (this._context) {
            this._initButtonManagers();
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