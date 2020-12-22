class WT_MapViewFlightPlanCanvasRenderer {
    constructor(legStyleChooser) {
        this._legStyleChooser = legStyleChooser;

        this._flightPlan = null;
        this._activeLeg = null;
        this._activeLegIndex = -1;
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
        if (leg) {
            this._activeLegIndex = this._legs.indexOf(leg);
        } else {
            this._activeLegIndex = -1;
        }
        this._needsRedraw = true;
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
        context.beginPath();
        projectionRenderer.renderCanvas(geoJSON, context);
    }

    /**
     *
     * @param {WT_MapProjectionRenderer} projectionRenderer
     * @param {CanvasRenderingContext2D} context
     * @param {WT_GeoPoint} start
     * @param {WT_GeoPoint} end
     */
    _pathRhumb(projectionRenderer, context, start, end) {
        let projectedStart = projectionRenderer.project(start, this._tempVector1);
        let projectedEnd = projectionRenderer.project(end, this._tempVector2);
        context.beginPath();
        context.moveTo(projectedStart);
        context.lineTo(projectedEnd);
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
    _renderLineStandard(state, projectionRenderer, context, useRhumb, endpoint, previousEndpoint, isActive) {
        if (useRhumb) {
            this._pathRhumb(projectionRenderer, context, previousEndpoint, endpoint);
        } else {
            this._pathGreatCircle(projectionRenderer, context, previousEndpoint, endpoint);
        }
        context.lineWidth = this.standardStrokeWidth * state.dpiScale;
        context.strokeStyle = isActive ? this.activeColor : this.inactiveColor;
        context.stroke();
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
    _renderLineThin(state, projectionRenderer, context, useRhumb, endpoint, previousEndpoint, isActive) {
        if (useRhumb) {
            this._pathRhumb(projectionRenderer, context, previousEndpoint, endpoint);
        } else {
            this._pathGreatCircle(projectionRenderer, context, previousEndpoint, endpoint);
        }
        context.lineWidth = this.thinStrokeWidth * state.dpiScale;
        context.strokeStyle = isActive ? this.activeColor : this.inactiveColor;
        context.stroke();
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
    _renderLineDotted(state, projectionRenderer, context, useRhumb, endpoint, previousEndpoint, isActive) {
        if (useRhumb) {
            this._pathRhumb(projectionRenderer, context, previousEndpoint, endpoint);
        } else {
            this._pathGreatCircle(projectionRenderer, context, previousEndpoint, endpoint);
        }
        context.lineWidth = this.dottedStrokeWidth * state.dpiScale;
        context.strokeStyle = isActive ? this.activeColor : this.inactiveColor;
        context.setLineDash(this.dottedPattern);
        context.stroke();
    }

    _drawArrowsRhumb(projectionRenderer, context, arrowWidth, arrowHeight, arrowSpacing, start, end) {
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
     * @param {Boolean} useRhumb
     * @param {WT_GeoPoint} endpoint
     * @param {WT_GeoPoint} previousEndpoint
     * @param {Boolean} isActive
     */
    _renderArrowsStandard(state, projectionRenderer, context, useRhumb, endpoint, previousEndpoint, isActive) {
        context.fillStyle = isActive ? this.activeColor : this.inactiveColor;

        let arrowWidth = this.standardArrowWidth * state.dpiScale;
        let arrowHeight = this.standardArrowHeight * state.dpiScale;
        let arrowSpacing = this.standardArrowSpacing * state.dpiScale;

        if (useRhumb) {
            this._drawArrowsRhumb(projectionRenderer, context, arrowWidth, arrowHeight, arrowSpacing, previousEndpoint, endpoint);
        } else {
            // TODO: implement drawing arrows along great circle
            this._drawArrowsRhumb(projectionRenderer, context, arrowWidth, arrowHeight, arrowSpacing, previousEndpoint, endpoint);
        }
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

        let arrowWidth = this.altArrowWidth * state.dpiScale;
        let arrowHeight = this.altArrowHeight * state.dpiScale;
        let arrowSpacing = this.altArrowSpacing * state.dpiScale;

        if (useRhumb) {
            this._drawArrowsRhumb(projectionRenderer, context, arrowWidth, arrowHeight, arrowSpacing, previousEndpoint, endpoint);
        } else {
            // TODO: implement drawing arrows along great circle
            this._drawArrowsRhumb(projectionRenderer, context, arrowWidth, arrowHeight, arrowSpacing, previousEndpoint, endpoint);
        }
    }

    _renderNone(state, projectionRenderer, context, useRhumb, endpoint, previousEndpoint, isActive) {
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_MapProjectionRenderer} projectionRenderer
     * @param {CanvasRenderingContext2D} context
     * @param {WT_GVector2[]} bounds
     * @param {Number} index
     * @param {WT_FlightPlanLeg} leg
     * @param {WT_GeoPoint} previousEndpoint
     * @param {Boolean} discontinuity
     */
    _renderLeg(state, projectionRenderer, context, bounds, index, leg, previousEndpoint, discontinuity) {
        if (leg.waypoint && projectionRenderer.isInViewBounds(leg.waypoint.location, bounds, 0.05)) {
            this._waypointsRendered.add(leg.waypoint);
        }

        if (!previousEndpoint ||
            (!projectionRenderer.isInViewBounds(leg.endpoint, bounds, 0.05) && !projectionRenderer.isInViewBounds(previousEndpoint, bounds, 0.05))) {
            return;
        }

        let isActive = leg === this.activeLeg;
        let useRhumb = false;
        if (leg instanceof WT_FlightPlanProcedureLeg) {
            switch (leg.procedureLeg.type) {
                case WT_ProcedureLeg.Type.FLY_HEADING_UNTIL_DISTANCE_FROM_REFERENCE:
                case WT_ProcedureLeg.Type.FLY_HEADING_UNTIL_REFERENCE_RADIAL_CROSSING:
                case WT_ProcedureLeg.Type.FLY_HEADING_TO_INTERCEPT:
                case WT_ProcedureLeg.Type.FLY_HEADING_TO_ALTITUDE:
                    useRhumb = true;
                    break;
            }
        }

        let style = this._legStyleChooser.chooseStyle(leg, index, this.activeLeg, this._activeLegIndex, discontinuity);
        let renderFunc = this._legRenderFuncs[style];
        if (renderFunc) {
            renderFunc(state, projectionRenderer, context, useRhumb, leg.endpoint, previousEndpoint, isActive);
        } else {
            this._renderLineStandard(state, projectionRenderer, context, useRhumb, leg.endpoint, previousEndpoint, isActive);
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

        let discontinuity = false;
        for (let i = 0; i < this._legs.length; i++) {
            let leg = this._legs[i];
            this._renderLeg(state, projectionRenderer, context, bounds, i, leg, previousEndpoint, discontinuity);
            previousEndpoint = leg.endpoint;
            discontinuity = leg.discontinuity;
        }

        this._needsRedraw = false;
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
    standardStrokeWidth: {default: 4, auto: true},
    thinStrokeWidth: {default: 2, auto: true},
    dottedStrokeWidth: {default: 2, auto: true},
    dottedPattern: {default: [2, 2], auto: true},

    standardArrowWidth: {default: 6, auto: true},
    standardArrowHeight: {default: 8, auto: true},
    standardArrowSpacing: {default: 8, auto: true},

    altArrowWidth: {default: 6, auto: true},
    altArrowHeight: {default: 8, auto: true},
    altArrowSpacing: {default: 2, auto: true},

    inactiveColor: {default: "white", auto: true},
    activeColor: {default: "magenta", auto: true},
};