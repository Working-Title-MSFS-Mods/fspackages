class ConfigLoader {
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
            console.log(text)
            let out = parser.parseFromString(text, "text/xml");
            cb(out);
        })

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