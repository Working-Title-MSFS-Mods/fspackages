/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

class SvgLatLonElement extends SvgMapElement {
    id(map) {
        return "lat-lon" + "-map-" + map.index;
    }
    createDraw(map) {
        let container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);
        container.setAttribute("width", "100%");
        container.setAttribute("height", "100%");
        container.setAttribute("overflow", "visible");
        let shapeLat = document.createElementNS(Avionics.SVG.NS, "polyline");
        shapeLat.classList.add("map-lat-lon-lines");
        shapeLat.setAttribute("fill", "none");
        shapeLat.setAttribute("stroke", map.config.latLonStrokeColor);
        shapeLat.setAttribute("stroke-width", fastToFixed(map.config.latLonStrokeWidth, 0));
        container.appendChild(shapeLat);
        let shapeLon = document.createElementNS(Avionics.SVG.NS, "polyline");
        shapeLon.classList.add("map-lat-lon-lines");
        shapeLon.setAttribute("fill", "none");
        shapeLon.setAttribute("stroke", map.config.latLonStrokeColor);
        shapeLon.setAttribute("stroke-width", fastToFixed(map.config.latLonStrokeWidth, 0));
        container.appendChild(shapeLon);
        for (let i = 0; i < SvgLatLonElement.MAXLABELCOUNT; i++) {
            let label = document.createElementNS(Avionics.SVG.NS, "text");
            label.classList.add("map-lat-lon-label");
            label.setAttribute("font-family", map.config.latLonLabelFontFamily);
            label.setAttribute("font-size", map.config.latLonLabelFontSize + "px");
            label.setAttribute("fill", map.config.latLonLabelColor);
            label.setAttribute("stroke", map.config.latLonLabelStrokeColor);
            label.setAttribute("stroke-width", "10px");
            container.appendChild(label);
        }
        return container;
    }
    updateDraw(map) {
        let l = Math.min(map.angularWidth, map.angularHeight);
        let step = Math.pow(10, Math.floor(Math.log10(l)));
        if (step > 0.5 * l) {
            step *= 0.5;
        }
        if (step < l / 3) {
            step *= 5;
        }
        let decimals = Math.min(Math.floor(Math.log10(step)), 0) * -1;
        let center = map.centerCoordinates;
        let bottomLeft = map.bottomLeftCoordinates;
        let topRight = map.topRightCoordinates;
        let minLat = Math.floor(bottomLeft.lat / step) * step;
        let maxLat = Math.ceil(topRight.lat / step) * step;
        let minLong = Math.floor(bottomLeft.long / step) * step;
        let maxLong = Math.ceil(topRight.long / step) * step;
        let labelIndex = 0;
        let pointsLat = "";
        let everyEvenIteration = true;
        let lla = new LatLongAlt();
        let p = new Vec2();
        for (let lat = minLat + step; lat < maxLat; lat += step) {
            lla.lat = lat;
            lla.long = center.long;
            map.coordinatesToXYToRef(lla, p);
            if (everyEvenIteration) {
                pointsLat += "-1000," + fastToFixed(p.y, 0) + " " + fastToFixed((1000 + 1000), 0) + "," + fastToFixed(p.y, 0) + " ";
            }
            else {
                pointsLat += fastToFixed((1000 + 1000), 0) + "," + fastToFixed(p.y, 0) + " " + "-1000," + fastToFixed(p.y, 0) + " ";
            }
            everyEvenIteration = !everyEvenIteration;
            if (labelIndex < SvgLatLonElement.MAXLABELCOUNT) {
                let latLabel = this.svgElement.children[4 + labelIndex++];
                latLabel.setAttribute("visibility", "visible");
                latLabel.textContent = fastToFixed(lla.lat, decimals);
                latLabel.setAttribute("text-anchor", "start");
                latLabel.setAttribute("x", "10");
                latLabel.setAttribute("y", fastToFixed((p.y + map.config.latLonLabelFontSize * 0.3), 0));
            }
        }
        let pointsLong = "";
        for (let long = minLong + step; long < maxLong; long += step) {
            lla.lat = center.lat;
            lla.long = long;
            map.coordinatesToXYToRef(lla, p);
            if (everyEvenIteration) {
                pointsLong += fastToFixed(p.x, 0) + ",-1000 " + fastToFixed(p.x, 0) + "," + fastToFixed((1000 + 1000), 0) + " ";
            }
            else {
                pointsLong += fastToFixed(p.x, 0) + "," + fastToFixed((1000 + 1000), 0) + " " + fastToFixed(p.x, 0) + ",-1000 ";
            }
            everyEvenIteration = !everyEvenIteration;
            if (labelIndex < SvgLatLonElement.MAXLABELCOUNT) {
                let longLabel = this.svgElement.children[2 + labelIndex++];
                longLabel.setAttribute("visibility", "visible");
                longLabel.textContent = fastToFixed(lla.long, decimals);
                longLabel.setAttribute("text-anchor", "middle");
                longLabel.setAttribute("x", fastToFixed(p.x, 0));
                longLabel.setAttribute("y", "50");
            }
        }
        for (let i = labelIndex; i < SvgLatLonElement.MAXLABELCOUNT; i++) {
            this.svgElement.children[2 + i].setAttribute("visibility", "hidden ");
        }
        let shapeLat = this.svgElement.children[0];
        if (shapeLat instanceof SVGPolylineElement) {
            shapeLat.setAttribute("points", pointsLat);
        }
        let shapeLong = this.svgElement.children[1];
        if (shapeLong instanceof SVGPolylineElement) {
            shapeLong.setAttribute("points", pointsLong);
        }
    }
}
SvgLatLonElement.MAXLABELCOUNT = 8;
//# sourceMappingURL=SvgLatLonElement.js.map