/**
 * A text label for a waypoint.
 */
class WT_MapViewWaypointLabel extends WT_MapViewSimpleTextLabel {
    /**
     * @param {WT_Waypoint} waypoint - the waypoint for which to create the new label.
     * @param {String} text - the text content of the new label.
     * @param {Number} priority - the priority for the new label.
     * @param {Boolean} alwaysShow - whether to force the new label to be shown, even when it would otherwise culled.
     */
    constructor(waypoint, text, priority, alwaysShow = false) {
        super(text, priority, alwaysShow);
        this._waypoint = waypoint;
        this._offset = new WT_GVector2(0, 0);

        this._anchor.set(0.5, 0.5);

        this._optsManager.addOptions(WT_MapViewWaypointLabel.OPTIONS_DEF);
    }

    /**
     * @readonly
     * @property {WT_Waypoint} waypoint - the waypoint to which this label belongs.
     * @type {WT_Waypoint}
     */
    get waypoint() {
        return this._waypoint;
    }

    /**
     * @property {WT_GVector2} offset - the offset, in pixel coordinates, of this label from the projected location of its waypoint.
     * @type {WT_GVector2}
     */
    get offset() {
        return this._offset.readonly();
    }

    set offset(value) {
        this._offset.set(value);
    }

    /**
     * @param {WT_MapViewState} state
     */
    update(state) {
        state.projection.project(this.waypoint.location, this._position);
        this._position.add(this.offset.x * state.dpiScale, this.offset.y * state.dpiScale);

        super.update(state);
    }
}
WT_MapViewWaypointLabel.OPTIONS_DEF = {
    offset: {}
};

/**
 * A factory for waypoint labels.
 * @abstract
 */
class WT_MapViewWaypointLabelFactory {
    /**
     * Gets a label for a waypoint.
     * @param {WT_Waypoint} waypoint - the waypoint for which to get a label.
     * @param {Number} priority - the priority of the label.
     * @param {Boolean} [alwaysShow] - whether to force the label to be shown, even when it would otherwise culled. False by default.
     * @returns {WT_MapViewWaypointLabel} a label for the waypoint.
     */
    getLabel(waypoint, priority, alwaysShow = false) {
        return null;
    }
}

/**
 * A factory for waypoint labels whose text value is equal to the waypoint's ident string.
 */
class WT_MapViewWaypointIdentLabelFactory extends WT_MapViewWaypointLabelFactory {
    /**
     * Gets a label for a waypoint.
     * @param {WT_Waypoint} waypoint - the waypoint for which to get a label.
     * @param {Number} priority - the priority of the label.
     * @param {Boolean} [alwaysShow] - whether to force the label to be shown, even when it would otherwise culled. False by default.
     * @returns {WT_MapViewWaypointLabel} a label for the waypoint.
     */
    getLabel(waypoint, priority, alwaysShow = false) {
        return new WT_MapViewWaypointLabel(waypoint, waypoint.ident, priority, alwaysShow);
    }
}

/**
 * A factory for waypoint labels whose text value is equal to the waypoint's ident string. This factory caches labels for re-use after they
 * have been created.
 */
class WT_MapViewWaypointIdentLabelCachedFactory extends WT_MapViewWaypointIdentLabelFactory {
    /**
     * @param {Number} size - the size of the new factory's cache.
     */
    constructor(size) {
        super();

        this._cache = new Map();
        this._size = size;
    }

    /**
     * Retrieves a label from the cache for a waypoint. If one cannot be found in the cache, a new label is added to the cache and
     * returned.
     * @param {WT_Waypoint} waypoint - the waypoint for which to get a label.
     * @param {Number} priority - the priority for the label, if a new one has to be created.
     * @param {Boolean} [alwaysShow] - whether to force the label to be shown, even when it would otherwise culled. False by default.
     * @returns {WT_MapViewWaypointLabel} a label for the waypoint.
     */
    getLabel(waypoint, priority, alwaysShow = false) {
        let existing = this._cache.get(waypoint.uniqueID);
        if (!existing) {
            existing = super.getLabel(waypoint, priority, alwaysShow);
            this._cache.set(waypoint.uniqueID, existing);
            if (this._cache.size > this._size) {
                this._cache.delete(this._cache.keys().next().value);
            }
        }
        return existing;
    }
}