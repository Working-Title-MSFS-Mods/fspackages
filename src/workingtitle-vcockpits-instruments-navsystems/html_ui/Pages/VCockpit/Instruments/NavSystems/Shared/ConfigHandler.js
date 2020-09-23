class ConfigLoader {
    constructor(basepath) {
        let vfspath = "/VFS/" + basepath.replace(/\\/g, "/");
        let vfspathParts = vfspath.split("/");
        this._vfspath = vfspathParts.slice(0, -2).join("/")
    }

    loadIni(filename) {
        return new Promise((resolve) => {
            Utils.loadFile(`${this._vfspath}/${filename}`, (text) => {
                let parser = new CfgParser();
                let out = parser.parse(text);
                resolve(out);
            });
        });
    }

    loadXml(filename) {
        return new Promise((resolve) => {
            Utils.loadFile(`${this._vfspath}/${filename}`, (text) => {
                let parser = new DOMParser();
                let out = parser.parseFromString(text, "text/xml");
                resolve(out);
            });
        });
    }

    // The model xml files aren't properly formed because they have multiple root
    // nodes. (Seriously?)   We'll wrap them in a fake root node so that we can
    // parse them properly.  Hopefully that's actually a consistent format.
    loadFrenchXml(filename) {
        return new Promise((resolve) => {
            Utils.loadFile(`${this._vfspath}/${filename}`, (text) => {
                // This ugly regex is to remove the XML DTD
                text = text.replace(/\<\?.*\?\>/, '');
                text = `<FAKEROOT>${text}</FAKEROOT>`;
                let parser = new DOMParser();
                let out = parser.parseFromString(text, "text/xml");
                resolve(out);
            });
        });
    }

    loadRawFile(filename) {
        return new Promise((resolve) => {
            Utils.loadFile(`${this._vfspath}/${filename}`, (text) => {
                resolve(text);
            });
        });        
    }

    loadModelFile(where) {
        return new Promise((resolve, reject) => {
            this.loadIni("model/model.cfg")
                .then((cfg) => {
                    if ("models" in cfg && where in cfg.models) {
                        console.log(`Reading ${where} xml at ${cfg.models[where]}.`);
                        this.loadFrenchXml(`model/${cfg.models[where]}`).then((dom) => resolve(dom));
                    } else {
                        reject("Could not find models in model.cfg.")
                    }
                })
            .catch(() => reject("Could not load model configuration."))
        });
    }


    loadExteriorModel(where) {
        return this.loadModelFile("exterior");
    }

    loadInteriorModel(where) {
        return this.loadModelFile("interior")
    }
}


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
            let value = match[3].toLowerCase();
            if (["true", "yes", "on", "1"].includes(value)) {
                value = true
            } else if (["false", "no", "off", "0"].includes(value)) {
                value = false
            }

            ptr[key] = value;
        })

        return out;
    }
};

