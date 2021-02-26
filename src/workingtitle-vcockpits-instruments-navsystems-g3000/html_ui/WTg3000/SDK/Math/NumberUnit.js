/**
 * A number with an associated unit. Each NumberUnit is created with a reference unit type,
 * which cannot be changed after instantiation. The reference unit type determines how the
 * value of the NumberUnit is internally represented. Each NumberUnit also maintains an
 * active unit type, which can be dynamically changed at any time.
 */
class WT_NumberUnit {
    /**
     * @param {Number} number - the initial numeric value of the new NumberUnit.
     * @param {WT_Unit} unit - the unit type of the new NumberUnit.
     */
    constructor(number, unit) {
        this._number = number;
        this._unit = unit;
        this._readonly = new WT_NumberUnitReadOnly(this);
    }

    /**
     * @readonly
     * @property {Number} - this NumberUnit's numeric value.
     * @type {Number}
     */
    get number() {
        return this._number;
    }

    /**
     * @readonly
     * @property {WT_Unit} - this NumberUnit's unit type.
     * @type {WT_Unit}
     */
    get unit() {
        return this._unit;
    }

    _toNumberOfThisUnit(value, unit) {
        if ((value instanceof WT_NumberUnit || value instanceof WT_NumberUnitReadOnly) && this.unit.family === value.unit.family) {
            return value.unit.convert(value.number, this.unit);
        }
        if (typeof value === "number") {
            if (!(unit instanceof WT_Unit)) {
                unit = this.unit;
            }
            return unit.convert(value, this.unit);
        }
        return undefined;
    }

    /**
     * Sets this NumberUnit's numeric value. This method will not change this NumberUnit's unit type.
     * @param {WT_NumberUnit|Number} value - the new value.
     * @param {WT_Unit} [unit] - the unit type of the new value. Defaults to this NumberUnit's unit type. This argument is ignored if value
     *                           is a WT_NumberUnit object.
     */
    set(value, unit) {
        let converted = this._toNumberOfThisUnit(value, unit);
        if (converted !== undefined) {
            this._number = converted;
        }
        return this;
    }

    /**
     * Adds a value to this NumberUnit and returns the result as a new WT_NumberUnit object. The operation is only valid if the unit type of
     * the value to add can be converted to this NumberUnit's unit type.
     * @param {WT_NumberUnit|Number} value - the other value.
     * @param {WT_Unit} [unit] - the unit type of the other value. Defaults to this NumberUnit's unit type. This argument is ignored if value
     *                           is a WT_NumberUnit object.
     * @returns {WT_NumberUnit} the sum as a new WT_NumberUnit object, or undefined if the the operation was invalid.
     */
    plus(value, unit) {
        let converted = this._toNumberOfThisUnit(value, unit);
        if (converted !== undefined) {
            converted = new WT_NumberUnit(this.number + converted, this.unit);
        }
        return converted;
    }

    /**
     * Adds a value to this NumberUnit in place and returns this NumberUnit. The operation is only valid if the unit type of the value to
     * add can be converted to this NumberUnit's unit type. An invalid operation will not be carried out, but this NumberUnit will still be
     * returned.
     * @param {WT_NumberUnit|Number} value - the other value.
     * @param {WT_Unit} [unit] - the unit type of the other value. Defaults to this NumberUnit's unit type. This argument is ignored if value
     *                           is a WT_NumberUnit object.
     * @returns {WT_NumberUnit} this NumberUnit.
     */
    add(value, unit) {
        let converted = this._toNumberOfThisUnit(value, unit);
        if (converted !== undefined) {
            this._number += converted;
        }
        return this;
    }

    /**
     * Subtracts a value from this NumberUnit and returns the result as a new WT_NumberUnit object. The operation is only valid if the
     * unit type of the value to subtract can be converted to this NumberUnit's unit type.
     * @param {WT_NumberUnit|Number} value - the other value.
     * @param {WT_Unit} [unit] - the unit type of the other value. Defaults to this NumberUnit's unit type. This argument is ignored if value
     *                           is a WT_NumberUnit object.
     * @returns {WT_NumberUnit} the difference as a new WT_NumberUnit object, or undefined if the the operation was invalid.
     */
    minus(value, unit) {
        let converted = this._toNumberOfThisUnit(value, unit);
        if (converted !== undefined) {
            converted = new WT_NumberUnit(this.number - converted, this.unit);
        }
        return converted;
    }

    /**
     * Subtracts a value from this NumberUnit in place and returns this NumberUnit. The operation is only valid if the unit type of the
     * value to subtract can be converted to this NumberUnit's unit type. An invalid operation will not be carried out, but this NumberUnit
     * will still be returned.
     * @param {WT_NumberUnit|Number} value - the other value.
     * @param {WT_Unit} [unit] - the unit type of the other value. Defaults to this NumberUnit's unit type. This argument is ignored if value
     *                           is a WT_NumberUnit object.
     * @returns {WT_NumberUnit} this NumberUnit.
     */
    subtract(value, unit) {
        let converted = this._toNumberOfThisUnit(value, unit);
        if (converted !== undefined) {
            this._number -= converted;
        }
        return this;
    }

    /**
     * Scales this NumberUnit by a unit-less factor. The operation can either be performed in-place or a new WT_NumberUnit object can
     * be returned.
     * @param {Number} factor - the factor by which to scale.
     * @param {Boolean} mutate - whether to perform the operation in place.
     * @returns {WT_NumberUnit} the scaled NumberUnit, either as a new WT_NumberUnit object or this NumberUnit after being changed.
     */
    scale(factor, mutate = false) {
        if (mutate) {
            this._number *= factor;
            return this;
        } else {
            return new WT_NumberUnit(this.number * factor, this.unit);
        }
    }

    /**
     * Calculates the ratio of this NumberUnit to another value.
     * @param {WT_NumberUnit|Number} value - the other value.
     * @param {WT_Unit} [unit] - the unit type of the other value. Defaults to this NumberUnit's unit type. This argument is ignored if value
     *                           is a WT_NumberUnit object.
     * @returns {Number} the ratio.
     */
    ratio(value, unit) {
        let converted = this._toNumberOfThisUnit(value, unit);
        return this.number / converted;
    }

    /**
     * Calculates the absolute value of this NumberUnit, then either returns the result as a new WT_NumberUnit object or sets the value of
     * this number to the result.
     * @param {Boolean} mutate - whether to perform the operation in place.
     * @returns {WT_NumberUnit} the absolute value of this NumberUnit, either as a new WT_NumberUnit object or this NumberUnit after
     *                          being changed.
     */
    abs(mutate = false) {
        if (mutate) {
            this._number = Math.abs(this.number);
            return this;
        } else {
            return new WT_NumberUnit(Math.abs(this.number), this.unit);
        }
    }

    /**
     * Returns the numeric value of this NumberUnit after conversion to a specified unit.
     * @param {WT_Unit} unit - the unit to which to convert.
     * @returns {Number} the converted numeric value.
     */
    asUnit(unit) {
        return this.unit.convert(this.number, unit);
    }

    /**
     * Checks whether this NumberUnit is greater than, equal to, or less than another value.
     * @param {WT_NumberUnit|Number} value - the other value.
     * @param {WT_Unit} [unit] - the unit type of the other value. Defaults to this NumberUnit's unit type. This argument is ignored if value
     *                           is a WT_NumberUnit object.
     * @returns {Number} 0 if this NumberUnit is equal to the other value, -1 if this number is less, and 1 if this number is greater.
     */
    compare(value, unit) {
        let converted = this._toNumberOfThisUnit(value, unit);
        if (converted === undefined) {
            return undefined;
        }

        let diff = this.number - converted;
        if (Math.abs(diff) < 1e-14) {
            return 0;
        }
        return diff;
    }

    /**
     * Checks whether this NumberUnit is equal to another value. This method is a synonym for this.compare(value, unit) === 0.
     * @param {WT_NumberUnit|Number} value - the other value.
     * @param {WT_Unit} [unit] - the unit type of the other value. Defaults to this NumberUnit's unit type. This argument is ignored if value
     *                           is a WT_NumberUnit object.
     * @returns {Boolean} whether this NumberUnit is equal to the other value.
     */
    equals(value, unit) {
        return this.compare(value, unit) === 0;
    }

    /**
     * Copies this NumberUnit.
     * @returns {WT_NumberUnit} a copy of this NumberUnit.
     */
    copy() {
        return new WT_NumberUnit(this.number, this.unit);
    }

    /**
     * Gets a read-only version of this NumberUnit. The read-only version is updated as this NumberUnit is changed. Attempting to call
     * any mutating method on the read-only version will create and return a mutated copy of this NumberUnit instead.
     * @returns {WT_NumberUnitReadOnly} a read-only version of this NumberUnit.
     */
    readonly() {
        return this._readonly;
    }
}

/**
 * A read-only interface for a WT_NumberUnit.
 */
class WT_NumberUnitReadOnly {
    /**
     * @param {WT_NumberUnit} source
     */
    constructor(source) {
        this._source = source;
    }

    /**
     * @readonly
     * @property {Number} - this NumberUnit's numeric value.
     * @type {Number}
     */
    get number() {
        return this._source.number;
    }

    /**
     * @readonly
     * @property {WT_Unit} - this NumberUnit's unit type.
     * @type {WT_Unit}
     */
    get unit() {
        return this._source.unit;
    }

    set(value, unit) {
        return this._source.copy().set(value, unit);
    }

    plus(value, unit) {
        return this._source.plus(value, unit);
    }

    add(value, unit) {
        return this._source.plus(value, unit);
    }

    minus(value, unit) {
        return this._source.minus(value, unit);
    }

    subtract(value, unit) {
        return this._source.minus(value, unit);
    }

    scale(factor, mutate = false) {
        return this._source.scale(factor, false);
    }

    ratio(value, unit) {
        return this._source.ratio(value, unit);
    }

    abs(mutate = false) {
        return this._source.abs(false);
    }

    asUnit(unit) {
        return this._source.asUnit(unit);
    }

    compare(other) {
        return this._source.compare(other);
    }

    equals(other) {
        return this._source.equals(other);
    }

    copy() {
        return this._source.copy();
    }

    readonly() {
        return this;
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
     * @property {String} - the family this unit belongs to. a.family === b.family
     *                      must be true if and only if conversions between a and b are valid.
     * @type {String}
     */
    get family() {
        return this._family;
    }

    /**
     * @readonly
     * @property {String} - the name of this unit in singular form.
     * @type {String}
     */
    get fullNameSingular() {
        return this._fullNameSingular;
    }

    /**
     * @readonly
     * @property {String} - the name of this unit in multiple form.
     * @type {String}
     */
    get fullNameMultiple() {
        return this._fullNameMultiple;
    }

    /**
     * @readonly
     * @property {String} - the abbreviated name of this unit.
     * @type {String}
     */
    get abbrevName() {
        return this._abbrevName;
    }

    /**
     * Gets the conversion factor to convert from this unit to another unit.
     * @param {WT_Unit} otherUnit - the other unit to which to convert.
     * @returns {Number} the conversion factor.
     */
    getConversionFactor(otherUnit) {
    }

    /**
     * Converts a value of this unit to another unit.
     * @param {Number} value - the value to convert.
     * @param {WT_Unit} otherUnit - the unit to which to convert.
     * @returns {Number} the converted value.
     */
    convert(value, otherUnit) {
        return value * this.getConversionFactor(otherUnit);
    }

    /**
     * Creates a NumberUnit with a specified initial value of this unit type.
     * @param {Number} value - the numeric value of the new NumberUnit.
     * @returns {WT_NumberUnit} a NumberUnit of this unit type.
     */
    createNumber(value) {
        return new WT_NumberUnit(value, this);
    }

    /**
     * Checks whether this unit is equal to an argument. Returns true if and only if the argument is an instance of
     * WT_Unit, belongs to the same family, and has the same full name as this unit.
     * @param {*} other - the comparison.
     * @returns {Boolean} whether this unit is equal to the comparison.
     */
    equals(other) {
        return (other instanceof WT_Unit) && this.family === other.family && this.fullNameSingular === other.fullNameSingular;
    }
}

/**
 * A unit that can be converted to another unit of the same type through multiplication by a conversion factor.
 */
class WT_SimpleUnit extends WT_Unit {
    /**
     * @param {String} family - the family to which the new unit belongs.
     * @param {Number} scaleFactor - the relative scale of one of the new unit compared to one of the standard unit of the
     *                               same family.
     * @param {String} fullNameSingular - the name of the new unit in singular form.
     * @param {String} fullNameMultiple - the name of the new unit in multiple form.
     * @param {String} abbrevName - the abbreviated name of the new unit.
     */
    constructor(family, scaleFactor, fullNameSingular, fullNameMultiple, abbrevName) {
        super(fullNameSingular, fullNameMultiple, abbrevName);

        this._family = family;
        this._scaleFactor = scaleFactor;
    }

    /**
     * Gets the conversion factor to convert from this unit to another unit.
     * @param {WT_Unit} otherUnit - the other unit to which to convert.
     * @returns {Number} the conversion factor.
     */
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

        this._family = WT_Unit.Family.TEMP;
        this._zeroOffset = zeroOffset;
        this._scaleFactor = scaleFactor;
    }

    getConversionFactor(otherUnit) {
        return NaN;
    }

    /**
     * Converts a value of this unit to another unit.
     * @param {Number} value - the value to convert.
     * @param {WT_Unit} otherUnit - the unit to which to convert.
     * @returns {Number} the converted value.
     */
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
     * @param {Iterable<WT_Unit>} numerator - an Iterable of WT_Unit containing all the units in the numerator of the compound unit.
     * @param {Iterable<WT_Unit>} denominator - an Iterable of WT_Unit containing all the units in the denominator of the compound unit.
     * @param {String} fullNameSingular - the name of the unit in singular form.
     * @param {String} fullNameMultiple - the name of the unit in multiple form.
     * @param {String} abbrevName - the abbreviated name of the unit.
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

    /**
     * Gets the conversion factor to convert from this unit to another unit.
     * @param {WT_Unit} otherUnit - the other unit to which to convert.
     * @returns {Number} the conversion factor.
     */
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
WT_Unit.DEGREE = new WT_SimpleUnit(WT_Unit.Family.ANGLE, Math.PI / 180, "degree", "degrees", "°");
WT_Unit.ARC_MIN = new WT_SimpleUnit(WT_Unit.Family.ANGLE, Math.PI / 180 / 60, "minute", "minutes", "'");
WT_Unit.ARC_SEC = new WT_SimpleUnit(WT_Unit.Family.ANGLE, Math.PI / 180 / 3600, "second", "seconds", "\"");

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
WT_Unit.MPM = new WT_CompoundUnit([WT_Unit.METER], [WT_Unit.MINUTE], null, null, "mpm");
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
        this._optsManager = new WT_OptionsManager(this, WT_NumberFormatter.OPTIONS_DEF);

        this._optsManager.setOptions(opts);
    }

    /**
     * @property {Number} - determines the rounding behavior of this formatter. A value of 0 indicates normal rounding.
     *                      A positive value indicates always round up. A negative value indicates always round down.
     * @type {Number}
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
     * Sets this formatter's options en bloc using an options definition object.
     * @param {object} opts - options definition object containing properties to copy to this formatter.
     */
    setOptions(opts) {
        this._optsManager.setOptions(opts);
    }

    _formatNumber(number) {
        let sign = number < 0 ? "-" : "+";
        let abs = Math.abs(number);
        let formatted = abs;
        if (this.precision != 0) {
            formatted = this._roundFunc(abs / this.precision) * this.precision;
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
            formatted = this._roundFunc(abs / precision) * precision;
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

        if (this.showCommas) {
            let parts = formatted.split(".");
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            formatted = parts.join(".");
        }

        return ((this.forceSign || sign === "-") ? sign : "") + formatted;
    }

    _formatUnit(number, unit) {
        let formatted = "";
        if (this.unitShow) {
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

    _getFormattedString(numberUnit, forceUnit, showNumber, showUnit) {
        let unit = numberUnit.unit;
        if (forceUnit && numberUnit.unit.family === forceUnit.family) {
            unit = forceUnit;
        }
        let number = numberUnit.asUnit(unit);
        return (showNumber ? this._formatNumber(number) : "") +
               ((showNumber && showUnit && this.unitSpaceBefore) ? " " : "") +
               (showUnit ? this._formatUnit(number, unit) : "");
    }

    /**
     * Gets a complete formatted string representation of a NumberUnit.
     * @param {WT_NumberUnit} numberUnit - the NumberUnit to format.
     * @param {WT_Unit} [forceUnit] - the unit type to which to convert the NumberUnit before formatting.
     */
    getFormattedString(numberUnit, forceUnit) {
        return this._getFormattedString(numberUnit, forceUnit, true, true);
    }

    /**
     * Gets a string representation of the number part of a NumberUnit.
     * @param {WT_NumberUnit} numberUnit - the NumberUnit to format.
     * @param {WT_Unit} [forceUnit] - the unit type to which to convert the NumberUnit before formatting.
     */
    getFormattedNumber(numberUnit, forceUnit) {
        return this._getFormattedString(numberUnit, forceUnit, true, false);
    }

    /**
     * Gets a string representation of the unit part of a NumberUnit.
     * @param {WT_NumberUnit} numberUnit - the NumberUnit to format.
     * @param {WT_Unit} [forceUnit] - the unit type to which to convert the NumberUnit before formatting.
     */
    getFormattedUnit(numberUnit, forceUnit) {
        return this._getFormattedString(numberUnit, forceUnit, false, true);
    }
}
WT_NumberFormatter.OPTIONS_DEF = {
    precision: {default: 0, auto: true},
    round: {default: 0},
    maxDigits: {default: Infinity, auto: true},
    forceDecimalZeroes: {default: true, auto: true},
    pad: {default: 1, auto: true},
    showCommas: {default: false, auto: true},
    forceSign: {default: false, auto: true},
    unitShow: {default: true, auto: true},
    unitSpaceBefore: {default: true, auto: true},
    unitLong: {default: false, auto: true},
    unitCaps: {default: false, auto: true}
};

/**
 * Generates formatted strings of the HH:MM:SS variety from WT_NumberUnit objects with time unit types.
 */
class WT_TimeFormatter extends WT_NumberFormatter {
    /**
     * @param {object} opts - options definition object containing properties to initialize to the new formatter.
     */
    constructor(opts = {}) {
        super();

        this._optsManager.addOptions(WT_TimeFormatter.OPTIONS_DEF);
        this._optsManager.setOptions(WT_TimeFormatter.OPTIONS_DEFAULT);
        this._optsManager.setOptions(opts);
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

        hours = Math.floor(numberUnit.asUnit(WT_Unit.HOUR));
        if (this.timeFormat != WT_TimeFormatter.Format.MM_SS && !(this.timeFormat == WT_TimeFormatter.Format.HH_MM_OR_MM_SS && hours == 0)) {
            hoursText = hours.toFixed(0);
            hoursText = hoursText.padStart(this.pad, "0");
            let delim = this.delim;
            if (this.delim === WT_TimeFormatter.Delim.COLON_OR_CROSS) {
                if (this.timeFormat === WT_TimeFormatter.Format.HH_MM_OR_MM_SS || this.timeFormat === WT_TimeFormatter.Format.HH_MM ) {
                    delim = delim[1];
                } else {
                    delim = delim[0];
                }
            }
            hoursUnitText = this._formatUnit(hours, WT_Unit.HOUR) + delim;
        }

        let hourSubtract = 0;
        if (hours) {
            hourSubtract = hours;
        }
        if (this.timeFormat == WT_TimeFormatter.Format.HH_MM || (this.timeFormat == WT_TimeFormatter.Format.HH_MM_OR_MM_SS && hours)) {
            min = numberUnit.asUnit(WT_Unit.MINUTE) % 60;
            minText = this._formatNumber(min);
            minUnitText = this._formatUnit(min, WT_Unit.MINUTE);
        } else {
            min = Math.floor(numberUnit.asUnit(WT_Unit.MINUTE) - hourSubtract * 60);
            minText = min.toFixed(0);
            minText = minText.padStart(this._pad, "0");
            let delim = this.delim;
            if (this.delim === WT_TimeFormatter.Delim.COLON_OR_CROSS) {
                delim = delim[0];
            }
            minUnitText = this._formatUnit(min, WT_Unit.MINUTE) + delim;

            sec = numberUnit.asUnit(WT_Unit.SECOND) % 60;
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
/**
 * @enum {Number}
 */
WT_TimeFormatter.Format = {
    HH_MM_SS: 0,
    HH_MM: 1,
    MM_SS: 2,
    HH_MM_OR_MM_SS: 3
};
/**
 * @enum {String}
 */
WT_TimeFormatter.Delim = {
    COLON: ":",
    COLON_OR_CROSS: ":+",
    SPACE: " "
};
WT_TimeFormatter.OPTIONS_DEF = {
    timeFormat: {default: WT_TimeFormatter.Format.HH_MM_SS, auto: true},
    delim: {default: WT_TimeFormatter.Delim.COLON, auto: true}
};
WT_TimeFormatter.OPTIONS_DEFAULT = {
    precision: 1,
    round: 1,
    pad: 2,
    unitShow: false,
    unitSpaceBefore: false
};

/**
 * Generates formatted strings from WT_NumberUnit objects with angle unit types.
 */
class WT_CoordinateFormatter extends WT_NumberFormatter {
    /**
     * @param {Object} opts - options definition object containing properties to initialize to the new formatter.
     */
    constructor(opts = {}) {
        super(opts);

        this._optsManager.addOptions(WT_CoordinateFormatter.OPTIONS_DEF);
        this._optsManager.setOptions(WT_CoordinateFormatter.OPTIONS_DEFAULT);
        this._optsManager.setOptions(opts);
    }

    getFormattedNumber(numberUnit) {
        let savedUnitShow = this.unitShow;
        this.unitShow = false;
        let formatted = this.getFormattedString(numberUnit);
        this.unitShow = savedUnitShow;
        return formatted;
    }

    getFormattedString(numberUnit) {
        let degrees;
        let min;
        let sec;
        let degreesText = "";
        let minText = "";
        let secText = "";
        let degreesUnitText = "";
        let minUnitText = "";
        let secUnitText = "";
        let unitSpace = (this.unitShow && this.unitSpaceBefore) ? " " : "";

        degrees = Math.floor(numberUnit.asUnit(WT_Unit.DEGREE));
        degreesText = degrees.toFixed(0);
        degreesText = degreesText.padStart(this.pad, "0");
        degreesUnitText = this._formatUnit(degrees, WT_Unit.DEGREE) + unitSpace + this.delim;

        if (this.coordFormat == WT_CoordinateFormatter.Format.DEG_MM) {
            min = numberUnit.asUnit(WT_Unit.ARC_MIN) % 60;
            minText = this._formatNumber(min);
            minUnitText = this._formatUnit(min, WT_Unit.ARC_MIN);
        } else {
            min = Math.floor(numberUnit.asUnit(WT_Unit.ARC_MIN) - degrees * 60);
            minText = min.toFixed(0);
            minText = minText.padStart(this._pad, "0");
            minUnitText = this._formatUnit(min, WT_Unit.ARC_MIN) + unitSpace + this.delim;

            sec = numberUnit.asUnit(WT_Unit.ARC_SEC) % 60;
            secText = this._formatNumber(sec);
            secUnitText = this._formatUnit(sec, WT_Unit.ARC_SEC);
        }

        if (secText.replace(/\b0+/, "").substring(0, 2) === "60") {
            secText = this._formatNumber(parseFloat(secText) - 60);
            minText = `${parseInt(minText) + 1}`;
            minText = minText.padStart(this._pad, "0");
        }
        if (minText.replace(/\b0+/, "").substring(0, 2) === "60") {
            if (secText) {
                minText = "00";
            } else {
                minText = this._formatNumber(parseFloat(minText) - 60);
            }
            degreesText = `${(parseInt(degreesText) + 1)}`;
            degreesText = degreesText.padStart(this._pad, "0");
        }

        return degreesText + degreesUnitText + minText + minUnitText + secText + secUnitText;
    }
}
/**
 * @enum {Number}
 */
WT_CoordinateFormatter.Format = {
    DEG_MM: 0,
    DEG_MM_SS: 1
};
WT_CoordinateFormatter.OPTIONS_DEF = {
    coordFormat: {default: WT_CoordinateFormatter.Format.DEG_MM, auto: true},
    delim: {default: "", auto: true}
};
WT_CoordinateFormatter.OPTIONS_DEFAULT = {
    precision: 0.01
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

        this._optsManager = new WT_OptionsManager(this, WT_NumberHTMLFormatter.OPTIONS_DEF);
        this.setOptions(opts);
    }

    /**
     * Sets this formatter's options en bloc using an options definition object.
     * @param {object} opts - options definition object containing properties to copy to this formatter.
     */
    setOptions(opts) {
        this._optsManager.setOptions(opts);
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
     * @param {WT_Unit} [forceUnit] - the unit type to which to convert the NumberUnit before formatting.
     */
    getFormattedNumberHTML(numberUnit, forceUnit) {
        let classText = this._generateClassText(this.classGetter.getNumberClassList(numberUnit, forceUnit));
        return `<span${classText}>${this.numberFormatter.getFormattedNumber(numberUnit, forceUnit)}</span>`;
    }

    /**
     * Gets a html string for displaying the unit part of the text representation of a WT_NumberUnit object.
     * @param {WT_NumberUnit} numberUnit - the NumberUnit to format.
     * @param {WT_Unit} [forceUnit] - the unit type to which to convert the NumberUnit before formatting.
     */
    getFormattedUnitHTML(numberUnit, forceUnit) {
        let classText = this._generateClassText(this.classGetter.getUnitClassList(numberUnit, forceUnit));
        return `<span${classText}>${this.numberFormatter.getFormattedUnit(numberUnit, forceUnit)}</span>`;
    }

    /**
     * Gets a html string for displaying the full text representation of a WT_NumberUnit object.
     * @param {WT_NumberUnit} numberUnit - the NumberUnit to format.
     * @param {WT_Unit} [forceUnit] - the unit type to which to convert the NumberUnit before formatting.
     */
    getFormattedHTML(numberUnit, forceUnit) {
        return this.getFormattedNumberHTML(numberUnit, forceUnit) + (this.numberFormatter.unitShow ? this.numberUnitDelim + this.getFormattedUnitHTML(numberUnit, forceUnit) : "");
    }
}
WT_NumberHTMLFormatter.OPTIONS_DEF = {
    classGetter: {default: {getNumberClassList: (numberUnit, forceUnit) => [], getUnitClassList: (numberUnit, forceUnit) => []}, auto: true},
    numberUnitDelim: {default: " ", auto: true}
};