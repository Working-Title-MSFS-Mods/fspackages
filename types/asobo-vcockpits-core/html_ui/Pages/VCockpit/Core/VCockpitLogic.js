/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

class VCockpitLogicInputInstrument {
}
class VCockpitLogicInputPanel {
}
class VCockpitLogicInput {
}
class VCockpitLogicOutputPanel {
    constructor() {
        this.__Type = "VCockpitLogicOutputPanel";
    }
}
class VCockpitLogicOutput {
    constructor() {
        this.__Type = "VCockpitLogicOutput";
    }
}
var globalLogicData = null;
var globalInstrumentListener = RegisterViewListener("JS_LISTENER_INSTRUMENTS");
class VCockpitLogic extends HTMLElement {
    constructor() {
        super(...arguments);
        this.data = null;
        this.connected = false;
        this.xmlConfig = null;
        this.systemsHandlers = new Array();
    }
    connectedCallback() {
        this.load(globalLogicData);
    }
    disconnectedCallback() {
    }
    load(_data) {
        if (this.connected) {
            globalLogicData = _data;
            this.killMainLoop();
            return;
        }
        this.systemsHandlers = [];
        this.data = _data;
        if (this.data) {
            console.log("Loading data...");
            this.loadXMLConfig();
        }
        globalLogicData = null;
    }
    hasData() {
        return this.data != null;
    }
    loadXMLConfig() {
        var xmlPath = "/VFS/" + this.data.sConfigFile.replace(/\\/g, "/");
        if (xmlPath) {
            console.log("Loading XML : " + xmlPath);
            var xmlRequest = new XMLHttpRequest();
            xmlRequest.onreadystatechange = function (_owner) {
                if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                    _owner.onXMLConfigLoaded(this);
                }
            }.bind(xmlRequest, this);
            xmlRequest.open("GET", xmlPath, true);
            xmlRequest.send();
        }
    }
    onXMLConfigLoaded(_xml) {
        this.xmlConfig = _xml.responseXML;
        console.log("...XML loaded");
        let found = false;
        let logicElements = this.xmlConfig.getElementsByTagName("Logic");
        for (var i = 0; i < logicElements.length; i++) {
            let typeElements = logicElements[i].getElementsByTagName("Handler");
            if (typeElements.length > 0) {
                var className = typeElements[0].textContent;
                var path = VCockpitLogic.systemsRoot + className + ".js";
                Include.addScript(path, this.onScriptReady.bind(this, className));
                found = true;
            }
        }
        if (!found)
            console.log("No logic Handlers found");
    }
    onScriptReady(_className) {
        var handler = eval("new " + _className + "()");
        if (handler) {
            console.log(_className + " created");
            handler.init(this.xmlConfig, this.data);
            this.systemsHandlers.push(handler);
            this.createMainLoop();
        }
    }
    createMainLoop() {
        if (this.connected)
            return;
        let updateLoop = () => {
            if (!this.connected) {
                console.log("Exiting MainLoop...");
                if (globalLogicData) {
                    console.log("Pending Data Found. Restarting...");
                    this.load(globalLogicData);
                }
                return;
            }
            try {
                for (var i = 0; i < this.systemsHandlers.length; i++) {
                    this.systemsHandlers[i].update();
                }
            }
            catch (Error) {
                console.error("PanelLogic : " + Error);
            }
            requestAnimationFrame(updateLoop);
        };
        this.connected = true;
        console.log("MainLoop created");
        requestAnimationFrame(updateLoop);
    }
    killMainLoop() {
        this.connected = false;
    }
}
VCockpitLogic.systemsRoot = "../Systems/";
window.customElements.define("vcockpit-logic", VCockpitLogic);
Coherent.on("InitVCockpitLogic", function (_data) {
    console.log("Initializing Logic");
    if (globalLogicData)
        console.log("Some Data are already loading. May lead to undefined behaviours");
    globalLogicData = _data;
    var panel = window.document.getElementById("logic");
    if (panel) {
        panel.load(_data);
    }
});
checkAutoload();
//# sourceMappingURL=VCockpitLogic.js.map