/**
 * A label for an airway segment. The label can be placed at an arbitrary point along the path of the segment.
 */
class WT_MapViewAirwaySegmentLabel extends WT_MapViewSimpleTextLabel {
    /**
     * @param {WT_Airway} airway - the airway for which to create the new label.
     * @param {WT_ICAOWaypoint[]} segment - the airway segment for which to create the new label. This should be an array of size 2, with
     *                                      index 0 containing the waypoint defining the beginning of the segment, and index 1 containing
     *                                      the waypoint defining the end of the segment.
     * @param {Number} pathPosition - a number between 0 and 1 representing the position along the path of the segment at which the new
     *                                label should be placed. A value of 0 represents the beginning of the segment, and a value of 1
     *                                represents the end of the segment.
     * @param {String} text - the text content of the new label.
     * @param {Number} priority - the priority for the new label.
     */
    constructor(airway, segment, pathPosition, text, priority) {
        super(text, priority);
        this._airway = airway;
        let interpFunc = d3.geoInterpolate(WT_MapProjection.latLongGameToProjection(segment[0].location), WT_MapProjection.latLongGameToProjection(segment[1].location));
        this._geoPosition = WT_MapProjection.latLongProjectionToGame(interpFunc(pathPosition));

        this._anchor.set(0.5, 0.5);
    }

    /**
     * @readonly
     * @property {WT_Airway} airway - the airway to which this label belongs.
     * @type {WT_Airway}
     */
    get airway() {
        return this._airway;
    }

    /**
     * @param {WT_MapViewState} state
     */
    update(state) {
        state.projection.project(this._geoPosition, this._position);

        super.update(state);
    }

    /**
     * Creates a new label for an airway segment.
     * @param {WT_Airway} airway - the airway for which to create a label.
     * @param {WT_ICAOWaypoint[]} segment - the airway segment for which to create the new label. This should be an array of size 2, with
     *                                      index 0 containing the waypoint defining the beginning of the segment, and index 1 containing
     *                                      the waypoint defining the end of the segment.
     * @param {Number} pathPosition - a number between 0 and 1 representing the position along the path of the segment at which the new
     *                                label should be placed. A value of 0 represents the beginning of the segment, and a value of 1
     *                                represents the end of the segment.
     * @param {Number} priority - the priority for the new label.
     * @returns {WT_MapViewAirwaySegmentLabel} an airway segment label.
     */
    static createFromAirwaySegment(airway, segment, pathPosition, priority) {
        return new WT_MapViewAirwaySegmentLabel(airway, segment, pathPosition, airway.name, priority);
    }
}

/**
 * A cache for airway segment labels.
 */
class WT_MapViewAirwaySegmentLabelCache {
    /**
     * @param {Number} size - the size of the new cache.
     */
    constructor(size) {
        this._cache = new Map();
        this._size = size;
    }

    /**
     * Retrieves a label from the cache for an airway segment. If one cannot be found in the cache, a new label is added to the cache and
     * returned.
     * @param {WT_Airway} airway - the airway for which to create a label.
     * @param {WT_ICAOWaypoint[]} segment - the airway segment for which to create the new label. This should be an array of size 2, with
     *                                      index 0 containing the waypoint defining the beginning of the segment, and index 1 containing
     *                                      the waypoint defining the end of the segment.
     * @param {Number} pathPosition - a number between 0 and 1 representing the position along the path of the segment at which the new
     *                                label should be placed. A value of 0 represents the beginning of the segment, and a value of 1
     *                                represents the end of the segment.
     * @param {Number} priority - the priority for the new label.
     * @returns {WT_MapViewAirwaySegmentLabel} an airway segment label.
     */
    getLabel(airway, segment, pathPosition, priority) {
        let key = `${airway.name}: ${segment[0].icao} - ${segment[1].icao}`;
        let existing = this._cache.get(key);
        if (!existing) {
            existing = WT_MapViewAirwaySegmentLabel.createFromAirwaySegment(airway, segment, pathPosition, priority);
            this._cache.set(key, existing);
            if (this._cache.size > this._size) {
                this._cache.delete(this._cache.keys().next().value);
            }
        }
        return existing;
    }
}