/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

const Avionics = {}

Avionics.Utils = class Utils {
    static DEG2RAD = 0.017453292519943295
    static RAD2DEG = 57.29577951308232
    static runwayRegex = /([0-9]+)|([a-zA-Z]+)|(\s+)/g

    static make_bcd16(arg) {
        var iarg = Math.floor(arg / 10000.0 - 10000);
        arg = (iarg % 10) + ((iarg / 10 % 10) << 4) + ((iarg / 100 % 10) << 8) + ((iarg / 1000 % 10) << 12);
        return arg;
    }

    static make_adf_bcd32(arg) {
        let iarg = Math.floor(arg / (1000 / 10));
        arg = ((iarg % 10) + ((iarg / 10 % 10) << 4) + ((iarg / 100 % 10) << 8) + ((iarg / 1000 % 10) << 12) + ((iarg / 10000 % 10) << 16)) << 12;
        return arg;
    }

    static make_xpndr_bcd16(arg) {
        let iff = new Array();
        let sliced = ("0000" + arg).slice(-4);
        for (let i = 0; i < sliced.length; i++) {
            iff.push(parseInt(sliced.charAt(i)));
        }
        var code = iff[0] * 4096 + iff[1] * 256 + iff[2] * 16 + iff[3];
        return code;
    }

    static diffAndSet(_element, _newValue) {
        if (_element && _element.innerHTML != _newValue) {
            _element.innerHTML = _newValue;
        }
    }

    static diffAndSetAttribute(_element, _attribute, _newValue) {
        if (_element && _element.getAttribute(_attribute) != _newValue) {
            _element.setAttribute(_attribute, _newValue);
        }
    }

    static bearingDistanceToCoordinates(bearing, distance, referentialLat, referentialLong) {
        let deltaLat = distance * Math.cos(bearing * Utils.DEG2RAD) / 60;
        let deltaLong = distance * Math.sin(bearing * Utils.DEG2RAD) / 60 / Math.cos(referentialLat * Utils.DEG2RAD);
        return new LatLongAlt(referentialLat + deltaLat, referentialLong + deltaLong);
    }

    static computeDistance(from, to) {
        let f = Math.PI / 180;
        var a = 0.5 - Math.cos((to.lat - from.lat) * f) / 2 + Math.cos(from.lat * f) * Math.cos(to.lat * f) * (1 - Math.cos((to.long - from.long) * f)) / 2;
        return 6880.126 * Math.asin(Math.sqrt(a));
    }

    static computeGreatCircleHeading(lla0, lla1) {
        let lat0 = lla0.lat / 180 * Math.PI;
        let lon0 = lla0.long / 180 * Math.PI;
        let lat1 = lla1.lat / 180 * Math.PI;
        let lon1 = lla1.long / 180 * Math.PI;
        let dlon = lon1 - lon0;
        let cos_lat1 = Math.cos(lat1);
        let x = Math.sin(lat1 - lat0);
        let sin_lon_2 = Math.sin(dlon / 2.0);
        x += sin_lon_2 * sin_lon_2 * 2.0 * Math.sin(lat0) * cos_lat1;
        let heading = Math.atan2(cos_lat1 * Math.sin(dlon), x);
        if (heading < 0) {
            heading += 2 * Math.PI;
        }
        return heading / Math.PI * 180;
    }

    static computeGreatCircleDistance(lla0, lla1) {
        let lat0 = lla0.lat / 180 * Math.PI;
        let lon0 = lla0.long / 180 * Math.PI;
        let lat1 = lla1.lat / 180 * Math.PI;
        let lon1 = lla1.long / 180 * Math.PI;
        let dlon = lon1 - lon0;
        let cos_lat0 = Math.cos(lat0);
        let cos_lat1 = Math.cos(lat1);
        let a1 = Math.sin((lat1 - lat0) / 2);
        let a2 = Math.sin(dlon / 2);
        return Math.asin(Math.sqrt(a1 * a1 + cos_lat0 * cos_lat1 * a2 * a2)) * 6880.126;
    }

    static lerpAngle(from, to, d) {
        if (from * to > 0) {
            return from * (1 - d) + to * d;
        }
        let neg = (from < 0 || to < 0);
        from = (from + 360) % 360;
        to = (to + 360) % 360;
        if (from - to > 180) {
            from -= 360;
        }
        if (to - from > 180) {
            to -= 360;
        }
        let lerpt = from * (1 - d) + to * d;
        if (neg) {
            if (lerpt > 180) {
                lerpt -= 360;
            }
        }
        return lerpt;
    }

    static meanAngle(a, b) {
        return Utils.lerpAngle(a, b, 0.5);
    }

    static angleDiff(a, b) {
        let diff = b - a;
        while (diff > 180) {
            diff -= 360;
        }
        while (diff <= -180) {
            diff += 360;
        }
        return diff;
    }

    static fmod(a, b) {
        let mod = Number((a / b).toPrecision(8));
        mod = Number((Math.floor(mod) * b).toPrecision(8));
        mod = Number((a - mod).toPrecision(8));
        return mod;
    }

    static formatRunway(_designation) {
        var splittedArray = _designation.match(Utils.runwayRegex);
        if (splittedArray == null)
            return "";
        var res = "";
        for (let i = 0; i < splittedArray.length; i++) {
            if (!isNaN(parseInt(splittedArray[i], 10)))
                res += splittedArray[i].padStart(2, "0");
            else
                res += splittedArray[i];
        }
        return res;
    }
}

Avionics.SVG = class SVG {
    static NS = "http://www.w3.org/2000/svg"

    static InlineSvg(url, image) {
        let request = new XMLHttpRequest();
        request.onreadystatechange = () => {
            if (request.readyState === 4 && request.status === 200) {
                image.innerHTML = request.responseText;
            }
        };
        request.open("GET", url);
        request.send();
    }

    static computeDashLine(_startX, _startY, _length, _steps, _width, _color) {
        let line = document.createElementNS(Avionics.SVG.NS, "g");
        let reverse = false;
        if (_length < 0)
            reverse = true;
        let padding = Math.abs(_length) / _steps;
        for (let i = 0; i < _steps; i++) {
            let h = (padding * 0.5);
            let y;
            if (reverse)
                y = _startY - (i * padding) - h;
            else
                y = _startY + (i * padding);
            let rect = document.createElementNS(Avionics.SVG.NS, "rect");
            rect.setAttribute("x", (_startX - _width * 0.5).toString());
            rect.setAttribute("y", y.toString());
            rect.setAttribute("width", _width.toString());
            rect.setAttribute("height", h.toString());
            rect.setAttribute("fill", _color.toString());
            line.appendChild(rect);
        }
        return line;
    }
}

Avionics.SVGGraduation = class SVGGraduation {
}

Avionics.Scroller = class Scroller {
    constructor(_nbItems, _increment, _canBeNegative = false, _moduloValue = 1, _notched = 0) {
        this.offsetY = 0;
        this._nbItems = 0;
        this._increment = 0;
        this._canBeNegative = false;
        this._moduloValue = 1;
        this._notched = 0;
        this._baseValue = 0;
        this._curIndex = 0;
        this._nbItems = _nbItems;
        this._increment = _increment;
        this._canBeNegative = _canBeNegative;
        this._moduloValue = _moduloValue;
        this._notched = _notched;
    }

    scroll(_value) {
        var roundedValue = Math.round(_value / this._increment) * this._increment;
        this._baseValue = roundedValue;
        var middleRange = Math.floor(this._nbItems * 0.5);
        var count = 0;
        while ((count < middleRange) && (this._canBeNegative || ((this._baseValue - this._increment) >= 0))) {
            this._baseValue -= this._increment;
            count++;
        }
        let decimal = (_value - roundedValue) / this._increment;
        if (this._notched > 0) {
            if (decimal < 0.0) {
                this.offsetY = Math.max(decimal / (1 / this._notched), -1.0);
                if (this.offsetY <= -0.5 && (this._canBeNegative || ((this._baseValue - this._increment) >= 0))) {
                    this._baseValue--;
                    count++;
                }
            } else {
                this.offsetY = 0.0;
            }
        } else {
            this.offsetY = decimal;
        }
        this.offsetY += count;
    }

    get increment() {
        return this._increment;
    }

    get firstValue() {
        this._curIndex = 0;
        return this.getCurrentValue();
    }

    get nextValue() {
        this._curIndex++;
        return this.getCurrentValue();
    }

    getCurrentValue() {
        var value = this._baseValue + (this._increment * this._curIndex);
        if (this._moduloValue > 1) {
            value = value % this._moduloValue;
        }
        return value;
    }
}

Avionics.AirspeedScroller = class AirspeedScroller extends Scroller {
    constructor(_spacing, _notched = 0.0) {
        super(3, 1, false, 10, _notched);
        this.allTexts = [];
        this.posX = 0;
        this.posY = 0;
        this.spacing = 0;
        this.spacing = _spacing;
    }

    construct(_parent, _posX, _posY, _width, _fontFamily, _fontSize, _fontColor) {
        this.posX = _posX;
        this.posY = _posY;
        this.allTexts = [];
        for (var i = 0; i < this._nbItems; i++) {
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.setAttribute("width", _width.toString());
            text.setAttribute("fill", _fontColor);
            text.setAttribute("font-size", _fontSize.toString());
            text.setAttribute("font-family", _fontFamily);
            text.setAttribute("text-anchor", "end");
            text.setAttribute("alignment-baseline", "central");
            this.allTexts.push(text);
            _parent.appendChild(text);
        }
    }

    clear(_value = "") {
        this.update(0);
        for (var i = 0; i < this.allTexts.length; i++) {
            this.allTexts[i].textContent = _value;
        }
    }

    update(_value, _divider = 1, _hideIfLower = undefined) {
        super.scroll(Math.abs(_value) / _divider);
        var currentVal = this.firstValue;
        var currentY = this.posY + this.offsetY * this.spacing;
        for (var i = 0; i < this.allTexts.length; i++) {
            var posX = this.posX;
            var posY = currentY;
            if (currentVal <= 0 && _hideIfLower != undefined && Math.abs(_value) < _hideIfLower) {
                this.allTexts[i].textContent = "";
            } else if (currentVal == 0 && this._moduloValue == 100) {
                this.allTexts[i].textContent = "00";
            } else {
                this.allTexts[i].textContent = Math.abs(currentVal).toString();
            }
            this.allTexts[i].setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
            currentY -= this.spacing;
            currentVal = this.nextValue;
        }
    }
}

Avionics.AltitudeScroller = class AltitudeScroller extends Scroller {
    constructor(_nbItems, _spacing, _increment, _moduloValue, _notched = 0.0) {
        super(_nbItems, _increment, false, _moduloValue, _notched);
        this.allTexts = [];
        this.posX = 0;
        this.posY = 0;
        this.spacing = 0;
        this.spacing = _spacing;
    }

    construct(_parent, _posX, _posY, _width, _fontFamily, _fontSize, _fontColor) {
        this.posX = _posX;
        this.posY = _posY;
        this.allTexts = [];
        for (var i = 0; i < this._nbItems; i++) {
            var text = document.createElementNS(Avionics.SVG.NS, "text");
            text.setAttribute("width", _width.toString());
            text.setAttribute("fill", _fontColor);
            text.setAttribute("font-size", _fontSize.toString());
            text.setAttribute("font-family", _fontFamily);
            text.setAttribute("text-anchor", "end");
            text.setAttribute("alignment-baseline", "central");
            this.allTexts.push(text);
            _parent.appendChild(text);
        }
    }

    clear(_value = "") {
        this.update(0);
        for (var i = 0; i < this.allTexts.length; i++) {
            this.allTexts[i].textContent = _value;
        }
    }

    update(_value, _divider = 1, _hideIfLower = undefined) {
        super.scroll(Math.abs(_value) / _divider);
        var currentVal = this.firstValue;
        var currentY = this.posY + this.offsetY * this.spacing;
        for (var i = 0; i < this.allTexts.length; i++) {
            var posX = this.posX;
            var posY = currentY;
            if (currentVal <= 0 && _hideIfLower != undefined && Math.abs(_value) < _hideIfLower) {
                this.allTexts[i].textContent = "";
            } else if (currentVal == 0 && this._moduloValue == 100) {
                this.allTexts[i].textContent = "00";
            } else {
                this.allTexts[i].textContent = Math.abs(currentVal).toString();
            }
            this.allTexts[i].setAttribute("transform", "translate(" + posX.toString() + " " + posY.toString() + ")");
            currentY -= this.spacing;
            currentVal = this.nextValue;
        }
    }
}

Avionics.SVGArc = class SVGArc {
    constructor() {
        this.percent = 0;
        this.angle = 0;
        this.gaugeCenterX = 0;
        this.gaugeCenterY = 0;
        this.gaugeCloseThreshold = 99.9;
        this.computedStartX = 0;
        this.computedStartY = 0;
        this.computedEndX = 0;
        this.computedEndY = 0;
        this.computedEndAngle = 0;
    }

    init(_arcName, _radius, _size, _color) {
        this.arc = document.createElementNS(Avionics.SVG.NS, "path");
        this.arcRadius = _radius;
        this.arcSize = _size;
        this.arcColor = _color;
        this.arc.setAttribute("id", _arcName);
        this.arc.setAttribute("fill", "transparent");
        this.arc.setAttribute("stroke", this.arcColor);
        this.arc.setAttribute("stroke-width", this.arcSize.toString());
    }

    setPercent(_percent) {
        this.percent = _percent;
        this.updateShape();
    }

    translate(_x, _y) {
        this.gaugeCenterX = _x;
        this.gaugeCenterY = _y;
        this.updateShape();
    }

    rotate(_angle) {
        this.angle = _angle;
        this.updateShape();
    }

    get svg() {
        return this.arc;
    }

    get centerX() {
        return this.gaugeCenterX;
    }

    get centerY() {
        return this.gaugeCenterY;
    }

    get radius() {
        return this.arcRadius;
    }

    get startX() {
        return this.computedStartX;
    }

    get startY() {
        return this.computedStartY;
    }

    get endX() {
        return this.computedEndX;
    }

    get endY() {
        return this.computedEndY;
    }

    get startAngle() {
        return this.angle;
    }

    get endAngle() {
        return this.computedEndAngle;
    }

    get currentPercent() {
        return this.percent;
    }

    updateShape() {
        var path = this.getArcPath(this.percent, this.radius);
        this.arc.setAttribute('d', path);
        this.arc.setAttribute('transform', 'translate(' + this.gaugeCenterX + ', ' + this.gaugeCenterY + ')');
    }

    getArcPath(_percent, _radius) {
        let closeArc = false;
        if (_percent > this.gaugeCloseThreshold) {
            closeArc = true;
            _percent = this.gaugeCloseThreshold;
        }
        var largeArc = _percent > 50 ? '1' : '0';
        var Z = closeArc ? 'Z' : '';
        var vX = 0;
        var vY = -_radius;
        var startRadians = this.angle * Math.PI / 180;
        this.computedStartX = vX * Math.cos(startRadians) - vY * Math.sin(startRadians);
        this.computedStartY = vX * Math.sin(startRadians) + vY * Math.cos(startRadians);
        var endRadians = SVGArc.radiansPerPercent * _percent;
        this.computedEndX = this.computedStartX * Math.cos(endRadians) - this.computedStartY * Math.sin(endRadians);
        this.computedEndY = this.computedStartX * Math.sin(endRadians) + this.computedStartY * Math.cos(endRadians);
        this.computedEndAngle = endRadians * 180 / Math.PI;
        return `M ${this.computedStartX} ${this.computedStartY} ` +
            `A ${_radius} ${_radius}, 0, ${largeArc}, 1, ${this.computedEndX} ${this.computedEndY} ` +
            `${Z}`;
    }
}

Avionics.CurveTimeValuePair = class CurveTimeValuePair {
    constructor(time, value) {
        this.time = time;
        this.value = value;
    }
}

Avionics.CurveTool = class CurveTool {
    static NumberInterpolation(n1, n2, dt) {
        return n1 * (1 - dt) + n2 * dt;
    }

    static StringColorRGBInterpolation(c1, c2, dt) {
        let offset1 = 0;
        if (c1[0] === "#") {
            offset1 = 1;
        }
        let r1 = parseInt(c1.substr(0 + offset1, 2), 16);
        let g1 = parseInt(c1.substr(2 + offset1, 2), 16);
        let b1 = parseInt(c1.substr(4 + offset1, 2), 16);
        let offset2 = 0;
        if (c2[0] === "#") {
            offset2 = 1;
        }
        let r2 = parseInt(c2.substr(0 + offset1, 2), 16);
        let g2 = parseInt(c2.substr(2 + offset1, 2), 16);
        let b2 = parseInt(c2.substr(4 + offset1, 2), 16);
        let r = Math.round(r1 * (1 - dt) + r2 * dt);
        let g = Math.round(g1 * (1 - dt) + g2 * dt);
        let b = Math.round(b1 * (1 - dt) + b2 * dt);
        let rs = "00" + r.toString(16);
        rs = rs.substr(-2, 2);
        let gs = "00" + g.toString(16);
        gs = gs.substr(-2, 2);
        let bs = "00" + b.toString(16);
        bs = bs.substr(-2, 2);
        return "#" + rs + gs + bs;
    }
}

Avionics.Curve = class Curve {
    constructor() {
        this._values = [];
    }

    add(time, value) {
        let i = 0;
        let ok = false;
        while (i < this._values.length && !ok) {
            let currTimeValue = this._values[i];
            if (currTimeValue.time > time) {
                ok = true;
            } else {
                i++;
            }
        }
        this._values.splice(i, 0, new CurveTimeValuePair(time, value));
    }

    evaluate(t) {
        if (t <= this._values[0].time) {
            return this._values[0].value;
        }
        if (t >= this._values[this._values.length - 1].time) {
            return this._values[this._values.length - 1].value;
        }
        let tVP1;
        let tVP2;
        let i = 0;
        let ok = false;
        while (!ok) {
            tVP1 = this._values[i];
            tVP2 = this._values[i + 1];
            if (t >= tVP1.time && t < tVP2.time) {
                ok = true;
            } else {
                i++;
            }
        }
        let dt = (t - tVP1.time) / (tVP2.time - tVP1.time);
        return this.interpolationFunction(tVP1.value, tVP2.value, dt);
    }

    debugLog() {
        console.log("------ ------ ------ ------ ------");
        for (let i = 0; i < this._values.length; i++) {
            console.log(this._values[i].time + " " + this._values[i].value);
        }
        console.log("------ ------ ------ ------ ------");
    }
}

Avionics.Dictionary = class Dictionary {
    constructor() {
        this.items = new Array();
        this.changed = false;
    }

    set(_key, _value) {
        if (_key != undefined) {
            for (let i = 0; i < this.items.length; i++) {
                if (this.items[i].key === _key) {
                    if (this.items[i].value != _value) {
                        this.items[i].value = _value;
                        this.changed = true;
                    }
                    return;
                }
            }
            let item = new DictionaryItem();
            item.key = _key;
            item.value = _value;
            this.items.push(item);
            this.changed = true;
        }
    }

    get(_key) {
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].key === _key) {
                return this.items[i].value;
            }
        }
        return undefined;
    }

    remove(_key) {
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].key === _key) {
                this.items.splice(i, 1);
                this.changed = true;
                return;
            }
        }
    }

    exists(_key) {
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].key === _key) {
                return true;
            }
        }
        return false;
    }
}