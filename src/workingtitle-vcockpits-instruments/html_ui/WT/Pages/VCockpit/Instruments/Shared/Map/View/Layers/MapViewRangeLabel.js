class WT_MapViewRangeLabel {
    constructor(id, classList = WT_MapViewRangeLabel.CLASS_LIST_DEFAULT, autoClassList = WT_MapViewRangeLabel.AUTO_CLASS_LIST_DEFAULT, rangeClassList = WT_MapViewRangeLabel.RANGE_CLASS_LIST_DEFAULT) {
        this._labelElement = this._createLabel(id, classList, autoClassList, rangeClassList);

        let formatterOpts = {
            precision: 0.01,
            forceDecimalZeroes: false,
            maxDigits: 3,
            unitCaps: true
        };

        let htmlFormatterOpts = {
            numberUnitDelim: "",
            classGetter: this
        };

        this._formatter = new WT_NumberHTMLFormatter(new WT_NumberFormatter(formatterOpts), htmlFormatterOpts);

        this._lastRange = new WT_NumberUnit(0, WT_Unit.NMILE);
    }

    _createLabel(id, classList, autoClassList, rangeClassList) {
        let element = document.createElement("div");
        if (id) {
            element.id = id;
        }
        element.classList.add(...classList);

        this._autoElement = document.createElement("div");
        this._autoElement.classList.add(...autoClassList);
        this._autoElement.style.display = "none";

        this._rangeElement = document.createElement("div");
        this._rangeElement.classList.add(...rangeClassList);

        element.appendChild(this._autoElement);
        element.appendChild(this._rangeElement);

        return element;
    }

    getNumberClassList() {
        return ["rangeNumber"];
    }

    getUnitClassList() {
        return ["rangeUnit"];
    }

    get labelElement() {
        return this._labelElement;
    }

    get autoElement() {
        return this._autoElement;
    }

    get rangeElement() {
        return this._rangeElement;
    }

    _updateAutoElement(state) {
    }

    _updateRangeElement(state) {
        let range = state.model.range;

        if (range.compare(this._lastRange) == 0) {
            return;
        }

        let unit;
        if (range.asUnit(WT_Unit.FOOT) <= 1001) {
            unit = WT_Unit.FOOT;
        } else {
            unit = WT_Unit.NMILE;
        }

        this.rangeElement.innerHTML = this._formatter.getFormattedHTML(range, unit);
        this._lastRange.set(range);
    }

    onUpdate(data) {
        this._updateAutoElement(data);
        this._updateRangeElement(data);
    }
}
WT_MapViewRangeLabel.CLASS_LIST_DEFAULT = ["rangeLabel"];
WT_MapViewRangeLabel.AUTO_CLASS_LIST_DEFAULT = ["auto"];
WT_MapViewRangeLabel.RANGE_CLASS_LIST_DEFAULT = ["range"];