/**
 * Handler for map pointer cross-instrument events. When an event is fired from an event handler, listeners
 * registered to every event handler associated with the same map ID across all instruments will be notified of the
 * event.
 */
class WT_G3x5_NavMapPointerEventHandler {
    /**
     * @param {String} mapID - the ID of the map associated with the new event handler.
     */
    constructor(mapID) {
        this._mapID = mapID;
        this._keyRoot = `${WT_G3x5_NavMapPointerEventHandler.EVENT_KEY_PREFIX}_${mapID}`;

        /**
         * @type {((source:WT_G3x5_NavMapPointerEventHandler, event:WT_G3x5_NavMapPointerEvent) => void)[]}
         */
        this._listeners = [];

        this._initCrossInstrumentEventListeners();
    }

    _initCrossInstrumentEventListeners() {
        Object.values(WT_G3x5_NavMapPointerEventHandler.EventType).forEach(eventType => {
            WT_CrossInstrumentEvent.addListener(this._getEventKey(eventType), this._onCrossInstrumentEvent.bind(this, eventType));
        });
    }

    /**
     * The ID of the map associated with this event handler.
     * @readonly
     * @type {String}
     */
    get mapID() {
        return this._mapID;
    }

    _notifyListeners(event) {
        this._listeners.forEach(listener => listener(this, event), this);
    }

    _parseScrollEvent(data) {
        let [x, y] = data.split(",").map(component => parseFloat(component));
        let event = {
            type: WT_G3x5_NavMapPointerEventHandler.EventType.SCROLL,
            delta: new WT_GVector2(x, y).readonly()
        }
        this._notifyListeners(event);
    }

    _onCrossInstrumentEvent(eventType, key, data) {
        switch (eventType) {
            case WT_G3x5_NavMapPointerEventHandler.EventType.SCROLL:
                this._parseScrollEvent(data);
                break;
        }
    }

    /**
     *
     * @param {WT_G3x5_NavMapPointerEventHandler.EventType} eventType
     * @returns {String}
     */
    _getEventKey(eventType) {
        return `${this._keyRoot}_${WT_G3x5_NavMapPointerEventHandler.EVENT_KEY_SUFFIXES[eventType]}`;
    }

    _fireEvent(eventType, data) {
        WT_CrossInstrumentEvent.fireEvent(this._getEventKey(eventType), data);
    }

    /**
     * Fires a scroll event from this event handler.
     * @param {WT_GVector2} delta - the scroll vector.
     */
    fireScrollEvent(delta) {
        this._fireEvent(WT_G3x5_NavMapPointerEventHandler.EventType.SCROLL, `${delta.x},${delta.y}`)
    }

    /**
     * Add a listener to this event handler. The listener function will be called every time an event is fired.
     * @param {(source:WT_G3x5_NavMapPointerEventHandler, event:WT_G3x5_NavMapPointerEvent) => void} listener - the listener to add.
     */
    addListener(listener) {
        this._listeners.push(listener);
    }

    /**
     * Removes a previously added listener from this event handler.
     * @param {(source:WT_G3x5_NavMapPointerEventHandler, event:WT_G3x5_NavMapPointerEvent) => void} listener - the listener to remove.
     */
    removeListener(listener) {
        let index = this._listeners.indexOf(listener);
        if (index >= 0) {
            this._listeners.splice(index, 1);
        }
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_NavMapPointerEventHandler.EventType = {
    SCROLL: 0
};
WT_G3x5_NavMapPointerEventHandler.EVENT_KEY_PREFIX = "WT_MapPointer";
WT_G3x5_NavMapPointerEventHandler.EVENT_KEY_SUFFIXES = [
    "Scroll"
];

/**
 * @typedef WT_G3x5_NavMapPointerEvent
 * @property {WT_G3x5_NavMapPointerEventHandler.EventType} type - the type of this event.
 */