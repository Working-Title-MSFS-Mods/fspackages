class AS1000_Local_Time_Model {
    /**
     * @param {AS1000_Settings} settings 
     */
    constructor(settings) {
        this.settings = settings;
        this.time = new Subject();
        this.mode = new Subject();
        this.zuluTime = new Subject();
    }
    getMode() {
        return this.settings.getValue("time_mode");
    }
    getTime(mode) {
        let offset = this.settings.getValue("time_offset");
        switch (mode) {
            // Local 12HR
            case 0: {
                let value = SimVar.GetGlobalVarValue("LOCAL TIME", "seconds");
                if (value) {
                    let seconds = (Number.parseInt(value) + offset + 86400) % 86400;
                    let meridiem = "<span class='meridiem'>am</span>";
                    if (seconds > 86400 / 2) {
                        meridiem = "<span class='meridiem'>pm</span>";
                        seconds -= 86400 / 2;
                    }
                    let time = Utils.SecondsToDisplayTime(seconds, true, true, false);
                    return time + meridiem;
                }
            }

            // Local 24HR
            case 1: {
                let value = SimVar.GetGlobalVarValue("LOCAL TIME", "seconds");
                if (value) {
                    let seconds = (Number.parseInt(value) + offset + 86400) % 86400;
                    let time = Utils.SecondsToDisplayTime(seconds, true, true, false);
                    return time;
                }
            }

            // ZULU / UTC
            case 2: {
                let value = SimVar.GetGlobalVarValue("E:ZULU TIME", "seconds");
                if (value) {
                    let seconds = (Number.parseInt(value) + offset + 86400) % 86400;
                    let time = Utils.SecondsToDisplayTime(seconds, true, true, false);
                    return time;
                }
            }
        }
    }
    update(dt) {
        let mode = this.getMode();
        this.mode.value = mode;
        this.time.value = this.getTime(mode);
    }
}

class AS1000_Local_Time_View extends AS1000_HTML_View {
    /**
     * @param {AS1000_Local_Time_Model} model 
     */
    setModel(model) {
        this.model = model;
        model.time.subscribe(time => this.elements.time.innerHTML = time);
        model.mode.subscribe(mode => this.elements.mode.textContent = this.modeToText(mode));
    }
    modeToText(mode) {
        switch (mode) {
            case 0:
            case 1:
                return "LCL";
            case 2:
                return "UTC";
        }
    }
}
customElements.define("g1000-local-time", AS1000_Local_Time_View);