Include.addScript("/JS/dataStorage.js"); // it's required, so why not load it ourselves?

/** class WTDataStore provides an interface to the lower-level storage API */
class WTDataStore {
    static getStoreKey(key = "") {
        return `${SimVar.GetSimVarValue("ATC MODEL", "string")}.${key}`;
    }

    /**
     * Returns whether the datastore has an entry for the supplied key
     * @param {string} key 
     * @returns {boolean}
     */
    static has(key) {
        const storeKey = WTDataStore.getStoreKey(key);
        try {
            GetStoredData(storeKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Retrieves a key from the datastore, possibly returning the default value
     * @param {string} key The name of the key to retrieve
     * @param {string|number|boolean} defaultValue The default value to use if the key does not exist
     * @returns {string|number|boolean} Either the stored value of the key, or the default value
     */
    static get(key, defaultValue) {
        const storeKey = WTDataStore.getStoreKey(key);
        try {
            const defaultType = typeof defaultValue;
            const stringValue = GetStoredData(storeKey);
            const value = JSON.parse(stringValue);
            const valueType = typeof value;
            if (defaultValue == undefined || defaultType == valueType)
                return value;
            return defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }

    /**
     * Returns all data stored
     */
    static getAll() {
        const storeKey = WTDataStore.getStoreKey();
        const data = {};
        try {
            const storage = GetDataStorage();
            if (storage) {
                const values = storage.searchData(storeKey).sort((a, b) => a.key.localeCompare(b.key));
                for (let i = 0; i < values.length; i++) {
                    data[values[i].key.substr(storeKey.length)] = JSON.parse(values[i].data);
                }
                return data;
            }
        } catch (error) {
            return null;
        }
        return null;
    }

    /**
     * Stores a key in the datastore
     * @param {string} key The name of the value to store
     * @param {string|number|boolean} value The value to store
     */
    static set(key, value) {
        const storeKey = WTDataStore.getStoreKey(key);
        const stringValue = JSON.stringify(value);
        SetStoredData(storeKey, stringValue);
        window.localStorage.setItem(`WTDataStore.${storeKey}`, JSON.stringify(value));
        return value;
    }

    /**
     * Removes a key from the data store
     * @param {string} key 
     */
    static remove(key) {
        const storeKey = WTDataStore.getStoreKey(key);
        DeleteStoredData(storeKey);
        window.localStorage.removeItem(`WTDataStore.${storeKey}`);
    }

    /**
     * Removes all stored data
     */
    static removeAll() {
        const keys = Object.keys(WTDataStore.getAll());
        for (let key of keys) {
            WTDataStore.remove(key);
        }
    }

    /**
     * Adds a listener to be called when a data store value is updated on another instrument
     * The listener is called with (key, value, previousValue) as arguments
     * @param {function} listener 
     * @param {string|null} prefix 
     */
    static addListener(listener, prefix = null) {
        const windowListener = event => {
            let storagePrefix = `WTDataStore.${WTDataStore.getStoreKey()}${prefix ? prefix : ""}`;
            if (event.key.startsWith(storagePrefix)) {
                listener(event.key.substr(storagePrefix.length), JSON.parse(event.newValue), JSON.parse(event.oldValue));
            }
        };
        window.addEventListener("storage", windowListener);
        return windowListener;
    }

    /**
     * Remove a previously added listener
     * @param {function} listener 
     */
    static removeListener(listener) {
        window.removeEventListener("storage", listener);
    }

    /**
     * Observe using RXJS
     * @param {string} prefix 
     * @returns {rxjs.Observable}
     */
    static observe(prefix) {
        const obs = new rxjs.Subject();
        const listener = (key, value, previous) => obs.next([key, value, previous]);
        WTDataStore.addListener(listener, prefix);
        return obs.pipe(
            rxjs.operators.finalize(() => WTDataStore.removeListener(listener))
        );
    }
}
WTDataStore.listeners = [];