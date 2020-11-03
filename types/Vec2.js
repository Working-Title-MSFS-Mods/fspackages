/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

class Vec2 {
    constructor(_x = 0, _y = 0) {
        this.x = _x;
        this.y = _y;
    }
    static FromRect(elem) {
        var ret = new Vec2();
        ret.x = elem.left + elem.width * 0.5;
        ret.y = elem.top + elem.height * 0.5;
        return ret;
    }
    static Delta(vec1, vec2) {
        var ret = new Vec2();
        ret.x = vec1.x - vec2.x;
        ret.y = vec1.y - vec2.y;
        return ret;
    }
    VectorTo(pt2) {
        if (pt2)
            return Vec2.Delta(pt2, this);
        else
            return new Vec2(0, 0);
    }
    toCurvePointString() {
        return `${this.x} ${this.y}`;
    }
    Dot(b) {
        return this.x * b.x + this.y * b.y;
    }
    ;
    GetNorm() {
        return Math.sqrt(this.Dot(this));
    }
    Normalize() {
        var norm = this.GetNorm();
        if (norm > 0) {
            this.x /= norm;
            this.y /= norm;
        }
    }
    SetNorm(n) {
        var norm = this.GetNorm();
        if (norm > 0) {
            var factor = n / norm;
            this.x *= factor;
            this.y *= factor;
        }
    }
    static SqrDistance(p1, p2) {
        return (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y);
    }
    static Distance(p1, p2) {
        return Math.sqrt(Vec2.SqrDistance(p1, p2));
    }
}