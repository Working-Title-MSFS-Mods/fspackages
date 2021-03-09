class WT_TSCSettingLabeledButtonManager {
    /**
     * @param {NavSystemTouch} instrument
     * @param {WT_TSCLabeledButton} button
     * @param {WT_DataStoreSetting} setting
     * @param {NavSystemElementContainer} selectionListWindow
     * @param {WT_TSCSelectionListWindowContext} context
     */
    constructor(instrument, button, setting, selectionListWindow, context, valueTextMapper) {
        this._instrument = instrument;
        this._button = button;
        this._setting = setting;
        this._selectionListWindow = selectionListWindow;
        this._context = context;
        this._context.callback = this._onSelectionMade.bind(this);
        this._context.currentIndexGetter = {getCurrentIndex: this._setting.getValue.bind(this._setting)};
        this._valueTextMapper = valueTextMapper;

        this._setting.addListener(this._onSettingChanged.bind(this));
        this._button.addButtonListener(this._onButtonPressed.bind(this));
    }

    /**
     * @readonly
     * @property {NavSystemTouch} instrument
     * @type {NavSystemTouch}
     */
    get instrument() {
        return this._instrument;
    }

    /**
     * @readonly
     * @property {WT_TSCLabeledButton} button
     * @type {WT_TSCLabeledButton}
     */
    get button() {
        return this._button;
    }

    /**
     * @readonly
     * @property {WT_DataStoreSetting} setting
     * @type {WT_DataStoreSetting}
     */
    get setting() {
        return this._setting;
    }

    /**
     * @readonly
     * @property {WT_TSCSelectionListWindow} selectionListWindow
     * @type {WT_TSCSelectionListWindow}
     */
    get selectionListWindow() {
        return this._selectionListWindow;
    }

    _updateButton(value) {
        this.button.labelText = this._valueTextMapper(value);
    }

    _onSettingChanged(setting, newValue, oldValue) {
        this._updateButton(newValue);
    }

    _onButtonPressed(button) {
        this._selectionListWindow.element.setContext(this._context);
        this.instrument.switchToPopUpPage(this._selectionListWindow);
    }

    _onSelectionMade(value) {
        this.setting.setValue(value);
    }

    init() {
        this._updateButton(this.setting.getValue());
    }
}