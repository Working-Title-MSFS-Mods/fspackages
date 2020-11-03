/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

const SimVar = {}

SimVar.SimVarValue = class SimVarValue {
    constructor(_name = "", _unit = "number", _type) {
        this.__type = "SimVarValue";
        this.name = _name;
        this.type = _type;
        this.unit = _unit;
    }
}

SimVar.IsReady = function IsReady() {
    return (GetSimVars());
}

SimVar.LogSimVarValueHistory = function LogSimVarValueHistory() {
    let totalInvokePerFrame = 0;
    let totalTimePerFrame = 0;
    SimVarValueHistory = SimVarValueHistory.sort((a, b) => {
        return (b.totalTime / b.invokes - a.totalTime / a.invokes);
    });
    for (let i = 0; i < SimVarValueHistory.length; i++) {
        let h = SimVarValueHistory[i];
        let timePerInvoke = h.totalTime / h.invokes;
        let invokePerFrame = h.invokes / frameCount;
        let timePerFrame = h.totalTime / frameCount;
        totalInvokePerFrame += invokePerFrame;
        totalTimePerFrame += timePerFrame;
        console.log(h.name + " called " + h.invokes.toFixed(0) + " times for " + timePerInvoke.toFixed(3) + " ms per call (total is " + h.totalTime.toFixed(3) + " ms) (worst is " + h.worstInvokeTime.toFixed(3) + " ms) (time per frame is " + timePerFrame.toFixed(3) + " ms) (invokes per frame is " + invokePerFrame.toFixed(3) + ")");
    }
    console.log("Total invokes per frame = " + totalInvokePerFrame);
    console.log("Total time per frame = " + totalTimePerFrame);
}

SimVar.LogSimVarValueHistoryByTimePerFrame = function LogSimVarValueHistoryByTimePerFrame() {
    let totalInvokePerFrame = 0;
    let totalTimePerFrame = 0;
    SimVarValueHistory = SimVarValueHistory.sort((a, b) => {
        return (b.totalTime / frameCount - a.totalTime / frameCount);
    });
    for (let i = 0; i < SimVarValueHistory.length; i++) {
        let h = SimVarValueHistory[i];
        let timePerInvoke = h.totalTime / h.invokes;
        let invokePerFrame = h.invokes / frameCount;
        let timePerFrame = h.totalTime / frameCount;
        totalInvokePerFrame += invokePerFrame;
        totalTimePerFrame += timePerFrame;
        console.log(h.name + " called " + h.invokes.toFixed(0) + " times for " + timePerInvoke.toFixed(3) + " ms per call (total is " + h.totalTime.toFixed(3) + " ms) (worst is " + h.worstInvokeTime.toFixed(3) + " ms) (time per frame is " + timePerFrame.toFixed(3) + " ms) (invokes per frame is " + invokePerFrame.toFixed(3) + ")");
    }
    console.log("Total invokes per frame = " + totalInvokePerFrame);
    console.log("Total time per frame = " + totalTimePerFrame);
}

SimVar.GetSimVarValue = function GetSimVarValue(name, unit, dataSource = "") {
    let t0;
    if (KeepSimVarValueHistory) {
        t0 = performance.now();
        if (frameCount === -1) {
            frameCount = 0;
            let incFrameCount = () => {
                frameCount++;
                requestAnimationFrame(incFrameCount);
            };
            incFrameCount();
        }
    }
    try {
        var Simvars = GetSimVars();
        if (Simvars) {
            let output;
            switch (unit.toLowerCase()) {
                case "latlonalt":
                    output = new LatLongAlt(Simvars.getValue_LatLongAlt(name, dataSource));
                    break;
                case "latlonaltpbh":
                    output = new LatLongAltPBH(Simvars.getValue_LatLongAltPBH(name, dataSource));
                    break;
                case "pbh":
                    output = new PitchBankHeading(Simvars.getValue_PBH(name, dataSource));
                    break;
                case "string":
                    output = Simvars.getValue_String(name, dataSource);
                    break;
                case "pid_struct":
                    output = new PID_STRUCT(Simvars.getValue_PID_STRUCT(name, dataSource));
                    break;
                case "xyz":
                    output = new XYZ(Simvars.getValue_XYZ(name, dataSource));
                    break;
                default:
                    output = Simvars.getValue(name, unit, dataSource);
            }
            if (KeepSimVarValueHistory) {
                let t = performance.now();
                let delay = t - t0;
                let history = SimVarValueHistory.find(h => {
                    return h.name === name;
                });
                if (!history) {
                    history = {name: name, invokes: 0, totalTime: 0, worstInvokeTime: 0};
                    SimVarValueHistory.push(history);
                }
                history.invokes++;
                history.totalTime += delay;
                history.worstInvokeTime = Math.max(history.worstInvokeTime, delay);
            }
            return output;
        } else
            console.warn("SimVar handler is not defined (" + name + ")");
    } catch (error) {
        console.warn("ERROR ", error, " GetSimVarValue " + name + " unit : " + unit);
        return null;
    }
    return null;
}

SimVar.SimVarBatch = class SimVarBatch {
    constructor(_simVarCount, _simVarIndex) {
        this.wantedNames = [];
        this.wantedUnits = [];
        this.wantedTypes = [];
        this.simVarCount = _simVarCount;
        this.simVarIndex = _simVarIndex;
    }

    add(_name, _unit, _type = "") {
        this.wantedNames.push(_name);
        this.wantedUnits.push(_unit);
        this.wantedTypes.push(_type);
    }

    getCount() {
        return this.simVarCount;
    }

    getIndex() {
        return this.simVarIndex;
    }

    getNames() {
        return this.wantedNames;
    }

    getUnits() {
        return this.wantedUnits;
    }

    getTypes() {
        return this.wantedTypes;
    }
}

SimVar.GetSimVarArrayValues = function GetSimVarArrayValues(simvars, callback, dataSource = "") {
    var Simvars = GetSimVars();
    if (Simvars) {
        Coherent.call("getArrayValues", simvars.getCount(), simvars.getIndex(), simvars.getNames(), simvars.getUnits(), dataSource).then(callback);
    }
}

SimVar.SetSimVarValue = function SetSimVarValue(name, unit, value, dataSource = "") {
    if (value == undefined) {
        console.warn(name + " : Trying to set a null value");
        return;
    }
    try {
        var Simvars = GetSimVars();
        if (Simvars) {
            switch (unit.toLowerCase()) {
                case "latlonalt":
                    return Coherent.call("setValue_LatLongAlt", name, (value), dataSource);
                case "latlonaltpbh":
                    return Coherent.call("setValue_LatLongAltPBH", name, (value), dataSource);
                case "pbh":
                    return Coherent.call("setValue_PBH", name, (value), dataSource);
                case "string":
                    return Coherent.call("setValue_String", name, (value), dataSource);
                case "pid_struct":
                    return Coherent.call("setValue_PID_STRUCT", name, (value), dataSource);
                case "xyz":
                    return Coherent.call("setValue_XYZ", name, (value), dataSource);
                case "bool":
                case "boolean":
                    return Coherent.call("setValue_Bool", name, (!!value), dataSource);
                default:
                    return Coherent.call("setValue_Number", name, unit, value, dataSource);
            }
        } else
            console.warn("SimVar handler is not defined");
    } catch (error) {
        console.warn("error SetSimVarValue " + error);
    }
    return new Promise(function (resolve, reject) {
        resolve();
    });
}

SimVar.GetGlobalVarValue = function GetGlobalVarValue(name, unit) {
    var Globalvars = GetGlobalVars();
    if (Globalvars) {
        var value = Globalvars.getValue(name, unit);
        return value;
    }
    return null;
}

SimVar.GetGameVarValue = function GetGameVarValue(name, unit, param1 = 0, param2 = 0) {
    name = name.replace(/\s/g, '_');
    try {
        var Gamevars = GetGameVars();
        if (Gamevars) {
            switch (unit.toLowerCase()) {
                case "string":
                    return Gamevars.getValue_String(name, param1, param2);
                case "xyz":
                    return new XYZ(Gamevars.getValue_XYZ(name, param1, param2));
                case "poilist":
                    return Gamevars.getValue_POIList(name, param1, param2);
                case "glasscockpitsettings":
                    return Gamevars.getValue_GlassCockpit(name, param1, param2);
                case "fuellevels":
                    return Gamevars.getValue_FuelLevels(name, param1, param2);
                default:
                    return Gamevars.getValue(name, unit, param1, param2);
            }
        } else
            console.warn("GameVar handler is not defined");
    } catch (error) {
        console.warn("ERROR GetGameVarValue " + name + " type : " + unit);
        return null;
    }
    return null;
}

SimVar.SetGameVarValue = function SetGameVarValue(name, unit, value) {
    if (value == undefined) {
        console.warn(name + " : Trying to set a null value");
        return;
    }
    name = name.replace(/\s/g, '_');
    try {
        var Gamevars = GetGameVars();
        if (Gamevars) {
            switch (unit.toLowerCase()) {
                case "string":
                case "xyz":
                case "poilist":
                case "glasscockpitsettings":
                case "fuellevels":
                    break;
                default:
                    return Coherent.call("setGameVar_Number", name, unit, value);
            }
        } else
            console.warn("GameVar handler is not defined");
    } catch (error) {
        console.warn("error SetGameVarValue " + error);
    }
    return new Promise(function (resolve, reject) {
        resolve();
    });
}