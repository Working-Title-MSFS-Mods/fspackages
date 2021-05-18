class WT_G3x5_TSCAirwaySelection extends WT_G3x5_TSCPopUpElement {
    constructor() {
        super();

        this._isReady = false;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCAirwaySelectionHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createHTMLElement() {
        return new WT_G3x5_TSCAirwaySelectionHTMLElement();
    }

    _initLoadAirwayListener() {
        this.htmlElement.addLoadAirwayListener(this._onAirwayLoaded.bind(this));
    }

    async _initFromHTMLElement() {
        await WT_Wait.awaitCallback(() => this.htmlElement.isInitialized, this);
        this._initLoadAirwayListener();
        this._isReady = true;
        this._initOnEnter();
    }

    onInit() {
        this._htmlElement = this._createHTMLElement();
        this.popUpWindow.appendChild(this.htmlElement);
        this._initFromHTMLElement();
    }

    /**
     *
     * @param {WT_G3x5_TSCAirwaySelectionEvent} event
     */
    _onAirwayLoaded(event) {
        this.context.callback(event.airway, event.sequence);
        this.instrument.goBack();
    }

    _onBackPressed() {
        this.context.callback(null, []);
        this.instrument.goBack();
    }

    _activateNavButtons() {
        super._activateNavButtons();

        this.instrument.activateNavButton(5, "Up", this._onUpPressed.bind(this), true, "ICON_TSC_BUTTONBAR_UP.png");
        this.instrument.activateNavButton(6, "Down", this._onDownPressed.bind(this), true, "ICON_TSC_BUTTONBAR_DOWN.png");
    }

    _deactivateNavButtons() {
        super._deactivateNavButtons();

        this.instrument.deactivateNavButton(5);
        this.instrument.deactivateNavButton(6);
    }

    async _initOnEnter() {
        if (!this.context || !this._isReady) {
            return;
        }

        this.htmlElement.setMode(WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.DEFAULT);
        await this.htmlElement.setEntryWaypoint(this.context.entryWaypoint ? this.context.entryWaypoint : null);
        await this.htmlElement.setAirway(this.context.airway ? this.context.airway : null);
        await this.htmlElement.setExitWaypoint(this.context.exitWaypoint ? this.context.exitWaypoint : null);
    }

    onEnter() {
        super.onEnter();

        this._initOnEnter();
    }

    onUpdate(deltaTime) {
        this.htmlElement.update();
    }

    onExit() {
        super.onExit();

        this.htmlElement.cancelScroll();
    }

    _onUpPressed() {
        this.htmlElement.scrollUp();
    }

    _onDownPressed() {
        this.htmlElement.scrollDown();
    }
}


class WT_G3x5_TSCAirwaySelectionHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._waypointIconSrcFactory = new WT_G3x5_TSCWaypointButtonIconSrcFactory(WT_G3x5_TSCAirwaySelectionHTMLElement.WAYPOINT_ICON_IMAGE_DIRECTORY);

        /**
         * @type {((event:WT_G3x5_TSCAirwaySelectionEvent) => void)[]}
         */
        this._loadAirwayListeners = [];

        this._mode = WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.DEFAULT;
        /**
         * @type {WT_ICAOWaypoint}
         */
        this._entryWaypoint = null;
        /**
         * @type {WT_Airway}
         */
        this._airway = null;
        /**
         * @type {WT_ICAOWaypoint}
         */
        this._exitWaypoint = null;
        /**
         * @type {WT_ICAOWaypoint[]}
         */
        this._waypointSequence = [];
        this._waypointSortAlphabet = false;
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCAirwaySelectionHTMLElement.TEMPLATE;
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get isInitialized() {
        return this._isInit;
    }

    /**
     *
     * @returns {WT_G3x5_TSCAirwaySelectionHTMLElement.Mode}
     */
    getMode() {
        return this._mode;
    }

    async _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);

        [
            this._entryButton,
            this._airwayButton,
            this._exitButton,
            this._sortButton,
            this._loadButton,
            this._airwayList,
            this._waypointList,
            this._sequenceList
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#entry`, WT_TSCValueButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#airway`, WT_TSCValueButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#exit`, WT_TSCValueButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#sort`, WT_TSCStatusBarButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#load`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#airwaylist`, WT_TSCScrollList),
            WT_CustomElementSelector.select(this.shadowRoot, `#waypointlist`, WT_TSCScrollList),
            WT_CustomElementSelector.select(this.shadowRoot, `#sequencelist`, WT_TSCScrollList)
        ]);

        this._listTitle = this.shadowRoot.querySelector(`#listtitle`);
    }

    _initListRecyclers() {
        this._sequenceListRecycler = new WT_SimpleHTMLElementRecycler(this._sequenceList, "div", element => element.slot = "content");
        this._waypointListRecycler = new WT_CustomHTMLElementRecycler(this._waypointList, WT_G3x5_TSCWaypointButton, element => {
            element.slot = "content";
            element.setIconSrcFactory(this._waypointIconSrcFactory);
            element.addButtonListener(this._onWaypointSelectButtonPressed.bind(this));
        });
        this._airwayListRecycler = new WT_CustomHTMLElementRecycler(this._airwayList, WT_G3x5_TSCAirwayButton, element => {
            element.slot = "content";
            element.addButtonListener(this._onAirwaySelectButtonPressed.bind(this))
        });
    }

    _initButtonListeners() {
        this._entryButton.addButtonListener(this._onEntryButtonPressed.bind(this));
        this._airwayButton.addButtonListener(this._onAirwayButtonPressed.bind(this));
        this._exitButton.addButtonListener(this._onExitButtonPressed.bind(this));
        this._sortButton.addButtonListener(this._onSortButtonPressed.bind(this));
        this._loadButton.addButtonListener(this._onLoadButtonPressed.bind(this));
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._initListRecyclers();
        this._initButtonListeners();
        this._isInit = true;
        this._updateFromEntryWaypoint();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _updateSequenceList() {
        this._sequenceListRecycler.recycleAll();

        this._waypointSequence.forEach(waypoint => {
            let entry = this._sequenceListRecycler.request();
            entry.textContent = waypoint.ident;
        }, this);
    }

    async _updateEntryWaypointList() {
        this._waypointListRecycler.recycleAll();

        let waypointList;
        if (this._airway) {
            let airwayWaypoints = await this._airway.getWaypoints();
            waypointList = airwayWaypoints.filter(waypoint => !waypoint.equals(this._exitWaypoint));
            if (this._waypointSortAlphabet) {
                waypointList.sort((a, b) => a.ident.localeCompare(b.ident));
            }
        }

        if (waypointList) {
            waypointList.forEach(waypoint => {
                let button = this._waypointListRecycler.request();
                button.setWaypoint(waypoint);
            }, this);
        }
    }

    _updateAirwayList() {
        this._airwayListRecycler.recycleAll();

        if (this._entryWaypoint) {
            this._entryWaypoint.airways.slice().sort((a, b) => a.name.localeCompare(b.name)).forEach(airway => {
                let button = this._airwayListRecycler.request();
                button.setAirway(airway);
            }, this);
        }
    }

    async _updateExitWaypointList() {
        this._waypointListRecycler.recycleAll();

        let waypointList;
        if (this._airway) {
            let airwayWaypoints = await this._airway.getWaypoints();
            waypointList = airwayWaypoints.filter(waypoint => !waypoint.equals(this._entryWaypoint));
            if (this._waypointSortAlphabet) {
                waypointList.sort((a, b) => a.ident.localeCompare(b.ident));
            }
        }

        if (waypointList) {
            waypointList.forEach(waypoint => {
                let button = this._waypointListRecycler.request();
                button.setWaypoint(waypoint);
            }, this);
        }
    }

    _updateFromMode() {
        this.cancelScroll();

        this._wrapper.setAttribute("mode", WT_G3x5_TSCAirwaySelectionHTMLElement.MODE_ATTRIBUTES[this._mode]);
        switch (this._mode) {
            case WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.DEFAULT:
                this._updateSequenceList();
                this._entryButton.highlight = "false";
                this._airwayButton.highlight = "false";
                this._exitButton.highlight = "false";
                this._listTitle.textContent = "Sequence";
                break;
            case WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.ENTRY_SELECT:
                this._updateEntryWaypointList();
                this._entryButton.highlight = "true";
                this._airwayButton.highlight = "false";
                this._exitButton.highlight = "false";
                this._listTitle.textContent = `Select Entry – ${this._airway.name}`;
                break;
            case WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.AIRWAY_SELECT:
                this._updateAirwayList();
                this._entryButton.highlight = "false";
                this._airwayButton.highlight = "true";
                this._exitButton.highlight = "false";
                this._listTitle.textContent = "Select Airway";
                break;
            case WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.EXIT_SELECT:
                this._updateExitWaypointList();
                this._entryButton.highlight = "false";
                this._airwayButton.highlight = "false";
                this._exitButton.highlight = "true";
                this._listTitle.textContent = `Select Exit – ${this._airway.name}`;
                break;
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCAirwaySelectionHTMLElement.Mode} mode
     */
    setMode(mode) {
        if (this._mode === mode) {
            return;
        }

        this._mode = mode;
        if (this._isInit) {
            this._updateFromMode();
        }
    }

    async _updateWaypointSequence() {
        this._waypointSequence.splice(0, this._waypointSequence.length);

        if (this._entryWaypoint && this._airway && this._exitWaypoint) {
            let airwayWaypoints = await this._airway.getWaypoints();
            let entryIndex = airwayWaypoints.findIndex(waypoint => waypoint.equals(this._entryWaypoint), this);
            let exitIndex = airwayWaypoints.findIndex(waypoint => waypoint.equals(this._exitWaypoint), this);
            if (entryIndex >= 0 && exitIndex >= 0 && entryIndex !== exitIndex) {
                let direction = Math.sign(exitIndex - entryIndex);
                for (let i = entryIndex; i - exitIndex !== direction; i += direction) {
                    this._waypointSequence.push(airwayWaypoints.get(i));
                }
            }
        }

        this._loadButton.enabled = `${this._waypointSequence.length > 1}`;
    }

    async _updateFromEntryWaypoint() {
        if (this._entryWaypoint) {
            this._entryButton.valueText = this._entryWaypoint.ident;
            this._airwayButton.enabled = "true";
        } else {
            this._entryButton.valueText = "–––––";
            this._airwayButton.enabled = "false";
        }

        if (!this._entryWaypoint || !this._entryWaypoint.airways.some(airway => airway.equals(this._airway))) {
            await this.setAirway(null);
        }
        await this._updateWaypointSequence();
        if (this.getMode() === WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.DEFAULT) {
            this._updateFromMode();
        } else {
            this.setMode(WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.DEFAULT);
        }
    }

    async setEntryWaypoint(waypoint) {
        if (!waypoint && !this._entryWaypoint || (waypoint && waypoint.equals(this._entryWaypoint))) {
            return;
        }

        this._entryWaypoint = waypoint;
        if (this._isInit) {
            await this._updateFromEntryWaypoint();
        }
    }

    async _updateFromAirway() {
        if (this._airway) {
            this._airwayButton.valueText = this._airway.name;
            this._entryButton.enabled = "true";
            this._exitButton.enabled = "true";
        } else {
            this._airwayButton.valueText = "–––––";
            this._entryButton.enabled = "false";
            this._exitButton.enabled = "false";
        }
        await this.setExitWaypoint(null);
        await this._updateWaypointSequence();
        if (this.getMode() === WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.DEFAULT) {
            this._updateFromMode();
        } else {
            this.setMode(WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.DEFAULT);
        }
    }

    async setAirway(airway) {
        if (!airway && !this._airway || (airway && airway.equals(this._airway))) {
            return;
        }

        this._airway = airway;
        if (this._isInit) {
            await this._updateFromAirway();
        }
    }

    async _updateFromExitWaypoint() {
        if (this._exitWaypoint) {
            this._exitButton.valueText = this._exitWaypoint.ident;
            this._loadButton.enabled = "true";
        } else {
            this._exitButton.valueText = "–––––";
            this._loadButton.enabled = "false";
        }
        await this._updateWaypointSequence();
        if (this.getMode() === WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.DEFAULT) {
            this._updateFromMode();
        } else {
            this.setMode(WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.DEFAULT);
        }
    }

    async setExitWaypoint(waypoint) {
        if (!waypoint && !this._exitWaypoint || (waypoint && waypoint.equals(this._exitWaypoint))) {
            return;
        }

        this._exitWaypoint = waypoint;
        if (this._isInit) {
            await this._updateFromExitWaypoint();
        }
    }

    _onEntryButtonPressed(button) {
        if (this.getMode() === WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.ENTRY_SELECT) {
            this.setMode(WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.DEFAULT);
        } else {
            this.setMode(WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.ENTRY_SELECT);
        }
    }

    _onAirwayButtonPressed(button) {
        if (this.getMode() === WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.AIRWAY_SELECT) {
            this.setMode(WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.DEFAULT);
        } else {
            this.setMode(WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.AIRWAY_SELECT);
        }
    }

    _onExitButtonPressed(button) {
        if (this.getMode() === WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.EXIT_SELECT) {
            this.setMode(WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.DEFAULT);
        } else {
            this.setMode(WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.EXIT_SELECT);
        }
    }

    _toggleWaypointSort() {
        this._waypointSortAlphabet = !this._waypointSortAlphabet;
        if (this.getMode() === WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.ENTRY_SELECT || this.getMode() === WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.EXIT_SELECT) {
            this._updateFromMode();
        }
        this._sortButton.toggle = this._waypointSortAlphabet ? "on" : "off";
    }

    _onSortButtonPressed(button) {
        this._toggleWaypointSort();
    }

    _notifyLoadAirwayListeners(event) {
        this._loadAirwayListeners.forEach(listener => listener(event));
    }

    _onLoadButtonPressed(button) {
        this._notifyLoadAirwayListeners({
            source: this,
            airway: this._airway,
            sequence: this._waypointSequence.slice()
        });
    }

    _onWaypointSelectButtonPressed(button) {
        switch (this.getMode()) {
            case WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.ENTRY_SELECT:
                this.setEntryWaypoint(button.waypoint);
                break;
            case WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.EXIT_SELECT:
                this.setExitWaypoint(button.waypoint);
                break;
        }
    }

    _onAirwaySelectButtonPressed(button) {
        if (this.getMode() === WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.AIRWAY_SELECT) {
            this.setAirway(button.getAirway());
        }
    }

    /**
     *
     * @param {(event:WT_G3x5_TSCAirwaySelectionEvent) => void} listener
     */
    addLoadAirwayListener(listener) {
        this._loadAirwayListeners.push(listener);
    }

    /**
     *
     * @param {(event:WT_G3x5_TSCAirwaySelectionEvent) => void} listener
     */
    removeLoadAirwayListener(listener) {
        let index = this._loadAirwayListeners.indexOf(listener);
        if (index >= 0) {
            this._loadAirwayListeners.splice(index, 1);
        }
    }

    scrollUp() {
        if (!this._isInit) {
            return;
        }

        switch (this.getMode()) {
            case WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.DEFAULT:
                this._sequenceList.scrollManager.scrollUp();
                break;
            case WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.ENTRY_SELECT:
            case WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.EXIT_SELECT:
                this._waypointList.scrollManager.scrollUp();
                break;
            case WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.AIRWAY_SELECT:
                this._airwayList.scrollManager.scrollUp();
                break;
        }
    }

    scrollDown() {
        if (!this._isInit) {
            return;
        }

        switch (this.getMode()) {
            case WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.DEFAULT:
                this._sequenceList.scrollManager.scrollDown();
                break;
            case WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.ENTRY_SELECT:
            case WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.EXIT_SELECT:
                this._waypointList.scrollManager.scrollDown();
                break;
            case WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.AIRWAY_SELECT:
                this._airwayList.scrollManager.scrollDown();
                break;
        }
    }

    cancelScroll() {
        if (!this._isInit) {
            return;
        }

        this._sequenceList.scrollManager.cancelScroll();
        this._waypointList.scrollManager.cancelScroll();
        this._airwayList.scrollManager.cancelScroll();
    }

    _updateScroll() {
        switch (this.getMode()) {
            case WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.DEFAULT:
                this._sequenceList.scrollManager.update();
                break;
            case WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.ENTRY_SELECT:
            case WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.EXIT_SELECT:
                this._waypointList.scrollManager.update();
                break;
            case WT_G3x5_TSCAirwaySelectionHTMLElement.Mode.AIRWAY_SELECT:
                this._airwayList.scrollManager.update();
                break;
        }
    }

    update() {
        if (!this._isInit) {
            return;
        }

        this._updateScroll();
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_TSCAirwaySelectionHTMLElement.Mode = {
    DEFAULT: 0,
    ENTRY_SELECT: 1,
    AIRWAY_SELECT: 2,
    EXIT_SELECT: 3
};
WT_G3x5_TSCAirwaySelectionHTMLElement.MODE_ATTRIBUTES = [
    "default",
    "entry",
    "airway",
    "exit"
];
WT_G3x5_TSCAirwaySelectionHTMLElement.WAYPOINT_ICON_IMAGE_DIRECTORY = "/WTg3000/SDK/Assets/Images/Garmin/TSC/Waypoints";
WT_G3x5_TSCAirwaySelectionHTMLElement.NAME = "wt-tsc-airwayselection";
WT_G3x5_TSCAirwaySelectionHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCAirwaySelectionHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            border-radius: 5px;
            background: linear-gradient(#1f3445, black 25px);
            border: 3px solid white;
        }

        #wrapper {
            position: absolute;
            left: var(--airwayselection-padding-left, 0px);
            top: var(--airwayselection-padding-top, 0px);
            width: calc(100% - var(--airwayselection-padding-left, 0px) - var(--airwayselection-padding-right, 0px));
            height: calc(100% - var(--airwayselection-padding-top, 0px) - var(--airwayselection-padding-bottom, 0px));
            display: grid;
            grid-template-rows: 100%;
            grid-template-columns: 1fr var(--airwayselection-list-width, 45%);
        }
            #left {
                position: relative;
                display: grid;
                padding: var(--airwayselection-left-padding, 0.5em);
                grid-template-columns: 1fr 1fr;
                grid-template-rows: repeat(4, 1fr);
                grid-gap: var(--airwayselection-left-grid-gap, 0.75em 0.5em);
            }
                .leftButton {
                    font-size: var(--airwayselection-left-button-font-size, 0.85em);
                    --button-highlighted-color: white;
                    --button-value-font-size: var(--airwayselection-left-button-value-font-size, 1.2em);
                }
                .large {
                    justify-self: center;
                    width: var(--airwayselection-left-button-large-width, 60%);
                }
                #entry {
                    grid-area: 1 / 1 / 2 / 3;
                }
                #airway {
                    grid-area: 2 / 1 / 3 / 3;
                }
                #exit {
                    grid-area: 3 / 1 / 4 / 3;
                }
            #right {
                position: relative;
                border-radius: 5px;
                background: linear-gradient(#1f3445, black 25px);
                border: 3px solid var(--wt-g3x5-bordergray);
            }
                #rightpadding {
                    position: absolute;
                    left: var(--airwayselection-right-padding-left, 0px);
                    top: var(--airwayselection-right-padding-top, 0px);
                    width: calc(100% - var(--airwayselection-right-padding-left, 0px) - var(--airwayselection-right-padding-right, 0px));
                    height: calc(100% - var(--airwayselection-right-padding-top, 0px) - var(--airwayselection-right-padding-bottom, 0px));
                    display: grid;
                    grid-template-rows: var(--airwayselection-list-title-height, 1em) 1fr;
                    grid-template-columns: 100%;
                    grid-gap: var(--airwayselection-list-title-margin-bottom, 0em) 0;
                    color: white;
                }
                    #listtitle {
                        justify-self: center;
                        align-self: center;
                        font-size: var(--airwayselection-list-title-font-size, 0.85em);
                    }
                    #listcontainer {
                        position: relative;
                    }
                        .list {
                            display: none;
                            position: absolute;
                            left: 0%;
                            top: 0%;
                            width: 100%;
                            height: 100%;
                            --scrolllist-align-items: stretch;
                        }
                        #wrapper[mode="airway"] #airwaylist {
                            display: block;
                        }
                        #wrapper[mode="entry"] #waypointlist,
                        #wrapper[mode="exit"] #waypointlist {
                            display: block;
                        }
                        #wrapper[mode="default"] #sequencelist {
                            display: block;
                        }
                        #waypointlist wt-tsc-button-waypoint {
                            height: var(--airwayselection-list-waypoint-button-height, 3em);
                            margin-bottom: var(--airwayselection-list-waypoint-button-margin-vertical, 0em);
                            --button-waypoint-ident-color: white;
                            --button-waypoint-ident-font-size: 1.5em;
                            --button-waypoint-icon-size: 1em;
                        }
                        #airwaylist wt-tsc-button-airway {
                            height: var(--airwayselection-list-airway-button-height, 3em);
                            margin-bottom: var(--airwayselection-list-airway-button-margin-vertical, 0em);
                        }
                        #sequencelist div {
                            margin-left: var(--airwayselection-list-sequence-margin-left, 0.5em);
                        }
    </style>
    <div id="wrapper">
        <div id="left">
            <wt-tsc-button-value id="entry" class="leftButton large" labeltext="Entry" valuetext="–––––" enabled="false"></wt-tsc-button-value>
            <wt-tsc-button-value id="airway" class="leftButton large" labeltext="Airway" valuetext="–––––" enabled="false"></wt-tsc-button-value>
            <wt-tsc-button-value id="exit" class="leftButton large" labeltext="Exit" valuetext="–––––" enabled="false"></wt-tsc-button-value>
            <wt-tsc-button-statusbar id="sort" class="leftButton" labeltext="Sort A-Z"></wt-tsc-button-statusbar>
            <wt-tsc-button-label id="load" class="leftButton" labeltext="Load Airway"></wt-tsc-button-label>
        </div>
        <div id="right">
            <div id="rightpadding">
                <div id="listtitle"></div>
                <div id="listcontainer">
                    <wt-tsc-scrolllist id="airwaylist" class="list"></wt-tsc-scrolllist>
                    <wt-tsc-scrolllist id="waypointlist" class="list"></wt-tsc-scrolllist>
                    <wt-tsc-scrolllist id="sequencelist" class="list"></wt-tsc-scrolllist>
                </div>
            </div>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCAirwaySelectionHTMLElement.NAME, WT_G3x5_TSCAirwaySelectionHTMLElement);

/**
 * @typedef WT_G3x5_TSCAirwaySelectionEvent
 * @property {WT_G3x5_TSCAirwaySelectionHTMLElement} source
 * @property {WT_Airway} airway
 * @property {WT_ICAOWaypoint[]} sequence
 */

class WT_G3x5_TSCAirwayButton extends WT_TSCButton {
    constructor() {
        super();

        this._airway = null;
        this._isInit = false;
    }

    _createNameStyle() {
        return `
            #name {
                position: absolute;
                left: 0%;
                top: 50%;
                width: 100%;
                transform: translateY(-50%);
                font-size: var(--button-airway-name-font-size, 1em);
                text-align: center;
                color: var(--button-airway-name-color, white);
            }
            :host([highlight=true][primed=false]) #name {
                color: black;
            }
        `;
    }

    _createEmptyStyle() {
        return `
            #empty {
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
            }
        `;
    }

    _createStyle() {
        let style = super._createStyle();

        let nameStyle = this._createNameStyle();
        let emptyStyle = this._createEmptyStyle();

        return`
            ${style}
            ${nameStyle}
            ${emptyStyle}
        `;
    }

    _appendChildren() {
        this._name = document.createElement("div");
        this._name.id = "name";
        this._empty = document.createElement("div");
        this._empty.id = "empty";

        this._wrapper.appendChild(this._name);
        this._wrapper.appendChild(this._empty);
    }

    static get observedAttributes() {
        return [...WT_TSCButton.observedAttributes, "emptytext"];
    }

    get emptyText() {
        return this.getAttribute("emptytext");
    }

    set emptyText(value) {
        this.setAttribute("emptytext", value);
    }

    /**
     *
     * @returns {WT_Airway}
     */
    getAirway() {
        return this._airway;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "emptytext") {
            this._empty.innerHTML = newValue;
        } else {
            super.attributeChangedCallback(name, oldValue, newValue);
        }
    }

    connectedCallback() {
        super.connectedCallback();

        this._isInit = true;
        this._updateFromAirway();
    }

    /**
     *
     * @param {WT_Airway} airway
     */
    _showAirwayInfo(airway) {
        this._empty.style.display = "none";

        this._name.textContent = airway.name;
        this._name.style.display = "block";
    }

    _showEmptyText() {
        this._name.style.display = "none";
        this._empty.style.display = "block";
    }

    _updateFromAirway() {
        if (this._airway) {
            this._showAirwayInfo(this._airway);
        } else {
            this._showEmptyText();
        }
    }

    /**
     *
     * @param {WT_Airway} airway
     */
    setAirway(airway) {
        if (!airway && !this._airway || (airway && airway.equals(this._airway))) {
            return;
        }

        this._airway = airway;
        if (this._isInit) {
            this._updateFromAirway();
        }
    }
}
WT_G3x5_TSCAirwayButton.NAME = "wt-tsc-button-airway";

customElements.define(WT_G3x5_TSCAirwayButton.NAME, WT_G3x5_TSCAirwayButton);