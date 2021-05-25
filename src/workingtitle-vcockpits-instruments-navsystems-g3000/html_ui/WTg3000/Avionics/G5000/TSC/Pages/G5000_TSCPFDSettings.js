class WT_G5000_TSCPFDSettings extends WT_G3x5_TSCPFDSettings {
    _createHTMLElement() {
        let element = new WT_G5000_TSCPFDSettingsHTMLElement();
        element.setParentPage(this);
        element.init();
        return element;
    }

    _activateNavButtons() {
        super._activateNavButtons();

        this.instrument.activateNavButton(5, "Up", this._onUpPressed.bind(this), false, "ICON_TSC_BUTTONBAR_UP.png");
        this.instrument.activateNavButton(6, "Down", this._onDownPressed.bind(this), false, "ICON_TSC_BUTTONBAR_DOWN.png");
    }

    _deactivateNavButtons() {
        super._deactivateNavButtons();

        this.instrument.deactivateNavButton(5, false);
        this.instrument.deactivateNavButton(6, false);
    }

    _onUpPressed() {
        this.htmlElement.scrollUp();
    }

    _onDownPressed() {
        this.htmlElement.scrollDown();
    }

    onUpdate(deltaTime) {
        this.htmlElement.update();
    }
}

class WT_G5000_TSCPFDSettingsHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G5000_TSCPFDSettingsHTMLElement.TEMPLATE.content.cloneNode(true));
    }

    _initTable() {
        this._table = new WT_G3x5_TSCPFDSettingsTable(this._parentPage);
        this._table.attachRow(new WT_G5000_TSCPFDSettingsAoAModeRow(this._parentPage.aoaModeSetting));
        this._table.attachRow(new WT_G5000_TSCPFDSettingsSVTShowRow(this._parentPage.svtShowSetting));
        this._table.attachRow(new WT_G5000_TSCPFDSettingsWindModeRow(this._parentPage.windModeSetting));
        this._table.attachRow(new WT_G3x5_TSCPFDSettingsBaroUnitsRow(this._parentPage.baroUnitsSetting));
        this._table.attachRow(new WT_G5000_TSCPFDSettingsAltimeterMetersRow(this._parentPage.altimeterMetersSetting));
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

    scrollUp() {
        this._table.htmlElement.scrollManager.scrollUp();
    }

    scrollDown() {
        this._table.htmlElement.scrollManager.scrollDown();
    }

    update() {
        this._table.update();
    }
}
WT_G5000_TSCPFDSettingsHTMLElement.TEMPLATE = document.createElement("template");
WT_G5000_TSCPFDSettingsHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }
    </style>
    <div id="wrapper">
        <slot name="table" id="table"></slot>
    </div>
`;

customElements.define("tsc-pfdsettings-g5000", WT_G5000_TSCPFDSettingsHTMLElement);

class WT_G5000_TSCPFDSettingsAoAModeRow extends WT_G3x5_TSCPFDSettingsTitledSelectionRow {
    constructor(setting) {
        super("AOA", setting, "AOA Settings", WT_G5000_TSCPFDSettingsAoAModeRow.VALUE_TEXT);
    }
}
WT_G5000_TSCPFDSettingsAoAModeRow.VALUE_TEXT = [
    "Off",
    "On",
    "Auto"
];

class WT_G5000_TSCPFDSettingsSVTShowRow extends WT_G3x5_TSCPFDSettingsTitledToggleRow {
    constructor(setting) {
        super("SVT<br>Terrain", setting, "Enable");
    }
}

class WT_G5000_TSCPFDSettingsWindModeRow extends WT_G3x5_TSCPFDSettingsTitledSelectionRow {
    constructor(setting) {
        super("Wind", setting, "Wind Data Settings", WT_G5000_TSCPFDSettingsWindModeRow.VALUE_TEXT);
    }
}
WT_G5000_TSCPFDSettingsWindModeRow.VALUE_TEXT = [
    "Off",
    "Option 1",
    "Option 2",
    "Option 3"
];

class WT_G5000_TSCPFDSettingsAltimeterMetersRow extends WT_G3x5_TSCPFDSettingsTitledToggleRow {
    constructor(setting) {
        super("Meters Overlay", setting, "Enable");
    }
}