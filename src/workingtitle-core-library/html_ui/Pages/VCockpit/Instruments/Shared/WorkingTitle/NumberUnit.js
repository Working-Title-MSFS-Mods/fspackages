/**
 * A number with an associated unit. Each NumberUnit is created with a reference unit type,
 * which cannot be changed after instantiation. The reference unit type determines how the
 * value of the NumberUnit is internally represented. Each NumberUnit also maintains an
 * active unit type, which can be dynamically changed at any time.
 */
class WT_NumberUnit {
    /**
     * @param {number} refNumber - an initial reference value.
     * @param {WT_Unit} refUnit - the reference unit type. This also determines the initial active unit type.
     */
    constructor(refNumber, refUnit) {
        this._refNumber = refNumber;
        this._refUnit = refUnit;
        this._unit = refUnit;
    }

    /**
     * @property {number} - the current value in reference units.
     */
    get refNumber() {
        return this._refNumber;
    }

    set refNumber(val) {
        this._refNumber = val;
    }

    /**
     * @readonly
     * @property {WT_Unit} - the current value in active units.
     */
    get refUnit() {
        return this._refUnit;
    }

    /**
     * @property {number} - the current value in active units.
     */
    get number() {
        if (this._unit === this._refUnit) {
            return this._refNumber;
        }
        return this._refUnit.convert(this._refNumber, this._unit);
    }

    set number(val) {
        this._refNumber = this._unit.convert(val, this._refUnit);
    }

    /**
     * @property {WT_Unit} - the current active unit type
     */
    get unit() {
        return this._unit;
    }

    set unit(unit) {
        if (this._unit.type === unit.type) {
            this._unit = unit;
        }
    }

    add(other) {
        if (this.unit.type !== other.unit.type) {
            return;
        }
        this.refNumber += other.asUnit(this.refUnit);
        return this;
    }

    subtract(other) {
        if (this.unit.type !== other.unit.type) {
            return;
        }
        this.refNumber -= other.asUnit(this.refUnit);
        return this;
    }

    scale(factor) {
        this.refNumber *= factor;
        return this;
    }

    ratio(other) {
        if (this.unit.type !== other.unit.type) {
            return;
        }
        return this.refNumber / other.asUnit(this.refUnit);
    }

    asUnit(unit) {
        return this.refUnit.convert(this.refNumber, unit);
    }

    compare(other) {
        if (this.unit.type !== other.unit.type) {
            return undefined;
        }
        return this.refNumber - other.asUnit(this.refUnit);
    }

    equals(other) {
        return Math.abs(this.compare(other)) < 1e-14;
    }

    copy() {
        return new WT_NumberUnit(this.refNumber, this.refUnit);
    }

    copyFrom(other) {
        if (this.unit.type !== other.unit.type) {
            return;
        }
        this.refNumber = other.refUnit.convert(other.refNumber, this.refUnit);
    }
}

/**
 * A unit of measurement.
 * @interface
 */
class WT_Unit {
    /**
     * @param {string} fullNameSingular - the name of the unit in singular form.
     * @param {string} fullNameMultiple - the name of the unit in multiple form.
     * @param {string} abbrevName - the abbreviated name of the unit.
     */
    constructor(fullNameSingular, fullNameMultiple, abbrevName) {
        this._fullNameSingular = fullNameSingular;
        this._fullNameMultiple = fullNameMultiple;
        this._abbrevName = abbrevName;
    }

    /**
     * @readonly
     * @property {string} - the family this unit belongs to. a.family === b.family
     *                      must be true if and only if conversions between a and b are valid.
     */
    get family() {
        return this._family;
    }

    /**
     * @readonly
     * @property {string} - the name of this unit in singular form.
     */
    get fullNameSingular() {
        return this._fullNameSingular;
    }

    /**
     * @readonly
     * @property {string} - the name of this unit in multiple form.
     */
    get fullNameMultiple() {
        return this._fullNameMultiple;
    }

    /**
     * @readonly
     * @property {string} - the abbreviated name of this unit.
     */
    get abbrevName() {
        return this._abbrevName;
    }

    /**
     * Gets the conversion factor to convert from this unit to another unit.
     * @param {WT_Unit} otherUnit - the other unit to convert to.
     */
    getConversionFactor(otherUnit) {
    }

    /**
     * Converts a value of this unit to another unit.
     * @param {number} value - the value to convert.
     * @param {WT_Unit} otherUnit - the unit to convert to.
     */
    convert(value, otherUnit) {
        return value * this.getConversionFactor(otherUnit);
    }

    createNumber(value) {
        return new WT_NumberUnit(value, this);
    }
}

/**
 * A unit that can be converted to another unit of the same type through multiplication by a conversion factor.
 */
class WT_SimpleUnit extends WT_Unit {
    /**
     * @param {string} family - the family the unit belongs to.
     * @param {number} scaleFactor - the relative scale of one unit of the new unit compared to one unit of the standard unit of the same family.
     * @param {string} fullNameSingular - the name of the unit in singular form.
     * @param {string} fullNameMultiple - the name of the unit in multiple form.
     * @param {string} abbrevName - the abbreviated name of the unit.
     */
    constructor(family, scaleFactor, fullNameSingular, fullNameMultiple, abbrevName) {
        super(fullNameSingular, fullNameMultiple, abbrevName);
        this._family = family;
        this._scaleFactor = scaleFactor;
    }

    getConversionFactor(otherUnit) {
        if (this.family === otherUnit.family) {
            return this._scaleFactor / otherUnit._scaleFactor;
        }
        return NaN;
    }
}

/**
 * A unit of temperature.
 */
class WT_TempUnit extends WT_Unit {
    /**
     * @param {string} fullNameSingular - the name of the unit in singular form.
     * @param {string} fullNameMultiple - the name of the unit in multiple form.
     * @param {string} abbrevName - the abbreviated name of the unit.
     * @param {number} zeroOffset - the offset from absolute zero in the new temperature unit's scale.
     * @param {number} scaleFactor - the relative scale of one unit of the new unit compared to one unit Kelvin.
     */
    constructor(fullNameSingular, fullNameMultiple, abbrevName, zeroOffset, scaleFactor) {
        super(fullNameSingular, fullNameMultiple, abbrevName);
        this._family = WT_Unit.TEMP;
        this._zeroOffset = zeroOffset;
        this._scaleFactor = scaleFactor;
    }

    getConversionFactor(otherUnit) {
        return NaN;
    }

    convert(value, otherUnit) {
        if (this.family === otherUnit.family) {
            if (this.id === otherUnit.id) {
                return value;
            }
            return (value + this._zeroOffset) * (this._scaleFactor / otherUnit._scaleFactor) - otherUnit._zeroOffset;
        }
        return NaN;
    }
}

/**
 * A unit of measure composed of the multiplicative combination of multiple elementary units.
 */
class WT_CompoundUnit extends WT_Unit {
    /**
     * @param numerator - an iterable of WT_Unit containing all the units in the numerator of the compound unit.
     * @param denominator - an iterable of WT_Unit containing all the units in the denominator of the compound unit.
     * @param {string} fullNameSingular - the name of the unit in singular form.
     * @param {string} fullNameMultiple - the name of the unit in multiple form.
     * @param {string} abbrevName - the abbreviated name of the unit.
     */
    constructor(numerator, denominator, fullNameSingular = null, fullNameMultiple = null, abbrevName = null) {
        super(fullNameSingular, fullNameMultiple, abbrevName);
        this._numerator = Array.from(numerator);
        this._denominator = Array.from(denominator);

        if (!fullNameSingular) {
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

        if (!fullNameMultiple) {
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

        if (!abbrevName) {
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

        this._numerator.sort((a, b) => a.family - b.family);
        this._denominator.sort((a, b) => a.family - b.family);

        this._family = this._numerator.map(e => e.family) + "";
        this._family += this._denominator.length > 0 ? "/" + this._denominator.map(e => e.family) + "" : "";
    }

    getConversionFactor(otherUnit) {
        if (this.family === otherUnit.family) {
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
}

WT_Unit.Family = {
    DISTANCE: "distance",
    ANGLE: "angle",
    TIME: "time",
    WEIGHT: "weight",
    VOLUME: "volume",
    PRESSURE: "pressure",
    TEMP: "temperature"
};

WT_Unit.METER = new WT_SimpleUnit(WT_Unit.Family.DISTANCE, 1, "meter", "meters", "m");
WT_Unit.FOOT = new WT_SimpleUnit(WT_Unit.Family.DISTANCE, 0.3048, "foot", "feet", "ft");
WT_Unit.KILOMETER = new WT_SimpleUnit(WT_Unit.Family.DISTANCE, 1000, "kilometer", "kilometers", "km");
WT_Unit.MILE = new WT_SimpleUnit(WT_Unit.Family.DISTANCE, 1609.34, "mile", "miles", "m");
WT_Unit.NMILE = new WT_SimpleUnit(WT_Unit.Family.DISTANCE, 1852, "nautical mile", "nautical miles", "nm");
WT_Unit.GA_RADIAN = new WT_SimpleUnit(WT_Unit.Family.DISTANCE, 6378100, "great arc radian", "great arc radians", "rad");

WT_Unit.RADIAN = new WT_SimpleUnit(WT_Unit.Family.ANGLE, 1, "radian", "radians", "rad");
WT_Unit.DEGREE = new WT_SimpleUnit(WT_Unit.Family.ANGLE, Math.PI/180, "degree", "degrees", "°");

WT_Unit.SECOND = new WT_SimpleUnit(WT_Unit.Family.TIME, 1, "second", "seconds", "s");
WT_Unit.MINUTE = new WT_SimpleUnit(WT_Unit.Family.TIME, 60, "minute", "minutes", "m");
WT_Unit.HOUR = new WT_SimpleUnit(WT_Unit.Family.TIME, 3600, "hour", "hours", "h");

WT_Unit.KILOGRAM = new WT_SimpleUnit(WT_Unit.Family.WEIGHT, 1, "kilogram", "kilograms", "kg");
WT_Unit.POUND = new WT_SimpleUnit(WT_Unit.Family.WEIGHT, 0.453592, "pound", "pounds", "lb");
WT_Unit.TON = new WT_SimpleUnit(WT_Unit.Family.WEIGHT, 907.185, "ton", "tons", "tn");
WT_Unit.TONNE = new WT_SimpleUnit(WT_Unit.Family.WEIGHT, 1000, "tonne", "tonnes", "tn");

WT_Unit.LITER = new WT_SimpleUnit(WT_Unit.Family.VOLUME, 1, "liter", "liters", "l");
WT_Unit.GALLON = new WT_SimpleUnit(WT_Unit.Family.VOLUME, 3.78541, "gallon", "gallons", "gal");

WT_Unit.HPA = new WT_SimpleUnit(WT_Unit.Family.PRESSURE, 1, "hectopascal", "hectopascals", "hPa");
WT_Unit.ATM = new WT_SimpleUnit(WT_Unit.Family.PRESSURE, 1013.25, "atmosphere", "atmospheres", "atm");
WT_Unit.IN_HG = new WT_SimpleUnit(WT_Unit.Family.PRESSURE, 33.8639, "inch of mercury", "inches of mercury", "inHg");
WT_Unit.MM_HG = new WT_SimpleUnit(WT_Unit.Family.PRESSURE, 1.33322, "millimeter of mercury", "millimeters of mercury", "mmHg");

WT_Unit.CELSIUS = new WT_TempUnit("° Celsius", "° Celsius", "°C", 273.15, 1);
WT_Unit.FAHRENHEIT = new WT_TempUnit("° Fahrenheit", "° Fahrenheit", "°F", 459.67, 5/9);

WT_Unit.KNOT = new WT_CompoundUnit([WT_Unit.NMILE], [WT_Unit.HOUR], "knot", "knots", "kt");
WT_Unit.KPH = new WT_CompoundUnit([WT_Unit.KILOMETER], [WT_Unit.HOUR], null, null, "kph");
WT_Unit.MPS = new WT_CompoundUnit([WT_Unit.METER], [WT_Unit.SECOND]);
WT_Unit.FPM = new WT_CompoundUnit([WT_Unit.FOOT], [WT_Unit.MINUTE], null, null, "fpm");
WT_Unit.FPS = new WT_CompoundUnit([WT_Unit.FOOT], [WT_Unit.SECOND]);
WT_Unit.PPH = new WT_CompoundUnit([WT_Unit.POUND], [WT_Unit.HOUR], null, null, "pph");
WT_Unit.GPH = new WT_CompoundUnit([WT_Unit.GALLON], [WT_Unit.HOUR], null, null, "gph");

/**
 * Generates formatted strings from WT_NumberUnit objects.
 */
class WT_NumberFormatter {
    /**
     * @param {object} opts - options definition object containing properties to initialize to the new formatter.
     */
    constructor(opts = {}) {
        this.setOptions(WT_NumberFormatter.OPTIONS);

        this.setOptions(opts);
    }

    /**
     * @property {number} - the precision to which this formatter will round when generating the string representation.
     *                      A value of 0 indicates infinite precision (no rounding).
     */
    get precision() {
        return this._precision;
    }

    set precision(val) {
        this._precision = val;
    }

    /**
     * @property {number} - determines the rounding behavior of this formatter. A value of 0 indicates normal rounding.
     *                      A positive value indicates always round up. A negative value indicates always round down.
     */
    get round() {
        return this._round;
    }

    set round(val) {
        this._round = val;

        switch (Math.sign(this.round)) {
            case 1:
                this._roundFunc = Math.ceil;
                break;
            case -1:
                this._roundFunc = Math.floor;
                break;
            default:
                this._roundFunc = Math.round;
        }
    }

    /**
     * @property {number} - determines the maximum number of digits shown in the number string representation. Digits to the
     *                      right of the decimal point will be removed (via rounding) until the total number of digits is less
     *                      than or equal to the value of this property. Digits to the left of the decimal point will never be
     *                      removed.
     *
     */
    get maxDigits() {
        return this._maxDigits;
    }

    set maxDigits(val) {
        this._maxDigits = val;
    }

    /**
     * @property {boolean} - indicates whether to show ending zeroes to the right of the decimal point. If this value is true,
     *                       ending zeroes will be added up to the least significant non-zero digit in the value of the
     *                       .precision property.
     */
    get forceDecimalZeroes() {
        return this._forceDecimalZeroes;
    }

    set forceDecimalZeroes(val) {
        this._forceDecimalZeroes = val;
    }

    /**
     * @property {number} - determines the number of leading zeroes to the left of the decimal point. Leading zeroes will be
     *                      added until the number of digits to the left of the decimal point is greater than or equal to
     *                      the value of this property.
     */
    get pad() {
        return this._pad;
    }

    set pad(val) {
        this._pad = val;
    }

    /**
     * @property {boolean} - indicates whether to include the unit string representation in the full string representation.
     */
    get unitShow() {
        return this._unitShow;
    }

    set unitShow(val) {
        this._unitShow = val;
    }

    /**
     * @property {boolean} - indicates whether to include a space before the number and unit string representations in the full string
     *                       representation.
     */
    get unitSpaceBefore() {
        return this._unitSpaceBefore;
    }

    set unitSpaceBefore(val) {
        this._unitSpaceBefore = val;
    }

    /**
     * @property {boolean} - indicates whether to use the full name of the unit when creating the unit string representation.
     */
    get unitLong() {
        return this._unitLong;
    }

    set unitLong(val) {
        this._unitLong = val;
    }

    /**
     * @property {boolean} - indicates whether to use all capital letters when creating the unit string representation.
     */
    get unitCaps() {
        return this._unitCaps;
    }

    set unitCaps(val) {
        this._unitCaps = val;
    }

    /**
     * Sets this formatter's options en bloc using an options definition object.
     * @param {object} opts - options definition object containing properties to copy to this formatter.
     */
    setOptions(opts) {
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
            formatted = this._roundFunc(number / this.precision) * this.precision;
            let precisionString = this.precision + "";
            if (precisionString.indexOf(".") >= 0) {
                formatted = formatted.toFixed(precisionString.length - precisionString.indexOf(".") - 1);
            }
        }
        formatted = formatted + "";

        let decimalIndex = formatted.indexOf(".");
        if (!this.forceDecimalZeroes && decimalIndex >= 0) {
            formatted = formatted.replace(/0+$/, "");
            if (formatted.indexOf(".") == formatted.length - 1) {
                formatted = formatted.substring(0, formatted.length - 1);
            }
        }

        decimalIndex = formatted.indexOf(".");
        if (decimalIndex >= 0 && formatted.length - 1 > this.maxDigits) {
            let shift = Math.max(this.maxDigits - decimalIndex, 0);
            let precision = Math.pow(0.1, shift);
            formatted = this._roundFunc(number / precision) * precision;
            formatted = formatted.toFixed(shift);
        }
        formatted = formatted + "";

        if (this.pad == 0) {
            formatted = formatted.replace(/^0\./, ".");
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

    /**
     * Gets a complete formatted string representation of a NumberUnit.
     * @param {WT_NumberUnit} numberUnit - the NumberUnit to format.
     */
    getFormattedString(numberUnit) {
        return this._formatNumber(numberUnit.number) + this._formatUnit(numberUnit.number, numberUnit.unit);
    }

    /**
     * Gets a string representation of the number part of a NumberUnit.
     * @param {WT_NumberUnit} numberUnit - the NumberUnit to format.
     */
    getFormattedNumber(numberUnit) {
        return this._formatNumber(numberUnit.number);
    }

    /**
     * Gets a string representation of the unit part of a NumberUnit.
     * @param {WT_NumberUnit} numberUnit - the NumberUnit to format.
     */
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

/**
 * Generates formatted strings of the HH:MM:SS variety from WT_NumberUnit objects with time unit types.
 */
class WT_TimeFormatter extends WT_NumberFormatter {
    /**
     * @param {object} opts - options definition object containing properties to initialize to the new formatter.
     */
    constructor(opts = {}) {
        super(WT_TimeFormatter.OPTIONS);

        this.setOptions(opts);
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
        let hoursText = "";
        let minText = "";
        let secText = "";
        let hoursUnitText = "";
        let minUnitText = "";
        let secUnitText = "";

        hours = Math.floor(numberUnit.refUnit.convert(numberUnit.refNumber, WT_Unit.HOUR));
        if (this.timeFormat != WT_TimeFormatter.Format.MM_SS && !(this.timeFormat == WT_TimeFormatter.Format.HH_MM_OR_MM_SS && hours == 0)) {
            hoursText = hours.toFixed(0);
            hoursText = hoursText.padStart(this.pad, "0");
            hoursUnitText = this._formatUnit(hours, WT_Unit.HOUR) + (this.timeFormat == WT_TimeFormatter.Format.HH_MM_OR_MM_SS ? "+" : ":");
        }

        let hourSubtract = 0;
        if (hours) {
            hourSubtract = hours;
        }
        if (this.timeFormat == WT_TimeFormatter.Format.HH_MM || (this.timeFormat == WT_TimeFormatter.Format.HH_MM_OR_MM_SS && hours)) {
            min = numberUnit.refUnit.convert(numberUnit.refNumber, WT_Unit.MINUTE) % 60;
            minText = this._formatNumber(min);
            minUnitText = this._formatUnit(min, WT_Unit.MINUTE);
        } else {
            min = Math.floor(numberUnit.refUnit.convert(numberUnit.refNumber, WT_Unit.MINUTE) - hourSubtract * 60);
            minText = min.toFixed(0);
            minText = minText.padStart(this._pad, "0");
            minUnitText = this._formatUnit(min, WT_Unit.MINUTE) + ":";

            sec = numberUnit.refUnit.convert(numberUnit.refNumber, WT_Unit.SECOND) % 60;
            secText = this._formatNumber(sec);
            secUnitText = this._formatUnit(sec, WT_Unit.SECOND);
        }

        if (secText.replace(/\b0+/, "").substring(0, 2) == "60") {
            secText = this._formatNumber(parseFloat(secText) - 60);
            minText = `${parseInt(minText) + 1}`;
            minText = minText.padStart(this._pad, "0");
        }
        if (minText.replace(/\b0+/, "").substring(0, 2) == "60" && hoursText) {
            if (secText) {
                minText = "00";
            } else {
                minText = this._formatNumber(parseFloat(minText) - 60);
            }
            hoursText = `${(parseInt(hoursText) + 1)}`;
            hoursText = hoursText.padStart(this._pad, "0");
        }

        return hoursText + hoursUnitText + minText + minUnitText + secText + secUnitText;
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
    maxDigits: Infinity,
    forceDecimalZeroes: true,
    pad: 2,
    unitShow: false,
    unitSpaceBefore: false,
    unitLong: false,
    unitCaps: false,
    timeFormat: WT_TimeFormatter.Format.HH_MM_SS
};

/**
 * Generates formatted html strings from WT_NumberUnit objects in which the number and unit parts are contained in their own <span>.
 */
class WT_NumberHTMLFormatter {
    /**
     * @param {WT_NumberFormatter} numberFormatter - the formatter to use to generate the raw string representations of the WT_NumberUnit objects.
     * @param {object} opts - options definition object containing properties to initialize to the new formatter.
     */
    constructor(numberFormatter, opts = {}) {
        this.numberFormatter = numberFormatter;
        this.setOptions(WT_NumberHTMLFormatter.OPTIONS);
        this.setOptions(opts);
    }

    /**
     * @property {*} - An object that generates a class list for the number- and unit-containing span elements given a WT_NumberUnit object
     *                 by implementing the .getNumberClassList(numberUnit) and .getUnitClassList(numberUnit) methods.
     */
    get classGetter() {
        return this._classGetter;
    }

    set classGetter(val) {
        this._classGetter = val;
    }

    /**
     * @property {string} - A valid html string to be placed between the number and unit-containing span elements.
     */
    get numberUnitDelim() {
        return this._numberUnitDelim;
    }

    set numberUnitDelim(val) {
        this._numberUnitDelim = val;
    }

    /**
     * Sets this formatter's options en bloc using an options definition object.
     * @param {object} opts - options definition object containing properties to copy to this formatter.
     */
    setOptions(opts) {
        for (let opt in opts) {
            if (this._getAllowedOptions()[opt] !== undefined) {
                this[opt] = opts[opt];
            }
        }
    }

    _getAllowedOptions() {
        return WT_NumberHTMLFormatter.OPTIONS;
    }

    _generateClassText(classList) {
        let classText = "";
        if (classList.length > 0) {
            let i = 0;
            classText = ` class="${classList[i]}`;
            while (++i < classList.length) {
                classText += ` ${classList[i]}`;
            }
            classText += `"`;
        }
        return classText;
    }

    /**
     * Gets a html string for displaying the number part of the text representation of a WT_NumberUnit object.
     * @param {WT_NumberUnit} numberUnit - the NumberUnit to format.
     */
    getFormattedNumberHTML(numberUnit) {
        let classText = this._generateClassText(this.classGetter.getNumberClassList(numberUnit));
        return `<span${classText}>${this.numberFormatter.getFormattedNumber(numberUnit)}</span>`;
    }

    /**
     * Gets a html string for displaying the unit part of the text representation of a WT_NumberUnit object.
     * @param {WT_NumberUnit} numberUnit - the NumberUnit to format.
     */
    getFormattedUnitHTML(numberUnit) {
        let classText = this._generateClassText(this.classGetter.getUnitClassList(numberUnit));
        return `<span${classText}>${this.numberFormatter.getFormattedUnit(numberUnit)}</span>`;
    }

    /**
     * Gets a html string for displaying the full text representation of a WT_NumberUnit object.
     * @param {WT_NumberUnit} numberUnit - the NumberUnit to format.
     */
    getFormattedHTML(numberUnit) {
        return this.getFormattedNumberHTML(numberUnit) + (this.numberFormatter.unitShow ? this.numberUnitDelim + this.getFormattedUnitHTML(numberUnit) : "");
    }
}
WT_NumberHTMLFormatter.OPTIONS = {
    classGetter: {getNumberClassList: numberUnit => [], getUnitClassList: numberUnit => []},
    numberUnitDelim: " "
};