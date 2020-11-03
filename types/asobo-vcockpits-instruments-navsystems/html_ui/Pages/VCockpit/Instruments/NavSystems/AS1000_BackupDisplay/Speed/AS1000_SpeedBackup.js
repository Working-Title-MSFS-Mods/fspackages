/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

class AS1000_SpeedBackup extends NavSystem {
    get templateID() { return "AS1000_SpeedBackup"; }
    connectedCallback() {
        super.connectedCallback();
        this.addIndependentElementContainer(new NavSystemElementContainer("Altimeter", "SvgMain", new Backup_Altimeter()));
        this.addIndependentElementContainer(new NavSystemElementContainer("Speed", "SvgMain", new Backup_Airspeed()));
    }
}
class Backup_Airspeed extends NavSystemElement {
    constructor() {
        super();
        this.lastIndicatedSpeed = -10000;
    }
    init(root) {
        this.airspeedElement = this.gps.getChildById("SvgMain");
        this.airspeedElement.setAttribute("is-backup", "true");
        var cockpitSettings = SimVar.GetGameVarValue("", "GlassCockpitSettings");
        if (cockpitSettings && cockpitSettings.AirSpeed.Initialized) {
            this.airspeedElement.setAttribute("min-speed", cockpitSettings.AirSpeed.lowLimit.toString());
            this.airspeedElement.setAttribute("green-begin", cockpitSettings.AirSpeed.greenStart.toString());
            this.airspeedElement.setAttribute("green-end", cockpitSettings.AirSpeed.greenEnd.toString());
            this.airspeedElement.setAttribute("flaps-begin", cockpitSettings.AirSpeed.whiteStart.toString());
            this.airspeedElement.setAttribute("flaps-end", cockpitSettings.AirSpeed.whiteEnd.toString());
            this.airspeedElement.setAttribute("yellow-begin", cockpitSettings.AirSpeed.yellowStart.toString());
            this.airspeedElement.setAttribute("yellow-end", cockpitSettings.AirSpeed.yellowEnd.toString());
            this.airspeedElement.setAttribute("red-begin", cockpitSettings.AirSpeed.redStart.toString());
            this.airspeedElement.setAttribute("red-end", cockpitSettings.AirSpeed.redEnd.toString());
            this.airspeedElement.setAttribute("max-speed", cockpitSettings.AirSpeed.highLimit.toString());
        }
        else {
            var designSpeeds = Simplane.getDesignSpeeds();
            this.airspeedElement.setAttribute("green-begin", designSpeeds.VS1.toString());
            this.airspeedElement.setAttribute("green-end", designSpeeds.VNo.toString());
            this.airspeedElement.setAttribute("flaps-begin", designSpeeds.VS0.toString());
            this.airspeedElement.setAttribute("flaps-end", designSpeeds.VFe.toString());
            this.airspeedElement.setAttribute("yellow-begin", designSpeeds.VNo.toString());
            this.airspeedElement.setAttribute("yellow-end", designSpeeds.VNe.toString());
            this.airspeedElement.setAttribute("red-begin", designSpeeds.VNe.toString());
            this.airspeedElement.setAttribute("red-end", designSpeeds.VMax.toString());
            this.airspeedElement.setAttribute("max-speed", designSpeeds.VNe.toString());
        }
        if (this.gps) {
            var aspectRatio = this.gps.getAspectRatio();
            this.airspeedElement.setAttribute("aspect-ratio", aspectRatio.toString());
        }
    }
    onEnter() {
    }
    isReady() {
        return true;
    }
    onUpdate(_deltaTime) {
        var indicatedSpeed = Simplane.getIndicatedSpeed();
        if (indicatedSpeed != this.lastIndicatedSpeed) {
            this.airspeedElement.setAttribute("airspeed", indicatedSpeed.toFixed(1));
            this.lastIndicatedSpeed = indicatedSpeed;
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class Backup_Altimeter extends NavSystemElement {
    constructor() {
        super();
        this.lastAltitude = -10000;
        this.lastPressure = -10000;
    }
    init(root) {
        this.altimeterElement = this.gps.getChildById("SvgMain");
        this.altimeterElement.setAttribute("is-backup", "true");
        if (this.gps) {
            var aspectRatio = this.gps.getAspectRatio();
            this.altimeterElement.setAttribute("aspect-ratio", aspectRatio.toString());
        }
    }
    onEnter() {
    }
    isReady() {
        return true;
    }
    onUpdate(_deltaTime) {
        var altitude = SimVar.GetSimVarValue("INDICATED ALTITUDE:2", "feet");
        if (altitude != this.lastAltitude) {
            this.lastAltitude = altitude;
            this.altimeterElement.setAttribute("altitude", altitude);
        }
        var pressure = SimVar.GetSimVarValue("KOHLSMAN SETTING HG:2", "inches of mercury");
        pressure = fastToFixed(pressure, 2);
        if (pressure != this.lastPressure) {
            this.lastPressure = pressure;
            this.altimeterElement.setAttribute("pressure", pressure);
        }
    }
    onExit() {
    }
    onEvent(_event) {
        switch (_event) {
            case "BARO_INC":
                SimVar.SetSimVarValue("K:KOHLSMAN_INC", "number", 1);
                break;
            case "BARO_DEC":
                SimVar.SetSimVarValue("K:KOHLSMAN_DEC", "number", 1);
                break;
        }
    }
}
registerInstrument("as1000-speedbackup-element", AS1000_SpeedBackup);
//# sourceMappingURL=AS1000_SpeedBackup.js.map