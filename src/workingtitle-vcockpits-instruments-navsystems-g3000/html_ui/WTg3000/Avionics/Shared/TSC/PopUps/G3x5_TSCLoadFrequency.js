class WT_G3x5_TSCLoadFrequency extends WT_G3x5_TSCPopUpElement {
    init(root) {
        super.init(root);

        this._freqNameElem = root.getElementsByClassName("Frequency")[0];
        this._titleLeftElem = root.getElementsByClassName("titleLeft")[0];
        this._titleRightElem = root.getElementsByClassName("titleRight")[0];
        this._leftActive = root.getElementsByClassName("leftActiveBtn")[0];
        this._rightActive = root.getElementsByClassName("rightActiveBtn")[0];
        this._leftStby = root.getElementsByClassName("leftStandbyBtn")[0];
        this._rightStby = root.getElementsByClassName("rightStandbyBtn")[0];
        this.instrument.makeButton(this._leftActive, this._setActiveLeft.bind(this));
        this.instrument.makeButton(this._rightActive, this._setActiveRight.bind(this));
        this.instrument.makeButton(this._leftStby, this._setStandbyLeft.bind(this));
        this.instrument.makeButton(this._rightStby, this._setStandbyRight.bind(this));
    }

    onEnter() {
        super.onEnter();

        this._freqNameElem.textContent = this.context.frequencyText;
        if (this.context.isNav) {
            this._titleLeftElem.textContent = "NAV1";
            this._titleRightElem.textContent = "NAV2";
        } else {
            this._titleLeftElem.textContent = "COM1";
            this._titleRightElem.textContent = "COM2";
        }
    }

    _setActiveLeft() {
        if (this.context.isNav) {
            SimVar.SetSimVarValue("K:NAV1_RADIO_SET", "Frequency BCD16", this.context.frequency);
        }
        else {
            SimVar.SetSimVarValue("K:COM_RADIO_SET", "Frequency BCD16", this.context.frequency);
        }
        this.instrument.goBack();
    }

    _setActiveRight() {
        if (this.context.isNav) {
            SimVar.SetSimVarValue("K:NAV2_RADIO_SET", "Frequency BCD16", this.context.frequency);
        }
        else {
            SimVar.SetSimVarValue("K:COM2_RADIO_SET", "Frequency BCD16", this.context.frequency);
        }
        this.instrument.goBack();
    }

    _setStandbyLeft() {
        if (this.context.isNav) {
            SimVar.SetSimVarValue("K:NAV1_STBY_SET", "Frequency BCD16", this.context.frequency);
        }
        else {
            SimVar.SetSimVarValue("K:COM_STBY_RADIO_SET", "Frequency BCD16", this.context.frequency);
        }
        this.instrument.goBack();
    }

    _setStandbyRight() {
        if (this.context.isNav) {
            SimVar.SetSimVarValue("K:NAV2_STBY_SET", "Frequency BCD16", this.context.frequency);
        }
        else {
            SimVar.SetSimVarValue("K:COM2_STBY_RADIO_SET", "Frequency BCD16", this.context.frequency);
        }
        this.instrument.goBack();
    }
}