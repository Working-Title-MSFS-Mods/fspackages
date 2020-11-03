/**********************************************************************************************************************
 * WARNING: DO NOT MODIFY THIS FILE
 *
 * ...unless you know what you're doing. This file exists to improve the development experience with an IDE like
 * Webstorm by providing declarations that come from other official packages. It is not actually used at runtime, yet.
 *
 * At some point we might want to move this to the source folder and reference it from the HTML files instead of Asobo's
 * default versions.
 **********************************************************************************************************************/

class VCockpitInstrumentData {
}
class VCockpitPanelData {
}
var globalPanelData = null;
var globalInstrumentListener = RegisterViewListener("JS_LISTENER_INSTRUMENTS");
class VCockpitPanel extends HTMLElement {
    constructor() {
        super(...arguments);
        this.data = null;
        this.curInstrumentIndex = -1;
        this.curAttributes = null;
    }
    connectedCallback() {
        if (globalPanelData) {
            this.load(globalPanelData);
        }
        var debugMouse = document.querySelector("#debugmouse");
        if (debugMouse) {
            debugMouse.style.display = "block";
            window.document.addEventListener("mousemove", (e) => {
                debugMouse.style.left = (e.clientX - 7.5) + "px";
                debugMouse.style.top = (e.clientY - 7.5) + "px";
            });
        }
    }
    disconnectedCallback() {
    }
    load(_data) {
        this.data = _data;
        this.curInstrumentIndex = -1;
        if (this.data) {
            document.title = _data.sName;
            this.setAttributes(this.data.daAttributes);
            this.loadNextInstrument();
        }
    }
    hasData() {
        return this.data != null;
    }
    setAttributes(_attributes) {
        if (this.curAttributes) {
            for (var i = 0; i < this.curAttributes.length; i++) {
                document.body.removeAttribute(this.curAttributes[i].name);
            }
        }
        this.curAttributes = _attributes;
        for (var i = 0; i < _attributes.length; i++) {
            document.body.setAttribute(_attributes[i].name, _attributes[i].value);
            if (_attributes[i].name == "quality") {
                if (_attributes[i].value == "hidden" || _attributes[i].value == "disabled") {
                    this.style.display = "none";
                }
                else {
                    this.style.display = "block";
                }
            }
        }
        window.document.dispatchEvent(new Event('OnVCockpitPanelAttributesChanged'));
    }
    registerInstrument(_instrumentName, _instrumentClass) {
        var pattern = Include.absolutePath(window.location.pathname, VCockpitPanel.instrumentRoot);
        var stillLoading = Include.isLoadingScript(pattern);
        if (stillLoading) {
            console.log("Still Loading Dependencies. Retrying...");
            setTimeout(this.registerInstrument.bind(this, _instrumentName, _instrumentClass), 500);
            return;
        }
        window.customElements.define(_instrumentName, _instrumentClass);
        console.log("Instrument registered");
        console.log("Creating instrument " + _instrumentName + "...");
        this.createInstrument(_instrumentName, _instrumentClass);
    }
    createInstrument(_instrumentName, _instrumentClass) {
        try {
            var template = document.createElement(_instrumentName);
        }
        catch (error) {
            console.error("Error while creating instrument. Retrying...");
            setTimeout(this.createInstrument.bind(this, _instrumentName, _instrumentClass), 500);
            return;
        }
        if (template) {
            console.log("Instrument created");
            this.setupInstrument(template);
            this.data.daInstruments[this.curInstrumentIndex].templateName = _instrumentName;
            this.data.daInstruments[this.curInstrumentIndex].templateClass = _instrumentClass;
            document.title += " - " + template.instrumentIdentifier;
        }
        this.loadNextInstrument();
    }
    loadNextInstrument() {
        this.curInstrumentIndex++;
        if (this.curInstrumentIndex < this.data.daInstruments.length) {
            var instrument = this.data.daInstruments[this.curInstrumentIndex];
            var url = VCockpitPanel.instrumentRoot + instrument.sUrl;
            console.log("Importing instrument " + url);
            var index = this.urlAlreadyImported(instrument.sUrl);
            if (index >= 0) {
                var instrumentName = this.data.daInstruments[index].templateName;
                var instrumentClass = this.data.daInstruments[index].templateClass;
                console.log("Instrument " + url + " already imported. Creating right now.");
                this.createInstrument(instrumentName, instrumentClass);
            }
            else {
                Include.setAsyncLoading(false);
                Include.addImport(url);
            }
        }
    }
    setupInstrument(_elem) {
        var instrument = this.data.daInstruments[this.curInstrumentIndex];
        var url = VCockpitPanel.instrumentRoot + instrument.sUrl;
        url = Include.absoluteURL(window.location.pathname, url);
        _elem.setAttribute("Guid", instrument.iGUId.toString());
        _elem.setAttribute("Url", url);
        var fRatioX = this.data.vDisplaySize.x / this.data.vLogicalSize.x;
        var fRatioY = this.data.vDisplaySize.y / this.data.vLogicalSize.y;
        var x = Math.round(instrument.vPosAndSize.x * fRatioX);
        var y = Math.round(instrument.vPosAndSize.y * fRatioY);
        var w = Math.round(instrument.vPosAndSize.z * fRatioX);
        var h = Math.round(instrument.vPosAndSize.w * fRatioY);
        if (w <= 0)
            w = 10;
        if (h <= 0)
            h = 10;
        _elem.style.position = "absolute";
        _elem.style.left = x + "px";
        _elem.style.top = y + "px";
        _elem.style.width = w + "px";
        _elem.style.height = h + "px";
        _elem.setConfigFile(this.data.sConfigFile);
        this.appendChild(_elem);
    }
    urlAlreadyImported(_url) {
        var realUrl = _url.split("?")[0];
        for (var i = 0; i < this.curInstrumentIndex; i++) {
            var isntrumentRealUrl = this.data.daInstruments[i].sUrl.split("?")[0];
            if (realUrl === isntrumentRealUrl) {
                return i;
            }
        }
        return -1;
    }
}
VCockpitPanel.instrumentRoot = "../Instruments/";
window.customElements.define("vcockpit-panel", VCockpitPanel);
function registerInstrument(_instrumentName, _instrumentClass) {
    var panel = window.document.getElementById("panel");
    if (panel) {
        console.log("Registering instrument " + _instrumentName + "...");
        panel.registerInstrument(_instrumentName, _instrumentClass);
    }
}
Coherent.on("ShowVCockpitPanel", function (_data) {
    console.log("Initializing Panel " + _data.sName);
    globalPanelData = _data;
    var panel = window.document.getElementById("panel");
    if (panel) {
        if (panel.hasData()) {
            console.log("Reloading panel...");
            window.location.reload(true);
        }
        else {
            panel.load(_data);
        }
    }
});
Coherent.on("RefreshVCockpitPanel", function (_data) {
    var panel = window.document.getElementById("panel");
    if (panel) {
        panel.setAttributes(_data.daAttributes);
    }
});
Coherent.on("OnInteractionEvent", function (_sender, _args) {
    if (!closed) {
        var panel = window.document.getElementById("panel");
        if (panel) {
            for (var i = 0; i < panel.children.length; i++) {
                var instrument = panel.children[i];
                if (instrument) {
                    if (_sender && instrument.getAttribute("Guid") != _sender)
                        continue;
                    instrument.onInteractionEvent(_args);
                }
            }
        }
    }
});
Coherent.on("StartHighlight", function (_sender, _event) {
    if (!closed) {
        var panel = window.document.getElementById("panel");
        if (panel) {
            for (var i = 0; i < panel.children.length; i++) {
                var instrument = panel.children[i];
                if (instrument) {
                    if (_sender && instrument.getAttribute("Guid") != _sender)
                        continue;
                    instrument.startHighlight(_event);
                }
            }
        }
    }
});
Coherent.on("StopHighlight", function (_sender, _event) {
    if (!closed) {
        var panel = window.document.getElementById("panel");
        if (panel) {
            for (var i = 0; i < panel.children.length; i++) {
                var instrument = panel.children[i];
                if (instrument) {
                    if (_sender && instrument.getAttribute("Guid") != _sender)
                        continue;
                    instrument.stopHighlight(_event);
                }
            }
        }
    }
});
Coherent.on("OnSoundEnd", function (_sender, _eventId) {
    if (!closed) {
        var panel = window.document.getElementById("panel");
        if (panel) {
            for (var i = 0; i < panel.children.length; i++) {
                var instrument = panel.children[i];
                if (instrument) {
                    if (_sender && instrument.getAttribute("Guid") != _sender)
                        continue;
                    instrument.onSoundEnd(_eventId);
                }
            }
        }
    }
});
Coherent.on("OnAllInstrumentsLoaded", function () {
    if (!closed) {
        BaseInstrument.allInstrumentsLoaded = true;
    }
});
checkAutoload();
//# sourceMappingURL=VCockpit.js.map