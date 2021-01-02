class WT_G3x5_TSCWaypointOptions extends WT_G3x5_TSCPopUpElement {
    init(root) {
        super.init(root);

        this._directToButton = root.getElementsByClassName("drctButon")[0];
        this.instrument.makeButton(this._directToButton, this._onDirectToPressed.bind(this));
    }

    _onDirectToPressed() {
        this.instrument.closePopUpElement();
        this.instrument.SwitchToPageName("MFD", "Direct To");
    }
}