/**
 * Helper class for executing asynchronous waits.
 */
class WT_Wait {
    static _waitLoop(resolve, reject, callback, timeout, elapsed, dt) {
        elapsed += dt;
        if (elapsed >= timeout) {
            reject(new Error(`Wait timed out after ${elapsed} ms`));
            return;
        }

        if (callback()) {
            resolve();
        } else {
            requestAnimationFrame(WT_Wait._waitLoop.bind(this, resolve, reject, callback, timeout, elapsed));
        }
    }

    /**
     * Waits until a condition has been met.
     * @param {Function} callback - a function which is called with no arguments on every update frame. The
     *                              function should return true if the wait condition has been met and false
     *                              otherwise.
     * @param {Number} [timeout] - the maximum amount of time to wait. If the wait condition has not been met when
     *                           this much time has elapsed, the wait will time out. Defaults to infinity.
     * @returns {Promise} a Promise which resolves when the wait condition is met or is rejected when the wait times
     *                    out.
     */
    static wait(callback, timeout = Infinity) {
        return new Promise((resolve, reject) => {
            WT_Wait._waitLoop(resolve, reject, callback, timeout, 0, 0);
        });
    }
}