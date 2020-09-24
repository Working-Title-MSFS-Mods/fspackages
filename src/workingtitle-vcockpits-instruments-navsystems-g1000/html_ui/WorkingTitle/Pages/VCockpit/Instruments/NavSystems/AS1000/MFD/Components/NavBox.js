class AS1000_MFD_Nav_Box_Model {
    /**
     * @param {UnitChooser} unitChooser 
     */
    constructor(pageTitle, unitChooser, settings) {
        this.pageTitle = pageTitle;
        this.unitChooser = unitChooser;
        this.settings = settings;
        this.groundSpeed = new Subject();
        this.desiredTrack = new Subject();
        this.currentTrack = new Subject();
        this.ete = new Subject();
        this.updateFrequency = 200; // Limits to 5 updates / second
        this.updateCounter = 0;
        this.watchedIds = [
            new Subject("GS"),
            new Subject("DTK"),
            new Subject("TRK"),
            new Subject("ETE"),
        ];
        this.watchedValues = [
            new Subject(""),
            new Subject(""),
            new Subject(""),
            new Subject(""),
        ];
    }
    secondsToDuration(seconds) {
        return Math.floor(seconds / 60) + ":" + (seconds % 60 < 10 ? "0" : "") + seconds % 60;
    }
    secondsToZulu(v) {
        let hours = Math.floor(v / 3600);
        let minutes = Math.floor((v % 3600) / 60);
        return `${hours}:${minutes}`;
    }
    getValue(id) {
        switch (id) {
            case "BRG": {
                return fastToFixed(SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree"), 0) + "°";
            }
            case "DIS": {
                if (SimVar.GetSimVarValue("GPS IS ACTIVE FLIGHT PLAN", "boolean")) {
                    let distance = this.unitChooser.chooseDistance(SimVar.GetSimVarValue("GPS WP DISTANCE", "kilometers"), SimVar.GetSimVarValue("GPS WP DISTANCE", "nautical miles"));
                    return distance.toFixed(distance < 10 ? 1 : 0) + this.unitChooser.chooseDistance("KM", "NM");
                } else {
                    this.unitChooser.chooseDistance("__._KM", "__._NM");
                }
            }
            case "DTK": {
                if (SimVar.GetSimVarValue("GPS IS ACTIVE FLIGHT PLAN", "boolean"))
                    return fastToFixed(SimVar.GetSimVarValue("GPS WP DESIRED TRACK", "degree"), 0) + "°";
                else
                    return "___°"
            }
            case "END": {
                break;
            }
            case "ESA": {
                break;
            }
            case "ETA": {
                if (SimVar.GetSimVarValue("GPS IS ACTIVE FLIGHT PLAN", "boolean")) {
                    let eta = SimVar.GetSimVarValue("GPS ETA", "seconds");
                    return this.secondsToZulu(eta);
                } else {
                    return "__:__";
                }
            }
            case "ETE": {
                if (SimVar.GetSimVarValue("GPS IS ACTIVE FLIGHT PLAN", "boolean")) {
                    let ete = SimVar.GetSimVarValue("GPS ETE", "seconds");
                    return this.secondsToDuration(ete);
                } else {
                    return "__:__";
                }
            }
            case "FOB": {
                return `${fastToFixed(SimVar.GetSimVarValue("FUEL TOTAL QUANTITY:1", "gallon"), 0)}<span class="small">gl</span>`;
            }
            case "FOD": {
                if (SimVar.GetSimVarValue("GPS IS ACTIVE FLIGHT PLAN", "boolean")) {
                    let ete = SimVar.GetSimVarValue("GPS ETE", "seconds");
                    let gph = SimVar.GetSimVarValue("ENG FUEL FLOW GPH:1", "gallons per hour");
                    let fob = SimVar.GetSimVarValue("FUEL TOTAL QUANTITY:1", "gallon");
                    let fod = Math.max(0, fob - gph * (ete / 3600));
                    return `${fastToFixed(fod, 1)}<span class="small">gl</span>`;
                } else {
                    return `____<span class="small">gl</span>`;
                }
                //	<Simvar name="ENG FUEL FLOW GPH:1" unit="gallons per hour"/>
                break;
            }
            case "GS": {
                return this.unitChooser.chooseSpeed(
                    `${fastToFixed(SimVar.GetSimVarValue("GPS GROUND SPEED", "kilometers per hour"), 0)}<span class="small">kph</span>`,
                    `${fastToFixed(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots"), 0)}<span class="small">kts</span>
                    `);
            }
            case "MSA": {
                break;
            }
            case "TAS": {
                return this.unitChooser.chooseSpeed(
                    `${fastToFixed(SimVar.GetSimVarValue("AIRSPEED TRUE", "kilometers per hour"), 0)}<span class="small">kph</span>`,
                    `${fastToFixed(SimVar.GetSimVarValue("AIRSPEED TRUE", "knots"), 0)}<span class="small">kts</span>
                    `);
            }
            case "TKE": {
                break;
            }
            case "TRK": {
                return fastToFixed(SimVar.GetSimVarValue("GPS GROUND MAGNETIC TRACK", "degree"), 0) + "°";
            }
            case "VSR": {
                break;
            }
            case "XTK": {
                let source = SimVar.GetSimVarValue("GPS DRIVES NAV1", "Bool") ? 3 : SimVar.GetSimVarValue("AUTOPILOT NAV SELECTED", "Number");
                let deviation = null;
                switch (source) {
                    case 1:
                        deviation = SimVar.GetSimVarValue("NAV CDI:1", "number") / 127;
                        break;
                    case 2:
                        deviation = SimVar.GetSimVarValue("NAV CDI:2", "number") / 127;
                        break;
                    case 3:
                        deviation = SimVar.GetSimVarValue("GPS WP CROSS TRK", "nautical mile");
                        break;
                }
                return `${deviation === null ? "__._" : fastToFixed(deviation, 1)}<span class="small">NM</span>`;
            }
        }

        return `<span class="small">Not Impl</span>`;
    }
    update(dt) {
        this.updateCounter += dt;
        if (this.updateCounter < this.updateFrequency)
            return;
        this.updateCounter = this.updateCounter % this.updateFrequency;

        for (let i = 0; i < 4; i++) {
            this.watchedIds[i].value = this.settings.getValue(`mfd_watched_${i}`);
            let id = this.watchedIds[i].value;
            let value = this.getValue(id);
            this.watchedValues[i].value = value;
        }
    }
}

class AS1000_MFD_Nav_Box_View extends AS1000_HTML_View {
    constructor() {
        super();
    }
    /**
     * @param {AS1000_MFD_Nav_Box_Model} model 
     */
    setModel(model) {
        model.pageTitle.subscribe(title => this.elements.pageTitle.innerHTML = title);
        for (let i = 0; i < 4; i++) {
            model.watchedIds[i].subscribe(id => this.elements[`id${i}`].innerHTML = id);
            model.watchedValues[i].subscribe(value => this.elements[`value${i}`].innerHTML = value);
        }
    }
}
customElements.define("g1000-nav-box", AS1000_MFD_Nav_Box_View);