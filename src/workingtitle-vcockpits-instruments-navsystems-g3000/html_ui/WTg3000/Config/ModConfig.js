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
        return config;
    }
}
WT_g3000_ModConfig.SECTIONS = [
    {cfgName: "TRAFFIC", objName: "traffic", options: {
        useTrafficService: {default: false, auto: true},
        trafficServicePort: {default: 8383, auto: true}
    }},
    {cfgName: "VFRMAP", objName: "vfrMap", options: {
        useCustom: {default: true, auto: true}
    }},
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
        loadRU: {default: true, auto: true},
        loadAC: {default: true, auto: true},
        loadCH: {default: true, auto: true},
        loadAE: {default: true, auto: true},
        loadAS: {default: true, auto: true},
        loadOC: {default: true, auto: true}
    }},
    {cfgName: "TBM_930_REFERENCES", objName: "tbm930References", options: {
        vmo: {default: [[0, 266]], auto: true},
        vr: {default: 90, auto: true},
        vy: {default: 124, auto: true},
        vx: {default: 100, auto: true},
        vapp: {default: 85, auto: true},
        vglide: {default: 120, auto: true},
        vle: {default: 178, auto: true},
        vfe: {default: [178, 122], auto: true},
        aoaZeroLift: {default: -3.6, auto: true},
        aoaCritical: {default: 15, auto: true}
    }},
    {cfgName: "CITATION_LONGITUDE_REFERENCES", objName: "longitudeReferences", options: {
        vmo: {default: [[0, 290], [8000, 325]], auto: true},
        mmo: {default: 0.84, auto: true},
        crossover: {default: 29375, auto: true},
        v1: {default: 110, auto: true},
        vr: {default: 120, auto: true},
        v2: {default: 137, auto: true},
        vfto: {default: 180, auto: true},
        vapp: {default: 115, auto: true},
        vref: {default: 108, auto: true},
        vno: {default: 235, auto: true},
        mno: {default: 0.75, auto: true},
        vle: {default: 230, auto: true},
        vfe: {default: [250, 230, 180], auto: true},
        aoaZeroLift: {default: -3, auto: true},
        aoaCritical: {default: 13, auto: true},
        clbN1: {default: [[0, 0, 0.95]], auto: true},
        cruN1: {default: [[0, 0, 0.85]], auto: true}
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