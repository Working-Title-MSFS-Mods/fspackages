class WT_MapProjection {
    constructor(name, d3Projection) {
        this._name = name;
        this._d3Projection = d3Projection;
        this._d3Projection.center([0, 0]);
        this._d3Projection.translate([0, 0]);

        this.__range = new WT_NumberUnit(1, WT_Unit.NMILE);
        this.__viewTargetOffset = new WT_GVector2(0, 0);

        this._optsManager = new WT_OptionsManager(this, WT_MapProjection.OPTIONS_DEF);
    }

    get name() {
        return this._name;
    }

    get viewWidth() {
        return this._viewWidth;
    }

    set viewWidth(val) {
        this._viewWidth = val;
        this._recalculateProjection();
    }

    get viewHeight() {
        return this._viewHeight;
    }

    set viewHeight(val) {
        this._viewHeight = val;
        this._recalculateProjection();
    }

    get _viewTargetOffset() {
        return this.__viewTargetOffset;
    }

    set _viewTargetOffset(offset) {
        this.__viewTargetOffset.set(offset);
    }

    get viewTargetOffset() {
        return this._viewTargetOffset.copy();
    }

    set viewTargetOffset(offset) {
        this._viewTargetOffset = offset;
        this._recalculateProjection();
    }

    get viewTarget() {
        return this.viewCenter.add(this.viewTargetOffset, true);
    }

    get viewCenter() {
        return new WT_GVector2(this.viewWidth / 2, this.viewHeight / 2);
    }

    get viewResolution() {
        return this.range.scale(1 / this.viewHeight);
    }

    get center() {
        return this._center;
    }

    get _target() {
        return this.__target;
    }

    set _target(target) {
        this.__target = target;
    }

    get target() {
        return this._target;
    }

    set target(target) {
        this._target = target;
        this._recalculateProjection();
    }

    get _range() {
        return this.__range.copy();
    }

    set _range(range) {
        this.__range.copyFrom(range);
    }

    get range() {
        return this._range;
    }

    set range(range) {
        this._range = range;
        this._recalculateProjection();
    }

    get scaleFactor() {
        return this._d3Projection.scale();
    }

    get _rotation() {
        return this.__rotation;
    }

    set _rotation(rotation) {
        rotation += Math.max(0, -Math.floor(rotation / 360)) * 360;
        this.__rotation = rotation;
        this._rotationRad = rotation * Avionics.Utils.DEG2RAD;
        this._d3Projection.angle(-rotation);
    }

    get rotation() {
        return this._rotation;
    }

    set rotation(rotation) {
        this._rotation = rotation;
        this._recalculateProjection();
    }

    _calculateRangeAtCenter(center) {
        let top = this._d3Projection.invert([center.x, center.y - this.viewHeight / 2]);
        let bottom = this._d3Projection.invert([center.x, center.y + this.viewHeight / 2]);
        return WT_Unit.GA_RADIAN.createNumber(d3.geoDistance(top, bottom));
    }

    _recalculateProjection() {
        //this._d3Projection.translate([0, 0]);
        this._d3Projection.translate([this.viewWidth / 2, this.viewHeight / 2]);

        let currentTargetXY = this._d3Projection(this.latLongGameToProjection(this.target));

        if (isNaN(currentTargetXY[0] + currentTargetXY[1])) {
            return;
        }

        let currentCenterXY = this.xyProjectionToView(currentTargetXY).subtract(this.viewTargetOffset, true);
        let currentRange = this._calculateRangeAtCenter(currentCenterXY);
        let ratio = currentRange.ratio(this.range);

        if (isNaN(ratio) || ratio === 0) {
            return;
        }

        while (Math.abs(ratio - 1) > WT_MapProjection.SCALE_FACTOR_TOLERANCE) {
            let currentScale = this._d3Projection.scale();
            this._d3Projection.scale(currentScale * ratio);

            currentTargetXY = this._d3Projection(this.latLongGameToProjection(this.target));
            currentCenterXY = this.xyProjectionToView(currentTargetXY).subtract(this.viewTargetOffset, true);
            currentRange = this._calculateRangeAtCenter(currentCenterXY);
            ratio = currentRange.ratio(this.range);
        }
        let center = this._d3Projection.invert(this.xyViewToProjection(currentCenterXY));
        this._d3Projection.center(center);
        this._center = this.latLongProjectionToGame(center);
        //this._d3Projection.translate([-currentTargetXY[0] + this.viewWidth / 2 + this.viewTargetOffset.x, -currentTargetXY[1] + this.viewHeight / 2 + this.viewTargetOffset.y]);

        //this._center = this.invertXY(this.viewCenter);
    }

    relXYToAbsXY(xy) {
        return WT_GTransform2.scale(this.viewWidth, this.viewHeight).apply(xy);
    }

    absXYToRelXY(xy) {
        return WT_GTransform2.scale(1 / this.viewWidth, 1 / this.viewHeight).apply(xy);
    }

    xyViewToProjection(xy) {
        return [xy.x, xy.y];
    }

    xyProjectionToView(xy) {
        return new WT_GVector2(xy[0], xy[1]);
    }

    latLongGameToProjection(latLong) {
        return [latLong.long, latLong.lat];
    }

    latLongProjectionToGame(latLong) {
        return new LatLong(latLong[1], latLong[0]);
    }

    setOptions(opts) {
        this._optsManager.setOptions(opts);
        this._recalculateProjection();
    }

    project(point) {
        return this._d3Projection(point);
    }

    invert(point) {
        return this._d3Projection.invert(point);
    }

    projectLatLong(latLong) {
        let projected = this.project(this.latLongGameToProjection(latLong));
        return this.xyProjectionToView(projected);
    }

    invertXY(xy) {
        let inverse = this.invert(this.xyViewToProjection(xy));
        return this.latLongProjectionToGame(inverse);
    }

    distance(point1, point2) {
        if (point1.lat !== undefined && point1.long !== undefined) {
            point1 = this.latLongGameToProjection(point1);
        }
        if (point2.lat !== undefined && point2.long !== undefined) {
            point2 = this.latLongGameToProjection(point2);
        }
        return WT_Unit.GA_RADIAN.createNumber(d3.geoDistance(point1, point2));
    }

    isLatLongInBounds(latLong, margin = 0) {
        return this.isXYInBounds(this.projectLatLong(latLong), margin);
    }

    isXYInBounds(xy, margin = 0) {
        return (xy.x >= -this.viewWidth * margin) &&
               (xy.y <= this.viewWidth * (1 + margin)) &&
               (xy.y >= -this.viewHeight * margin) &&
               (xy.y <= this.viewHeight * (1 + margin));
    }

    offsetByViewAngle(point, distance, angle) {
        if (distance instanceof WT_NumberUnit) {
            return this._offsetInGeoSpace(point, distance, angle - this.rotation);
        } else {
            return this._offsetInViewSpace(point, distance, angle);
        }
    }

    offsetByBearing(point, distance, bearing) {
        if (distance instanceof WT_NumberUnit) {
            return this._offsetInGeoSpace(point, distance, bearing);
        } else {
            return this._offsetInViewSpace(point, distance, bearing + this.rotation);
        }
    }

    _offsetInViewSpace(point, distance, angle) {
        if (point instanceof WT_GVector2) {
            return this._xyOffsetByViewAngle(point, distance, angle);
        } else if (point.lat !== undefined && point.long !== undefined) {
            return this._xyOffsetByViewAngle(this.projectLatLong(latLong), distance, angle);
        }
        return undefined;
    }

    _offsetInGeoSpace(point, distance, bearing) {
        if (point instanceof WT_GVector2) {
            return this._latLongOffsetByBearing(this.invertXY(point), distance, bearing);
        } else if (point.lat !== undefined && point.long !== undefined) {
            return this._latLongOffsetByBearing(point, distance, bearing);
        }
        return undefined;
    }

    _latLongOffsetByBearing(latLong, distance, bearing) {
        let sinLat = Math.sin(latLong.lat * Avionics.Utils.DEG2RAD);
        let cosLat = Math.cos(latLong.lat * Avionics.Utils.DEG2RAD);
        let sinBearing = Math.sin(bearing * Avionics.Utils.DEG2RAD);
        let cosBearing = Math.cos(bearing * Avionics.Utils.DEG2RAD);
        let angularDistance = distance.asUnit(WT_Unit.GA_RADIAN);
        let sinAngularDistance = Math.sin(angularDistance);
        let cosAngularDistance = Math.cos(angularDistance);

        let offsetLatRad = Math.asin(sinLat * cosAngularDistance + cosLat * sinAngularDistance * cosBearing);
        let offsetLongDeltaRad = Math.atan2(sinBearing * sinAngularDistance * cosLat, cosAngularDistance - sinLat * Math.sin(offsetLatRad));

        let offsetLat = offsetLatRad * Avionics.Utils.RAD2DEG;
        let offsetLong = latLong.long + offsetLongDeltaRad * Avionics.Utils.RAD2DEG;

        return new LatLong(offsetLat, (offsetLong + 540) % 360 - 180);
    }

    _xyOffsetByViewAngle(xy, distance, angle) {
        return xy.add(WT_GVector2.fromPolar(distance, angle * Avionics.Utils.DEG2RAD));
    }

    createRenderer() {
        return new WT_MapProjectionRenderer(this);
    }

    static createProjection(name) {
        switch (name) {
            case WT_MapProjection.Projection.EQUIRECTANGULAR: return new WT_MapProjection(name, d3.geoEquirectangular());
            case WT_MapProjection.Projection.MERCATOR: return new WT_MapProjection(name, d3.geoMercator());
        }
    }
}
WT_MapProjection.SCALE_FACTOR_TOLERANCE = 0.0000001;
WT_MapProjection.Projection = {
    EQUIRECTANGULAR: "equirectangular",
    MERCATOR: "mercator"
};
WT_MapProjection.OPTIONS_DEF = {
    _viewWidth: {default: 1000},
    _viewHeight: {default: 1000},
    _target: {default: new LatLong(0, 0)},
    _viewTargetOffset: {},
    _range: {},
    _rotation: {default: 0}
};

class WT_MapProjectionRenderer {
    constructor(projection) {
        this._projection = projection;
        this._d3Path = d3.geoPath().projection(projection._d3Projection);

        this._optsManager = new WT_OptionsManager(this, WT_MapProjectionRenderer.OPTIONS_DEF);
    }

    get projection() {
        return this._projection;
    }

    _setClipExtent() {
        if (!this.useViewClip) {
            return;
        }

        let clipExtent = this.viewClipExtent;
        if (clipExtent === null) {
            clipExtent = [[0, 0], [this.projection.viewWidth, this.projection.viewHeight]];
        }
        this.projection._d3Projection.clipExtent(clipExtent);
    }

    _setOptions() {
        this.projection._d3Projection.precision(this.precision);
        this._setClipExtent();
    }

    _resetOptions() {
        this.projection._d3Projection.precision(0.70710678118);
        this.projection._d3Projection.clipExtent(null);
    }

    calculateBounds(object) {
        this._setOptions();
        let bounds = this._d3Path.bounds(object);
        this._resetOptions();
        return bounds;
    }

    renderSVG(object) {
        this._setOptions();
        let d = this._d3Path(object);
        this._resetOptions();
        return d;
    }

    renderCanvas(object, context) {
        this._setOptions();
        this._d3Path.context(context);
        this._d3Path(object);
        this._d3Path.context(null);
        this._resetOptions();
    }
}
WT_MapProjectionRenderer.OPTIONS_DEF = {
    precision: {default: 0.70710678118, auto: true},
    useViewClip: {default: false, auto: true},
    viewClipExtent: {default: null, auto: true},
};