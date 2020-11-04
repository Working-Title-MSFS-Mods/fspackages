/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

class SvgRoadElement extends SvgMapElement {
    constructor(type, path) {
        super();
        this.lod = 1;
        this.ident = "UKNWN";
        this._mnhtSummedLength = 0;
        this.ident += "-" + fastToFixed((SvgRoadElement.roadIndex++), 0);
        if (isFinite(type)) {
            this.roadType = type;
        }
        if (path) {
            this.path = path;
            if (this.path.length > 1) {
                let pi = this.path[0];
                let pi1;
                for (let i = 1; i < this.path.length; i++) {
                    pi1 = this.path[i];
                    this._mnhtSummedLength += Math.abs(pi.lat - pi1.lat) + Math.abs(pi.long - pi1.long);
                    pi = pi1;
                }
            }
        }
    }
    get mnhtSummedLength() {
        if (isNaN(this._mnhtSummedLength)) {
            return 0;
        }
        return this._mnhtSummedLength;
    }
    get start() {
        return this.path[0];
    }
    get end() {
        return this.path[this.path.length - 1];
    }
    id(map) {
        return "road-" + this.ident + "-map-" + map.index;
    }
    createDraw(map) {
        let container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);
        container.setAttribute("overflow", "visible");
        let shape = document.createElementNS(Avionics.SVG.NS, "polyline");
        shape.classList.add("map-road");
        shape.classList.add("map-road-" + this.roadType);
        shape.setAttribute("fill", "none");
        shape.setAttribute("stroke", "gray");
        shape.setAttribute("stroke-width", "3");
        container.appendChild(shape);
        return container;
    }
    updateDraw(map) {
        let pCenter = new Vec2(0, 0);
        let outOfFrame = true;
        let points = "";
        let pos = new Vec2();
        this.path.forEach((p) => {
            map.coordinatesToXYToRef(p, pos);
            pCenter.x += pos.x;
            pCenter.y += pos.y;
            points += fastToFixed(pos.x, 0) + "," + fastToFixed(pos.y, 0) + " ";
            outOfFrame = outOfFrame && !map.isVec2InFrame(pos);
        });
        let c1 = this.path[Math.floor(this.path.length / 2)];
        let c2 = this.path[Math.ceil(this.path.length / 2)];
        if (c1 && c2) {
            let p1 = map.coordinatesToXY(c1);
            let p2 = map.coordinatesToXY(c2);
            pCenter.x = (p1.x + p2.x) * 0.5;
            pCenter.y = (p1.y + p2.y) * 0.5;
        }
        else if (c1) {
            let p1 = map.coordinatesToXY(c1);
            pCenter.x = p1.x;
            pCenter.y = p1.y;
        }
        else if (c2) {
            let p2 = map.coordinatesToXY(c2);
            pCenter.x = p2.x;
            pCenter.y = p2.y;
        }
        let polyline = this.svgElement.children[0];
        if (polyline instanceof SVGPolylineElement) {
            polyline.setAttribute("points", points);
        }
        let text = this.svgElement.children[1];
        if (text instanceof SVGTextElement) {
            if (isFinite(pCenter.x) && isFinite(pCenter.y)) {
                text.setAttribute("x", fastToFixed(pCenter.x, 0));
                text.setAttribute("y", fastToFixed(pCenter.y, 0));
            }
        }
        if (outOfFrame) {
            if (this.onDrawOutOfFrame) {
                this.onDrawOutOfFrame();
            }
        }
    }
    isEqual(other, epsilon = 0.0001) {
        let dStart = Math.abs(this.start.lat - other.start.lat) + Math.abs(this.start.long - other.start.long);
        if (dStart < epsilon) {
            let dEnd = Math.abs(this.end.lat - other.end.lat) + Math.abs(this.end.long - other.end.long);
            if (dEnd < epsilon) {
                return true;
            }
        }
        else {
            dStart = Math.abs(this.start.lat - other.end.lat) + Math.abs(this.start.long - other.end.long);
            if (dStart < epsilon) {
                let dEnd = Math.abs(this.end.lat - other.start.lat) + Math.abs(this.end.long - other.start.long);
                if (dEnd < epsilon) {
                    return true;
                }
            }
        }
        return false;
    }
}
SvgRoadElement.roadIndex = 0;
//# sourceMappingURL=SvgRoadElement.js.map