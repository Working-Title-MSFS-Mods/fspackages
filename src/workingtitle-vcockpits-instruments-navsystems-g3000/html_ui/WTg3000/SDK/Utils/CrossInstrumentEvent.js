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
     * @param {(key:String, data:*) => void} listener - the listener.
     */
    static addListener(key, listener) {
        const windowListener = event => {
            let storagePrefix = WT_CrossInstrumentEvent._getPrefix(key);
            if (event.key === storagePrefix) {
                listener(key, JSON.parse(event.newValue));
            }
        };
        window.addEventListener("storage", windowListener);
        WT_CrossInstrumentEvent._listeners.push({key: key, windowListener: windowListener, listener: listener});
    }

    /**
     * Remove a previously added listener.
     * @param {(key:String, data:*) => void} listener - the listener to remove.
     */
    static removeListener(listener) {
        let index = WT_CrossInstrumentEvent._listeners.findIndex(entry => entry.listener === listener);
        if (index < 0) {
            return;
        }

        window.removeEventListener("storage", WT_CrossInstrumentEvent._listeners[index].windowListener);
        WT_CrossInstrumentEvent._listeners.splice(index, 1);
    }

    static _notifyListeners(key, data) {
        WT_CrossInstrumentEvent._listeners.forEach(entry => {
            if (key === entry.key) {
                entry.listener(key, data);
            }
        });
    }

    /**
     * Fires an event.
     * @param {String} key - the key of the event.
     * @param {*} data - data to send with the event. The data will be passed as an argument to event listeners.
     */
    static fireEvent(key, data) {
        let storagePrefix = WT_CrossInstrumentEvent._getPrefix(key);
        window.localStorage.setItem(storagePrefix, JSON.stringify(data));
        WT_CrossInstrumentEvent._notifyListeners(key, data);
    }
}
WT_CrossInstrumentEvent._listeners = [];