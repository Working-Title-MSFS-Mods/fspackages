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
     * @property {WT_FlightPlan} flightPlan
     * @type {WT_FlightPlan}
     */
    get flightPlan() {
        return this._flightPlan;
    }

    /**
     *
     * @returns {WT_FlightPlanLeg}
     */
    activeLeg() {
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

    setOptions(options) {
        this._optsManager.setOptions(options);
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

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     */
    setActiveLeg(leg) {
        if (leg === this.activeLeg()) {
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

        if (this.thinOutlineWidth > 0) {

        }

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

        let lineDash = this.dottedLineDash.map(e => state.dpiScale * e);
        if (this.dottedOutlineWidth > 0) {
            this._strokePath(context, (2 * this.dottedOutlineWidth + this.dottedStrokeWidth) * state.dpiScale, isActive ? this.activeOutlineColor : this.inactiveOutlineColor, lineDash);
        }
        this._strokePath(context, this.dottedStrokeWidth * state.dpiScale, isActive ? this.activeColor : this.inactiveColor, lineDash);
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
        if (projectionRenderer.isInViewBounds(leg.fix.location, bounds, 0.05)) {
            this._waypointsRendered.add(leg.fix);
        }

        if (!previousEndpoint ||
            (!projectionRenderer.isInViewBounds(leg.endpoint, bounds, 0.05) && !projectionRenderer.isInViewBounds(previousEndpoint, bounds, 0.05))) {
            return;
        }

        let isActive = leg === this.activeLeg();
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

        let style = this._legStyleChooser.chooseStyle(leg, this.activeLeg(), discontinuity);
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
        this._needsRedraw = false;

        this._waypointsRendered.clear();

        if (!this.flightPlan) {
            return;
        }

        let bounds = projectionRenderer.viewClipExtent;
        let origin = this.flightPlan.getOrigin();
        let destination = this.flightPlan.getDestination();
        if (origin && projectionRenderer.isInViewBounds(origin.location, bounds, 0.05)) {
            this._waypointsRendered.add(origin);
        }
        if (destination && projectionRenderer.isInViewBounds(destination.location, bounds, 0.05)) {
            this._waypointsRendered.add(destination);
        }

        let start = (this.activeLeg() && !this.drawPreviousLegs) ? this.activeLeg().index : 0;
        let startPrevious = this._legs[start - 1];
        let previousEndpoint = startPrevious ? startPrevious.endpoint : null;
        let discontinuity = startPrevious ? startPrevious.discontinuity : false;
        for (let i = start; i < this._legs.length; i++) {
            let leg = this._legs[i];
            this._renderLeg(state, projectionRenderer, context, bounds, i, leg, previousEndpoint, discontinuity);
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

    altArrowWidth: {default: 8, auto: true},
    altArrowHeight: {default: 12, auto: true},
    altArrowSpacing: {default: 4, auto: true},

    inactiveColor: {default: "white", auto: true},
    inactiveOutlineColor: {default: "#454545", auto: true},
    activeColor: {default: "#9c70b1", auto: true},
    activeOutlineColor: {default: "#652f70", auto: true},
};