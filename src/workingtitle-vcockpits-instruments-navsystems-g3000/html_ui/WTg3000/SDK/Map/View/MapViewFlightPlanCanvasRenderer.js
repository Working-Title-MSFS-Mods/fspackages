/**
 * A renderer that draws a flight plan to an HTML canvas.
 */
class WT_MapViewFlightPlanCanvasRenderer {
    /**
     * @param {WT_MapViewFlightPlanLegCanvasStyler} legStyler - the leg styler to use for determining how to render
     *                                                          the paths for individual flight plan legs.
     */
    constructor(legStyler) {
        this._legStyler = legStyler;

        this._flightPlan = null;
        this._activeLeg = null;
        this._flightPlanListener = this._onFlightPlanEvent.bind(this);
        /**
         * @type {WT_FlightPlanLeg[]}
         */
        this._legs = [];

        this._waypointsRendered = new Set();

        this._needsRedraw = false;

        this._optsManager = new WT_OptionsManager(this, WT_MapViewFlightPlanCanvasRenderer.OPTIONS_DEF);
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
     * @readonly
     * @property {WT_MapViewFlightPlanLegCanvasStyler} legStyler - this renderer's flight plan leg styler.
     * @type {WT_MapViewFlightPlanLegCanvasStyler}
     */
    get legStyler() {
        return this._legStyler;
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

    setOptions(opts) {
        this._optsManager.setOptions(opts);
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

        let legRenderer = this._legStyler.chooseRenderer(leg, this.getActiveLeg(), discontinuity);
        if (legRenderer) {
            legRenderer.render(state, projectionRenderer, context, leg, previousEndpoint);
        }
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
WT_MapViewFlightPlanCanvasRenderer.OPTIONS_DEF = {
    drawPreviousLegs: {default: true, auto: true}
};

/**
 * Determines the style of flight plan legs by selecting an appropriate renderer for each leg.
 * @abstract
 */
class WT_MapViewFlightPlanLegCanvasStyler {
    constructor() {
        this._optsManager = new WT_OptionsManager(this, {});
    }

    setOptions(opts) {
        this._optsManager.setOptions(opts);
    }

    /**
     * Selects an appropriate leg renderer to render a flight plan leg.
     * @param {WT_FlightPlanLeg} leg - the flight plan leg to render.
     * @param {WT_FlightPlanLeg} activeLeg - the active leg in the flight plan, or null if there is no active leg.
     * @param {Boolean} discontinuity - whether the previous flight plan leg ended in a discontinuity.
     * @returns {WT_MapViewFlightPlanLegCanvasRenderer} a leg renderer, or null if the leg should not be rendered.
     */
    chooseRenderer(leg, activeLeg, discontinuity) {
    }
}

/**
 * Renders flight plan legs to HTML canvas.
 * @abstract
 */
class WT_MapViewFlightPlanLegCanvasRenderer {
    /**
     * Renders a flight plan leg.
     * @param {WT_MapViewState} state - the current map view state.
     * @param {WT_MapProjectionRenderer} projectionRenderer - the projection renderer to use to project the flight plan
     *                                                        leg path.
     * @param {CanvasRenderingContext2D} context - the canvas context to which to render.
     * @param {WT_FlightPlanLeg} leg - the flight plan leg to render.
     * @param {WT_GeoPoint} previousEndpoint - the location at which the previous flight plan leg ended.
     */
    render(state, projectionRenderer, context, leg, previousEndpoint) {
    }
}

/**
 * Renders flight plan legs to HTML canvas as a simple line. The line's color, width, outline, and dash can
 * be customized.
 */
class WT_MapViewFlightPlanLegCanvasLineRenderer extends WT_MapViewFlightPlanLegCanvasRenderer {
    constructor() {
        super();

        this._optsManager = new WT_OptionsManager(this, WT_MapViewFlightPlanLegCanvasLineRenderer.OPTIONS_DEF);

        this._tempVector1 = new WT_GVector2(0, 0);
    }

    /**
     *
     * @param {CanvasRenderingContext2D} context
     * @param {Number} lineWidth
     * @param {String|CanvasGradient|CanvasPattern} strokeStyle
     * @param {Number[]} [lineDash]
     */
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
    _loadPath(projectionRenderer, context, leg, previousEndpoint) {
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
     * Renders a flight plan leg.
     * @param {WT_MapViewState} state - the current map view state.
     * @param {WT_MapProjectionRenderer} projectionRenderer - the projection renderer to use to project the flight plan
     *                                                        leg path.
     * @param {CanvasRenderingContext2D} context - the canvas context to which to render.
     * @param {WT_FlightPlanLeg} leg - the flight plan leg to render.
     * @param {WT_GeoPoint} previousEndpoint - the location at which the previous flight plan leg ended.
     */
    render(state, projectionRenderer, context, leg, previousEndpoint) {
        this._loadPath(projectionRenderer, context, leg, previousEndpoint);

        if (this.outlineWidth > 0) {
            this._strokePath(context, (2 * this.outlineWidth + this.strokeWidth) * state.dpiScale, this.outlineColor, this.dash);
        }
        this._strokePath(context, this.strokeWidth * state.dpiScale, this.strokeColor, this.dash);
    }
}
WT_MapViewFlightPlanLegCanvasLineRenderer.OPTIONS_DEF = {
    strokeWidth: {default: 6, auto: true},
    strokeColor: {default: "white", auto: true},
    outlineWidth: {default: 1, auto: true},
    outlineColor: {default: "black", auto: true},
    dash: {default: [], auto: true}
};

/**
 * Renders flight plan legs to HTML canvas as a series of arrows. The arrows' width, height, spacing, color, and
 * outline can be customized.
 */
class WT_MapViewFlightPlanLegCanvasArrowRenderer extends WT_MapViewFlightPlanLegCanvasRenderer {
    constructor() {
        super();

        this._optsManager = new WT_OptionsManager(this, WT_MapViewFlightPlanLegCanvasArrowRenderer.OPTIONS_DEF);

        this._tempVector1 = new WT_GVector2(0, 0);
        this._tempVector2 = new WT_GVector2(0, 0);
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
                    this._drawArrowsRhumb(projectionRenderer, context, arrowWidth, arrowHeight, arrowSpacing, this.outlineWidth > 0, from, to);
                    break;
                case WT_FlightPlanLegStep.Type.HEADING:
                    this._drawArrowsRhumb(projectionRenderer, context, arrowWidth, arrowHeight, arrowSpacing, this.outlineWidth > 0, from, to);
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
     * Renders a flight plan leg.
     * @param {WT_MapViewState} state - the current map view state.
     * @param {WT_MapProjectionRenderer} projectionRenderer - the projection renderer to use to project the flight plan
     *                                                        leg path.
     * @param {CanvasRenderingContext2D} context - the canvas context to which to render.
     * @param {WT_FlightPlanLeg} leg - the flight plan leg to render.
     * @param {WT_GeoPoint} previousEndpoint - the location at which the previous flight plan leg ended.
     */
    render(state, projectionRenderer, context, leg, previousEndpoint) {
        context.fillStyle = this.fillColor;
        if (this.outlineWidth > 0) {
            context.lineWidth = this.outlineWidth * 2 * state.dpiScale;
            context.strokeStyle = this.outlineColor;
        }

        let arrowWidth = this.width * state.dpiScale;
        let arrowHeight = this.height * state.dpiScale;
        let arrowSpacing = this.spacing * state.dpiScale;

        this._drawArrowsFromLeg(projectionRenderer, context, leg, previousEndpoint, arrowWidth, arrowHeight, arrowSpacing);
    }
}
WT_MapViewFlightPlanLegCanvasArrowRenderer.OPTIONS_DEF = {
    fillColor: {default: "white", auto: true},
    outlineWidth: {default: 1, auto: true},
    outlineColor: {default: "black", auto: true},
    width: {default: 8, auto: true},
    height: {default: 12, auto: true},
    spacing: {default: 12, auto: true}
};