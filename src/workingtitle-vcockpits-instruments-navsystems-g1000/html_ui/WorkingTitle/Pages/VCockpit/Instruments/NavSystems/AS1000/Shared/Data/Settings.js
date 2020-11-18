class WT_Default_Settings {
}

WT_Default_Settings.base = {
    weight: "kg",
    dis_spd: "nautical",
    alt_vs: "feet",
    temperature: "farenheit",
    weight: "lb",
    mfd_watched_0: "GS",
    mfd_watched_1: "DTK",
    mfd_watched_2: "TRK",
    mfd_watched_3: "ETE",
    time_offset: 0,
    time_mode: "0",
    vfr_xpdr: 1200,
    nearest_runway_surface: "Hard/Soft",
    nearest_runway_min_length: 0,
};

WT_Default_Settings.modBase = {
    range_knob: "Zoom",
    navigation_knob: "Normal",
    font_family: "default",
    font_size: "normal",
    scroll_wrap: "disabled",
    vfr_xpdr: 1200
}

class WT_Settings {
    constructor(namespace, defaults) {
        this.namespace = namespace;
        this.defaults = defaults;
        this.settings = {};
        this.listeners = [];

        WTDataStore.addListener((key, value) => {
            if (value === null) {
                delete this.settings[key];
            } else {
                this.settings[key] = value;
            }
            this.onValueChanged(key, this.getValue(key));
        }, this.storagePrefix);

        this.load();
    }
    get storagePrefix() {
        return `${this.namespace}.`;
    }
    getValueFromStore(key) {
        if (WTDataStore.has(this.getStorageKey(key))) {
            return WTDataStore.get(this.getStorageKey(key), this.defaults[key]);
        }
        return undefined;
    }
    getValue(key) {
        if (key in this.settings) {
            return this.settings[key];
        } else if (key in this.defaults) {
            return this.defaults[key];
        } else {
            return null;
        }
    }
    setValue(key, value) {
        if (this.settings[key] != value) {
            this.settings[key] = value;
            this.onValueChanged(key, value);
            WTDataStore.set(this.getStorageKey(key), value);
        }
    }
    getStorageKey(key) {
        return `${this.storagePrefix}${key}`;
    }
    reset() {
        this.settings = {};
        for (let key in this.defaults) {
            WTDataStore.remove(this.getStorageKey(key));
            this.onValueChanged(key, this.defaults[key]);
        }
    }
    save() {
    }
    load() {
        this.settings = {};
        for (let key in this.defaults) {
            const value = this.getValueFromStore(key);
            if (value) {
                this.settings[key] = value;
                this.onValueChanged(key, value);
            }
        }
    }
    onValueChanged(name, value) {
        for (let listener of this.listeners) {
            if (listener.pattern == name) {
                listener.listener(value);
            }
        }
    }
    update() {
    }
    addListener(listener, pattern) {
        this.listeners.push({
            pattern: pattern,
            listener: listener
        });
    }
}