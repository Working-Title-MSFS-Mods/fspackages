class WT_G3000_TSCPFDSettings extends WT_G3x5_TSCPFDSettings {
    _createHTMLElement() {
        let element = new WT_G3000_TSCPFDSettingsHTMLElement();
        element.setParentPage(this);
        element.init();
        return element;
    }
}

class WT_G3000_TSCPFDSettingsHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3000_TSCPFDSettingsHTMLElement.TEMPLATE.content.cloneNode(true));
    }

    _initTable() {
        this._table = new WT_G3x5_TSCPFDSettingsTable(this._parentPage);
        this._table.attachRow(new WT_G3x5_TSCPFDSettingsAoAModeRow(this._parentPage.aoaModeSetting));
        this._table.attachRow(new WT_G3000_TSCPFDSettingsSVTShowRow(this._parentPage.svtShowSetting));
        this._table.attachRow(new WT_G3000_TSCPFDSettingsWindModeRow(this._parentPage.windModeSetting));
        this._table.attachRow(new WT_G3x5_TSCPFDSettingsBaroUnitsRow(this._parentPage.baroUnitsSetting));
    }

    init() {
        this._initTable();
    }

    /**
     *
     * @param {WT_G3x5_TSCPFDSettings} parentPage
     */
    setParentPage(parentPage) {
        this._parentPage = parentPage;
    }

    _appendChildren() {
        this._table.htmlElement.slot = "table";
        this.appendChild(this._table.htmlElement);
    }

    connectedCallback() {
        this._appendChildren();
    }
}
WT_G3000_TSCPFDSettingsHTMLElement.TEMPLATE = document.createElement("template");
WT_G3000_TSCPFDSettingsHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }
    </style>
    <div id="wrapper">
        <slot name="table" id="table"></slot>
    </div>
`;

customElements.define("tsc-pfdsettings-g3000", WT_G3000_TSCPFDSettingsHTMLElement);

class WT_G3000_TSCPFDSettingsSVTShowRow extends WT_G3x5_TSCPFDSettingsTitledToggleRow {
    constructor(setting) {
        super("SVT<br>Terrain", setting, "Enable");
    }
}

class WT_G3000_TSCPFDSettingsWindModeRow extends WT_G3x5_TSCPFDSettingsTitledSelectionRow {
    constructor(setting) {
        super("Wind", setting, "Wind Data Settings", WT_G3000_TSCPFDSettingsWindModeRow.VALUE_TEXT);
    }
}
WT_G3000_TSCPFDSettingsWindModeRow.VALUE_TEXT = [
    "Off",
    "Option 1",
    "Option 2",
    "Option 3"
];