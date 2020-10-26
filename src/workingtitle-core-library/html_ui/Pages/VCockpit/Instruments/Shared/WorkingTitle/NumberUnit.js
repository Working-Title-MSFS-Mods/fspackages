class WT_NumberUnit {
    constructor(refNumber, refUnit) {
        this._refNumber = refNumber;
        this._refUnit = refUnit;
        this._unit = refUnit;
    }

    get refNumber() {
        return this._refNumber;
    }

    set refNumber(val) {
        this._refNumber = val;
    }

    get refUnit() {
        return this._refUnit;
    }

    get number() {
        if (this._unit === this._refUnit) {
            return this._refNumber;
        }
        return this._refUnit.convert(this._refNumber, this._unit);
    }

    set number(val) {
        this._refNumber = this._unit.convert(val, this._refUnit);
    }

    get unit() {
        return this._unit;
    }

    set unit(unit) {
        if (this._unit.type === unit.type) {
            this._unit = unit;
        }
    }
}

class WT_NumberFormatter {
    constructor(opts = {}) {
        this.options = WT_NumberFormatter.OPTIONS;

        this.options = opts;
    }

    get numberUnit() {
        return this._numberUnit;
    }

    get precision() {
        return this._precision;
    }

    set precision(val) {
        this._precision = val;
    }

    get round() {
        return this._round;
    }

    set round(val) {
        this._round = val;
    }

    get maxDigits() {
        return this._maxDigits;
    }

    set maxDigits(val) {
        this._maxDigits = val;
    }

    get forceDecimalZeroes() {
        return this._forceDecimalZeroes;
    }

    set forceDecimalZeroes(val) {
        this._forceDecimalZeroes = val;
    }

    get pad() {
        return this._pad;
    }

    set pad(val) {
        this._pad = val;
    }

    get unitShow() {
        return this._unitShow;
    }

    set unitShow(val) {
        this._unitShow = val;
    }

    get unitSpaceBefore() {
        return this._unitSpaceBefore;
    }

    set unitSpaceBefore(val) {
        this._unitSpaceBefore = val;
    }

    get unitLong() {
        return this._unitLong;
    }

    set unitLong(val) {
        this._unitLong = val;
    }

    get unitCaps() {
        return this._unitCaps;
    }

    set unitCaps(val) {
        this._unitCaps = val;
    }

    set options(opts) {
        for (let opt in opts) {
            if (this._getAllowedOptions()[opt] !== undefined) {
                this[opt] = opts[opt];
            }
        }
    }

    _getAllowedOptions() {
        return WT_NumberFormatter.OPTIONS;
    }

    _formatNumber(number) {
        let formatted = number;
        if (this.precision != 0) {
            switch (this.round) {
                case 1:
                    formatted = Math.ceil(formatted / this.precision) * this.precision;
                    break;
                case -1:
                    formatted = Math.floor(formatted / this.precision) * this.precision;
                    break;
                default:
                    formatted = Math.round(formatted / this.precision) * this.precision;
            }
            let precisionString = this.precision + "";
            if (precisionString.indexOf(".") >= 0) {
                formatted = formatted.toFixed(precisionString.length - precisionString.indexOf(".") - 1);
            }
        }
        formatted = formatted + "";

        let decimalIndex = formatted.indexOf(".");
        if (decimalIndex >= 0 && this.maxDigits < Infinity) {
            let end = this.maxDigits > decimalIndex ? this.maxDigits + 1 : decimalIndex;
            formatted = formatted.substring(0, Math.min(end, formatted.length));
        }

        decimalIndex = formatted.indexOf(".");
        if (!this.forceDecimalZeroes && decimalIndex >= 0) {
            formatted = formatted.replace(/0+\b/, "");
            if (formatted.indexOf(".") == formatted.length - 1) {
                formatted = formatted.substring(0, formatted.length - 1);
            }
        }

        if (this.pad == 0) {
            formatted = formatted.replace(/\b0\./, ".");
        }
        decimalIndex = formatted.indexOf(".");
        if (decimalIndex < 0) {
            decimalIndex = formatted.length;
        }
        let wholePart = formatted.substring(0, decimalIndex);
        wholePart = wholePart.padStart(this.pad, "0");
        formatted = wholePart + formatted.substring(decimalIndex);

        return formatted;
    }

    _formatUnit(number, unit) {
        let formatted = "";
        if (this.unitShow) {
            formatted = this.unitSpaceBefore ? " " : "";
            if (this.unitLong) {
                formatted += number == 1 ? unit.fullNameSingular : unit.fullNameMultiple;
            } else {
                formatted += unit.abbrevName;
            }

            if (this.unitCaps) {
                formatted = formatted.toUpperCase();
            }
        }
        return formatted;
    }

    getFormattedString(numberUnit) {
        return this._formatNumber(numberUnit.number) + this._formatUnit(numberUnit.number, numberUnit.unit);
    }

    getFormattedNumber(numberUnit) {
        return this._formatNumber(numberUnit.number);
    }

    getFormattedUnit(numberUnit) {
        return this._formatUnit(numberUnit.number, numberUnit.unit).trim();
    }
}
WT_NumberFormatter.OPTIONS = {
    precision: 0,
    round: 0,
    maxDigits: Infinity,
    forceDecimalZeroes: true,
    pad: 1,
    unitShow: true,
    unitSpaceBefore: true,
    unitLong: false,
    unitCaps: false
};


class WT_TimeFormatter extends WT_NumberFormatter {
    constructor(opts = {}) {
        super(WT_TimeFormatter.OPTIONS);

        this.options = opts;
    }

    get timeFormat() {
        return this._timeFormat;
    }

    set timeFormat(val) {
        this._timeFormat = val;
    }

    _getAllowedOptions() {
        return WT_TimeFormatter.OPTIONS;
    }

    _formatHours(numberUnit) {
        let hours = Math.floor(numberUnit.refUnit.convert(numberUnit.refNumber, WT_Unit.HOUR));
        let hoursText = hours.toFixed(0);
        hoursText = hoursText.padStart(this.pad, "0");
        hoursText += this._formatUnit(hours, WT_Unit.HOUR);
        return {number: hours, text: hoursText}
    }

    getFormattedNumber(numberUnit) {
        let savedUnitShow = this.unitShow;
        this.unitShow = false;
        let formatted = this.getFormattedString(numberUnit);
        this.unitShow = savedUnitShow;
        return formatted;
    }

    getFormattedString(numberUnit) {
        let hours;
        let min;
        let sec;
        let hoursText;
        let minText;
        let secText;
        let formatted = "";
        if (this.timeFormat != WT_TimeFormatter.Format.MM_SS) {
            let hoursInfo = this._formatHours(numberUnit);
            if (!(this.timeFormat == WT_TimeFormatter.Format.HH_MM_OR_MM_SS && hoursInfo.number == 0)) {
                hours = hoursInfo.number;
                hoursText = hoursInfo.text;
                formatted += hoursText + ":";
            }
        }

        let hourSubtract = 0;
        if (hours) {
            hourSubtract = hours;
        }
        if (this.timeFormat == WT_TimeFormatter.Format.HH_MM || (this.timeFormat == WT_TimeFormatter.Format.HH_MM_OR_MM_SS && hours)) {
            min = numberUnit.refUnit.convert(numberUnit.refNumber, WT_Unit.MINUTE) - hourSubtract * 60;
            minText = this._formatNumber(min);
            minText += this._formatUnit(min, WT_Unit.MINUTE);
            formatted += minText;
        } else {
            min = Math.floor(numberUnit.refUnit.convert(numberUnit.refNumber, WT_Unit.MINUTE) - hourSubtract * 60);
            minText = min.toFixed(0);
            minText = minText.padStart(this._pad, "0");
            minText += this._formatUnit(min, WT_Unit.MINUTE);
            formatted += minText + ":";

            sec = numberUnit.refUnit.convert(numberUnit.refNumber, WT_Unit.SECOND) - hourSubtract * 3600 - min * 60;
            secText = this._formatNumber(sec);
            secText += this._formatUnit(sec, WT_Unit.SECOND);
            formatted += secText;
        }

        return formatted;
    }
}
WT_TimeFormatter.Format = {
    HH_MM_SS: 0,
    HH_MM: 1,
    MM_SS: 2,
    HH_MM_OR_MM_SS: 3
};
WT_TimeFormatter.OPTIONS = {
    precision: 1,
    round: 1,
    digits: Infinity,
    forceDecimalZeroes: true,
    pad: 2,
    unitShow: false,
    unitSpaceBefore: true,
    unitLong: false,
    unitCaps: false,
    timeFormat: WT_TimeFormatter.Format.HH_MM_SS
};

class WT_Unit {
    constructor(type, id, fullNameSingular, fullNameMultiple, abbrevName) {
        this._type = type;
        this._id = id;
        this._fullNameSingular = fullNameSingular;
        this._fullNameMultiple = fullNameMultiple;
        this._abbrevName = abbrevName;
    }

    get id() {
        return this._id;
    }

    get type() {
        return this._type;
    }

    get fullNameSingular() {
        return this._fullNameSingular;
    }

    get fullNameMultiple() {
        return this._fullNameMultiple;
    }

    get abbrevName() {
        return this._abbrevName;
    }

    getConversionFactor(otherUnit) {
        if (this.type === otherUnit.type) {
            return WT_Unit.Conversions[this.type][this.id][otherUnit.id];
        }
        return NaN;
    }

    convert(value, otherUnit) {
        return value * this.getConversionFactor(otherUnit);
    }
}
WT_Unit.Type = {
    DISTANCE: 0,
    ANGLE: 1,
    TIME: 2,
    WEIGHT: 3,
    VOLUME: 4,
    TEMP: 5,
};
WT_Unit.Conversions = [
    // distance
    [           //feet      meter       km          mile        NM
    /*feet*/   [1,          0.3048,     0.0003048,  1/5280,     1/6076.12],
    /*meter*/  [1/.3048,    1,          0.001,      1/1609.34,  1/1852],
    /*km*/     [3280.84,    1000,       1,          1/1.60934,  1/1.852],
    /*mile*/   [5280,       1609.34,    1.60934,    1,          1/1.15078],
    /*NM*/     [6076.12,    1852,       1.852,      1.15078,    1]
    ],

    // angle
    [           //degree        radian
    /*degree*/ [1,              Math.PI/180],
    /*radian*/ [180/Math.PI,    1]
    ],

    // time
    [           //second    minute      hour
    /*second*/ [1,          1/60,       1/3600],
    /*minute*/ [60,         1,          1/60],
    /*hour*/   [3600,       60,         1]
    ],

    // weight
    [           //pound     kg          ton         tonne
    /*pound*/  [1,          1/2.20462,  0.0005,     1/2204.62],
    /*kg*/     [2.20462,    1,          1/907.185,  0.001],
    /*ton*/    [2000,       907.185,    1,          0.907185],
    /*tonne*/  [2204.62,    1000,       1.10231,    1]
    ],

    // volume
    [           //gallon    liter
    /*gallon*/ [1,          3.78541],
    /*liter*/  [1/3.78541,  1]
    ]
];

class WT_Unit_Temp extends WT_Unit {
    constructor(id, fullNameSingular, fullNameMultiple, abbrevName, zeroOffset, factor) {
        super(WT_Unit.Type.TEMP, id, fullNameSingular, fullNameMultiple, abbrevName);
        this._zeroOffset = zeroOffset;
        this._factor = factor;
    }

    getConversionFactor(otherUnit) {
        return NaN;
    }

    convert(value, otherUnit) {
        if (this.type === otherUnit.type) {
            if (this.id === otherUnit.id) {
                return value;
            }
            return (value + this._zeroOffset) * (this._factor / otherUnit._factor) - otherUnit._zeroOffset;
        }
        return NaN;
    }
}


WT_Unit.FOOT = new WT_Unit(WT_Unit.Type.DISTANCE, 0, "foot", "feet", "ft");
WT_Unit.METER = new WT_Unit(WT_Unit.Type.DISTANCE, 1, "meter", "meters", "m");
WT_Unit.KILOMETER = new WT_Unit(WT_Unit.Type.DISTANCE, 2, "kilometer", "kilometers", "km");
WT_Unit.MILE = new WT_Unit(WT_Unit.Type.DISTANCE, 3, "mile", "miles", "m");
WT_Unit.NMILE = new WT_Unit(WT_Unit.Type.DISTANCE, 4, "nautical mile", "nautical miles", "nm");

WT_Unit.DEGREE = new WT_Unit(WT_Unit.Type.ANGLE, 0, "degree", "degrees", "°");
WT_Unit.RADIAN = new WT_Unit(WT_Unit.Type.ANGLE, 1, "radian", "radians", "rad");

WT_Unit.SECOND = new WT_Unit(WT_Unit.Type.TIME, 0, "second", "seconds", "s");
WT_Unit.MINUTE = new WT_Unit(WT_Unit.Type.TIME, 1, "minute", "minutes", "m");
WT_Unit.HOUR = new WT_Unit(WT_Unit.Type.TIME, 2, "hour", "hours", "h");

WT_Unit.POUND = new WT_Unit(WT_Unit.Type.WEIGHT, 0, "pound", "pounds", "lb");
WT_Unit.KILOGRAM = new WT_Unit(WT_Unit.Type.WEIGHT, 1, "kilogram", "kilograms", "kg");
WT_Unit.TON = new WT_Unit(WT_Unit.Type.WEIGHT, 2, "ton", "tons", "tn");
WT_Unit.TONNE = new WT_Unit(WT_Unit.Type.WEIGHT, 3, "tonne", "tonnes", "tn");

WT_Unit.GALLON = new WT_Unit(WT_Unit.Type.VOLUME, 0, "gallon", "gallons", "gal");
WT_Unit.LITER = new WT_Unit(WT_Unit.Type.VOLUME, 1, "liter", "liters", "l");

WT_Unit.CELSIUS = new WT_Unit_Temp(0, "° Celsius", "° Celsius", "°C", 273.15, 1);
WT_Unit.FAHRENHEIT = new WT_Unit_Temp(1, "° Fahrenheit", "° Fahrenheit", "°F", 459.67, 5/9);


class WT_CompoundUnit {
    constructor(numerator, denominator, fullNameSingular = null, fullNameMultiple = null, abbrevName = null) {
        this._numerator = Array.from(numerator);
        this._denominator = Array.from(denominator);

        if (fullNameSingular) {
            this._fullNameSingular = fullNameSingular;
        } else {
            this._fullNameSingular = "";
            let i = 0;
            while (i < this._numerator.length - 1) {
                this._fullNameSingular += `${this._numerator[i].fullNameSingular}-`;
            }
            this._fullNameSingular += `${this._numerator[i].fullNameSingular}`;
            if (this._denominator.length > 0) {
                this._fullNameSingular += " per "
                i = 0;
                while (i < this._denominator.length - 1) {
                    this._fullNameSingular += `${this._denominator[i].fullNameSingular}-`;
                }
                this._fullNameSingular += `${this._denominator[i].fullNameSingular}`;
            }
        }

        if (fullNameMultiple) {
            this._fullNameMultiple = fullNameMultiple;
        } else {
            this._fullNameMultiple = "";
            let i = 0;
            while (i < this._numerator.length - 1) {
                this._fullNameMultiple += `${this._numerator[i].fullNameSingular}-`;
            }
            this._fullNameMultiple += `${this._numerator[i].fullNameMultiple}`;
            if (this._denominator.length > 0) {
                this._fullNameMultiple += " per "
                i = 0;
                while (i < this._denominator.length - 1) {
                    this._fullNameMultiple += `${this._denominator[i].fullNameSingular}-`;
                }
                this._fullNameMultiple += `${this._denominator[i].fullNameSingular}`;
            }
        }

        if (abbrevName) {
            this._abbrevName = abbrevName;
        } else {
            this._abbrevName = "";
            let i = 0;
            while (i < this._numerator.length - 1) {
                this._abbrevName += `${this._numerator[i].abbrevName}\xb7`;
            }
            this._abbrevName += `${this._numerator[i].abbrevName}`;
            if (this._denominator.length > 0) {
                this._abbrevName += "/"
                i = 0;
                while (i < this._denominator.length - 1) {
                    this._abbrevName += `${this._denominator[i].abbrevName}\xb7`;
                }
                this._abbrevName += `${this._denominator[i].abbrevName}`;
            }
        }

        this._numerator.sort((a, b) => a.type - b.type);
        this._denominator.sort((a, b) => a.type - b.type);

        this._type = this._numerator.map(e => e.type) + "";
        this._type += this._denominator.length > 0 ? "/" + this._denominator.map(e => e.type) + "" : "";
    }

    get type() {
        return this._type;
    }

    get fullNameSingular() {
        return this._fullNameSingular;
    }

    get fullNameMultiple() {
        return this._fullNameMultiple;
    }

    get abbrevName() {
        return this._abbrevName;
    }

    getConversionFactor(otherUnit) {
        if (this.type === otherUnit.type) {
            let factor = 1;
            for (let i = 0; i < this._numerator.length; i++) {
                factor *= this._numerator[i].getConversionFactor(otherUnit._numerator[i]);
            }
            for (let i = 0; i < this._denominator.length; i++) {
                factor /= this._denominator[i].getConversionFactor(otherUnit._denominator[i]);
            }
            return factor;
        }
        return NaN;
    }

    convert(value, otherUnit) {
        return value * this.getConversionFactor(otherUnit);
    }
}
WT_CompoundUnit.KNOT = new WT_CompoundUnit([WT_Unit.NMILE], [WT_Unit.HOUR], "knot", "knots", "kt");
WT_CompoundUnit.KPH = new WT_CompoundUnit([WT_Unit.KILOMETER], [WT_Unit.HOUR], null, null, "kph");
WT_CompoundUnit.FPM = new WT_CompoundUnit([WT_Unit.FOOT], [WT_Unit.MINUTE], null, null, "fpm");
WT_CompoundUnit.PPH = new WT_CompoundUnit([WT_Unit.POUND], [WT_Unit.HOUR], null, null, "pph");
WT_CompoundUnit.GPH = new WT_CompoundUnit([WT_Unit.GALLON], [WT_Unit.HOUR], null, null, "gph");