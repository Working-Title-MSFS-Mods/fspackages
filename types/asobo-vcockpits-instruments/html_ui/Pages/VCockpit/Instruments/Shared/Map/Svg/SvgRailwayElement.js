/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

class SvgRailwayElement extends SvgMapElement {
    constructor() {
        super(...arguments);
        this.ident = "Bdx-Medoc";
    }
    id(map) {
        return "railway-" + this.ident + "-map-" + map.index;
        ;
    }
    createDraw(map) {
        let container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);
        container.setAttribute("overflow", "visible");
        let shape = document.createElementNS(Avionics.SVG.NS, "polyline");
        shape.classList.add("map-railway");
        shape.setAttribute("stroke", map.config.railwayStrokeColor);
        shape.setAttribute("stroke-width", fastToFixed(map.config.railwayWidth, 0));
        shape.setAttribute("fill", "none");
        container.appendChild(shape);
        let shapeRail = document.createElementNS(Avionics.SVG.NS, "polyline");
        shapeRail.classList.add("map-railway");
        shapeRail.setAttribute("stroke", map.config.railwayStrokeColor);
        shapeRail.setAttribute("stroke-width", fastToFixed((map.config.railwayWidth * 3), 0));
        shapeRail.setAttribute("stroke-dasharray", map.config.railwayWidth + " " + map.config.railwayDashLength);
        shapeRail.setAttribute("fill", "none");
        container.appendChild(shapeRail);
        return container;
    }
    updateDraw(map) {
        let points = "";
        let pos = new Vec2();
        this.path.forEach((p) => {
            map.coordinatesToXYToRef(p, pos);
            points += fastToFixed(pos.x, 0) + "," + fastToFixed(pos.y, 0) + " ";
        });
        this.svgElement.children[0].setAttribute("points", points);
        this.svgElement.children[1].setAttribute("points", points);
    }
}
//# sourceMappingURL=SvgRailwayElement.js.map