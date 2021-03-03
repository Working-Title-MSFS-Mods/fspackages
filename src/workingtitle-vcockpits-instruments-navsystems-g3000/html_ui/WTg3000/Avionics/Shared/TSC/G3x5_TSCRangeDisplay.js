class WT_G3x5_TSCRangeDisplayButton extends WT_TSCLabeledButton {
  constructor() {
      super();

      this._range = WT_Unit.NMILE.createNumber(0);
      this._unit = WT_Unit.NMILE;

      this._initFormatter();
  }

  _initUnitStyle() {
      return `
          #label .unit {
              font-size: var(--rangedisplay-unit-font-size, 0.75em);
          }
      `;
  }

  _createStyle() {
      let style = super._createStyle();
      let unitStyle = this._initUnitStyle();

      return `
          ${style}
          ${unitStyle}
      `;
  }

  _initFormatter() {
      let formatterOpts = {
          precision: 0.01,
          forceDecimalZeroes: false,
          maxDigits: 3,
          unitCaps: true
      };
      let htmlFormatterOpts = {
          numberUnitDelim: "",
          classGetter: {
              getNumberClassList() {
                  return [];
              },
              getUnitClassList() {
                  return ["unit"];
              }
          }
      };
      this._formatter = new WT_NumberHTMLFormatter(new WT_NumberFormatter(formatterOpts), htmlFormatterOpts);
  }

  _selectDisplayUnit() {
      if (this._unit.equals(WT_Unit.NMILE) || this._unit.equals(WT_Unit.FOOT)) {
          return this._range.asUnit(WT_Unit.FOOT) <= 1001 ? WT_Unit.FOOT : WT_Unit.NMILE;
      } else if (this._unit.equals(WT_Unit.KILOMETER) || this._unit.equals(WT_Unit.METER)) {
          return this._range.asUnit(WT_Unit.METER) <= 501 ? WT_Unit.METER : WT_Unit.KILOMETER;
      } else {
          return this._unit;
      }
  }

  _updateLabel() {
      let unit = this._selectDisplayUnit();
      this.labelText = this._formatter.getFormattedHTML(this._range, unit);
  }

  /**
   *
   * @param {WT_NumberUnit} range
   */
  setRange(range) {
      if (this._range.equals(range)) {
          return;
      }

      this._range.set(range);
      this._updateLabel();
  }

  /**
   *
   * @param {WT_Unit} unit
   */
  setUnit(unit) {
      if ((this._unit === null && unit === null) || (this._unit && this._unit.equals(unit))) {
          return;
      }

      this._unit = unit;
      this._updateLabel();
  }
}
WT_G3x5_TSCRangeDisplayButton.NAME = "wt-tsc-button-rangedisplay";

customElements.define(WT_G3x5_TSCRangeDisplayButton.NAME, WT_G3x5_TSCRangeDisplayButton);

class WT_G3x5_TSCRangeSelectionElementHandler {
  /**
   * @param {WT_NumberUnit[]} ranges
   * @param {WT_G3x5_UnitsController} unitsController
   */
  constructor(ranges, unitsController) {
      this._ranges = ranges.map(range => range.copy());
      this._unitsController = unitsController;
  }

  nextElement(index) {
      if (index >= this._ranges.length) {
          return null;
      }

      let elem = {
          button: new WT_G3x5_TSCRangeDisplayButton()
      };
      elem.button.setRange(this._ranges[index]);
      return elem;
  }

  update(index, elem) {
      elem.button.setUnit(this._unitsController.distanceSpeedSetting.getDistanceUnit());
  }
}

class WT_G3x5_TSCRangeTypeDisplayButton extends WT_TSCValueButton {
    constructor() {
        super();

        this._range = WT_Unit.NMILE.createNumber(0);
        this._unit = WT_Unit.NMILE;

        this._initFormatter();
    }

    _initHostStyle() {
        let style = super._initHostStyle();
        return `
            ${style}
            :host(${WT_G3x5_TSCRangeTypeDisplayButton.NAME}) {
                --value-color: var(--wt-g3x5-lightblue);
            }
        `;
    }

    _initUnitStyle() {
        return `
            #value .unit {
                font-size: var(--rangedisplay-unit-font-size, 0.75em);
            }
        `;
    }

    _createStyle() {
        let style = super._createStyle();
        let unitStyle = this._initUnitStyle();

        return `
            ${style}
            ${unitStyle}
        `;
    }

    _initFormatter() {
        let formatterOpts = {
            precision: 0.01,
            forceDecimalZeroes: false,
            maxDigits: 3,
            unitCaps: true
        };
        let htmlFormatterOpts = {
            numberUnitDelim: "",
            classGetter: {
                getNumberClassList() {
                    return [];
                },
                getUnitClassList() {
                    return ["unit"];
                }
            }
        };
        this._formatter = new WT_NumberHTMLFormatter(new WT_NumberFormatter(formatterOpts), htmlFormatterOpts);
    }

    _selectDisplayUnit() {
        if (this._unit.equals(WT_Unit.NMILE) || this._unit.equals(WT_Unit.FOOT)) {
            return this._range.asUnit(WT_Unit.FOOT) <= 1001 ? WT_Unit.FOOT : WT_Unit.NMILE;
        } else if (this._unit.equals(WT_Unit.KILOMETER) || this._unit.equals(WT_Unit.METER)) {
            return this._range.asUnit(WT_Unit.METER) <= 501 ? WT_Unit.METER : WT_Unit.KILOMETER;
        } else {
            return this._unit;
        }
    }

    _updateLabel() {
        let unit = this._selectDisplayUnit();
        this.valueText = this._formatter.getFormattedHTML(this._range, unit);
    }

    /**
     *
     * @param {WT_NumberUnit} range
     */
    setRange(range) {
        if (this._range.equals(range)) {
            return;
        }

        this._range.set(range);
        this._updateLabel();
    }

    /**
     *
     * @param {WT_Unit} unit
     */
    setUnit(unit) {
        if ((this._unit === null && unit === null) || (this._unit && this._unit.equals(unit))) {
            return;
        }

        this._unit = unit;
        this._updateLabel();
    }
}
WT_G3x5_TSCRangeTypeDisplayButton.NAME = "wt-tsc-button-rangetypedisplay";

customElements.define(WT_G3x5_TSCRangeTypeDisplayButton.NAME, WT_G3x5_TSCRangeTypeDisplayButton);

class WT_G3x5_TSCRangeTypeSelectionElementHandler {
    /**
     * @param {String[]} typeNames
     * @param {{getRange(index:Number):WT_NumberUnit}} rangeGetter
     * @param {WT_G3x5_UnitsController} unitsController
     */
    constructor(typeNames, rangeGetter, unitsController) {
        this._typeNames = Array.from(typeNames);
        this._rangeGetter = rangeGetter;
        this._unitsController = unitsController;
    }

    nextElement(index) {
        if (index >= this._typeNames.length) {
            return null;
        }

        let elem = {
            button: new WT_G3x5_TSCRangeTypeDisplayButton(),
        };
        elem.button.labelText = this._typeNames[index];
        return elem;
    }

    update(index, elem) {
        elem.button.setRange(this._rangeGetter.getRange(index));
        elem.button.setUnit(this._unitsController.distanceSpeedSetting.getDistanceUnit());
    }
}