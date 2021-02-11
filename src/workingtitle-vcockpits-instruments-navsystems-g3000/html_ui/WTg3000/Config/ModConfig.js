class WT_g3000_ModConfig {
    constructor(config = {}) {
        this._config = config;

        this._initSections();
    }

    _initSections() {
        this._sections = {};
        this._optManagers = {};
        for (let section of WT_g3000_ModConfig.SECTIONS) {
            let sectionObj = {};
            this._sections[section.objName] = sectionObj;
            this._optManagers[section.objName] = new WT_OptionsManager(sectionObj, section.options);
            if (this._config[section.cfgName]) {
                this._optManagers[section.objName].setOptions(this._config[section.cfgName]);
            }
            let definition = {
                get() {return this._sections[section.objName];},
                configurable: true
            };
            Object.defineProperty(this, section.objName, definition);
        }
    }

    static get INSTANCE() {
        return WT_g3000_ModConfig._INSTANCE;
    }

    static async initialize() {
        let config = await new WT_g3000_ModConfigLoader().load();
        WT_g3000_ModConfig._INSTANCE = config;
    }
}
WT_g3000_ModConfig.SECTIONS = [
    {cfgName: "ROADS", objName: "roads", options: {
        quality: {default: 3, auto: true},
        showInVFRMap: {default: true, auto: true},
        loadNA: {default: true, auto: true},
        loadCA: {default: true, auto: true},
        loadSA: {default: true, auto: true},
        loadEI: {default: true, auto: true},
        loadEN: {default: true, auto: true},
        loadEW: {default: true, auto: true},
        loadEC: {default: true, auto: true},
        loadEE: {default: true, auto: true},
        loadAF: {default: true, auto: true},
        loadME: {default: true, auto: true},
        loadRU: {default: true, auto: true},
        loadAC: {default: true, auto: true},
        loadCH: {default: true, auto: true},
        loadAE: {default: true, auto: true},
        loadAS: {default: true, auto: true},
        loadOC: {default: true, auto: true}
    }}
];

class WT_g3000_ModConfigLoader {
    constructor() {
        this._config = null;
    }

    _loadConfig(data) {
        let parser = new WTIniParser();
        return new WT_g3000_ModConfig(parser.parse(data));
    }

    _openFile(resolve) {
        let path = WT_g3000_ModConfigLoader.FILE_PATH;
        let request = new XMLHttpRequest();

        request.addEventListener("load",
            (function() {
                resolve(this._loadConfig(request.responseText));
            }).bind(this)
        );
        request.addEventListener("error",
            function() {
                resolve(new WT_g3000_ModConfig());
            }
        )
        request.open("GET", path);
        request.send();
    }

    load() {
        return new Promise(resolve => {
            if (this._config) {
                resolve(this._config);
            } else {
                this._openFile(resolve);
            }
        });
    }
}
WT_g3000_ModConfigLoader.FILE_PATH = "/WTg3000.cfg";