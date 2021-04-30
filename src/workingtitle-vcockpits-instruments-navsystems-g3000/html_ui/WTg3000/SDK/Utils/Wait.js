/**
 * Helper class for executing asynchronous waits.
 */
class WT_Wait {
    /**
     * Waits a specified amount of time.
     * @param {Number} timeout - the amount of time to wait in milliseconds.
     * @returns {Promise<void>} a Promise which resolves when the specified amount of time has elapsed.
     */
    static wait(timeout) {
        return new Promise(resolve => setTimeout(resolve, timeout));
    }

    static _awaitLoop(resolve, reject, callback, thisArg, timeout, elapsed, dt) {
        elapsed += dt;
        if (elapsed >= timeout) {
            reject(new Error(`Wait timed out after ${elapsed} ms`));
            return;
        }

        if (callback.apply(thisArg)) {
            resolve();
        } else {
            requestAnimationFrame(WT_Wait._awaitLoop.bind(this, resolve, reject, callback, thisArg, timeout, elapsed));
        }
    }

    /**
     * Waits until a condition has been met as specified by a callback function.
     * @param {() => Boolean} callback - a function which is called with no arguments on every update frame. The
     *                                   function should return true if the wait condition has been met and false
     *                                   otherwise.
     * @param {Object} [thisArg] - the object to use as this inside callback. Defaults to undefined.
     * @param {Number} [timeout] - the maximum amount of time to wait in milliseconds. If the wait condition has not
     *                             been met when this much time has elapsed, the wait will time out. Defaults to
     *                             infinity.
     * @returns {Promise} a Promise which resolves when the wait condition is met or is rejected when the wait times
     *                    out.
     */
    static awaitCallback(callback, thisArg, timeout = Infinity) {
        return new Promise((resolve, reject) => {
            WT_Wait._awaitLoop(resolve, reject, callback, thisArg, timeout, 0, 0);
        });
    }

    /**
     * Waits until a generator function finishes.
     * @param {Object} thisArg - the value to use as this for each invocation of generator.
     * @param {*} _arguments - arguments to pass to the generator function.
     * @param {*} P
     * @param {GeneratorFunction} generator - a generator function
     * @returns {Promise} a Promise that resolves with the return value of the generator function when it finishes. If
     *                    the generator was unable to finish, the Promise will be rejected.
     */
    static awaitGenerator(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }
}