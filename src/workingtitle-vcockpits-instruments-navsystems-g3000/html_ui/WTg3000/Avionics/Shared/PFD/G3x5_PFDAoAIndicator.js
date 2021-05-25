class WT_G3x5_PFDAoAIndicator extends WT_G3x5_PFDElement {
    constructor() {
        super();

        this._initSettingModel();
    }

    _initSettingModel() {
        this._settingModel = new WT_DataStoreSettingModel("PFD", null);
        this._settingModel.addSetting(this._aoaModeSetting = new WT_G3x5_PFDAoAModeSetting(this._settingModel));

        this._settingModel.init();
        this._mode = this.aoaModeSetting.getValue();
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
     * @property {WT_G3000_PFDAoAIndicatorHTMLElement} htmlElement
     * @type {WT_G3000_PFDAoAIndicatorHTMLElement}
     */
     get htmlElement() {
        return this._htmlElement;
    }

    init(root) {
        this._model = this._createModel();

        let container = root.querySelector(`#InstrumentsContainer`);
        this._htmlElement = this._createHTMLElement();
        container.appendChild(this.htmlElement);
    }

    onUpdate(deltaTime) {
        this._model.update();
        this.htmlElement.update();
    }
}

class WT_G3x5_AoAIndicatorModel {
    /**
     * @param {WT_PlayerAirplane} airplane
     * @param {Object} references
     * @param {WT_G3x5_PFDAoAModeSetting} aoaModeSetting
     */
    constructor(airplane, references, aoaModeSetting) {
        this._airplane = airplane;
        this._references = references;

        this._show = false;
        this._normalizedAoA = 0;

        this._aoaModeSetting = aoaModeSetting;
        this._aoaMode;
        this._initModeSettingListener();
    }

    _initModeSettingListener() {
        this._aoaModeSetting.addListener(this._onModeSettingChanged.bind(this));
        this._updateMode(this._aoaModeSetting.getValue());
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get show() {
        return this._show;
    }

    /**
     * @readonly
     * @type {Number}
     */
    get normalizedAoA() {
        return this._normalizedAoA;
    }

    _updateMode(mode) {
        this._aoaMode = mode;
    }

    _onModeSettingChanged(setting, newValue, oldValue) {
        this._updateMode(newValue);
    }

    _updateShow() {
    }

    _calculateNormalizedAoA(aoa) {
        return (aoa - this._references.zeroLiftAngle) / (this._references.criticalAngle - this._references.zeroLiftAngle);
    }

    _updateAoA() {
        this._normalizedAoA = this._calculateNormalizedAoA(this._airplane.sensors.aoa());
    }

    update() {
        this._updateShow();
        this._updateAoA();
    }
}

class WT_G3x5_PFDAoAIndicatorHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {{model:WT_G3x5_AoAIndicatorModel}}
         */
        this._context = null;
        this._isVisible = false;
        this._isInit = false;
    }

    _getTemplate() {
    }

    _defineChildren() {
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
        this._updateFromContext();
    }

    _updateFromContext() {
    }

    setContext(context) {
        if (this._context === context) {
            return;
        }

        this._context = context;
        if (this._isInit) {
            this._updateFromContext();
        }
    }

    _setVisibility(value) {
    }

    _updateVisibility() {
        let isVisible = this._context.model.show;

        if (isVisible !== this._isVisible) {
            this._setVisibility(isVisible);
            this._isVisible = isVisible;
        }
    }

    _setNeedlePosition(normalizedAoA) {
    }

    _setNeedleColor(normalizedAoA) {
    }

    _updateNeedle() {
        let normalizedAoA = this._context.model.normalizedAoA;
        this._setNeedlePosition(normalizedAoA);
        this._setNeedleColor(normalizedAoA);
    }

    _updateDisplay() {
        this._updateVisibility();
        if (this._isVisible) {
            this._updateNeedle();
        }
    }

    update() {
        if (!this._isInit || !this._context) {
            return;
        }

        this._updateDisplay();
    }
}