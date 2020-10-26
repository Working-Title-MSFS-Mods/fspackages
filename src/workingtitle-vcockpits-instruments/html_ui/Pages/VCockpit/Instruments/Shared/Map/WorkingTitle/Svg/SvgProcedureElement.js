class SvgProcedureElement extends SvgMapElement {
    /**
     * @param {WT_Selected_Procedure} procedure 
     */
    constructor(procedure) {
        super();
        this.procedure = procedure;
    }
    id(map) {
        return "procedure-map-" + map.index;
    }
    appendToMap(map) {
        map.appendChild(this.svgElement, map.flightPlanLayer);
    }
    createProcedurePath() {
        let path = document.createElementNS(Avionics.SVG.NS, "path");
        path.setAttribute("stroke", "white");
        path.setAttribute("stroke-width", 8);
        path.setAttribute("fill", "transparent");
        let outline = document.createElementNS(Avionics.SVG.NS, "path");
        outline.setAttribute("stroke", "black");
        outline.setAttribute("stroke-width", 10);
        outline.setAttribute("fill", "transparent");
        return {
            path: path,
            outline: outline
        };
    }
    createTransitionsPath() {
        let path = document.createElementNS(Avionics.SVG.NS, "path");
        path.setAttribute("stroke", "#aaa");
        path.setAttribute("stroke-width", 4);
        path.setAttribute("fill", "transparent");
        let outline = document.createElementNS(Avionics.SVG.NS, "path");
        outline.setAttribute("stroke", "black");
        outline.setAttribute("stroke-width", 6);
        outline.setAttribute("fill", "transparent");
        return {
            path: path,
            outline: outline
        };
    }
    createDraw(map) {
        let container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);
        container.setAttribute("overflow", "visible");

        this.transitionsPath = this.createTransitionsPath();
        container.appendChild(this.transitionsPath.outline);
        container.appendChild(this.transitionsPath.path);

        this.procedurePath = this.createProcedurePath();
        container.appendChild(this.procedurePath.outline);
        container.appendChild(this.procedurePath.path);

        return container;
    }
    updateDraw(map) {
        let legCoordinates = [];
        {
            let i = 0;
            for (let waypoint of this.procedure.getSequence()) {
                switch (waypoint.legType) {
                    case 10: {
                        if (i == 0) {
                            legCoordinates.push(waypoint.coordinates);
                        }
                        legCoordinates.push(Avionics.Utils.bearingDistanceToCoordinates(waypoint.bearing, waypoint.distance, waypoint.coordinates.lat, waypoint.coordinates.long));
                        break;
                    }
                    case 3: {
                        let coordinates1 = Avionics.Utils.bearingDistanceToCoordinates(waypoint.bearing, waypoint.distance, waypoint.coordinates.lat, waypoint.coordinates.long);
                        let coordinates2 = Avionics.Utils.bearingDistanceToCoordinates((waypoint.bearing + 180) % 360, waypoint.distance, waypoint.coordinates.lat, waypoint.coordinates.long);
                        let dist1 = Avionics.Utils.computeDistance(legCoordinates[legCoordinates.length - 1], coordinates1);
                        let dist2 = Avionics.Utils.computeDistance(legCoordinates[legCoordinates.length - 1], coordinates2);
                        legCoordinates.push(dist1 < dist2 ? coordinates1 : coordinates2);
                        break;
                    }
                    case 4:
                    case 15:
                    case 18: {
                        legCoordinates.push(waypoint.coordinates);
                        break;
                    }
                    default: {
                        break;
                    }
                }
                i++;
            }
        }
        {
            let i = 0;
            let procedurePath = legCoordinates.map(leg => {
                let xy = map.coordinatesToXY(leg);
                return `${i++ == 0 ? "M" : "L"}${xy.x} ${xy.y}`
            }).join(" ");
            this.procedurePath.path.setAttribute("d", procedurePath);
            this.procedurePath.outline.setAttribute("d", procedurePath);
        }

        let transitionPaths = [];
        for (let transition of this.procedure.procedure.getTransitions()) {
            let i = 0;
            let transitionCoordinates = [];
            for (let waypoint of transition.waypoints) {
                switch (waypoint.legType) {
                    case 10: {
                        if (i == 0) {
                            transitionCoordinates.push(waypoint.infos.coordinates);
                        }
                        transitionCoordinates.push(Avionics.Utils.bearingDistanceToCoordinates(waypoint.bearingInFP, waypoint.distanceInFP * 0.000539957, waypoint.infos.coordinates.lat, waypoint.infos.coordinates.long));
                        break;
                    }
                    case 3: {
                        let coordinates1 = Avionics.Utils.bearingDistanceToCoordinates(waypoint.bearingInFP, waypoint.distanceInFP * 0.000539957, waypoint.infos.coordinates.lat, waypoint.infos.coordinates.long);
                        let coordinates2 = Avionics.Utils.bearingDistanceToCoordinates((waypoint.bearingInFP + 180) % 360, waypoint.distanceInFP * 0.000539957, waypoint.infos.coordinates.lat, waypoint.infos.coordinates.long);
                        let dist1 = Avionics.Utils.computeDistance(transitionCoordinates[transitionCoordinates.length - 1], coordinates1);
                        let dist2 = Avionics.Utils.computeDistance(transitionCoordinates[transitionCoordinates.length - 1], coordinates2);
                        transitionCoordinates.push(dist1 < dist2 ? coordinates1 : coordinates2);
                        break;
                    }
                    case 4:
                    case 15:
                    case 18: {
                        transitionCoordinates.push(waypoint.infos.coordinates);
                        break;
                    }
                    default: {
                        break;
                    }
                }
                i++;
            }
            i = 0;
            transitionPaths.push(transitionCoordinates.map(leg => {
                let xy = map.coordinatesToXY(leg);
                return `${i++ == 0 ? "M" : "L"}${xy.x} ${xy.y}`
            }).join(" "));
        }

        let transitionsPath = transitionPaths.join(" ");
        this.transitionsPath.path.setAttribute("d", transitionsPath);
        this.transitionsPath.outline.setAttribute("d", transitionsPath);
    }
}
//# sourceMappingURL=SvgFlightPlanElement.js.map