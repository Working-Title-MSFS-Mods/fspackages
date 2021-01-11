class WT_G3x5_TSCWaypointOptions extends WT_G3x5_TSCPopUpElement {
    constructor() {
        super();

        this._icaoSettingListener = this._onICAOSettingChanged.bind(this);
        this._mfdPaneDisplaySettingListener = this._onMFDPaneDisplaySettingChanged.bind(this);

        this._initChildren();
    }

    _initChildren() {
        this._showOnMapButton = new WT_TSCStatusBarButton();
        this._showOnMapButton.classList.add("button");
        this._showOnMapButton.labelText = "Show On Map";
        this._showOnMapButton.addButtonListener(this._onShowOnMapPressed.bind(this));
    }

    _appendChildren() {
        this._directToButton = this.popUpWindow.getElementsByClassName("drctButon")[0];
        this.instrument.makeButton(this._directToButton, this._onDirectToPressed.bind(this));

        this.popUpWindow.getElementsByClassName("content")[0].appendChild(this._showOnMapButton);
    }

    init(root) {
        super.init(root);

        this._appendChildren();
    }

    setContext(context) {
        if (context === this.context) {
            return;
        }

        if (this.context) {
            this.context.icaoSetting.removeListener(this._icaoSettingListener);
            this.context.mfdPaneDisplaySetting.removeListener(this._mfdPaneDisplaySettingListener);
        }

        super.setContext(context);

        if (this.context) {
            this.context.icaoSetting.addListener(this._icaoSettingListener);
            this.context.mfdPaneDisplaySetting.addListener(this._mfdPaneDisplaySettingListener);
        }
        this._updateButtons();
    }

    _updateDirectToButton() {
        if (!this._directToButton) {
            return;
        }

        this._directToButton.setAttribute("state", this.context.icaoSetting.getValue() !== "" ? "" : "Greyed");
    }

    _updateShowOnMapButton() {
        if (this.context && this.context.icaoSetting.getValue() !== "") {
            this._showOnMapButton.enabled = "true";
            this._showOnMapButton.toggle = this.context.mfdPaneDisplaySetting.getValue() === this.context.showOnMapOnDisplayMode ? "on" : "off";
        } else {
            this._showOnMapButton.enabled = "false";
            this._showOnMapButton.toggle = "off";
        }
    }

    _updateButtons() {
        this._updateDirectToButton();
        this._updateShowOnMapButton();
    }

    _onICAOSettingChanged(setting, newValue, oldValue) {
        this._updateButtons();
    }

    _onMFDPaneDisplaySettingChanged(setting, newValue, oldValue) {
        this._updateShowOnMapButton();
    }

    _onDirectToPressed() {
        this.instrument.closePopUpElement();
        this.instrument.SwitchToPageName("MFD", "Direct To");
    }

    _toggleShowOnMap() {
        let oldValue = this.context.mfdPaneDisplaySetting.getValue();
        if (oldValue !== this.context.showOnMapOnDisplayMode) {
            this.context.mfdPaneDisplaySetting.setValue(this.context.showOnMapOnDisplayMode);
        } else {
            this.context.mfdPaneDisplaySetting.setValue(this.context.showOnMapOffDisplayMode);
        }
    }

    _onShowOnMapPressed() {
        if (!this.context) {
            return;
        }

        this._toggleShowOnMap();
    }
}