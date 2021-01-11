class WT_G3x5_TSCPFDSettings extends WT_G3x5_TSCPageElement {
    constructor(homePageGroup, homePageName, controllerID) {
        super(homePageGroup, homePageName);

        this._initController(controllerID);
    }

    _initController(controllerID) {
        this._controller = new WT_DataStoreController(controllerID, null);
        this.controller.addSetting(this._svtShowSetting = new WT_G3x5_PFDSVTShowSetting(this.controller));
        this.controller.addSetting(this._aoaModeSetting = new WT_G3x5_PFDAoAModeSetting(this.controller));
        this.controller.addSetting(this._windModeSetting = new WT_G3x5_PFDWindModeSetting(this.controller));
        this.controller.addSetting(this._baroUnitsSetting = new WT_G3x5_PFDBaroUnitsSetting(this.controller));
    }

    /**
     * @readonly
     * @property {WT_DataStoreController} controller
     * @type {WT_DataStoreController}
     */
    get controller() {
        return this._controller;
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCPFDSettingsHTMLElement} htmlElement
     * @type {WT_G3x5_TSCPFDSettingsHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     * @readonly
     * @property {WT_G3x5_PFDSVTShowSetting} svtShowSetting
     * @type {WT_G3x5_PFDSVTShowSetting}
     */
    get svtShowSetting() {
        return this._svtShowSetting;
    }

    /**
     * @readonly
     * @property {WT_G3x5_PFDAoAModeSetting} aoaModeSetting
     * @type {WT_G3x5_PFDAoAModeSetting}
     */
    get aoaModeSetting() {
        return this._aoaModeSetting;
    }

    /**
     * @readonly
     * @property {WT_G3x5_PFDWindModeSetting} windModeSetting
     * @type {WT_G3x5_PFDWindModeSetting}
     */
    get windModeSetting() {
        return this._windModeSetting;
    }

    /**
     * @readonly
     * @property {WT_G3x5_PFDBaroUnitsSetting} baroUnitsSetting
     * @type {WT_G3x5_PFDBaroUnitsSetting}
     */
    get baroUnitsSetting() {
        return this._baroUnitsSetting;
    }

    _createHTMLElement() {
        return null;
    }

    init(root) {
        this._htmlElement = this._createHTMLElement();
        root.appendChild(this.htmlElement);
    }
}

class WT_G3x5_TSCPFDSettingsTable {
    constructor(parentPage) {
        this._parentPage = parentPage;

        this._htmlElement = new WT_G3x5_TSCPFDSettingsTableHTMLElement();

        /**
         * @type {WT_G3x5_TSCMapSettingsTabRow[]}
         */
        this._rows = [];
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCPFDSettingsTableHTMLElement} htmlElement
     * @type {WT_G3x5_TSCPFDSettingsTableHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     *
     * @param {WT_G3x5_TSCPFDSettingsRow} row
     */
    _initRow(row) {
        row.htmlElement.slot = "rows";
        this.htmlElement.appendChild(row.htmlElement);
        row.setParentPage(this._parentPage);
        row.onAttached();
    }

    /**
     *
     * @param {WT_G3x5_TSCPFDSettingsRow} row
     */
    attachRow(row) {
        this._rows.push(row);
        this._initRow(row);
    }

    update() {
        for (let row of this._rows) {
            row.onUpdate();
        }
    }
}

class WT_G3x5_TSCPFDSettingsTableHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCPFDSettingsTableHTMLElement.TEMPLATE.content.cloneNode(true));
    }
}
WT_G3x5_TSCPFDSettingsTableHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCPFDSettingsTableHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper  {
            position: relative;
            width: 100%;
            top: 2%;
            height: 96%;
            overflow-x: hidden;
            overflow-y: scroll;
        }
            #wrapper::-webkit-scrollbar {
                width: 1vw;
            }
            #wrapper::-webkit-scrollbar-track {
                background: none;
            }
            #wrapper::-webkit-scrollbar-thumb {
                background: white;
            }

            #rows {
                position: relative;
                left: 2%;
                width: 96%;
                display: flex;
                flex-flow: column nowrap;
                align-items: center;
            }
    </style>
    <div id="wrapper">
        <slot name="rows" id="rows"></slot>
    </div>
`;

customElements.define("tsc-pfdsettings-table", WT_G3x5_TSCPFDSettingsTableHTMLElement);

class WT_G3x5_TSCPFDSettingsRow {
    constructor() {
        this._htmlElement = new WT_G3x5_TSCPFDSettingsRowHTMLElement();
        this._htmlElement.setLeft(this._initLeft());
        this._htmlElement.setRight(this._initRight());
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCPFDSettings} parentPage
     * @type {WT_G3x5_TSCPFDSettings}
     */
    get parentPage() {
        return this._parentPage;
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCPFDSettingsRowHTMLElement} htmlElement
     * @type {WT_G3x5_TSCPFDSettingsRowHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _initLeft() {
        return document.createElement("div");
    }

    _initRight() {
        return document.createElement("div");
    }

    setParentPage(parentPage) {
        this._parentPage = parentPage;
    }

    onAttached() {
    }

    onUpdate() {
    }
}

class WT_G3x5_TSCPFDSettingsRowHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCPFDSettingsRowHTMLElement.TEMPLATE.content.cloneNode(true));

        this._left = null;
        this._right = null;
    }

    /**
     * @readonly
     * @property {HTMLElement} left
     * @type {HTMLElement}
     */
    get left() {
        return this._left;
    }

    /**
     * @readonly
     * @property {HTMLElement} right
     * @type {HTMLElement}
     */
    get right() {
        return this._right;
    }

    setLeft(element) {
        if (this.left && this.left.parentNode === this) {
            this.left.classList.remove(WT_G3x5_TSCPFDSettingsRowHTMLElement.LEFT_CLASS);
            this.removeChild(this.left);
        }
        this.appendChild(element);
        element.slot = "left";
        element.classList.add(WT_G3x5_TSCPFDSettingsRowHTMLElement.LEFT_CLASS);
        this._left = element;
    }

    setRight(element) {
        if (this.right && this.right.parentNode === this) {
            this.right.classList.remove(WT_G3x5_TSCPFDSettingsRowHTMLElement.RIGHT_CLASS);
            this._wrapper.removeChild(this.right);
        }
        this.appendChild(element);
        element.slot = "right";
        element.classList.add(WT_G3x5_TSCPFDSettingsRowHTMLElement.RIGHT_CLASS);
        this._right = element;
    }
}
WT_G3x5_TSCPFDSettingsRowHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCPFDSettingsRowHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            position: relative;
            display: block;
            width: 100%;
            margin: 0.25vh 0;
            background-color: black;
            border: solid 1px white;
            border-radius: 3px;
        }

        #wrapper {
            position: relative;
            height: 100%;
            width: 100%;
            display: grid;
            grid-template-rows: auto;
            grid-template-columns: var(--pfdsettings-row-left-width, 50%) var(--pfdsettings-row-right-width, 50%);
        }
            slot {
                display: block;
                position: relative;
                width: 100%;
                height: 100%;
            }
    </style>
    <div id="wrapper">
        <slot name="left"></slot>
        <slot name="right"></slot>
    </div>
`;
WT_G3x5_TSCPFDSettingsRowHTMLElement.LEFT_CLASS = "pfdSettingsRowLeft";
WT_G3x5_TSCPFDSettingsRowHTMLElement.RIGHT_CLASS = "pfdSettingsRowRight";

customElements.define("tsc-pfdsettings-row", WT_G3x5_TSCPFDSettingsRowHTMLElement);

class WT_G3x5_TSCPFDSettingsTitledRow extends WT_G3x5_TSCPFDSettingsRow {
    constructor(title) {
        super();

        this.htmlElement.left.innerHTML = title;
        this.htmlElement.left.style.position = "absolute";
        this.htmlElement.left.style.top = "50%";
        this.htmlElement.left.style.left = "50%";
        this.htmlElement.left.style.transform = "translate(-50%, -50%)";
        this.htmlElement.left.style.textAlign = "center";
    }
}

class WT_G3x5_TSCPFDSettingsTitledToggleRow extends WT_G3x5_TSCPFDSettingsTitledRow {
    constructor(title, setting, buttonLabel) {
        super(title);

        this.htmlElement.right.labelText = buttonLabel;

        this._manager = new WT_TSCSettingStatusBarButtonManager(this.htmlElement.right, setting);
    }

    _initRight() {
        let button = new WT_TSCStatusBarButton();
        button.style.position = "absolute";
        button.style.top = "2%";
        button.style.left = "2%";
        button.style.width = "96%";
        button.style.height = "96%";
        return button;
    }

    onAttached() {
        this._manager.init();
    }
}

class WT_G3x5_TSCPFDSettingsTitledSelectionRow extends WT_G3x5_TSCPFDSettingsTitledRow {
    constructor(title, setting, selectionWindowTitle, valueText) {
        super(title);

        this._setting = setting;
        this._selectionWindowTitle = selectionWindowTitle;
        this._valueText = valueText;
    }

    _initRight() {
        let button = new WT_TSCLabeledButton();
        button.style.color = "#67e8ef";
        button.style.position = "absolute";
        button.style.top = "2%";
        button.style.left = "2%";
        button.style.width = "96%";
        button.style.height = "96%";
        return button;
    }

    _mapValue(value) {
        return this._valueText[value];
    }

    onAttached() {
        let elementHandler = new WT_TSCStandardSelectionElementHandler(this._valueText);
        let context = {
            title: this._selectionWindowTitle,
            subclass: "standardDynamicSelectionListWindow",
            closeOnSelect: true,
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            homePageGroup: this.parentPage.homePageGroup,
            homePageName: this.parentPage.homePageName
        };
        this._manager = new WT_TSCSettingLabeledButtonManager(this.parentPage.instrument, this.htmlElement.right, this._setting, this.parentPage.instrument.selectionListWindow1, context, this._mapValue.bind(this));
        this._manager.init();
    }
}

class WT_G3x5_TSCPFDSettingsAoAModeRow extends WT_G3x5_TSCPFDSettingsTitledSelectionRow {
    constructor(setting) {
        super("AOA", setting, "AOA Settings", WT_G3x5_TSCPFDSettingsAoAModeRow.VALUE_TEXT);
    }
}
WT_G3x5_TSCPFDSettingsAoAModeRow.VALUE_TEXT = [
    "Off",
    "On",
    "Auto"
];

class WT_G3x5_TSCPFDSettingsBaroUnitsRow extends WT_G3x5_TSCPFDSettingsTitledSelectionRow {
    constructor(setting) {
        super("Baro Select Units", setting, "Baro Units Settings", WT_G3x5_TSCPFDSettingsBaroUnitsRow.VALUE_TEXT);
    }
}
WT_G3x5_TSCPFDSettingsBaroUnitsRow.VALUE_TEXT = [
    "Inches (IN)",
    "Hectopascals (HPA)",
];