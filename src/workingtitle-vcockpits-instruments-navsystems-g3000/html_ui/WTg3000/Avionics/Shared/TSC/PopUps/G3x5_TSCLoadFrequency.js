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
        switch (this.context.radioSlotType) {
            case WT_G3x5_TSCLoadFrequency.RadioSlotType.COM:
                this._titleLeftElem.textContent = "COM1";
                this._titleRightElem.textContent = "COM2";
                break;
            case WT_G3x5_TSCLoadFrequency.RadioSlotType.NAV:
                this._titleLeftElem.textContent = "NAV1";
                this._titleRightElem.textContent = "NAV2";
                break;
            case WT_G3x5_TSCLoadFrequency.RadioSlotType.ADF:
                this._titleLeftElem.textContent = "ADF";
                this._titleRightElem.textContent = "ADF";
                break;
            default:
                return null;
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCLoadFrequency.RadioSlotType} radioSlotType
     * @returns {WT_AirplaneRadioSlot}
     */
    _getRadioSlot(radioSlotType, index) {
        switch (radioSlotType) {
            case WT_G3x5_TSCLoadFrequency.RadioSlotType.COM:
                return this.instrument.airplane.navCom.getCom(index);
            case WT_G3x5_TSCLoadFrequency.RadioSlotType.NAV:
                return this.instrument.airplane.navCom.getNav(index);
            case WT_G3x5_TSCLoadFrequency.RadioSlotType.ADF:
                return this.instrument.airplane.navCom.getADF(1);
            default:
                return null;
        }
    }

    _setActiveLeft() {
        let radio = this._getRadioSlot(this.context.radioSlotType, 1);
        radio.setStandbyFrequency(radio.activeFrequency());
        radio.setActiveFrequency(this.context.frequency);
        this.instrument.goBack();
    }

    _setActiveRight() {
        let radio = this._getRadioSlot(this.context.radioSlotType, 2);
        radio.setStandbyFrequency(radio.activeFrequency());
        radio.setActiveFrequency(this.context.frequency);
        this.instrument.goBack();
    }

    _setStandbyLeft() {
        let radio = this._getRadioSlot(this.context.radioSlotType, 1);
        radio.setStandbyFrequency(this.context.frequency);
        this.instrument.goBack();
    }

    _setStandbyRight() {
        let radio = this._getRadioSlot(this.context.radioSlotType, 2);
        radio.setStandbyFrequency(this.context.frequency);
        this.instrument.goBack();
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_TSCLoadFrequency.RadioSlotType = {
    COM: 0,
    NAV: 1,
    ADF: 2
}