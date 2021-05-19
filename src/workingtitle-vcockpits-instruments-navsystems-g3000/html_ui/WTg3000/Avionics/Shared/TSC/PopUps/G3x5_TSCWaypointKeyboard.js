class WT_G3x5_TSCWaypointKeyboard extends WT_G3x5_TSCPopUpElement {
    constructor() {
        super();

        this._searchResultCount = 0;
        /**
         * @type {WT_ICAOWaypoint}
         */
        this._searchResultWaypoint = null;
        this._searchResultWaypointMessage = "";
        this._waypointSearchID = 0;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCWaypointKeyboardHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _initICAOSearchBatch() {
        this._icaoSearchBatch = new SimVar.SimVarBatch("C:fs9gps:IcaoSearchMatchedIcaosNumber", "C:fs9gps:IcaoSearchMatchedIcao");
        this._icaoSearchBatch.add("C:fs9gps:IcaoSearchCurrentIcao", "string", "string");
    }

    _createHTMLElement() {
        return new WT_G3x5_TSCWaypointKeyboardHTMLElement();
    }

    _initFromHTMLElement() {
        this.htmlElement.addEntryChangedListener(this._onKeyboardEntryChanged.bind(this));
    }

    onInit() {
        this._initICAOSearchBatch();
        this._htmlElement = this._createHTMLElement();
        this.popUpWindow.appendChild(this.htmlElement);
        this._initFromHTMLElement();
    }

    _searchForICAO(ident) {
        SimVar.SetSimVarValue("C:fs9gps:IcaoSearchCurrentIdent", "string", ident, this.instrument.instrumentIdentifier);
    }

    _onKeyboardEntryChanged(source, oldEntry, newEntry) {
        if (newEntry.length > 0) {
            this._searchForICAO(newEntry);
        } else {
            this._initICAOSearch();
        }
    }

    _openDuplicateWaypointWindow(ident, callback) {
        SimVar.GetSimVarArrayValues(this._icaoSearchBatch, (async (results) => {
            let waypoints;
            try {
                waypoints = await Promise.all(results.map(result => this.instrument.icaoWaypointFactory.getWaypoint(result[0])));
            } catch (e) {
                console.log(e);
            }
            SimVar.SetSimVarValue("C:fs9gps:IcaoSearchMatchedIcao", "number", 0, this.instrument.instrumentIdentifier);
            if (waypoints) {
                this.instrument.duplicateWaypointSelection.element.setContext({
                    homePageGroup: this.context.homePageGroup,
                    homePageName: this.context.homePageName,
                    ident: ident,
                    waypoints: waypoints,
                    callback: callback
                });
                this.instrument.switchToPopUpPage(this.instrument.duplicateWaypointSelection);
            }
        }).bind(this), this.instrument.instrumentIdentifier);
    }

    _onEnterPressed() {
        if (this._searchResultCount > 1) {
            this.instrument.goBack();
            this._openDuplicateWaypointWindow(this.htmlElement.getEntry(), this.context.callback);
        } else {
            this.context.callback(this._searchResultWaypoint);
            this.instrument.goBack();
        }
    }

    _activateEnterButton() {
        this.instrument.activateNavButton(6, "Enter", this._onEnterPressed.bind(this), true, "ICON_TSC_BUTTONBAR_ENTER.png");
    }

    _deactivateEnterButton() {
        this.instrument.deactivateNavButton(6, true);
    }

    _activateNavButtons() {
        this.instrument.activateNavButton(1, "Cancel", this._onBackPressed.bind(this), true, "ICON_TSC_BUTTONBAR_BACK.png");
        this.instrument.activateNavButton(2, "Home", this._onHomePressed.bind(this), true, "ICON_TSC_BUTTONBAR_HOME.png");

        this._activateEnterButton();
    }

    _deactivateNavButtons() {
        super._activateNavButtons();

        this._deactivateEnterButton();
    }

    /**
     *
     * @param {WT_ICAOWaypoint.Type[]} types
     */
    _getFS9GPSSearchTypes(types) {
        if (!types || types.length === 0) {
            return "AVNW";
        }

        return types.reduce((prev, curr) => prev + WT_ICAOWaypoint.getICAOPrefixFromType(curr), "");
    }

    _initICAOSearch() {
        let searchTypes = this._getFS9GPSSearchTypes(this.context ? this.context.searchTypes : null);
        SimVar.SetSimVarValue("C:fs9gps:IcaoSearchStartCursor", "string", searchTypes, this.instrument.instrumentIdentifier);
    }

    onEnter() {
        super.onEnter();

        this.htmlElement.setEntry("");
        this._initICAOSearch();
    }

    /**
     *
     * @param {WT_ICAOWaypoint} waypoint
     */
    _setSearchResultWaypoint(waypoint) {
        this._searchResultWaypoint = waypoint;
        this._searchResultWaypointMessage = waypoint ? (waypoint.name ? waypoint.name : WT_G3x5_RegionNames.getName(waypoint.region)) : "";
    }

    /**
     *
     * @param {String} icao
     */
    async _updateWaypointFromICAO(icao) {
        if (this._searchResultWaypoint && this._searchResultWaypoint.icao === icao) {
            return;
        }

        this._setSearchResultWaypoint(null);
        let waypointSearchID = ++this._waypointSearchID;
        let waypoint;
        try {
            waypoint = await this.instrument.icaoWaypointFactory.getWaypoint(icao);
        } catch (e) {
            console.log(e);
        }

        if (waypointSearchID !== this._waypointSearchID) {
            return;
        }

        this._setSearchResultWaypoint(waypoint);
    }

    _updateSearchResults() {
        let searchResultCount = SimVar.GetSimVarValue("C:fs9gps:IcaoSearchMatchedIcaosNumber", "number", this.instrument.instrumentIdentifier);

        let icao = "";
        if (searchResultCount > 0) {
            // fs9gps search does fuzzy match, so we need to make sure the returned ICAO matches the currently entered ident
            icao = SimVar.GetSimVarValue("C:fs9gps:IcaoSearchCurrentIcao", "string", this.instrument.instrumentIdentifier);
            let ident = icao.substr(7, 5).trim();
            if (ident !== this.htmlElement.getEntry()) {
                searchResultCount = 0;
            }
        }

        this._searchResultCount = searchResultCount;
        if (this._searchResultCount === 1) {
            this._updateWaypointFromICAO(icao);
        } else {
            this._setSearchResultWaypoint(null);
        }
    }

    _updateKeyboardFromSearchResults() {
        if (this._searchResultCount === 0) {
            this.htmlElement.setMessage("No matches found");
            this.htmlElement.setWaypoint(null);
        } else if (this._searchResultCount > 1) {
            this.htmlElement.setMessage("Duplicates found");
            this.htmlElement.setWaypoint(null);
        } else if (this._searchResultWaypoint) {
            this.htmlElement.setMessage(this._searchResultWaypointMessage);
            this.htmlElement.setWaypoint(this._searchResultWaypoint);
        } else {
            this.htmlElement.setMessage("No matches found");
            this.htmlElement.setWaypoint(null);
        }
    }

    onUpdate(deltaTime) {
        this._updateSearchResults();
        this._updateKeyboardFromSearchResults();
    }
}

class WT_G3x5_TSCWaypointKeyboardHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {((source:WT_G3x5_TSCAlphaNumKeyboard, oldEntry:String, newEntry:String) => void)[]}
         */
        this._listeners = [];

        this._entry = "";
        this._cursorIndex = 0;
        this._messageText = "";
        /**
         * @type {WT_ICAOWaypoint}
         */
        this._waypoint = null;
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCWaypointKeyboardHTMLElement.TEMPLATE;
    }

    async _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);

        this._charDisplays = [...this.shadowRoot.querySelectorAll(`.char`)];
        this._messageDisplay = this.shadowRoot.querySelector(`#messagetext`);
        this._waypointIcon = this.shadowRoot.querySelector(`#waypointicon`);
        this._keyboard = await WT_CustomElementSelector.select(this.shadowRoot, `#keyboard`, WT_G3x5_TSCAlphaNumKeyboard);
    }

    _initWaypointIconSrcFactory() {
        this._waypointIconSrcFactory = new WT_G3x5_TSCWaypointButtonIconSrcFactory(WT_G3x5_TSCWaypointKeyboardHTMLElement.WAYPOINT_ICON_PATH);
    }

    _initKeyboardListener() {
        this._keyboard.addListener(this._onKeyboardEvent.bind(this));
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._initWaypointIconSrcFactory();
        this._initKeyboardListener();
        this._isInit = true;
        this._updateFromEntry();
        this._updateFromMessageText();
        this._updateFromCursorIndex();
        this._updateFromWaypoint();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    getEntry() {
        return this._entry;
    }

    _updateFromCursorIndex() {
        for (let i = 0; i < this._charDisplays.length; i++) {
            this._charDisplays[i].setAttribute("cursor", `${i === this._cursorIndex}`);
        }
    }

    _setCursorIndex(index) {
        if (this._cursorIndex === index) {
            return;
        }

        this._cursorIndex = index;
        if (this._isInit) {
            this._updateFromCursorIndex();
        }
    }

    _updateCursorIndexFromEntry() {
        this._setCursorIndex(this._entry.length);
    }

    _updateFromEntry() {
        for (let i = 0; i < this._charDisplays.length; i++) {
            if (i < this._entry.length) {
                this._charDisplays[i].textContent = this._entry[i];
            } else {
                this._charDisplays[i].textContent = "_";
            }
        }
        this._updateCursorIndexFromEntry();
    }

    /**
     *
     * @param {String} entry
     */
    setEntry(entry) {
        entry = entry.substring(0, 6);
        if (this._entry === entry) {
            return;
        }

        let oldEntry = this._entry;
        this._entry = entry;
        if (this._isInit) {
            this._updateFromEntry();
        }
        this._notifyEntryChangedListeners(oldEntry, entry);
    }

    _updateFromMessageText() {
        this._messageDisplay.textContent = this._messageText;
    }

    /**
     *
     * @param {String} text
     */
    setMessage(text) {
        if (text === this._messageText) {
            return;
        }

        this._messageText = text;
        if (this._isInit) {
            this._updateFromMessageText();
        }
    }

    _updateFromWaypoint() {
        if (this._waypoint) {
            this._waypointIcon.style.display = "block";
            this._waypointIcon.src = this._waypointIconSrcFactory.getSrc(this._waypoint);
        } else {
            this._waypointIcon.style.display = "none";
        }
    }

    /**
     *
     * @param {WT_ICAOWaypoint} waypoint
     */
    setWaypoint(waypoint) {
        if ((!this._waypoint && !waypoint) || (waypoint && waypoint.equals(this._waypoint))) {
            return;
        }

        this._waypoint = waypoint;
        if (this._isInit) {
            this._updateFromWaypoint();
        }
    }

    _appendCharToEntry(char) {
        if (this._entry.length >= 6) {
            return;
        }

        let oldEntry = this._entry;
        this._charDisplays[this._entry.length].textContent = char;
        this._entry += char;

        this._updateCursorIndexFromEntry();
        this._notifyEntryChangedListeners(oldEntry, this._entry);
    }

    _popCharFromEntry() {
        if (this._entry.length === 0) {
            return;
        }

        let oldEntry = this._entry;
        this._entry = this._entry.substring(0, this._entry.length - 1);
        this._charDisplays[this._entry.length].textContent = "_";

        this._updateCursorIndexFromEntry();
        this._notifyEntryChangedListeners(oldEntry, this._entry);
    }

    _onKeyboardEvent(source, eventType, char) {
        switch (eventType) {
            case WT_G3x5_TSCAlphaNumKeyboard.EventType.CHAR_KEY_PRESSED:
                this._appendCharToEntry(char);
                break;
            case WT_G3x5_TSCAlphaNumKeyboard.EventType.BACKSPACE_PRESSED:
                this._popCharFromEntry();
                break;
        }
    }

    _notifyEntryChangedListeners(oldEntry, newEntry) {
        this._listeners.forEach(listener => listener(this, oldEntry, newEntry));
    }

    /**
     *
     * @param {(source:WT_G3x5_TSCWaypointKeyboardHTMLElement, oldEntry:String, newEntry:String) => void} listener
     */
    addEntryChangedListener(listener) {
        this._listeners.push(listener);
    }

    /**
     *
     * @param {(source:WT_G3x5_TSCAlphaNumKeyboard, oldEntry:String, newEntry:String) => void} listener
     */
    removeEntryChangedListener(listener) {
        let index = this._listeners.indexOf(listener);
        if (index >= 0) {
            this._listeners.splice(index, 1);
        }
    }
}
WT_G3x5_TSCWaypointKeyboardHTMLElement.WAYPOINT_ICON_PATH = "/WTg3000/SDK/Assets/Images/Garmin/TSC/Waypoints";
WT_G3x5_TSCWaypointKeyboardHTMLElement.NAME = "wt-tsc-waypointkeyboard";
WT_G3x5_TSCWaypointKeyboardHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCWaypointKeyboardHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        @keyframes blink {
            0% {
                background: var(--wt-g3x5-lightblue);
                color: #222222;
            }
            50% {
                background: transparent;
                color: var(--wt-g3x5-lightblue);
            }
            100% {
                background: var(--wt-g3x5-lightblue);
                color: #222222;
            }
        }

        #wrapper {
            position: absolute;
            left: var(--waypointkeyboard-padding-left, 0px);
            top: var(--waypointkeyboard-padding-top, 0px);
            width: calc(100% - var(--waypointkeyboard-padding-left, 0px) - var(--waypointkeyboard-padding-right, 0px));
            height: calc(100% - var(--waypointkeyboard-padding-top, 0px) - var(--waypointkeyboard-padding-bottom, 0px));
            display: grid;
            grid-template-rows: var(--waypointkeyboard-toprow-height, 1.6em) 1fr;
            grid-template-columns: 100%;
            grid-gap: var(--waypointkeyboard-toprow-margin-bottom, 0) 0;
        }
            #topbg {
                position: relative;
                background-color: black;
            }
                #top {
                    position: absolute;
                    left: var(--waypointkeyboard-toprow-padding-left, 0.2em);
                    top: var(--waypointkeyboard-toprow-padding-top, 0.1em);
                    width: calc(100% - var(--waypointkeyboard-toprow-padding-left, 0.2em) - var(--waypointkeyboard-toprow-padding-right, 0.2em));
                    height: calc(100% - var(--waypointkeyboard-toprow-padding-top, 0.1em) - var(--waypointkeyboard-toprow-padding-bottom, 0.1em));
                    transform: rotateX(0deg);
                }
                    #display {
                        position: absolute;
                        left: 0%;
                        top: 0%;
                        width: var(--waypointkeyboard-display-width, 33%);
                        height: 100%;
                        background: #222222;
                        font-family: var(--waypointkeyboard-display-font-family, "Roboto-Mono");
                    }
                        #charcontainer {
                            position: absolute;
                            left: var(--waypointkeyboard-display-padding-left, 0.2em);
                            top: var(--waypointkeyboard-display-padding-top, 0.1em);
                            width: calc(100% - var(--waypointkeyboard-display-padding-left, 0.2em) - var(--waypointkeyboard-display-padding-right, 0.2em));
                            height: calc(100% - var(--waypointkeyboard-display-padding-top, 0.1em) - var(--waypointkeyboard-display-padding-bottom, 0.1em));
                            display: flex;
                            flex-row: row nowrap;
                            justify-content: flex-start;
                            align-items: center;
                        }
                            .char {
                                color: var(--wt-g3x5-lightblue);
                            }
                            .char[cursor="true"] {
                                animation: blink 1s infinite step-end;
                            }
                    #message {
                        position: absolute;
                        left: calc(var(--waypointkeyboard-display-width, 33%) + var(--waypointkeyboard-message-margin-left, 0.5em));
                        top: 50%;
                        width: calc(100% - var(--waypointkeyboard-display-width, 33%) - var(--waypointkeyboard-waypointicon-size, 1em) - var(--waypointkeyboard-message-margin-left, 0.5em));
                        transform: translateY(-50%);
                        color: white;
                        white-space: nowrap;
                        overflow: hidden;
                    }
                        #messagetext {
                            font-size: var(--waypointkeyboard-message-font-size, 0.67em);
                        }
                    #waypointicon {
                        position: absolute;
                        right: 0%;
                        top: 50%;
                        width: var(--waypointkeyboard-waypointicon-size, 1em);
                        height: var(--waypointkeyboard-waypointicon-size, 1em);
                        transform: translateY(-50%);
                    }
            #keyboard {
                position: relative;
                width: 100%;
                height: 100%;
                font-size: var(--waypointkeyboard-keyboard-font-size, 1em);
            }
    </style>
    <div id="wrapper">
        <div id="topbg">
            <div id="top">
                <div id="display">
                    <div id="charcontainer">
                        <div class="char"></div>
                        <div class="char"></div>
                        <div class="char"></div>
                        <div class="char"></div>
                        <div class="char"></div>
                        <div class="char"></div>
                    </div>
                </div>
                <div id="message">
                    <div id="messagetext"></div>
                </div>
                <img id="waypointicon" />
            </div>
        </div>
        <wt-tsc-alphanumkeyboard id="keyboard"></wt-tsc-alphanumkeyboard>
    </div>
`;

customElements.define(WT_G3x5_TSCWaypointKeyboardHTMLElement.NAME, WT_G3x5_TSCWaypointKeyboardHTMLElement);