class WT_Frequency {
    /**
     * @param {Number} bcd - the value of the new frequency in binary-coded decimal format. The expected encoding format
     *                       is 8 nibbles, encoding 8 digits from the 10^1 place to the 10^8 place.
     */
    constructor(bcd) {
        this._bcd = bcd;
    }

    /**
     * @readonly
     * @property {Number} bcd - the 8-nibble binary-coded decimal format of this frequency.
     * @type {Number}
     */
    get bcd() {
        return this._bcd;
    }

    /**
     * @readonly
     * @property {Number} bcd16 - the 16-bit binary-coded decimal format of this frequency. This BCD format encodes the
     *                            10^7 to the 10^4 places. The digit at the 10^8 place is assumed to be 1, and all other
     *                            digits that are not explicitly encoded are assumed to be 0.
     * @type {Number}
     */
    get bcd16() {
        return (this._bcd >> 12) & 0xffff;
    }

    /**
     * @readonly
     * @property {Number} bcd32 - the 32-bit binary-coded decimal format of this frequency. This BCD format encodes the
     *                            10^7 to the 10^0 places. All digits that are not explicitly encoded are assumed to be
     *                            0.
     * @type {Number}
     */
    get bcd32() {
        return (this._bcd & 0xffffffff) >> 4;
    }

    /**
     * Gets the hertz value of this frequency.
     * @param {Number} [prefix] - a numeric value representing the exponent of the metric prefix of the frequency value
     *                            to return (0 for no prefix, 3 for kilo, 6 for mega). Defaults to 0.
     * @returns {Number} the hertz (with optional prefix) value of this frequency.
     */
    hertz(prefix) {
        return WT_Frequency.bcdToHertz(this.bcd, prefix);
    }

    /**
     * Gets the digit of this frequency at the specified place. Places are indexed 0 through 7 with 0 being the least
     * significant digit (the 10^1 place) and 7 being the most significant digit (the 10^8 place).
     * @param {Number} place - the place index.
     * @returns {Number} a digit.
     */
    digit(place) {
        if (place < 0 || place >= 8) {
            return undefined;
        }

        return (this.bcd >> (place * 4)) & 0xf;
    }

    /**
     * Gets a string representation of this frequency. The string is this frequency's hertz value in decimal format.
     * @param {Number} [prefix] - a numeric value representing the exponent of the metric prefix of the hertz value
     *                            to use as the reference for the string representation (0 for no prefix, 3 for
     *                            kilo, 6 for mega). Defaults to 0.
     * @returns {String} a string representation of this frequency.
     */
    toString(prefix) {
        prefix = prefix ? prefix : 0;
        let string = "";
        for (let i = 7; i >= 0; i--) {
            string += this.digit(i);
            if (i === prefix - 1) {
                string += ".";
            }
        }
        string += "0";
        return prefix > 0 ? string.replace(/0+$/, "").replace(/\.$/, "") : string;
    }

    /**
     * Converts an 8-nibble binary-coded decimal to its equivalent value in hertz.
     * @param {Number} bcd - an 8-nibble binary-coded decimal encoding digits from the 10^1 place to the 10^8 place.
     *                       The ones (10^0) place is assumed to be zero.
     * @param {Number} [prefix] - a numeric value representing the exponent of the metric prefix of the frequency value
     *                            to return (0 for no prefix, 3 for kilo, 6 for mega). Defaults to 0.
     * @returns {Number} the hertz (with optional prefix) value of the frequency.
     */
    static bcdToHertz(bcd, prefix) {
        let hertz = 0;
        let place = 10;
        for (let i = 0; i < 8; i++) {
            let digit = (bcd >> (i * 4)) & 0xf;
            hertz += digit * place;
            place *= 10;
        }
        return hertz / Math.pow(10, prefix ? prefix : 0);
    }

    /**
     * Converts a hertz value to an 8-nibble binary-coded decimal encoding digits from the 10^1 place to the 10^8 place.
     * @param {Number} hertz - a hertz value.
     * @param {Number} [prefix] - a numeric value representing the exponent of the metric prefix of the hertz frequency
     *                            value (0 for no prefix, 3 for kilo, 6 for mega). Defaults to 0.
     * @returns {Number} the 8-nibble binary-coded decimal value of the frequency.
     */
    static hertzToBCD(hertz, prefix) {
        let number = Math.round(hertz * Math.pow(10, (prefix ? prefix : 0) - 1));
        let bcd = 0;
        for (let i = 0; i < 8; i++) {
            let digit = number % 10;
            bcd = bcd | (digit << (i * 4));
            number = Math.floor(number / 10);
        }
        return bcd;
    }

    /**
     * Creates a new frequency from a specified hertz value.
     * @param {Number} hertz - the hertz value of the new frequency.
     * @param {Number} [prefix] - a numeric value representing the exponent of the metric prefix of the hertz frequency
     *                            value (0 for no prefix, 3 for kilo, 6 for mega). Defaults to 0.
     * @returns {WT_Frequency} a frequency.
     */
    static createFromHz(hertz, prefix) {
        return new WT_Frequency(WT_Frequency.hertzToBCD(hertz, prefix));
    }
}
/**
 * @enum {Number}
 */
WT_Frequency.Prefix = {
    Hz: 0,
    KHz: 3,
    MHz: 6
};