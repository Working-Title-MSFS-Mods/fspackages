Include.addScript("/JS/dataStorage.js"); // it's required, so why not load it ourselves?

/** class WTDataStore provides an interface to the lower-level storage API */
class WTDataStore {
    /**
     * Retrieves a key from the datastore, possibly returning the default value
     * @param {string} key The name of the key to retrieve
     * @param {tsring|number|boolean} defaultValue The default value to use if the key does not exist
     * @returns {string|number|boolean} Either the stored value of the key, or the default value
     */
    static get(key, defaultValue) {
        const storeKey = `${SimVar.GetSimVarValue("ATC MODEL", "string")}.${key}`;
        try {
            var stringValue = GetStoredData(storeKey);
            if (stringValue == null || stringValue == "") {
                return defaultValue;
            }
        } catch (e) {
            return defaultValue;
        }
        switch (typeof defaultValue) {
            case "string":
                return stringValue;
            case "number":
                return Number(stringValue);
            case "boolean":
                // Unfortunately, Boolean("false") is true.
                if (stringValue == "false") {
                    return false;
                }
                return true;
        }
        return defaultValue;
    }

    /**
     * Stores a key in the datastore
     * @param {string} key The name of the value to store
     * @param {string|number|boolean} The value to store
     */
    static set(key, value) {
        const storeKey = `${SimVar.GetSimVarValue("ATC MODEL", "string")}.${key}`;
        switch (typeof value) {
            case "string":
            case "number":
            case "boolean":
                SetStoredData(storeKey, value.toString());
        }
        return value;
    }

    /**
     * Removes a key from the data store
     * @param {string} key 
     */
    static remove(key) {
        const storeKey = `${SimVar.GetSimVarValue("ATC MODEL", "string")}.${key}`;
        DeleteStoredData(storeKey);
    }
}