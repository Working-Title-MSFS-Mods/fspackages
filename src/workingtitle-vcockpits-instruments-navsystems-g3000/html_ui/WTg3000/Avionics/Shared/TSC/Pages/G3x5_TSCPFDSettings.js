class WT_G3x5_TSCPFDSettings extends WT_G3x5_TSCPageElement {
    constructor(homePageGroup, homePageName, settingModelID) {
        super(homePageGroup, homePageName);

        this._initSettingModel(settingModelID);
    }

    _initSettingModel(settingModelID) {
        this._settingModel = new WT_DataStoreSettingModel(settingModelID, null);
        this.settingModel.addSetting(this._svtShowSetting = new WT_G3x5_PFDSVTShowSetting(this.settingModel));
        this.settingModel.addSetting(this._aoaModeSetting = new WT_G3x5_PFDAoAModeSetting(this.settingModel));
        this.settingModel.addSetting(this._windModeSetting = new WT_G3x5_PFDWindModeSetting(this.settingModel));
        this.settingModel.addSetting(this._baroUnitsSetting = new WT_G3x5_PFDBaroUnitsSetting(this.settingModel));
        this.settingModel.addSetting(this._altimeterMetersSetting = new WT_G3x5_PFDAltimeterMetersSetting(this.settingModel));
    }

    /**
     * @readonly
     * @type {WT_DataStoreSettingModel}
     */
    get settingModel() {
        return this._settingModel;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCPFDSettingsHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     * @readonly
     * @type {WT_G3x5_PFDSVTShowSetting}
     */
    get svtShowSetting() {
        return this._svtShowSetting;
    }

    /**
     * @readonly
     * @type {WT_G3x5_PFDAoAModeSetting}
     */
    get aoaModeSetting() {
        return this._aoaModeSetting;
    }

    /**
     * @readonly
     * @type {WT_G3x5_PFDWindModeSetting}
     */
    get windModeSetting() {
        return this._windModeSetting;
    }

    /**
     * @readonly
     * @type {WT_G3x5_PFDBaroUnitsSetting}
     */
    get baroUnitsSetting() {
        return this._baroUnitsSetting;
    }

    /**
     * @readonly
     * @type {WT_G3x5_PFDAltimeterMetersSetting}
     */
    get altimeterMetersSetting() {
        return this._altimeterMetersSetting;
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

        this._htmlElement = this._createHTMLElement();

        /**
         * @type {WT_G3x5_TSCMapSettingsTabRow[]}
         */
        this._rows = [];
    }

    _createHTMLElement() {
        let htmlElement = new WT_TSCScrollList();
        htmlElement.classList.add(WT_G3x5_TSCPFDSettingsTable.CLASS);
        return htmlElement;
    }

    /**
     * @readonly
     * @type {WT_TSCScrollList}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     *
     * @param {WT_G3x5_TSCPFDSettingsRow} row
     */
    _initRow(row) {
        row.htmlElement.slot = "content";
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
        this.htmlElement.scrollManager.update();
    }
}
WT_G3x5_TSCPFDSettingsTable.CLASS = "pfdSettingsTable";

class WT_G3x5_TSCPFDSettingsRow {
    constructor() {
        this._htmlElement = new WT_G3x5_TSCPFDSettingsRowHTMLElement();
        this._htmlElement.setLeft(this._initLeft());
        this._htmlElement.setRight(this._initRight());
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCPFDSettings}
     */
    get parentPage() {
        return this._parentPage;
    }

    /**
     * @readonly
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
     * @type {HTMLElement}
     */
    get left() {
        return this._left;
    }

    /**
     * @readonly
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
    constructor(title, setting, selectionWindowTitle, valueText, selectionValues) {
        super(title);

        this._setting = setting;
        this._selectionWindowTitle = selectionWindowTitle;
        this._valueText = valueText;
        this._selectionValues = selectionValues;
    }

    _initRight() {
        let button = new WT_TSCLabeledButton();
        button.style.color = "var(--wt-g3x5-lightblue)";
        button.style.position = "absolute";
        button.style.top = "2%";
        button.style.left = "2%";
        button.style.width = "96%";
        button.style.height = "96%";
        return button;
    }

    _mapValue(value) {
        let index = this._selectionValues ? this._selectionValues.indexOf(value) : value;
        return this._valueText[index];
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
        this._manager = new WT_TSCSettingLabeledButtonManager(this.parentPage.instrument, this.htmlElement.right, this._setting, this.parentPage.instrument.selectionListWindow1, context, this._mapValue.bind(this), this._selectionValues);
        this._manager.init();
    }
}

class WT_G3x5_TSCPFDSettingsBaroUnitsRow extends WT_G3x5_TSCPFDSettingsTitledSelectionRow {
    constructor(setting) {
        super("Baro Select Units", setting, "Baro Units Settings", WT_G3x5_TSCPFDSettingsBaroUnitsRow.VALUE_TEXT);
    }
}
WT_G3x5_TSCPFDSettingsBaroUnitsRow.VALUE_TEXT = [
    "Inches (IN)",
    "Hectopascals (HPA)",
];