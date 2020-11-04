/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

const EBingMode = {
    CURSOR: "Cursor",
    PLANE: "Plane",
    VFR: "Vfr",
    HORIZON: "Horizon"
}

const EBingReference = {
    SEA: "Sea",
    PLANE: "Plane"
}

class BingMapsConfig {
}

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

const EmptyCallback = {
    Boolean: (result) => {
    },
    Void: () => {
    }
}

class ISvgMapRootElement extends TemplateElement {
}

class DesignSpeeds {
}

class DictionaryItem {
}

function LaunchFlowEvent(eventName, ...args) {
    if (bDebugListeners) {
        console.warn("LaunchFlowEvent " + eventName, args);
    }
    Coherent.trigger("LAUNCH_FLOW_EVENT_FROM_VIEW", eventName, ...args);
}

function RegisterViewListener(name, callback = null, requiresSingleton = false) {
    return RegisterViewListenerT(name, callback, ViewListener.ViewListener, requiresSingleton);
}

function RegisterViewListenerT(name, callback = null, type, requiresSingleton = false) {
    var register = function (url) {
        if (closed) {
            return;
        }
        var currentLocation = window.location;
        if (url == "html_ui" + currentLocation.pathname) {
            Coherent.trigger("ADD_VIEW_LISTENER", name, currentLocation.pathname);
        }
    };
    let existingListener = ViewListener.g_ViewListenersMgr.getListenerByName(name);
    if (requiresSingleton && existingListener) {
        if (existingListener.connected) {
            setTimeout(() => {
                if (callback)
                    callback();
            });
        } else {
            let existingCB = existingListener.m_onConnected;
            let callbackWrapper = () => {
                if (callback)
                    callback();
                if (existingCB)
                    existingCB();
            };
            existingListener.m_onConnected = callbackWrapper;
        }
        return existingListener;
    } else {
        let eventHandler = null;
        if (Coherent["isViewLoaded"] === true) {
            register("html_ui" + window.location.pathname);
        } else {
            eventHandler = Coherent.on("ON_VIEW_LOADED", register);
        }
        let ret = new type(name);
        ret.m_onConnected = callback;
        ret.urlCaller = window.location.pathname;
        if (window.top != window) {
            window.document.addEventListener("onClose", function () {
                if (ret.urlCaller == window.location.pathname) {
                    console.warn("ON CLOSE !" + window.location.pathname);
                    ret.unregister();
                    if (eventHandler)
                        eventHandler.clear();
                }
            });
        }
        ViewListener.g_ViewListenersMgr.onRegister(name, ret);
        if (callback && EDITION_MODE()) {
            setTimeout(() => callback());
        }
        return ret;
    }
}

function GetStoredData(_key) {
    try {
        var Storage = GetDataStorage();
        if (Storage) {
            var value = Storage.getData(_key);
            return value;
        }
    } catch (error) {
        return null;
    }
    return null;
}

function GetDataStorage() {
    if (!Coherent.isAttached)
        return null;
    if (window.frameElement) {
        return window.top["datastorage"];
    }
    return datastorage;
}

function SetStoredData(_key, _data) {
    try {
        var Storage = GetDataStorage();
        if (Storage) {
            var value = Storage.setData(_key, _data);
            return value;
        }
    } catch (error) {
        return null;
    }
    return null;
}

function GetInputStatus(_context, _action) {
    try {
        var Inputs = GetInputs();
        if (Inputs) {
            var value = Inputs.getInputStatus(_context, _action);
            return value;
        }
    } catch (error) {
        return null;
    }
    return null;
}

function GetInputs() {
    if (!Coherent.isAttached)
        return null;
    if (window.frameElement) {
        return window.top["inputs"];
    }
    return inputs;
}

function checkAutoload(forcedUrl = null) {
    var url = window.document.currentScript["src"];
    if (forcedUrl)
        url = forcedUrl;
    window.document.dispatchEvent(new CustomEvent("ResourceLoaded", {detail: url}));
}

class Name_Z {
    constructor(str, eventHandler = null) {
        this.idLow = 0;
        this.idHigh = 0;
        this.__Type = "Name_Z";
        this.originalStr = str;
        this.RequestNameZ(eventHandler);
    }

    refresh() {
        this.RequestNameZ(null);
    }

    static isValid(a) {
        if (!a)
            return false;
        if (a.str != "") {
            return a.idHigh != 0 || a.idLow != 0;
        }
        return true;
    }

    static compare(a, b) {
        if (!a || !b)
            return false;
        if (!Name_Z.isValid(a))
            console.error("Comparing A an invalid string " + a.originalStr + "/" + a.str);
        if (!Name_Z.isValid(b))
            console.error("Comparing B an invalid string " + b.originalStr + "/" + b.str);
        return a.idLow == b.idLow && a.idHigh == b.idHigh;
    }

    static compareStr(a, b) {
        if (!a)
            return false;
        if (!Name_Z.isValid(a))
            console.error("Comparing A an invalid string " + a.originalStr + "/" + a.str);
        var bAsName = new Name_Z(b);
        return a.idLow == bAsName.idLow && a.idHigh == bAsName.idHigh;
    }

    RequestNameZ(eventHandler = null) {
        if (this.originalStr) {
            if (window.top["g_nameZObject"]) {
                let ret = window.top["g_nameZObject"].GetNameZ(this.originalStr);
                this.idLow = ret.idLow;
                this.idHigh = ret.idHigh;
                this.str = ret.str;
                if (eventHandler) {
                    eventHandler();
                }
            } else {
                requestAnimationFrame(this.RequestNameZ.bind(this, eventHandler));
                Coherent.on("Ready", this.RequestNameZ.bind(this, eventHandler));
            }
        }
    }
}

class Vec2 {
    constructor(_x = 0, _y = 0) {
        this.x = _x;
        this.y = _y;
    }

    static FromRect(elem) {
        var ret = new Vec2();
        ret.x = elem.left + elem.width * 0.5;
        ret.y = elem.top + elem.height * 0.5;
        return ret;
    }

    static Delta(vec1, vec2) {
        var ret = new Vec2();
        ret.x = vec1.x - vec2.x;
        ret.y = vec1.y - vec2.y;
        return ret;
    }

    VectorTo(pt2) {
        if (pt2)
            return Vec2.Delta(pt2, this);
        else
            return new Vec2(0, 0);
    }

    toCurvePointString() {
        return `${this.x} ${this.y}`;
    }

    Dot(b) {
        return this.x * b.x + this.y * b.y;
    }
    ;

    GetNorm() {
        return Math.sqrt(this.Dot(this));
    }

    Normalize() {
        var norm = this.GetNorm();
        if (norm > 0) {
            this.x /= norm;
            this.y /= norm;
        }
    }

    SetNorm(n) {
        var norm = this.GetNorm();
        if (norm > 0) {
            var factor = n / norm;
            this.x *= factor;
            this.y *= factor;
        }
    }

    static SqrDistance(p1, p2) {
        return (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y);
    }

    static Distance(p1, p2) {
        return Math.sqrt(Vec2.SqrDistance(p1, p2));
    }
}

class SortedList {
    constructor() {
        this._list = [];
    }

    get length() {
        return this._list.length;
    }

    clear() {
        this._list = [];
    }

    add(e, from = 0, to = NaN) {
        if (from >= this.length) {
            let ec = e.clone();
            this._list.push(ec);
            return ec;
        }
        if (isNaN(to)) {
            to = this.length;
        }
        let i = Math.floor((from + to) * 0.5);
        let comparison = e.compare(this._list[i]);
        if (comparison === 0) {
            return this._list[i];
        }
        if (i === from) {
            if (comparison < 0) {
                let ec = e.clone();
                this._list.splice(i, 0, ec);
                return ec;
            } else {
                let ec = e.clone();
                this._list.splice(i + 1, 0, ec);
                return ec;
            }
        }
        if (comparison < 0) {
            return this.add(e, from, i);
        } else {
            return this.add(e, i + 1, to);
        }
    }

    get(i) {
        return this._list[i];
    }
}

const ViewListener = {}

ViewListener.ViewListener = class ViewListener {
    constructor(name) {
        this.connected = false;
        this.CheckCoherentEvent = (listenerName, ...args) => {
            var testListenerName = listenerName.toUpperCase();
            if (testListenerName == this.m_name) {
                var eventName = args[0];
                if (this.m_handlers) {
                    let i = 0;
                    do {
                        let h = this.m_handlers[i];
                        if (h.name == eventName) {
                            let slicedArgs = args.slice(1);
                            if (h.context)
                                h.callback(h.context, ...slicedArgs);
                            else
                                h.callback(...slicedArgs);
                        }
                        ++i;
                    } while (this.m_handlers && i < this.m_handlers.length);
                }
            }
        };
        this.unregister = () => {
            if (this.m_handlers) {
                for (let handler of this.m_handlers) {
                    handler.globalEventHandler.clear();
                }
                this.m_handlers = null;
            }
            ViewListener_1.g_ViewListenersMgr.onUnregister(this.m_name, this);
        };
        this.onEventToAllSubscribers = (eventName, ...args) => {
            let argsObj = [];
            for (let arg of args) {
                let obj = JSON.parse(arg);
                argsObj.push(obj);
            }
            Coherent.trigger(eventName, ...argsObj);
        };
        this.m_name = name.toUpperCase();
        Coherent.on("EVENT_FROM_VIEW_LISTENER", this.CheckCoherentEvent);
        this.on("ON_EVENT_TO_ALL_SUBSCRIBERS", this.onEventToAllSubscribers);
    }

    onGlobalEvent(eventName, ...args) {
        for (let handler of this.m_handlers) {
            if (handler.name == eventName) {
                if (handler.context)
                    handler.callback(handler.context, ...args);
                else
                    handler.callback(...args);
            }
        }
    }

    off(name, callback, context) {
        if (this.m_handlers) {
            for (let handler of this.m_handlers) {
                if (handler.name == name && handler.callback == callback && handler.context == context) {
                    handler.globalEventHandler.clear();
                }
            }
        }
        Coherent.off(name, callback, context);
        if (!this.m_handlers)
            return;
        for (var i = this.m_handlers.length - 1; i >= 0; i--) {
            if (this.m_handlers[i].name == name) {
                if (this.m_handlers[i].callback == callback) {
                    if (this.m_handlers[i].context == context) {
                        this.m_handlers.splice(i, 1);
                    }
                }
            }
        }
    }

    on(name, callback, context) {
        if (!this.m_handlers)
            this.m_handlers = [];
        for (let handle of this.m_handlers) {
            if (handle.name === name && handle.callback === callback) {
                if ((!context && !handle.context) || (context && handle.context && context === handle.context)) {
                    return;
                }
            }
        }
        this.m_handlers.push({
            name: name,
            callback: callback,
            context: context,
            globalEventHandler: Coherent.on(name, this.onGlobalEvent.bind(this, name))
        });
    }

    trigger(name, ...args) {
        if (bDebugListeners) {
            console.warn("TRIGGER " + name, args);
        }
        Coherent.trigger("EVENT_TO_VIEW_LISTENER", this.m_name, name, ...args);
    }

    triggerToAllSubscribers(event, ...args) {
        let argsJson = [];
        for (let arg of args) {
            let json = JSON.stringify(arg);
            argsJson.push(json);
        }
        Coherent.trigger("TRIGGER_EVENT_TO_ALL_SUBSCRIBERS", this.m_name, event, ...argsJson);
    }
}

ViewListener.ViewListenerMgr = class ViewListenerMgr {
    constructor() {
        this.m_hash = {};
        this.OnListenerRegistered = (name) => {
            if (!this.m_hash)
                return;
            let names = Object.getOwnPropertyNames(this.m_hash);
            for (let name of names) {
                let vlArray = this.m_hash[name];
                if (vlArray.name == name) {
                    let registeredViewListeners = vlArray.array;
                    if (registeredViewListeners) {
                        for (let i = 0; i < registeredViewListeners.length; i++) {
                            let viewListener = registeredViewListeners[i];
                            if (viewListener) {
                                if (viewListener.m_onConnected) {
                                    viewListener.connected = true;
                                    setTimeout(() => {
                                        if (viewListener.m_onConnected) {
                                            viewListener.m_onConnected();
                                            viewListener.m_onConnected = null;
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
            }
        };
        Coherent.on("VIEW_LISTENER_REGISTERED", this.OnListenerRegistered);
    }

    onRegister(name, vl) {
        let vlArray = null;
        if (!this.m_hash.hasOwnProperty(name)) {
            vlArray = new ViewListenerArray();
            vlArray.name = name;
            this.m_hash[name] = vlArray;
        }
        this.m_hash[name].array.push(vl);
    }

    getListenerByName(name) {
        let listeners = this.m_hash[name];
        return listeners && listeners.array.length > 0 ? listeners.array[0] : null;
    }

    onUnregister(name, vl, force = false) {
        if (this.m_hash.hasOwnProperty(name)) {
            let registered = this.m_hash[name];
            if (registered.array.length > 0) {
                for (let i = registered.array.length - 1; i >= 0; i--) {
                    if (vl.urlCaller == window.location.pathname) {
                        let res = registered.array[i] == vl;
                        if (res) {
                            registered.array.splice(i, 1);
                        }
                    }
                }
                if (registered.array.length == 0 || force) {
                    Coherent.trigger("REMOVE_VIEW_LISTENER", name, window.location.pathname);
                }
            }
        }
    }
}

ViewListener.g_ViewListenersMgr = new ViewListenerMgr()

const EWeatherRadar = {
    HORIZONTAL: "Horizontal",
    OFF: "Off",
    TOPVIEW: "Topview",
    VERTICAL: "Vertical"
}