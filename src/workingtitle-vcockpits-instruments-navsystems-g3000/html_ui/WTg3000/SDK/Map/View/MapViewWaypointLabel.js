/**
 * A text label for a waypoint.
 */
class WT_MapViewWaypointLabel extends WT_MapViewLocationTextLabel {
    /**
     * @param {WT_Waypoint} waypoint - the waypoint for which to create the new label.
     * @param {String} text - the text content of the new label.
     * @param {Number} priority - the priority for the new label.
     * @param {Boolean} alwaysShow - whether to force the new label to be shown, even when it would otherwise culled.
     */
    constructor(waypoint, text, priority, alwaysShow = false) {
        super(waypoint.location, text, priority, alwaysShow);

        this._waypoint = waypoint;
    }

    /**
     * The waypoint associated with this label.
     * @readonly
     * @type {WT_Waypoint}
     */
    get waypoint() {
        return this._waypoint;
    }
}

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