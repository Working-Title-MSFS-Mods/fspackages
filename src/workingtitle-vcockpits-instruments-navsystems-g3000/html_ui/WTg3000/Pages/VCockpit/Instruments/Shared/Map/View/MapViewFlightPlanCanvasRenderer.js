class WT_MapViewFlightPlanCanvasRenderer {
    constructor() {
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

        this._tempVector1 = new WT_GVector2(0, 0);
        this._tempVector2 = new WT_GVector2(0, 0);
    }

    /**
     * @readonly
     * @property {WT_FlightPlan} flightPlan
     * @type {WT_FlightPlan}
     */
    get flightPlan() {
        return this._flightPlan;
    }

    /**
     * @readonly
     * @property {WT_FlightPlanLeg} activeLeg
     * @type {WT_FlightPlanLeg}
     */
    get activeLeg() {
        return this._activeLeg;
    }

    needsRedraw() {
        return this._needsRedraw;
    }

    /**
     * @returns {IterableIterator<WT_Waypoint>}
     */
    waypointsRendered() {
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

    setActiveLeg(leg) {
        if (leg === this.activeLeg) {
            return;
        }

        this._activeLeg = leg;
        this._needsRedraw = true;
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_MapProjectionRenderer} projectionRenderer
     * @param {CanvasRenderingContext2D} context
     * @param {WT_GeoPoint} endpoint
     * @param {WT_GeoPoint} previousEndpoint
     * @param {Boolean} isActive
     */
    _renderLine(state, projectionRenderer, context, endpoint, previousEndpoint, isActive) {
        let geoJSON = {
            type: "LineString",
            coordinates: [[previousEndpoint.long, previousEndpoint.lat], [endpoint.long, endpoint.lat]]
        };
        context.beginPath();
        projectionRenderer.renderCanvas(geoJSON, context);
        context.lineWidth = this.standardStrokeWidth * state.dpiScale;
        context.strokeStyle = isActive ? this.activeColor : this.inactiveColor;
        context.stroke();
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_MapProjectionRenderer} projectionRenderer
     * @param {CanvasRenderingContext2D} context
     * @param {WT_GeoPoint} endpoint
     * @param {WT_GeoPoint} previousEndpoint
     * @param {Boolean} isActive
     */
    _renderArrows(state, projectionRenderer, context, endpoint, previousEndpoint, isActive) {
        let begin = projectionRenderer.project(previousEndpoint, this._tempVector1);
        let end = projectionRenderer.project(endpoint, this._tempVector2);
        let delta = end.subtract(begin);

        context.fillStyle = isActive ? this.activeColor : this.inactiveColor;
        context.resetTransform();
        context.translate(begin.x, begin.y);
        context.rotate(delta.theta);

        let arrowHeight = this.standardArrowHeight * state.dpiScale;
        let arrowWidth = this.standardArrowWidth * state.dpiScale;
        let arrowSpacing = this.standardArrowSpacing * state.dpiScale;
        let length = 0;
        let totalLength = delta.length;
        while (totalLength - length >= arrowHeight) {
            let y = -length;

            context.beginPath();
            context.moveTo(-arrowWidth / 2, y);
            context.lineTo(arrowWidth / 2, y);
            context.lineTo(0, y - arrowHeight);
            context.closePath();
            context.fill();

            length += arrowHeight + arrowSpacing;
        }

        context.resetTransform();
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_MapProjectionRenderer} projectionRenderer
     * @param {CanvasRenderingContext2D} context
     * @param {WT_GVector2[]} bounds
     * @param {WT_FlightPlanLeg} leg
     * @param {WT_GeoPoint} previousEndpoint
     */
    _renderLeg(state, projectionRenderer, context, bounds, leg, previousEndpoint) {
        if (leg.waypoint && projectionRenderer.isInViewBounds(leg.waypoint.location, bounds, 0.05)) {
            this._waypointsRendered.add(leg.waypoint);
        }

        if (!previousEndpoint ||
            (!projectionRenderer.isInViewBounds(leg.endpoint, bounds, 0.05) && !projectionRenderer.isInViewBounds(previousEndpoint, bounds, 0.05))) {
            return;
        }

        let isActive = leg === this.activeLeg;

        if (leg instanceof WT_FlightPlanProcedureLeg) {
            switch (leg.procedureLeg.type) {
                case WT_ProcedureLeg.Type.FLY_HEADING_UNTIL_DISTANCE_FROM_REFERENCE:
                case WT_ProcedureLeg.Type.FLY_HEADING_UNTIL_REFERENCE_RADIAL_CROSSING:
                case WT_ProcedureLeg.Type.FLY_HEADING_TO_INTERCEPT:
                case WT_ProcedureLeg.Type.FLY_HEADING_TO_ALTITUDE:
                    this._renderArrows(state, projectionRenderer, context, leg.endpoint, previousEndpoint, isActive);
                    break;
                default:
                    this._renderLine(state, projectionRenderer, context, leg.endpoint, previousEndpoint, isActive);
            }
        } else {
            this._renderLine(state, projectionRenderer, context, leg.endpoint, previousEndpoint, isActive);
        }
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_MapProjectionRenderer} projectionRenderer
     * @param {CanvasRenderingContext2D} context
     */
    render(state, projectionRenderer, context) {
        this._waypointsRendered.clear();

        if (!this.flightPlan) {
            return;
        }

        let bounds = projectionRenderer.viewClipExtent;
        let previousEndpoint = null;
        let origin = this.flightPlan.getOrigin();
        let destination = this.flightPlan.getDestination();
        if (origin && projectionRenderer.isInViewBounds(origin.location, bounds, 0.05)) {
            this._waypointsRendered.add(origin);
        }
        if (destination && projectionRenderer.isInViewBounds(destination.location, bounds, 0.05)) {
            this._waypointsRendered.add(destination);
        }

        for (let leg of this._legs) {
            this._renderLeg(state, projectionRenderer, context, bounds, leg, previousEndpoint);
            if (leg.discontinuity) {
                previousEndpoint = null;
            } else {
                previousEndpoint = leg.endpoint;
            }
        }

        this._needsRedraw = false;
    }
}
/**
 * @enum {Number}
 */
WT_MapViewFlightPlanCanvasRenderer.LegStyles = {
    LINE_STANDARD: 0,
    LINE_THIN: 1,
    LINE_DOTTED: 2,
    ARROW_STANDARD: 3,
    ARROW_ALT: 4,
};
WT_MapViewFlightPlanCanvasRenderer.OPTIONS_DEF = {
    standardStrokeWidth: {default: 4, auto: true},
    thinStrokeWidth: {default: 2, auto: true},
    thinStrokeWidth: {default: 2, auto: true},

    legStyles: {default: [], auto: true},

    standardArrowWidth: {default: 6, auto: true},
    standardArrowHeight: {default: 8, auto: true},
    standardArrowSpacing: {default: 8, auto: true},

    altArrowWidth: {default: 6, auto: true},
    altArrowHeight: {default: 8, auto: true},
    altArrowSpacing: {default: 2, auto: true},

    currentSegmentSizeFactor: {default: 1.5, auto: true},

    inactiveColor: {default: "magenta", auto: true},
    activeColor: {default: "white", auto: true},
};