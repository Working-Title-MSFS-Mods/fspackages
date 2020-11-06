class WT_Set_Minimums_Model {
    /**
     * @param {WT_Minimums} minimums 
     */
    constructor(minimums) {
        this.minimums = minimums;
    }
    setAltitude(altitude) {
        this.minimums.setAltitude(altitude);
    }
    changeMode(mode) {
        this.minimums.setMode(mode);
    }
}

class WT_Set_Minimums_View extends WT_HTML_View {
    /**
     * @param {WT_Set_Minimums_Model} model 
     */
    setModel(model) {
        this.model = model;
        const modes = {
            "BARO MIN": "Baro",
            "RA MIN": "Radar"
        };
        model.minimums.mode.subscribe(mode => {
            if (mode === null) {
                this.elements.mode.value = "Off";
            } else {
                this.elements.mode.value = modes[mode];
            }
        });
        model.minimums.value.subscribe(altitude => {
            console.log(altitude);
            this.elements.altitude.value = altitude;
        });
        model.minimums.modes.subscribe(modes => {
            this.elements.mode.setValues(modes.map(mode => {
                switch(mode) {
                    case 0: return "Off";
                    case 1: return "Baro";
                    case 2: return "Comp";
                    case 3: return "Radar";
                }
            }));
        });
    }
    setAltitude(altitude) {
        this.model.setAltitude(altitude);
    }
    changeMode(mode) {
        const modes = {
            "Off": 0,
            "Baro": 1,
            "Radar": 3
        };
        this.model.changeMode(modes[mode]);
    }
}
customElements.define("g1000-pfd-minimums", WT_Set_Minimums_View);