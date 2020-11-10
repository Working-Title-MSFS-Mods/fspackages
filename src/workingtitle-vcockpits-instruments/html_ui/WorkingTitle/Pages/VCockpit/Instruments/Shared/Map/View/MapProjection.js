class WT_MapProjection {
    constructor(name, d3Projection) {
        this._name = name;
        this._d3Projection = d3Projection;
        this._d3Projection.center([0, 0]);
        this._d3Projection.translate([0, 0]);
        this.__range = new WT_NumberUnit(1, WT_Unit.NMILE);

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

    get viewCenter() {
        return {x: this.viewWidth / 2, y: this.viewHeight / 2};
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

    get _viewTargetOffset() {
        return this.__viewTargetOffset;
    }

    set _viewTargetOffset(offset) {
        this.__viewTargetOffset = offset;
    }

    get viewTargetOffset() {
        return this._viewTargetOffset;
    }

    set viewTargetOffset(offset) {
        this._viewTargetOffset = offset;
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

    get _rotation() {
        return this.__rotation;
    }

    set _rotation(rotation) {
        this.__rotation = rotation;
        this._sin = Math.sin(rotation * Avionics.Utils.DEG2RAD);
        this._cos = Math.cos(rotation * Avionics.Utils.DEG2RAD);
        this._d3Projection.angle(-rotation);
    }

    get rotation() {
        return this._rotation;
    }

    set rotation(rotation) {
        this._rotation = rotation;
        this._recalculateProjection();
    }

    get center() {
        return this._center;
    }

    get viewTarget() {
        return {x: this.viewCenter.x + this.viewTargetOffset.x, y: this.viewCenter.y + this.viewTargetOffset.y};
    }

    _recalculateProjection() {
        this._d3Projection.translate([0, 0]);
        let currentTargetXY = this._d3Projection(this.latLongGameToProjection(this.target));

        if (isNaN(currentTargetXY[0] + currentTargetXY[1])) {
            return;
        }

        let currentCenterX = currentTargetXY[0] - this.viewTargetOffset.x;
        let currentCenterY = currentTargetXY[1] - this.viewTargetOffset.y
        let dx = 0;
        let dyTop = -this.viewHeight / 2;
        let dyBottom = this.viewHeight / 2;

        let rotatedDxTop = dx * this._cos - dyTop * this._sin;
        let rotatedDyTop = dx * this._sin + dyTop * this._cos;
        let rotatedDxBottom = dx * this._cos - dyBottom * this._sin;
        let rotatedDyBottom = dx * this._sin + dyBottom * this._cos;

        let top = this._d3Projection.invert([currentCenterX + rotatedDxTop, currentCenterY + rotatedDyTop]);
        let bottom = this._d3Projection.invert([currentCenterX + rotatedDxBottom, currentCenterY + rotatedDyBottom]);
        let currentRange = WT_Unit.GA_RADIAN.convert(d3.geoDistance(top, bottom), this.range.unit);
        let ratio = currentRange / this.range.number;

        if (isNaN(ratio) || ratio === 0) {
            return;
        }

        let currentScale = this._d3Projection.scale();
        this._d3Projection.scale(currentScale * ratio);

        currentTargetXY = this._d3Projection(this.latLongGameToProjection(this.target));
        this._d3Projection.translate([-currentTargetXY[0] + this.viewWidth / 2 + this.viewTargetOffset.x, -currentTargetXY[1] + this.viewHeight / 2 + this.viewTargetOffset.y]);

        this._center = this.invertXY(this.viewCenter);
    }

    relXYToAbsXY(xy) {
        return {x: xy.x * this.viewWidth, y: xy.y * this.viewHeight};
    }

    absXYToRelXY(xy) {
        return {x: xy.x / this.viewWidth, y: xy.y / this.viewHeight};
    }

    xyViewToProjection(xy) {
        return [xy.x, xy.y];
    }

    xyProjectionToView(xy) {
        return {x: xy[0], y: xy[1]};
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

    isLatLongInBounds(latLong, margin = 0) {
        return this.isXYInBounds(this.projectLatLong(latLong), margin);
    }

    isXYInBounds(xy, margin = 0) {
        return (xy.x >= -this.viewWidth * margin) &&
               (xy.y <= this.viewWidth * (1 + margin)) &&
               (xy.y >= -this.viewHeight * margin) &&
               (xy.y <= this.viewHeight * (1 + margin));
    }

    xyOffsetByViewAngle(xy, distance, angle) {
        let sin = Math.sin(angle * Avionics.Utils.DEG2RAD);
        let cos = Math.cos(angle * Avionics.Utils.DEG2RAD);
        return {x: xy.x + distance * sin, y: xy.y - distance * cos};
    }

    offsetByViewAngle(point, distance, angle) {
        if (distance instanceof WT_NumberUnit) {
            return undefined;
        } else {
            return this.xyOffsetByViewAngle(point, distance, angle);
        }
    }

    offsetByBearing(point, distance, bearing) {
        if (distance instanceof WT_NumberUnit) {
            return undefined;
        } else {
            return this.xyOffsetByViewAngle(point, distance, bearing + this.rotation);
        }
    }

    _offsetInViewSpace(point, distance, angle) {
        if (point.x !== undefined && point.y !== undefined) {
            return this.xyOffsetByViewAngle(point, distance, angle);
        } else if (point.lat !== undefined && point.long !== undefined) {
            return this.xyOffsetByViewAngle(this.projectLatLong(latLong), distance, angle);
        }
        return undefined;
    }

    _offsetInGeoSpace(point, distance, angle) {
        return undefined;
    }

    static createProjection(name) {
        switch (name) {
            case WT_MapProjection.Projection.EQUIRECTANGULAR: return new WT_MapProjection(name, d3.geoEquirectangular());
            case WT_MapProjection.Projection.MERCATOR: return new WT_MapProjection(name, d3.geoMercator());
        }
    }
}
WT_MapProjection.Projection = {
    EQUIRECTANGULAR: "equirectangular",
    MERCATOR: "mercator"
};
WT_MapProjection.OPTIONS_DEF = {
    _viewWidth: {default: 1000},
    _viewHeight: {default: 1000},
    _target: {default: new LatLong(0, 0)},
    _viewTargetOffset: {default: {x: 0, y: 0}},
    _range: {},
    _rotation: {default: 0}
};