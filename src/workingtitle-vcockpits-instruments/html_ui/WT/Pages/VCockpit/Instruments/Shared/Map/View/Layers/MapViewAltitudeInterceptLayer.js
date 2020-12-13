/**
 * An altitude intercept arc. This layer draws an arc marking the distance from the player aircraft at which the plane is predicted
 * to intercept the current set target altitude.
 */
class WT_MapViewAltitudeInterceptLayer extends WT_MapViewMultiLayer {
    /**
     * @param {{getFacingAngle(state:WT_MapViewState):Number}} [facingAngleGetter] - defines the facing angle (in viewing window space) of the arc by implementing the
     *                                                                               getFacingAngle() method. If this argument is not supplied, by default the arc will
     *                                                                               face the current true ground track of the plane.
     * @param {String} [className] - the name of the class to add to the new layer's top-level HTML element's class list.
     * @param {String} [configName] - the name of the property in the map view's config file to be associated with the new layer.
     */
    constructor(facingAngleGetter = {getFacingAngle: state => state.model.airplane.trackTrue + state.projection.rotation}, className = WT_MapViewAltitudeInterceptLayer.CLASS_DEFAULT, configName = WT_MapViewAltitudeInterceptLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this.facingAngleGetter = facingAngleGetter;

        this._optsManager = new WT_OptionsManager(this, WT_MapViewAltitudeInterceptLayer.OPTIONS_DEF);

        this._arcLayer = new WT_MapViewCanvas(false, true);
        this.addSubLayer(this._arcLayer);

        this._lastTime = 0;
        this._lastRadius = 0;
        this._lastRange = new WT_NumberUnit(0, WT_Unit.NMILE);
        this._lastDrawnBounds = {left: 0, top: 0, width: 0, height: 0};
    }

    /**
     * @param {WT_MapViewState} state
     */
    isVisible(state) {
        return state.model.altitudeIntercept.show;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onConfigLoaded(state) {
        for (let property of WT_MapViewAltitudeInterceptLayer.CONFIG_PROPERTIES) {
            this._setPropertyFromConfig(property);
        }
    }

    /**
     * Applies a stroke to this layer's canvas rendering context using the specified styles.
     * @param {Number} lineWidth - the width of the stroke, in pixels.
     * @param {String|CanvasGradient|CanvasPattern} strokeStyle - the style of the stroke.
     */
    _applyStrokeToCanvas(lineWidth, strokeStyle) {
        this._arcLayer.display.context.lineWidth = lineWidth;
        this._arcLayer.display.context.strokeStyle = strokeStyle;
        this._arcLayer.display.context.stroke();
    }

    /**
     * Calculates an appropriate exponential smoothing factor to use.
     * @param {WT_MapViewState} state - the current map view state.
     * @returns {Number} - a smoothing factor.
     */
    _calculateSmoothingFactor(state) {
        let dt = state.currentTime / 1000 - this._lastTime;
        if (dt > WT_MapViewAltitudeInterceptLayer.SMOOTHING_MAX_TIME_DELTA) {
            return 1;
        } else {
            return Math.pow(0.5, dt * this.smoothingConstant);
        }
    }

    /**
     * Applies exponential smoothing (i.e. exponential moving average) to a radius value.
     * @param {Number} radius - the value to smooth.
     * @param {Number} factor - the smoothing factor to use.
     * @returns {Number} - the smoothed value.
     */
    _smoothRadius(radius, factor) {
        return radius * factor + this._lastRadius * (1 - factor);
    }

    /**
     * Draws the arc to canvas.
     * @param {WT_MapViewState} state - the current map view state
     * @param {Number} radius - the distance from the plane to the arc, in pixels.
     * @param {Number} facing - the facing angle of the arc, in degrees. A value of 0 degrees indicates straight up, with positive values
     *                          proceeding clockwise.
     */
    _drawArc(state, radius, facing) {
        let center = state.viewPlane;
        let angularWidth = Math.min(this.angularWidth, 360);
        let startAngle = facing - angularWidth / 2;
        let endAngle = facing + angularWidth / 2;

        this._arcLayer.display.context.beginPath();
        this._arcLayer.display.context.arc(center.x, center.y, radius, startAngle * Avionics.Utils.DEG2RAD - Math.PI / 2, endAngle * Avionics.Utils.DEG2RAD - Math.PI / 2);
        if (this.outlineWidth > 0) {
            this._applyStrokeToCanvas((this.strokeWidth + 2 * this.outlineWidth) * state.dpiScale, this.outlineColor);
        }
        this._applyStrokeToCanvas(this.strokeWidth * state.dpiScale, this.strokeColor);

        let start = WT_GVector2.fromPolar(radius, startAngle * Avionics.Utils.DEG2RAD).add(center);
        let end = WT_GVector2.fromPolar(radius, endAngle * Avionics.Utils.DEG2RAD).add(center);

        let left = Math.min(start.x, end.x);
        let right = Math.max(start.x, end.x);
        let top = Math.min(start.y, end.y);
        let bottom = Math.max(start.y, end.y);

        let nextExtremeAngle = Math.ceil(startAngle / 90) * 90;
        let delta = nextExtremeAngle - startAngle;
        let extreme = new WT_GVector2(0, 0);
        while (delta < angularWidth) {
            extreme.setFromPolar(radius, nextExtremeAngle * Avionics.Utils.DEG2RAD).add(center);
            left = Math.min(left, extreme.x);
            right = Math.max(right, extreme.x);
            top = Math.min(top, extreme.y);
            bottom = Math.max(bottom, extreme.y);
            nextExtremeAngle += 90;
            delta += 90;
        }

        let thick = (this.strokeWidth / 2 + this.outlineWidth) * state.dpiScale;
        this._lastDrawnBounds.left = left - thick - 5;
        this._lastDrawnBounds.top = top - thick - 5;
        this._lastDrawnBounds.width = right - left + 2 * (thick + 5);
        this._lastDrawnBounds.height = bottom - top + 2 * (thick + 5);
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        super.onUpdate(state);

        if (state.model.airplane.isOnGround) {
            return;
        }

        this._arcLayer.display.context.clearRect(this._lastDrawnBounds.left, this._lastDrawnBounds.top, this._lastDrawnBounds.width, this._lastDrawnBounds.height);

        let vSpeed = state.model.airplane.verticalSpeed;
        let currentAlt = state.model.airplane.altitudeIndicated;
        let targetAlt = state.model.autopilot.altitudeTarget;
        let deltaAlt = targetAlt.minus(currentAlt);
        let time = deltaAlt.asUnit(WT_Unit.FOOT) / vSpeed.asUnit(WT_Unit.FPM) / 60; // hours
        if (vSpeed.abs(true).compare(WT_MapViewAltitudeInterceptLayer.VSPEED_THRESHOLD) < 0 || time < 0 || deltaAlt.abs(true).compare(WT_MapViewAltitudeInterceptLayer.ALTITUDE_DELTA_THRESHOLD) < 0) {
            return;
        }

        let gs = state.model.airplane.groundSpeed;
        let distance = WT_Unit.NMILE.createNumber(gs.asUnit(WT_Unit.KNOT) * time);
        let angle = this.facingAngleGetter.getFacingAngle(state);
        let arcTarget = state.projection.offsetByViewAngle(state.model.airplane.position, distance, angle);
        let viewArcTarget = state.projection.project(arcTarget);
        let radius = viewArcTarget.subtract(state.viewPlane).length;
        if (state.projection.range.equals(this._lastRange)) {
            radius = this._smoothRadius(radius, this._calculateSmoothingFactor(state));
        }
        this._drawArc(state, radius, angle);

        this._lastTime = state.currentTime / 1000;
        this._lastRange.set(state.projection.range);
        this._lastRadius = radius;
    }
}
WT_MapViewAltitudeInterceptLayer.CLASS_DEFAULT = "altitudeInterceptLayer";
WT_MapViewAltitudeInterceptLayer.CONFIG_NAME_DEFAULT = "altitudeIntercept";
WT_MapViewAltitudeInterceptLayer.SMOOTHING_MAX_TIME_DELTA = 0.5;
WT_MapViewAltitudeInterceptLayer.VSPEED_THRESHOLD = WT_Unit.FPM.createNumber(100);
WT_MapViewAltitudeInterceptLayer.ALTITUDE_DELTA_THRESHOLD = WT_Unit.FOOT.createNumber(100);
WT_MapViewAltitudeInterceptLayer.OPTIONS_DEF = {
    smoothingConstant: {default: 50, auto: true},

    angularWidth: {default: 40, auto: true},
    strokeWidth: {default: 4, auto: true},
    strokeColor: {default: "cyan", auto: true},
    outlineWidth: {default: 1, auto: true},
    outlineColor: {default: "black", auto: true},
};
WT_MapViewAltitudeInterceptLayer.CONFIG_PROPERTIES = [
    "smoothingConstant",
    "angularWidth",
    "strokeWidth",
    "strokeColor",
    "outlineWidth",
    "outlineColor",
];