class WT_G3x5_TSCChartsOptions extends WT_G3x5_TSCPopUpElement {
    constructor() {
        super();

        this._initWindowContexts();
        this._isReady = false;

        this._lightThresholdSettingListener = this._onLightThresholdSettingChanged.bind(this);
    }

    _initLightModeWindowContext() {
        let elementHandler = new WT_TSCStandardSelectionElementHandler(WT_G3x5_TSCChartsOptions.LIGHT_MODE_TEXT);
        this._lightModeWindowContext = {
            title: "Select Light Mode",
            subclass: "standardDynamicSelectionListWindow",
            closeOnSelect: true,
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            homePageGroup: "",
            homePageName: ""
        };
    }

    _initWindowContexts() {
        this._initLightModeWindowContext();
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCChartsOptionsHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createHTMLElement() {
        return new WT_G3x5_TSCChartsOptionsHTMLElement();
    }

    _initButtons() {
        this._sectionAllButtonCached = new WT_CachedElement(this.htmlElement.sectionAllButton);
        this._sectionPlanButtonCached = new WT_CachedElement(this.htmlElement.sectionPlanButton);

        this.htmlElement.fitWidthButton.addButtonListener(this._onFitWidthButtonPressed.bind(this));
        this.htmlElement.lightThresholdButton.addButtonListener(this._onLightThresholdButtonPressed.bind(this));
    }

    async _initFromHTMLElement() {
        await WT_Wait.awaitCallback(() => this.htmlElement.isInitialized, this);
        this._initButtons();
        this._isReady = true;
        this._initOnEnter();
    }

    onInit() {
        this._htmlElement = this._createHTMLElement();
        this.popUpWindow.appendChild(this.htmlElement);
        this._initFromHTMLElement();
    }

    _fitWidth() {
        if (!this.context) {
            return;
        }

        this.context.chartsPage.resetRotation();
        this.context.chartsPage.resetZoom();
        this.context.chartsPage.resetScroll();
    }

    _onFitWidthButtonPressed(button) {
        this._fitWidth();
    }

    _openLightThresholdWindow() {
        this.instrument.chartsLightThreshold.element.setContext({homePageGroup: this.context.homePageGroup, homePageName: this.context.homePageName, chartsPage: this.context.chartsPage});
        this.instrument.switchToPopUpPage(this.instrument.chartsLightThreshold);
    }

    _onLightThresholdButtonPressed(button) {
        if (!this.context) {
            return;
        }

        this._openLightThresholdWindow();
    }

    _setLightThresholdButtonValue(value) {
        this.htmlElement.lightThresholdButton.valueText = `${(value * 100).toFixed(0)}%`;
    }

    _onLightThresholdSettingChanged(setting, oldValue, newValue) {
        this._setLightThresholdButtonValue(newValue);
    }

    _cleanUpButtonManagers() {
        if (this._sectionAllButtonManager) {
            this._lightModeButtonManager.destroy();
            this._sectionAllButtonManager.destroy();
            this._sectionPlanButtonManager.destroy();

            this._lightModeButtonManager = null;
            this._sectionAllButtonManager = null;
            this._sectionPlanButtonManager = null;
        }
    }

    _cleanUpLightThresholdSettingListener() {
        this.context.chartsPage.lightThresholdSetting.removeListener(this._lightThresholdSettingListener);
    }

    _initLightModeButtonManager() {
        let chartsPage = this.context.chartsPage;
        let instrument = chartsPage.instrument;
        this._lightModeWindowContext.homePageGroup = chartsPage.homePageGroup;
        this._lightModeWindowContext.homePageName = chartsPage.homePageName;

        this._lightModeButtonManager = new WT_TSCSettingValueButtonManager(instrument, this.htmlElement.lightModeButton, chartsPage.lightModeSetting, instrument.selectionListWindow1, this._lightModeWindowContext, value => WT_G3x5_TSCChartsOptions.LIGHT_MODE_TEXT[value]);
        this._lightModeButtonManager.init();
    }

    _initSectionAllButtonManager() {
        this._sectionAllButtonManager = new WT_TSCSettingEnumStatusBarButtonManager(this.htmlElement.sectionAllButton, this.context.chartsPage.sectionSetting, WT_G3x5_ChartsModel.SectionMode.ALL);
        this._sectionAllButtonManager.init();
    }

    _initSectionPlanButtonManager() {
        this._sectionPlanButtonManager = new WT_TSCSettingEnumStatusBarButtonManager(this.htmlElement.sectionPlanButton, this.context.chartsPage.sectionSetting, WT_G3x5_ChartsModel.SectionMode.PLAN);
        this._sectionPlanButtonManager.init();
    }

    _initButtonManagers() {
        this._initLightModeButtonManager();
        this._initSectionAllButtonManager();
        this._initSectionPlanButtonManager();
    }

    _initLightThresholdSettingListener() {
        this.context.chartsPage.lightThresholdSetting.addListener(this._lightThresholdSettingListener);
        this._setLightThresholdButtonValue(this.context.chartsPage.lightThresholdSetting.getValue());
    }

    _initOnEnter() {
        if (!this.context || !this._isReady) {
            return;
        }

        this._initButtonManagers();
        this._initLightThresholdSettingListener();
    }

    _cleanUpOnExit() {
        this._cleanUpButtonManagers();
        this._cleanUpLightThresholdSettingListener();
    }

    onEnter() {
        super.onEnter();

        this._initOnEnter();
    }

    _updateSectionAllButton() {
        this._sectionAllButtonCached.setAttribute("enabled", `${this.context.chartsPage.selectedChart !== null}`);
    }

    _updateSectionPlanButton() {
        let chart = this.context.chartsPage.selectedChart;
        this._sectionPlanButtonCached.setAttribute("enabled", `${chart !== null && chart.planview !== undefined}`);
    }

    _updateSectionButtons() {
        this._updateSectionAllButton();
        this._updateSectionPlanButton();
    }

    onUpdate(deltaTime) {
        if (!this._isReady) {
            return;
        }

        this._updateSectionButtons();
    }

    onExit() {
        super.onExit();

        this._cleanUpOnExit();
    }
}
WT_G3x5_TSCChartsOptions.LIGHT_MODE_TEXT = [
    "Night",
    "Day",
    "Auto"
];

class WT_G3x5_TSCChartsOptionsHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCChartsOptionsHTMLElement.TEMPLATE;
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
     * @type {WT_TSCLabeledButton}
     */
    get fitWidthButton() {
        return this._fitWidthButton;
    }

    /**
     * @readonly
     * @type {WT_TSCValueButton}
     */
    get lightModeButton() {
        return this._lightModebutton;
    }

    /**
     * @readonly
     * @type {WT_TSCValueButton}
     */
    get lightThresholdButton() {
        return this._lightThresholdButton;
    }

    /**
     * @readonly
     * @type {WT_TSCStatusBarButton}
     */
    get sectionAllButton() {
        return this._sectionAllButton;
    }

    /**
     * @readonly
     * @type {WT_TSCStatusBarButton}
     */
    get sectionPlanButton() {
        return this._sectionPlanButton;
    }

    async _defineChildren() {
        [
            this._fitWidthButton,
            this._lightModebutton,
            this._lightThresholdButton,
            this._sectionAllButton,
            this._sectionPlanButton
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#fitwidth`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#lightmode`, WT_TSCValueButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#lightthreshold`, WT_TSCValueButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#sectionall`, WT_TSCStatusBarButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#sectionplan`, WT_TSCStatusBarButton),
        ]);
    }

    _initSymbolRangeWindowContext() {
        let elementHandler = new WT_G3x5_TSCRangeSelectionElementHandler(WT_G3x5_NavMap.MAP_RANGE_LEVELS.filter(value => value.compare(WT_G3x5_NavMap.TRAFFIC_SYMBOL_RANGE_MAX) <= 0), this._context.instrument.unitsSettingModel);
        this._symbolRangeWindowContext = {
            title: "Map Traffic Symbol Range",
            subclass: "standardDynamicSelectionListWindow",
            closeOnSelect: true,
            callback: this._setRangeSetting.bind(this, WT_G3x5_NavMap.TRAFFIC_SYMBOL_RANGE_KEY),
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            currentIndexGetter: new WT_G3x5_TSCMapSettingIndexGetter(this._getSettingModelID.bind(this), WT_G3x5_NavMap.TRAFFIC_SYMBOL_RANGE_KEY),
        };
    }

    _initLabelRangeWindowContext() {
        let elementHandler = new WT_G3x5_TSCRangeSelectionElementHandler(WT_G3x5_NavMap.MAP_RANGE_LEVELS.filter(value => value.compare(WT_G3x5_NavMap.TRAFFIC_LABEL_RANGE_MAX) <= 0), this._context.instrument.unitsSettingModel);
        this._labelRangeWindowContext = {
            title: "Map Traffic Label Range",
            subclass: "standardDynamicSelectionListWindow",
            closeOnSelect: true,
            callback: this._setRangeSetting.bind(this, WT_G3x5_NavMap.TRAFFIC_LABEL_RANGE_KEY),
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            currentIndexGetter: new WT_G3x5_TSCMapSettingIndexGetter(this._getSettingModelID.bind(this), WT_G3x5_NavMap.TRAFFIC_LABEL_RANGE_KEY),
        };
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }
}
WT_G3x5_TSCChartsOptionsHTMLElement.NAME = "wt-tsc-chartsoptions";
WT_G3x5_TSCChartsOptionsHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCChartsOptionsHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            border-radius: 5px;
            background: linear-gradient(#1f3445, black 25px);
            background-color: black;
            border: 3px solid var(--wt-g3x5-bordergray);
        }

        #wrapper {
            position: absolute;
            left: var(--chartsoptions-padding-left, 0.5em);
            top: var(--chartsoptions-padding-top, 0.5em);
            width: calc(100% - var(--chartsoptions-padding-left, 0.5em) - var(--chartsoptions-padding-right, 0.5em));
            height: calc(100% - var(--chartsoptions-padding-top, 0.5em) - var(--chartsoptions-padding-bottom, 0.5em));
            display: grid;
            grid-template-rows: 100%;
            grid-template-columns: var(--chartsoptions-leftcolumn-width, 33%) 1fr;
            grid-gap: 0 var(--chartsoptions-column-gap, 0.5em);
        }
            #left {
                position: relative;
                width: 100%;
                height: 100%;
                display: flex;
                flex-flow: column nowrap;
                justify-content: flex-end;
                align-items: stretch;
                --button-value-color: var(--wt-g3x5-lightblue);
            }
                .leftButton {
                    height: var(--chartsoptions-leftcolumn-button-height, 4em);
                    margin-top: var(--chartsoptions-leftcolumn-button-margin-vertical, 0.5em);
                }
            #sectionscontainer {
                position: relative;
                border-radius: 3px;
                background: linear-gradient(#1f3445, black 25px);
                background-color: black;
                border: 3px solid var(--wt-g3x5-bordergray);
            }
                #sections {
                    position: absolute;
                    left: var(--chartsoptions-sections-padding-left, 0.2em);
                    top: var(--chartsoptions-sections-padding-top, 0.2em);
                    width: calc(100% - var(--chartsoptions-sections-padding-left, 0.2em) - var(--chartsoptions-sections-padding-right, 0.2em));
                    height: calc(100% - var(--chartsoptions-sections-padding-top, 0.2em) - var(--chartsoptions-sections-padding-bottom, 0.2em));
                }
                    #sectionstitle {
                        position: absolute;
                        left: 50%;
                        top: calc(var(--chartsoptions-sections-title-height, 1.5em) / 2);
                        transform: translate(-50%, -50%);
                    }
                    #sectionsbuttons {
                        position: absolute;
                        left: 0%;
                        top: var(--chartsoptions-sections-title-height, 1.5em);
                        width: 100%;
                        height: calc(100% - var(--chartsoptions-sections-title-height, 1.5em));
                        display: grid;
                        grid-template-columns: 100%;
                        grid-template-rows: 1fr 1fr 1fr;
                        grid-gap: var(--chartsoptions-sections-row-gap, 0.5em) 0;
                    }
                        .sectionRow {
                            display: flex;
                            justify-content: center;
                            align-items: stretch;
                        }
                            .sectionButton {
                                width: calc((100% - var(--chartsoptions-sections-button-margin-horizontal, 0.2em)) / 2);
                                margin: 0 calc(var(--chartsoptions-sections-button-margin-horizontal, 0.2em) / 2);
                            }
    </style>
    <div id="wrapper">
        <div id="left">
            <wt-tsc-button-label id="fitwidth" class="leftButton" labeltext="Fit Width"></wt-tsc-button-label>
            <wt-tsc-button-value id="lightmode" class="leftButton" labeltext="Light Mode"></wt-tsc-button-value>
            <wt-tsc-button-value id="lightthreshold" class="leftButton" labeltext="Threshold"></wt-tsc-button-value>
        </div>
        <div id="sectionscontainer">
            <div id="sections">
                <div id="sectionstitle">Sections</div>
                <div id="sectionsbuttons">
                    <div id="sectionsrow1" class="sectionRow">
                        <wt-tsc-button-statusbar id="sectionall" class="sectionButton" labeltext="All" enabled="false"></wt-tsc-button-statusbar>
                    </div>
                    <div id="sectionsrow2" class="sectionRow">
                        <wt-tsc-button-statusbar id="sectionplan" class="sectionButton" labeltext="Plan" enabled="false"></wt-tsc-button-statusbar>
                        <wt-tsc-button-statusbar id="sectionprofile" class="sectionButton" labeltext="Profile" enabled="false"></wt-tsc-button-statusbar>
                    </div>
                    <div id="sectionsrow3" class="sectionRow">
                        <wt-tsc-button-statusbar id="sectionminimums" class="sectionButton" labeltext="Minimums" enabled="false"></wt-tsc-button-statusbar>
                        <wt-tsc-button-statusbar id="sectionheader" class="sectionButton" labeltext="Header" enabled="false"></wt-tsc-button-statusbar>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCChartsOptionsHTMLElement.NAME, WT_G3x5_TSCChartsOptionsHTMLElement);

class WT_G3x5_TSCChartsLightThreshold extends WT_G3x5_TSCPopUpElement {
    /**
     * @param {() => Number} getMFDBacklight
     */
    constructor(getMFDBacklight) {
        super();

        this._getMFDBacklight = getMFDBacklight;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCChartsLightThresholdHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createHTMLElement() {
        return new WT_G3x5_TSCChartsLightThresholdHTMLElement();
    }

    async _initFromHTMLElement() {
        await WT_Wait.awaitCallback(() => this.htmlElement.isInitialized, this);
        this._isReady = true;
        this._updateFromContext();
    }

    onInit() {
        this._htmlElement = this._createHTMLElement();
        this.popUpWindow.appendChild(this.htmlElement);
        this._initFromHTMLElement();
    }

    onEnter() {
        super.onEnter();

        this.htmlElement.setContext({setting: this.context.chartsPage.lightThresholdSetting, getMFDBacklight: this._getMFDBacklight});
    }

    onUpdate(deltaTime) {
        if (!this.context) {
            return;
        }

        this.htmlElement.update();
    }

    onExit() {
        super.onExit();

        this.htmlElement.setContext(null);
    }
}

class WT_G3x5_TSCChartsLightThresholdHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {{setting:WT_G3x5_ChartsLightThresholdSetting, getMFDBacklight:() => Number}}
         */
        this._context = null;
        this._isInit = false;

        this._settingListener = this._onSettingChanged.bind(this);
    }

    _getTemplate() {
        return WT_G3x5_TSCChartsLightThresholdHTMLElement.TEMPLATE;
    }

    async _defineChildren() {
        /**
         * @type {WT_G3x5_TSCSlider}
         */
        this._slider = await WT_CustomElementSelector.select(this.shadowRoot, `#slider`, WT_G3x5_TSCSlider);
        this._valueNumber = this.shadowRoot.querySelector(`#valuenumber`);
    }

    _initSliderLabel() {
        this._sliderLabel = new WT_G3x5_TSCSliderLabel(new WT_G3x5_TSCChartsLightThresholdSliderLabelHTMLElement());
        this._slider.addLabel(this._sliderLabel, false);
    }

    _initSliderListener() {
        this._slider.addValueListener(this._onSliderValueChanged.bind(this));
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._initSliderLabel();
        this._initSliderListener();
        this._isInit = true;
        this._updateFromContext();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _cleanUpContext() {
        if (!this._context) {
            return;
        }

        this._context.setting.removeListener(this._settingListener);
    }

    _initSettingListener() {
        this._context.setting.addListener(this._settingListener);
        this._setThreshold(this._context.setting.getValue());
    }

    _updateFromContext() {
        if (!this._context) {
            return;
        }

        this._initSettingListener();
    }

    /**
     *
     * @param {{setting:WT_G3x5_ChartsLightThresholdSetting, getMFDBacklight:() => Number}} context
     */
    setContext(context) {
        this._cleanUpContext();
        this._context = context;
        if (this._isInit) {
            this._updateFromContext();
        }
    }

    _setThreshold(value) {
        this._slider.setValue(value);
        this._valueNumber.textContent = `${(value * 100).toFixed(0)}%`;
    }

    _onSettingChanged(setting, newValue, oldValue) {
        this._setThreshold(newValue);
    }

    _onSliderValueChanged(slider, oldValue, newValue) {
        if (!this._context) {
            return;
        }

        this._context.setting.setValue(newValue);
    }

    _setBacklightLevel(value) {
        this._sliderLabel.htmlElement.setBacklightLevel(value);
        this._sliderLabel.setValue(value);
    }

    _updateMFDBacklight() {
        let level = this._context.getMFDBacklight();
        this._setBacklightLevel(level);
    }

    _doUpdate() {
        this._updateMFDBacklight();
    }

    update() {
        if (!this._isInit || !this._context) {
            return;
        }

        this._doUpdate();
    }
}
WT_G3x5_TSCChartsLightThresholdHTMLElement.NAME = "wt-tsc-chartslightthreshold";
WT_G3x5_TSCChartsLightThresholdHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCChartsLightThresholdHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            border-radius: 5px;
            background: linear-gradient(#1f3445, black 25px);
            background-color: black;
            border: 3px solid var(--wt-g3x5-bordergray);
        }

        #wrapper {
            position: absolute;
            left: var(--chartslightthreshold-padding-left, 0.2em);
            top: var(--chartslightthreshold-padding-top, 0.2em);
            width: calc(100% - var(--chartslightthreshold-padding-left, 0.2em) - var(--chartslightthreshold-padding-right, 0.2em));
            height: calc(100% - var(--chartslightthreshold-padding-top, 0.2em) - var(--chartslightthreshold-padding-bottom, 0.2em));
            display: flex;
            flex-flow: column nowrap;
            justify-content: center;
            align-items: center;
        }
            #value {
                color: white;
            }
                #valuenumber {
                    font-size: var(--chartslightthreshold-value-font-size, 1.5em);
                    color: var(--wt-g3x5-lightblue);
                }
            #slider {
                position: relative;
                height: 60%;
                width: 80%;
                --slider-label-bottom-height: 50%;
            }
                #slider img {
                    width: 100%;
                    height: 100%;
                }
    </style>
    <div id="wrapper">
        <div id="valuecontainer">
            <div id="value">
                Threshold Level: <span id="valuenumber"></span>
            </div>
        </div>
        <wt-tsc-slider id="slider" min="0" max="1" step="0.01">
            <img slot="sliderbgleft" src="/WTg3000/SDK/Assets/Images/Garmin/TSC/GRADIENT_TRIANGLE_HORIZ_BLUE.png" />
        </wt-tsc-slider>
    </div>
`;

customElements.define(WT_G3x5_TSCChartsLightThresholdHTMLElement.NAME, WT_G3x5_TSCChartsLightThresholdHTMLElement);

class WT_G3x5_TSCChartsLightThresholdSliderLabelHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._backLightLevel = 1;
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCChartsLightThresholdSliderLabelHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        this._backlightLevelText = this.shadowRoot.querySelector(`#backlightlevel`);
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
        this._setBacklightLevelText(this._backLightLevel);
    }

    _setBacklightLevelText(value) {
        this._backlightLevelText.textContent = `${(value * 100).toFixed(0)}%`;
    }

    setBacklightLevel(value) {
        if (value === this._backLightLevel) {
            return;
        }

        this._backLightLevel = value;

        if (this._isInit) {
            this._setBacklightLevelText(value);
        }
    }
}
WT_G3x5_TSCChartsLightThresholdSliderLabelHTMLElement.NAME = "wt-tsc-chartslightthreshold-sliderlabel";
WT_G3x5_TSCChartsLightThresholdSliderLabelHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCChartsLightThresholdSliderLabelHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper {
            position: relative;
            display: flex;
            flex-flow: column nowrap;
            align-items: center;
        }
            #arrowsvg {
                width: 1em;
                height: 1em;
                fill: white;
            }
            #text {
                margin-top: 0.2em;
                text-align: center;
                color: white;
            }
    </style>
    <div id="wrapper">
        <svg id="arrowsvg" viewBox="0 0 100 100">
            <path id="arrow" d="M 50 6.7 L 93.3 93.3 L 6.7 93.3 Z" />
        </svg>
        <div id="text">
            Current&nbspMFD<br>Backlight&nbspLevel<br><span id="backlightlevel"></span>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCChartsLightThresholdSliderLabelHTMLElement.NAME, WT_G3x5_TSCChartsLightThresholdSliderLabelHTMLElement);