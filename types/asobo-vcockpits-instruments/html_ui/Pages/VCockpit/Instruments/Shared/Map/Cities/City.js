/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

class City {
    constructor() {
        this.size = 2;
    }
    toString() {
        return "[" + this.name + "] " + fastToFixed(this.lat, 5) + ":" + fastToFixed(this.long, 6);
    }
}
//# sourceMappingURL=City.js.map