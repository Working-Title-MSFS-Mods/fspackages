class ConfigLoader {
    // This class kind of became callback hell without me meaning for it to.
    // TODO:  make it less of a callback hell
    constructor(basepath) {
        let vfspath = "/VFS/" + basepath.replace(/\\/g, "/");
        let vfspathParts = vfspath.split("/");
        this._vfspath = vfspathParts.slice(0, -2).join("/")
    }

    loadCfg(filename, cb) {
        Utils.loadFile(`${this._vfspath}/${filename}`, (text) => {
            let parser = new CfgParser()
            let out = parser.parse(text);
            cb(out);
        })
    }

    loadXml(filename, cb) {
        Utils.loadFile(`${this._vfspath}/${filename}`, (text) => {
            let parser = new DOMParser();
            let out = parser.parseFromString(text, "text/xml");
            cb(out);
        })
    }

    // The model xml files aren't properly formed because they have multiple root
    // nodes. (Seriously?)   We'll wrap them in a fake root node so that we can
    // parse them properly.  Hopefully that's actually a consistent format.
    loadFrenchXml(filename, cb) {
        Utils.loadFile(`${this._vfspath}/${filename}`, (text) => {
            text = text.replace(/\<\?.*\?\>/, '');
            text = `<FAKEROOT>${text}</FAKEROOT>`;
            let parser = new DOMParser();
            let out = parser.parseFromString(text, "text/xml");
            cb(out);
        })  
    }

    loadRawFile(filename, cb) {
        Utils.loadFile(`${this._vfspath}/${filename}`, (text) => {cb(text)})
    }

    loadModelFile(where, cb) {
        this.loadCfg("model/model.cfg", (cfg) => {
            if ("models" in cfg && where in cfg.models) {
                console.log(`Reading ${where} xml at ${cfg.models[where]}.`)
                this.loadFrenchXml(`model/${cfg.models[where]}`, cb)
            }
        })

    }

    loadExteriorModel(cb) {
        this.loadModelFile("exterior", cb);
    }

    loadInteriorModel(cb) {
        this.loadModelFile("interior", cb)
    }
};

class CfgParser {
    parse(cfgString) {
        var out = {};

        var ptr = out;
        var section = null;

        var re = /^\[([^\]]*)\]$|^([^=\s]+)\s*= *([^#\s]+)/i;
        var lines = cfgString.split(/[\r\n]+/g);

        lines.forEach((line, crap, morecrap) => {
            // skip blank likes and comments
            if (!line || line.match(/^\s*#/)) {
                return;
            }
            // skip anything that's not the expected pattern
            let match = line.match(re);
            if (!match) {
                return;
            }
            // if the first group matches, we have a section header
            if (match[1] !== undefined) {
                section = match[1];
                ptr = out[section] = out[section] || {};
                return;
            }
            
            let key = match[2];
            let value = match[3];
            if (["true", "yes", "on", "1"].includes(value)) {
                value = true
            } else if (["false", "no", "off", "1"].includes(value)) {
                value = false
            }

            ptr[key] = value;
        })

        return out;
    }
};

