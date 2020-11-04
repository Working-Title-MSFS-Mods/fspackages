/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

class SvgAirwayElement extends SvgMapElement {
    constructor() {
        super();
        this.ident = "BOD";
        this.airwayType = "low";
        this._tmpStart = new Vec2();
        this._tmpEnd = new Vec2();
    }
    id(map) {
        return "airway-" + this.ident + "-map-" + map.index;
    }
    createDraw(map) {
        let shape = document.createElementNS(Avionics.SVG.NS, "line");
        shape.id = this.id(map);
        shape.classList.add("map-airway");
        shape.classList.add("map-airway-" + this.airwayType);
        shape.setAttribute("stroke-width", "4");
        shape.setAttribute("stroke", "#3A7216");
        return shape;
    }
    updateDraw(map) {
        if (this.start && this.end) {
            map.coordinatesToXYToRef(this.start, this._tmpStart);
            map.coordinatesToXYToRef(this.end, this._tmpEnd);
            let ctx = map.lineCanvas.getContext("2d");
            ctx.strokeStyle = "#3a7216";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this._tmpStart.x / 1000 * map.lineCanvas.width, this._tmpStart.y / 1000 * map.lineCanvas.height);
            ctx.lineTo(this._tmpEnd.x / 1000 * map.lineCanvas.width, this._tmpEnd.y / 1000 * map.lineCanvas.height);
            ctx.stroke();
        }
    }
}
//# sourceMappingURL=SvgAirwayElement.js.map