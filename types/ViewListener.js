/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

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