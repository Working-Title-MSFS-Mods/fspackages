/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

class Name_Z {
    constructor(str, eventHandler = null) {
        this.idLow = 0;
        this.idHigh = 0;
        this.__Type = "Name_Z";
        this.originalStr = str;
        this.RequestNameZ(eventHandler);
    }
    refresh() {
        this.RequestNameZ(null);
    }
    static isValid(a) {
        if (!a)
            return false;
        if (a.str != "") {
            return a.idHigh != 0 || a.idLow != 0;
        }
        return true;
    }
    static compare(a, b) {
        if (!a || !b)
            return false;
        if (!Name_Z.isValid(a))
            console.error("Comparing A an invalid string " + a.originalStr + "/" + a.str);
        if (!Name_Z.isValid(b))
            console.error("Comparing B an invalid string " + b.originalStr + "/" + b.str);
        return a.idLow == b.idLow && a.idHigh == b.idHigh;
    }
    static compareStr(a, b) {
        if (!a)
            return false;
        if (!Name_Z.isValid(a))
            console.error("Comparing A an invalid string " + a.originalStr + "/" + a.str);
        var bAsName = new Name_Z(b);
        return a.idLow == bAsName.idLow && a.idHigh == bAsName.idHigh;
    }
    RequestNameZ(eventHandler = null) {
        if (this.originalStr) {
            if (window.top["g_nameZObject"]) {
                let ret = window.top["g_nameZObject"].GetNameZ(this.originalStr);
                this.idLow = ret.idLow;
                this.idHigh = ret.idHigh;
                this.str = ret.str;
                if (eventHandler) {
                    eventHandler();
                }
            }
            else {
                requestAnimationFrame(this.RequestNameZ.bind(this, eventHandler));
                Coherent.on("Ready", this.RequestNameZ.bind(this, eventHandler));
            }
        }
    }
}