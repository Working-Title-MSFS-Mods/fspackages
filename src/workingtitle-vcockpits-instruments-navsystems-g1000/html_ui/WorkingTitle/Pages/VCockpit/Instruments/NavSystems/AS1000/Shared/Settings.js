class AS1000_Default_Settings {
}

AS1000_Default_Settings.base = {
    weight: "kg",
    dis_spd: "metric",
    alt_vs: "feet",
    temperature: "farenheit",
    weight: "lb",
    mfd_watched_0: "GS",
    mfd_watched_1: "DTK",
    mfd_watched_2: "TRK",
    mfd_watched_3: "ETE",
};

class AS1000_Settings {
    constructor(aircraft, defaults) {
        this.aircraft = aircraft;
        this.defaults = defaults;
        this.settings = {};
        this.lastUpdated = 0;

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
        this.settings[key] = value;
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
            this.settings = JSON.parse(storedData);
            this.lastUpdated = parseInt(GetStoredData(this.getTimestampKey()));
        }
    }
    update() {
        let lastUpdated = parseInt(GetStoredData(this.getTimestampKey()));
        if (lastUpdated && lastUpdated > this.lastUpdated) {
            console.log("Updating settings");
            this.load();
        }
    }
}