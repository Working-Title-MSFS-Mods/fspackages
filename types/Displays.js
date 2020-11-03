/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

class ColorRangeDisplay4 extends ColorRangeDisplay2 {
    constructor(_type = "ColorRangeDisplay4") {
        super(_type);
        this.whiteStart = 0;
        this.whiteEnd = 0;
    }
}

class ColorRangeDisplay3 extends ColorRangeDisplay2 {
    constructor(_type = "ColorRangeDisplay3") {
        super(_type);
        this.lowRedStart = 0;
        this.lowRedEnd = 0;
        this.lowYellowStart = 0;
        this.lowYellowEnd = 0;
    }
}

class ColorRangeDisplay2 extends ColorRangeDisplay {
    constructor(_type = "ColorRangeDisplay2") {
        super(_type);
        this.yellowStart = 0;
        this.yellowEnd = 0;
        this.redStart = 0;
        this.redEnd = 0;
    }
}

class ColorRangeDisplay extends RangeDisplay {
    constructor(_type = "ColorRangeDisplay") {
        super(_type);
        this.greenStart = 0;
        this.greenEnd = 0;
    }
}

class RangeDisplay {
    constructor(_type = "RangeDisplay") {
        this.min = 0;
        this.max = 0;
        this.lowLimit = 0;
        this.highLimit = 0;
        this.__Type = _type;
    }
}

class FlapsRangeDisplay extends RangeDisplay {
    constructor(_type = "FlapsRangeDisplay") {
        super(_type);
        this.takeOffValue = 0;
    }
}

class GlassCockpitSettings {
    constructor() {
        this.FuelFlow = new ColorRangeDisplay();
        this.FuelQuantity = new ColorRangeDisplay2();
        this.FuelTemperature = new ColorRangeDisplay3();
        this.FuelPressure = new ColorRangeDisplay3();
        this.OilPressure = new ColorRangeDisplay3();
        this.OilTemperature = new ColorRangeDisplay3();
        this.EGTTemperature = new RangeDisplay();
        this.Vacuum = new ColorRangeDisplay();
        this.ManifoldPressure = new ColorRangeDisplay();
        this.AirSpeed = new ColorRangeDisplay4();
        this.Torque = new ColorRangeDisplay2();
        this.RPM = new ColorRangeDisplay2();
        this.TurbineNg = new ColorRangeDisplay2();
        this.ITTEngineOff = new ColorRangeDisplay3();
        this.ITTEngineOn = new ColorRangeDisplay3();
        this.MainBusVoltage = new ColorRangeDisplay3();
        this.HotBatteryBusVoltage = new ColorRangeDisplay3();
        this.BatteryBusAmps = new ColorRangeDisplay2();
        this.GenAltBusAmps = new ColorRangeDisplay2();
        this.CoolantLevel = new RangeDisplay();
        this.CoolantTemperature = new ColorRangeDisplay3();
        this.GearOilTemperature = new ColorRangeDisplay2();
        this.CabinAltitude = new ColorRangeDisplay();
        this.CabinAltitudeChangeRate = new RangeDisplay();
        this.CabinPressureDiff = new ColorRangeDisplay();
        this.ThrottleLevels = new ThrottleLevelsInfo();
        this.FlapsLevels = new FlapsLevelsInfo();
    }
}

class ThrottleLevelsInfo {
    constructor() {
        this.__Type = "ThrottleLevelsInfo";
        this.minValues = [0, 0, 0, 0, 0];
        this.names = ["", "", "", "", ""];
    }
}

class FlapsLevelsInfo {
    constructor() {
        this.__Type = "FlapsLevelsInfo";
        this.slatsAngle = [0, 0, 0, 0];
        this.flapsAngle = [0, 0, 0, 0];
    }
}