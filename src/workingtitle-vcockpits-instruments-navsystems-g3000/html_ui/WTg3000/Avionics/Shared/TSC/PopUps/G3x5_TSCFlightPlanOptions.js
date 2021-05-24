class WT_G3x5_TSCFlightPlanOptions extends WT_G3x5_TSCPopUpElement {
    constructor() {
        super();

        this._isReady = false;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCFlightPlanOptionsHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createPopUps() {
        this._dataFieldsPopUp = new WT_G3x5_TSCElementContainer("Flight Plan Data Fields", "FlightPlanDataFields", new WT_G3x5_TSCFlightPlanDataFields());
        this._dataFieldsPopUp.setGPS(this.instrument);
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3x5_TSCFlightPlanOptionsHTMLElement();
        htmlElement.setParentPopUp(this);
        return htmlElement;
    }

    _initButtonListeners() {
        this.htmlElement.showOnMapButton.addButtonListener(this._onShowOnMapButtonPressed.bind(this));
        this.htmlElement.dataFieldsButton.addButtonListener(this._onDataFieldsButtonPressed.bind(this));
        this.htmlElement.deleteButton.addButtonListener(this._onDeleteButtonPressed.bind(this));
    }

    async _initFromHTMLElement() {
        await WT_Wait.awaitCallback(() => this.htmlElement.isInitialized, this);
        this._initButtonListeners();
        this._isReady = true;
    }

    onInit() {
        this._createPopUps();
        this._htmlElement = this._createHTMLElement();
        this.popUpWindow.appendChild(this.htmlElement);
        this._initFromHTMLElement();
    }

    _openConfirmationTextPopUp(text, confirmCallback) {
        this.instrument.confirmationTextPopUp.element.setContext({
            homePageGroup: this.homePageGroup,
            homePageName: this.homePageName,
            text: text,
            callback: (confirmed => {
                if (confirmed) {
                    confirmCallback();
                }
            }).bind(this)
        });
        this.instrument.switchToPopUpPage(this.instrument.confirmationTextPopUp);
    }

    _toggleFlightPlanPreview() {
        let displaySetting = this.context.paneSettings.display;
        let isDisplayOn = displaySetting.mode === WT_G3x5_PaneDisplaySetting.Mode.FLIGHT_PLAN;
        let doesSourceMatch;
        switch (this.context.paneSettings.flightPlan.source) {
            case WT_G3x5_FlightPlanDisplayFlightPlanSetting.Source.ACTIVE:
                doesSourceMatch = this.context.flightPlanPage.source === WT_G3x5_TSCFlightPlan.Source.ACTIVE;
                break;
            case WT_G3x5_FlightPlanDisplayFlightPlanSetting.Source.STANDBY:
                doesSourceMatch = this.context.flightPlanPage.source === WT_G3x5_TSCFlightPlan.Source.STANDBY;
                break;
        }
        if (isDisplayOn && doesSourceMatch) {
            displaySetting.setValue(WT_G3x5_PaneDisplaySetting.Mode.NAVMAP);
        } else {
            displaySetting.setValue(WT_G3x5_PaneDisplaySetting.Mode.FLIGHT_PLAN);
            this.context.flightPlanPage.updateFlightPlanPreview();
        }
    }

    _onShowOnMapButtonPressed(button) {
        this._toggleFlightPlanPreview();
    }

    _openDataFieldsPopUp() {
        this._dataFieldsPopUp.element.setContext({
            homePageGroup: this.homePageGroup,
            homePageName: this.homePageName,
            settings: this.context.settings.dataFieldSettings
        });
        this.instrument.switchToPopUpPage(this._dataFieldsPopUp);
    }

    _onDataFieldsButtonPressed(button) {
        this._openDataFieldsPopUp();
    }

    _deleteFlightPlan() {
        if (this.context.flightPlanPage.source === WT_G3x5_TSCFlightPlan.Source.ACTIVE) {
            this.context.flightPlanManager.clearActivePlan();
        } else {
            this.context.flightPlan.clear();
        }
    }

    _onDeleteButtonPressed(button) {
        this._openConfirmationTextPopUp("Delete all waypoints in flight plan?", this._deleteFlightPlan.bind(this));
    }

    onEnter() {
        super.onEnter();

        this.htmlElement.open();
    }

    onExit() {
        super.onExit();

        this.htmlElement.close();
    }
}

class WT_G3x5_TSCFlightPlanOptionsHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._flightPlanDisplaySettingsListener = this._onFlightPlanDisplaySettingsChanged.bind(this);

        /**
         * @type {WT_G3x5_TSCFlightPlanOptions}
         */
        this._parentPopUp = null;
        this._isOpen = false;
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCFlightPlanOptionsHTMLElement.TEMPLATE;
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
     * @type {WT_TSCStatusBarButton}
     */
    get showOnMapButton() {
        return this._showOnMapButton;
    }

    /**
     * @readonly
     * @type {WT_TSCLabeledButton}
     */
    get mapSettingsButton() {
        return this._mapSettingsButton;
    }

    /**
     * @readonly
     * @type {WT_TSCLabeledButton}
     */
    get dataFieldsButton() {
        return this._dataFieldsButton;
    }

    /**
     * @readonly
     * @type {WT_TSCLabeledButton}
     */
    get deleteButton() {
        return this._deleteButton;
    }

    async _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);

        [
            this._showOnMapButton,
            this._mapSettingsButton,
            this._dataFieldsButton,
            this._deleteButton,
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#showonmap`, WT_TSCStatusBarButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#mapsettings`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#datafields`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#delete`, WT_TSCLabeledButton)
        ]);
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
        if (this._isOpen) {
            this._initFromOpen();
        }
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    setParentPopUp(parentPopUp) {
        if (!parentPopUp || this._parentPopUp) {
            return;
        }

        this._parentPopUp = parentPopUp;
    }

    _updateShowOnMapButton() {
        let displaySetting = this._parentPopUp.context.paneSettings.display;
        let isDisplayOn = displaySetting.mode === WT_G3x5_PaneDisplaySetting.Mode.FLIGHT_PLAN;
        let doesSourceMatch;
        switch (this._parentPopUp.context.paneSettings.flightPlan.source) {
            case WT_G3x5_FlightPlanDisplayFlightPlanSetting.Source.ACTIVE:
                doesSourceMatch = this._parentPopUp.context.flightPlanPage.source === WT_G3x5_TSCFlightPlan.Source.ACTIVE;
                break;
            case WT_G3x5_FlightPlanDisplayFlightPlanSetting.Source.STANDBY:
                doesSourceMatch = this._parentPopUp.context.flightPlanPage.source === WT_G3x5_TSCFlightPlan.Source.STANDBY;
                break;
        }
        this._showOnMapButton.toggle = (isDisplayOn && doesSourceMatch) ? "on" : "off";
    }

    _onFlightPlanDisplaySettingsChanged(setting, newValue, oldValue) {
        this._updateShowOnMapButton();
    }

    _initSettingListeners() {
        this._parentPopUp.context.paneSettings.display.addListener(this._flightPlanDisplaySettingsListener);
        this._parentPopUp.context.paneSettings.flightPlan.addListener(this._flightPlanDisplaySettingsListener);
    }

    _initFromOpen() {
        this._initSettingListeners();
        this._updateShowOnMapButton();
    }

    open() {
        this._isOpen = true;
        if (this._isInit) {
            this._initFromOpen();
        }
    }

    _cleanUpSettingListeners() {
        this._parentPopUp.context.paneSettings.display.removeListener(this._flightPlanDisplaySettingsListener);
        this._parentPopUp.context.paneSettings.flightPlan.removeListener(this._flightPlanDisplaySettingsListener);
    }

    _cleanUpFromClose() {
        this._cleanUpSettingListeners();
    }

    close() {
        this._isOpen = false;
        if (this._isInit) {
            this._cleanUpFromClose();
        }
    }
}
WT_G3x5_TSCFlightPlanOptionsHTMLElement.NAME = "wt-tsc-flightplanoptions";
WT_G3x5_TSCFlightPlanOptionsHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCFlightPlanOptionsHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            border-radius: 5px;
            background: linear-gradient(#1f3445, black 25px);
            border: 3px solid var(--wt-g3x5-bordergray);
        }

        #wrapper {
            position: absolute;
            left: var(--flightplanoptions-padding-left, 0.5em);
            top: var(--flightplanoptions-padding-top, 0.2em);
            width: calc(100% - var(--flightplanoptions-padding-left, 0.5em) - var(--flightplanoptions-padding-right, 0.5em));
            height: calc(100% - var(--flightplanoptions-padding-top, 0.2em) - var(--flightplanoptions-padding-bottom, 0.2em));
            display: grid;
            grid-template-rows: repeat(5, 1fr);
            grid-template-columns: repeat(3, 1fr);
            grid-gap: var(--flightplanoptions-grid-gap, 0.2em);
            color: white;
        }
            #holdppos {
                grid-area: 5 / 2;
            }
    </style>
    <div id="wrapper">
        <wt-tsc-button-statusbar id="showonmap" labeltext="Show On Map"></wt-tsc-button-statusbar>
        <wt-tsc-button-label id="mapsettings" labeltext="Map Settings" enabled="false"></wt-tsc-button-label>
        <wt-tsc-button-label id="copy" labeltext="Copy to Standby" enabled="false"></wt-tsc-button-label>
        <wt-tsc-button-label id="catalog" labeltext="Flight Plan Catalog" enabled="false"></wt-tsc-button-label>
        <wt-tsc-button-label id="store" labeltext="Store" enabled="false"></wt-tsc-button-label>
        <wt-tsc-button-label id="rename" labeltext="Rename" enabled="false"></wt-tsc-button-label>
        <wt-tsc-button-label id="delete" labeltext="Delete Flight Plan"></wt-tsc-button-label>
        <wt-tsc-button-label id="invert" labeltext="Invert" enabled="false"></wt-tsc-button-label>
        <wt-tsc-button-label id="closest" labeltext="Closest Point of Flight Plan" enabled="false"></wt-tsc-button-label>
        <wt-tsc-button-label id="tempcomp" labeltext="APPR WPT TEMP COMP" enabled="false"></wt-tsc-button-label>
        <wt-tsc-button-label id="datafields" labeltext="Edit Data Fields"></wt-tsc-button-label>
        <wt-tsc-button-label id="paralleltrack" labeltext="Parallel Track" enabled="false"></wt-tsc-button-label>
        <wt-tsc-button-label id="holdppos" labeltext="Hold at P.POS" enabled="false"></wt-tsc-button-label>
    </div>
`;

customElements.define(WT_G3x5_TSCFlightPlanOptionsHTMLElement.NAME, WT_G3x5_TSCFlightPlanOptionsHTMLElement);

class WT_G3x5_TSCFlightPlanDataFields extends WT_G3x5_TSCPopUpElement {
    /**
     * @readonly
     * @type {WT_G3x5_TSCFlightPlanDataFieldsHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createHTMLElement() {
        return new WT_G3x5_TSCFlightPlanDataFieldsHTMLElement();
    }

    _initHTMLElement() {
        this.htmlElement.setParentPopUp(this);
    }

    onInit() {
        this._htmlElement = this._createHTMLElement();
        this.popUpWindow.appendChild(this.htmlElement);
        this._initHTMLElement();
    }

    _initOnEnter() {
        if (!this.context) {
            return;
        }

        this.htmlElement.open();
    }

    onEnter() {
        super.onEnter();

        this._initOnEnter();
    }

    _cleanUpOnExit() {
        if (!this.context) {
            return;
        }

        this.htmlElement.close();
    }

    onExit() {
        super.onExit();

        this._cleanUpOnExit();
    }
}

class WT_G3x5_TSCFlightPlanDataFieldsHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {WT_G3x5_TSCFlightPlanDataFields}
         */
        this._parentPopUp = null;
        /**
         * @type {WT_TSCSettingValueButtonManager[]}
         */
        this._buttonManagers = [];
        this._isInit = false;
        this._isOpen = false;

        this._initSelectionWindowContexts();
    }

    _getTemplate() {
        return WT_G3x5_TSCFlightPlanDataFieldsHTMLElement.TEMPLATE;
    }

    _initSelectionWindowContexts() {
        this._selectionWindowContexts = [...Array(2)].map((value, index) => {
            let elementHandler = new WT_TSCStandardSelectionElementHandler(WT_G3x5_TSCFlightPlanDataFieldsHTMLElement.MODE_TEXT);

            return {
                title: `Flight Plan Data Field ${index + 1}`,
                subclass: "standardDynamicSelectionListWindow",
                closeOnSelect: true,
                elementConstructor: elementHandler,
                elementUpdater: elementHandler
            };
        });
    }

    async _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);

        this._buttons = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#field1`, WT_TSCValueButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#field2`, WT_TSCValueButton),
        ]);
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
        if (this._isOpen) {
            this._initOnOpen();
        }
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    setParentPopUp(parentPopUp) {
        if (!parentPopUp || this._parentPopUp) {
            return;
        }

        this._parentPopUp = parentPopUp;
    }

    _updateSelectionWindowContexts() {
        this._selectionWindowContexts.forEach(context => {
            context.homePageGroup = this._parentPopUp.context.homePageGroup;
            context.homePageName = this._parentPopUp.context.homePageName;
        }, this);
    }

    _initButtonManagers() {
        this._buttonManagers = this._buttons.map((button, index) => {
            let manager = new WT_TSCSettingValueButtonManager(this._parentPopUp.instrument, button, this._parentPopUp.context.settings.get(index), this._parentPopUp.instrument.selectionListWindow1, this._selectionWindowContexts[index], value => WT_G3x5_TSCFlightPlanDataFieldsHTMLElement.MODE_TEXT[value]);
            manager.init();
            return manager;
        }, this);
    }

    _initOnOpen() {
        this._updateSelectionWindowContexts();
        this._initButtonManagers();
    }

    open() {
        this._isOpen = true;
        if (this._isInit) {
            this._initOnOpen();
        }
    }

    _cleanUpButtonManagers() {
        this._buttonManagers.forEach(manager => manager.destroy());
        this._buttonManagers = [];
    }

    _cleanUpOnClose() {
        this._cleanUpButtonManagers();
    }

    close() {
        this._isOpen = false;
        if (this._isInit) {
            this._cleanUpOnClose();
        }
    }
}
WT_G3x5_TSCFlightPlanDataFieldsHTMLElement.MODE_TEXT = [
    `<span style="font-size: var(--flightplandatafields-shortname-font-size, 1.25em);">CUM</span><br>(Cumulative Distance)`,
    `<span style="font-size: var(--flightplandatafields-shortname-font-size, 1.25em);">DIS</span><br>(Distance)`,
    `<span style="font-size: var(--flightplandatafields-shortname-font-size, 1.25em);">DTK</span><br>(Desired Track)`,
    `<span style="font-size: var(--flightplandatafields-shortname-font-size, 1.25em);">ETA</span><br>(Estimated Time of Arrival)`,
    `<span style="font-size: var(--flightplandatafields-shortname-font-size, 1.25em);">ETE</span><br>(Estimated Time Enroute)`,
    `<span style="font-size: var(--flightplandatafields-shortname-font-size, 1.25em);">FUEL</span><br>(Fuel to Destination)`
];
WT_G3x5_TSCFlightPlanDataFieldsHTMLElement.NAME = "wt-tsc-flightplandatafields";
WT_G3x5_TSCFlightPlanDataFieldsHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCFlightPlanDataFieldsHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            border-radius: 5px;
            background: linear-gradient(#1f3445, black 25px);
            border: 3px solid var(--wt-g3x5-bordergray);
        }

        #wrapper {
            position: absolute;
            left: var(--flightplandatafields-padding-left, 0.5em);
            top: var(--flightplandatafields-padding-top, 0.5em);
            width: calc(100% - var(--flightplandatafields-padding-left, 0.5em) - var(--flightplandatafields-padding-right, 0.5em));
            height: calc(100% - var(--flightplandatafields-padding-top, 0.5em) - var(--flightplandatafields-padding-bottom, 0.5em));
            display: grid;
            grid-template-rows: 1fr 1fr;
            grid-template-columns: 100%;
            grid-gap: var(--flightplandatafields-grid-row-gap, 0.5em) 0;
            color: white;
        }
            wt-tsc-button-value {
                --button-value-label-height: 30%;
                --button-value-value-top: 40%;
                --button-value-value-height: 55%;
            }
    </style>
    <div id="wrapper">
        <wt-tsc-button-value id="field1" labeltext="Data Field 1"></wt-tsc-button-value>
        <wt-tsc-button-value id="field2" labeltext="Data Field 2"></wt-tsc-button-value>
    </div>
`;

customElements.define(WT_G3x5_TSCFlightPlanDataFieldsHTMLElement.NAME, WT_G3x5_TSCFlightPlanDataFieldsHTMLElement);