class WT_G3x5_MFDNavDataBar extends NavSystemElement {
    constructor(instrumentID, flightPlanManager) {
        super();

        this._instrumentID = instrumentID;
        this._flightPlanManager = flightPlanManager;
    }

    /**
     * @readonly
     * @property {String} instrumentID
     * @type {String}
     */
    get instrumentID() {
        return this._instrumentID;
    }

    /**
     * @readonly
     * @property {HTMLElement} htmlElement
     * @type {HTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     * @readonly
     * @property {WT_NavDataBar} model
     * @type {WT_NavDataBar}
     */
    get model() {
        return this._model;
    }

    /**
     * @readonly
     * @property {WT_NavDataBarView} view
     * @type {WT_NavDataBarView}
     */
    get view() {
        return this._view;
    }

    /**
     * @readonly
     * @property {WT_NavDataBarController} controller
     * @type {WT_NavDataBarController}
     */
    get controller() {
        return this._controller;
    }

    _initModel() {
        this._model = new WT_NavDataBar(this._flightPlanManager);
        this.model.setDataFieldCount(WT_G3x5_MFDNavDataBar.DATA_FIELD_COUNT);
    }

    _initView() {
        this._view = new WT_NavDataBarView();
        this.view.setModel(this.model);
        this.htmlElement.appendChild(this.view);
    }

    _initController() {
        this._controller = new WT_NavDataBarController(this._instrumentID, this.model);
        for (let i = 0; i < WT_G3x5_MFDNavDataBar.DATA_FIELD_COUNT; i++) {
            this.controller.addDataFieldSetting(WT_G3x5_MFDNavDataBar.DEFAULT_DATA_FIELD_INFO_IDS[i]);
        }

        this.controller.init();
        this.controller.update();
    }

    /**
     *
     * @param {HTMLElement} root
     */
    init(root) {
        this._htmlElement = root;

        this._initModel();
        this._initView();
        this._initController();
    }

    onUpdate(deltaTime) {
        this.view.update();
    }

    onEvent(event) {
    }
}
WT_G3x5_MFDNavDataBar.DATA_FIELD_COUNT = 8;
WT_G3x5_MFDNavDataBar.DEFAULT_DATA_FIELD_INFO_IDS = [
    "GS",
    "DTK",
    "TRK",
    "ETE",
    "BRG",
    "DIS",
    "END",
    "ETA"
];