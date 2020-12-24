/**
 * A track vector. This layer draws a line from the position of the airplane which marks the plane's predicted path.
 * The amount of time to look forward (lookahead time) in constructing the predicted path is governed by the map model.
 * The predicted path can be either dynamic, taking into account the current turn speed, or not, depending on the lookahead time.
 * The use of this layer requires the .trackVector module to be added to the map model.
 */
class WT_MapViewTrackVectorLayer extends WT_MapViewMultiLayer {
    constructor(className = WT_MapViewTrackVectorLayer.CLASS_DEFAULT, configName = WT_MapViewTrackVectorLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._dynamicLookaheadMax = new WT_NumberUnit(0, WT_Unit.SECOND);

        this._optsManager = new WT_OptionsManager(this, WT_MapViewTrackVectorLayer.OPTIONS_DEF);

        this._vectorLayer = new WT_MapViewCanvas(true, true);

        this.addSubLayer(this._vectorLayer);

        this._lastTime = 0;
        this._lastTurnSpeed = 0;
        this._lastDrawnBounds = {left: 0, top: 0, width: 0, height: 0};

        this._tempNM = WT_Unit.NMILE.createNumber(0);
        this._tempKnot = WT_Unit.KNOT.createNumber(0);
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

    /**
     * Calculates an appropriate exponential smoothing factor to use.
     * @param {WT_MapViewState} state - the current map view state.
     * @returns {Number} - a smoothing factor.
     */
    _calculateSmoothingFactor(state) {
        let dt = state.currentTime / 1000 - this._lastTime;
        if (dt > WT_MapViewTrackVectorLayer.SMOOTHING_MAX_TIME_DELTA) {
            return 1;
        } else {
            return Math.pow(0.5, dt * this.smoothingConstant);
        }
    }

    /**
     * Applies exponential smoothing (i.e. exponential moving average) to a turn speed value.
     * @param {Number} turnSpeed - the value to smooth.
     * @param {Number} factor - the smoothing factor to use.
     * @returns {Number} - the smoothed value.
     */
    _smoothTurnSpeed(turnSpeed, factor) {
        return turnSpeed * factor + this._lastTurnSpeed * (1 - factor);
    }

    /**
     * Determines the time step to use when calculating a dynamic track vector in order to achieve this layer's desired spatial
     * resolution.
     * @param {WT_MapViewState} state - the current map view state.
     */
    _calculateDynamicTimeStep(state) {
        let tas = state.model.airplane.model.tas(this._tempKnot);
        let resolution = state.projection.viewResolution;

        let targetResolutionDistance = this.dynamicTargetResolution * resolution.asUnit(WT_Unit.METER);

        return targetResolutionDistance / tas.asUnit(WT_Unit.MPS);
    }

    /**
     * Calculates the path for a dynamic track vector using current aircraft parameters to build the predicted path.
     * @param {WT_MapViewState} state - the current map view state.
     */
    _calculateDynamicVector(state) {
        let timeStep = this._calculateDynamicTimeStep(state);
        let smoothingFactor = this._calculateSmoothingFactor(state);

        let resolution = state.projection.viewResolution.asUnit(WT_Unit.METER);

        let trackRad = (state.model.airplane.model.trackTrue() + state.projection.rotation) * Avionics.Utils.DEG2RAD;
        let tasPx = state.model.airplane.model.tas(this._tempKnot).asUnit(WT_Unit.MPS) / resolution;
        let headingRad = (state.model.airplane.model.headingTrue() + state.projection.rotation) * Avionics.Utils.DEG2RAD;
        let turnSpeedRad = state.model.airplane.model.turnSpeed() * Avionics.Utils.DEG2RAD;
        let windSpeedPx = state.model.weather.windSpeed.asUnit(WT_Unit.MPS) / resolution;
        let windDirectionRad = (state.model.weather.windDirection + state.projection.rotation + 180) * Avionics.Utils.DEG2RAD;
        let dynamicHeadingDeltaMaxRad = this.dynamicHeadingDeltaMax * Avionics.Utils.DEG2RAD;

        turnSpeedRad = this._smoothTurnSpeed(turnSpeedRad, smoothingFactor);
        this._lastTurnSpeed = turnSpeedRad;

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
     * Loads a path definition into this layer's buffer rendering context.
     * @param {{x:Number, y:Number}[]} points - a list of points, in pixel coordinates, comprising the path.
     */
    _composeVectorPath(points) {
        this._vectorLayer.buffer.context.beginPath();
        let i = 0;
        let currentPoint = points[i++];
        this._vectorLayer.buffer.context.moveTo(currentPoint.x, currentPoint.y);
        while (i < points.length) {
            this._vectorLayer.buffer.context.lineTo(currentPoint.x, currentPoint.y);
            currentPoint = points[i++];
        }
    }

    /**
     * Applies a stroke to this layer's buffer rendering context using the specified styles.
     * @param {Number} lineWidth - the width of the stroke, in pixels.
     * @param {String|CanvasGradient|CanvasPattern} strokeStyle - the style of the stroke.
     */
    _applyStrokeToBuffer(lineWidth, strokeStyle) {
        this._vectorLayer.buffer.context.lineWidth = lineWidth;
        this._vectorLayer.buffer.context.strokeStyle = strokeStyle;
        this._vectorLayer.buffer.context.stroke();
    }

    /**
     * Draws a dynamic track vector.
     * @param {WT_MapViewState} state - the current map view state.
     */
    _drawDynamicVector(state) {
        let points = this._calculateDynamicVector(state);

        this._vectorLayer.buffer.context.clearRect(this._lastDrawnBounds.left, this._lastDrawnBounds.top, this._lastDrawnBounds.width, this._lastDrawnBounds.height);
        this._vectorLayer.display.context.clearRect(this._lastDrawnBounds.left, this._lastDrawnBounds.top, this._lastDrawnBounds.width, this._lastDrawnBounds.height);
        this._composeVectorPath(points);
        if (this.outlineWidth > 0) {
            this._applyStrokeToBuffer((this.outlineWidth * 2 + this.strokeWidth) * state.dpiScale, this.outlineColor);
        }
        this._applyStrokeToBuffer(this.strokeWidth * state.dpiScale, this.strokeColor);

        let thick = (this.outlineWidth + this.strokeWidth / 2) * state.dpiScale;
        let toDrawLeft = Math.max(0, Math.min(...points.map(point => point.x)) - thick - 5);
        let toDrawTop = Math.max(0, Math.min(...points.map(point => point.y)) - thick - 5);
        let toDrawWidth = Math.min(state.projection.viewWidth, Math.max(...points.map(point => point.x)) + thick + 5) - toDrawLeft;
        let toDrawHeight = Math.min(state.projection.viewHeight, Math.max(...points.map(point => point.y)) + thick + 5) - toDrawTop;
        this._lastDrawnBounds = this._vectorLayer.copyBufferToCanvas(toDrawLeft, toDrawTop, toDrawWidth, toDrawHeight);
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
        let planePos = state.model.airplane.model.position(this._tempGeoPoint1);
        let gs = state.model.airplane.model.groundSpeed(this._tempKnot).number;
        let lookahead = state.model.trackVector.lookahead.asUnit(WT_Unit.HOUR);
        let points = [
            planePos,
            state.projection.offsetByBearing(planePos, this._tempNM.set(gs * lookahead), state.model.airplane.model.trackTrue(), this._tempGeoPoint2)
        ];
        let geoJSON = this._buildGeoJSON(points);

        this._vectorLayer.buffer.context.clearRect(this._lastDrawnBounds.left, this._lastDrawnBounds.top, this._lastDrawnBounds.width, this._lastDrawnBounds.height);
        this._vectorLayer.display.context.clearRect(this._lastDrawnBounds.left, this._lastDrawnBounds.top, this._lastDrawnBounds.width, this._lastDrawnBounds.height);

        this._vectorLayer.buffer.context.beginPath();
        state.projection.renderer.renderCanvas(geoJSON, this._vectorLayer.buffer.context);
        if (this.outlineWidth > 0) {
            this._applyStrokeToBuffer((this.outlineWidth * 2 + this.strokeWidth) * state.dpiScale, this.outlineColor);
        }
        this._applyStrokeToBuffer(this.strokeWidth * state.dpiScale, this.strokeColor);

        let bounds = state.projection.renderer.calculateBounds(geoJSON);
        let thick = (this.outlineWidth + this.strokeWidth / 2) * state.dpiScale;
        let toDrawLeft = Math.max(0, bounds[0].x - thick - 5);
        let toDrawTop = Math.max(0, bounds[0].y - thick - 5);
        let toDrawWidth = Math.min(state.projection.viewWidth, bounds[1].x + thick + 5) - toDrawLeft;
        let toDrawHeight = Math.min(state.projection.viewHeight, bounds[1].y + thick + 5) - toDrawTop;
        this._lastDrawnBounds = this._vectorLayer.copyBufferToCanvas(toDrawLeft, toDrawTop, toDrawWidth, toDrawHeight);
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        super.onUpdate(state);

        if (state.model.airplane.model.isOnGround()) {
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
    smoothingConstant: {default: 50, auto: true},

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