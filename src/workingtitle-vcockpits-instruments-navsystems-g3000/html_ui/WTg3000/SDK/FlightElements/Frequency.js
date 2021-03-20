class WT_Frequency {
    /**
     * @param {Number} bcd - the value of the new frequency in binary-coded decimal format. The expected encoding format
     *                       is 5 nibbles, encoding 5 digits from the tens place to the thousandths place of the megahertz
     *                       value of the frequency.
     */
    constructor(bcd) {
        this._bcd = bcd;
        this._MHz = WT_Frequency.bcdToMHz(bcd);
        this._string = this._buildString();
    }

    _buildString() {
        let string = "1";
        for (let i = 4; i >= 0; i--) {
            string += this.digit(i);
            if (i == 3) {
                string += ".";
            }
        }
        if (string[string.length] === "0") {
            string = string.substring(0, string.length - 1);
        }
        return string;
    }

    /**
     * @readonly
     * @property {Number} bcd - the binary-coded decimal format of this frequency.
     * @type {Number}
     */
    get bcd() {
        return this._bcd;
    }

    /**
     * @readonly
     * @property {Number} bcd16 - the 16-bit binary-coded decimal format of this frequency. This BCD format truncates the
     *                            least significant digit (at the thousandths place).
     * @type {Number}
     */
    get bcd16() {
        return this._bcd >> 4;
    }

    /**
     * @readonly
     * @property {Number} MHz - the megahertz value of this frequency.
     * @type {Number}
     */
    get MHz() {
        return this._MHz;
    }

    /**
     * Gets the digit of this frequency at the specified place. Places are indexed 0 through 5 with 0 being the least
     * significant digit (the thousandths place) and 5 being the most significant digit (the tens place).
     * @param {Number} place - the place index.
     * @returns {Number} a digit.
     */
    digit(place) {
        if (place < 0 || place >= 5) {
            return undefined;
        }

        return (this.bcd >> (place * 4)) & 0xf;
    }

    /**
     * Gets a string representation of this frequency.
     * @returns {String} a string representation of this frequency.
     */
    toString() {
        return this._string;
    }

    static bcdToMHz(bcd16) {
        let MHz = 100;
        let place = 0.001;
        for (let i = 0; i < 5; i++) {
            let digit = (bcd16 >> (i * 4)) & 0xf;
            MHz += digit * place;
            place *= 10;
        }
        return MHz;
    }

    static MHzToBCD(MHz) {
        let number = Math.round((MHz - 100) * 1000);
        let bcd = 0;
        for (let i = 0; i < 5; i++) {
            let digit = number % 10;
            bcd = bcd | (digit << (i * 4));
            number = Math.floor(number / 10);
        }
        return bcd;
    }

    /**
     * Creates a new frequency from a specified megahertz value.
     * @param {Number} MHz - the megahertz value of the new frequency.
     * @returns {WT_Frequency} a frequency.
     */
    static createFromMHz(MHz) {
        return new WT_Frequency(WT_Frequency.MHzToBCD(MHz));
    }
}