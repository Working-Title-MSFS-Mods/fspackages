class WT_Annunciations extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.allMessages = [];
        this.alertLevel = 0;
        this.alert = false;
        this.needReload = true;
        this.rootElementName = "Annunciations";
    }
    init(root) {
        this.engineType = Simplane.getEngineType();
        if (this.rootElementName != "")
            this.annunciations = this.gps.getChildById(this.rootElementName);
        if (this.gps.xmlConfig) {
            let annunciationsRoot = this.gps.xmlConfig.getElementsByTagName("Annunciations");
            if (annunciationsRoot.length > 0) {
                let annunciations = annunciationsRoot[0].getElementsByTagName("Annunciation");
                for (let i = 0; i < annunciations.length; i++) {
                    this.addXmlMessage(annunciations[i]);
                }
            }
        }
    }
    onEnter() {
    }
    onExit() {
    }
    addMessage(_type, _text, _handler) {
        var msg = new Annunciation_Message();
        msg.Type = _type;
        msg.Text = _text;
        msg.Handler = _handler.bind(msg);
        this.allMessages.push(msg);
    }
    addXmlMessage(_element) {
        var msg = new Annunciation_Message_XML();
        switch (_element.getElementsByTagName("Type")[0].textContent) {
            case "Warning":
                msg.Type = Annunciation_MessageType.WARNING;
                break;
            case "Caution":
                msg.Type = Annunciation_MessageType.CAUTION;
                break;
            case "Advisory":
                msg.Type = Annunciation_MessageType.ADVISORY;
                break;
            case "SafeOp":
                msg.Type = Annunciation_MessageType.SAFEOP;
                break;
        }
        msg.baseText = _element.getElementsByTagName("Text")[0].textContent;
        let conditions = _element.getElementsByTagName("Condition");
        for (let i = 0; i < conditions.length; i++) {
            let condition = new XMLCondition();
            condition.logic = new CompositeLogicXMLElement(this.gps, conditions[i]);
            condition.suffix = conditions[i].getAttribute("Suffix");
            msg.conditions.push(condition);
        }
        this.allMessages.push(msg);
    }
    addMessageTimed(_type, _text, _handler, _time) {
        var msg = new Annunciation_Message_Timed();
        msg.Type = _type;
        msg.Text = _text;
        msg.Handler = _handler.bind(msg);
        msg.timeNeeded = _time;
        this.allMessages.push(msg);
    }
    addMessageSwitch(_type, _texts, _handler) {
        var msg = new Annunciation_Message_Switch();
        msg.Type = _type;
        msg.Texts = _texts;
        msg.Handler = _handler.bind(msg);
        this.allMessages.push(msg);
    }
    addMessageMultipleConditions(_type, _text, _conditions) {
        var msg = new Annunciator_Message_MultipleConditions();
        msg.Type = _type;
        msg.Text = _text;
        msg.conditions = _conditions;
        this.allMessages.push(msg);
    }
}
class WT_Cabin_Annunciations extends WT_Annunciations {
    constructor() {
        super(...arguments);
        this.displayWarning = [];
        this.displayCaution = [];
        this.displayAdvisory = [];
        this.warningToneNameZ = new Name_Z("tone_warning");
        this.cautionToneNameZ = new Name_Z("tone_caution");
        this.warningTone = false;
        this.firstAcknowledge = true;
        this.offStart = false;
        this.manuallyOpened = false;
    }
    init(root) {
        super.init(root);
        this.alwaysUpdate = true;
        this.isPlayingWarningTone = false;
        for (var i = 0; i < this.allMessages.length; i++) {
            var message = this.allMessages[i];
            var value = false;
            if (message.Handler)
                value = message.Handler() != 0;
            if (value != message.Visible) {
                this.needReload = true;
                message.Visible = value;
                message.Acknowledged = !this.offStart;
                if (value) {
                    switch (message.Type) {
                        case Annunciation_MessageType.WARNING:
                            this.displayWarning.push(message);
                            break;
                        case Annunciation_MessageType.CAUTION:
                            this.displayCaution.push(message);
                            break;
                        case Annunciation_MessageType.ADVISORY:
                            this.displayAdvisory.push(message);
                            break;
                    }
                }
            }
        }
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        for (var i = 0; i < this.allMessages.length; i++) {
            var message = this.allMessages[i];
            var value = false;
            if (message.Handler)
                value = message.Handler() != 0;
            if (value != message.Visible) {
                this.needReload = true;
                message.Visible = value;
                message.Acknowledged = (this.gps.getTimeSinceStart() < 10000 && !this.offStart);
                if (value) {
                    switch (message.Type) {
                        case Annunciation_MessageType.WARNING:
                            this.displayWarning.push(message);
                            break;
                        case Annunciation_MessageType.CAUTION:
                            this.displayCaution.push(message);
                            break;
                        case Annunciation_MessageType.ADVISORY:
                            this.displayAdvisory.push(message);
                            break;
                    }
                }
                else {
                    switch (message.Type) {
                        case Annunciation_MessageType.WARNING:
                            for (let i = 0; i < this.displayWarning.length; i++) {
                                if (this.displayWarning[i].Text == message.Text) {
                                    this.displayWarning.splice(i, 1);
                                    break;
                                }
                            }
                            break;
                        case Annunciation_MessageType.CAUTION:
                            for (let i = 0; i < this.displayCaution.length; i++) {
                                if (this.displayCaution[i].Text == message.Text) {
                                    this.displayCaution.splice(i, 1);
                                    break;
                                }
                            }
                            break;
                        case Annunciation_MessageType.ADVISORY:
                            for (let i = 0; i < this.displayAdvisory.length; i++) {
                                if (this.displayAdvisory[i].Text == message.Text) {
                                    this.displayAdvisory.splice(i, 1);
                                    break;
                                }
                            }
                            break;
                    }
                }
            }
        }
        if (this.annunciations)
            this.annunciations.setAttribute("state", this.gps.blinkGetState(800, 200) ? "Blink" : "None");
        if (this.needReload) {
            let warningOn = 0;
            let cautionOn = 0;
            let messages = "";
            for (let i = this.displayWarning.length - 1; i >= 0; i--) {
                messages += '<div class="Warning';
                if (!this.displayWarning[i].Acknowledged) {
                    messages += '_Blink';
                    warningOn = 1;
                }
                messages += '">' + this.displayWarning[i].Text + "</div>";
            }
            for (let i = this.displayCaution.length - 1; i >= 0; i--) {
                messages += '<div class="Caution';
                if (!this.displayCaution[i].Acknowledged) {
                    messages += '_Blink';
                    cautionOn = 1;
                }
                messages += '">' + this.displayCaution[i].Text + "</div>";
            }
            for (let i = this.displayAdvisory.length - 1; i >= 0; i--) {
                messages += '<div class="Advisory">' + this.displayAdvisory[i].Text + "</div>";
            }
            this.warningTone = warningOn > 0;
            if (this.gps.isPrimary) {
                SimVar.SetSimVarValue("L:Generic_Master_Warning_Active", "Bool", warningOn);
                SimVar.SetSimVarValue("L:Generic_Master_Caution_Active", "Bool", cautionOn);
            }
            if (this.annunciations)
                this.annunciations.innerHTML = messages;
            this.needReload = false;
        }
    }
    onEvent(_event) {
        switch (_event) {
            case "Master_Caution_Push":
                for (let i = 0; i < this.allMessages.length; i++) {
                    if (this.allMessages[i].Type == Annunciation_MessageType.CAUTION && this.allMessages[i].Visible) {
                        this.allMessages[i].Acknowledged = true;
                        this.needReload = true;
                    }
                }
                break;
            case "Master_Warning_Push":
                for (let i = 0; i < this.allMessages.length; i++) {
                    if (this.allMessages[i].Type == Annunciation_MessageType.WARNING && this.allMessages[i].Visible) {
                        this.allMessages[i].Acknowledged = true;
                        this.needReload = true;
                    }
                }
                if (this.needReload && this.firstAcknowledge && this.gps.isPrimary) {
                    let res = this.gps.playInstrumentSound("aural_warning_ok");
                    if (res)
                        this.firstAcknowledge = false;
                }
                break;
        }
    }
    onSoundEnd(_eventId) {
        if (Name_Z.compare(_eventId, this.warningToneNameZ) || Name_Z.compare(_eventId, this.cautionToneNameZ)) {
            this.isPlayingWarningTone = false;
        }
    }
    onShutDown() {
        for (let i = 0; i < this.allMessages.length; i++) {
            this.allMessages[i].Acknowledged = false;
            this.allMessages[i].Visible = false;
        }
        this.displayCaution = [];
        this.displayWarning = [];
        this.displayAdvisory = [];
        if (!this.gps || this.gps.isPrimary) {
            SimVar.SetSimVarValue("L:Generic_Master_Warning_Active", "Bool", 0);
            SimVar.SetSimVarValue("L:Generic_Master_Caution_Active", "Bool", 0);
        }
        this.firstAcknowledge = true;
        this.needReload = true;
    }
    onPowerOn() {
        this.offStart = true;
    }
    hasMessages() {
        if(this.manuallyOpened){
            return true
        }
        for (var i = 0; i < this.allMessages.length; i++) {
            if (this.allMessages[i].Visible && this.allMessages[i].Type !== Annunciation_MessageType.ADVISORY) {
                return true;
            }
        }
        return false;
    }
}
class WT_Engine_Annunciations extends WT_Cabin_Annunciations {
    init(root) {
        super.init(root);
        switch (this.engineType) {
            case EngineType.ENGINE_TYPE_PISTON:
                this.addMessage(Annunciation_MessageType.WARNING, "OIL PRESSURE", this.OilPressure);
                this.addMessage(Annunciation_MessageType.WARNING, "LOW VOLTS", this.LowVoltage);
                this.addMessage(Annunciation_MessageType.WARNING, "HIGH VOLTS", this.HighVoltage);
                this.addMessage(Annunciation_MessageType.WARNING, "CO LVL HIGH", this.COLevelHigh);
                this.addMessage(Annunciation_MessageType.CAUTION, "STBY BATT", this.StandByBattery);
                this.addMessage(Annunciation_MessageType.CAUTION, "LOW VACUUM", this.LowVaccum);
                this.addMessage(Annunciation_MessageType.CAUTION, "LOW FUEL R", this.LowFuelR);
                this.addMessage(Annunciation_MessageType.CAUTION, "LOW FUEL L", this.LowFuelL);
                break;
            case EngineType.ENGINE_TYPE_TURBOPROP:
            case EngineType.ENGINE_TYPE_JET:
                this.addMessage(Annunciation_MessageType.WARNING, "FUEL OFF", this.fuelOff);
                this.addMessage(Annunciation_MessageType.WARNING, "FUEL PRESS", this.fuelPress);
                this.addMessage(Annunciation_MessageType.WARNING, "OIL PRESS", this.oilPressWarning);
                this.addMessageMultipleConditions(Annunciation_MessageType.WARNING, "ITT", [
                    new Condition(this.itt.bind(this, "1000")),
                    new Condition(this.itt.bind(this, "870"), 5),
                    new Condition(this.itt.bind(this, "840"), 20)
                ]);
                this.addMessage(Annunciation_MessageType.WARNING, "FLAPS ASYM", this.flapsAsym);
                this.addMessage(Annunciation_MessageType.WARNING, "ELEC FEATH FAULT", this.elecFeathFault);
                this.addMessage(Annunciation_MessageType.WARNING, "BLEED TEMP", this.bleedTemp);
                this.addMessage(Annunciation_MessageType.WARNING, "CABIN ALTITUDE", this.cabinAltitude);
                this.addMessage(Annunciation_MessageType.WARNING, "EDM", this.edm);
                this.addMessage(Annunciation_MessageType.WARNING, "CABIN DIFF PRESS", this.cabinDiffPress);
                this.addMessage(Annunciation_MessageType.WARNING, "DOOR", this.door);
                this.addMessage(Annunciation_MessageType.WARNING, "USP ACTIVE", this.uspActive);
                this.addMessage(Annunciation_MessageType.WARNING, "GEAR UNSAFE", this.gearUnsafe);
                this.addMessage(Annunciation_MessageType.WARNING, "PARK BRAKE", this.parkBrake);
                this.addMessage(Annunciation_MessageType.WARNING, "OXYGEN", this.oxygen);
                this.addMessage(Annunciation_MessageType.CAUTION, "OIL PRESS", this.oilPressCaution);
                this.addMessage(Annunciation_MessageType.CAUTION, "CHIP", this.chip);
                this.addMessage(Annunciation_MessageType.CAUTION, "OIL TEMP", this.oilTemp);
                this.addMessage(Annunciation_MessageType.CAUTION, "AUX BOOST PMP ON", this.auxBoostPmpOn);
                this.addMessageSwitch(Annunciation_MessageType.CAUTION, ["FUEL LOW L", "FUEL LOW R", "FUEL LOW L-R"], this.fuelLowSelector);
                this.addMessage(Annunciation_MessageType.CAUTION, "AUTO SEL", this.autoSel);
                this.addMessageTimed(Annunciation_MessageType.CAUTION, "FUEL IMBALANCE", this.fuelImbalance, 30);
                this.addMessageSwitch(Annunciation_MessageType.CAUTION, ["LOW LVL FAIL L", "LOW LVL FAIL R", "LOW LVL FAIL L-R"], this.lowLvlFailSelector);
                this.addMessage(Annunciation_MessageType.CAUTION, "BAT OFF", this.batOff);
                this.addMessage(Annunciation_MessageType.CAUTION, "BAT AMP", this.batAmp);
                this.addMessage(Annunciation_MessageType.CAUTION, "MAIN GEN", this.mainGen);
                this.addMessage(Annunciation_MessageType.CAUTION, "LOW VOLTAGE", this.lowVoltage);
                this.addMessage(Annunciation_MessageType.CAUTION, "BLEED OFF", this.bleedOff);
                this.addMessage(Annunciation_MessageType.CAUTION, "USE OXYGEN MASK", this.useOxygenMask);
                this.addMessage(Annunciation_MessageType.CAUTION, "VACUUM LOW", this.vacuumLow);
                this.addMessage(Annunciation_MessageType.CAUTION, "PROP DEICE FAIL", this.propDeiceFail);
                this.addMessage(Annunciation_MessageType.CAUTION, "INERT SEP FAIL", this.inertSepFail);
                this.addMessageSwitch(Annunciation_MessageType.CAUTION, ["PITOT NO HT L", "PITOT NO HT R", "PITOT NO HT L-R"], this.pitotNoHtSelector);
                this.addMessageSwitch(Annunciation_MessageType.CAUTION, ["PITOT HT ON L", "PITOT HT ON R", "PITOT HT ON L-R"], this.pitotHtOnSelector);
                this.addMessage(Annunciation_MessageType.CAUTION, "STALL NO HEAT", this.stallNoHeat);
                this.addMessage(Annunciation_MessageType.CAUTION, "STALL HEAT ON", this.stallHeatOn);
                this.addMessage(Annunciation_MessageType.CAUTION, "FRONT CARGO DOOR", this.frontCargoDoor);
                this.addMessage(Annunciation_MessageType.CAUTION, "GPU DOOR", this.gpuDoor);
                this.addMessage(Annunciation_MessageType.CAUTION, "IGNITION", this.ignition);
                this.addMessage(Annunciation_MessageType.CAUTION, "STARTER", this.starter);
                this.addMessage(Annunciation_MessageType.CAUTION, "MAX DIFF MODE", this.maxDiffMode);
                this.addMessage(Annunciation_MessageType.CAUTION, "CPCS BACK UP MODE", this.cpcsBackUpMode);
                break;
        }
    }
    sayTrue() {
        return true;
    }
    SafePropHeat() {
        return false;
    }
    CautionPropHeat() {
        return false;
    }
    StandByBattery() {
        return false;
    }
    LowVaccum() {
        return SimVar.GetSimVarValue("WARNING VACUUM", "Boolean");
    }
    LowPower() {
        return false;
    }
    LowFuelR() {
        return SimVar.GetSimVarValue("FUEL RIGHT QUANTITY", "gallon") < 5;
    }
    LowFuelL() {
        return SimVar.GetSimVarValue("FUEL LEFT QUANTITY", "gallon") < 5;
    }
    FuelTempFailed() {
        return false;
    }
    ECUMinorFault() {
        return false;
    }
    PitchTrim() {
        return false;
    }
    StartEngage() {
        return false;
    }
    OilPressure() {
        return SimVar.GetSimVarValue("WARNING OIL PRESSURE", "Boolean");
    }
    LowFuelPressure() {
        var pressure = SimVar.GetSimVarValue("ENG FUEL PRESSURE", "psi");
        if (pressure <= 1)
            return true;
        return false;
    }
    LowVoltage() {
        var voltage;
        voltage = SimVar.GetSimVarValue("ELECTRICAL MAIN BUS VOLTAGE", "volts");
        if (voltage < 24)
            return true;
        return false;
    }
    HighVoltage() {
        var voltage;
        voltage = SimVar.GetSimVarValue("ELECTRICAL MAIN BUS VOLTAGE", "volts");
        if (voltage > 32)
            return true;
        return false;
    }
    FuelTemperature() {
        return false;
    }
    ECUMajorFault() {
        return false;
    }
    COLevelHigh() {
        return false;
    }
    fuelOff() {
        return (SimVar.GetSimVarValue("FUEL TANK SELECTOR:1", "number") == 0);
    }
    fuelPress() {
        return (SimVar.GetSimVarValue("GENERAL ENG FUEL PRESSURE:1", "psi") <= 10);
    }
    oilPressWarning() {
        return (SimVar.GetSimVarValue("ENG OIL PRESSURE:1", "psi") <= 60);
    }
    itt(_limit = 840) {
        let itt = SimVar.GetSimVarValue("TURB ENG ITT:1", "celsius");
        return (itt > _limit);
    }
    flapsAsym() {
        return false;
    }
    elecFeathFault() {
        return false;
    }
    bleedTemp() {
        return false;
    }
    cabinAltitude() {
        return SimVar.GetSimVarValue("PRESSURIZATION CABIN ALTITUDE", "feet") > 10000;
    }
    edm() {
        return false;
    }
    cabinDiffPress() {
        return SimVar.GetSimVarValue("PRESSURIZATION PRESSURE DIFFERENTIAL", "psi") > 6.2;
    }
    door() {
        return SimVar.GetSimVarValue("EXIT OPEN:0", "percent") > 0;
    }
    uspActive() {
        return false;
    }
    gearUnsafe() {
        return false;
    }
    parkBrake() {
        return SimVar.GetSimVarValue("BRAKE PARKING INDICATOR", "Bool");
    }
    oxygen() {
        return false;
    }
    oilPressCaution() {
        let press = SimVar.GetSimVarValue("ENG OIL PRESSURE:1", "psi");
        return (press <= 105 && press >= 60);
    }
    chip() {
        return false;
    }
    oilTemp() {
        let temp = SimVar.GetSimVarValue("GENERAL ENG OIL TEMPERATURE:1", "celsius");
        return (temp <= 0 || temp >= 104);
    }
    auxBoostPmpOn() {
        return SimVar.GetSimVarValue("GENERAL ENG FUEL PUMP ON:1", "Bool");
    }
    fuelLowSelector() {
        let left = SimVar.GetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "gallon") < 9;
        let right = SimVar.GetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "gallon") < 9;
        if (left && right) {
            return 3;
        }
        else if (left) {
            return 1;
        }
        else if (right) {
            return 2;
        }
        else {
            return 0;
        }
    }
    autoSel() {
        return false;
    }
    fuelImbalance() {
        let left = SimVar.GetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "gallon");
        let right = SimVar.GetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "gallon");
        return Math.abs(left - right) > 15;
    }
    lowLvlFailSelector() {
        return false;
    }
    batOff() {
        return !SimVar.GetSimVarValue("ELECTRICAL MASTER BATTERY", "Bool");
    }
    batAmp() {
        return SimVar.GetSimVarValue("ELECTRICAL BATTERY BUS AMPS", "amperes") > 50;
    }
    mainGen() {
        return !SimVar.GetSimVarValue("GENERAL ENG GENERATOR SWITCH:1", "Bool");
    }
    lowVoltage() {
        return SimVar.GetSimVarValue("ELECTRICAL MAIN BUS VOLTAGE", "volts") < 24.5;
    }
    bleedOff() {
        return SimVar.GetSimVarValue("BLEED AIR SOURCE CONTROL", "Enum") == 1;
    }
    useOxygenMask() {
        return SimVar.GetSimVarValue("PRESSURIZATION CABIN ALTITUDE", "feet") > 10000;
    }
    vacuumLow() {
        return SimVar.GetSimVarValue("PARTIAL PANEL VACUUM", "Enum") == 1;
    }
    propDeiceFail() {
        return false;
    }
    inertSepFail() {
        return false;
    }
    pitotNoHtSelector() {
        return 0;
    }
    pitotHtOnSelector() {
        return 0;
    }
    stallNoHeat() {
        return false;
    }
    stallHeatOn() {
        return false;
    }
    frontCargoDoor() {
        return false;
    }
    gpuDoor() {
        return false;
    }
    ignition() {
        return SimVar.GetSimVarValue("TURB ENG IS IGNITING:1", "Bool");
    }
    starter() {
        return SimVar.GetSimVarValue("GENERAL ENG STARTER ACTIVE:1", "Bool");
    }
    maxDiffMode() {
        return SimVar.GetSimVarValue("BLEED AIR SOURCE CONTROL", "Enum") == 3;
    }
    cpcsBackUpMode() {
        return false;
    }
}