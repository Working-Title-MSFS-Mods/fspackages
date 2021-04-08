class WT_Shared_Instrument_Data {
    constructor() {
    }
    get prefix() {
        return `WT_Instrument_Data`;
    }
    getLocalStorageKey(key) {
        return `${this.prefix}.${key}`;
    }
    set(key, data) {
        const localStorageKey = this.getLocalStorageKey(key);
        window.localStorage.setItem(localStorageKey, JSON.stringify(data));
    }
    get(key) {
        const localStorageKey = this.getLocalStorageKey(key);
        const result = window.localStorage.getItem(localStorageKey);
        if (result) {
            return JSON.parse(data);
        }
        return null;
    }
}