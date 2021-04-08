//https://github.com/udivankin/sunrise-sunset
const SunriseSunsetJS = function (t) { "use strict"; var n = 90.8333, e = 15, a = 36e5; function r(t) { return Math.sin(2 * t * Math.PI / 360) } function u(t) { return 360 * Math.acos(t) / (2 * Math.PI) } function i(t) { return Math.cos(2 * t * Math.PI / 360) } function h(t, n) { var e = t % n; return e < 0 ? e + n : e } function o(t, n, o, M, c) { var f, g, s = function (t) { return Math.ceil((t.getTime() - new Date(t.getFullYear(), 0, 1).getTime()) / 864e5) }(c), l = n / e, v = o ? s + (6 - l) / 24 : s + (18 - l) / 24, D = .9856 * v - 3.289, I = h(D + 1.916 * r(D) + .02 * r(2 * D) + 282.634, 360), P = .91764 * (f = I, Math.tan(2 * f * Math.PI / 360)); g = h(g = 360 / (2 * Math.PI) * Math.atan(P), 360), g += 90 * Math.floor(I / 90) - 90 * Math.floor(g / 90), g /= e; var S, w = .39782 * r(I), T = i((S = w, 360 * Math.asin(S) / (2 * Math.PI))), d = (i(M) - w * r(t)) / (T * i(t)), m = h((o ? 360 - u(d) : u(d)) / e + g - .06571 * v - 6.622 - n / e, 24), F = Date.UTC(c.getFullYear(), c.getMonth(), c.getDate()); return new Date(F + m * a) } return t.getSunrise = function (t, e) { var a = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : new Date; return o(t, e, !0, n, a) }, t.getSunset = function (t, e) { var a = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : new Date; return o(t, e, !1, n, a) }, t }({});

class WT_Clock {
    /**
     * @param {rxjs.Observable} update$ 
     * @param {WT_Plane_State} planeState 
     * @param {WT_Settings} settings 
     */
    constructor(update$, planeState, settings) {
        const throttledUpdate$ = update$.pipe(
            rxjs.operators.throttleTime(1000),
            rxjs.operators.share()
        );
        const lowResCoordinates$ = planeState.getLowResCoordinates(WT_Clock.SUN_EVENT_RESOLUTION).pipe(WT_RX.shareReplay());

        // Time
        const timeOffset$ = settings.observe("time_offset").pipe(WT_RX.shareReplay());
        this.absoluteTime = WT_RX.observeSimVar(update$, "E:ABSOLUTE TIME", "seconds");
        this.zuluTime = WT_RX.observeGlobalVar(throttledUpdate$, "ZULU TIME", "seconds");
        this.localTime = this.initLocalTime(throttledUpdate$, timeOffset$);

        // Date
        this.zuluDate = this.initZuluDate(throttledUpdate$);
        this.zuluDateTime = this.initZuluDateTime(this.zuluDate, this.zuluTime);
        this.date = this.initLocalDate(this.zuluDate, timeOffset$);
        this.realDate = this.initRealDate(throttledUpdate$);

        // Sunrise / Sunset
        this.solarTime = this.initSolarTime(lowResCoordinates$, this.zuluDateTime);
        this.sunrise = rxjs.combineLatest(
            lowResCoordinates$,
            this.zuluDate,
            (coordinates, date) => SunriseSunsetJS.getSunrise(coordinates.lat, coordinates.long, date),
        ).pipe(WT_RX.shareReplay());
        this.sunset = rxjs.combineLatest(
            lowResCoordinates$,
            this.zuluDate,
            (coordinates, date) => SunriseSunsetJS.getSunset(coordinates.lat, coordinates.long, date)
        ).pipe(WT_RX.shareReplay());
        this.sunPosition = rxjs.combineLatest(
            this.zuluDateTime,
            lowResCoordinates$,
            (date, coordinates) => SunCalc.getPosition(date, coordinates.lat, coordinates.long)
        );
    }
    initLocalTime(throttledUpdate$, timeOffset$) {
        return rxjs.combineLatest(
            WT_RX.observeGlobalVar(throttledUpdate$, "LOCAL TIME", "seconds"),
            timeOffset$,
            (zuluTime, offset) => (zuluTime + offset + 86400) % 86400
        );
    }
    initSolarTime(lowResCoordinates$, zuluDateTime$) {
        const getSecondsFromMidnight = date => date.getSeconds() + (60 * date.getMinutes()) + (60 * 60 * date.getHours());
        return rxjs.combineLatest(
            lowResCoordinates$,
            zuluDateTime$,
            (coordinates, zuluDateTime) => {
                //https://www.pveducation.org/pvcdrom/properties-of-sunlight/solar-time
                const start = new Date(zuluDateTime.getFullYear(), 0, 0);
                const diff = zuluDateTime - start;
                const d = Math.floor(diff / (1000 * 60 * 60 * 24));

                const b = (360 / 365) * (d - 81) * Math.PI / 180;
                const eot = 9.87 * Math.sin(2 * b) - 7.5 * Math.cos(b) - 1.5 * Math.sin(b);

                return (getSecondsFromMidnight(zuluDateTime) + coordinates.long / 15 * 3600 + eot * 60 + 86400) % 86400;
            }
        ).pipe(
            rxjs.operators.tap(t => console.log(`Solar time: ${((t / 3600)).toFixed(0)}:${((t % 3600) / 60).toFixed(0)}:${(t % 60).toFixed(0)}`))
        );
    }
    initRealDate(throttledUpdate$) {
        return throttledUpdate$.pipe(
            rxjs.operators.map(dt => new Date()),
            rxjs.operators.distinctUntilChanged((a, b) => {
                return a.getDate() == b.getDate() && a.getMonth() == b.getMonth() && a.getFullYear() == b.getFullYear();
            })
        );;
    }
    initLocalDate(zuluDate$, timeOffset$) {
        return rxjs.combineLatest(
            zuluDate$,
            timeOffset$,
            (zuluDate, offset) => new Date(zuluDate.getTime() + offset)
        ).pipe(WT_RX.shareReplay());
    }
    initZuluDate(throttledUpdate$) {
        return rxjs.combineLatest(
            WT_RX.observeSimVar(throttledUpdate$, "E:ZULU DAY OF MONTH", "number"),
            WT_RX.observeSimVar(throttledUpdate$, "E:ZULU MONTH OF YEAR", "number"),
            WT_RX.observeSimVar(throttledUpdate$, "E:ZULU YEAR", "number"),
            (day, month, year) => new Date(Date.UTC(year, month - 1, day))
        ).pipe(WT_RX.shareReplay());
    }
    initZuluDateTime(zuluDate$, zuluTime$) {
        return rxjs.combineLatest(
            zuluDate$,
            zuluTime$,
            (date, time) => new Date(date.getTime() + time * 1000)
        ).pipe(WT_RX.shareReplay());
    }
    getTimer(frequency = 1000) {
        return this.absoluteTime.pipe(
            rxjs.operators.throttleTime(frequency),
            rxjs.operators.pairwise(),
            rxjs.operators.map(([a, b]) => b - a),
            rxjs.operators.filter(delta => delta < (frequency * 2) && delta >= 0), // Values over 2x the frequency probably caused by pausing the game so we should ignore those
            rxjs.operators.scan((previous, current) => previous + current, 0),
        );
    }
}
WT_Clock.SUN_EVENT_RESOLUTION = 20; // How far in NM the plane needs to move before we bother recalculating sunrise/sunset