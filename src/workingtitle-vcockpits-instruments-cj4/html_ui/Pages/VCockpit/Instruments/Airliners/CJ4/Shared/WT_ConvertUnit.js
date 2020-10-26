class WT_ValueAndUnit {
    constructor(value, unit){
        this._value = value;
        this._unit = unit;
    }
    
    get Value() {
        return this._value;
    }

    get Unit() {
        return this._unit;        
    }

    getString (seperator = " ") {
        return this._value + seperator + this._unit;
    }
}

class WT_Units {
    static Weight() {
        return ["LB", "KG"];
    }

    static Weights() {
        return ["LBS", "KGS"];
    }

    static FuelFlow() {
        return ["PPH", "KG/HR"];
    }
}

class WT_ConvertUnit {

    static isMetric() {
        return WTDataStore.get('WT_CJ4_Units', 0);
    }

    static getWeight(value, imperial = "LB", metric = "KG") {
        if (WT_ConvertUnit.isMetric()) {
            return new WT_ValueAndUnit(value * 0.453592, metric);
        }
        else {
            return new WT_ValueAndUnit(value, imperial);
        }
    }

    static getFuelFlow(value) {
        return WT_ConvertUnit.getWeight(value, ...WT_Units.FuelFlow());
    }

    static setWeight(value) {
        let isMetric = WTDataStore.get('WT_CJ4_Units', 0);
        if (isMetric == 1) {
            return value / 0.453592;
        }
        else {
            return value;
        }
    }

    static getLength(value) {
        let isMetric = WTDataStore.get('WT_CJ4_Units', 0);
        if (isMetric == 1) {
            return value;
        }
        else {
            return value * 3.28084;
        }
    }

    static setLength(value) {
        let isMetric = WTDataStore.get('WT_CJ4_Units', 0);
        if (isMetric == 1) {
            return value;
        }
        else {
            return value / 3.28084;
        }
    }

    static getQnh(value) {
        let isMetric = WTDataStore.get('WT_CJ4_Units', 0);
        if (isMetric == 1) {
            return value * 33.864;
        }
        else {
            return value;
        }
    }

    static setQnh(value) {
        let isMetric = WTDataStore.get('WT_CJ4_Units', 0);
        if (isMetric == 1) {
            return value / 33.864;
        }
        else {
            return value;
        }
    }


    // static weightUnit() {
    //     let isMetric = WTDataStore.get('WT_CJ4_Units', 0);
    //     if (isMetric == 1) {
    //         return "KG";
    //     }
    //     else {
    //         return "LB";
    //     }
    // }
    
    // static weightUnits() {
    //     let isMetric = WTDataStore.get('WT_CJ4_Units', 0);
    //     if (isMetric == 1) {
    //         return "KGS";
    //     }
    //     else {
    //         return "LBS";
    //     }
    // }

    static lengthUnit() {
        let isMetric = WTDataStore.get('WT_CJ4_Units', 0);
        if (isMetric == 1) {
            return "M";
        }
        else {
            return "FT";
        }
    }

}
