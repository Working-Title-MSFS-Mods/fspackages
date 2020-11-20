class WT_MapViewAltitudeInterceptLayer extends WT_MapViewMultiLayer {
    constructor(facingAngleGetter = {getFacingAngle: data => data.model.airplane.trackTrue + data.projection.rotation}, className = WT_MapViewAltitudeInterceptLayer.CLASS_DEFAULT, configName = WT_MapViewAltitudeInterceptLayer.CONFIG_NAME_DEFAULT) {
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

    get arcLayer() {
        return this._arcLayer;
    }

    isVisible(data) {
        return data.model.altitudeIntercept.show;
    }

    onConfigLoaded(data) {
        for (let property of WT_MapViewAltitudeInterceptLayer.CONFIG_PROPERTIES) {
            this._setPropertyFromConfig(property);
        }
    }

    _setContextStyle(lineWidth, strokeStyle) {
        this.arcLayer.context.lineWidth = lineWidth;
        this.arcLayer.context.strokeStyle = strokeStyle;
    }

    _calculateSmoothingFactor(data) {
        let dt = data.currentTime / 1000 - this._lastTime;
        if (dt > WT_MapViewAltitudeInterceptLayer.SMOOTHING_MAX_TIME_DELTA) {
            return 1;
        } else {
            return Math.pow(0.5, dt * this.smoothingConstant);
        }
    }

    _smoothRadius(radius, factor) {
        return radius * factor + this._lastRadius * (1 - factor);
    }

    _drawArc(data, radius, facing) {
        let center = data.viewPlane;
        let angularWidth = Math.min(this.angularWidth, 360);
        let startAngle = facing - angularWidth / 2;
        let endAngle = facing + angularWidth / 2;

        this.arcLayer.context.beginPath();
        this.arcLayer.context.arc(center.x, center.y, radius, startAngle * Avionics.Utils.DEG2RAD - Math.PI / 2, endAngle * Avionics.Utils.DEG2RAD - Math.PI / 2);
        if (this.outlineWidth > 0) {
            this._setContextStyle((this.strokeWidth + 2 * this.outlineWidth) * data.dpiScale, this.outlineColor);
            this.arcLayer.context.stroke();
        }
        this._setContextStyle(this.strokeWidth * data.dpiScale, this.strokeColor);
        this.arcLayer.context.stroke();

        let start = center.add(WT_GVector2.fromPolar(radius, startAngle * Avionics.Utils.DEG2RAD));
        let end = center.add(WT_GVector2.fromPolar(radius, endAngle * Avionics.Utils.DEG2RAD));

        let left = Math.min(start.x, end.x);
        let right = Math.max(start.x, end.x);
        let top = Math.min(start.y, end.y);
        let bottom = Math.max(start.y, end.y);

        let nextExtremeAngle = Math.ceil(startAngle / 90) * 90;
        let delta = nextExtremeAngle - startAngle;
        while (delta < angularWidth) {
            let extreme = center.add(WT_GVector2.fromPolar(radius, nextExtremeAngle * Avionics.Utils.DEG2RAD));
            left = Math.min(left, extreme.x);
            right = Math.max(right, extreme.x);
            top = Math.min(top, extreme.y);
            bottom = Math.max(bottom, extreme.y);
            nextExtremeAngle += 90;
            delta += 90;
        }

        let thick = (this.strokeWidth / 2 + this.outlineWidth) * data.dpiScale;
        this._lastDrawnBounds.left = left - thick - 5;
        this._lastDrawnBounds.top = top - thick - 5;
        this._lastDrawnBounds.width = right - left + 2 * (thick + 5);
        this._lastDrawnBounds.height = bottom - top + 2 * (thick + 5);
    }

    onUpdate(data) {
        if (data.model.airplane.isOnGround) {
            return;
        }

        this.arcLayer.context.clearRect(this._lastDrawnBounds.left, this._lastDrawnBounds.top, this._lastDrawnBounds.width, this._lastDrawnBounds.height);

        let vSpeed = data.model.airplane.verticalSpeed;
        let currentAlt = data.model.airplane.altitudeIndicated;
        let targetAlt = data.model.autopilot.altitudeTarget;
        let deltaAlt = targetAlt.copy().subtract(currentAlt);
        let time = deltaAlt.asUnit(WT_Unit.FOOT) / vSpeed.asUnit(WT_Unit.FPM) / 60; // hours
        if (vSpeed.copy().abs().compare(WT_MapViewAltitudeInterceptLayer.VSPEED_THRESHOLD) < 0 || time < 0 || deltaAlt.copy().abs().compare(WT_MapViewAltitudeInterceptLayer.ALTITUDE_DELTA_THRESHOLD) < 0) {
            return;
        }

        let gs = data.model.airplane.groundSpeed;
        let distance = new WT_NumberUnit(gs.asUnit(WT_Unit.KNOT) * time, WT_Unit.NMILE);
        let angle = this.facingAngleGetter.getFacingAngle(data);
        let arcTarget = data.projection.offsetByViewAngle(data.model.airplane.position, distance, angle);
        let viewArcTarget = data.projection.projectLatLong(arcTarget);
        let radius = viewArcTarget.subtract(data.viewPlane).length;
        if (data.projection.range.equals(this._lastRange)) {
            radius = this._smoothRadius(radius, this._calculateSmoothingFactor(data));
        }
        this._drawArc(data, radius, angle);

        this._lastTime = data.currentTime / 1000;
        this._lastRange.copyFrom(data.projection.range);
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