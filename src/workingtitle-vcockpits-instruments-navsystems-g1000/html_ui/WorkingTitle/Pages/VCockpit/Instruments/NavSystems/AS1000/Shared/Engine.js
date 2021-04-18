/** class WTEngine provides Engine with fancier display pages */
class WTEngine extends Engine {
    /**
     * Creates a WTEngine and initializes early configuration
     * @constructor
     * @param {string} _name As per Engine
     * @param {string} _root As per Engine
     * @param {string} xmlConfigPath The _xmlConfigPath of the parent instrument
     */
    constructor(_name, _root) {
        super(_name, _root);
        this.engineDisplayPages = [];
        this.selectedEnginePage = null;
        this.config = null;
        this._defaultPanelID = "ENGINE";
    }
    /** Initializes the engine instrument through its superclass */
    init() {
        super.init();
        // set the default engine page
        this.xmlConfig = this.gps.xmlConfig;
        let id = this._defaultPanelID;
        let engineDisplayPages = this.xmlConfig.getElementsByTagName("EngineDisplayPage");
        if (engineDisplayPages.length == 0) {
            engineDisplayPages = this.xmlConfig.getElementsByTagName("EngineDisplay");
            this.engineDisplayPages[id] = {
                title: "Default",
                node: this.xmlConfig.getElementsByTagName("EngineDisplay"),
                buttons: []
            };
            this.selectedEnginePage = id;
        } else {
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
                if (i == 0) {
                    this.selectEnginePage(id);
                }
            };
        }
    }
    /**
     *  Returns all the configured engine display pages
     *  @returns {Array} A list of display pages
     */
    getEngineDisplayPages() {
        return this.engineDisplayPages;
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