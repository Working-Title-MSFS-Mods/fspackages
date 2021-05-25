/**
 * A track vector. This layer draws a line from the position of the airplane which marks the plane's predicted path.
 * The amount of time to look forward (lookahead time) in constructing the predicted path is governed by the map model.
 * The predicted path can be either dynamic, taking into account the current turn speed, or not, depending on the lookahead time.
 * The use of this layer requires the .trackVector module to be added to the map model.
 */
class WT_MapViewTrackVectorLayer extends WT_MapViewMultiLayer {
    constructor(airspeedSensorIndex, className = WT_MapViewTrackVectorLayer.CLASS_DEFAULT, configName = WT_MapViewTrackVectorLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._airspeedSensorIndex = airspeedSensorIndex;

        this._dynamicLookaheadMax = new WT_NumberUnit(0, WT_Unit.SECOND);

        this._optsManager = new WT_OptionsManager(this, WT_MapViewTrackVectorLayer.OPTIONS_DEF);

        this._vectorLayer = new WT_MapViewCanvas(false, true);
        this.addSubLayer(this._vectorLayer);

        this._lastTime = 0;
        this._lastTurnSpeed = 0;
        this._lastDrawnBounds = {left: 0, top: 0, width: 0, height: 0};

        this._tempNM = WT_Unit.NMILE.createNumber(0);
        this._tempKnot = WT_Unit.KNOT.createNumber(0);
        this._tempTrueBearing = new WT_NavAngleUnit(false).createNumber(0);
        this._tempGeoPoint1 = new WT_GeoPoint(0, 0);
        this._tempGeoPoint2 = new WT_GeoPoint(0, 0);
    }

    _setPropertyFromConfig(name) {
        if (name === "dynamicLookaheadMax") {
            this._dynamicLookaheadMax.refNumber = this.config[name];
        } else {
            super._setPropertyFromConfig(name);
        }
    }

    /**
     * @property {WT_NumberUnit} dynamicLookaheadMax - the maximum lookahead time to use when calculating dynamic track vectors.
     * @type {WT_NumberUnit}
     */
    get dynamicLookaheadMax() {
        return this._dynamicLookaheadMax.readonly();
    }

    set dynamicLookaheadMax(value) {
        this._dynamicLookaheadMax.set(value);
    }

    /**
     * @param {WT_MapViewState} state
     */
    isVisible(state) {
        return state.model.trackVector.show;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onConfigLoaded(state) {
        for (let property of WT_MapViewTrackVectorLayer.CONFIG_PROPERTIES) {
            this._setPropertyFromConfig(property);
        }
    }

    _initTurnSpeedSmoother() {
        this._turnSpeedSmoother = new WT_ExponentialSmoother(this.smoothingConstant, 0, WT_MapViewTrackVectorLayer.SMOOTHING_MAX_TIME_DELTA);
    }

    onAttached(state) {
        super.onAttached(state);

        this._initTurnSpeedSmoother(state);
    }

    _setLastDrawnBounds(left, top, width, height) {
        this._lastDrawnBounds.left = left;
        this._lastDrawnBounds.top = top;
        this._lastDrawnBounds.width = width;
        this._lastDrawnBounds.height = height;
    }

    /**
     * Determines the time step to use when calculating a dynamic track vector in order to achieve this layer's desired spatial
     * resolution.
     * @param {WT_MapViewState} state - the current map view state.
     */
    _calculateDynamicTimeStep(state) {
        let tas = state.model.airplane.sensors.getAirspeedSensor(this._airspeedSensorIndex).tas(this._tempKnot);
        let resolution = state.projection.viewResolution;

        let targetResolutionDistance = this.dynamicTargetResolution * resolution.asUnit(WT_Unit.METER);

        return targetResolutionDistance / tas.asUnit(WT_Unit.MPS);
    }

    /**
     * Calculates the path for a dynamic track vector using current aircraft parameters to build the predicted path.
     * @param {WT_MapViewState} state - the current map view state.
     */
    _calculateDynamicVector(state) {
        let airplane = state.model.airplane;
        let timeStep = this._calculateDynamicTimeStep(state);
        let dt = state.currentTime / 1000 - this._lastTime;

        let resolution = state.projection.viewResolution.asUnit(WT_Unit.METER);

        let trackRad = (airplane.navigation.trackTrue() + state.projection.rotation) * Avionics.Utils.DEG2RAD;
        let tasPx = airplane.sensors.getAirspeedSensor(this._airspeedSensorIndex).tas(this._tempKnot).asUnit(WT_Unit.MPS) / resolution;
        let headingRad = (airplane.navigation.headingTrue() + state.projection.rotation) * Avionics.Utils.DEG2RAD;
        let turnSpeedRad = airplane.navigation.turnSpeed() * Avionics.Utils.DEG2RAD;
        let windSpeedPx = airplane.environment.windSpeed(this._tempKnot).asUnit(WT_Unit.MPS) / resolution;
        let windDirectionRad = (airplane.environment.windDirection(this._tempTrueBearing).number + state.projection.rotation + 180) * Avionics.Utils.DEG2RAD;
        let dynamicHeadingDeltaMaxRad = this.dynamicHeadingDeltaMax * Avionics.Utils.DEG2RAD;

        turnSpeedRad = this._turnSpeedSmoother.next(turnSpeedRad, dt);

        let lookahead = state.model.trackVector.lookahead.asUnit(WT_Unit.SECOND);
        let planeVelocityPx = new WT_GVector2(0, 0);
        let windVelocityPx = new WT_GVector2(0, 0);
        let points = [state.viewPlane];
        let i = 0;
        for (let t = 0; t < lookahead; t += timeStep) {
            let angleDelta = Math.abs((headingRad - trackRad) % (2 * Math.PI));
            if (Math.min(angleDelta, 2 * Math.PI - angleDelta) > dynamicHeadingDeltaMaxRad) {
                break;
            }

            planeVelocityPx.setFromPolar(tasPx, headingRad);
            windVelocityPx.setFromPolar(windSpeedPx, windDirectionRad);

            let currentPoint = points[i++];
            let nextPoint = planeVelocityPx.plus(windVelocityPx).scale(timeStep, true).add(currentPoint);
            points.push(nextPoint);

            if (!state.projection.isInView(nextPoint, 0.05)) {
                break;
            }
            headingRad += turnSpeedRad * timeStep;
        }
        return points;
    }

    /**
     * Loads a path definition into this layer's canvas rendering context.
     * @param {{x:Number, y:Number}[]} points - a list of points, in pixel coordinates, comprising the path.
     */
    _composeVectorPath(points) {
        this._vectorLayer.display.context.beginPath();
        let i = 0;
        let currentPoint = points[i++];
        this._vectorLayer.display.context.moveTo(currentPoint.x, currentPoint.y);
        while (i < points.length) {
            this._vectorLayer.display.context.lineTo(currentPoint.x, currentPoint.y);
            currentPoint = points[i++];
        }
    }

    /**
     * Applies a stroke to this layer's canvas rendering context using the specified styles.
     * @param {Number} lineWidth - the width of the stroke, in pixels.
     * @param {String|CanvasGradient|CanvasPattern} strokeStyle - the style of the stroke.
     */
    _applyStroke(lineWidth, strokeStyle) {
        this._vectorLayer.display.context.lineWidth = lineWidth;
        this._vectorLayer.display.context.strokeStyle = strokeStyle;
        this._vectorLayer.display.context.stroke();
    }

    /**
     * Draws a dynamic track vector.
     * @param {WT_MapViewState} state - the current map view state.
     */
    _drawDynamicVector(state) {
        let points = this._calculateDynamicVector(state);

        this._vectorLayer.display.context.clearRect(this._lastDrawnBounds.left, this._lastDrawnBounds.top, this._lastDrawnBounds.width, this._lastDrawnBounds.height);
        this._composeVectorPath(points);
        if (this.outlineWidth > 0) {
            this._applyStroke((this.outlineWidth * 2 + this.strokeWidth) * state.dpiScale, this.outlineColor);
        }
        this._applyStroke(this.strokeWidth * state.dpiScale, this.strokeColor);

        let thick = (this.outlineWidth + this.strokeWidth / 2) * state.dpiScale;
        let toDrawLeft = Math.max(0, Math.min(...points.map(point => point.x)) - thick - 5);
        let toDrawTop = Math.max(0, Math.min(...points.map(point => point.y)) - thick - 5);
        let toDrawWidth = Math.min(state.projection.viewWidth, Math.max(...points.map(point => point.x)) + thick + 5) - toDrawLeft;
        let toDrawHeight = Math.min(state.projection.viewHeight, Math.max(...points.map(point => point.y)) + thick + 5) - toDrawTop;
        this._setLastDrawnBounds(toDrawLeft, toDrawTop, toDrawWidth, toDrawHeight);
    }

    /**
     * Builds a GeoJSON LineString Feature object from a list of lat/long coordinates.
     * @param {{lat:Number, long:Number}[]} points - a list of lat/long coordinates.
     */
    _buildGeoJSON(points) {
        return {
            type: "LineString",
            coordinates: points.map(latLong => [latLong.long, latLong.lat])
        };
    }

    /**
     * Draws a non-dynamic track vector.
     * @param {WT_MapViewState} state - the current map view state.
     */
    _drawSimpleVector(state) {
        let airplane = state.model.airplane;
        let planePos = airplane.navigation.position(this._tempGeoPoint1);
        let gs = airplane.navigation.groundSpeed(this._tempKnot).number;
        let lookahead = state.model.trackVector.lookahead.asUnit(WT_Unit.HOUR);
        let points = [
            planePos,
            state.projection.offsetByBearing(planePos, this._tempNM.set(gs * lookahead), airplane.navigation.trackTrue(), this._tempGeoPoint2)
        ];
        let geoJSON = this._buildGeoJSON(points);

        this._vectorLayer.display.context.clearRect(this._lastDrawnBounds.left, this._lastDrawnBounds.top, this._lastDrawnBounds.width, this._lastDrawnBounds.height);

        this._vectorLayer.display.context.beginPath();
        state.projection.renderer.renderCanvas(geoJSON, this._vectorLayer.display.context);
        if (this.outlineWidth > 0) {
            this._applyStroke((this.outlineWidth * 2 + this.strokeWidth) * state.dpiScale, this.outlineColor);
        }
        this._applyStroke(this.strokeWidth * state.dpiScale, this.strokeColor);

        let bounds = state.projection.renderer.calculateBounds(geoJSON);
        let thick = (this.outlineWidth + this.strokeWidth / 2) * state.dpiScale;
        let toDrawLeft = Math.max(0, bounds[0].x - thick - 5);
        let toDrawTop = Math.max(0, bounds[0].y - thick - 5);
        let toDrawWidth = Math.min(state.projection.viewWidth, bounds[1].x + thick + 5) - toDrawLeft;
        let toDrawHeight = Math.min(state.projection.viewHeight, bounds[1].y + thick + 5) - toDrawTop;
        this._setLastDrawnBounds(toDrawLeft, toDrawTop, toDrawWidth, toDrawHeight);
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        super.onUpdate(state);

        if (state.model.airplane.sensors.isOnGround()) {
            return;
        }

        let lookahead = state.model.trackVector.lookahead;
        if (lookahead.compare(this.dynamicLookaheadMax) <= 0) {
            this._drawDynamicVector(state);
        } else {
            this._drawSimpleVector(state);
        }
        this._lastTime = state.currentTime / 1000;
    }
}
WT_MapViewTrackVectorLayer.CLASS_DEFAULT = "trackVectorLayer";
WT_MapViewTrackVectorLayer.CONFIG_NAME_DEFAULT = "trackVector";
WT_MapViewTrackVectorLayer.SMOOTHING_MAX_TIME_DELTA = 0.5;
WT_MapViewTrackVectorLayer.OPTIONS_DEF = {
    dynamicLookaheadMax: {default: WT_Unit.SECOND.createNumber(60)},
    dynamicTargetResolution: {default: 5, auto: true},
    dynamicHeadingDeltaMax: {default: 90, auto: true},
    smoothingConstant: {default: 1, auto: true},

    strokeWidth: {default: 4, auto: true},
    strokeColor: {default: "cyan", auto: true},
    outlineWidth: {default: 1, auto: true},
    outlineColor: {default: "black", auto: true},
};
WT_MapViewTrackVectorLayer.CONFIG_PROPERTIES = [
    "dynamicLookaheadMax",
    "dynamicTargetResolution",
    "dynamicHeadingDeltaMax",
    "smoothingConstant",
    "strokeWidth",
    "strokeColor",
    "outlineWidth",
    "outlineColor",
];