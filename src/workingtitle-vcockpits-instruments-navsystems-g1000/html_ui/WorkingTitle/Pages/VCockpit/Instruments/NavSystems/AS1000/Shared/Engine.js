/** class WTEngine provides Engine with fancier display pages */
class WTEngine extends Engine {
    /**
     * Creates a WTEngine and initializes early configuration
     * @constructor
     * @param {string} _name As per Engine
     * @param {string} _root As per Engine
     * @param {string} xmlConfigPath The _xmlConfigPath of the parent instrument
     */
    constructor(_name, _root, xmlConfigPath) {
        super(_name, _root);
        this._configLoader = new WTConfigLoader(xmlConfigPath);
        this.engineDisplayPages = new Subject({});
        this.selectedEnginePage = null;
        this.config = null;
        this._defaultPanelID = "ENGINE";
    }
    /** Initializes the engine instrument through its superclass */
    init() {
        super.init();
        // set the default engine page
        this.xmlConfig = this.gps.xmlConfig
        let id = this._defaultPanelID;
        let engineDisplayPages = {};
        engineDisplayPages[id] = {
            title: "Default",
            node: this.xmlConfig.getElementsByTagName("EngineDisplay"),
            buttons: []
        };
        this.engineDisplayPages.value = engineDisplayPages;
        this.selectedEnginePage = id;

        // If we can read a custom config, load that over top
        console.log("Attempting to read WT engine display config.")
        this._configLoader.loadXml("panel/WTEngineDisplay.xml").then((xmlConfig) => {
            console.log("Found WT engine display config.  Loading.")
            this.xmlConfig = xmlConfig;
            let engineDisplayPagesNodes = xmlConfig.getElementsByTagName("EngineDisplayPage");
            if (engineDisplayPagesNodes.length > 0) {
                let engineDisplayPages = {};
                let selectedId = null;
                for (let i = 0; i < engineDisplayPagesNodes.length; i++) {
                    let engineDisplayPageRoot = engineDisplayPagesNodes[i];
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
                    engineDisplayPages[id] = engineDisplayPage;
                    if (i == 0) {
                        selectedId = id;
                    }
                }
                this.engineDisplayPages.value = engineDisplayPages;
                if (selectedId)
                    this.selectEnginePage(selectedId);
            }
            console.log("WT engine display config load complete.")
        });
    }
    /**
     *  Returns all the configured engine display pages
     *  @returns {Array} A list of display pages
     */
    getEngineDisplayPages() {
        return this.engineDisplayPages.value;
    }
    /**
     * Tests whether a given page ID is selected
     * @param {string} id The ID of the page to test
     * @returns {Boolean} Whether or not the provided page ID is selected
     */
    isEnginePageSelected(id) {
        return this.selectedEnginePage == id;
    }
    /**
     * Activates a newly selected engine page
     * @param {string} id The ID of the page to select
     * @returns {Map} The configuration for the selected page 
     */
    selectEnginePage(id) {
        this.selectedEnginePage = id;
        let engineDisplayPage = this.engineDisplayPages.value[this.selectedEnginePage];

        let engineRoot = this.xmlConfig.getElementsByTagName(engineDisplayPage.node);
        if (engineRoot.length > 0) {
            this.xmlEngineDisplay.setConfiguration(this.gps, engineRoot[0]);
        }
        return engineDisplayPage;
    }
}