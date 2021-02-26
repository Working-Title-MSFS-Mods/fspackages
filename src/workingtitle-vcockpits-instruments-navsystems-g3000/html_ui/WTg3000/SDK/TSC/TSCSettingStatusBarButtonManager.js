class WT_TSCSettingStatusBarButtonManager {
    /**
     * @param {WT_TSCStatusBarButton} button
     * @param {WT_DataStoreSetting} setting
     */
    constructor(button, setting) {
        this._button = button;
        this._setting = setting;

        this._setting.addListener(this._onSettingChanged.bind(this));
        this._button.addButtonListener(this._onButtonPressed.bind(this));
    }

    /**
     * @readonly
     * @property {WT_TSCStatusBarButton} button
     * @type {WT_TSCStatusBarButton}
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

    _updateButton(value) {
        this.button.toggle = value ? "on" : "off";
    }

    _onSettingChanged(setting, newValue, oldValue) {
        this._updateButton(newValue);
    }

    _onButtonPressed(button) {
        this.setting.setValue(!this.setting.getValue());
    }

    init() {
        this._updateButton(this.setting.getValue());
    }
}