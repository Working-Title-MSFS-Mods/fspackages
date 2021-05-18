class WT_G3000_PFDWindData extends WT_G3x5_PFDElement {
    constructor() {
        super();

        this._initSettingModel();
    }

    _initSettingModel() {
        this._settingModel = new WT_DataStoreSettingModel("PFD");
        this._settingModel.addSetting(this._windModeSetting = new WT_G3x5_PFDWindModeSetting(this._settingModel));
        this._settingModel.init();
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
     * @property {WT_G3x5_PFDWindDataHTMLElement} htmlElement
     * @type {WT_G3x5_PFDWindDataHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createModel() {
        return new WT_G3x5_PFDWindDataModel(this.instrument.airplane, this.windModeSetting, this.instrument.unitsSettingModel);
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3000_PFDWindDataBoxHTMLElement();
        htmlElement.setContext({
            model: this._model
        });
        return htmlElement;
    }

    _initModeListener() {
        this.windModeSetting.addListener(this._onWindModeSettingChanged.bind(this));
        this._setWindMode(this.windModeSetting.getValue());
    }

    init(root) {
        this._model = this._createModel();

        let container = root.querySelector(`#InstrumentsContainer`);
        this._htmlElement = this._createHTMLElement();
        container.appendChild(this.htmlElement);

        this._initModeListener();
    }

    _setWindMode(value) {
        this.htmlElement.setVisible(value !== WT_G3x5_PFDWindModeSetting.Mode.OFF);
    }

    _onWindModeSettingChanged(setting, newValue, oldValue) {
        this._setWindMode(newValue);
    }

    onUpdate(deltaTime) {
        this._model.update();
        this.htmlElement.update();
    }
}

class WT_G3000_PFDWindDataBoxHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._context = null;
        this._isInit = false;

        this._isVisible = false;
    }

    _getTemplate() {
        return WT_G3000_PFDWindDataBoxHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        let windData = this.shadowRoot.querySelector(`wt-pfd-winddata`);
        if (windData instanceof WT_G3x5_PFDWindDataHTMLElement) {
            this._windData = windData;
            return true;
        } else {
            return false;
        }
    }

    async _connectedCallbackHelper() {
        await WT_Wait.awaitCallback(this._defineChildren.bind(this));
        this._isInit = true;
        this._updateFromContext();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _updateFromContext() {
        this._windData.setContext(this._context);
    }

    /**
     *
     * @param {{model:WT_G3x5_PFDWindDataModel}} context
     */
    setContext(context) {
        if (this._context === context) {
            return;
        }

        this._context = context;
        if (this._isInit) {
            this._updateFromContext();
        }
    }

    setVisible(value) {
        if (this._isVisible === value) {
            return;
        }

        this.setAttribute("show", `${value}`);
        this._isVisible = value;
    }

    update() {
        if (!this._isInit || !this._isVisible) {
            return;
        }

        this._windData.update();
    }
}
WT_G3000_PFDWindDataBoxHTMLElement.NAME = "wt-pfd-winddatabox";
WT_G3000_PFDWindDataBoxHTMLElement.TEMPLATE = document.createElement("template");
WT_G3000_PFDWindDataBoxHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: none;
            background-color: var(--wt-g3x5-bggray);
            border-radius: 5px;
        }
        :host([show="true"]) {
            display: block;
        }

        wt-pfd-winddata {
            position: absolute;
            left: var(--winddatabox-padding-left, 0.2em);
            top: var(--winddatabox-padding-top, 0.2em);
            width: calc(100% - var(--winddatabox-padding-left, 0.2em) - var(--winddatabox-padding-right, 0.2em));
            height: calc(100% - var(--winddatabox-padding-top, 0.2em) - var(--winddatabox-padding-bottom, 0.2em));
        }
    </style>
    <wt-pfd-winddata></wt-pfd-winddata>
`;

customElements.define(WT_G3000_PFDWindDataBoxHTMLElement.NAME, WT_G3000_PFDWindDataBoxHTMLElement);