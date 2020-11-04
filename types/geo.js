/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

class LatLong {
    constructor(data, long) {
        this.__Type = "LatLong";
        if (isFinite(data) && isFinite(long)) {
            this.lat = data;
            this.long = long;
        }
        else {
            Object.assign(this, data);
        }
    }
    toStringFloat() {
        return this.lat.toFixed(6) + ", " + this.long.toFixed(6);
    }
    toString() {
        return "lat " + this.lat.toFixed(2) + ", long " + this.long.toFixed(2);
    }
    static fromStringFloat(_str) {
        var lwrStr = _str.toLowerCase();
        var splits = lwrStr.split(",");
        if (splits.length >= 3) {
            var lat = parseFloat(splits[0]);
            var long = parseFloat(splits[1]);
            var alt = parseFloat(splits[2]);
            return new LatLongAlt(lat, long, alt);
        }
        else if (splits.length >= 2) {
            var lat = parseFloat(splits[0]);
            var long = parseFloat(splits[1]);
            return new LatLong(lat, long);
        }
        return null;
    }
    latToDegreeString() {
        let tmpLat = Math.min(90, Math.max(-90, this.lat));
        let ns = "N";
        if (tmpLat < 0) {
            ns = "S";
            tmpLat *= -1;
        }
        let latDegree = Math.floor(tmpLat);
        tmpLat -= latDegree;
        let latMinutes = Math.floor(tmpLat * 60);
        tmpLat -= latMinutes / 60;
        let latSeconds = Math.floor(tmpLat * 600);
        return latDegree.toString().padStart(2, "0") +
            latMinutes.toString().padStart(2, "0") + "." +
            latSeconds.toString() + ns;
    }
    longToDegreeString() {
        let tmpLong = this.long;
        while (tmpLong > 180) {
            tmpLong -= 360;
        }
        while (tmpLong < -180) {
            tmpLong += 360;
        }
        let we = "E";
        if (tmpLong < 0) {
            we = "W";
            tmpLong *= -1;
        }
        let longDegree = Math.floor(tmpLong);
        tmpLong -= longDegree;
        let longMinutes = Math.floor(tmpLong * 60);
        tmpLong -= longMinutes / 60;
        let longSeconds = Math.floor(tmpLong * 600);
        return longDegree.toString().padStart(3, "0") +
            longMinutes.toString().padStart(2, "0") + "." +
            longSeconds.toString() + we;
    }
    toDegreeString() {
        let tmpLat = Math.min(90, Math.max(-90, this.lat));
        let ns = "N";
        if (tmpLat < 0) {
            ns = "S";
            tmpLat *= -1;
        }
        let latDegree = Math.floor(tmpLat);
        tmpLat -= latDegree;
        let latMinutes = Math.floor(tmpLat * 60);
        tmpLat -= latMinutes / 60;
        let latSeconds = Math.floor(tmpLat * 600);
        let tmpLong = this.long;
        while (tmpLong > 180) {
            tmpLong -= 360;
        }
        while (tmpLong < -180) {
            tmpLong += 360;
        }
        let we = "E";
        if (tmpLong < 0) {
            we = "W";
            tmpLong *= -1;
        }
        let longDegree = Math.floor(tmpLong);
        tmpLong -= longDegree;
        let longMinutes = Math.floor(tmpLong * 60);
        tmpLong -= longMinutes / 60;
        let longSeconds = Math.floor(tmpLong * 600);
        return ns + latDegree.toString().padStart(2, "0") + "°" +
            latMinutes.toString().padStart(2, "0") + "." +
            latSeconds.toString() + " " +
            we + longDegree.toFixed(0).padStart(3, "0") + "°" +
            longMinutes.toString().padStart(2, "0") + "." +
            longSeconds.toString();
    }
    toShortDegreeString() {
        let tmpLat = Math.min(90, Math.max(-90, this.lat));
        let ns = "N";
        if (tmpLat < 0) {
            ns = "S";
            tmpLat *= -1;
        }
        let latDegree = Math.floor(tmpLat);
        tmpLat -= latDegree;
        let latMinutes = Math.floor(tmpLat * 60);
        tmpLat -= latMinutes / 60;
        let latSeconds = Math.floor(tmpLat * 600);
        let tmpLong = this.long;
        while (tmpLong > 180) {
            tmpLong -= 360;
        }
        while (tmpLong < -180) {
            tmpLong += 360;
        }
        let we = "E";
        if (tmpLong < 0) {
            we = "W";
            tmpLong *= -1;
        }
        let longDegree = Math.floor(tmpLong);
        tmpLong -= longDegree;
        let longMinutes = Math.floor(tmpLong * 60);
        tmpLong -= longMinutes / 60;
        let longSeconds = Math.floor(tmpLong * 600);
        return latDegree.toString().padStart(2, "0") +
            latMinutes.toString().padStart(2, "0") + "." +
            latSeconds.toString() + ns +
            longDegree.toFixed(0).padStart(3, "0") +
            longMinutes.toString().padStart(2, "0") + "." +
            longSeconds.toString() + we;
    }
}

class LatLongAlt {
    constructor(data, long, alt) {
        this.alt = 0;
        this.__Type = "LatLongAlt";
        if (isFinite(data) && isFinite(long)) {
            this.lat = data;
            this.long = long;
            if (isFinite(alt)) {
                this.alt = alt;
            }
        }
        else {
            Object.assign(this, data);
        }
    }
    toLatLong() {
        return new LatLong(this.lat, this.long);
    }
    toStringFloat() {
        var res = this.lat.toFixed(6) + ", " + this.long.toFixed(6) + ", ";
        if (isFinite(this.alt))
            res += this.alt.toFixed(1);
        else
            res += "NaN";
        return res;
    }
    toString() {
        var res = "lat " + this.lat.toFixed(2) + ", long " + this.long.toFixed(2) + ", alt ";
        if (isFinite(this.alt))
            res += this.alt.toFixed(2);
        else
            res += "NaN";
        return res;
    }
    latToDegreeString() {
        let tmpLat = Math.min(90, Math.max(-90, this.lat));
        let ns = "N";
        if (tmpLat < 0) {
            ns = "S";
            tmpLat *= -1;
        }
        let latDegree = Math.floor(tmpLat);
        tmpLat -= latDegree;
        let latMinutes = Math.floor(tmpLat * 60);
        tmpLat -= latMinutes / 60;
        let latSeconds = Math.floor(tmpLat * 600);
        return latDegree.toString().padStart(2, "0") +
            latMinutes.toString().padStart(2, "0") + "." +
            latSeconds.toString() + ns;
    }
    longToDegreeString() {
        let tmpLong = this.long;
        while (tmpLong > 180) {
            tmpLong -= 360;
        }
        while (tmpLong < -180) {
            tmpLong += 360;
        }
        let we = "E";
        if (tmpLong < 0) {
            we = "W";
            tmpLong *= -1;
        }
        let longDegree = Math.floor(tmpLong);
        tmpLong -= longDegree;
        let longMinutes = Math.floor(tmpLong * 60);
        tmpLong -= longMinutes / 60;
        let longSeconds = Math.floor(tmpLong * 600);
        return longDegree.toString().padStart(3, "0") +
            longMinutes.toString().padStart(2, "0") + "." +
            longSeconds.toString() + we;
    }
    toDegreeString() {
        let tmpLat = Math.min(90, Math.max(-90, this.lat));
        let ns = "N";
        if (tmpLat < 0) {
            ns = "S";
            tmpLat *= -1;
        }
        let latDegree = Math.floor(tmpLat);
        tmpLat -= latDegree;
        let latMinutes = Math.floor(tmpLat * 60);
        tmpLat -= latMinutes / 60;
        let latSeconds = Math.floor(tmpLat * 600);
        let tmpLong = this.long;
        while (tmpLong > 180) {
            tmpLong -= 360;
        }
        while (tmpLong < -180) {
            tmpLong += 360;
        }
        let we = "E";
        if (tmpLong < 0) {
            we = "W";
            tmpLong *= -1;
        }
        let longDegree = Math.floor(tmpLong);
        tmpLong -= longDegree;
        let longMinutes = Math.floor(tmpLong * 60);
        tmpLong -= longMinutes / 60;
        let longSeconds = Math.floor(tmpLong * 600);
        return ns + latDegree.toString().padStart(2, "0") + "°" +
            latMinutes.toString().padStart(2, "0") + "." +
            latSeconds.toString() + " " +
            we + longDegree.toFixed(0).padStart(3, "0") + "°" +
            longMinutes.toString().padStart(2, "0") + "." +
            longSeconds.toString();
    }
}