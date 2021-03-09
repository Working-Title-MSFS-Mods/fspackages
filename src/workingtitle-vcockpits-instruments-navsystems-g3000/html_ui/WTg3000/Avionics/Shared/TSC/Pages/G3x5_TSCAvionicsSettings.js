class WT_G3x5_TSCAvionicsSettings extends WT_G3x5_TSCPageElement {
    constructor(homePageGroup, homePageName, mfdInstrumentID) {
        super(homePageGroup, homePageName);

        this._mfdInstrumentID = mfdInstrumentID;
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCAvionicsSettingsHTMLElement} htmlElement
     * @type {WT_G3x5_TSCAvionicsSettingsHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     * @readonly
     * @property {String} mfdInstrumentID
     * @type {String}
     */
    get mfdInstrumentID() {
        return this._mfdInstrumentID;
    }

    _initHTMLElement() {
        this._htmlElement = new WT_G3x5_TSCAvionicsSettingsHTMLElement();
        this._htmlElement.setParentPage(this);
    }

    init(root) {
        this._initHTMLElement();
        root.appendChild(this.htmlElement);
    }

    onUpdate(deltaTime) {
        this.htmlElement.update();
    }
}

class WT_G3x5_TSCAvionicsSettingsHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCAvionicsSettingsHTMLElement.TEMPLATE.content.cloneNode(true));
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCAvionicsSettings} parentPage
     * @type {WT_G3x5_TSCAvionicsSettings}
     */
    get parentPage() {
        return this._parentPage;
    }

    _initTabs() {
        this._tabbedContent.addTab(new WT_G3x5_TSCAvionicsSettingsSystemTab(), WT_G3x5_TSCTabbedView.TabButtonPosition.LEFT, false);
        this._tabbedContent.addTab(new WT_G3x5_TSCAvionicsSettingsUnitsTab(), WT_G3x5_TSCTabbedView.TabButtonPosition.LEFT, false);
        this._tabbedContent.addTab(new WT_G3x5_TSCAvionicsSettingsAlertsTab(), WT_G3x5_TSCTabbedView.TabButtonPosition.LEFT, false);
        this._tabbedContent.addTab(new WT_G3x5_TSCAvionicsSettingsMFDFieldsTab(this.parentPage, this.parentPage.mfdInstrumentID));
        this._tabbedContent.addTab(new WT_G3x5_TSCAvionicsSettingsAudioTab(), WT_G3x5_TSCTabbedView.TabButtonPosition.LEFT, false);

        this._tabbedContent.setActiveTabIndex(3);
    }

    _initTabbedContent() {
        this._tabbedContent = new WT_G3x5_TSCTabbedView();
        this._initTabs();

        this._tabbedContent.slot = "content";
        this.appendChild(this._tabbedContent);
    }

    connectedCallback() {
        this._initTabbedContent();
    }

    setParentPage(parentPage) {
        this._parentPage = parentPage;
    }

    _updateActiveTab() {
        let activeTab = this._tabbedContent.getActiveTab();
        if (activeTab) {
            activeTab.update();
        }
    }

    update() {
        this._updateActiveTab();
    }
}
WT_G3x5_TSCAvionicsSettingsHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCAvionicsSettingsHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #content {
            display: block;
            width: 100%;
            height: 100%;
        }
    </style>
    <slot name="content" id="content"></slot>
`;

customElements.define("tsc-avionicssettings", WT_G3x5_TSCAvionicsSettingsHTMLElement);

class WT_G3x5_TSCAvionicsSettingsTab extends WT_G3x5_TSCTabContent {
    constructor(title, parentPage) {
        super(title);

        this._parentPage = parentPage;
        this._htmlElement = this._createHTMLElement();
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCAvionicsSettings} parentPage
     * @type {WT_G3x5_TSCAvionicsSettings}
     */
    get parentPage() {
        return this._parentPage;
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

class WT_G3x5_TSCAvionicsSettingsSystemTab extends WT_G3x5_TSCAvionicsSettingsTab {
    constructor() {
        super(WT_G3x5_TSCAvionicsSettingsSystemTab.TITLE);
    }

    _createHTMLElement() {
        return document.createElement("div");
    }

    update() {
    }
}
WT_G3x5_TSCAvionicsSettingsSystemTab.TITLE = "System";

class WT_G3x5_TSCAvionicsSettingsUnitsTab extends WT_G3x5_TSCAvionicsSettingsTab {
    constructor() {
        super(WT_G3x5_TSCAvionicsSettingsUnitsTab.TITLE);
    }

    _createHTMLElement() {
        return document.createElement("div");
    }
}
WT_G3x5_TSCAvionicsSettingsUnitsTab.TITLE = "Units";

class WT_G3x5_TSCAvionicsSettingsAlertsTab extends WT_G3x5_TSCAvionicsSettingsTab {
    constructor() {
        super(WT_G3x5_TSCAvionicsSettingsAlertsTab.TITLE);
    }

    _createHTMLElement() {
        return document.createElement("div");
    }
}
WT_G3x5_TSCAvionicsSettingsAlertsTab.TITLE = "Alerts";

class WT_G3x5_TSCAvionicsSettingsMFDFieldsTab extends WT_G3x5_TSCAvionicsSettingsTab {
    constructor(parentPage, instrumentID) {
        super(WT_G3x5_TSCAvionicsSettingsMFDFieldsTab.TITLE, parentPage);

        this._instrumentID = instrumentID;
    }

    _createHTMLElement() {
        return new WT_TSCScrollList();
    }

    _initModel() {
        this._model = new WT_NavDataBar(null);
        this._model.setDataFieldCount(WT_G3x5_MFDNavDataBar.DATA_FIELD_COUNT);
    }

    _initController() {
        this._controller = new WT_NavDataBarController(this._instrumentID, this._model);
        for (let i = 0; i < WT_G3x5_MFDNavDataBar.DATA_FIELD_COUNT; i++) {
            this._controller.addDataFieldSetting(WT_G3x5_MFDNavDataBar.DEFAULT_DATA_FIELD_INFO_IDS[i]);
        }

        this._controller.update();
    }

    _initRows() {
        for (let i = 0; i < this._model.dataFieldCount; i++) {
            let row = new WT_G3x5_TSCNavDataFieldRow();
            row.setContext({
                instrument: this.parentPage.instrument,
                index: i,
                model: this._model,
                controller: this._controller,
                homePageGroup: this.parentPage.homePageGroup,
                homePageName: this.parentPage.homePageName
            });
            row.slot = "content";
            this.htmlElement.appendChild(row);
        }
    }

    onAttached() {
        super.onAttached();

        this._initModel();
        this._initController();
        this._initRows();
    }
}
WT_G3x5_TSCAvionicsSettingsMFDFieldsTab.TITLE = "MFD<br>Fields";

class WT_G3x5_TSCNavDataFieldRow extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCNavDataFieldRow.TEMPLATE.content.cloneNode(true));

        this._context = null;

        this._settingListener = this._onDataFieldSettingChanged.bind(this);

        this._isInit = false;
        this._lastContext = null;
    }

    _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);
        this._title = this.shadowRoot.querySelector(`#title`);
    }

    _createButton() {
        this._button = new WT_G3x5_TSCNavDataFieldButton();
        this._button.id = "button";
        this._button.addButtonListener(this._onButtonPressed.bind(this));
        this._wrapper.appendChild(this._button);
    }

    connectedCallback() {
        this._defineChildren();
        this._createButton();
        this._isInit = true;

        if (this._context) {
            this._setupContext();
        }
    }

    _onButtonPressed(button) {
        if (this._context) {
            this._context.instrument.selectionListWindow1.element.setContext(this._selectionWindowContext);
            this._context.instrument.switchToPopUpPage(this._context.instrument.selectionListWindow1);
        }
    }

    _updateTitle() {
        this._title.innerHTML = this._context ? `MFD<br>Data Bar<br>Field ${this._context.index + 1}` : "";
    }

    _updateButton() {
        let navDataInfo = this._context ? this._context.model.getDataFieldInfo(this._context.index) : null;
        this._button.setNavDataInfo(navDataInfo);
    }

    _onDataFieldSettingChanged(setting, newValue, oldValue) {
        this._updateButton();
    }

    _initSelectionWindowContext() {
        if (!this._context) {
            this._selectionWindowContext = null;
            this._navDataInfos = null;
            return;
        }

        let elementHandler = new WT_G3x5_TSCNavDataFieldSelectionElementHandler(this._context.model, this._context.index);
        this._selectionWindowContext = {
            title: "Select MFD Data Bar Field",
            subclass: "navDataBarDynamicSelectionListWindow",
            closeOnSelect: true,
            callback: this._onSelectionMade.bind(this),
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            currentIndexGetter: elementHandler,
            homePageGroup: this._context.homePageGroup,
            homePageName: this._context.homePageName
        };

        this._navDataInfos = this._context.model.getAllNavDataInfo();
    }

    _initListener() {
        if (!this._context) {
            return;
        }

        this._context.controller.getDataFieldSetting(this._context.index).addListener(this._settingListener);
    }

    _setupContext() {
        if (this._lastContext) {
            this._lastContext.controller.getDataFieldSetting(this._lastContext.index).removeListener(this._settingListener);
        }

        this._initSelectionWindowContext();
        this._initListener();
        this._updateTitle();
        this._updateButton();
    }

    setContext(context) {
        if (context === this._context) {
            return;
        }

        this._context = context;
        if (this._isInit) {
            this._setupContext();
        }
    }

    _onSelectionMade(value) {
        this._context.controller.getDataFieldSetting(this._context.index).setValue(this._navDataInfos[value].id);
    }
}
WT_G3x5_TSCNavDataFieldRow.TEMPLATE = document.createElement("template");
WT_G3x5_TSCNavDataFieldRow.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            width: 100%;
            background-color: black;
            border: solid 1px white;
            border-radius: 5px;
        }

        #wrapper {
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: auto;
            grid-template-columns: var(--mfdnavdatafieldrow-left-width, 30%) var(--mfdnavdatafieldrow-right-width, 70%);
        }
            #title {
                text-align: center;
                align-self: center;
            }
            #button {
                position: relative;
                margin: 0.5vh;
                color: #67e8ef;
            }
    </style>
    <div id="wrapper">
        <div id="title"></div>
    </div>
`;

customElements.define("tsc-avionicssettings-mfdnavdatafieldrow", WT_G3x5_TSCNavDataFieldRow);

class WT_G3x5_TSCNavDataFieldButton extends WT_TSCButton {
    _initLabelStyle() {
        return `
            #label {
                width: 100%;
                height: 100%;
                display: flex;
                flex-flow: column nowrap;
                justify-content: center;
                align-items: center;
            }
        `;
    }

    _initShortNameStyle() {
        return `
            #shortname {
                font-size: 1.5em;
            }
        `;
    }

    _createStyle() {
        let style = super._createStyle();
        let labelStyle = this._initLabelStyle();
        let shortNameStyle = this._initShortNameStyle();

        return `
            ${style}
            ${labelStyle}
            ${shortNameStyle}
        `;
    }

    _appendChildren() {
        let label = document.createElement("div");
        label.id = "label";

        this._shortName = document.createElement("div");
        this._shortName.id = "shortname";
        label.appendChild(this._shortName);

        this._longName = document.createElement("div");
        this._longName.id = "longname";
        label.appendChild(this._longName);

        this._wrapper.appendChild(label);
    }

    setNavDataInfo(navDataInfo) {
        if (navDataInfo) {
            this._shortName.innerHTML = navDataInfo.shortName;
            this._longName.innerHTML = navDataInfo.longName;
        } else {
            this._shortName.innerHTML = "";
            this._longName.innerHTML = "";
        }
    }
}

customElements.define("tsc-button-navdatafield", WT_G3x5_TSCNavDataFieldButton);

class WT_G3x5_TSCNavDataFieldSelectionElementHandler {
    /**
     *
     * @param {WT_NavDataBar} model
     * @param {Number} fieldIndex
     */
    constructor(model, fieldIndex) {
        this._model = model;
        this._infos = model.getAllNavDataInfo();
        this._fieldIndex = fieldIndex;
    }

    nextElement(index) {
        if (index >= this._infos.length) {
            return null;
        }

        let elem = {
            button: document.createElement("div"),
            mainText: document.createElement("div"),
            shortNameText: document.createElement("span"),
            longNameText: document.createElement("span")
        };
        elem.button.setAttribute("class", "gradientButton");
        elem.mainText.setAttribute("class", "mainText");
        elem.shortNameText.setAttribute("class", "shortName");
        elem.longNameText.setAttribute("class", "longName");
        Avionics.Utils.diffAndSet(elem.shortNameText, this._infos[index].shortName);
        Avionics.Utils.diffAndSet(elem.longNameText, this._infos[index].longName);
        elem.mainText.appendChild(elem.shortNameText);
        elem.mainText.appendChild(document.createElement("br"));
        elem.mainText.appendChild(elem.longNameText);
        elem.button.appendChild(elem.mainText);
        return elem;
    }

    update(index, elem) {
    }

    getCurrentIndex() {
        return this._infos.indexOf(this._model.getDataFieldInfo(this._fieldIndex));
    }
}

class WT_G3x5_TSCAvionicsSettingsAudioTab extends WT_G3x5_TSCAvionicsSettingsTab {
    constructor() {
        super(WT_G3x5_TSCAvionicsSettingsAudioTab.TITLE);
    }

    _createHTMLElement() {
        return document.createElement("div");
    }
}
WT_G3x5_TSCAvionicsSettingsAudioTab.TITLE = "Audio";