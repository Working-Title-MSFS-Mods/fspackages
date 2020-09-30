/** class WTConfigLoader loads game data in several text formats. */
class WTConfigLoader {
    /**
     * Creates an instance of ConfigLoader
     * @constructor
     * @param {string} basepath The instrument's _xmlConfigPath 
     */
    constructor(basepath) {
        let vfspath = "/VFS/" + basepath.replace(/\\/g, "/");
        let vfspathParts = vfspath.split("/");
        this._vfspath = vfspathParts.slice(0, -2).join("/")
    }

    /**
     * Parses an INI-style configuration file
     * @param {string} filename Path to the file relative to aircraft's top-level directory
     * @returns {Promise} A map containing the sections and k/v pairs of the ini file
     */
    loadIni(filename) {
        return new Promise((resolve) => {
            Utils.loadFile(`${this._vfspath}/${filename}`, (text) => {
                let parser = new WTIniParser();
                let out = parser.parse(text);
                resolve(out);
            });
        });
    }

    /**
     * Parses a basic XML file
     * @param {string} filename Path to the file relative to aircraft's top-level directory
     * @returns {Promise} An XMLDocument representation of the file's contents
     */
    loadXml(filename) {
        return new Promise((resolve) => {
            Utils.loadFile(`${this._vfspath}/${filename}`, (text) => {
                let parser = new DOMParser();
                let out = parser.parseFromString(text, "text/xml");
                resolve(out);
            });
        });
    }

    /**
     * Parses an XML file with multiple root nodes
     * @param {string} filename Path to the file relative to aircraft's top-level directory
     * @returns {Promise} An XMLDocument representing the file's contents wrapped in a FAKEROOT tag
     */
    loadFrenchXml(filename) {
        // The model xml files aren't properly formed because they have multiple root
        // nodes. (Seriously?)   We'll wrap them in a fake root node so that we can
        // parse them properly.  Hopefully that's actually a consistent format.
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

    /**
     * Opens and returns the text of any arbitrary file
     * @param {string} filename Path to the file relative to aircraft's top-level directory
     * @returns {Promise} The contents of the file as a string
     */
    loadRawFile(filename) {
        return new Promise((resolve) => {
            Utils.loadFile(`${this._vfspath}/${filename}`, (text) => {
                resolve(text);
            });
        });        
    }

    /**
     * Finds and returns an XML model definition
     * @param {string} where Whether to load the 'interior' or 'exterior' model 
     * @returns {Promise} An XMLDocument representing the model's definition wrapped in a FAKEROOT tag
     */
    loadModelFile(where) {
        return new Promise((resolve, reject) => {
            this.loadIni("model/model.cfg")
                .then((cfg) => {
                    if ("models" in cfg && where in cfg.models) {
                        console.log(`Reading ${where} xml at ${cfg.models[where]}.`);
                        this.loadXml(`model/${cfg.models[where]}`).then((dom) => resolve(dom));
                    } else {
                        reject("Could not find models in model.cfg.")
                    }
                })
            .catch(() => reject("Could not load model configuration."))
        });
    }

    /**
     * Convenience function to get a plane's exterior model definition
     * @returns {Promise}  An XMLDocument representing the model's definition wrapped in a FAKEROOT tag
     */
    loadExteriorModel() {
        return this.loadModelFile("exterior");
    }
    /**
     * Convenience function to get a plane's interior model definition
     * @returns {Promise}  An XMLDocument representing the model's definition wrapped in a FAKEROOT tag
     */
    loadInteriorModel() {
        return this.loadModelFile("interior")
    }
}


/** class WTIniParser processes an ini-style configuration text */
class WTIniParser {
    /**
     * Parses an ini-style text block into a map
     * @param {string} iniString The ini content as text 
     * @returns {Map} The sections and k/v pairs of the ini file
     */
    parse(iniString) {
        var out = {};

        var ptr = out;
        var section = null;

        var re = /^\[([^\]]*)\]$|^([^=\s]+)\s*= *([^#\s]+)/i;
        var lines = iniString.split(/[\r\n]+/g);

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

