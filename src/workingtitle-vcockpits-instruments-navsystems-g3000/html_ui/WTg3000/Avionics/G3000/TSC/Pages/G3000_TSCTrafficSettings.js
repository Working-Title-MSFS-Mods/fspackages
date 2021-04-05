class WT_G3000_TSCTrafficMapSettings extends WT_G3x5_TSCTrafficMapSettings {
    _initSettingModel() {
        super._initSettingModel();

        this._settingModel.addSetting(this._operatingModeSetting = new WT_G3000_TrafficSystemOperatingModeSetting(this._settingModel));
    }

    _createOperatingModeSubPage() {
        return new WT_G3000_TSCTrafficOperatingModeSettings(this, this._operatingModeSetting);
    }
}

class WT_G3000_TSCNavMapTrafficSettings extends WT_G3x5_TSCNavMapTrafficSettings {
    _initSettingModel() {
        super._initSettingModel();

        this._settingModel.addSetting(this._operatingModeSetting = new WT_G3000_TrafficSystemOperatingModeSetting(this._settingModel));
    }

    _createOperatingModeSubPage() {
        return new WT_G3000_TSCTrafficOperatingModeSettings(this, this._operatingModeSetting);
    }
}

class WT_G3000_TSCTrafficOperatingModeSettings extends WT_G3x5_TSCTrafficOperatingModeSettings {
    /**
     * @param {WT_G3x5_TSCTrafficSettings} parentPage
     * @param {WT_G3x5_TrafficSystemOperatingModeSetting} operatingModeSetting
     */
    constructor(parentPage, operatingModeSetting) {
        super(parentPage);

        this.htmlElement.setContext({
            subPage: this,
            modeSetting: operatingModeSetting
        });
    }

    _createHTMLElement() {
        return new WT_G3000_TSCTrafficOperatingModeSettingsHTMLElement();
    }
}

class WT_G3000_TSCTrafficOperatingModeSettingsHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {{subPage:WT_G3x5_TSCTrafficAltitudeSettings, modeSetting:WT_G3000_TrafficSystemOperatingModeSetting}}
         */
        this._context = null;
        this._oldContext = null;
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3000_TSCTrafficOperatingModeSettingsHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        let operatingButton = this.shadowRoot.querySelector(`#operating`);
        let standbyButton = this.shadowRoot.querySelector(`#standby`);
        if (operatingButton instanceof WT_TSCStatusBarButton && standbyButton instanceof WT_TSCStatusBarButton) {
            this._operatingButton = operatingButton;
            this._standbyButton = standbyButton;
            return true;
        } else {
            return false;
        }
    }

    _initOperatingButtonManager() {
        this._operatingButtonManager = new WT_TSCSettingEnumStatusBarButtonManager(this._operatingButton, this._context.modeSetting, WT_G3000_TrafficAdvisorySystem.OperatingMode.OPERATING);
        this._operatingButtonManager.init();
    }

    _initStandbyButtonManager() {
        this._standbyButtonManager = new WT_TSCSettingEnumStatusBarButtonManager(this._standbyButton, this._context.modeSetting, WT_G3000_TrafficAdvisorySystem.OperatingMode.STANDBY);
        this._standbyButtonManager.init();
    }

    _initButtonManagers() {
        this._initOperatingButtonManager();
        this._initStandbyButtonManager();
    }

    async _connectedCallbackHelper() {
        await WT_Wait.awaitCallback(this._defineChildren.bind(this));
        this._isInit = true;
        if (this._context) {
            this._updateFromContext();
        }
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _cleanUpContext() {
        this._operatingButtonManager.destroy();
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
WT_G3000_TSCTrafficOperatingModeSettingsHTMLElement.NAME = "wt-tsc-trafficsettings-operatingmode";
WT_G3000_TSCTrafficOperatingModeSettingsHTMLElement.TEMPLATE = document.createElement("template");
WT_G3000_TSCTrafficOperatingModeSettingsHTMLElement.TEMPLATE.innerHTML = `
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
        <div id="title">TAS Mode</div>
        <div id="buttons">
            <wt-tsc-button-statusbar id="operating" class="button" labeltext="Operating"></wt-tsc-button-statusbar>
            <wt-tsc-button-statusbar id="standby" class="button" labeltext="Standby"></wt-tsc-button-statusbar>
        </div>
    </div>
`;

customElements.define(WT_G3000_TSCTrafficOperatingModeSettingsHTMLElement.NAME, WT_G3000_TSCTrafficOperatingModeSettingsHTMLElement);