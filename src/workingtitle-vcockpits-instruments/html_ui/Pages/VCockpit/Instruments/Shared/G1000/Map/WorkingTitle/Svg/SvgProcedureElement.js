class SvgProcedureElement extends SvgMapElement {
    /**
     * @param {WT_Selected_Procedure} procedure 
     */
    constructor(procedure) {
        super();
        this.procedure = procedure;
        this.procedurePathString = new Subject("");
        this.transitionsPathString = new Subject("");
        this.sequenceWaypoints = [];
        this.allTransitions = [];
        this.waypointMarkersGroup = document.createElementNS(Avionics.SVG.NS, "g");
        this.waypointMarkers = [];
        this.updateProcedure();
        this.procedure.onUpdated.subscribe(this.updateProcedure.bind(this));
    }
    id(map) {
        return `procedure-map-${map.index}-${SvgProcedureElement.index++}`;
    }
    getLabelFontSize(map) {
        return map.config.waypointLabelFontSize;
    }
    appendToMap(map) {
        map.appendChild(this.svgElement, map.flightPlanLayer);
    }
    updateProcedure() {
        this.sequenceWaypoints = this.procedure.getSequence();
        this.allTransitions = this.procedure.getAllTransitionLegs();

        this.waypointMarkersGroup.innerHTML = "";
        this.waypointMarkers = this.sequenceWaypoints.map(waypoint => {
            let g = document.createElementNS(Avionics.SVG.NS, "g");
            g.innerHTML = `
                <rect fill="white" stroke="#333333" stroke-width="1"></rect>
                <text fill="black" x="0" y="0" text-anchor="middle" dominant-baseline="middle" font-family="Roboto-Mono" font-weight="bold">${waypoint.name}</text>
                <polygon points="-10,8 0,-8 10,8" fill="cyan" x="0" y="0" stroke="#333333" stroke-width="1"></polygon> 
            `;
            this.waypointMarkersGroup.appendChild(g);
            return {
                element: g,
                waypoint: waypoint,
                background: g.querySelector("rect"),
                label: g.querySelector("text"),
            };
        })
    }
    createPath(fillColor, outlineColor, width, strokeWidth = 2) {
        let path = document.createElementNS(Avionics.SVG.NS, "path");
        path.setAttribute("stroke", fillColor);
        path.setAttribute("stroke-width", width);
        path.setAttribute("fill", "transparent");
        let outline = document.createElementNS(Avionics.SVG.NS, "path");
        outline.setAttribute("stroke", outlineColor);
        outline.setAttribute("stroke-width", width + strokeWidth);
        outline.setAttribute("fill", "transparent");
        return {
            path: path,
            outline: outline
        };
    }
    createProcedurePath() {
        return this.createPath("white", "black", 6);
    }
    createTransitionsPath() {
        return this.createPath("#bbb", "black", 3);
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

        container.appendChild(this.waypointMarkersGroup);

        this.procedurePathString.subscribe(path => {
            this.procedurePath.path.setAttribute("d", path);
            this.procedurePath.outline.setAttribute("d", path);
        });

        this.transitionsPathString.subscribe(path => {
            this.transitionsPath.path.setAttribute("d", path);
            this.transitionsPath.outline.setAttribute("d", path);
        });

        return container;
    }
    updateProcedurePath(map) {
        let i = 0;
        let procedurePath = this.sequenceWaypoints.map(leg => {
            let xy = map.coordinatesToXY(leg.coordinates);
            return `${i++ == 0 ? "M" : "L"}${xy.x} ${xy.y}`
        }).join(" ");
        this.procedurePathString.value = procedurePath;

        let fontSize = this.getLabelFontSize(map);
        let side = 0;
        for (let i = 0; i < this.waypointMarkers.length; i++) {
            let marker = this.waypointMarkers[i];
            let previousXy = (i > 0) ? map.coordinatesToXY(this.waypointMarkers[i - 1].waypoint.coordinates) : null;
            let xy = map.coordinatesToXY(marker.waypoint.coordinates);
            let nextXy = (i < this.waypointMarkers.length - 1) ? map.coordinatesToXY(this.waypointMarkers[i + 1].waypoint.coordinates) : null;
            let directionToNext = {
                x: (nextXy ? nextXy.x : xy.x) - xy.x,
                y: (nextXy ? nextXy.y : xy.y) - xy.y,
            }
            let nextMagnitude = Math.sqrt(directionToNext.x * directionToNext.x + directionToNext.y * directionToNext.y);
            if (nextMagnitude > 0) {
                directionToNext.x /= nextMagnitude;
                directionToNext.y /= nextMagnitude;
            }
            let directionToPrevious = {
                x: (previousXy ? previousXy.x : xy.x) - xy.x,
                y: (previousXy ? previousXy.y : xy.y) - xy.y,
            }
            let previousMagnitude = Math.sqrt(directionToPrevious.x * directionToPrevious.x + directionToPrevious.y * directionToPrevious.y);
            if (previousMagnitude > 0) {
                directionToPrevious.x /= previousMagnitude;
                directionToPrevious.y /= previousMagnitude;
            }
            let direction = {
                x: directionToNext.x - directionToPrevious.x,
                y: directionToNext.y - directionToPrevious.y,
            }
            if (direction.x > 0 || direction.y > 0) {
                let magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
                direction.x /= magnitude;
                direction.y /= magnitude;
            } else {
                direction.x = 1;
                direction.y = 0;
            }
            side = (side + 1) % 2;
            let offset = {
                x: -direction.y * (fontSize * 3 / 2) * 1.5 * (side ? 1 : -1),
                y: direction.x * (fontSize) * 1.5 * (side ? 1 : -1),
            };
            marker.background.setAttribute("x", offset.x - (fontSize * 3) / 2);
            marker.background.setAttribute("y", offset.y - (fontSize * 1.2) / 2);
            marker.background.setAttribute("width", fontSize * 3);
            marker.background.setAttribute("height", (fontSize * 1.2));
            marker.label.setAttribute("font-size", fontSize);
            marker.label.setAttribute("x", offset.x);
            marker.label.setAttribute("y", offset.y + fontSize * 0.2);
            marker.element.setAttribute("transform", `translate(${xy.x}, ${xy.y})`);
        }
    }
    updateTransitionsPath(map) {
        let transitionPaths = [];
        for (let transition of this.allTransitions) {
            let i = 0;
            transitionPaths.push(transition.waypoints.map(leg => {
                let xy = map.coordinatesToXY(leg.coordinates);
                return `${i++ == 0 ? "M" : "L"}${xy.x} ${xy.y}`
            }).join(" "));
        }

        this.transitionsPathString.value = transitionPaths.join(" ");
    }
    updateDraw(map) {
        // View key means if the map hasn't changed in a way to affect the coordinate positions, we don't need to bother updating
        let viewKey = `${map._angularWidthNorth}_${map._angularWidthSouth}_${map.centerCoordinates.lat}_${map.centerCoordinates.long}}`;
        if (this.lastViewKey != viewKey) {
            this.updateProcedurePath(map);
            this.updateTransitionsPath(map);
        }
        this.lastViewKey = viewKey;
    }
}
SvgProcedureElement.index = 0;
//# sourceMappingURL=SvgFlightPlanElement.js.map