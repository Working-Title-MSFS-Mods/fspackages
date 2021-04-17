class WT_Frequency {
    /**
     * @param {Number} hertz - the value of the new frequency in hertz.
     * @param {WT_Frequency.Prefix} [prefix] - the metric prefix of the frequency value to use. Defaults to
     *                                         WT_Frequency.Prefix.Hz.
     */
    constructor(hertz, prefix = WT_Frequency.Prefix.Hz) {
        this._hertz = hertz * prefix;
    }

    /**
     * Gets the hertz value of this frequency.
     * @param {WT_Frequency.Prefix} [prefix] - the metric prefix of the frequency value to return. Defaults to
     *                                         WT_Frequency.Prefix.Hz.
     * @returns {Number} the hertz (with optional prefix) value of this frequency.
     */
    hertz(prefix = WT_Frequency.Prefix.Hz) {
        return this._hertz / prefix;
    }

    /**
     * Gets the BCD16 binary-coded decimal format of this frequency. This BCD format encodes the 10^7 to the 10^4
     * places. The digit at the 10^8 place is assumed to be 1, and all other digits that are not explicitly encoded
     * are assumed to be 0.
     * @returns {Number} this frequency in BCD16 format.
     */
    bcd16() {
        return WT_Frequency.hertzToBCD16(this._hertz);
    }

    /**
     * Gets the BCD32 binary-coded decimal format of this frequency. This BCD format encodes the 10^6 to the 10^-1
     * places. All digits that are not explicitly encoded are assumed to be 0.
     * @returns {Number} this frequency in BCD32 format.
     */
    bcd32() {
        return WT_Frequency.hertzToBCD32(this._hertz);
    }

    /**
     * Gets the digit of this frequency at the specified place. Places are indexed 0 through 8 with 0 being the least
     * significant digit (the 10^0 place) and 8 being the most significant digit (the 10^8 place).
     * @param {Number} place - the place index.
     * @returns {Number} a digit.
     */
    digit(place) {
        if (place < 0 || place > 8) {
            return undefined;
        }

        let digits = this._hertz.toFixed(0).padStart(9, "0");
        return parseInt(digits[digits.length - place]);
    }

    /**
     * Checks whether this frequency is equal to the supplied argument. Returns true if and only if the argument is of
     * type WT_Frequency and has the same frequency hertz value.
     * @param {*} other - the argument to compare to this frequency.
     * @returns {Boolean} whether this frequency is equal to the supplied argument.
     */
    equals(other) {
        return other instanceof WT_Frequency && this.hertz() === other.hertz();
    }

    /**
     * Gets a string representation of this frequency. The string is this frequency's hertz value in decimal format.
     * @param {WT_Frequency.Prefix} [prefix] - the metric prefix of the frequency value to represent. Defaults to
     *                                         WT_Frequency.Prefix.Hz.
     * @returns {String} a string representation of this frequency.
     */
    toString(prefix = WT_Frequency.Prefix.Hz) {
        let place = Math.log10(prefix);
        let string = this._hertz.toFixed(0);
        let decimalPos = string.length - place;
        string = string.substring(0, decimalPos) + "." + string.substring(decimalPos);
        return prefix > 0 ? string.replace(/0+$/, "").replace(/\.$/, "") : string;
    }

    /**
     * Converts a BCD16-encoded frequency to hertz.
     * @param {Number} bcd - a BCD16-encoded frequency.
     * @param {WT_Frequency.Prefix} [prefix] - the metric prefix of the frequency value to return. Defaults to
     *                                         WT_Frequency.Prefix.Hz.
     * @returns {Number} the hertz (with optional prefix) value of the frequency.
     */
    static bcd16ToHertz(bcd, prefix = WT_Frequency.Prefix.Hz) {
        let hertz = 100000000;
        let place = 10000;
        for (let i = 0; i < 4; i++) {
            let digit = (bcd >> (i * 4)) & 0xf;
            hertz += digit * place;
            place *= 10;
        }
        return hertz / prefix;
    }

    /**
     * Converts a BCD32-encoded frequency to hertz.
     * @param {Number} bcd - a BCD32-encoded frequency.
     * @param {WT_Frequency.Prefix} [prefix] - the metric prefix of the frequency value to return. Defaults to
     *                                         WT_Frequency.Prefix.Hz.
     * @returns {Number} the hertz (with optional prefix) value of the frequency.
     */
     static bcd32ToHertz(bcd, prefix = WT_Frequency.Prefix.Hz) {
        let hertz = 0;
        let place = 1;
        for (let i = 0; i < 8; i++) {
            let digit = (bcd >> (i * 4)) & 0xf;
            hertz += digit * place;
            place *= 10;
        }
        return hertz / prefix;
    }

    /**
     * Converts a hertz value to the BCD16 format. The BCD16 format is a 4-nibble binary-coded decimal encoding digits
     * from the 10^4 place to the 10^7 place. The digit at the 10^8 place is assumed to be 1. All digits not explicitly
     * encoded are assumed to be 0.
     * @param {Number} hertz - a hertz value.
     * @param {WT_Frequency.Prefix} [prefix] - the metric prefix of the frequency value to convert. Defaults to
     *                                         WT_Frequency.Prefix.Hz.
     * @returns {Number} the BCD16-encoded value of the frequency.
     */
    static hertzToBCD16(hertz, prefix = WT_Frequency.Prefix.Hz) {
        let number = Math.round(hertz * prefix / 10000);
        let bcd = 0;
        for (let i = 0; i < 4; i++) {
            let digit = number % 10;
            bcd = bcd | (digit << (i * 4));
            number = Math.floor(number / 10);
        }
        return bcd;
    }

    /**
     * Converts a hertz value to the BCD32 format. The BCD32 format is a 8-nibble binary-coded decimal encoding digits
     * from the 10^0 place to the 10^7 place. All digits not explicitly encoded are assumed to be 0.
     * @param {Number} hertz - a hertz value.
     * @param {WT_Frequency.Prefix} [prefix] - the metric prefix of the frequency value to convert. Defaults to
     *                                         WT_Frequency.Prefix.Hz.
     * @returns {Number} the BCD16-encoded value of the frequency.
     */
     static hertzToBCD32(hertz, prefix = WT_Frequency.Prefix.Hz) {
        let number = Math.round(hertz * prefix) * 10;
        let bcd = 0;
        for (let i = 0; i < 8; i++) {
            let digit = number % 10;
            bcd = bcd | (digit << (i * 4));
            number = Math.floor(number / 10);
        }
        return bcd;
    }
}
/**
 * @enum {Number}
 */
WT_Frequency.Prefix = {
    Hz: 1,
    KHz: 1000,
    MHz: 1000000
};