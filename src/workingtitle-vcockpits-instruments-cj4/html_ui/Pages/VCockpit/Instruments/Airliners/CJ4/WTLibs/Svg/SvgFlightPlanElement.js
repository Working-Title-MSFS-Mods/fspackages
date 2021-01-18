class SvgFlightPlanElement extends SvgMapElement {
    constructor() {
        super(...arguments);
        this.flightPlanIndex = NaN;
        this.highlightActiveLeg = true;
        this.points = [];
        this.latLong = new LatLong();
        this._debugTransitionIndex = 0;
        this._lastP0X = NaN;
        this._lastP0Y = NaN;
        this.hideReachedWaypoints = true;
        this._highlightedLegIndex = -1;
        this._isDashed = false;
    }
    id(map) {
        return "flight-plan-" + this.flightPlanIndex + "-map-" + map.index;
        ;
    }

    appendToMap(map) {
        map.appendChild(this.svgElement, map.flightPlanLayer);
    }

    createDraw(map) {
        let container = document.createElementNS(Avionics.SVG.NS, "foreignObject");
        container.id = this.id(map);
        container.setAttribute('width', '1024px');
        container.setAttribute('height', '1024px');
        container.setAttribute('x', '0');
        container.setAttribute('y', '0');

        this._flightPathCanvas = document.createElement('canvas');
        this._flightPathCanvas.setAttribute('width', '1024px');
        this._flightPathCanvas.setAttribute('height', '1024px');
        container.appendChild(this._flightPathCanvas);

        return container;
    }
    updateDraw(map) {
        if (this.source) {
            /** @type {FlightPlanManager} */
            const fpm = this.source;
            /** @type {WayPoint[]} */

            const context = this._flightPathCanvas.getContext('2d');
            context.clearRect(0, 0, 1024, 1024);

            const fplnCount = (SimVar.GetSimVarValue("L:MAP_SHOW_TEMPORARY_FLIGHT_PLAN", "number") === 1) ? 2 : 1;
            for (let index = 0; index < fplnCount; index++) {
                const plan = fpm.getFlightPlan(index);
                const waypoints = plan.waypoints;

                const activeWaypointIndex = plan.activeWaypointIndex;
                const missedSegment = plan.getSegment(SegmentType.Missed);

                if (waypoints.length > 1) {

                    const inMissedApproach = activeWaypointIndex >= missedSegment.offset;
                    const mainPathEnd = inMissedApproach ? waypoints.length - 1 : missedSegment.offset;

                    //Active leg
                    if (waypoints[activeWaypointIndex] && waypoints[activeWaypointIndex - 1]) {
                        this.buildPathFromWaypoints(waypoints, activeWaypointIndex - 1, activeWaypointIndex + 1, map, 'magenta', false);
                    }

                    //Missed approach preview
                    if (!inMissedApproach) {
                        this.buildPathFromWaypoints(waypoints, missedSegment.offset - 1, waypoints.length - 1, map, 'cyan', (index !== 0));
                    }  

                    //Remainder of plan
                    this.buildPathFromWaypoints(waypoints, activeWaypointIndex, mainPathEnd, map, 'white', (index !== 0));
                }
            }
        }
    }

    /**
     * Builds a path string from supplied waypoints.
     * @param {WayPoint[]} waypoints The waypoints to build the path from.
     * @param {MapInstrument} map The map instrument to convert coordinates with.
     * @returns {string} A path string.
     */
    buildPathFromWaypoints(waypoints, startIndex, endIndex, map, style = 'white', isDashed = false) {
        const context = this._flightPathCanvas.getContext('2d');
        context.beginPath();

        context.lineWidth = 3;
        context.strokeStyle = style;
        if (isDashed === true) {
            context.setLineDash([10, 5]);
        } else {
            context.setLineDash([]);
        }
    
        let prevWaypoint;
        for (let i = startIndex; i < endIndex; i++) {
            const waypoint = waypoints[i];
            const pos = map.coordinatesToXY(waypoint.infos.coordinates);

            if (i === startIndex || (prevWaypoint && prevWaypoint.endsInDiscontinuity)) {
                context.moveTo(pos.x, pos.y);
            }
            else {
                //Draw great circle segments if more than 2 degrees longitude difference
                const longDiff = Math.abs(waypoint.infos.coordinates.long - prevWaypoint.infos.coordinates.long);
                if (longDiff > 2) {
                    const numSegments = Math.floor(longDiff / 2);
                    const startingLatLon = new LatLon(prevWaypoint.infos.coordinates.lat, prevWaypoint.infos.coordinates.long);
                    const endingLatLon = new LatLon(waypoint.infos.coordinates.lat, waypoint.infos.coordinates.long);

                    const segmentPercent = 1 / numSegments;
                    for (let j = 0; j <= numSegments; j++) {
                        const segmentEnd = startingLatLon.intermediatePointTo(endingLatLon, j * segmentPercent);
                        const segmentEndVec = map.coordinatesToXY(new LatLongAlt(segmentEnd.lat, segmentEnd.lon));

                        context.lineTo(segmentEndVec.x, segmentEndVec.y);
                    }
                }
                else {
                    context.lineTo(pos.x, pos.y);
                }
            }

            prevWaypoint = waypoint;
        }

        for (let i = startIndex + 1; i < endIndex; i++) {
            const waypoint = waypoints[i];
            if (waypoint.hasHold) {

                let course = waypoint.holdDetails.holdCourse;
                if (!waypoint.holdDetails.isHoldCourseTrue) {
                    const magVar = GeoMath.getMagvar(waypoint.infos.coordinates.lat, waypoint.infos.coordinates.long);
                    course = AutopilotMath.normalizeHeading(course + magVar);
                }

                const corners = HoldsDirector.calculateHoldFixes(waypoint.infos.coordinates, waypoint.holdDetails)
                    .map(c => map.coordinatesToXY(c));

                context.moveTo(corners[0].x, corners[0].y);
                this.drawHoldArc(corners[0], corners[1], context, waypoint.holdDetails.turnDirection === 1);
                context.lineTo(corners[2].x, corners[2].y);
                this.drawHoldArc(corners[2], corners[3], context, waypoint.holdDetails.turnDirection === 1);
                context.lineTo(corners[0].x, corners[0].y);
            }
        }

        context.stroke();
    }

    /**
     * 
     * @param {Vec2} p1 
     * @param {Vec2} p2 
     * @param {CanvasRenderingContext2D} context 
     */
    drawHoldArc(p1, p2, context, counterClockwise) {
        const cx = (p1.x + p2.x) / 2;
        const cy = (p1.y + p2.y) / 2;
        const radius = p1.Distance(p2) / 2;

        const a1 = Math.atan2(p1.y - cy, p1.x - cx);
        const a2 = Math.atan2(p2.y - cy, p2.x - cx);

        context.arc(cx, cy, radius, a1, a2, counterClockwise);
    }

    setAsDashed(_val, _force = false) {
        if (_force || (_val != this._isDashed)) {
            this._isDashed = _val;
            if (this._colorActive && this._colorPath) {
                if (this._isDashed) {
                    let length = 14;
                    let spacing = 8;
                    this._colorPath.removeAttribute("stroke-linecap");
                    this._colorPath.setAttribute("stroke-dasharray", length + " " + spacing);
                    this._colorActive.removeAttribute("stroke-linecap");
                    this._colorActive.setAttribute("stroke-dasharray", length + " " + spacing);
                }
                else {
                    this._colorPath.removeAttribute("stroke-dasharray");
                    this._colorPath.setAttribute("stroke-linecap", "square");
                    this._colorActive.removeAttribute("stroke-dasharray");
                    this._colorActive.setAttribute("stroke-linecap", "square");
                }
            }
        }
    }
}
class SvgBackOnTrackElement extends SvgMapElement {
    constructor(overrideColor = "") {
        super();
        this.overrideColor = overrideColor;
        this._id = "back-on-track-" + SvgBackOnTrackElement.ID;
        SvgBackOnTrackElement.ID++;
    }
    id(map) {
        return this._id + "-map-" + map.index;
        ;
    }
    createDraw(map) {
        let container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);
        container.setAttribute("overflow", "visible");
        if (map.config.flightPlanDirectLegStrokeWidth > 0) {
            this._outlineLine = document.createElementNS(Avionics.SVG.NS, "line");
            this._outlineLine.setAttribute("stroke", this.overrideColor != "" ? this.overrideColor : map.config.flightPlanDirectLegStrokeColor);
            let outlineDirectLegWidth = fastToFixed((map.config.flightPlanDirectLegStrokeWidth + map.config.flightPlanDirectLegWidth), 0);
            this._outlineLine.setAttribute("stroke-width", outlineDirectLegWidth);
            this._outlineLine.setAttribute("stroke-linecap", "square");
            container.appendChild(this._outlineLine);
        }
        this._colorLine = document.createElementNS(Avionics.SVG.NS, "line");
        this._colorLine.setAttribute("stroke", this.overrideColor != "" ? this.overrideColor : map.config.flightPlanDirectLegColor);
        let colorDirectLegWidth = fastToFixed(map.config.flightPlanDirectLegWidth, 0);
        this._colorLine.setAttribute("stroke-width", colorDirectLegWidth);
        this._colorLine.setAttribute("stroke-linecap", "square");
        container.appendChild(this._colorLine);
        return container;
    }
    updateDraw(map) {
    }
}
SvgBackOnTrackElement.ID = 0;
class SvgApproachFlightPlanDebugElement extends SvgMapElement {
    constructor() {
        super(...arguments);
        this.flightPlanIndex = NaN;
    }
    id(map) {
        return "flight-plan-" + this.flightPlanIndex + "-map-" + map.index;
        ;
    }
    createDraw(map) {
        let container = document.createElementNS(Avionics.SVG.NS, "svg");
        container.id = this.id(map);
        container.setAttribute("overflow", "visible");
        this._path = document.createElementNS(Avionics.SVG.NS, "path");
        this._path.setAttribute("stroke", "red");
        this._path.setAttribute("stroke-width", "4");
        this._path.setAttribute("fill", "none");
        container.appendChild(this._path);
        return container;
    }
    updateDraw(map) {
        if (this.source && this.source.waypoints) {
            let d = "";
            let waypoints = this.source.waypoints;
            for (let i = 0; i < waypoints.length; i++) {
                let wpPoints = [];
                if (waypoints[i].transitionLLas) {
                    for (let j = 0; j < waypoints[i].transitionLLas.length; j++) {
                        wpPoints.push(waypoints[i].transitionLLas[j]);
                    }
                }
                wpPoints.push(waypoints[i].lla);
                for (let j = 0; j < wpPoints.length; j++) {
                    let lla = wpPoints[j];
                    let xy = map.coordinatesToXY(lla);
                    if (i === 0 && j === 0) {
                        d += "M" + xy.x.toFixed(0) + " " + xy.y.toFixed(0) + " ";
                    }
                    else {
                        d += "L" + xy.x.toFixed(0) + " " + xy.y.toFixed(0) + " ";
                    }
                }
            }
            this._path.setAttribute("d", d);
        }
    }
}