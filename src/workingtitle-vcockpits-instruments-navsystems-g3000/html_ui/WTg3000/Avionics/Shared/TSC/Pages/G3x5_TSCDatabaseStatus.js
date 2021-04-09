class WT_G3x5_TSCDatabaseStatus extends WT_G3x5_TSCPageElement {
    /**
     * @param {String} homePageGroup
     * @param {String} homePageName
     * @param {WT_NavigraphAPI} navigraphAPI
     */
    constructor(homePageGroup, homePageName, navigraphAPI) {
        super(homePageGroup, homePageName);

        this._navigraphAPI = navigraphAPI;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCDatabaseStatusHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _initNavigraphLinkPopUp() {
        this._navigraphLinkWindow = new NavSystemElementContainer("Navigraph Link", "NavigraphLink", new WT_G3x5_TSCNavigraphLink(this._navigraphAPI));
        this._navigraphLinkWindow.setGPS(this.instrument);
        this._navigraphLinkWindow.element.setContext({homePageGroup: this.homePageGroup, homePageName: this.homePageName});
    }

    _createHTMLElement() {
        return new WT_G3x5_TSCDatabaseStatusHTMLElement();
    }

    _initNavigraphRow(row) {
        row.setContext({
            title: "Navigraph Charts",
            navigraphAPI: this._navigraphAPI
        });

        row.addButtonListener(this._onNavigraphButtonPressed.bind(this));
        row.update();
    }

    async _initRows() {
        await WT_Wait.awaitCallback(() => this.htmlElement.isInitialized, this);
        this._initNavigraphRow(this.htmlElement.navigraphRow);
    }

    init(root) {
        this._initNavigraphLinkPopUp();

        this.container.title = WT_G3x5_TSCDatabaseStatus.TITLE;
        this._htmlElement = this._createHTMLElement();
        root.appendChild(this.htmlElement);

        this._initRows();
    }

    _openNavigraphLinkWindow(button) {
        this.instrument.switchToPopUpPage(this._navigraphLinkWindow);
    }

    _onNavigraphButtonPressed(button) {
        this._openNavigraphLinkWindow(button);
    }

    onEnter() {
        super.onEnter();

        this.htmlElement.open();
    }

    onExit() {
        super.onExit();

        this.htmlElement.close();
    }
}
WT_G3x5_TSCDatabaseStatus.TITLE = "Database Status";

class WT_G3x5_TSCDatabaseStatusHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCDatabaseStatusHTMLElement.TEMPLATE;
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get isInitialized() {
        return this._isInit;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCDatabaseStatusNavigraphRowButton}
     */
    get navigraphRow() {
        return this._navigraphRow;
    }

    async _defineChildren() {
        this._navigraphRow = await WT_CustomElementSelector.select(this.shadowRoot, `#chartsrow`);
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _updateRows() {
        this.navigraphRow.update();
    }

    open() {
        if (!this._isInit) {
            return;
        }

        this._updateRows();
    }

    close() {
    }
}
WT_G3x5_TSCDatabaseStatusHTMLElement.NAME = "wt-tsc-databasestatus";
WT_G3x5_TSCDatabaseStatusHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCDatabaseStatusHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            color: white;
            display: grid;
            grid-template-columns: 100%;
            grid-template-rows: var(--databasestatus-header-height, 15%) 1fr;
            grid-gap: var(--databasestatus-header-table-margin, 1px) 0;
        }
            #header {
                position: relative;
                border-radius: 3px;
                background-color: black;
                border: 1px solid var(--wt-g3x5-bordergray);
            }
                #headertext {
                    width: 100%;
                    margin: 0.2em;
                    text-align: center;
                    font-size: var(--databasestatus-header-font-size, 1.2em);
                }
            #tablecontainer {
                position: relative;
                border-radius: 3px;
                background: linear-gradient(#1f3445, black 25px);
                background-color: black;
                border: 3px solid var(--wt-g3x5-bordergray);
            }
                #table {
                    position: absolute;
                    left: var(--databasestatus-table-padding-left, 0.1em);
                    top: var(--databasestatus-table-padding-top, 0.1em);
                    width: calc(100% - var(--databasestatus-table-padding-left, 0.1em) - var(--databasestatus-table-padding-right, 0.1em));
                    height: calc(100% - var(--databasestatus-table-padding-top, 0.1em) - var(--databasestatus-table-padding-bottom, 0.1em));
                }
                    #tableheader {
                        position: absolute;
                        left: 0%;
                        top: 0%;
                        width: calc(100% - var(--scrolllist-scrollbar-width, 1vw));
                        height: var(--databasestatus-table-header-height, 15%);
                        display: grid;
                        grid-template-rows: 100%;
                        grid-template-columns: var(--databasestatus-table-titlecol-width, 25%) var(--databasestatus-table-standbycol-width, 37.5%) var(--databasestatus-table-activecol-width, 37.5%);
                    }
                        .tableHeaderItem {
                            text-align: center;
                        }
                        .tableHeaderSub {
                            font-size: 0.85em;
                        }
                    #tablerows {
                        position: absolute;
                        left: 0%;
                        top: var(--databasestatus-table-header-height, 15%);
                        width: 100%;
                        height: calc(100% - var(--databasestatus-table-header-height, 15%));
                        --scrolllist-padding-left: 0px;
                        --scrolllist-padding-right: 0px;
                        --scrolllist-padding-top: 0px;
                        --scrolllist-padding-bottom: 0px;
                        --scrolllist-align-items: stretch;
                    }
                        .tableRow {
                            height: var(--databasestatus-table-row-height, 4em);
                        }
    </style>
    <div id="wrapper">
        <div id="header">
            <div id="headertext">Databases Ready</div>
        </div>
        <div id="tablecontainer">
            <div id="table">
                <div id="tableheader">
                    <div id="tableheadertitle" class="tableHeaderItem">Database</div>
                    <div id="tableheaderstandby" class="tableHeaderItem">
                        Standby<br><span class="tableHeaderSub">(effective)</span>
                    </div>
                    <div id="tableheaderactive" class="tableHeaderItem">
                        Active<br><span class="tableHeaderSub">(expires)</span>
                    </div>
                </div>
                <wt-tsc-scrolllist id="tablerows">
                    <wt-tsc-button-databasestatus-row-navigraph slot="content" id="chartsrow" class="tableRow"></wt-tsc-button-databasestatus-row-navigraph>
                </wt-tsc-scrolllist>
            </div>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCDatabaseStatusHTMLElement.NAME, WT_G3x5_TSCDatabaseStatusHTMLElement);

class WT_G3x5_TSCDatabaseStatusRowButton extends WT_TSCButton {
    constructor() {
        super();

        this._context = null;
        this._isInit = false;
    }

    _createWrapperStyle() {
        return `
            #wrapper {
                position: absolute;
                left: 1%;
                top: 1%;
                width: 99%;
                height: 99%;
                display: grid;
                grid-template-rows: 100%;
                grid-template-columns: var(--databasestatus-table-titlecol-width, 25%) var(--databasestatus-table-standbycol-width, 37.5%) var(--databasestatus-table-activecol-width, 37.5%);
                justify-items: center;
                align-items: center;
            }
        `;
    }

    _createTitleStyle() {
        return `
            #title {
                font-size: 0.85em;
            }
        `;
    }

    _createStandbyStyle() {
        return "";
    }

    _createActiveStyle() {
        return "";
    }

    _createStyle() {
        let style = super._createStyle();

        let titleStyle = this._createTitleStyle();
        let standbyStyle = this._createStandbyStyle();
        let activeStyle = this._createActiveStyle();

        return`
            ${style}
            ${titleStyle}
            ${standbyStyle}
            ${activeStyle}
        `;
    }

    _appendChildren() {
        this._title = document.createElement("div");
        this._title.id = "title";
        this._standby = document.createElement("div");
        this._standby.id = "standby";
        this._active = document.createElement("div");
        this._active.id = "active";

        this._wrapper.appendChild(this._title);
        this._wrapper.appendChild(this._standby);
        this._wrapper.appendChild(this._active);
    }

    connectedCallback() {
        super.connectedCallback();
        this._isInit = true;

        if (this._context) {
            this._updateFromContext();
        }
    }

    _clearDisplay() {
        this._title.textContent = "";
    }

    _updateTitle() {
        this._title.textContent = this._context.title;
    }

    _updateDisplayFromContext() {
        this._updateTitle();
    }

    _updateFromContext() {
        if (!this._context) {
            this._clearDisplay();
        } else {
            this._updateDisplayFromContext();
        }
    }

    setContext(context) {
        this._context = context;
        if (this._isInit) {
            this._updateFromContext();
        }
    }

    update() {
    }
}

class WT_G3x5_TSCDatabaseStatusNavigraphRowButton extends WT_G3x5_TSCDatabaseStatusRowButton {
    constructor() {
        super();

        this._updateID = 0;
    }

    _updateStandby(isAccountLinked, isAccessAvail) {
        this._standby.textContent = isAccountLinked ? "Available" : "None";
    }

    _updateActive(isAccountLinked, isAccessAvail) {
        this._active.textContent = isAccessAvail ? "Available" : "None";
    }

    async _doUpdate() {
        let updateID = ++this._updateID;
        let navigraphAPI = this._context.navigraphAPI;
        let isAccountLinked = navigraphAPI.isAccountLinked;
        let isAccessAvail = await navigraphAPI.validateToken();

        if (updateID !== this._updateID) {
            return;
        }

        this._updateStandby(isAccountLinked, isAccessAvail);
        this._updateActive(isAccountLinked, isAccessAvail);
    }

    update() {
        if (!this._isInit || !this._context) {
            return;
        }

        this._doUpdate();
    }
}
WT_G3x5_TSCDatabaseStatusNavigraphRowButton.NAME = "wt-tsc-button-databasestatus-row-navigraph";

customElements.define(WT_G3x5_TSCDatabaseStatusNavigraphRowButton.NAME, WT_G3x5_TSCDatabaseStatusNavigraphRowButton);