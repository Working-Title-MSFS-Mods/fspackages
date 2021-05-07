class WT_G3x5_TSCNumberUnitButton extends WT_TSCLabeledButton {
    constructor() {
        super();

        this._numberUnit = WT_Unit.NMILE.createNumber(0);
        this._displayUnit = WT_Unit.NMILE;

        this._initFormatter();
    }

    _createUnitStyle() {
        return `
            #label .unit {
                font-size: var(--button-numberunit-unit-font-size, 0.75em);
            }
        `;
    }

    _createStyle() {
        let style = super._createStyle();
        let unitStyle = this._createUnitStyle();

        return `
            ${style}
            ${unitStyle}
        `;
    }

    _initFormatter() {
        let formatterOpts = {
            unitCaps: true
        };
        let htmlFormatterOpts = {
            numberUnitDelim: "",
            classGetter: {
                _numberClassList: [],
                _unitClassList: ["unit"],

                getNumberClassList() {
                    return this._numberClassList;
                },
                getUnitClassList() {
                    return this._unitClassList;
                }
            }
        };
        this._formatter = new WT_NumberHTMLFormatter(new WT_NumberFormatter(formatterOpts), htmlFormatterOpts);
    }

    _updateLabel() {
        this.labelText = this._formatter.getFormattedHTML(this._numberUnit, this._displayUnit);
    }

    /**
     *
     * @param {WT_NumberUnit} numberUnit
     */
    setNumberUnit(numberUnit) {
        if (this._numberUnit.unit.equals(numberUnit.unit)) {
            if (this._numberUnit.equals(numberUnit)) {
                return;
            }

            this._numberUnit.set(numberUnit);
        } else {
            this._numberUnit = numberUnit.copy();
            if (this._numberUnit.unit.family !== this._displayUnit.family) {
                this._displayUnit = this._numberUnit.unit;
            }
        }
        this._updateLabel();
    }

    /**
     *
     * @param {WT_Unit} unit
     */
    setDisplayUnit(unit) {
        if ((this._displayUnit === null && unit === null) || (this._displayUnit && this._displayUnit.equals(unit))) {
            return;
        }

        this._displayUnit = unit;
        this._updateLabel();
    }

    setFormatterOptions(options) {
        this._formatter.numberFormatter.setOptions(options);
        this._updateLabel();
    }
}
WT_G3x5_TSCNumberUnitButton.NAME = "wt-tsc-button-numberunit";

customElements.define(WT_G3x5_TSCNumberUnitButton.NAME, WT_G3x5_TSCNumberUnitButton);