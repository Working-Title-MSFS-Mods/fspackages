class WT_G3x5_MFDNavDataBar extends WT_G3x5_MFDElement {
    constructor(instrumentID) {
        super();

        this._instrumentID = instrumentID;
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
     * @type {WT_G3x5_NavDataBarModel}
     */
    get model() {
        return this._model;
    }

    /**
     * @readonly
     * @property {WT_NavDataBarView} view
     * @type {WT_G3x5_NavDataBarView}
     */
    get view() {
        return this._view;
    }

    /**
     * @readonly
     * @property {WT_NavDataBarController} controller
     * @type {WT_G3x5_NavDataBarSettingModel}
     */
    get settingsModel() {
        return this._settingsModel;
    }

    _initModel() {
        this._model = new WT_G3x5_NavDataBarModel(this.instrument);
        this.model.setDataFieldCount(WT_G3x5_MFDNavDataBar.DATA_FIELD_COUNT);

        this._unitsAdapter = new WT_G3x5_UnitsControllerNavDataBarModelAdapter(this.instrument.unitsSettingModel, this.model);
    }

    _initView() {
        this._view = new WT_G3x5_NavDataBarView();
        this.view.setModel(this.model);
        this.htmlElement.appendChild(this.view);
    }

    _initSettingsModel() {
        this._settingsModel = new WT_G3x5_NavDataBarSettingModel(this._instrumentID, this.model);
        for (let i = 0; i < WT_G3x5_MFDNavDataBar.DATA_FIELD_COUNT; i++) {
            this.settingsModel.addDataFieldSetting(WT_G3x5_MFDNavDataBar.DEFAULT_DATA_FIELD_INFO_IDS[i]);
        }

        this.settingsModel.init();
        this.settingsModel.update();
    }

    /**
     *
     * @param {HTMLElement} root
     */
    init(root) {
        this._htmlElement = root;

        this._initModel();
        this._initView();
        this._initSettingsModel();
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