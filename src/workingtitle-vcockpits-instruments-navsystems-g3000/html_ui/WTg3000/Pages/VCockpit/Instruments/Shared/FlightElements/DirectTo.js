class WT_DirectTo {
    constructor() {
        this._origin = null;
        this._destination = null;
        this._isActive = false;

        this._listeners = [];
    }

    /**
     * @returns {WT_Waypoint}
     */
    getOrigin() {
        return this._origin;
    }

    /**
     * @returns {WT_Waypoint}
     */
    getDestination() {
        return this._destination;
    }

    isActive() {
        return this._isActive;
    }

    _activate(point, eventData) {
        if (this.isActive() && this._origin.location.equals(point)) {
            return;
        }

        this._origin = new WT_CustomWaypoint("DRCT-ORIGIN", point);
        this._isActive = true;
        eventData.types = eventData.types | WT_DirectToEvent.Type.ACTIVATED;
        eventData.origin = this._origin;
    }

    _deactivate(eventData) {
        if (!this.isActive()) {
            return;
        }

        this._isActive = false;
        eventData.types = eventData.types | WT_DirectToEvent.Type.DEACTIVATED;
    }

    _changeDestination(waypoint, eventData) {
        if ((!this._destination && !waypoint) || (this._destination && waypoint && this._destination.uniqueID === waypoint.uniqueID)) {
            return;
        }

        eventData.types = eventData.types | WT_DirectToEvent.Type.DESTINATION_CHANGED;
        eventData.oldDestination = this._destination;
        eventData.newDestination = waypoint;
        this._destination = waypoint;
    }

    /**
     *
     * @param {WT_GeoPoint} point
     */
    activate(point) {
        if (point) {
            let eventData = {types: 0};
            this._activate(point, eventData);
            this._fireEvent(eventData);
        }
    }

    deactivate() {
        let eventData = {types: 0};
        this._deactivate(eventData);
        this._fireEvent(eventData);
    }

    /**
     *
     * @param {WT_Waypoint} waypoint
     */
    setDestination(waypoint) {
        let eventData = {types: 0};
        if (!waypoint && this.isActive()) {
            this._deactivate(eventData);
        }

        this._changeDestination(waypoint, eventData);
        this._fireEvent(eventData);
    }

    _fireEvent(eventData) {
        if (eventData.types === 0) {
            return;
        }

        let event = new WT_DirectToEvent(this, eventData);
        for (let listener of this._listeners) {
            listener(event);
        }
    }

    addListener(listener) {
        this._listeners.push(listener);
    }

    removeListener(listener) {
        let index = this._listeners.indexOf(listener);
        if (index >= 0) {
            this._listeners.splice(index, 1);
        }
    }

    clearListeners() {
        this._listeners = [];
    }
}

class WT_DirectToEvent {
    constructor(directTo, data) {
        this._directTo = directTo;
        this._data = data;
    }

    /**
     * @readonly
     * @property {WT_DirectTo} directTo
     * @type {WT_DirectTo}
     */
    get directTo() {
        return this._directTo;
    }

    /**
     * @readonly
     * @property {Number} types
     * @type {Number}
     */
    get types() {
        return this._data.types;
    }

    anyType(type) {
        return (this.types & type) !== 0;
    }

    allTypes(type) {
        return (this.types & type) === type;
    }

    get origin() {
        return this._data.origin;
    }

    get oldDestination() {
        return this._data.oldDestination;
    }

    get newDestination() {
        return this._data.newDestination;
    }
}
/**
 * @enum {Number}
 */
WT_DirectToEvent.Type = {
    DESTINATION_CHANGED: 1,
    ACTIVATED: 1 << 1,
    DEACTIVATED: 1 << 2
};