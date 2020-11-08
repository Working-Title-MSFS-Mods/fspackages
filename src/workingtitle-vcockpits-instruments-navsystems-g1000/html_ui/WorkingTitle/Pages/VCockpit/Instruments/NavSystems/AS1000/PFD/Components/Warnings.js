class WT_Warnings_Model {
    /**
     * @param {NavSystem} gps 
     * @param {WT_Plane_Config} planeConfig 
     * @param {WT_Sound} sound
     */
    constructor(gps, planeConfig, sound) {
        this.gps = gps;
        this.sound = sound;

        this.UID = parseInt(this.gps.getAttribute("Guid")) + 1;
        this.warnings = [];
        this.playingSounds = [];
        this.pullUp_sinkRate_Points = [
            [1160, 0, 0],
            [2320, 1070, 1460],
            [4930, 2380, 2980],
            [11600, 4285, 5360]
        ];

        this.activeWarning = new Subject(null);

        planeConfig.watchNode("VoicesAlerts").subscribe(voicesAlerts => {
            if (voicesAlerts != null) {
                const alerts = voicesAlerts.getElementsByTagName("Alert");
                this.warnings = Array.prototype.slice.call(alerts).map(alertNode => {
                    let typeParam = alertNode.getElementsByTagName("Type");
                    let type = 0;
                    if (typeParam.length > 0) {
                        switch (typeParam[0].textContent) {
                            case "Warning":
                                type = 3;
                                break;
                            case "Caution":
                                type = 2;
                                break;
                            case "Test":
                                type = 1;
                                break;
                            case "SoundOnly":
                                type = 0;
                                break;
                        }
                    }
                    let shortText = "";
                    let longText = "";
                    if (type != 0) {
                        let shortTextElem = alertNode.getElementsByTagName("ShortText");
                        if (shortTextElem.length > 0) {
                            shortText = shortTextElem[0].textContent;
                        }
                        let longTextElem = alertNode.getElementsByTagName("LongText");
                        if (longTextElem.length > 0) {
                            longText = longTextElem[0].textContent;
                        }
                    }
                    let soundEvent = "";
                    let soundEventElem = alertNode.getElementsByTagName("SoundEvent");
                    if (soundEventElem.length > 0) {
                        soundEvent = soundEventElem[0].textContent;
                    }
                    let condition = alertNode.getElementsByTagName("Condition")[0];
                    let once = false;
                    let onceElement = alertNode.getElementsByTagName("Once");
                    if (onceElement.length > 0 && onceElement[0].textContent == "True") {
                        once = true;
                    }

                    return new Warning_Data_XML(this.gps, shortText, longText, soundEvent, type, condition, once);
                });
            } else {
                this.warnings = [
                    new Warning_Data("", "", "Garmin_Stall_f", 0, this.stallCallback.bind(this)),
                    new Warning_Data("PULL UP", "PULL UP", "Garmin_Pull_Up_f", 3, this.pullUpCallback.bind(this)),
                    new Warning_Data("TERRAIN", "SINK RATE", "Garmin_Sink_Rate_f", 2, this.sinkRateCallback.bind(this)),
                    new Warning_Data("", "", "Garmin_landing_gear_f", 0, this.landingGearCallback.bind(this)),
                    new Warning_Data("TAWS TEST", "", "", 1, this.tawsTestCallback.bind(this)),
                    new Warning_Data("", "", "Garmin_TAWS_System_Test_OK_f", 0, this.tawsTestFinishedCallback.bind(this), true),
                ];
            }

            SimVar.SetSimVarValue("L:AS1000_Warnings_Master_Set", "number", 0);
        });
    }
    update(dt) {
        const masterSet = SimVar.GetSimVarValue("L:AS1000_Warnings_Master_Set", "number");
        if (masterSet == 0) {
            SimVar.SetSimVarValue("L:AS1000_Warnings_Master_Set", "number", this.UID);
        } else if (masterSet == this.UID) {
            let found = false;
            let foundText = false;
            let bestWarning = 0;
            for (let i = 0; i < this.warnings.length; i++) {
                const warning = this.warnings[i];
                if (!warning.once || !warning.hasPlayed) {
                    if (warning.callback()) {
                        if (warning.soundEvent != "") {
                            this.sound.play(warning.soundEvent).then(() => warning.hasPlayed = false);
                            warning.hasPlayed = true;
                        }

                        if (!foundText)
                            bestWarning = i;
                        if (warning.shortText || warning.longText)
                            foundText = true;
                        found = true;
                    }
                }
            }
            SimVar.SetSimVarValue("L:AS1000_Warnings_WarningIndex", "number", found ? (bestWarning + 1) : 0);
            this.activeWarning.value = found ? this.warnings[bestWarning] : null;
        }
    }
    linearMultiPointsEvaluation(_points, _valueX, _valueY) {
        let lastLowerIndex = -1;
        for (let i = 0; i < _points.length; i++) {
            if (_valueX > _points[i][0]) {
                lastLowerIndex = i;
            }
            else {
                break;
            }
        }
        if (lastLowerIndex == _points.length - 1) {
            for (let i = 1; i < _points[lastLowerIndex].length; i++) {
                if (_valueY < _points[lastLowerIndex][i]) {
                    return i;
                }
            }
            return _points[lastLowerIndex].length;
        }
        else if (lastLowerIndex == -1) {
            for (let i = 1; i < _points[0].length; i++) {
                if (_valueY < _points[0][i]) {
                    return i;
                }
            }
            return _points[0].length;
        }
        else {
            let factorLower = (_valueX - _points[lastLowerIndex][0]) / _points[lastLowerIndex + 1][0];
            for (let i = 1; i < _points[lastLowerIndex].length; i++) {
                let limit = _points[lastLowerIndex][i] * factorLower + _points[lastLowerIndex + 1][i] * (1 - factorLower);
                if (_valueY < limit) {
                    return i;
                }
            }
            return _points[lastLowerIndex].length;
        }
    }
    pullUpCallback() {
        let height = SimVar.GetSimVarValue("PLANE ALT ABOVE GROUND", "feet");
        let descentRate = -SimVar.GetSimVarValue("VERTICAL SPEED", "feet per minute");
        return this.linearMultiPointsEvaluation(this.pullUp_sinkRate_Points, descentRate, height) == 1;
    }
    sinkRateCallback() {
        let height = SimVar.GetSimVarValue("PLANE ALT ABOVE GROUND", "feet");
        let descentRate = -SimVar.GetSimVarValue("VERTICAL SPEED", "feet per minute");
        return this.linearMultiPointsEvaluation(this.pullUp_sinkRate_Points, descentRate, height) == 2;
    }
    landingGearCallback() {
        let gear = !SimVar.GetSimVarValue("IS GEAR RETRACTABLE", "Boolean") || SimVar.GetSimVarValue("GEAR HANDLE POSITION", "Boolean");
        let throttle = SimVar.GetSimVarValue("GENERAL ENG THROTTLE LEVER POSITION:1", "percent");
        let flaps = SimVar.GetSimVarValue("FLAPS HANDLE INDEX", "number");
        return !gear && (flaps > 1 || (throttle == 0));
    }
    stallCallback() {
        return SimVar.GetSimVarValue("STALL WARNING", "Boolean");
    }
    tawsTestCallback() {
        return this.gps.getTimeSinceStart() < 30000;
    }
    tawsTestFinishedCallback() {
        return this.gps.getTimeSinceStart() >= 30000;
    }
}

class WT_Warnings_View extends WT_HTML_View {
    constructor() {
        super();
    }
    /**
     * @param {WT_Warnings_Model} model 
     */
    setModel(model) {
        model.activeWarning.subscribe(warning => {
            if (warning) {
                this.elements.text.textContent = warning.shortText;
                switch (warning.level) {
                    case 0:
                        this.setAttribute("state", "Hidden");
                        break;
                    case 1:
                        this.setAttribute("state", "White");
                        break;
                    case 2:
                        this.setAttribute("state", "Yellow");
                        break;
                    case 3:
                        this.setAttribute("state", "Red");
                        break;
                }
            } else {
                this.setAttribute("state", "Hidden");
            }
        });
    }
}
customElements.define("g1000-warnings", WT_Warnings_View);