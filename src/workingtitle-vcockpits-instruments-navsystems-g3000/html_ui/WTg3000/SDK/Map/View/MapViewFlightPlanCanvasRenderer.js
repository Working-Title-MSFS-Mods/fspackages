/**
 * A renderer that draws a flight plan to an HTML canvas.
 */
class WT_MapViewFlightPlanCanvasRenderer {
    constructor(legStyleChooser) {
        this._legStyleChooser = legStyleChooser;

        this._flightPlan = null;
        this._activeLeg = null;
        this._flightPlanListener = this._onFlightPlanEvent.bind(this);
        /**
         * @type {WT_FlightPlanLeg[]}
         */
        this._legs = [];

        this._waypointsRendered = new Set();

        this._needsRedraw = false;

        this._legRenderFuncs = [];
        this._initRenderFuncs();

        this._optsManager = new WT_OptionsManager(this, WT_MapViewFlightPlanCanvasRenderer.OPTIONS_DEF);

        this._tempVector1 = new WT_GVector2(0, 0);
        this._tempVector2 = new WT_GVector2(0, 0);
    }

    _initRenderFuncs() {
        this._legRenderFuncs[WT_MapViewFlightPlanCanvasRenderer.LegStyle.NONE] = this._renderNone.bind(this);
        this._legRenderFuncs[WT_MapViewFlightPlanCanvasRenderer.LegStyle.LINE_STANDARD] = this._renderLineStandard.bind(this);
        this._legRenderFuncs[WT_MapViewFlightPlanCanvasRenderer.LegStyle.LINE_THIN] = this._renderLineThin.bind(this);
        this._legRenderFuncs[WT_MapViewFlightPlanCanvasRenderer.LegStyle.LINE_DOTTED] = this._renderLineDotted.bind(this);
        this._legRenderFuncs[WT_MapViewFlightPlanCanvasRenderer.LegStyle.ARROW_STANDARD] = this._renderArrowsStandard.bind(this);
        this._legRenderFuncs[WT_MapViewFlightPlanCanvasRenderer.LegStyle.ARROW_ALT] = this._renderArrowsAlt.bind(this);
    }

    /**
     * @readonly
     * @property {WT_FlightPlan} flightPlan - the flight plan assigned to this renderer.
     * @type {WT_FlightPlan}
     */
    get flightPlan() {
        return this._flightPlan;
    }

    /**
     * Gets the active flight plan leg.
     * @returns {WT_FlightPlanLeg} the active flight plan leg, or null if there is no active leg.
     */
    getActiveLeg() {
        return this._activeLeg;
    }

    /**
     * Checks whether the flight plan assigned to this renderer needs to be redrawn. A flight plan needs to
     * be redrawn if any modifications have been made to it since the last time it was drawn, if a new
     * flight plan was assigned, or if a previously assigned flight plan was removed.
     * @returns {Boolean} whether the flight plan assigned to this renderer needs to be redrawn.
     */
    needsRedraw() {
        return this._needsRedraw;
    }

    /**
     * Gets a list of waypoints that were rendered the last time this renderer's .render() method was called.
     * Waypoints are rendered if they are part of the assigned flight plan (the origin, destination, or a leg
     * terminator fix) and were projected within the boundaries of the canvas to which the flight plan was rendered.
     * @returns {IterableIterator<WT_Waypoint>} a list of the waypoints that were last rendered, in the form of an
     *                                          IterableIterator.
     */
    getWaypointsRendered() {
        return this._waypointsRendered.values();
    }

    _update() {
        this._legs = [];
        if (this.flightPlan) {
            this._legs = this.flightPlan.legs();
        }
    }

    _onFlightPlanEvent(event) {
        this._update();
        this._needsRedraw = true;
    }

    setOptions(options) {
        this._optsManager.setOptions(options);
    }

    /**
     * Assigns a flight plan to this renderer. Assigning a value of null will remove the currently
     * assigned flight plan without replacing it with another one.
     * @param {WT_FlightPlan} flightPlan - a flight plan.
     */
    setFlightPlan(flightPlan) {
        if (flightPlan === this.flightPlan) {
            return;
        }

        if (this.flightPlan) {
            this.flightPlan.removeListener(this._flightPlanListener);
        }

        this._flightPlan = flightPlan;
        if (this.flightPlan) {
            this.flightPlan.addListener(this._flightPlanListener);
        }
        this._update();
        this._needsRedraw = true;
    }

    /**
     * Sets the active leg for the flight plan assigned to this renderer. A value of null indicates the
     * flight plan has no active leg.
     * @param {WT_FlightPlanLeg} leg - the active leg.
     */
    setActiveLeg(leg) {
        if (leg === this.getActiveLeg()) {
            return;
        }

        this._activeLeg = leg;
        this._needsRedraw = true;
    }

    _strokePath(context, lineWidth, strokeStyle, lineDash) {
        context.lineWidth = lineWidth;
        context.strokeStyle = strokeStyle;
        if (lineDash) {
            context.setLineDash(lineDash);
        } else {
            context.setLineDash([]);
        }
        context.stroke();
    }

    /**
     *
     * @param {WT_MapProjectionRenderer} projectionRenderer
     * @param {CanvasRenderingContext2D} context
     * @param {WT_GeoPoint} start
     * @param {WT_GeoPoint} end
     */
    _pathGreatCircle(projectionRenderer, context, start, end) {
        let geoJSON = {
            type: "LineString",
            coordinates: [[start.long, start.lat], [end.long, end.lat]]
        };
        let path = projectionRenderer.renderSVG(geoJSON, context);
        if (!path) {
            return;
        }
        path = path.replace(/^M/,"L");
        let pattern = /([LM])(-?\d+(\.\d*)?(e-?\d+)?),(-?\d+(\.\d*)?(e-?\d+)?)/g;
        let result;
        while ((result = pattern.exec(path)) !== null) {
            let x = parseFloat(result[2]);
            let y = parseFloat(result[5]);
            if (result[1] === "M") {
                context.moveTo(x, y);
            } else {
                context.lineTo(x, y);
            }
        }
    }

    /**
     *
     * @param {WT_MapProjectionRenderer} projectionRenderer
     * @param {CanvasRenderingContext2D} context
     * @param {WT_GeoPoint} start
     * @param {WT_GeoPoint} end
     */
    _pathRhumb(projectionRenderer, context, start, end) {
        let projected = projectionRenderer.project(end, this._tempVector1);
        context.lineTo(projected.x, projected.y);
    }

    /**
     *
     * @param {WT_MapProjectionRenderer} projectionRenderer
     * @param {CanvasRenderingContext2D} context
     * @param {WT_FlightPlanLeg} leg
     * @param {WT_GeoPoint} previousEndpoint
     */
    _loadLinePathFromLeg(projectionRenderer, context, leg, previousEndpoint) {
        context.beginPath();
        let step = leg.firstStep();
        let from = previousEndpoint;
        while (step) {
            let to = step.endpoint;
            if (from) {
                switch (step.type) {
                    case WT_FlightPlanLegStep.Type.INITIAL:
                    case WT_FlightPlanLegStep.Type.DIRECT:
                        this._pathGreatCircle(projectionRenderer, context, from, to);
                        break;
                    case WT_FlightPlanLegStep.Type.HEADING:
                        this._pathRhumb(projectionRenderer, context, from, to);
                        break;
                }
            } else {
                let projectedStart = projectionRenderer.project(to, this._tempVector1);
                context.moveTo(projectedStart.x, projectedStart.y);
            }
            if (step.isLoop) {
                break;
            }
            step = step.next();
            from = to;
        }
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_MapProjectionRenderer} projectionRenderer
     * @param {CanvasRenderingContext2D} context
     * @param {WT_FlightPlanLeg} leg
     * @param {WT_GeoPoint} previousEndpoint
     * @param {Boolean} isActive
     */
    _renderLineStandard(state, projectionRenderer, context, leg, previousEndpoint, isActive) {
        this._loadLinePathFromLeg(projectionRenderer, context, leg, previousEndpoint);

        if (this.standardOutlineWidth > 0) {
            this._strokePath(context, (2 * this.standardOutlineWidth + this.standardStrokeWidth) * state.dpiScale, isActive ? this.activeOutlineColor : this.inactiveOutlineColor);
        }
        this._strokePath(context, this.standardStrokeWidth * state.dpiScale, isActive ? this.activeColor : this.inactiveColor);
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_MapProjectionRenderer} projectionRenderer
     * @param {CanvasRenderingContext2D} context
     * @param {WT_FlightPlanLeg} leg
     * @param {WT_GeoPoint} previousEndpoint
     * @param {Boolean} isActive
     */
    _renderLineThin(state, projectionRenderer, context, leg, previousEndpoint, isActive) {
        this._loadLinePathFromLeg(projectionRenderer, context, leg, previousEndpoint);

        if (this.thinOutlineWidth > 0) {
            this._strokePath(context, (2 * this.thinOutlineWidth + this.thinStrokeWidth) * state.dpiScale, isActive ? this.activeOutlineColor : this.inactiveOutlineColor);
        }
        this._strokePath(context, this.thinStrokeWidth * state.dpiScale, isActive ? this.activeColor : this.inactiveColor);
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_MapProjectionRenderer} projectionRenderer
     * @param {CanvasRenderingContext2D} context
     * @param {WT_FlightPlanLeg} leg
     * @param {WT_GeoPoint} previousEndpoint
     * @param {Boolean} isActive
     */
    _renderLineDotted(state, projectionRenderer, context, leg, previousEndpoint, isActive) {
        this._loadLinePathFromLeg(projectionRenderer, context, leg, previousEndpoint);

        let lineDash = this.dottedLineDash.map(e => state.dpiScale * e);
        if (this.dottedOutlineWidth > 0) {
            this._strokePath(context, (2 * this.dottedOutlineWidth + this.dottedStrokeWidth) * state.dpiScale, isActive ? this.activeOutlineColor : this.inactiveOutlineColor, lineDash);
        }
        this._strokePath(context, this.dottedStrokeWidth * state.dpiScale, isActive ? this.activeColor : this.inactiveColor, lineDash);
    }

    _drawArrowsRhumb(projectionRenderer, context, arrowWidth, arrowHeight, arrowSpacing, useStroke, start, end) {
        let projectedStart = projectionRenderer.project(start, this._tempVector1);
        let projectedEnd = projectionRenderer.project(end, this._tempVector2);
        let delta = projectedEnd.subtract(projectedStart);

        context.resetTransform();
        context.translate(projectedStart.x, projectedStart.y);
        context.rotate(delta.theta);

        let length = 0;
        let totalLength = delta.length;
        while (totalLength - length >= arrowHeight) {
            let y = -length;

            context.beginPath();
            context.moveTo(-arrowWidth / 2, y);
            context.lineTo(arrowWidth / 2, y);
            context.lineTo(0, y - arrowHeight);
            context.closePath();
            if (useStroke) {
                context.stroke();
            }
            context.fill();

            length += arrowHeight + arrowSpacing;
        }

        context.resetTransform();
    }

    _drawArrowsFromLeg(projectionRenderer, context, leg, previousEndpoint, arrowWidth, arrowHeight, arrowSpacing) {
        let step = leg.firstStep();
        let from = previousEndpoint;
        while (step) {
            let to = step.endpoint;
            switch (step.type) {
                case WT_FlightPlanLegStep.Type.INITIAL:
                case WT_FlightPlanLegStep.Type.DIRECT:
                    // TODO: implement drawing arrows along great circle
                    this._drawArrowsRhumb(projectionRenderer, context, arrowWidth, arrowHeight, arrowSpacing, this.standardArrowOutlineWidth > 0, from, to);
                    break;
                case WT_FlightPlanLegStep.Type.HEADING:
                    this._drawArrowsRhumb(projectionRenderer, context, arrowWidth, arrowHeight, arrowSpacing, this.standardArrowOutlineWidth > 0, from, to);
                    break;
            }
            if (step.isLoop) {
                break;
            }
            step = step.next();
            from = to;
        }
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_MapProjectionRenderer} projectionRenderer
     * @param {CanvasRenderingContext2D} context
     * @param {WT_FlightPlanLeg} leg
     * @param {WT_GeoPoint} previousEndpoint
     * @param {Boolean} isActive
     */
    _renderArrowsStandard(state, projectionRenderer, context, leg, previousEndpoint, isActive) {
        context.fillStyle = isActive ? this.activeColor : this.inactiveColor;
        if (this.standardArrowOutlineWidth > 0) {
            context.lineWidth = this.standardArrowOutlineWidth * 2 * state.dpiScale;
            context.strokeStyle = isActive ? this.activeOutlineColor: this.inactiveOutlineColor;
        }

        let arrowWidth = this.standardArrowWidth * state.dpiScale;
        let arrowHeight = this.standardArrowHeight * state.dpiScale;
        let arrowSpacing = this.standardArrowSpacing * state.dpiScale;

        this._drawArrowsFromLeg(projectionRenderer, context, leg, previousEndpoint, arrowWidth, arrowHeight, arrowSpacing);
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_MapProjectionRenderer} projectionRenderer
     * @param {CanvasRenderingContext2D} context
     * @param {Boolean} useRhumb
     * @param {WT_GeoPoint} endpoint
     * @param {WT_GeoPoint} previousEndpoint
     * @param {Boolean} isActive
     */
    _renderArrowsAlt(state, projectionRenderer, context, useRhumb, endpoint, previousEndpoint, isActive) {
        context.fillStyle = isActive ? this.activeColor : this.inactiveColor;
        if (this.altArrowOutlineWidth > 0) {
            context.lineWidth = this.altArrowOutlineWidth * 2 * state.dpiScale;
            context.strokeStyle = isActive ? this.activeOutlineColor: this.inactiveOutlineColor;
        }

        let arrowWidth = this.altArrowWidth * state.dpiScale;
        let arrowHeight = this.altArrowHeight * state.dpiScale;
        let arrowSpacing = this.altArrowSpacing * state.dpiScale;

        this._drawArrowsFromLeg(projectionRenderer, context, leg, previousEndpoint, arrowWidth, arrowHeight, arrowSpacing);
    }

    _renderNone(state, projectionRenderer, context, useRhumb, endpoint, previousEndpoint, isActive) {
    }

    /**
     * Renders a single flight plan leg.
     * @param {WT_MapViewState} state - the current map view state.
     * @param {WT_MapProjectionRenderer} projectionRenderer - the projection renderer to use to project and render
     *                                                        the flight plan.
     * @param {CanvasRenderingContext2D} context - the 2D rendering context of the canvas to which to render.
     * @param {WT_GVector2[]} bounds - the boundaries of the canvas, represented as an array containing the coordinates
     *                                 of the top-left corner at index 0 and the bottom-right corner at index 1.
     * @param {WT_FlightPlanLeg} leg - the leg to render.
     * @param {WT_GeoPoint} previousEndpoint - the terminator fix of the previous leg.
     * @param {Boolean} discontinuity - whether the previous leg ended in a discontinuity.
     */
    _renderLeg(state, projectionRenderer, context, bounds, leg, previousEndpoint, discontinuity) {
        if (projectionRenderer.isInViewBounds(leg.fix.location, bounds, 0.05)) {
            this._waypointsRendered.add(leg.fix);
        }

        if (!previousEndpoint) {
            return;
        }

        let isActive = leg === this.getActiveLeg();
        let style = this._legStyleChooser.chooseStyle(leg, this.getActiveLeg(), discontinuity);
        let renderFunc = this._legRenderFuncs[style];
        if (!renderFunc) {
            renderFunc = this._legRenderFuncs[WT_MapViewFlightPlanCanvasRenderer.LegStyle.LINE_STANDARD];
        }
        renderFunc(state, projectionRenderer, context, leg, previousEndpoint, isActive);
    }

    /**
     * Renders the flight plan assigned to this renderer to an HTML canvas.
     * @param {WT_MapViewState} state - the current map view state.
     * @param {WT_MapProjectionRenderer} projectionRenderer - the projection renderer to use to project and render
     *                                                        the flight plan.
     * @param {CanvasRenderingContext2D} context - the 2D rendering context of the canvas to which to render.
     */
    render(state, projectionRenderer, context) {
        this._needsRedraw = false;

        this._waypointsRendered.clear();

        if (!this.flightPlan) {
            return;
        }

        let bounds = projectionRenderer.viewClipExtent;
        let origin = this.flightPlan.getOrigin().waypoint;
        let destination = this.flightPlan.getDestination().waypoint;
        if (origin && projectionRenderer.isInViewBounds(origin.location, bounds, 0.05)) {
            this._waypointsRendered.add(origin);
        }
        if (destination && projectionRenderer.isInViewBounds(destination.location, bounds, 0.05)) {
            this._waypointsRendered.add(destination);
        }

        let start = (this.getActiveLeg() && !this.drawPreviousLegs) ? this.getActiveLeg().index : 0;
        let startPrevious = this._legs[start - 1];
        let previousEndpoint = startPrevious ? startPrevious.endpoint : null;
        let discontinuity = startPrevious ? startPrevious.discontinuity : false;
        for (let i = start; i < this._legs.length; i++) {
            let leg = this._legs[i];
            this._renderLeg(state, projectionRenderer, context, bounds, leg, previousEndpoint, discontinuity);
            previousEndpoint = leg.endpoint;
            discontinuity = leg.discontinuity;
        }
    }
}
/**
 * @enum {Number}
 */
WT_MapViewFlightPlanCanvasRenderer.LegStyle = {
    NONE: 0,
    LINE_STANDARD: 1,
    LINE_THIN: 2,
    LINE_DOTTED: 3,
    ARROW_STANDARD: 4,
    ARROW_ALT: 5,
};
WT_MapViewFlightPlanCanvasRenderer.OPTIONS_DEF = {
    drawPreviousLegs: {default: true, auto: true},

    standardStrokeWidth: {default: 6, auto: true},
    standardOutlineWidth: {default: 1, auto: true},
    thinStrokeWidth: {default: 4, auto: true},
    thinOutlineWidth: {default: 1, auto: true},
    dottedStrokeWidth: {default: 4, auto: true},
    dottedOutlineWidth: {default: 1, auto: true},
    dottedLineDash: {default: [4, 4], auto: true},

    standardArrowWidth: {default: 8, auto: true},
    standardArrowHeight: {default: 12, auto: true},
    standardArrowSpacing: {default: 12, auto: true},
    standardArrowOutlineWidth: {default: 1, auto: true},

    altArrowWidth: {default: 8, auto: true},
    altArrowHeight: {default: 12, auto: true},
    altArrowSpacing: {default: 4, auto: true},
    altArrowOutlineWidth: {default: 1, auto: true},

    inactiveColor: {default: "white", auto: true},
    inactiveOutlineColor: {default: "#454545", auto: true},
    activeColor: {default: "#9c70b1", auto: true},
    activeOutlineColor: {default: "#652f70", auto: true},
};