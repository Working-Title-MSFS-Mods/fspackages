class UnitChooserException extends Error {

}

class UnitChooserInvalidSettingException extends UnitChooserException {
    constructor(setting, type) {
        this.message = `${setting} was not a valid setting for ${type}`;
    }
}

class UnitChooser {
    /**
     * @param {AS1000_Settings} settings 
     */
    constructor(settings) {
        this.settings = settings;
    }
    chooseDistance(metric, nautical) {
        let setting = this.settings.getValue("dis_spd");
        switch(setting) {
            case "metric":
                return metric;
            case "nautical":
                return nautical;
        }
        throw new UnitChooserInvalidSettingException(setting, "distance or speed");
    }
    chooseSpeed(metric, nautical) {
        return this.chooseDistance(metric, nautical);
    }
    chooseAltitude(feet, metres) {
        let setting = this.settings.getValue("alt_vs");
        switch(setting) {
            case "feet":
                return feet;
            case "metres":
                return metres;
        }
        throw new UnitChooserInvalidSettingException(setting, "altitude or vertical speed");
    }
    chooseVerticalSpeed(feet, metres) {
        return this.chooseAltitude(feet, metres);
    }
    chooseTemperature(celsius, farenheit) {
        let setting = this.settings.getValue("temperature");
        switch(setting) {
            case "celsius":
                return celsius;
            case "farenheit":
                return farenheit;
        }
        throw new UnitChooserInvalidSettingException(setting, "temperature");  
    }
    chooseWeight(pounds, kilos) {
        let setting = this.settings.getValue("weight");
        switch(setting) {
            case "pounds":
                return pounds;
            case "kilos":
                return kilos;
        }
        throw new UnitChooserInvalidSettingException(setting, "weight");  
    }
}