class WT_G5000_TSCFlightPlanKeyboard extends WT_G3x5_TSCPopUpElement {
    constructor() {
        super();

        /**
         * @type {WT_G5000_TSCFlightPlanKeyboardOperation}
         */
        this._currentOperation = null;
        /**
         * @type {WT_G5000_TSCFlightPlanKeyboardState}
         */
        this._currentState = null;
        /**
         * @type {WT_G5000_TSCFlightPlanKeyboardState[]}
         */
        this._stateHistory = [];
        /**
         * @type {WT_Waypoint}
         */
        this._initialWaypoint = null;
        /**
         * @type {WT_Airway}
         */
        this._initialAirway = null;

        this._ignoreEntryChanges = false;
        this._isLocked = false;
    }

    /**
     * @readonly
     * @type {WT_G5000_TSCFlightPlanKeyboardHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _initICAOSearchBatch() {
        this._icaoSearchBatch = new SimVar.SimVarBatch("C:fs9gps:IcaoSearchMatchedIcaosNumber", "C:fs9gps:IcaoSearchMatchedIcao");
        this._icaoSearchBatch.add("C:fs9gps:IcaoSearchCurrentIcao", "string", "string");
    }

    _createHTMLElement() {
        return new WT_G5000_TSCFlightPlanKeyboardHTMLElement();
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

    /**
     *
     * @returns {WT_G5000_TSCFlightPlanKeyboardOperation}
     */
    getCurrentOperation() {
        return this._currentOperation;
    }

    /**
     *
     * @param {WT_G5000_TSCFlightPlanKeyboardOperation} operation
     */
    setCurrentOperation(operation) {
        this._currentOperation = operation;
    }

    /**
     *
     * @returns {Number}
     */
    getICAOSearchResultCount() {
        return SimVar.GetSimVarValue("C:fs9gps:IcaoSearchMatchedIcaosNumber", "number", this.instrument.instrumentIdentifier);
    }

    /**
     *
     * @returns {String}
     */
    getICAOSearchResult() {
        return SimVar.GetSimVarValue("C:fs9gps:IcaoSearchCurrentIcao", "string", this.instrument.instrumentIdentifier);
    }

    /**
     *
     * @returns {Promise<WT_ICAOWaypoint[]>}
     */
    async searchICAOBatch() {
        return new Promise(resolve => {
            SimVar.GetSimVarArrayValues(this._icaoSearchBatch, (async (results) => {
                let waypoints = null;
                try {
                    waypoints = await Promise.all(results.map(result => this.instrument.icaoWaypointFactory.getWaypoint(result[0])));
                } catch (e) {
                    console.log(e);
                }
                SimVar.SetSimVarValue("C:fs9gps:IcaoSearchMatchedIcao", "number", 0, this.instrument.instrumentIdentifier);
                resolve(waypoints ? waypoints : []);
            }).bind(this), this.instrument.instrumentIdentifier);
        });
    }

    setICAOSearchIdent(ident) {
        SimVar.SetSimVarValue("C:fs9gps:IcaoSearchCurrentIdent", "string", ident, this.instrument.instrumentIdentifier);
    }

    _lock() {
        this._isLocked = true;
        this.htmlElement.lock();
    }

    _unlock() {
        this.htmlElement.unlock();
        this._isLocked = false;
    }

    /**
     *
     * @returns {String}
     */
    _getStateEntry(entry) {
        return entry.match(/[^\*]*$/)[0]; // get only the part of the entry since the most recent invocation of the route key (*)
    }

    _rollBackLastRouteCommand() {
        this._ignoreEntryChanges = true;
        let entry = this.htmlElement.getEntry();
        let index = entry.lastIndexOf("*");
        if (index >= 0) {
            this.htmlElement.setEntry(entry.substring(0, index));
        }
        this._ignoreEntryChanges = false;
    }

    _openDuplicateWaypointWindow(ident, waypoints, callback) {
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
    }

    /**
     *
     * @param {WT_G5000_TSCFlightPlanKeyboardState} state
     * @param {WT_G5000_TSCFlightPlanKeyboardState} oldState
     */
    _openState(state, oldState) {
        if (oldState) {
            this._stateHistory.push(oldState);
        }
        state.onOpened(this._getStateEntry(this.htmlElement.getEntry()));
    }

    async _initState() {
        if (this._initialWaypoint) {
            this._currentState = new WT_G5000_TSCFlightPlanKeyboardWaypointOrAirwaySearchState(this, this._initialWaypoint);
        } else {
            this._currentState = new WT_G5000_TSCFlightPlanKeyboardWaypointSearchState(this);
        }
        this._openState(this._currentState);

        if (this._initialAirway) {
            await this._beginAirwayExitSearch(this._initialWaypoint, this._initialAirway);
        }
    }

    async _doReset() {
        this._lock();

        this._ignoreEntryChanges = true;
        this.htmlElement.setEntry(this._initialWaypoint ? `${this._initialWaypoint.ident}*${this._initialAirway ? `${this._initialAirway.name}*` : ""}` : "");
        this.htmlElement.setSubdued("");
        this._ignoreEntryChanges = false;

        this._stateHistory = [];
        await this._initState();

        this._initialAirway = null;

        this._unlock();
    }

    _resetFull() {
        this._initialWaypoint = null;
        this._initialAirway = null;
        this._doReset();
    }

    _resetToInitialWaypoint() {
        this._doReset();
    }

    _beginAirwayInsertion(entryWaypoint) {
        let oldState = this._currentState;
        this._currentState = new WT_G5000_TSCFlightPlanKeyboardAirwaySearchState(this, entryWaypoint);
        this._openState(this._currentState, oldState);
    }

    _rejectWaypointSearch(closeOnFinish) {
        this._rollBackLastRouteCommand();
        this._currentState.onOpened(this._getStateEntry(this.htmlElement.getEntry()));

        this._unlock();

        if (closeOnFinish) {
            this.instrument.goBack();
        }
    }

    _beginWaypointOrAirwaySearch(waypoint) {
        this._unlock();

        let oldState = this._currentState;
        this._currentState = new WT_G5000_TSCFlightPlanKeyboardWaypointOrAirwaySearchState(this, waypoint);
        this._openState(this._currentState, oldState);
    }

    _resolveWaypointResults(waypoints, successCallback, rejectCallback, closeOnFinish) {
        if (waypoints.length === 0) {
            rejectCallback();
        } else if (waypoints.length === 1) {
            successCallback(waypoints[0]);
        } else {
            this._openDuplicateWaypointWindow(waypoints[0].ident, waypoints, waypoint => {
                if (waypoint) {
                    successCallback(waypoint);
                } else {
                    rejectCallback();
                }
            });
            return;
        }
    }

    async _closeWaypointSearch(stateEntry, closeOnFinish) {
        this._lock();
        let waypoints = await this._currentState.onClosed(stateEntry);
        this._unlock();

        this._resolveWaypointResults(waypoints, this._insertWaypoint.bind(this, closeOnFinish), this._rejectWaypointSearch.bind(this, closeOnFinish));
    }

    async _insertWaypoint(closeOnFinish, waypoint) {
        let command = {
            type: WT_G5000_TSCFlightPlanKeyboard.CommandType.INSERT_WAYPOINT,
            waypoint: waypoint
        };

        this._lock();
        let wasCommandSuccessful = await this.context.callback(command);
        this._unlock();

        if (wasCommandSuccessful) {
            this.context.initialWaypoint = waypoint;
            this.context.initialAirway = null;
            this._initialWaypoint = waypoint;
            this._initialAirway = null;
            this._resetToInitialWaypoint();
        }
        if (closeOnFinish || !wasCommandSuccessful) {
            this.instrument.goBack();
        }
    }

    async _closeWaypointOrAirwaySearch(stateEntry, closeOnFinish) {
        this._lock();
        let result = await this._currentState.onClosed(stateEntry);
        this._unlock();

        if (result instanceof WT_Airway) {
            if (closeOnFinish) {
                this._confirmAirway(this._currentState.prevWaypoint, result, null, null, closeOnFinish);
            } else {
                await this._beginAirwayExitSearch(this._currentState.prevWaypoint, result);
            }
        } else {
            this._resolveWaypointResults(result, this._insertWaypoint.bind(this, closeOnFinish), this._rejectWaypointSearch.bind(this, closeOnFinish));
        }
    }

    _rejectAirwaySearch() {
        this._rollBackLastRouteCommand();
        this._currentState.onOpened(this._getStateEntry(this.htmlElement.getEntry()));
    }

    async _closeAirwaySearch(stateEntry, closeOnFinish) {
        this._lock();
        let airway = await this._currentState.onClosed(stateEntry);
        this._unlock();

        if (airway) {
            if (closeOnFinish) {
                this._confirmAirway(this._currentOperation.entryWaypoint, airway, null, null, closeOnFinish);
            } else {
                this._currentOperation.setAirway(airway);
                await this._beginAirwayExitSearch(this._currentState.entryWaypoint, airway);
            }
        } else {
            this._rejectAirwaySearch();
        }
    }

    _rejectAirwayExitSearch() {
        this._rollBackLastRouteCommand();
        this._currentState.onOpened(this._getStateEntry(this.htmlElement.getEntry()));
    }

    async _beginAirwayExitSearch(entryWaypoint, airway) {
        this._lock();

        let oldState = this._currentState;
        this._currentState = new WT_G5000_TSCFlightPlanKeyboardAirwayExitSearchState(this, entryWaypoint, airway);
        await this._currentState.init();
        this._openState(this._currentState, oldState);

        this._unlock();
    }

    /**
     *
     * @param {WT_Airway} nextAirway
     * @param {Boolean} closeOnFinish
     * @param {WT_Airway} airway
     * @param {WT_ICAOWaypoint[]} sequence
     */
    async _insertAirway(nextAirway, closeOnFinish, airway, sequence) {
        if (airway && sequence.length > 1) {
            let command = {
                type: WT_G5000_TSCFlightPlanKeyboard.CommandType.INSERT_AIRWAY,
                airway: airway,
                sequence: sequence
            };
            this._lock();
            let wasCommandSuccessful = await this.context.callback(command);
            this._unlock();

            if (wasCommandSuccessful) {
                this.context.initialWaypoint = sequence[sequence.length - 1];
                this.context.initialAirway = nextAirway;
                this._initialWaypoint = sequence[sequence.length - 1];
                this._initialAirway = nextAirway;
                this._resetToInitialWaypoint();
            } else {
                this.instrument.goBack();
                return;
            }
        } else {
            this._rejectAirwayExitSearch();
        }

        if (closeOnFinish) {
            this.instrument.goBack();
        }
    }

    _confirmAirway(entryWaypoint, airway, exitWaypoint, nextAirway, closeOnFinish) {
        this._unlock();
        this.context.airwaySelectionPopUp.element.setContext({
            homePageGroup: this.homePageGroup,
            homePageName: this.homePageName,
            entryWaypoint: entryWaypoint,
            airway: airway,
            exitWaypoint: exitWaypoint,
            callback: this._insertAirway.bind(this, nextAirway, closeOnFinish)
        });
        this.instrument.switchToPopUpPage(this.context.airwaySelectionPopUp);
    }

    async _closeAirwayExitSearch(stateEntry, closeOnFinish) {
        this._lock();

        let result = await this._currentState.onClosed(stateEntry);
        let nextAirway = null;
        if (result.intersection) {
            this._currentOperation.setExitWaypoint(result.intersection);
            nextAirway = result.airway;
        } else {
            if (result.length === 0) {
                this._currentOperation.setExitWaypoint(null);
            } else if (result.length === 1) {
                this._currentOperation.setExitWaypoint(result[0]);
            } else {
                this._openDuplicateWaypointWindow(result[0].ident, result, waypoint => {
                    this._currentOperation.setExitWaypoint(waypoint);
                    this._confirmAirway(this._currentOperation.entryWaypoint, this._currentOperation.airway, this._currentOperation.exitWaypoint, nextAirway, closeOnFinish);
                });
                return;
            }
        }

        this._confirmAirway(this._currentOperation.entryWaypoint, this._currentOperation.airway, this._currentOperation.exitWaypoint, nextAirway, closeOnFinish);
    }

    _parseRoute(stateEntry, closeOnFinish) {
        if (this._currentState instanceof WT_G5000_TSCFlightPlanKeyboardWaypointOrAirwaySearchState) {
            this._closeWaypointOrAirwaySearch(stateEntry, closeOnFinish);
        } else if (this._currentState instanceof WT_G5000_TSCFlightPlanKeyboardWaypointSearchState) {
            this._closeWaypointSearch(stateEntry, closeOnFinish);
        } else if (this._currentState instanceof WT_G5000_TSCFlightPlanKeyboardAirwaySearchState) {
            this._closeAirwaySearch(stateEntry, closeOnFinish);
        } else if (this._currentState instanceof WT_G5000_TSCFlightPlanKeyboardAirwayExitSearchState) {
            this._closeAirwayExitSearch(stateEntry, closeOnFinish);
        }
    }

    _onRouteButtonPressed(oldEntry, newEntry) {
        let stateEntry = this._getStateEntry(newEntry.substring(0, newEntry.length - 1)); // remove the new asterisk before parsing
        this._parseRoute(stateEntry, false);
    }

    _onRouteRolledBack(oldEntry, newEntry) {
        if (newEntry.indexOf("*") < 0 && this._initialWaypoint) {
            // don't allow user to remove initial waypoint
            this._ignoreEntryChanges = true;
            this.htmlElement.setEntry(oldEntry);
            this._ignoreEntryChanges = false;
        } else {
            if (this._stateHistory.length > 0) {
                this._currentState = this._stateHistory.pop();
                this._currentState.onOpened(this._getStateEntry(newEntry));
            }
        }
    }

    _notifyStateEntryChanged(oldEntry, newEntry) {
        if (this._currentState) {
            this._currentState.onEntryChanged(this._getStateEntry(oldEntry), this._getStateEntry(newEntry));
        }
    }

    _onKeyboardEntryChanged(source, oldEntry, newEntry) {
        if (this._ignoreEntryChanges) {
            return;
        }

        if (newEntry.length === 0) {
            this._resetFull();
            return;
        }

        if (newEntry.length > oldEntry.length) {
            if (newEntry[newEntry.length - 1] === "*") {
                this._onRouteButtonPressed(oldEntry, newEntry);
            } else {
                this._notifyStateEntryChanged(oldEntry, newEntry);
            }
        } else {
            if (oldEntry[oldEntry.length - 1] === "*") {
                this._onRouteRolledBack(oldEntry, newEntry);
            } else {
                this._notifyStateEntryChanged(oldEntry, newEntry);
            }
        }
    }

    _onEnterPressed() {
        this._parseRoute(this._getStateEntry(this.htmlElement.getEntry()), true);
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

    _initICAOSearch() {
        SimVar.SetSimVarValue("C:fs9gps:IcaoSearchStartCursor", "string", "AVNW", this.instrument.instrumentIdentifier);
    }

    onEnter() {
        super.onEnter();

        this._initICAOSearch();
        this._initialWaypoint = this.context.initialWaypoint;
        this._initialAirway = this.context.initialAirway;
        this._resetToInitialWaypoint();
    }

    _updateState() {
        if (this._currentState) {
            this._currentState.onUpdate(this._getStateEntry(this.htmlElement.getEntry()));
        }
    }

    _updateOperationMessage() {
        this.htmlElement.setOperationMessage(this._isLocked ? "Working..." : (this._currentOperation ? this._currentOperation.getMessage() : ""));
    }

    onUpdate(deltaTime) {
        if (!this._isLocked) {
            this._updateState();
        }
        this._updateOperationMessage();
    }
}
/**
 * @enum {Number}
 */
WT_G5000_TSCFlightPlanKeyboard.CommandType = {
    INSERT_WAYPOINT: 0,
    INSERT_AIRWAY: 1
};

/**
 * @typedef WT_G5000_TSCFlightPlanKeyboardCommand
 * @property {WT_G5000_TSCFlightPlanKeyboard.CommandType} type
 * @property {WT_ICAOWaypoint} [waypoint]
 * @property {WT_Airway} [airway]
 * @property {WT_ICAOWaypoint[]} [sequence]
 */

class WT_G5000_TSCFlightPlanKeyboardOperation {
    getMessage() {
        return "";
    }
}

class WT_G5000_TSCFlightPlanKeyboardInsertWaypointOperation extends WT_G5000_TSCFlightPlanKeyboardOperation {
    /**
     * @param {WT_Waypoint} prevWaypoint
     */
    constructor(prevWaypoint) {
        super();

        this._prevWaypoint = prevWaypoint;
        /**
         * @type {WT_Waypoint}
         */
        this._waypoint = null;
    }

    /**
     * @readonly
     * @type {WT_Waypoint}
     */
    get prevWaypoint() {
        return this._prevWaypoint;
    }

    /**
     * @readonly
     * @type {WT_Waypoint}
     */
    get waypoint() {
        return this._waypoint;
    }

    setWaypoint(waypoint) {
        this._waypoint = waypoint;
    }

    getMessage() {
        return `Inserting ${this.prevWaypoint ? `after ${this.prevWaypoint.ident}` : "at start of flight plan"}`;
    }
}

class WT_G5000_TSCFlightPlanKeyboardInsertAirwayOperation extends WT_G5000_TSCFlightPlanKeyboardOperation {
    /**
     * @param {WT_ICAOWaypoint} entryWaypoint
     * @param {WT_Airway} [airway]
     * @param {WT_ICAOWaypoint} [exitWaypoint]
     */
    constructor(entryWaypoint, airway, exitWaypoint) {
        super();

        this._entryWaypoint = entryWaypoint;
        this._airway = airway ? airway : null;
        this._exitWaypoint = exitWaypoint ? exitWaypoint : null;
    }

    /**
     * @readonly
     * @type {WT_ICAOWaypoint}
     */
    get entryWaypoint() {
        return this._entryWaypoint;
    }

    /**
     * @readonly
     * @type {WT_Airway}
     */
    get airway() {
        return this._airway;
    }

    /**
     * @readonly
     * @type {WT_ICAOWaypoint}
     */
    get exitWaypoint() {
        return this._exitWaypoint;
    }

    setAirway(airway) {
        this._airway = airway;
    }

    setExitWaypoint(waypoint) {
        this._exitWaypoint = waypoint;
    }

    getMessage() {
        if (this.airway) {
            return `Inserting exit for airway ${this.airway.name}${this.entryWaypoint ? ` (entry at ${this.entryWaypoint.ident})` : ""}`;
        } else {
            return "";
        }
    }
}

class WT_G5000_TSCFlightPlanKeyboardState {
    /**
     * @param {WT_G5000_TSCFlightPlanKeyboard} parent
     */
    constructor(parent) {
        this._parent = parent;
    }

    /**
     * @readonly
     * @type {WT_G5000_TSCFlightPlanKeyboard}
     */
    get parent() {
        return this._parent;
    }

    onOpened(entry) {
    }

    onEntryChanged(oldEntry, newEntry) {
    }

    onUpdate(entry) {
    }

    async onClosed(entry) {
    }
}

class WT_G5000_TSCFlightPlanKeyboardWaypointSearchState extends WT_G5000_TSCFlightPlanKeyboardState {
    /**
     * @param {WT_G5000_TSCFlightPlanKeyboard} parent
     */
    constructor(parent) {
        super(parent);

        this._searchResultCount = 0;
        this._searchResultWaypoint = null;
        this._waypointSearchID = 0;
    }

    _initOperation() {
        this.parent.setCurrentOperation(new WT_G5000_TSCFlightPlanKeyboardInsertWaypointOperation(null));
    }

    _searchForICAO(ident) {
        this.parent.setICAOSearchIdent(ident);
    }

    onOpened(entry) {
        this._initOperation();
        this._searchForICAO(entry);
    }

    onEntryChanged(oldEntry, newEntry) {
        this._searchForICAO(newEntry);
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
            waypoint = await this.parent.instrument.icaoWaypointFactory.getWaypoint(icao);
        } catch (e) {
            console.log(e);
        }

        if (waypointSearchID !== this._waypointSearchID) {
            return;
        }

        this._setSearchResultWaypoint(waypoint);
    }

    _updateSearchResults(entry) {
        let searchResultCount = this.parent.getICAOSearchResultCount();

        let icao = "";
        if (searchResultCount > 0) {
            // fs9gps search does fuzzy match, so we need to make sure the returned ICAO matches the currently entered ident
            icao = this.parent.getICAOSearchResult();
            let ident = icao.substr(7, 5).trim();
            if (ident !== entry) {
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
            this.parent.htmlElement.setSearchMessage("No matches found");
            this.parent.htmlElement.setWaypoint(null);
        } else if (this._searchResultCount > 1) {
            this.parent.htmlElement.setSearchMessage("Duplicates found");
            this.parent.htmlElement.setWaypoint(null);
        } else if (this._searchResultWaypoint) {
            this.parent.htmlElement.setSearchMessage(this._searchResultWaypointMessage);
            this.parent.htmlElement.setWaypoint(this._searchResultWaypoint);
        } else {
            this.parent.htmlElement.setSearchMessage("No matches found");
            this.parent.htmlElement.setWaypoint(null);
        }
    }

    onUpdate(entry) {
        this._updateSearchResults(entry);
        this._updateKeyboardFromSearchResults();
    }

    /**
     *
     * @param {String} entry
     * @returns {Promise<WT_ICAOWaypoint[]>}
     */
    async onClosed(entry) {
        if (this._searchResultCount > 1) {
            return this.parent.searchICAOBatch();
        } else {
            return this._searchResultWaypoint ? [this._searchResultWaypoint] : [];
        }
    }
}

class WT_G5000_TSCFlightPlanKeyboardWaypointOrAirwaySearchState extends WT_G5000_TSCFlightPlanKeyboardWaypointSearchState {
    /**
     * @param {WT_G5000_TSCFlightPlanKeyboard} parent
     * @param {WT_ICAOWaypoint} prevWaypoint
     */
    constructor(parent, prevWaypoint) {
        super(parent);

        this._prevWaypoint = prevWaypoint;
    }

    /**
     * @readonly
     * @type {WT_ICAOWaypoint}
     */
    get prevWaypoint() {
        return this._prevWaypoint;
    }

    _initOperation() {
        this.parent.setCurrentOperation(new WT_G5000_TSCFlightPlanKeyboardInsertWaypointOperation(this.prevWaypoint));
    }

    /**
     *
     * @param {String} entry
     * @returns {Promise<WT_ICAOWaypoint[]|WT_Airway>}
     */
    async onClosed(entry) {
        // if an airway can be matched, it will always take precedent over any matched waypoints
        let airway;
        if (this.prevWaypoint.airways) {
            airway = this.prevWaypoint.airways.find(airway => airway.name === entry);
        }
        if (airway) {
            return airway;
        } else {
            return super.onClosed(entry);
        }
    }
}

class WT_G5000_TSCFlightPlanKeyboardAirwaySearchState extends WT_G5000_TSCFlightPlanKeyboardState {
    /**
     * @param {WT_G5000_TSCFlightPlanKeyboard} parent
     * @param {WT_ICAOWaypoint} entryWaypoint
     */
     constructor(parent, entryWaypoint) {
        super(parent);

        this._entryWaypoint = entryWaypoint;
    }

    /**
     * @readonly
     * @type {WT_ICAOWaypoint}
     */
    get entryWaypoint() {
        return this._entryWaypoint;
    }

    _initOperation() {
        this.parent.setCurrentOperation(new WT_G5000_TSCFlightPlanKeyboardInsertAirwayOperation(this.entryWaypoint));
    }

    onOpened(entry) {
        this._initOperation();
    }

    _searchForAirway(name) {
        let airway = null;
        if (this._entryWaypoint && this._entryWaypoint.airways) {
            let index = this._entryWaypoint.airways.findIndex(airway => airway.name === name);
            if (index >= 0) {
                airway = this._entryWaypoint.airways[index];
            }
        }
        return airway;
    }

    /**
     *
     * @param {String} entry
     * @returns {Promise<WT_Airway>}
     */
    async onClosed(entry) {
        return this._searchForAirway(entry);
    }
}

class WT_G5000_TSCFlightPlanKeyboardAirwayExitSearchState extends WT_G5000_TSCFlightPlanKeyboardState {
    /**
     * @param {WT_G5000_TSCFlightPlanKeyboard} parent
     * @param {WT_ICAOWaypoint} entryWaypoint
     * @param {WT_Airway} airway
     */
    constructor(parent, entryWaypoint, airway) {
        super(parent);

        this._entryWaypoint = entryWaypoint;
        this._airway = airway;
        /**
         * @type {WT_ICAOWaypoint[]}
         */
        this._exits = [];
    }

    /**
     * @readonly
     * @type {WT_ICAOWaypoint}
     */
    get entryWaypoint() {
        return this._entryWaypoint;
    }

    /**
     * @readonly
     * @type {WT_Airway}
     */
    get airway() {
        return this._airway;
    }

    async init() {
        this._waypoints = (await this._airway.getWaypoints()).slice().sort((a, b) => a.ident.localeCompare(b.ident));
    }

    _initOperation() {
        this.parent.setCurrentOperation(new WT_G5000_TSCFlightPlanKeyboardInsertAirwayOperation(this.entryWaypoint, this.airway));
    }

    _updateKeyboardFromExit(ident) {
        let subdued = "";
        if (this._exits.length === 0) {
            this.parent.htmlElement.setSearchMessage("No matches found");
            this.parent.htmlElement.setWaypoint(null);
        } else if (this._exits.length > 1) {
            this.parent.htmlElement.setSearchMessage("Duplicates found");
            this.parent.htmlElement.setWaypoint(null);
        } else {
            let exit = this._exits[0];
            this.parent.htmlElement.setSearchMessage(exit.name ? exit.name : WT_G3x5_RegionNames.getName(exit.region));
            this.parent.htmlElement.setWaypoint(exit);
            if (exit.ident.length > ident.length) {
                subdued = exit.ident.substring(ident.length);
            }
        }
        this.parent.htmlElement.setSubdued(subdued);
    }

    _searchForExit(ident) {
        if (ident === "") {
            this._exits = [];
        } else {
            this._exits = this._waypoints.filter(waypoint => waypoint.ident === ident);
            if (this._exits.length === 0) {
                // autofill
                let first = this._waypoints.find(waypoint => waypoint.ident.indexOf(ident) === 0);
                if (first) {
                    this._exits.push(first);
                }
            }
        }

        this._updateKeyboardFromExit(ident);
    }

    onOpened(entry) {
        this._initOperation();
        this._searchForExit(entry);
    }

    onEntryChanged(oldEntry, newEntry) {
        this._searchForExit(newEntry);
    }

    _findAirwayIntersection(entry) {
        let intersection = this._waypoints.find(waypoint => waypoint.airways && waypoint.airways.findIndex(airway => airway.name === entry) >= 0);
        if (intersection) {
            return {
                airway: intersection.airways.find(airway => airway.name === entry),
                intersection: intersection
            }
        } else {
            return null;
        }
    }

    /**
     *
     * @param {String} entry
     * @returns {Promise<WT_ICAOWaypoint[]|{airway:WT_Airway, intersection:WT_ICAOWaypoint}>}
     */
    async onClosed(entry) {
        if (this._exits.length === 0) {
            let intersection = this._findAirwayIntersection(entry);
            if (intersection) {
                return intersection;
            }
        }

        return this._exits;
    }
}

class WT_G5000_TSCFlightPlanKeyboardHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {((source:WT_G3x5_TSCAlphaNumKeyboard, oldEntry:String, newEntry:String) => void)[]}
         */
        this._listeners = [];

        this._entry = "";
        this._subdued = "";
        this._displayOffset = 0;
        this._cursorIndex = 0;
        this._searchMessageText = "";
        this._operationMessageText = "";
        /**
         * @type {WT_ICAOWaypoint}
         */
        this._waypoint = null;
        this._isLocked = false;
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G5000_TSCFlightPlanKeyboardHTMLElement.TEMPLATE;
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get isLocked() {
        return this._isLocked;
    }

    async _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);

        this._charDisplays = [...this.shadowRoot.querySelectorAll(`.char`)];
        this._searchMessageDisplay = this.shadowRoot.querySelector(`#searchmessagetext`);
        this._operationMessageDisplay = this.shadowRoot.querySelector(`#operationmessagetext`);
        this._waypointIcon = this.shadowRoot.querySelector(`#waypointicon`);
        this._keyboard = await WT_CustomElementSelector.select(this.shadowRoot, `#keyboard`, WT_G5000_TSCFlightPlanAlphaNumKeyboard);
    }

    _initWaypointIconSrcFactory() {
        this._waypointIconSrcFactory = new WT_G3x5_TSCWaypointButtonIconSrcFactory(WT_G5000_TSCFlightPlanKeyboardHTMLElement.WAYPOINT_ICON_PATH);
    }

    _initKeyboardListener() {
        this._keyboard.addListener(this._onKeyboardEvent.bind(this));
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._initWaypointIconSrcFactory();
        this._initKeyboardListener();
        this._isInit = true;
        this._updateDisplay();
        this._updateFromSearchMessageText();
        this._updateFromOperationMessageText();
        this._updateFromWaypoint();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    getEntry() {
        return this._entry;
    }

    getSubdued() {
        return this._subdued;
    }

    _updateDisplay() {
        this._displayOffset = Math.max(0, this._entry.length + this._subdued.length - this._charDisplays.length + 1); // shift chars offscreen to the left if entry is too large to fit in the display
        this._cursorIndex = this._entry.length - this._displayOffset;
        for (let i = 0; i < this._charDisplays.length; i++) {
            if (i + this._displayOffset < this._entry.length) {
                this._charDisplays[i].textContent = this._entry[i + this._displayOffset];
                this._charDisplays[i].setAttribute("subdued", "false");
            } else if (i + this._displayOffset < this._entry.length + this._subdued.length) {
                this._charDisplays[i].textContent = this._subdued[i + this._displayOffset - this._entry.length];
                this._charDisplays[i].setAttribute("subdued", "true");
            } else {
                this._charDisplays[i].textContent = "_";
                this._charDisplays[i].setAttribute("subdued", "false");
            }
            this._charDisplays[i].setAttribute("cursor", `${i === this._cursorIndex}`);
        }
    }

    /**
     *
     * @param {String} entry
     */
    setEntry(entry) {
        if (this._entry === entry) {
            return;
        }

        let oldEntry = this._entry;
        this._entry = entry;
        if (this._isInit) {
            this._updateDisplay();
        }
        this._notifyEntryChangedListeners(oldEntry, entry);
    }

    /**
     *
     * @param {String} subdued
     */
    setSubdued(subdued) {
        if (this._subdued === subdued) {
            return;
        }

        this._subdued = subdued;
        if (this._isInit) {
            this._updateDisplay();
        }
    }

    _updateFromSearchMessageText() {
        this._searchMessageDisplay.textContent = this._searchMessageText;
    }

    /**
     *
     * @param {String} text
     */
    setSearchMessage(text) {
        if (text === this._searchMessageText) {
            return;
        }

        this._searchMessageText = text;
        if (this._isInit) {
            this._updateFromSearchMessageText();
        }
    }

    _updateFromOperationMessageText() {
        this._operationMessageDisplay.textContent = this._operationMessageText;
    }

    /**
     *
     * @param {String} text
     */
    setOperationMessage(text) {
        if (text === this._operationMessageText) {
            return;
        }

        this._operationMessageText = text;
        if (this._isInit) {
            this._updateFromOperationMessageText();
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

    lock() {
        this._isLocked = true;
    }

    unlock() {
        this._isLocked = false;
    }

    _appendCharToEntry(char) {
        let oldEntry = this._entry;
        this._entry += char;

        this._updateDisplay();
        this._notifyEntryChangedListeners(oldEntry, this._entry);
    }

    _popCharFromEntry() {
        if (this._entry.length === 0) {
            return;
        }

        let oldEntry = this._entry;
        this._entry = this._entry.substring(0, this._entry.length - 1);

        this._updateDisplay();
        this._notifyEntryChangedListeners(oldEntry, this._entry);
    }

    _onRoutePressed() {
        let oldEntry = this._entry;
        this._entry += this._subdued + "*";
        this._updateDisplay();
        this._notifyEntryChangedListeners(oldEntry, this._entry);
    }

    _onKeyboardEvent(source, eventType, char) {
        if (this._isLocked) {
            return;
        }

        switch (eventType) {
            case WT_G5000_TSCFlightPlanAlphaNumKeyboard.EventType.CHAR_KEY_PRESSED:
                this._appendCharToEntry(char);
                break;
            case WT_G5000_TSCFlightPlanAlphaNumKeyboard.EventType.BACKSPACE_PRESSED:
                this._popCharFromEntry();
                break;
            case WT_G5000_TSCFlightPlanAlphaNumKeyboard.EventType.ROUTE_PRESSED:
                this._onRoutePressed();
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
WT_G5000_TSCFlightPlanKeyboardHTMLElement.WAYPOINT_ICON_PATH = "/WTg3000/SDK/Assets/Images/Garmin/TSC/Waypoints";
WT_G5000_TSCFlightPlanKeyboardHTMLElement.NAME = "wt-tsc-fplnkeyboard";
WT_G5000_TSCFlightPlanKeyboardHTMLElement.TEMPLATE = document.createElement("template");
WT_G5000_TSCFlightPlanKeyboardHTMLElement.TEMPLATE.innerHTML = `
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
        @keyframes blink-subdued {
            0% {
                background: var(--wt-g3x5-lightblue);
            }
            50% {
                background: transparent;
            }
            100% {
                background: var(--wt-g3x5-lightblue);
            }
        }

        #wrapper {
            position: absolute;
            left: var(--fplnkeyboard-padding-left, 0px);
            top: var(--fplnkeyboard-padding-top, 0px);
            width: calc(100% - var(--fplnkeyboard-padding-left, 0px) - var(--fplnkeyboard-padding-right, 0px));
            height: calc(100% - var(--fplnkeyboard-padding-top, 0px) - var(--fplnkeyboard-padding-bottom, 0px));
            display: grid;
            grid-template-rows: var(--fplnkeyboard-toprow-height, 2.2em) 1fr;
            grid-template-columns: 100%;
            grid-gap: var(--fplnkeyboard-toprow-margin-bottom, 0) 0;
        }
            #top {
                position: relative;
                width: 100%;
                height: 100%;
                display: grid;
                grid-template-rows: var(--fplnkeyboard-display-height, 1.4em) 1fr;
                grid-template-columns: 100%;
                grid-gap: var(--fplnkeyboard-display-margin-bottom, 0.1em);
                transform: rotateX(0deg);
            }
                .messageText {
                    font-size: var(--fplnkeyboard-message-font-size, 0.67em);
                }
                #toprow1 {
                    position: relative;
                }
                    #display {
                        position: absolute;
                        left: 0%;
                        top: 0%;
                        width: var(--fplnkeyboard-display-width, 55%);
                        height: 100%;
                        background: #222222;
                        font-family: var(--fplnkeyboard-display-font-family, "Roboto-Mono");
                    }
                        #charcontainer {
                            position: absolute;
                            left: var(--fplnkeyboard-display-padding-left, 0.1em);
                            top: var(--fplnkeyboard-display-padding-top, 0.1em);
                            width: calc(100% - var(--fplnkeyboard-display-padding-left, 0.1em) - var(--fplnkeyboard-display-padding-right, 0.1em));
                            height: calc(100% - var(--fplnkeyboard-display-padding-top, 0.1em) - var(--fplnkeyboard-display-padding-bottom, 0.1em));
                            display: flex;
                            flex-row: row nowrap;
                            justify-content: flex-start;
                            align-items: center;
                        }
                            .char {
                                color: var(--wt-g3x5-lightblue);
                            }
                            .char[subdued="true"] {
                                color: #083f42;
                            }
                            .char[cursor="true"][subdued="false"] {
                                animation: blink 1s infinite step-end;
                            }
                            .char[cursor="true"][subdued="true"] {
                                animation: blink-subdued 1s infinite step-end;
                            }
                    #searchmessage {
                        position: absolute;
                        left: calc(var(--fplnkeyboard-display-width, 55%) + var(--fplnkeyboard-searchmessage-margin-left, 0.2em));
                        top: 50%;
                        width: calc(100% - var(--fplnkeyboard-display-width, 55%) - var(--fplnkeyboard-searchmessage-margin-left, 0.2em));
                        transform: translateY(-50%);
                        color: white;
                        white-space: nowrap;
                        overflow: hidden;
                    }
                #toprow2 {
                    position: relative;
                }
                    #operationmessage {
                        position: absolute;
                        left: 0%;
                        top: 50%;
                        width: calc(100% - var(--fplnkeyboard-waypointicon-size, 0.67em) - var(--fplnkeyboard-searchmessage-margin-right, 0.2em));
                        transform: translateY(-50%);
                        color: white;
                        white-space: nowrap;
                        overflow: hidden;
                    }
                    #waypointicon {
                        position: absolute;
                        right: 0%;
                        top: 50%;
                        width: var(--fplnkeyboard-waypointicon-size, 0.67em);
                        height: var(--fplnkeyboard-waypointicon-size, 0.67em);
                        transform: translateY(-50%);
                    }
            #keyboard {
                position: relative;
                width: 100%;
                height: 100%;
                font-size: var(--fplnkeyboard-keyboard-font-size, 1em);
            }
    </style>
    <div id="wrapper">
        <div id="top">
            <div id="toprow1">
                <div id="display">
                    <div id="charcontainer">
                        <div class="char"></div>
                        <div class="char"></div>
                        <div class="char"></div>
                        <div class="char"></div>
                        <div class="char"></div>
                        <div class="char"></div>
                        <div class="char"></div>
                        <div class="char"></div>
                        <div class="char"></div>
                        <div class="char"></div>
                        <div class="char"></div>
                        <div class="char"></div>
                        <div class="char"></div>
                        <div class="char"></div>
                        <div class="char"></div>
                    </div>
                </div>
                <div id="searchmessage">
                    <div id="searchmessagetext" class="messageText"></div>
                </div>
            </div>
            <div id="toprow2">
                <div id="operationmessage">
                    <div id="operationmessagetext" class="messageText"></div>
                </div>
                <img id="waypointicon" />
            </div>
        </div>
        <wt-tsc-fplnalphanumkeyboard id="keyboard"></wt-tsc-fplnalphanumkeyboard>
    </div>
`;

customElements.define(WT_G5000_TSCFlightPlanKeyboardHTMLElement.NAME, WT_G5000_TSCFlightPlanKeyboardHTMLElement);