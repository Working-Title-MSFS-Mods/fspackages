class WT_G3x5_PFDTrafficAlert extends WT_G3x5_PFDElement {
    /**
     * @readonly
     * @property {WT_G3x5_PFDTrafficAlertHTMLElement} htmlElement
     * @type {WT_G3x5_PFDTrafficAlertHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     * @returns {WT_G3x5_PFDTrafficAlertModel}
     */
    _createModel() {
    }

    _createHTMLElement() {
    }

    init(root) {
        let container = root.querySelector(`#InstrumentsContainer`);
        this._model = this._createModel();
        this._htmlElement = this._createHTMLElement();
        container.appendChild(this.htmlElement);
    }

    _shouldOpenTrafficMap() {
    }

    _openTrafficInsetMap() {
        this.instrument.trafficInsetMap.showSetting.setValue(true);
    }

    _enableNavMapTrafficOverlay() {
        this.instrument.navInsetMap.navMap.trafficShowSetting.setValue(true);
    }

    _updateTrafficMapAutoOpen() {
        let shouldOpen = this._shouldOpenTrafficMap();
        if (shouldOpen) {
            if (this.instrument.navInsetMap.showSetting.getValue()) {
                this._enableNavMapTrafficOverlay();
            } else {
                this._openTrafficInsetMap();
            }
        }
    }

    onUpdate(deltaTime) {
        this._model.update();
        this.htmlElement.update();
        this._updateTrafficMapAutoOpen();
    }
}

class WT_G3x5_PFDTrafficAlertModel {
    /**
     * @param {WT_G3x5_TrafficSystem} trafficSystem
     */
    constructor(trafficSystem) {
        this._trafficSystem = trafficSystem;

        this._alertLevel;
    }

    /**
     * @readonly
     * @type {Number}
     */
    get alertLevel() {
        return this._alertLevel;
    }

    update() {
    }
}

class WT_G3x5_PFDTrafficAlertHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {{model:WT_G3x5_PFDTrafficAlertModel}}
         */
        this._context = null;
        this._isInit = false;
    }

    _getTemplate() {
    }

    _defineChildren() {
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
    }

    /**
     *
     * @param {{model:WT_G3x5_PFDTrafficAlertModel}} context
     */
    setContext(context) {
        if (this._context === context) {
            return;
        }

        this._context = context;
    }

    _doUpdate() {
    }

    update() {
        if (!this._isInit || !this._context) {
            return;
        }

        this._doUpdate();
    }
}