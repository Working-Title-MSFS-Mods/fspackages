/**
 * A utility class for sending events across instruments.
 */
class WT_CrossInstrumentEvent {
    static _getPrefix(key) {
        return `WT_CrossInstrumentEvent.${key}`;
    }

    /**
     * Adds a listener to be called when an event is fired with a specified key.
     * @param {String} key - the key of the events to which the listener will respond.
     * @param {(key:String, data:String) => void} listener - the listener.
     */
    static addListener(key, listener) {
        let storagePrefix = WT_CrossInstrumentEvent._getPrefix(key);
        const storageListener = event => {
            if (event.key === storagePrefix) {
                let data = event.newValue.substring(10);
                listener(key, data);
            }
        };
        window.addEventListener("storage", storageListener);

        let listeners = WT_CrossInstrumentEvent._listeners.get(key);
        if (!listeners) {
            listeners = [];
            WT_CrossInstrumentEvent._listeners.set(key, listeners);
        }
        listeners.push({storageListener: storageListener, listener: listener});
    }

    /**
     * Remove a previously added listener.
     * @param {String} key - the event key to which the listener is registered.
     * @param {(key:String, data:String) => void} listener - the listener to remove.
     */
    static removeListener(key, listener) {
        let listeners = WT_CrossInstrumentEvent._listeners.get(key);
        if (!listeners) {
            return;
        }

        let index = listeners.findIndex(entry => entry.listener === listener);
        if (index < 0) {
            return;
        }

        window.removeEventListener("storage", listeners[index].storageListener);
        listeners.splice(index, 1);
    }

    static _notifyListeners(key, data) {
        let listeners = WT_CrossInstrumentEvent._listeners.get(key);
        if (!listeners) {
            return;
        }

        listeners.forEach(entry => {
            entry.listener(key, data);
        });
    }

    /**
     * Fires an event.
     * @param {String} key - the key of the event.
     * @param {String} data - data to send with the event. The data will be passed as an argument to event listeners.
     */
    static fireEvent(key, data) {
        let storagePrefix = WT_CrossInstrumentEvent._getPrefix(key);
        let item = window.localStorage.getItem(storagePrefix);
        let id = 0;
        if (item) {
            id = parseInt(item.substring(0, 10));
            if (isNaN(id)) {
                id = 0;
            }
        }
        id = (id + 1) % 1e10;
        window.localStorage.setItem(storagePrefix, `${(id).toFixed(0).padStart(10, "0")}${data}`);
        WT_CrossInstrumentEvent._notifyListeners(key, data);
    }
}
/**
 * @type {Map<String,WT_CrossInstrumentListenerEntry[]>}
 */
WT_CrossInstrumentEvent._listeners = new Map();

/**
 * @typedef WT_CrossInstrumentListenerEntry
 * @property {(event:StorageEvent) => void} storageListener
 * @property {(key:String, data:String) => void} listener
 */