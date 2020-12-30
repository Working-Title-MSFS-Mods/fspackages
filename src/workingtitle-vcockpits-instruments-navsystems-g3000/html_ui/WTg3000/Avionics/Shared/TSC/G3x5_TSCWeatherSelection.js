class WT_G3x5_TSCWeatherSelection extends WT_G3x5_TSCPageElement {
    constructor(homePageGroup, homePageName, wxRadarSettingsPageName) {
        super(homePageGroup, homePageName);

        this._wxRadarSettingsPageName = wxRadarSettingsPageName;
    }

    /**
     * @readonly
     * @property {HTMLElement} htmlElement
     * @type {HTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _initWXRadarButton() {
        this._wxRadarButton = new WT_TSCImageButton();
        this._wxRadarButton.slot = "buttons";
        this._wxRadarButton.labelText = "WX RADAR<br>Settings";
        this._wxRadarButton.imgSrc = WT_G3x5_TSCWeatherSelection.WX_RADAR_IMAGE_PATH;
        this._wxRadarButton.addButtonListener(this._onWXRadarButtonPressed.bind(this));
        this.htmlElement.appendChild(this._wxRadarButton);
    }

    init(root) {
        this.container.title = "Weather Selection";

        this._htmlElement = root.querySelector(`tsc-weatherselection`);

        this._initWXRadarButton();
    }

    _onWXRadarButtonPressed(button) {
        this.gps.SwitchToPageName(this.homePageGroup, this._wxRadarSettingsPageName);
    }
}
WT_G3x5_TSCWeatherSelection.WX_RADAR_IMAGE_PATH = "/WTg3000/SDK/Assets/Images/TSC/ICON_TSC_WX_RADAR_SETTINGS.png";

class WT_G3x5_TSCWeatherSelectionHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCWeatherSelectionHTMLElement.TEMPLATE.content.cloneNode(true));
    }
}
WT_G3x5_TSCWeatherSelectionHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCWeatherSelectionHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            width: 100%;
            height: 100%;
        }

        #buttons {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            flex-flow: row wrap;
            justify-content: center;
            align-items: center;
        }
    </style>
    <slot name="buttons" id="buttons"></slot>
`;

customElements.define("tsc-weatherselection", WT_G3x5_TSCWeatherSelectionHTMLElement);