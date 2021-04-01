class WT_TSCSettingButtonManager {
    /**
     * @param {WT_TSCButton} button
     * @param {WT_DataStoreSetting} setting
     */
    constructor(button, setting) {
        this._button = button;
        this._setting = setting;

        this._initListeners();
    }

    _initListeners() {
        this._settingListener = this._onSettingChanged.bind(this);
        this._buttonListener = this._onButtonPressed.bind(this);

        this._setting.addListener(this._settingListener);
        this._button.addButtonListener(this._buttonListener);
    }

    /**
     * @readonly
     * @type {WT_TSCButton}
     */
    get button() {
        return this._button;
    }

    /**
     * @readonly
     * @type {WT_DataStoreSetting}
     */
    get setting() {
        return this._setting;
    }

    _updateButton(value) {
    }

    _onSettingChanged(setting, newValue, oldValue) {
    }

    _onButtonPressed(button) {
    }

    init() {
        this._updateButton(this.setting.getValue());
    }

    destroy() {
        this._setting.removeListener(this._settingListener);
        this._button.removeButtonListener(this._buttonListener);
    }
}

class WT_TSCSettingLabeledButtonManager extends WT_TSCSettingButtonManager {
    /**
     * @param {NavSystemTouch} instrument
     * @param {WT_TSCLabeledButton} button
     * @param {WT_DataStoreSetting} setting
     * @param {NavSystemElementContainer} selectionListWindow
     * @param {WT_TSCSelectionListContext} context
     * @param {(value:Number) => String} valueTextMapper
     * @param {Number[]} [selectionValues]
     */
    constructor(instrument, button, setting, selectionListWindow, context, valueTextMapper, selectionValues) {
        super(button, setting);

        this._instrument = instrument;
        this._selectionListWindow = selectionListWindow;
        this._context = context;
        this._context.callback = this._onSelectionMade.bind(this);
        this._context.currentIndexGetter = {getCurrentIndex: this._setting.getValue.bind(this._setting)};
        this._valueTextMapper = valueTextMapper;
        this._selectionValues = selectionValues;
    }

    /**
     * @readonly
     * @type {NavSystemTouch}
     */
    get instrument() {
        return this._instrument;
    }

    /**
     * @readonly
     * @type {NavSystemElementContainer}
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

    _onSelectionMade(index) {
        let value = this._selectionValues ? this._selectionValues[index] : index;
        this.setting.setValue(value);
    }
}

class WT_TSCSettingStatusBarButtonManager extends WT_TSCSettingButtonManager {
    _updateButton(value) {
        this.button.toggle = value ? "on" : "off";
    }

    _onSettingChanged(setting, newValue, oldValue) {
        this._updateButton(newValue);
    }

    _onButtonPressed(button) {
        this.setting.setValue(!this.setting.getValue());
    }
}

class WT_TSCSettingEnumStatusBarButtonManager extends WT_TSCSettingButtonManager {
    /**
     * @param {WT_TSCStatusBarButton} button
     * @param {WT_DataStoreSetting} setting
     * @param {Number} value
     */
    constructor(button, setting, value) {
        super(button, setting);

        this._value = value;
    }

    /**
     * @readonly
     * @type {Number}
     */
    get value() {
        return this._value;
    }

    _updateButton(value) {
        this.button.toggle = (value === this.value) ? "on" : "off";
    }

    _onSettingChanged(setting, newValue, oldValue) {
        this._updateButton(newValue);
    }

    _onButtonPressed(button) {
        this.setting.setValue(this.value);
    }
}

class WT_TSCSettingValueButtonManager extends WT_TSCSettingButtonManager {
    /**
     * @param {NavSystemTouch} instrument
     * @param {WT_TSCValueButton} button
     * @param {WT_DataStoreSetting} setting
     * @param {NavSystemElementContainer} selectionListWindow
     * @param {WT_TSCSelectionListContext} context
     * @param {(value:Number) => String} valueTextMapper
     * @param {Number[]} [selectionValues]
     */
    constructor(instrument, button, setting, selectionListWindow, context, valueTextMapper, selectionValues) {
        super(button, setting);

        this._instrument = instrument;
        this._button = button;
        this._setting = setting;
        this._selectionListWindow = selectionListWindow;
        this._context = context;
        this._context.callback = this._onSelectionMade.bind(this);
        this._context.currentIndexGetter = {getCurrentIndex: this._setting.getValue.bind(this._setting)};
        this._valueTextMapper = valueTextMapper;
        this._selectionValues = selectionValues;
    }

    /**
     * @readonly
     * @type {NavSystemTouch}
     */
    get instrument() {
        return this._instrument;
    }

    /**
     * @readonly
     * @type {NavSystemElementContainer}
     */
    get selectionListWindow() {
        return this._selectionListWindow;
    }

    _updateButton(value) {
        this.button.valueText = this._valueTextMapper(value);
    }

    _onSettingChanged(setting, newValue, oldValue) {
        this._updateButton(newValue);
    }

    _onButtonPressed(button) {
        this._selectionListWindow.element.setContext(this._context);
        this.instrument.switchToPopUpPage(this._selectionListWindow);
    }

    _onSelectionMade(index) {
        let value = this._selectionValues ? this._selectionValues[index] : index;
        this.setting.setValue(value);
    }
}