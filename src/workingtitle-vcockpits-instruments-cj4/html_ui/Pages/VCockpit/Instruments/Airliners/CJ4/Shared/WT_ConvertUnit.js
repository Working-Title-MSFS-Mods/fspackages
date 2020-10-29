class WT_ValueAndUnit {
    constructor(value, unit) {
        this._value = value;
        this._unit = unit;
    }

    get Value() {
        return this._value;
    }

    get Unit() {
        return this._unit;
    }

    getString(precision = 0, seperator = " ", cssFormat = "", emptyValue = "") {
        if (typeof this._value == 'number') {
            return this._value.toFixed(precision) + seperator + this._unit + cssFormat;
        } else {
            return emptyValue;
        }
    }
}

//class WT_Units {
//    static Weight() {
//        return ["LB", "KG"];
//    }
//
//    static Weights() {
//        return ["LBS", "KGS"];
//    }
//
//    static FuelFlow() {
//        return ["PPH", "KG/HR"];
//    }
//}

class WT_ConvertUnit {

    static isMetric() {
        return Boolean(WTDataStore.get('WT_CJ4_Units', 0));
    }

    static getWeight(value, imperial = "LB", metric = "KG") {
        if (WT_ConvertUnit.isMetric()) {
            return new WT_ValueAndUnit(value * 0.453592, metric);
        }
        else {
            return new WT_ValueAndUnit(value, imperial);
        }
    }

    static getFuelFlow(value, imperial = "PPH", metric = "KG/H") {
        if (WT_ConvertUnit.isMetric()) {
            return new WT_ValueAndUnit(value * 0.453592, metric);
        }
        else {
            return new WT_ValueAndUnit(value, imperial);
        }
    }

    static setWeight(value) {
        if (WT_ConvertUnit.isMetric()) {
            return value / 0.453592;
        }
        else {
            return value;
        }
    }

    static getLength(value, imperial = "FT", metric = "M") {
        if (WT_ConvertUnit.isMetric()) {
            return new WT_ValueAndUnit(value, metric);
        }
        else {
            return new WT_ValueAndUnit(value * 3.28084, imperial);
        }
    }

    static setLength(value) {
        if (WT_ConvertUnit.isMetric()) {
            return value;
        }
        else {
            return value / 3.28084;
        }
    }

    static getQnh(value) {
        if (WT_ConvertUnit.isMetric()) {
            return value * 33.864;
        }
        else {
            return value;
        }
    }

    static setQnh(value) {
        if (WT_ConvertUnit.isMetric()) {
            return value / 33.864;
        }
        else {
            return value;
        }
    }

}
