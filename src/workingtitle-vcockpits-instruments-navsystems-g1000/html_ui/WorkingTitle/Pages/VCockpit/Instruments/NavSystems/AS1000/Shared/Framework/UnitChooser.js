class WT_Unit_Chooser_Exception extends Error {

}

class WT_Unit_Chooser_Invalid_Setting_Exception extends WT_Unit_Chooser_Exception {
    constructor(setting, type) {
        this.message = `${setting} was not a valid setting for ${type}`;
    }
}

class WT_Unit_Chooser {
    /**
     * @param {WT_Settings} settings 
     */
    constructor(settings) {
        this.settings = settings;
    }
    observeDistance(metric$, nautical$) {
        return this.settings.observe("dis_spd").pipe(
            rxjs.operators.switchMap(distance => {
                switch (distance) {
                    case "metric":
                        return metric$;
                    case "nautical":
                        return nautical$;
                }
            })
        );
    }
    chooseDistance(metric, nautical) {
        let setting = this.settings.getValue("dis_spd");
        switch (setting) {
            case "metric":
                return metric;
            case "nautical":
                return nautical;
        }
        throw new WT_Unit_Chooser_Invalid_Setting_Exception(setting, "distance or speed");
    }
    observeSpeed(metric$, nautical$) {
        return this.settings.observe("dis_spd").pipe(
            rxjs.operators.switchMap(speed => {
                switch (speed) {
                    case "metric":
                        return metric$;
                    case "nautical":
                        return nautical$;
                }
            })
        );
    }
    chooseSpeed(metric, nautical) {
        return this.chooseDistance(metric, nautical);
    }
    chooseAltitude(metres, feet) {
        let setting = this.settings.getValue("alt_vs");
        switch (setting) {
            case "feet":
                return feet;
            case "metres":
                return metres;
        }
        throw new WT_Unit_Chooser_Invalid_Setting_Exception(setting, "altitude or vertical speed");
    }
    chooseVerticalSpeed(feet, metres) {
        return this.chooseAltitude(feet, metres);
    }
    chooseTemperature(celsius, farenheit) {
        let setting = this.settings.getValue("temperature");
        switch (setting) {
            case "celsius":
                return celsius;
            case "farenheit":
                return farenheit;
        }
        throw new WT_Unit_Chooser_Invalid_Setting_Exception(setting, "temperature");
    }
    observeTemperature(celsius$, farenheit$) {
        return this.settings.observe("temperature").pipe(
            rxjs.operators.switchMap(setting => {
                switch (setting) {
                    case "celsius":
                        return celsius$;
                    case "farenheit":
                        return farenheit$;
                }
            })
        );
    }
    chooseWeight(pounds, kilos) {
        let setting = this.settings.getValue("weight");
        switch (setting) {
            case "pounds":
                return pounds;
            case "kilos":
                return kilos;
        }
        throw new WT_Unit_Chooser_Invalid_Setting_Exception(setting, "weight");
    }
}