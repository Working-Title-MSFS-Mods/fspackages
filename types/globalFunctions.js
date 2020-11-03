/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

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
