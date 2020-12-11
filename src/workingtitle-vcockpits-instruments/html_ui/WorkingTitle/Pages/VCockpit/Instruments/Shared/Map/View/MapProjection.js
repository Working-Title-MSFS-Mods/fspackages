/**
 * Represents a projection of spherical coordinates onto a viewing window.
 */
class WT_MapProjection {
    /**
     * @param {String} name - the name of the new map projection.
     * @param {d3.projection} d3Projection - a d3.geo projection function. This function will determine how spherical coordinates are projected onto a 2D plane.
     */
    constructor(name, d3Projection) {
        this._name = name;
        this._d3Projection = d3Projection;
        this._d3Projection.center([0, 0]);
        this._d3Projection.translate([0, 0]);

        this.__target = new WT_GeoPoint(0, 0, 0);
        this._center = new WT_GeoPoint(0, 0, 0);
        this.__range = new WT_NumberUnit(1, WT_Unit.NMILE);
        this._viewResolution = new WT_NumberUnit(1, WT_Unit.NMILE);
        this.__viewTargetOffset = new WT_GVector2(0, 0);
        this._viewTarget = new WT_GVector2(0, 0);
        this._viewCenter = new WT_GVector2(0, 0);

        this._optsManager = new WT_OptionsManager(this, WT_MapProjection.OPTIONS_DEF);

        this._syncedRenderer = new WT_MapProjectionSyncedRenderer(this, this._d3Projection);

        this._currentRange = new WT_NumberUnit(0, WT_Unit.GA_RADIAN);
        this._tempVector = new WT_GVector2(0, 0);
        this._tempGeoPoint1 = new WT_GeoPoint(0, 0, 0);
        this._tempGeoPoint2 = new WT_GeoPoint(0, 0, 0);
        this._tempArray1 = [0, 0];
        this._tempArray2 = [0, 0];

        this._readonly = new WT_MapProjectionReadOnly(this);
    }

    /**
     * @readonly
     * @property {String} name - the name of this projection.
     * @type {String}
     */
    get name() {
        return this._name;
    }

    /**
     * @property {Number} viewWidth - the width, in pixels, of the projected viewing window.
     * @type {Number}
     */
    get viewWidth() {
        return this._viewWidth;
    }

    set viewWidth(val) {
        this._viewWidth = val;
        this._recalculateProjection();
    }

    /**
     * @property {Number} viewHeight - the height, in pixels, of the projected viewing window.
     * @type {Number}
     */
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

    /**
     * @property {WT_GVector2} viewTargetOffset - the offset, in pixels, of this projection's target from the center of the viewing window.
     * @type {WT_GVector2}
     */
    get viewTargetOffset() {
        return this._viewTargetOffset.readonly();
    }

    set viewTargetOffset(offset) {
        this._viewTargetOffset = offset;
        this._recalculateProjection();
    }

    /**
     * @readonly
     * @property {WT_GVector2} viewTarget - the projected location, in pixel coordinates, of this projection's target within the viewing window.
     * @type {WT_GVector2}
     */
    get viewTarget() {
        return this._viewTarget.readonly();
    }

    /**
     * @readonly
     * @property {WT_GVector2} viewCenter - the center of the viewing window in pixel coordinates.
     * @type {WT_GVector2}
     */
    get viewCenter() {
        return this._viewCenter.readonly();
    }

    /**
     * @readonly
     * @property {WT_NumberUnit} viewResolution - the per pixel resolution of the viewing window. Default unit is nautical miles.
     * @type {WT_NumberUnit}
     */
    get viewResolution() {
        return this._viewResolution.readonly();
    }

    /**
     * @readonly
     * @property {WT_GeoPoint} center - the geographical point that is projected onto the center of the viewing window.
     * @type {WT_GeoPoint}
     */
    get center() {
        return this._center.readonly();
    }

    get _target() {
        return this.__target.readonly();
    }

    set _target(target) {
        this.__target.set(Math.max(-70, Math.min(70, target.lat)), target.long, 0);
    }

    /**
     * @property {WT_GeoPoint} target - the target geographical point of this projection.
     * @type {WT_GeoPoint}
     */
    get target() {
        return this._target;
    }

    set target(target) {
        this._target = target;
        this._recalculateProjection();
    }

    get _range() {
        return this.__range.readonly();
    }

    set _range(range) {
        this.__range.set(range);
    }

    /**
     * @property {WT_NumberUnit} range - the range of this projection, defined as the great-circle distance between the locations projected
     *                                   onto the two points at the top and bottom of the viewing window that lie along a vertical line that
     *                                   crosses the center of the window. Default unit is nautical miles.
     * @type {WT_NumberUnit}
     */
    get range() {
        return this._range;
    }

    set range(range) {
        this._range = range;
        this._recalculateProjection();
    }

    /**
     * @readonly
     * @property {Number} scale - the nominal scale of this projection. A nominal scale of 1 indicates that a pre-projected distance of 1 great-arc radian
     *                            (i.e. the radius of the Earth) will be projected to a distance of 1 pixel in the viewing window assuming an underlying
     *                            scale factor of 1.
     * @type {Number}
     */
    get scale() {
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

    /**
     * @property {Number} rotation - the post-projected rotation of this projection in degrees. Positive deviation indicates clockwise rotation.
     * @type {Number}
     */
    get rotation() {
        return this._rotation;
    }

    set rotation(rotation) {
        this._rotation = rotation;
        this._recalculateProjection();
    }

    /**
     * @readonly
     * @property {Number} precision - the Douglas-Peucker distance used by this projection's synced renderer for adaptive resampling.
     * @type {Number}
     */
    get precision() {
        return this._d3Projection.precision();
    }

    /**
     * @readonly
     * @property {WT_MapProjectionSyncedRenderer} renderer - a renderer that is synced to this projection.
     * @type {WT_MapProjectionSyncedRenderer}
     */
    get renderer() {
        return this._syncedRenderer;
    }

    _calculateRangeAtCenter(center) {
        this._tempArray1[0] = center.x;
        this._tempArray1[1] = center.y - this.viewHeight / 2;
        this._tempArray2[0] = center.x;
        this._tempArray2[1] = center.y + this.viewHeight / 2;
        let top = this._d3Projection.invert(this._tempArray1, this._tempArray1);
        let bottom = this._d3Projection.invert(this._tempArray2, this._tempArray2);
        return this._currentRange.set(d3.geoDistance(top, bottom));
    }

    _recalculateProjection() {
        this._viewCenter.set(this.viewWidth / 2, this.viewHeight / 2);
        this._viewTarget.set(this.viewCenter.x + this.viewTargetOffset.x, this.viewCenter.y + this.viewTargetOffset.y);
        this._viewResolution.set(this.range.number / this.viewHeight);

        this._tempArray1[0] = this.viewWidth / 2;
        this._tempArray1[1] = this.viewHeight / 2;
        this._d3Projection.translate(this._tempArray1);

        this._tempArray1[0] = 0;
        this._tempArray1[1] = 0;
        this._tempArray2[0] = this.viewWidth;
        this._tempArray2[1] = this.viewHeight;
        this._d3Projection.clipExtent([this._tempArray1, this._tempArray2]);

        let currentTargetXY = this._d3Projection(WT_MapProjection.latLongGameToProjection(this.target, this._tempArray1));

        if (isNaN(currentTargetXY[0] + currentTargetXY[1])) {
            return;
        }

        let currentCenterXY = WT_MapProjection.xyProjectionToView(currentTargetXY, this._tempVector).subtract(this.viewTargetOffset);
        let currentRange = this._calculateRangeAtCenter(currentCenterXY);
        let ratio = currentRange.ratio(this.range);

        if (isNaN(ratio) || ratio === 0) {
            return;
        }

        while (Math.abs(ratio - 1) > WT_MapProjection.SCALE_FACTOR_TOLERANCE) {
            let currentScale = this._d3Projection.scale();
            this._d3Projection.scale(currentScale * ratio);

            currentTargetXY = this._d3Projection(WT_MapProjection.latLongGameToProjection(this.target, this._tempArray1));
            currentCenterXY = WT_MapProjection.xyProjectionToView(currentTargetXY, this._tempVector).subtract(this.viewTargetOffset);
            currentRange = this._calculateRangeAtCenter(currentCenterXY);
            ratio = currentRange.ratio(this.range);
        }
        let center = this._d3Projection.invert(WT_MapProjection.xyViewToProjection(currentCenterXY, this._tempArray2));
        this._d3Projection.center(center);
        WT_MapProjection.latLongProjectionToGame(center, this._center);
    }

    /**
     * Converts relative pixel coordinates (where x and y are between 0 and 1) to absolute pixel coordinates in viewing window space.
     * @param {{x:Number, y:Number}} xy - relative pixel coordinates.
     * @param {WT_GVector2} [reference] - a WT_GVector2 object in which to store the result. If this argument is not supplied,
     *                                    a new WT_GVector2 object is created.
     * @returns {WT_GVector2} absolute pixel coordinates.
     */
    relXYToAbsXY(xy, reference) {
        let x = xy.x * this.viewWidth;
        let y = xy.y * this.viewHeight;
        if (reference) {
            return reference.set(x, y);
        } else {
            return new WT_GVector2(x, y);
        }
    }

    /**
     * Converts absolute pixel coordinates in viewing window space to relative pixel coordinates.
     * @param {{x:Number, y:Number}} xy - absolute pixel coordinates.
     * @param {WT_GVector2} [reference] - a WT_GVector2 object in which to store the result. If this argument is not supplied,
     *                                    a new WT_GVector2 object is created.
     * @returns {WT_GVector2} relative pixel coordinates.
     */
    absXYToRelXY(xy, reference) {
        let x = xy.x / this.viewWidth;
        let y = xy.y / this.viewHeight;
        if (reference) {
            return reference.set(x, y);
        } else {
            return new WT_GVector2(x, y);
        }
    }

    /**
     * Sets this projection's options using an options object. Because the projection needs to recalculate its parameters when certain
     * options are changed (namely: target, targetOffset, range, rotation), changing multiple options through this method is more
     * efficient than changing them individually.
     * @param {Object} opts - the options object containing the new options values.
     */
    setOptions(opts) {
        this._optsManager.setOptions(opts);
        this._recalculateProjection();
    }

    /**
     * Projects spherical coordinates (lat/long) onto the viewing window.
     * @param {Number[]|{lat:Number, long:Number}} point - the [long, lat] pair or lat/long object defining the coordinates to project. The
     *                                                     type of object passed to this argument determines the type of object returned
     *                                                     by this method; [long, lat] results in a [x, y] pair and lat/long object results
     *                                                     in a WT_GVector object.
     * @param {Number[]|WT_GVector2} [reference] - a [x, y] pair or WT_GVector2 in which to store the results. If this argument is not
     *                                             supplied, a new object of the appropriate type is created.
     * @returns {Number[]|WT_GVector2} a [x, y] pair or 2D vector representing the projected point, in pixel coordinates.
     */
    project(point, reference) {
        if (Array.isArray(point) && point.length >= 2) {
            return this._d3Projection(point, reference);
        } else if (typeof point.lat === "number" && typeof point.long === "number") {
            let projected = this._d3Projection(WT_MapProjection.latLongGameToProjection(point, this._tempArray1), this._tempArray2);
            return WT_MapProjection.xyProjectionToView(projected, reference);
        } else {
            return undefined;
        }
    }

    /**
     * Applies this projection's inverse to coordinates in the viewing window to get the corresponding point in spherical coordinates.
     * @param {Number[]|{x:Number, y:Number}} point - the [x, y] pair or 2D vector, in pixel coordinates, to invert. The type of object
     *                                                passed to this argument determines the type of object returned by this method;
     *                                                [x, y] results in a [long, lat] pair and 2D vector object results in a LatLong object.
     * @param {Number[]|WT_GeoPoint} [reference] - a [long, lat] pair or WT_GeoPoint object in which to store the results. If this argument
     *                                             is not supplied, a new object of the appropriate type is created.
     * @returns {Number[]|WT_GeoPoint} a [long, lat] pair or geographic point representing the location whose projection equals the
     *                                 inverted point.
     */
    invert(point, reference) {
        if (Array.isArray(point) && point.length >= 2) {
            return this._d3Projection.invert(point, reference);
        } else if (typeof point.x === "number" && typeof point.y === "number") {
            let inverse = this._d3Projection.invert(WT_MapProjection.xyViewToProjection(point, this._tempArray1), this._tempArray2);
            return WT_MapProjection.latLongProjectionToGame(inverse, reference);
        } else {
            return undefined;
        }
    }

    _asGeoPoint(point, reference) {
        if (typeof point.lat === "number" && typeof point.long === "number") {
            reference.set(point.lat, point.long, 0);
        } else if (typeof point.x === "number" && typeof point.y === "number") {
            this.invert(point, reference);
        } else {
            reference = undefined;
        }
        return reference;
    }

    _asVector2(point, reference) {
        if (typeof point.x === "number" && typeof point.y === "number") {
            reference.set(point);
        } else if (typeof point.lat === "number" && typeof point.long === "number") {
            this.project(point, reference);
        } else {
            reference = undefined;
        }
        return reference;
    }

    /**
     * Calculates the great-circle distance between two points on the Earth's surface. The points may be supplied as either lat/long
     * coordinates or 2D vectors. If 2D vectors are supplied, they will be converted to geographic points by inverse projection.
     * @param {{lat:Number, long:Number}|{x:Number, y:Number}} point1 - the first point.
     * @param {{lat:Number, long:Number}|{x:Number, y:Number}} point2 - the second point.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the results. If this argument is not supplied, a new
     *                                      WT_NumberUnit object is created.
     * @returns {WT_NumberUnit} the distance. Default unit is great-arc radians (1 great-arc radian = radius of the Earth).
     */
    distance(point1, point2, reference) {
        point1 = this._asGeoPoint(point1, this._tempGeoPoint1);
        point2 = this._asGeoPoint(point2, this._tempGeoPoint2);

        if (!point1 || !point2) {
            return undefined;
        }

        let distance = point1.distance(point2);
        if (reference) {
            return reference.set(distance, WT_Unit.GA_RADIAN);
        } else {
            return WT_Unit.GA_RADIAN.createNumber(distance);
        }
    }

    /**
     * Calculates the initial bearing (forward azimuth) from an origin point to a destination point. The points may be supplied as either
     * lat/long coordinates or 2D vectors. If 2D vectors are supplied, they will be converted to geographic points by inverse projection.
     * @param {{lat:Number, long:Number}|{x:Number, y:Number}} origin - the origin point.
     * @param {{lat:Number, long:Number}|{x:Number, y:Number}} destination - the destination point.
     * @returns {Number} a value between 0 and 360, representing the initial bearing (forward azimuth) from origin to destination, in degrees.
     */
    bearing(origin, destination) {
        origin = this._asGeoPoint(origin, this._tempGeoPoint1);
        destination = this._asGeoPoint(destination, this._tempGeoPoint2);

        if (!origin || !destination) {
            return undefined;
        }

        return origin.bearingTo(destination);
    }

    /**
     * Checks whether a point lies within the bounds of the viewing window. The point to check can either be in
     * spherical coordinates or pixel coordinates in the viewing window. If the former, the point will first be
     * projected before the bounds check is made.
     * @param {{lat:Number, long:Number}|WT_GVector2} point - the point to check.
     * @param {Number} margin - the margin to use, expressed as a fraction of the width/height of the viewing window.
     *                          (a positive margin extends the bounds beyond the true bounds of the viewing window)
     * @returns {Boolean} whether the projection of the specified point lies within the bounds of the viewing window.
     */
    isInView(point, margin = 0) {
        return this.renderer.isInView(point, margin);
    }

    _xyOffsetByViewAngle(xy, distance, angle, reference) {
        if (reference) {
            reference.setFromPolar(distance, angle * Avionics.Utils.DEG2RAD).add(xy);
        } else {
            return WT_GVector2.fromPolar(distance, angle * Avionics.Utils.DEG2RAD).add(xy);
        }
    }

    _offsetInViewSpace(point, distance, angle, reference) {
        point = this._asVector2(point, this._tempVector);
        if (!point) {
            return undefined;
        }
        return this._xyOffsetByViewAngle(point, distance, angle, reference);
    }

    _latLongOffsetByBearing(latLong, distance, bearing, reference) {
        if (reference) {
            return reference.set(latLong).offset(bearing, distance.asUnit(WT_Unit.GA_RADIAN), true);
        } else {
            return latLong.offset(bearing, distance.asUnit(WT_Unit.GA_RADIAN));
        }
    }

    _offsetInGeoSpace(point, distance, bearing, reference) {
        point = this._asGeoPoint(point, this._tempGeoPoint1);
        if (!point) {
            return undefined;
        }
        return this._latLongOffsetByBearing(point, distance, bearing, reference);
    }

    /**
     * Offsets a point by a certain distance and angle. The angle is defined in the viewing plane, with 0 degrees indicating
     * straight up, and proceeding positively in the clockwise direction. The behavior of this method depends on what is
     * supplied as the distance argument. If a Number is supplied, the distance is interpreted as pixel distance and the offset
     * will be calculated in viewing window (projected) space. If a WT_NumberUnit is supplied, the distance is interpreted as
     * real-world distance and the offset will be calculated in spherical space. Regardless of in which space the calculation is
     * performed, the offset point will be expressed in the same coordinate space as the one in which the origin point was expressed.
     * @param {{lat:Number, long:Number}|{x:Number, y:Number}} point - the origin point.
     * @param {Number|WT_NumberUnit} distance - the distance to offset.
     * @param {Number} angle - the angle by which to offset.
     * @param {WT_GeoPoint|WT_GVector2} [reference] - the WT_GeoPoint or WT_GVector2 object in which to store the result. If this argument
     *                                                is not supplied, a new object of the appropriate type will be created.
     * @returns {LatLong|WT_GVector2} the offset point.
     */
    offsetByViewAngle(point, distance, angle, reference) {
        if (distance instanceof WT_NumberUnit) {
            return this._offsetInGeoSpace(point, distance, angle - this.rotation, reference);
        } else {
            return this._offsetInViewSpace(point, distance, angle, reference);
        }
    }

    /**
     * Offsets a point by a certain distance and bearing. The bearing is defined in spherical space, with 0 degrees indicating
     * (true) north, and proceeding positively in the clockwise direction. The behavior of this method depends on what is
     * supplied as the distance argument. If a Number is supplied, the distance is interpreted as pixel distance and the offset
     * will be calculated in viewing window (projected) space. If a WT_NumberUnit is supplied, the distance is interpreted as
     * real-world distance and the offset will be calculated in spherical space. Regardless of in which space the calculation is
     * performed, the offset point will be expressed in the same coordinate space as the one in which the origin point was expressed.
     * @param {{lat:Number, long:Number}|{x:Number, y:Number}} point - the origin point.
     * @param {Number|WT_NumberUnit} distance - the distance to offset.
     * @param {Number} bearing - the bearing by which to offset.
     * @param {WT_GeoPoint|WT_GVector2} [reference] - the WT_GeoPoint or WT_GVector2 object in which to store the result. If this argument
     *                                                is not supplied, a new object of the appropriate type will be created.
     * @returns {LatLong|WT_GVector2} the offset point.
     */
    offsetByBearing(point, distance, bearing, reference) {
        if (distance instanceof WT_NumberUnit) {
            return this._offsetInGeoSpace(point, distance, bearing, reference);
        } else {
            return this._offsetInViewSpace(point, distance, bearing + this.rotation, reference);
        }
    }

    createCustomRenderer() {
        return new WT_MapProjectionRenderer(d3[this.name]());
    }

    /**
     * Syncs a projection renderer to this projection. The following parameters are synced:
     * * center
     * * scale
     * * post-projection rotation
     * @param {WT_MapProjectionRenderer} renderer - the renderer to sync.
     */
    syncRenderer(renderer) {
        renderer.projection.center(this._d3Projection.center());
        renderer.projection.scale(this._d3Projection.scale());
        renderer.projection.angle(this._d3Projection.angle());
    }

    /**
     * @returns {WT_MapProjectionReadOnly} a read-only version of this projection.
     */
    readonly() {
        return this._readonly;
    }

    /**
     * Converts a 2D vector to a [x, y] pair.
     * @param {{x:Number, y:Number}} xy - the 2D vector to convert.
     * @param {Number[]} [reference] - a [x, y] pair to which to store the results. If this argument is not supplied, a new
     *                                 [x, y] pair is created.
     * @returns {Number[]} - a [x, y] pair.
     */
    static xyViewToProjection(xy, reference) {
        if (reference) {
            reference[0] = xy.x;
            reference[1] = xy.y;
            return reference;
        }
        return [xy.x, xy.y];
    }

    /**
     * Converts a [x, y] pair to a 2D vector.
     * @param {Number[]} xy - the [x, y] pair to convert.
     * @param {WT_GVector2} [reference] - a WT_GVector2 object to which to store the results. If this argument is not supplied, a new
     *                                    vector object is created.
     * @returns {WT_GVector2} - a 2D vector.
     */
    static xyProjectionToView(xy, reference) {
        if (reference) {
            return reference.set(xy[0], xy[1]);
        }
        return new WT_GVector2(xy[0], xy[1]);
    }

    /**
     * Converts a geographical point to a [long, lat] pair.
     * @param {{lat:Number, long:Number}} latLong - the geographical point to convert.
     * @param {Number[]} [reference] - a [long, lat] pair in which to store the results. If this argument is not supplied, a new
     *                                 [long, lat] pair is created.
     * @returns {Number[]} - a [long, lat] pair.
     */
    static latLongGameToProjection(latLong, reference) {
        if (reference) {
            reference[0] = latLong.long;
            reference[1] = latLong.lat;
            return reference;
        }
        return [latLong.long, latLong.lat];
    }

    /**
     * Converts a [long, lat] pair to a geographical point.
     * @param {Number[]} xy - the [long, lat] pair to convert.
     * @param {WT_GeoPoint} [reference] - a WT_GeoPoint object in which to store the results. If this argument is not supplied, a new
     *                                    WT_GeoPoint object is created.
     * @returns {WT_GeoPoint} - a geographical point.
     */
    static latLongProjectionToGame(latLong, reference) {
        if (reference) {
            return reference.set(latLong[1], latLong[0], 0);
        }
        return new WT_GeoPoint(latLong[1], latLong[0], 0);
    }

    /**
     * Creates a new projection with a specified name.
     * @param {String} name - the name of the new projection.
     */
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
    _target: {},
    _viewTargetOffset: {},
    _range: {},
    _rotation: {default: 0}
};

/**
 * A read-only interface for a map projection.
 */
class WT_MapProjectionReadOnly {
    /**
     * @param {WT_MapProjection} source
     */
    constructor(source) {
        this._source = source;
    }

    /**
     * @readonly
     * @property {String} name - the name of this projection.
     * @type {String}
     */
    get name() {
        return this._source.name;
    }

    /**
     * @readonly
     * @property {Number} viewWidth - the width, in pixels, of the projected viewing window.
     * @type {Number}
     */
    get viewWidth() {
        return this._source.viewWidth;
    }

    /**
     * @readonly
     * @property {Number} viewHeight - the height, in pixels, of the projected viewing window.
     * @type {Number}
     */
    get viewHeight() {
        return this._source.viewHeight;
    }

    /**
     * @readonly
     * @property {WT_GVector2} viewTargetOffset - the offset, in pixels, of this projection's target from the center of the viewing window.
     * @type {WT_GVector2}
     */
    get viewTargetOffset() {
        return this._source.viewTargetOffset;
    }

    /**
     * @readonly
     * @property {WT_GVector2} viewTarget - the projected location, in pixel coordinates, of this projection's target within the viewing window.
     * @type {WT_GVector2}
     */
    get viewTarget() {
        return this._source.viewTarget;
    }

    /**
     * @readonly
     * @property {WT_GVector2} viewCenter - the center of the viewing window in pixel coordinates.
     * @type {WT_GVector2}
     */
    get viewCenter() {
        return this._source.viewCenter;
    }

    /**
     * @readonly
     * @property {WT_NumberUnit} viewResolution - the per pixel resolution of the viewing window. Default unit is nautical miles.
     * @type {WT_NumberUnit}
     */
    get viewResolution() {
        return this._source.viewResolution;
    }

    /**
     * @readonly
     * @property {LatLong} center - the location, in spherical coordinates (lat/long) that is projected onto the center of the viewing window.
     * @type {LatLong}
     */
    get center() {
        return this._source.center;
    }

    /**
     * @readonly
     * @property {LatLong} target - the target location, in spherical coordinates (lat/long), of this projection.
     * @type {LatLong}
     */
    get target() {
        return this._source.target;
    }

    /**
     * @readonly
     * @property {WT_NumberUnit} range - the range of this projection, defined as the great-circle distance between the locations projected
     *                                   onto the two points at the top and bottom of the viewing window that lie along a vertical line that
     *                                   crosses the center of the window. Default unit is nautical miles.
     * @type {WT_NumberUnit}
     */
    get range() {
        return this._source.range;
    }

    /**
     * @readonly
     * @property {Number} scale - the nominal scale of this projection. A nominal scale of 1 indicates that a pre-projected distance of 1 great-arc radian
     *                            (i.e. the radius of the Earth) will be projected to a distance of 1 pixel in the viewing window assuming an underlying
     *                            scale factor of 1.
     * @type {Number}
     */
    get scale() {
        return this._source.scale;
    }

    /**
     * @readonly
     * @property {Number} rotation - the post-projected rotation of this projection in degrees. Positive deviation indicates clockwise rotation.
     * @type {Number}
     */
    get rotation() {
        return this._source.rotation;
    }

    /**
     * @readonly
     * @property {Number} precision - the Douglas-Peucker distance used by this projection's synced renderer for adaptive resampling.
     * @type {Number}
     */
    get precision() {
        return this._source.precision;
    }

    /**
     * @readonly
     * @property {WT_MapProjectionSyncedRenderer} renderer - a renderer that is synced to this projection.
     * @type {WT_MapProjectionSyncedRenderer}
     */
    get renderer() {
        return this._source.renderer;
    }

    /**
     * Converts relative pixel coordinates (where x and y are between 0 and 1) to absolute pixel coordinates in viewing window space.
     * @param {{x:Number, y:Number}} xy - relative pixel coordinates.
     * @param {WT_GVector2} [reference] - a WT_GVector2 object in which to store the result. If this argument is not supplied,
     *                                    a new WT_GVector2 object is created.
     * @returns {WT_GVector2} absolute pixel coordinates.
     */
    relXYToAbsXY(xy, reference) {
        return this._source.relXYToAbsXY(xy, reference);
    }

    /**
     * Converts absolute pixel coordinates in viewing window space to relative pixel coordinates.
     * @param {{x:Number, y:Number}} xy - absolute pixel coordinates.
     * @param {WT_GVector2} [reference] - a WT_GVector2 object in which to store the result. If this argument is not supplied,
     *                                    a new WT_GVector2 object is created.
     * @returns {WT_GVector2} relative pixel coordinates.
     */
    absXYToRelXY(xy, reference) {
        return this._source.absXYToRelXY(xy, reference);
    }

    /**
     * Projects spherical coordinates (lat/long) onto the viewing window.
     * @param {Number[]|{lat:Number, long:Number}} point - the [long, lat] pair or lat/long object defining the coordinates to project. The
     *                                                     type of object passed to this argument determines the type of object returned
     *                                                     by this method; [long, lat] results in a [x, y] pair and lat/long object results
     *                                                     in a WT_GVector object.
     * @param {Number[]|WT_GVector2} [reference] - a [x, y] pair or WT_GVector2 in which to store the results. If this argument is not
     *                                             supplied, a new object of the appropriate type is created.
     * @returns {Number[]|WT_GVector2} a [x, y] pair or 2D vector representing the projected point, in pixel coordinates.
     */
    project(point, reference) {
        return this._source.project(point, reference);
    }

    /**
     * Applies this projection's inverse to coordinates in the viewing window to get the corresponding point in spherical coordinates.
     * @param {Number[]|{x:Number, y:Number}} point - the [x, y] pair or 2D vector, in pixel coordinates, to invert. The type of object
     *                                                passed to this argument determines the type of object returned by this method;
     *                                                [x, y] results in a [long, lat] pair and 2D vector object results in a LatLong object.
     * @param {Number[]|WT_GeoPoint} [reference] - a [long, lat] pair or WT_GeoPoint object in which to store the results. If this argument
     *                                             is not supplied, a new object of the appropriate type is created.
     * @returns {Number[]|WT_GeoPoint} a [long, lat] pair or geographic point representing the location whose projection equals the
     *                                 inverted point.
     */
    invert(point, reference) {
        return this._source.invert(point, reference);
    }

    /**
     * Calculates the great-circle distance between two points on the Earth's surface. The points may be supplied as either lat/long
     * coordinates or 2D vectors. If 2D vectors are supplied, they will be converted to lat/long coordinates by inverse projection.
     * @param {{lat:Number, long:Number}|{x:Number, y:Number}} point1 - the first point.
     * @param {{lat:Number, long:Number}|{x:Number, y:Number}} point2 - the second point.
     * @param {WT_NumberUnit} [reference] - a WT_NumberUnit object in which to store the results. If this argument is not supplied, a new
     *                                      WT_NumberUnit object is created.
     * @returns {WT_NumberUnit} the distance. Default unit is great-arc radians (1 great-arc radian = radius of the Earth).
     */
    distance(point1, point2, reference) {
        return this._source.distance(point1, point2, reference);
    }

    /**
     * Calculates the initial bearing (forward azimuth) from an origin point to a destination point. The points may be supplied as either
     * lat/long coordinates or 2D vectors. If 2D vectors are supplied, they will be converted to geographic points by inverse projection.
     * @param {{lat:Number, long:Number}|{x:Number, y:Number}} origin - the origin point.
     * @param {{lat:Number, long:Number}|{x:Number, y:Number}} destination - the destination point.
     * @returns {Number} a value between 0 and 360, representing the initial bearing (forward azimuth) from origin to destination, in degrees.
     */
    bearing(origin, destination) {
        return this._source.bearing(origin, destination);
    }

    /**
     * Checks whether a point lies within the bounds of the viewing window. The point to check can either be in
     * spherical coordinates or pixel coordinates in the viewing window. If the former, the point will first be
     * projected before the bounds check is made.
     * @param {{lat:Number, long:Number}|WT_GVector2} point - the point to check.
     * @param {Number} margin - the margin to use, expressed as a fraction of the width/height of the viewing window.
     *                          (a positive margin extends the bounds beyond the true bounds of the viewing window)
     * @returns {Boolean} whether the projection of the specified point lies within the bounds of the viewing window.
     */
    isInView(point, margin = 0) {
        return this._source.isInView(point, margin);
    }

    /**
     * Offsets a point by a certain distance and angle. The angle is defined in the viewing plane, with 0 degrees indicating
     * straight up, and proceeding positively in the clockwise direction. The behavior of this method depends on what is
     * supplied as the distance argument. If a Number is supplied, the distance is interpreted as pixel distance and the offset
     * will be calculated in viewing window (projected) space. If a WT_NumberUnit is supplied, the distance is interpreted as
     * real-world distance and the offset will be calculated in spherical space. Regardless of in which space the calculation is
     * performed, the offset point will be expressed in the same coordinate space as the one in which the origin point was expressed.
     * @param {{lat:Number, long:Number}|{x:Number, y:Number}} point - the origin point.
     * @param {Number|WT_NumberUnit} distance - the distance to offset.
     * @param {Number} angle - the angle by which to offset.
     * @param {WT_GeoPoint|WT_GVector2} [reference] - the WT_GeoPoint or WT_GVector2 object in which to store the result. If this argument
     *                                                is not supplied, a new object of the appropriate type will be created.
     * @returns {LatLong|WT_GVector2} the offset point.
     */
    offsetByViewAngle(point, distance, angle, reference) {
        return this._source.offsetByViewAngle(point, distance, angle, reference);
    }

    /**
     * Offsets a point by a certain distance and bearing. The bearing is defined in spherical space, with 0 degrees indicating
     * (true) north, and proceeding positively in the clockwise direction. The behavior of this method depends on what is
     * supplied as the distance argument. If a Number is supplied, the distance is interpreted as pixel distance and the offset
     * will be calculated in viewing window (projected) space. If a WT_NumberUnit is supplied, the distance is interpreted as
     * real-world distance and the offset will be calculated in spherical space. Regardless of in which space the calculation is
     * performed, the offset point will be expressed in the same coordinate space as the one in which the origin point was expressed.
     * @param {{lat:Number, long:Number}|{x:Number, y:Number}} point - the origin point.
     * @param {Number|WT_NumberUnit} distance - the distance to offset.
     * @param {Number} bearing - the bearing by which to offset.
     * @param {WT_GeoPoint|WT_GVector2} [reference] - the WT_GeoPoint or WT_GVector2 object in which to store the result. If this argument
     *                                                is not supplied, a new object of the appropriate type will be created.
     * @returns {LatLong|WT_GVector2} the offset point.
     */
    offsetByBearing(point, distance, bearing, reference) {
        return this._source.offsetByBearing(point, distance, bearing, reference);
    }

    createCustomRenderer() {
        return this._source.createCustomRenderer();
    }

    /**
     * Syncs a projection renderer to this projection. The following parameters are synced:
     * * center
     * * scale
     * * post-projection rotation
     * @param {WT_MapProjectionRenderer} renderer - the renderer to sync.
     */
    syncRenderer(renderer) {
        this._source.syncRenderer(renderer);
    }
}

/**
 * A renderer that can directly render geometries defined in spherical space to a viewing plane.
 */
class WT_MapProjectionRenderer {
    /**
     * @param {d3.projection} projection - the d3.geo projection function to use for projection calculations.
     */
    constructor(projection) {
        this._d3Projection = projection;
        this._d3Path = d3.geoPath().projection(projection);

        this._tempVector = new WT_GVector2(0, 0);
        this._tempArray1 = [0, 0];
        this._tempArray2 = [0, 0];
    }

    /**
     * @readonly
     * @property {d3.projection} projection - the d3.geo projection function used by this renderer.
     * @type {d3.projection}
     */
    get projection() {
        return this._d3Projection;
    }

    /**
     * @property {LatLong} center - the center of the projection used by this renderer.
     * @type {LatLong}
     */
    get center() {
        return WT_MapProjection.latLongProjectionToGame(this.projection.center());
    }

    set center(center) {
        this.projection.center(WT_MapProjection.latLongGameToProjection(center));
    }

    /**
     * @property {WT_GVector2} translate - the translation of the projection used by this renderer. This determines where the center
     *                                     of the projection is projected onto the viewing plane.
     * @type {WT_GVector2}
     */
    get translate() {
        return WT_MapProjection.xyProjectionToView(this.projection.translate());
    }

    set translate(vector) {
        this.projection.translate(WT_MapProjection.xyViewToProjection(vector, this._tempArray1));
    }

    /**
     * @property {Number} scale - the nominal scale of the projection used by this renderer. A nominal scale of 1 indicates that
     *                            a pre-projected distance of 1 great-arc radian (i.e. the radius of the Earth) will be projected
     *                            to a distance of 1 pixel in the viewing window assuming an underlying scale factor of 1.
     * @type {Number}
     */
    get scale() {
        return this.projection.scale();
    }

    set scale(factor) {
        this.projection.scale(factor);
    }

    /**
     * @property {Number} rotation - the post-projection rotation, in degrees, used by this renderer. Positive deviation indicates
     *                               clockwise rotation.
     * @type {Number}
     */
    get rotation() {
        return -this.projection.angle();
    }

    set rotation(angle) {
        this.projection.angle(-angle);
    }

    /**
     * @property {Number} precision - the Douglas-Peucker distance used for adaptive resampling.
     * @type {Number}
     */
    get precision() {
        return this.projection.precision();
    }

    set precision(value) {
        this.projection.precision(value);
    }

    /**
     * @property {WT_GVector2[]} viewClipExtent - the post-projection clipping bounds used by this renderer. A null value indicates no
     *                                            clipping will be done.
     * @type {WT_GVector2[]}
     */
    get viewClipExtent() {
        let value = this.projection.clipExtent();
        if (value !== null) {
            value = [
                WT_MapProjection.xyProjectionToView(value[0]),
                WT_MapProjection.xyProjectionToView(value[1])
            ];
        }
        return value;
    }

    set viewClipExtent(bounds) {
        if (bounds !== null) {
            bounds = [
                WT_MapProjection.xyProjectionToView(bounds[0]),
                WT_MapProjection.xyProjectionToView(bounds[1])
            ];
        }
        this.projection.clipExtent(bounds);
    }

    /**
     * Projects spherical coordinates (lat/long) onto the viewing window.
     * @param {Number[]|{lat:Number, long:Number}} point - the [long, lat] pair or lat/long object defining the coordinates to project. The
     *                                                     type of object passed to this argument determines the type of object returned
     *                                                     by this method; [long, lat] results in a [x, y] pair and lat/long object results
     *                                                     in a WT_GVector object.
     * @param {Number[]|WT_GVector2} [reference] - a [x, y] pair or WT_GVector2 in which to store the results. If this argument is not
     *                                             supplied, a new object of the appropriate type is created.
     * @returns {Number[]|WT_GVector2} a [x, y] pair or 2D vector representing the projected point, in pixel coordinates.
     */
    project(point, reference) {
        if (Array.isArray(point) && point.length >= 2) {
            return this.projection(point, reference);
        } else if (typeof point.lat === "number" && typeof point.long === "number") {
            let projected = this.projection(WT_MapProjection.latLongGameToProjection(point, this._tempArray1), this._tempArray2);
            return WT_MapProjection.xyProjectionToView(projected, reference);
        } else {
            return undefined;
        }
    }

    /**
     * Applies this projection's inverse to coordinates in the viewing window to get the corresponding point in spherical coordinates.
     * @param {Number[]|{x:Number, y:Number}} point - the [x, y] pair or 2D vector, in pixel coordinates, to invert. The type of object
     *                                                passed to this argument determines the type of object returned by this method;
     *                                                [x, y] results in a [long, lat] pair and 2D vector object results in a LatLong object.
     * @param {Number[]} [reference] - a [long, lat] pair to which to store the results. This argument is ignored if a 2D vector is passed
     *                                 to the point argument. If this argument is not supplied, a new [long, lat] pair is created.
     * @returns {Number[]|LatLong} a [long, lat] pair or lat/long object representing the location whose projection equals the inverted point.
     */
    invert(point, reference) {
        if (Array.isArray(point) && point.length >= 2) {
            return this.projection.invert(point, reference);
        } else if (typeof point.x === "number" && typeof point.y === "number") {
            let inverse = this.projection.invert(WT_MapProjection.xyViewToProjection(point, this._tempArray1), this._tempArray2);
            return WT_MapProjection.latLongProjectionToGame(inverse);
        } else {
            return undefined;
        }
    }

    /**
     * Renders a GeoJSON Feature or FeatureCollection and returns a SVG path string representing the rendered object.
     * @param {Object} object - a GeoJSON Feature or FeatureCollection object.
     * @returns {String} a SVG path string representing the rendered object.
     */
    renderSVG(object) {
        return this._d3Path(object);
    }

    /**
     * Renders a GeoJSON Feature or FeatureCollection directly to a canvas context.
     * @param {Object} object - a GeoJSON Feature or FeatureCollection object.
     * @param {CanvasRenderingContext2D} - the canvas context to render to.
     */
    renderCanvas(object, context) {
        this._d3Path.context(context);
        this._d3Path(object);
        this._d3Path.context(null);
    }

    /**
     * Calculates the axis-aligned bounding box of a projected GeoJSON Feature or FeatureCollection.
     * @param {Object} object - a GeoJSON Feature or FeatureCollection object.
     * @returns {WT_GVector2[]} - a [topLeft, bottomRight] pair of 2D vectors representing the axis-aligned bounding box
     *                            of the projected object.
     */
    calculateBounds(object) {
        let bounds = this._d3Path.bounds(object);
        bounds = [
            WT_MapProjection.xyProjectionToView(bounds[0]),
            WT_MapProjection.xyProjectionToView(bounds[1])
        ];
        return bounds;
    }

    /**
     * Calculates the centroid of a projected GeoJSON Feature or FeatureCollection.
     * @param {Object} object - a GeoJSON Feature or FeatureCollection object.
     * @returns {WT_GVector2} - a 2D vector representing the centroid of the projected object.
     */
    calculateCentroid(object) {
        return WT_MapProjection.xyProjectionToView(this._d3Path.centroid(object));
    }

    /**
     * Calculates the area of a projected GeoJSON Feature or FeatureCollection.
     * @param {Object} object - a GeoJSON Feature or FeatureCollection object.
     * @returns {Number} - the area of the projected object, in square pixels.
     */
    calculateArea(object) {
        return this._d3Path.area(object);
    }

    /**
     * Checks whether a point lies within the bounds of this renderer's post-projection clipping bounds.
     * The point to check can either be in spherical coordinates or pixel coordinates in the viewing window.
     * If the former, the point will first be projected before the bounds check is made.
     * @param {{lat:Number, long:Number}|{x:Number, y:Number}} point - the point to check.
     * @param {Number} margin - the margin to use, expressed as a fraction of the width/height of the viewing window.
     *                          (a positive margin extends the bounds beyond the true bounds of the viewing window)
     * @returns {Boolean} whether the projection of the specified point lies within the bounds of the viewing window.
     */
    isInView(point, margin = 0) {
        let clip = this.viewClipExtent;
        if (clip === null) {
            return true;
        }

        let width = clip[1].x - clip[0].x;
        let height = clip[0].y - clip[0].y;

        if (typeof point.lat === "number" && typeof point.long === "number") {
            point = this.project(point, this._tempVector);
        } else if (typeof point.x !== "number" || typeof point.y !== "number") {
            return undefined;
        }
        return (point.x >= clip[0].x - width * margin) &&
               (point.x <= clip[1].x + width * margin) &&
               (point.y >= clip[0].y - height * margin) &&
               (point.y <= clip[1].y + height * margin);
    }
}

/**
 * A projection renderer that is synced to a map projection. Due to the synchronization, this type of renderer is not
 * configurable and all settings are slaved to the owning map projection.
 */
class WT_MapProjectionSyncedRenderer extends WT_MapProjectionRenderer {
    /**
     * @param {WT_MapProjection} mapProjection - the owner of the new synced renderer.
     * @param {d3.projection} projection - the d3.geo projection function used by the owning map projection.
     */
    constructor(mapProjection, projection) {
        super(projection);
        this._mapProjection = mapProjection;
    }

    /**
     * @readonly
     * @property {WT_MapProjection} mapProjection - the map projection that owns this renderer.
     * @type {WT_MapProjection}
     */
    get mapProjection() {
        return this._mapProjection;
    }

    /**
     * @readonly
     * @property {undefined} projection - this property is undefined for synced renderers to prevent access to and manipulation of
     *                                    the owning map projection's underlying projection function.
     * @type {undefined}
     */
    get projection() {
        return undefined;
    }

    /**
     * @readonly
     * @property {LatLong} center - the center of the projection used by this renderer.
     * @type {LatLong}
     */
    get center() {
        return this.mapProjection.center;
    }

    set center(center) {
    }

    /**
     * @readonly
     * @property {WT_GVector2} translate - the translation of the projection used by this renderer. This determines where the center
     *                                     of the projection is projected onto the viewing plane.
     * @type {WT_GVector2}
     */
    get translate() {
        return new WT_GVector2(this.mapProjection.viewWidth / 2, this.mapProjection.viewHeight / 2);
    }

    set translate(factor) {
    }

    /**
     * @readonly
     * @property {Number} scale - the nominal scale of the projection used by this renderer. A nominal scale of 1 indicates that
     *                            a pre-projected distance of 1 great-arc radian (i.e. the radius of the Earth) will be projected
     *                            to a distance of 1 pixel in the viewing window assuming an underlying scale factor of 1.
     * @type {Number}
     */
    get scale() {
        return this.mapProjection.scale;
    }

    set scale(factor) {
    }

    /**
     * @readonly
     * @property {Number} rotation - the post-projection rotation, in degrees, used by this renderer. Positive deviation indicates
     *                               clockwise rotation.
     * @type {Number}
     */
    get rotation() {
        return this.mapProjection.rotation;
    }

    set rotation(angle) {
    }

    /**
     * @readonly
     * @property {Number} precision - the Douglas-Peucker distance used for adaptive resampling.
     * @type {Number}
     */
    get precision() {
        return this.mapProjection.precision;
    }

    set precision(value) {
    }

    /**
     * @readonly
     * @property {WT_GVector2[]} viewClipExtent - the post-projection clipping bounds used by this renderer. A null value indicates no
     *                                            clipping will be done.
     * @type {WT_GVector2[]}
     */
    get viewClipExtent() {
        return [
            new WT_GVector2(0, 0),
            new WT_GVector2(this.mapProjection.viewWidth, this.mapProjection.viewHeight)
        ];
    }

    set viewClipExtent(bounds) {
    }

    /**
     * Projects spherical coordinates (lat/long) onto the viewing window.
     * @param {Number[]|{lat:Number, long:Number}} point - the [long, lat] pair or lat/long object defining the coordinates to project. The
     *                                                     type of object passed to this argument determines the type of object returned
     *                                                     by this method; [long, lat] results in a [x, y] pair and lat/long object results
     *                                                     in a WT_GVector object.
     * @param {Number[]|WT_GVector2} [reference] - a [x, y] pair or WT_GVector2 in which to store the results. If this argument is not
     *                                             supplied, a new object of the appropriate type is created.
     * @returns {Number[]|WT_GVector2} a [x, y] pair or 2D vector representing the projected point, in pixel coordinates.
     */
    project(point, reference) {
        return this.mapProjection.project(point, reference);
    }

    /**
     * Applies this projection's inverse to coordinates in the viewing window to get the corresponding point in spherical coordinates.
     * @param {Number[]|{x:Number, y:Number}} point - the [x, y] pair or 2D vector, in pixel coordinates, to invert. The type of object
     *                                                passed to this argument determines the type of object returned by this method;
     *                                                [x, y] results in a [long, lat] pair and 2D vector object results in a LatLong object.
     * @param {Number[]} [reference] - a [long, lat] pair to which to store the results. This argument is ignored if a 2D vector is passed
     *                                 to the point argument. If this argument is not supplied, a new [long, lat] pair is created.
     * @returns {Number[]|LatLong} a [long, lat] pair or lat/long object representing the location whose projection equals the inverted point.
     */
    invert(point, reference) {
        return this.mapProjection.invert(point, reference);
    }
}