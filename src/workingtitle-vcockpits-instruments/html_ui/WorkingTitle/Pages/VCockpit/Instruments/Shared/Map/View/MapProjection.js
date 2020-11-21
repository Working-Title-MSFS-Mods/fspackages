class WT_MapProjection {
    constructor(name, d3Projection) {
        this._name = name;
        this._d3Projection = d3Projection;
        this._d3Projection.center([0, 0]);
        this._d3Projection.translate([0, 0]);

        this.__range = new WT_NumberUnit(1, WT_Unit.NMILE);
        this.__viewTargetOffset = new WT_GVector2(0, 0);

        this._optsManager = new WT_OptionsManager(this, WT_MapProjection.OPTIONS_DEF);

        this._syncedRenderer = new WT_MapProjectionSyncedRenderer(this, this._d3Projection);
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

    get precision() {
        return this._d3Projection.precision();
    }

    get renderer() {
        return this._syncedRenderer;
    }

    _calculateRangeAtCenter(center) {
        let top = this._d3Projection.invert([center.x, center.y - this.viewHeight / 2]);
        let bottom = this._d3Projection.invert([center.x, center.y + this.viewHeight / 2]);
        return WT_Unit.GA_RADIAN.createNumber(d3.geoDistance(top, bottom));
    }

    _recalculateProjection() {
        this._d3Projection.translate([this.viewWidth / 2, this.viewHeight / 2]);
        this._d3Projection.clipExtent([[0, 0], [this.viewWidth, this.viewHeight]]);

        let currentTargetXY = this._d3Projection(WT_MapProjection.latLongGameToProjection(this.target));

        if (isNaN(currentTargetXY[0] + currentTargetXY[1])) {
            return;
        }

        let currentCenterXY = WT_MapProjection.xyProjectionToView(currentTargetXY).subtract(this.viewTargetOffset, true);
        let currentRange = this._calculateRangeAtCenter(currentCenterXY);
        let ratio = currentRange.ratio(this.range);

        if (isNaN(ratio) || ratio === 0) {
            return;
        }

        while (Math.abs(ratio - 1) > WT_MapProjection.SCALE_FACTOR_TOLERANCE) {
            let currentScale = this._d3Projection.scale();
            this._d3Projection.scale(currentScale * ratio);

            currentTargetXY = this._d3Projection(WT_MapProjection.latLongGameToProjection(this.target));
            currentCenterXY = WT_MapProjection.xyProjectionToView(currentTargetXY).subtract(this.viewTargetOffset, true);
            currentRange = this._calculateRangeAtCenter(currentCenterXY);
            ratio = currentRange.ratio(this.range);
        }
        let center = this._d3Projection.invert(WT_MapProjection.xyViewToProjection(currentCenterXY));
        this._d3Projection.center(center);
        this._center = WT_MapProjection.latLongProjectionToGame(center);
        //this._d3Projection.translate([-currentTargetXY[0] + this.viewWidth / 2 + this.viewTargetOffset.x, -currentTargetXY[1] + this.viewHeight / 2 + this.viewTargetOffset.y]);

        //this._center = this.invertXY(this.viewCenter);
    }

    relXYToAbsXY(xy) {
        return WT_GTransform2.scale(this.viewWidth, this.viewHeight).apply(xy);
    }

    absXYToRelXY(xy) {
        return WT_GTransform2.scale(1 / this.viewWidth, 1 / this.viewHeight).apply(xy);
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
        let projected = this.project(WT_MapProjection.latLongGameToProjection(latLong));
        return WT_MapProjection.xyProjectionToView(projected);
    }

    invertXY(xy) {
        let inverse = this.invert(WT_MapProjection.xyViewToProjection(xy));
        return WT_MapProjection.latLongProjectionToGame(inverse);
    }

    distance(point1, point2) {
        if (point1.lat !== undefined && point1.long !== undefined) {
            point1 = WT_MapProjection.latLongGameToProjection(point1);
        }
        if (point2.lat !== undefined && point2.long !== undefined) {
            point2 = WT_MapProjection.latLongGameToProjection(point2);
        }
        return WT_Unit.GA_RADIAN.createNumber(d3.geoDistance(point1, point2));
    }

    isLatLongInBounds(latLong, margin = 0) {
        return this.isXYInBounds(this.projectLatLong(latLong), margin);
    }

    isInView(point, margin = 0) {
        if (point.lat !== undefined && point.long !== undefined) {
            point = this.projectLatLong(point);
        }
        return (point.x >= -this.viewWidth * margin) &&
               (point.x <= this.viewWidth * (1 + margin)) &&
               (point.y >= -this.viewHeight * margin) &&
               (point.y <= this.viewHeight * (1 + margin));
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

    createCustomRenderer() {
        return new WT_MapProjectionRenderer(d3[this.name]());
    }

    syncRenderer(renderer) {
        renderer.projection.center(this._d3Projection.center());
        renderer.projection.translate(this._d3Projection.translate());
        renderer.projection.scale(this._d3Projection.scale());
        renderer.projection.angle(this._d3Projection.angle());
    }

    static xyViewToProjection(xy) {
        return [xy.x, xy.y];
    }

    static xyProjectionToView(xy) {
        return new WT_GVector2(xy[0], xy[1]);
    }

    static latLongGameToProjection(latLong) {
        return [latLong.long, latLong.lat];
    }

    static latLongProjectionToGame(latLong) {
        return new LatLong(latLong[1], latLong[0]);
    }

    static createProjection(name) {
        return new WT_MapProjection(name, d3[name]());
    }
}
WT_MapProjection.SCALE_FACTOR_TOLERANCE = 0.0000001;
WT_MapProjection.Projection = {
    EQUIRECTANGULAR: "geoEquirectangular",
    MERCATOR: "geoMercator"
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
        this._d3Projection = projection;
        this._d3Path = d3.geoPath().projection(projection);
    }

    get projection() {
        return this._d3Projection;
    }

    get center() {
        return WT_MapProjection.latLongProjectionToGame(this.projection.center());
    }

    set center(center) {
        this.projection.center(WT_MapProjection.latLongGameToProjection(center));
    }

    get translate() {
        return WT_MapProjection.xyProjectionToView(this.projection.translate());
    }

    set translate(factor) {
        this.projection.translate(WT_MapProjection.xyViewToProjection(factor));
    }

    get scaleFactor() {
        return this.projection.scaleFactor();
    }

    set scaleFactor(factor) {
        this.projection.scaleFactor(factor);
    }

    get rotation() {
        return -this.projection.angle();
    }

    set rotation(angle) {
        this.projection.angle(-angle);
    }

    get precision() {
        return this.projection.precision();
    }

    set precision(value) {
        this.projection.precision(value);
    }

    get viewClipExtent() {
        let value = this.projection.clipExtent();
        if (value !== null) {
            value = value.map(WT_MapProjection.xyProjectionToView);
        }
        return value;
    }

    set viewClipExtent(bounds) {
        if (bounds !== null) {
            bounds = bounds.map(WT_MapProjection.xyViewToProjection);
        }
        this.projection.clipExtent(bounds);
    }

    renderSVG(object) {
        return this._d3Path(object);
    }

    renderCanvas(object, context) {
        this._d3Path.context(context);
        this._d3Path(object);
        this._d3Path.context(null);
    }

    calculateBounds(object) {
        return this._d3Path.bounds(object).map(WT_MapProjection.xyProjectionToView);
    }

    calculateCentroid(object) {
        return this._d3Path.centroid(object).map(WT_MapProjection.xyProjectionToView);
    }
}

class WT_MapProjectionSyncedRenderer extends WT_MapProjectionRenderer {
    constructor(mapProjection, projection) {
        super(projection);
        this._mapProjection = mapProjection;
    }

    get mapProjection() {
        return this._mapProjection;
    }

    get projection() {
        return undefined;
    }

    get center() {
        return this.mapProjection.center;
    }

    set center(center) {
    }

    get translate() {
        return new WT_GVector2(this.mapProjection.viewWidth / 2, this.mapProjection.viewHeight / 2);
    }

    set translate(factor) {
    }

    get scaleFactor() {
        return this.mapProjection.scaleFactor;
    }

    set scaleFactor(factor) {
    }

    get rotation() {
        return this.mapProjection.rotation;
    }

    set rotation(angle) {
    }

    get precision() {
        return this.mapProjection.precision;
    }

    set precision(value) {
    }

    get viewClipExtent() {
        return [
            new WT_GVector2(0, 0),
            new WT_GVector2(this.mapProjection.viewWidth, this.mapProjection.viewHeight)
        ];
    }

    set viewClipExtent(bounds) {
    }
}