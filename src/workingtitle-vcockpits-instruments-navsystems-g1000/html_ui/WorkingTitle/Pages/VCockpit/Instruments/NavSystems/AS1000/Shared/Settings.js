class WT_Default_Settings {
}

WT_Default_Settings.base = {
    weight: "kg",
    dis_spd: "metric",
    alt_vs: "feet",
    temperature: "farenheit",
    weight: "lb",
    mfd_watched_0: "GS",
    mfd_watched_1: "DTK",
    mfd_watched_2: "TRK",
    mfd_watched_3: "ETE",
    time_offset: 0,
    time_mode: 0,
    vfr_xpdr: 1200,
};

WT_Default_Settings.modBase = {
    range_knob: "Range",
    navigation_knob: "Default",
    font_family: "default",
    font_size: "normal",
    scroll_wrap: "disabled",
    vfr_xpdr: 1200
}

class WT_Settings {
    constructor(aircraft, defaults) {
        this.aircraft = aircraft;
        this.defaults = defaults;
        this.settings = {};
        this.lastUpdated = 0;
        this.listeners = [];

        this.load();
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
        }
    }
    getStorageKey() {
        return "config_" + this.aircraft;
    }
    getTimestampKey() {
        return "config_timestamp_" + this.aircraft;
    }
    save() {
        let json = JSON.stringify(this.settings);
        this.lastUpdated = (new Date()).getTime();
        SetStoredData(this.getStorageKey(), json);
        SetStoredData(this.getTimestampKey(), this.lastUpdated.toString());
        console.log("Saving settings " + this.lastUpdated);
    }
    load() {
        let storedData = GetStoredData(this.getStorageKey());
        if (storedData) {
            let settings = JSON.parse(storedData);
            /*for (let name of settings) {
                let value = settings[name];
                if (this.settings[name] != value) {
                    this.onValueChanged(name, value);
                }
            }*/
            this.settings = settings;
            console.log("Loaded settings:");
            this.lastUpdated = parseInt(GetStoredData(this.getTimestampKey()));
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
        let lastUpdated = parseInt(GetStoredData(this.getTimestampKey()));
        if (lastUpdated && lastUpdated > this.lastUpdated) {
            console.log("Updating settings");
            this.load();
        }
    }
    addListener(listener, pattern) {
        this.listeners.push({
            patter: pattern,
            listener: listener
        });
    }
}