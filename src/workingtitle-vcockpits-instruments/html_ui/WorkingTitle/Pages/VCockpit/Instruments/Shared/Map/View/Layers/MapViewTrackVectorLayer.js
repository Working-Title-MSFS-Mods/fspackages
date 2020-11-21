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
    }

    _setPropertyFromConfig(name) {
        if (name === "dynamicLookaheadMax") {
            this._dynamicLookaheadMax.refNumber = this.config[name];
        } else {
            super._setPropertyFromConfig(name);
        }
    }

    get vectorLayer() {
        return this._vectorLayer;
    }

    get dynamicLookaheadMax() {
        return this._dynamicLookaheadMax.copy();
    }

    set dynamicLookaheadMax(value) {
        this._dynamicLookaheadMax.copyFrom(value);
    }

    isVisible(data) {
        return data.model.trackVector.show;
    }

    onConfigLoaded(data) {
        for (let property of WT_MapViewTrackVectorLayer.CONFIG_PROPERTIES) {
            this._setPropertyFromConfig(property);
        }
    }

    _calculateSmoothingFactor(data) {
        let dt = data.currentTime / 1000 - this._lastTime;
        if (dt > WT_MapViewTrackVectorLayer.SMOOTHING_MAX_TIME_DELTA) {
            return 1;
        } else {
            return Math.pow(0.5, dt * this.smoothingConstant);
        }
    }

    _smoothTurnSpeed(turnSpeed, factor) {
        return turnSpeed * factor + this._lastTurnSpeed * (1 - factor);
    }

    _calculateDynamicTimeStep(data) {
        let tas = data.model.airplane.tas;
        let resolution = data.projection.viewResolution;
        tas.unit = WT_Unit.MPS;
        resolution.unit = WT_Unit.METER;

        let targetResolutionDistance = this.dynamicTargetResolution * resolution.number;

        return targetResolutionDistance / tas.number;
    }

    _calculateDynamicVector(data) {
        let timeStep = this._calculateDynamicTimeStep(data);
        let smoothingFactor = this._calculateSmoothingFactor(data);

        let resolution = data.projection.viewResolution;
        resolution.unit = WT_Unit.METER;

        let trackRad = (data.model.airplane.trackTrue + data.projection.rotation) * Avionics.Utils.DEG2RAD;
        let tasPx = data.model.airplane.tas.asUnit(WT_Unit.MPS) / resolution.number;
        let headingRad = (data.model.airplane.headingTrue + data.projection.rotation) * Avionics.Utils.DEG2RAD;
        let turnSpeedRad = data.model.airplane.turnSpeed * Avionics.Utils.DEG2RAD;
        let windSpeedPx = data.model.weather.windSpeed.asUnit(WT_Unit.MPS) / resolution.number;
        let windDirectionRad = (data.model.weather.windDirection + data.projection.rotation + 180) * Avionics.Utils.DEG2RAD;
        let dynamicHeadingDeltaMaxRad = this.dynamicHeadingDeltaMax * Avionics.Utils.DEG2RAD;

        turnSpeedRad = this._smoothTurnSpeed(turnSpeedRad, smoothingFactor);
        this._lastTurnSpeed = turnSpeedRad;

        let lookahead = data.model.trackVector.lookahead.asUnit(WT_Unit.SECOND);
        let planeVelocityPx = new WT_GVector2(0, 0);
        let windVelocityPx = new WT_GVector2(0, 0);
        let points = [data.viewPlane];
        let i = 0;
        for (let t = 0; t < lookahead; t += timeStep) {
            let angleDelta = Math.abs((headingRad - trackRad) % (2 * Math.PI));
            if (Math.min(angleDelta, 2 * Math.PI - angleDelta) > dynamicHeadingDeltaMaxRad) {
                break;
            }

            planeVelocityPx.setFromPolar(tasPx, headingRad);
            windVelocityPx.setFromPolar(windSpeedPx, windDirectionRad);

            let currentPoint = points[i++];
            let nextPoint = currentPoint.add(planeVelocityPx.add(windVelocityPx).scale(timeStep, true));
            points.push(nextPoint);

            if (!data.projection.isXYInBounds(nextPoint, 0.05)) {
                break;
            }
            headingRad += turnSpeedRad * timeStep;
        }
        return points;
    }

    _composeVectorPath(points) {
        this.vectorLayer.buffer.context.beginPath();
        let i = 0;
        let currentPoint = points[i++];
        this.vectorLayer.buffer.context.moveTo(currentPoint.x, currentPoint.y);
        while (i < points.length) {
            this.vectorLayer.buffer.context.lineTo(currentPoint.x, currentPoint.y);
            currentPoint = points[i++];
        }
    }

    _applyStrokeToBuffer(lineWidth, strokeStyle) {
        this.vectorLayer.buffer.context.lineWidth = lineWidth;
        this.vectorLayer.buffer.context.strokeStyle = strokeStyle;
        this.vectorLayer.buffer.context.stroke();
    }

    _drawDynamicVector(data) {
        let points = this._calculateDynamicVector(data);

        this.vectorLayer.buffer.context.clearRect(this._lastDrawnBounds.left, this._lastDrawnBounds.top, this._lastDrawnBounds.width, this._lastDrawnBounds.height);
        this.vectorLayer.context.clearRect(this._lastDrawnBounds.left, this._lastDrawnBounds.top, this._lastDrawnBounds.width, this._lastDrawnBounds.height);
        this._composeVectorPath(points);
        if (this.outlineWidth > 0) {
            this._applyStrokeToBuffer((this.outlineWidth * 2 + this.strokeWidth) * data.dpiScale, this.outlineColor);
        }
        this._applyStrokeToBuffer(this.strokeWidth * data.dpiScale, this.strokeColor);

        let thick = (this.outlineWidth + this.strokeWidth / 2) * data.dpiScale;
        let toDrawLeft = Math.max(0, Math.min(...points.map(point => point.x)) - thick - 5);
        let toDrawTop = Math.max(0, Math.min(...points.map(point => point.y)) - thick - 5);
        let toDrawWidth = Math.min(data.projection.viewWidth, Math.max(...points.map(point => point.x)) + thick + 5) - toDrawLeft;
        let toDrawHeight = Math.min(data.projection.viewHeight, Math.max(...points.map(point => point.y)) + thick + 5) - toDrawTop;
        this._lastDrawnBounds = this.vectorLayer.copyBufferToCanvas(toDrawLeft, toDrawTop, toDrawWidth, toDrawHeight);
    }

    _buildGeoJSON(points) {
        return {
            type: "LineString",
            coordinates: points.map(latLong => [latLong.long, latLong.lat])
        };
    }

    _drawSimpleVector(data) {
        let planePos = data.model.airplane.position;
        let gs = data.model.airplane.groundSpeed.asUnit(WT_Unit.KNOT);
        let lookahead = data.model.trackVector.lookahead.asUnit(WT_Unit.HOUR);
        let points = [
            planePos,
            data.projection.offsetByBearing(planePos, new WT_NumberUnit(gs * lookahead, WT_Unit.NMILE), data.model.airplane.trackTrue)
        ];
        let geoJSON = this._buildGeoJSON(points);

        this.vectorLayer.buffer.context.clearRect(this._lastDrawnBounds.left, this._lastDrawnBounds.top, this._lastDrawnBounds.width, this._lastDrawnBounds.height);
        this.vectorLayer.context.clearRect(this._lastDrawnBounds.left, this._lastDrawnBounds.top, this._lastDrawnBounds.width, this._lastDrawnBounds.height);

        this.vectorLayer.buffer.context.beginPath();
        data.projection.renderer.renderCanvas(geoJSON, this.vectorLayer.buffer.context);
        if (this.outlineWidth > 0) {
            this._applyStrokeToBuffer((this.outlineWidth * 2 + this.strokeWidth) * data.dpiScale, this.outlineColor);
        }
        this._applyStrokeToBuffer(this.strokeWidth * data.dpiScale, this.strokeColor);

        let bounds = data.projection.renderer.calculateBounds(geoJSON);
        let thick = (this.outlineWidth + this.strokeWidth / 2) * data.dpiScale;
        let toDrawLeft = Math.max(0, bounds[0].x - thick - 5);
        let toDrawTop = Math.max(0, bounds[0].y - thick - 5);
        let toDrawWidth = Math.min(data.projection.viewWidth, bounds[1].x + thick + 5) - toDrawLeft;
        let toDrawHeight = Math.min(data.projection.viewHeight, bounds[1].y + thick + 5) - toDrawTop;
        this._lastDrawnBounds = this.vectorLayer.copyBufferToCanvas(toDrawLeft, toDrawTop, toDrawWidth, toDrawHeight);
    }

    onUpdate(data) {
        if (data.model.airplane.isOnGround) {
            return;
        }

        let lookahead = data.model.trackVector.lookahead;
        if (lookahead.compare(this.dynamicLookaheadMax) <= 0) {
            this._drawDynamicVector(data);
        } else {
            this._drawSimpleVector(data);
        }
        this._lastTime = data.currentTime / 1000;
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