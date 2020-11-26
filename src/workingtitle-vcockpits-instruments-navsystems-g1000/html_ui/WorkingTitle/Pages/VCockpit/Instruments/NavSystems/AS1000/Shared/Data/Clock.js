//https://github.com/udivankin/sunrise-sunset
var SunriseSunsetJS = function (t) { "use strict"; var n = 90.8333, e = 15, a = 36e5; function r(t) { return Math.sin(2 * t * Math.PI / 360) } function u(t) { return 360 * Math.acos(t) / (2 * Math.PI) } function i(t) { return Math.cos(2 * t * Math.PI / 360) } function h(t, n) { var e = t % n; return e < 0 ? e + n : e } function o(t, n, o, M, c) { var f, g, s = function (t) { return Math.ceil((t.getTime() - new Date(t.getFullYear(), 0, 1).getTime()) / 864e5) }(c), l = n / e, v = o ? s + (6 - l) / 24 : s + (18 - l) / 24, D = .9856 * v - 3.289, I = h(D + 1.916 * r(D) + .02 * r(2 * D) + 282.634, 360), P = .91764 * (f = I, Math.tan(2 * f * Math.PI / 360)); g = h(g = 360 / (2 * Math.PI) * Math.atan(P), 360), g += 90 * Math.floor(I / 90) - 90 * Math.floor(g / 90), g /= e; var S, w = .39782 * r(I), T = i((S = w, 360 * Math.asin(S) / (2 * Math.PI))), d = (i(M) - w * r(t)) / (T * i(t)), m = h((o ? 360 - u(d) : u(d)) / e + g - .06571 * v - 6.622 - n / e, 24), F = Date.UTC(c.getFullYear(), c.getMonth(), c.getDate()); return new Date(F + m * a) } return t.getSunrise = function (t, e) { var a = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : new Date; return o(t, e, !0, n, a) }, t.getSunset = function (t, e) { var a = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : new Date; return o(t, e, !1, n, a) }, t }({});

class WT_Clock {
    constructor() {
        this.localTime = new Subject(SimVar.GetGlobalVarValue("LOCAL TIME", "seconds"));
        this.zuluTime = new Subject(SimVar.GetGlobalVarValue("ZULU TIME", "seconds"));
    }
    update(dt) {
        if (this.localTime.hasSubscribers())
            this.localTime.value = SimVar.GetGlobalVarValue("LOCAL TIME", "seconds");
        if (this.zuluTime.hasSubscribers())
            this.zuluTime.value = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
    }
    formatTime() {

    }
    getPlaneCoordinates() {
        const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
        const long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
        return new LatLong(lat, long);
    }
    getCurrentDate() {
        let month = SimVar.GetSimVarValue("E:ZULU MONTH OF YEAR", "number");
        let day = SimVar.GetSimVarValue("E:ZULU DAY OF MONTH", "number");
        let year = SimVar.GetSimVarValue("E:ZULU YEAR", "number");
        return new Date(year, month - 1, day);
    }
    /**
     * @param {LatLong} coordinates 
     */
    getSunrise(coordinates) {
        coordinates = coordinates || this.getPlaneCoordinates();
        return SunriseSunsetJS.getSunrise(coordinates.lat, coordinates.long, this.getCurrentDate());
    }
    /**
     * @param {LatLong} coordinates 
     */
    getSunset(coordinates) {
        coordinates = coordinates || this.getPlaneCoordinates();
        return SunriseSunsetJS.getSunset(coordinates.lat, coordinates.long, this.getCurrentDate());
    }
}