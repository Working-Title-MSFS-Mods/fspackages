class WT_G3x5_TSCSpeedBugs extends WT_G3x5_TSCPageElement {
    constructor(speedBugID) {
        super(null, null);

        this._speedBugID = speedBugID;
    }

    _createSpeedBugCollection() {
    }

    _createTabDefinitions() {
    }

    /**
     * @readonly
     * @property {String} homePageGroup
     * @type {String}
     */
     get homePageGroup() {
        return this.instrument.getCurrentPageGroup().name;
    }

    /**
     * @readonly
     * @property {String} homePageName
     * @type {String}
     */
    get homePageName() {
        return `${this.homePageGroup} Home`;
    }

    /**
     * @readonly
     * @property {WT_SpeedBugCollection}
     * @type {WT_SpeedBugCollection}
     */
    get speedBugCollection() {
        return this._speedBugCollection;
    }

    /**
     * @readonly
     * @property {{title:String, speedBugs:WT_SpeedBug[]}[]} tabDefinitions
     * @type {{title:String, speedBugs:WT_SpeedBug[]}[]}
     */
    get tabDefinitions() {
        return this._tabDefinitions;
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCSpeedBugHTMLElement} htmlElement
     * @type {WT_G3x5_TSCSpeedBugsHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createHTMLElement() {
        return new WT_G3x5_TSCSpeedBugsHTMLElement();
    }

    init(root) {
        this._speedBugCollection = this._createSpeedBugCollection();
        this._tabDefinitions = this._createTabDefinitions();

        this._htmlElement = this._createHTMLElement();
        this.htmlElement.setParentPage(this);
        root.appendChild(this.htmlElement);
    }

    onUpdate(deltaTime) {
        this.htmlElement.update();
    }
}

class WT_G3x5_TSCSpeedBugsHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCSpeedBugsHTMLElement.TEMPLATE;
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCSpeedBug} parentPage
     * @type {WT_G3x5_TSCSpeedBugs}
     */
    get parentPage() {
        return this._parentPage;
    }

    /**
     *
     * @param {{title:String, speedBugs:WT_SpeedBug[]}} tabDef
     */
    _initTab(tabDef) {
        let tab = new WT_G3x5_TSCSpeedBugsTab(tabDef.title, this.parentPage, tabDef.speedBugs);
        this._tabbedContent.addTab(tab);
    }

    _initTabs() {
        let tabDefs = this.parentPage.tabDefinitions;
        tabDefs.forEach(this._initTab.bind(this));
        this._tabbedContent.setActiveTabIndex(0);
    }

    _initTabbedContent() {
        this._tabbedContent = new WT_G3x5_TSCTabbedView();
        this._initTabs();

        this._tabbedContent.slot = "content";
        this.appendChild(this._tabbedContent);
    }

    _initDefaultButton() {
        this._defaultButton = new WT_TSCLabeledButton();
        this._defaultButton.labelText = "Restore All Defaults";
        this._defaultButton.classList.add(WT_G3x5_TSCSpeedBugsHTMLElement.DEFAULT_BUTTON_CLASS);
        this._defaultButton.slot = "content";
        this.appendChild(this._defaultButton);

        this._defaultButton.addButtonListener(this._onDefaultButtonPressed.bind(this));
    }

    connectedCallback() {
        this._initTabbedContent();
        this._initDefaultButton();
        this._isInit = true;
    }

    setParentPage(page) {
        this._parentPage = page;
    }

    /**
     *
     * @param {WT_G3x5_TSCSpeedBugsTab} tab
     */
    _setBugsToDefault(tab) {
        if (!tab) {
            return;
        }

        tab.speedBugs.forEach(bug => bug.setSpeed(bug.defaultSpeed));
    }

    _onDefaultButtonPressed(button) {
        this._setBugsToDefault(this._tabbedContent.getActiveTab());
    }

    selectTab(index) {
        this._tabbedContent.setActiveTabIndex(index);
    }

    update() {
        if (!this._isInit) {
            return;
        }

        this._tabbedContent.getActiveTab().update();
    }
}
WT_G3x5_TSCSpeedBugsHTMLElement.DEFAULT_BUTTON_CLASS = "speedBugsDefaultButton";
WT_G3x5_TSCSpeedBugsHTMLElement.NAME = "wt-tsc-speedbugs";
WT_G3x5_TSCSpeedBugsHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCSpeedBugsHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #content {
            display: block;
            width: 100%;
            height: 100%;
        }
    </style>
    <slot name="content" id="content"></slot>
`;

customElements.define(WT_G3x5_TSCSpeedBugsHTMLElement.NAME, WT_G3x5_TSCSpeedBugsHTMLElement);

class WT_G3x5_TSCSpeedBugsTab extends WT_G3x5_TSCTabContent {
    /**
     * @param {String} title
     * @param {WT_G3x5_TSCSpeedBug} parentPage
     * @param {WT_SpeedBug[]} speedBugs
     */
    constructor(title, parentPage, speedBugs) {
        super(title);

        this._parentPage = parentPage;
        this._speedBugs = speedBugs;
        this._htmlElement = this._createHTMLElement();
        this._htmlElement.setParent(this);
    }

    _createHTMLElement() {
        return new WT_G3x5_TSCSpeedBugsTabHTMLElement();
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCSpeedBug} parentPage
     * @type {WT_G3x5_TSCSpeedBugs}
     */
    get parentPage() {
        return this._parentPage;
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCSpeedBugsTabHTMLElement} htmlElement
     * @type {WT_G3x5_TSCSpeedBugsTabHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     * @readonly
     * @property {WT_SpeedBug[]} speedBugs
     * @type {WT_SpeedBug[]}
     */
    get speedBugs() {
        return this._speedBugs;
    }

    _initRow(speedBug) {
        let row = new WT_G3x5_TSCSpeedBugRow();
        row.setContext({
            parentPage: this.parentPage,
            speedBug: speedBug
        });
        row.slot = "content";
        this.htmlElement.addRow(row);
    }

    _initRows() {
        this._speedBugs.forEach(this._initRow.bind(this));
    }

    onAttached() {
        super.onAttached();

        this._initRows();
    }

    toggleAllBugsOn() {
        this.speedBugs.forEach(speedBug => speedBug.setShow(true));
    }

    toggleAllBugsOff() {
        this.speedBugs.forEach(speedBug => speedBug.setShow(false));
    }

    update() {
        this.htmlElement.update();
    }
}

class WT_G3x5_TSCSpeedBugsTabHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._rows = [];
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCSpeedBugsTabHTMLElement.TEMPLATE;
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCSpeedBugsTab} parent
     * @type {WT_G3x5_TSCSpeedBugsTab}
     */
     get parent() {
        return this._parent;
    }

    _defineChildren() {
        let allOnButton = this.shadowRoot.querySelector(`#allon`);
        let allOffButton = this.shadowRoot.querySelector(`#alloff`);
        if (allOnButton instanceof WT_TSCLabeledButton && allOffButton instanceof WT_TSCLabeledButton) {
            this._allOnButton = allOnButton;
            this._allOffButton = allOffButton;
            this._rowsElement = this.shadowRoot.querySelector(`#rows`);
            return true;
        } else {
            return false;
        }
    }

    _initButtonListeners() {
        this._allOnButton.addButtonListener(this._onAllOnButtonPressed.bind(this));
        this._allOffButton.addButtonListener(this._onAllOffButtonPressed.bind(this));
    }

    _initRows() {
        this._rows.forEach(row => this._rowsElement.appendChild(row));
    }

    async _connectedCallbackHelper() {
        await WT_Wait.wait(this._defineChildren.bind(this));
        this._initButtonListeners();
        this._isInit = true;
        this._initRows();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    setParent(parent) {
        this._parent = parent;
    }

    addRow(row) {
        this._rows.push(row);
        if (this._isInit) {
            this._rowsElement.appendChild(row);
        }
    }

    _onAllOnButtonPressed(button) {
        this.parent.toggleAllBugsOn();
    }

    _onAllOffButtonPressed(button) {
        this.parent.toggleAllBugsOff();
    }

    _updateAllToggleButtons() {
        let total = this.parent.speedBugs.length;
        let onCount = this.parent.speedBugs.reduce((prev, curr) => prev + (curr.show ? 1 : 0), 0);
        let offCount = total - onCount;
        this._allOnButton.enabled = `${onCount < total}`;
        this._allOffButton.enabled = `${offCount < total}`;
    }

    update() {
        if (!this._isInit) {
            return;
        }

        this._updateAllToggleButtons();
    }
}
WT_G3x5_TSCSpeedBugsTabHTMLElement.NAME = "wt-tsc-speedbugs-tab";
WT_G3x5_TSCSpeedBugsTabHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCSpeedBugsTabHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            width: 100%;
            height: 100%;
            background-color: black;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            padding: 0.25em 0;
            display: flex;
            flex-flow: column nowrap;
            align-items: center;
        }
            #topline {
                position: relative;
                width: 95%;
                height: var(--speedbugs-tab-topline-height, 16%);
                padding: 0 0.5em;
                display: grid;
                grid-template-columns: 1fr 1fr;
                grid-template-rows: 1fr;
            }
                #topline wt-tsc-button-label {
                    margin: 0.1em;
                }
            #divider {
                width: 95%;
                height: 0;
                margin: 0.25em 0;
                border-top: ridge var(--speedbugs-tab-divider-width, 3px) white;
            }
            #rowscontainer {
                position: relative;
                width: 95%;
                height: var(--speedbugs-tab-rowsection-height, 75%);
                border: solid 3px #404040;
                border-radius: 5px;
                overflow: hidden;
            }
                #rows {
                    position: relative;
                    width: 100%;
                    height: 100%;
                }
                    wt-tsc-speedbugs-row {
                        height: var(--speedbugs-tab-row-height);
                    }
    </style>
    <div id="wrapper">
        <div id="topline">
            <wt-tsc-button-label id="allon" labeltext="All On"></wt-tsc-button-label>
            <wt-tsc-button-label id="alloff" labeltext="All Off"></wt-tsc-button-label>
        </div>
        <div id="divider"></div>
        <div id="rowscontainer">
            <tsc-scrolllist id="rows">
            </tsc-scrolllist>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCSpeedBugsTabHTMLElement.NAME, WT_G3x5_TSCSpeedBugsTabHTMLElement);

class WT_G3x5_TSCSpeedBugRow extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._speedBugListener = this._onSpeedBugChanged.bind(this);

        /**
         * @type {{parentPage:WT_G3x5_TSCSpeedBugs, speedBug:WT_SpeedBug}}
         */
        this._context = null;
        this._lastContext = null;
        this._isInit = false;

        this._tempKnots = WT_Unit.KNOT.createNumber(0);
    }

    _getTemplate() {
        return WT_G3x5_TSCSpeedBugRow.TEMPLATE;
    }

    _defineChildren() {
        let toggleButton = this.shadowRoot.querySelector(`#toggle`);
        let speedButton = this.shadowRoot.querySelector(`#speed`);
        if (toggleButton instanceof WT_TSCStatusBarButton && speedButton instanceof WT_TSCLabeledButton) {
            this._toggleButton = toggleButton;
            this._speedButton = speedButton;
            return true;
        } else {
            return false;
        }
    }

    _initButtonListeners() {
        this._toggleButton.addButtonListener(this._onToggleButtonPressed.bind(this));
        this._speedButton.addButtonListener(this._onSpeedButtonPressed.bind(this));
    }

    async _connectedCallbackHelper() {
        await WT_Wait.wait(this._defineChildren.bind(this));
        this._initButtonListeners();
        this._isInit = true;
        if (this._context) {
            this._setupContext();
        }
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _initSpeedBugListener() {
        if (!this._context) {
            return;
        }

        this._context.speedBug.addListener(this._speedBugListener);
    }

    _updateName() {
        this._toggleButton.labelText = `V<sub>${this._context.speedBug.name}</sub>`;
    }

    _setupContext() {
        if (this._lastContext) {
            this._lastContext.speedBug.removeListener(this._speedBugListener);
        }

        this._initSpeedBugListener();
        this._updateName();
        this._updateSpeed();
        this._updateShow();
    }

    setContext(context) {
        if (this._context === context) {
            return;
        }

        let lastContext = this._context;
        this._context = context;
        if (this._isInit) {
            this._lastContext = lastContext;
            this._setupContext();
        }
    }

    _updateSpeed() {
        this._speedButton.update(this._context.speedBug);
    }

    _updateShow() {
        this._toggleButton.toggle = this._context.speedBug.show ? "on" : "off";
    }

    _onSpeedBugChanged(speedBug, event) {
        switch (event) {
            case WT_SpeedBug.Event.SPEED_CHANGED:
                this._updateSpeed();
                break;
            case WT_SpeedBug.Event.SHOW_CHANGED:
                this._updateShow();
                break;
        }
    }

    _toggleShow() {
        this._context.speedBug.setShow(!this._context.speedBug.show);
    }

    _onToggleButtonPressed(button) {
        if (this._context) {
            this._toggleShow();
        }
    }

    valueEndEditing(_index, _value) {
        this.references[_index].displayedSpeed = _value;
        this.sendToPfd();
    }

    _onSpeedSelected(value) {
        this._context.speedBug.setSpeed(this._tempKnots.set(value));
    }

    _openSpeedSelectionWindow() {
        let instrument = this._context.parentPage.instrument;
        instrument.speedKeyboard.getElementOfType(AS3000_TSC_SpeedKeyboard).setContext({
            homePageGroup: this._context.parentPage.homePageGroup,
            homePageName: this._context.parentPage.homePageName,
            callback: this._onSpeedSelected.bind(this),
            initialValue: this._context.speedBug.speed.asUnit(WT_Unit.KNOT)
        });
        instrument.switchToPopUpPage(instrument.speedKeyboard);
    }

    _onSpeedButtonPressed(button) {
        if (this._context) {
            this._openSpeedSelectionWindow();
        }
    }
}
WT_G3x5_TSCSpeedBugRow.NAME = "wt-tsc-speedbugs-row";
WT_G3x5_TSCSpeedBugRow.TEMPLATE = document.createElement("template");
WT_G3x5_TSCSpeedBugRow.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            width: 100%;
            background-color: black;
            border: solid 1px white;
            border-radius: 5px;
        }

        #wrapper {
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: auto;
            grid-template-columns: var(--speedbugrow-left-width, 50%) var(--speedbugrow-right-width, 50%);
        }
            .button {
                margin: 0.1em;
            }
            #speed {
                color: var(--wt-g3x5-lightblue);
            }
    </style>
    <div id="wrapper">
        <wt-tsc-button-statusbar id="toggle" class="button"></wt-tsc-button-statusbar>
        <wt-tsc-button-speedbugspeed id="speed" class="button"></wt-tsc-button-speedbugspeed>
    </div>
`;

customElements.define(WT_G3x5_TSCSpeedBugRow.NAME, WT_G3x5_TSCSpeedBugRow);

class WT_G3x5_TSCSpeedBugSpeedButton extends WT_TSCLabeledButton {
    constructor() {
        super();

        this._initFormatter();
    }

    _initLabelBoxStyle() {
        return `
            #labelbox {
                position: absolute;
                left: 25%;
                width: 50%;
                top: 5%;
                height: 90%;
            }
        `;
    }

    _initEditIconStyle() {
        return `
            #editicon {
                position: absolute;
                top: 50%;
                left: 87.5%;
                width: auto;
                max-width: 25%;
                height: 1em;
                transform: translate(-50%, -50%);
                display: none;
            }
            #editicon[show="true"] {
                display: block;
            }
        `;
    }

    _createStyle() {
        let style = super._createStyle();
        let editIconStyle = this._initEditIconStyle();

        return `
            ${style}
            ${editIconStyle}
        `;
    }

    _initFormatter() {
        let formatter = new WT_NumberFormatter({
            precision: 1,
            unitSpaceBefore: false,
            unitCaps: true
        });
        this._formatter = new WT_NumberHTMLFormatter(formatter, {
            classGetter: {
                getNumberClassList: (numberUnit, forceUnit) => [],
                getUnitClassList: (numberUnit, forceUnit) => [WT_G3x5_TSCSpeedBugSpeedButton.UNIT_CLASS]
            },
            numberUnitDelim: ""
        });
    }

    _appendEditIcon() {
        this._editIcon = document.createElement("img");
        this._editIcon.src = WT_G3x5_TSCSpeedBugSpeedButton.EDIT_ICON_IMAGE_PATH;
        this._editIcon.id = "editicon";

        this._wrapper.appendChild(this._editIcon);
    }

    _appendChildren() {
        super._appendChildren();

        this._appendEditIcon();
    }

    /**
     *
     * @param {WT_SpeedBug} speedBug
     */
    _updateSpeed(speedBug) {
        this.labelText = this._formatter.getFormattedHTML(speedBug.speed, WT_Unit.KNOT);
    }

    /**
     *
     * @param {WT_SpeedBug} speedBug
     */
    _updateEditIcon(speedBug) {
        this._editIcon.setAttribute("show", (speedBug.speed.compare(speedBug.defaultSpeed) !== 0) ? "true" : "false");
    }

    /**
     *
     * @param {WT_SpeedBug} speedBug
     */
    update(speedBug) {
        this._updateSpeed(speedBug);
        this._updateEditIcon(speedBug);
    }
}
WT_G3x5_TSCSpeedBugSpeedButton.EDIT_ICON_IMAGE_PATH = "/WTg3000/SDK/Assets/Images/TSC/ICON_PENCIL.png";
WT_G3x5_TSCSpeedBugSpeedButton.UNIT_CLASS = "unit";
WT_G3x5_TSCSpeedBugSpeedButton.NAME = "wt-tsc-button-speedbugspeed";

customElements.define(WT_G3x5_TSCSpeedBugSpeedButton.NAME, WT_G3x5_TSCSpeedBugSpeedButton);