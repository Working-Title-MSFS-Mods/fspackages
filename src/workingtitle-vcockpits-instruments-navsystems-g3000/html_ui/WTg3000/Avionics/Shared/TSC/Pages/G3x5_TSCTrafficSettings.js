class WT_G3x5_TSCTrafficSettings extends WT_G3x5_TSCPageElement {
    constructor(homePageGroup, homePageName, instrumentID, halfPaneID) {
        super(homePageGroup, homePageName);

        let prefix = halfPaneID === undefined ? instrumentID : `${instrumentID}-${halfPaneID}`;
        this._trafficMapSettingModelID = `${prefix}-${WT_G3x5_TrafficMap.CONTROLLER_ID_SUFFIX}`;

        this._initSettingModel();
    }

    /**
     * The traffic map setting model associated with this settings page.
     * @readonly
     * @type {WT_MapSettingModel}
     */
    get trafficMapSettingModel() {
        return this._settingModel;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCTrafficSettingsHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _initSettingModel() {
        this._settingModel = new WT_MapSettingModel(this._trafficMapSettingModelID, null, null);

        this.trafficMapSettingModel.addSetting(this._rangeSetting = new WT_G3x5_TrafficMapRangeSetting(this.trafficMapSettingModel, WT_G3x5_TrafficMap.MAP_RANGE_LEVELS, WT_G3x5_TrafficMap.MAP_RANGE_DEFAULT));
        this.trafficMapSettingModel.addSetting(this._altitudeModeSetting = new WT_G3x5_TrafficMapAltitudeModeSetting(this.trafficMapSettingModel, false));
        this.trafficMapSettingModel.addSetting(this._altitudeRestrictionSetting = new WT_G3x5_TrafficMapAltitudeRestrictionSetting(this.trafficMapSettingModel, false));
        this.trafficMapSettingModel.addSetting(this._motionVectorModeSetting = new WT_G3x5_TrafficMapMotionVectorModeSetting(this.trafficMapSettingModel, false));
        this.trafficMapSettingModel.addSetting(this._motionVectorLookaheadSetting = new WT_G3x5_TrafficMapMotionVectorLookaheadSetting(this.trafficMapSettingModel, false));
    }

    _createHTMLElement() {
        return new WT_G3x5_TSCTrafficSettingsHTMLElement();
    }

    _initSubPages() {
        this._altitudeSubPage = new WT_G3x5_TSCTrafficAltitudeSettings(this, this._altitudeModeSetting, this._altitudeRestrictionSetting);
        this._adsbSubPage = new WT_G3x5_TSCTrafficADSBSettings(this, this._motionVectorModeSetting, this._motionVectorLookaheadSetting);
    }

    init(root) {
        this.container.title = "Traffic Settings";

        /**
         * @type {WT_G3x5_TSCWeatherRadarSettingsHTMLElement}
         */
        this._htmlElement = this._createHTMLElement();
        root.appendChild(this.htmlElement);

        this._initSubPages();
    }

    onUpdate(deltaTime) {
    }

    changeRange(delta) {
        let target = Math.max(0, Math.min(this._rangeSetting.ranges.length - 1, this._rangeSetting.getValue() + delta));
        this._rangeSetting.setValue(target);
    }
}

class WT_G3x5_TSCTrafficSettingsHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));
    }

    _getTemplate() {
        return WT_G3x5_TSCTrafficSettingsHTMLElement.TEMPLATE;
    }
}
WT_G3x5_TSCTrafficSettingsHTMLElement.NAME = "wt-tsc-trafficsettings";
WT_G3x5_TSCTrafficSettingsHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCTrafficSettingsHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            width: 100%;
            height: 100%;
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
    </style>
    <div id="wrapper">
        <slot name="xpdr"></slot>
        <slot name="altitude"></slot>
        <slot name="adsb"></slot>
    </div>
`;

customElements.define(WT_G3x5_TSCTrafficSettingsHTMLElement.NAME, WT_G3x5_TSCTrafficSettingsHTMLElement);

class WT_G3x5_TSCTrafficSettingsSubPage {
    /**
     * @param {WT_G3x5_TSCTrafficSettings} parentPage
     * @param {String} slot
     */
    constructor(parentPage, slot) {
        this._parentPage = parentPage;

        this._initHTMLElement(slot);
    }

    _createHTMLElement() {
    }

    _initHTMLElement(slot) {
        this._htmlElement = this._createHTMLElement();
        this._htmlElement.slot = slot;
        this.parentPage.htmlElement.appendChild(this.htmlElement);
    }

    /**
     * The parent page of this sub page.
     * @readonly
     * @type {WT_G3x5_TSCTrafficSettings}
     */
    get parentPage() {
        return this._parentPage;
    }

    /**
     * @readonly
     * @type {HTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    update() {
    }
}

class WT_G3x5_TSCTrafficAltitudeSettings extends WT_G3x5_TSCTrafficSettingsSubPage {
    /**
     * @param {WT_G3x5_TSCTrafficSettings} parentPage
     * @param {HTMLElement} htmlElement
     * @param {WT_WeatherRadarSetting} modeSetting
     */
    constructor(parentPage, altitudeModeSetting, altitudeRestrictionSetting) {
        super(parentPage, WT_G3x5_TSCTrafficAltitudeSettings.SLOT);

        this.htmlElement.setContext({
            subPage: this,
            modeSetting: altitudeModeSetting,
            restrictionSetting: altitudeRestrictionSetting
        });
    }

    _createHTMLElement() {
        return new WT_G3x5_TSCTrafficAltitudeSettingsHTMLElement();
    }
}
WT_G3x5_TSCTrafficAltitudeSettings.SLOT = "altitude";

class WT_G3x5_TSCTrafficAltitudeSettingsHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {{subPage:WT_G3x5_TSCTrafficAltitudeSettings, modeSetting:WT_G3x5_TrafficMapAltitudeModeSetting, restrictionSetting:WT_G3x5_TrafficMapAltitudeRestrictionSetting}}
         */
        this._context = null;
        this._oldContext = null;
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCTrafficAltitudeSettingsHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        let relativeButton = this.shadowRoot.querySelector(`#relative`);
        let absoluteButton = this.shadowRoot.querySelector(`#absolute`);
        let restrictionButton = this.shadowRoot.querySelector(`#restriction`);
        if (relativeButton instanceof WT_TSCStatusBarButton && absoluteButton instanceof WT_TSCStatusBarButton && restrictionButton instanceof WT_TSCValueButton) {
            this._relativeButton = relativeButton;
            this._absoluteButton = absoluteButton;
            this._restrictionButton = restrictionButton;
            return true;
        } else {
            return false;
        }
    }

    _initRelativeButtonManager() {
        this._relativeButtonManager = new WT_TSCSettingEnumStatusBarButtonManager(this._relativeButton, this._context.modeSetting, WT_G3x5_MapModelTrafficModule.AltitudeMode.RELATIVE);
        this._relativeButtonManager.init();
    }

    _initAbsoluteButtonManager() {
        this._absoluteButtonManager = new WT_TSCSettingEnumStatusBarButtonManager(this._absoluteButton, this._context.modeSetting, WT_G3x5_MapModelTrafficModule.AltitudeMode.ABSOLUTE);
        this._absoluteButtonManager.init();
    }

    _initRestrictionButtonManager() {
        let elementHandler = new WT_TSCStandardSelectionElementHandler(WT_G3x5_TSCTrafficAltitudeSettingsHTMLElement.ALTITUDE_RESTRICTION_VALUE_TEXT);
        let context = {
            title: WT_G3x5_TSCTrafficAltitudeSettingsHTMLElement.ALTITUDE_RESTRICTION_TITLE,
            subclass: "standardDynamicSelectionListWindow",
            closeOnSelect: true,
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            homePageGroup: this._context.subPage.parentPage.homePageGroup,
            homePageName: this._context.subPage.parentPage.homePageName
        };

        let instrument = this._context.subPage.parentPage.instrument;
        this._restrictionButtonManager = new WT_TSCSettingValueButtonManager(instrument, this._restrictionButton, this._context.restrictionSetting, instrument.selectionListWindow1, context, value => WT_G3x5_TSCTrafficAltitudeSettingsHTMLElement.ALTITUDE_RESTRICTION_VALUE_TEXT[value]);
        this._restrictionButtonManager.init();
    }

    _initButtonManagers() {
        this._initRelativeButtonManager();
        this._initAbsoluteButtonManager();
        this._initRestrictionButtonManager();
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
        this._relativeButtonManager.destroy();
        this._absoluteButtonManager.destroy();
        this._restrictionButtonManager.destroy();
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
WT_G3x5_TSCTrafficAltitudeSettingsHTMLElement.ALTITUDE_RESTRICTION_TITLE = "Altitude Range";
WT_G3x5_TSCTrafficAltitudeSettingsHTMLElement.ALTITUDE_RESTRICTION_VALUE_TEXT = [
    "Unrestricted",
    "Above",
    "Normal",
    "Below"
];
WT_G3x5_TSCTrafficAltitudeSettingsHTMLElement.NAME = "wt-tsc-trafficsettings-altitude";
WT_G3x5_TSCTrafficAltitudeSettingsHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCTrafficAltitudeSettingsHTMLElement.TEMPLATE.innerHTML = `
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
            wt-tsc-button-value {
                --value-color: var(--wt-g3x5-lightblue);
            }
    </style>
    <div id="wrapper">
        <div id="title">Altitude Display</div>
        <div id="buttons">
            <wt-tsc-button-statusbar id="relative" class="button" labeltext="Relative"></wt-tsc-button-statusbar>
            <wt-tsc-button-statusbar id="absolute" class="button" labeltext="Absolute"></wt-tsc-button-statusbar>
            <wt-tsc-button-value id="restriction" class="button" labeltext="Altitude Range"></wt-tsc-button-value>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCTrafficAltitudeSettingsHTMLElement.NAME, WT_G3x5_TSCTrafficAltitudeSettingsHTMLElement);

class WT_G3x5_TSCTrafficADSBSettings extends WT_G3x5_TSCTrafficSettingsSubPage {
    /**
     * @param {WT_G3x5_TSCTrafficSettings} parentPage
     * @param {HTMLElement} htmlElement
     * @param {WT_WeatherRadarSetting} modeSetting
     */
    constructor(parentPage, motionVectorModeSetting, motionVectorLookaheadSetting) {
        super(parentPage, WT_G3x5_TSCTrafficADSBSettings.SLOT);

        this.htmlElement.setContext({
            subPage: this,
            vectorModeSetting: motionVectorModeSetting,
            vectorLookaheadSetting: motionVectorLookaheadSetting
        });
    }

    _createHTMLElement() {
        return new WT_G3x5_TSCTrafficADSBSettingsHTMLElement();
    }
}
WT_G3x5_TSCTrafficADSBSettings.SLOT = "adsb";

class WT_G3x5_TSCTrafficADSBSettingsHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {{subPage:WT_G3x5_TSCTrafficAltitudeSettings, vectorModeSetting:WT_G3x5_TrafficMapMotionVectorModeSetting, vectorLookaheadSetting:WT_G3x5_TrafficMapMotionVectorLookaheadSetting}}
         */
        this._context = null;
        this._oldContext = null;
        this._isInit = false;

        this._initLookaheadFormatter();
    }

    _getTemplate() {
        return WT_G3x5_TSCTrafficADSBSettingsHTMLElement.TEMPLATE;
    }

    _initLookaheadFormatter() {
        this._lookaheadFormatter = new WT_NumberFormatter({
            precision: 1,
            unitLong: true
        });
    }

    _defineChildren() {
        let vectorModeButton = this.shadowRoot.querySelector(`#vectormode`);
        let vectorLookaheadButton = this.shadowRoot.querySelector(`#vectorlookahead`);
        if (vectorModeButton instanceof WT_TSCValueButton && vectorLookaheadButton instanceof WT_TSCValueButton) {
            this._vectorModeButton = vectorModeButton;
            this._vectorLookaheadButton = vectorLookaheadButton;
            return true;
        } else {
            return false;
        }
    }

    _initVectorModeButtonManager() {
        let elementHandler = new WT_TSCStandardSelectionElementHandler(WT_G3x5_TSCTrafficADSBSettingsHTMLElement.VECTOR_MODE_VALUE_TEXT);
        let context = {
            title: WT_G3x5_TSCTrafficADSBSettingsHTMLElement.VECTOR_MODE_TITLE,
            subclass: "standardDynamicSelectionListWindow",
            closeOnSelect: true,
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            homePageGroup: this._context.subPage.parentPage.homePageGroup,
            homePageName: this._context.subPage.parentPage.homePageName
        };

        let instrument = this._context.subPage.parentPage.instrument;
        this._vectorModeButtonManager = new WT_TSCSettingValueButtonManager(instrument, this._vectorModeButton, this._context.vectorModeSetting, instrument.selectionListWindow1, context, value => WT_G3x5_TSCTrafficADSBSettingsHTMLElement.VECTOR_MODE_VALUE_TEXT[value]);
        this._vectorModeButtonManager.init();
    }

    _initVectorLookaheadButtonManager() {
        let elementHandler = new WT_TSCStandardSelectionElementHandler(this._context.vectorLookaheadSetting.lookaheadValues.map((value, index) => this._vectorLookaheadValueTextMap(index), this));
        let context = {
            title: WT_G3x5_TSCTrafficADSBSettingsHTMLElement.VECTOR_LOOKAHEAD_TITLE,
            subclass: "standardDynamicSelectionListWindow",
            closeOnSelect: true,
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            homePageGroup: this._context.subPage.parentPage.homePageGroup,
            homePageName: this._context.subPage.parentPage.homePageName
        };

        let instrument = this._context.subPage.parentPage.instrument;
        this._vectorLookaheadButtonManager = new WT_TSCSettingValueButtonManager(instrument, this._vectorLookaheadButton, this._context.vectorLookaheadSetting, instrument.selectionListWindow1, context, this._vectorLookaheadValueTextMap.bind(this));
        this._vectorLookaheadButtonManager.init();
    }

    _initButtonManagers() {
        this._initVectorModeButtonManager();
        this._initVectorLookaheadButtonManager();
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
        this._vectorModeButtonManager.destroy();
        this._vectorLookaheadButtonManager.destroy();
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

    _vectorLookaheadValueTextMap(value) {
        let time = this._context.vectorLookaheadSetting.lookaheadValues.get(value);
        let unit;
        if (time.asUnit(WT_Unit.SECOND) <= 60) {
            unit = WT_Unit.SECOND;
        } else {
            unit = WT_Unit.MINUTE;
        }
        return this._lookaheadFormatter.getFormattedString(time, unit);
    }
}
WT_G3x5_TSCTrafficADSBSettingsHTMLElement.VECTOR_MODE_TITLE = "Motion Vector";
WT_G3x5_TSCTrafficADSBSettingsHTMLElement.VECTOR_MODE_VALUE_TEXT = [
    "Off",
    "Relative",
    "Absolute"
];
WT_G3x5_TSCTrafficADSBSettingsHTMLElement.VECTOR_LOOKAHEAD_TITLE = "VECT Duration";
WT_G3x5_TSCTrafficADSBSettingsHTMLElement.UNIT_CLASS = "unit";
WT_G3x5_TSCTrafficADSBSettingsHTMLElement.NAME = "wt-tsc-trafficsettings-adsb";
WT_G3x5_TSCTrafficADSBSettingsHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCTrafficADSBSettingsHTMLElement.TEMPLATE.innerHTML = `
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
            wt-tsc-button-value {
                --value-color: var(--wt-g3x5-lightblue);
            }

        .${WT_G3x5_TSCTrafficADSBSettingsHTMLElement.UNIT_CLASS} {
            font-size: var(--trafficsettings-unit-font-size, 0.75em);
        }
    </style>
    <div id="wrapper">
        <div id="title">ADS-B</div>
        <div id="buttons">
            <wt-tsc-button-statusbar id="display" class="button" labeltext="Traffic Display" enabled="false" toggle="on"></wt-tsc-button-statusbar>
            <wt-tsc-button-value id="vectormode" class="button" labeltext="Motion Vector"></wt-tsc-button-value>
            <wt-tsc-button-value id="vectorlookahead" class="button" labeltext="VECT Duration"></wt-tsc-button-value>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCTrafficADSBSettingsHTMLElement.NAME, WT_G3x5_TSCTrafficADSBSettingsHTMLElement);