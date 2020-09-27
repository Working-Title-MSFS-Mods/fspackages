class WTEngine extends Engine {
    constructor(_name, _root, xmlConfigPath) {
        super(_name, _root);
        this._configLoader = new WTConfigLoader(xmlConfigPath); 
        this.engineDisplayPages = [];
        this.selectedEnginePage = null;
        this.config = null;
    }
    init() {
        super.init();
        // set the default engine page
        this.xmlConfig = this.gps.xmlConfig
        let id = "DFLT";
        this.engineDisplayPages[id] = {
            title: "Default",
            node: this.xmlConfig.getElementsByTagName("EngineDisplay"),
            buttons: []
        };
        this.selectedEnginePage = id;

        // If we can read a custom config, load that over top
        console.log("Attempting to read WT engine display config.")
        this._configLoader.loadXml("panel/WTEngineDisplay.xml").then((xmlConfig) => {
            console.log("Found WT engine display config.  Loading.")
            this.xmlConfig = xmlConfig;
            let engineDisplayPages = xmlConfig.getElementsByTagName("EngineDisplayPage");
            if (engineDisplayPages.length > 0) {
                for (let i = 0; i < engineDisplayPages.length; i++) {
                    let engineDisplayPageRoot = engineDisplayPages[i];
                    let id = engineDisplayPageRoot.getElementsByTagName("ID")[0].textContent;
                    let engineDisplayPage = {
                        title: engineDisplayPageRoot.getElementsByTagName("Title")[0].textContent,
                        node: engineDisplayPageRoot.getElementsByTagName("Node")[0].textContent,
                        buttons: []
                    };
                    let buttonNodes = engineDisplayPageRoot.getElementsByTagName("Button");
                    for (let buttonNode of buttonNodes) {
                        engineDisplayPage.buttons.push({
                            text: buttonNode.getElementsByTagName("Text")[0].textContent
                        });
                    }
                    this.engineDisplayPages[id] = engineDisplayPage;
                    if (this.selectedEnginePage == null) {
                        this.selectedEnginePage = id;
                    }
                }
            }
            console.log("WT engine display config load complete.")
        });
    }
    getEngineDisplayPages() {
        return this.engineDisplayPages;
    }
    isEnginePageSelected(id) {
        return this.selectedEnginePage == id;
    }
    selectEnginePage(id) {
        console.log("Changed to page " + id);
        this.selectedEnginePage = id;
        let engineDisplayPage = this.engineDisplayPages[this.selectedEnginePage];

        let engineRoot = this.xmlConfig.getElementsByTagName(engineDisplayPage.node);
        if (engineRoot.length > 0) {
            this.xmlEngineDisplay.setConfiguration(this.gps, engineRoot[0]);
        }
        return engineDisplayPage;
    }
}