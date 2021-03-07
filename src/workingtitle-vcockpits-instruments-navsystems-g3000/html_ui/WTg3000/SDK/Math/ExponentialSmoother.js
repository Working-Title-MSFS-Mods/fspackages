/**
 * Applies time-weighted exponential smoothing (i.e. an exponential moving average) to a sequence of raw values. When
 * a new raw value is added to the sequence, it and the last smoothed value are weighted according to the time elapsed
 * since the last smoothed value was calculated (i.e. since the last raw value was added) and averaged. The calculation
 * of the weighting is such that the weight of each raw value in the sequence decays exponentially with the "age"
 * (i.e. time elapsed between when that value was added to the sequence and when the latest value was added to the
 * sequence) of the value.
 */
class WT_ExponentialSmoother {
    /**
     *
     * @param {Number} constant - the new smoother's smoothing constant. The larger the constant, the greater the
     *                            smoothing effect.
     * @param {Number} [initial] - the initial smoothed value of the new smoother. Defaults to null.
     * @param {Number} [dtThreshold] - the elapsed time threshold above which the new smoother will not smooth a new
     *                                 raw value. Defaults to 1 second.
     */
    constructor(constant, initial = null, dtThreshold = WT_ExponentialSmoother.DT_THRESHOLD_DEFAULT) {
        this._lastValue = initial;
        this._constant = constant;
        this._dtThreshold = dtThreshold;
    }

    /**
     * @readonly
     * @property {Number} constant - this smoother's smoothing constant.
     * @type {Number}
     */
    get constant() {
        return this._constant;
    }

    /**
     * @readonly
     * @property {Number} dtThreshold - the elapsed time threshold above which this smoother will not smooth a new raw
     *                                  value.
     *
     * @type {Number}
     */
    get dtThreshold() {
        return this._dtThreshold;
    }

    _calculateFactor(dt) {
        if (dt > this.dtThreshold) {
            return 1;
        } else {
            return Math.pow(0.5, dt / this.constant);
        }
    }

    _smooth(value, factor) {
        return value * (1 - factor) + this.last() * factor;
    }

    /**
     * Gets the last smoothed value.
     * @returns {Number} the last smoothed value, or null if none exists.
     */
    last() {
        return this._lastValue;
    }

    /**
     * Adds a new raw value and gets the next smoothed value. If the new raw value is the first to be added since this
     * smoother was created or reset with no initial smoothed value, the returned smoothed value will be equal to the
     * raw value.
     * @param {Number} raw - the new raw value.
     * @param {Number} dt - the elapsed time, in seconds, since the last raw value was added.
     * @returns {Number} the next smoothed value.
     */
    next(raw, dt) {
        let next;
        if (this.last() !== null) {
            let factor = this._calculateFactor(dt);
            next = this._smooth(raw, factor);
        } else {
            next = raw;
        }
        this._lastValue = next;
        return next;
    }

    /**
     * Resets the "history" of this smoother and optionally sets the initial smoothed value.
     * @param {Number} [value] - the new initial smoothed value. Defaults to null.
     */
    reset(value = null) {
        this._lastValue = value;
    }
}
WT_ExponentialSmoother.DT_THRESHOLD_DEFAULT = 1;