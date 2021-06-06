class WT_G3x5_TSCFlightPlan extends WT_G3x5_TSCPageElement {
    /**
     * @param {String} homePageGroup
     * @param {String} homePageName
     */
    constructor(homePageGroup, homePageName, instrumentID) {
        super(homePageGroup, homePageName);

        this._instrumentID = instrumentID;

        this._source = WT_G3x5_TSCFlightPlan.Source.ACTIVE;
        /**
         * @type {WT_FlightPlan}
         */
        this._displayedFlightPlan = null;
        /**
         * @type {WT_FlightPlanVNAV}
         */
        this._displayedFlightPlanVNAV = null;
        this._selectedRow = null;
        this._isInit = false;

        this._initState();
        this._initSettings();
    }

    _initState() {
        /**
         * @type {WT_G3x5_TSCFlightPlanState}
         */
        this._state = {
            _settings: null,
            _airplaneHeadingTrue: 0,
            _isDirectToActive: false,
            _activeLeg: null,

            get settings() {
                return this._settings;
            },

            get airplaneHeadingTrue() {
                return this._airplaneHeadingTrue;
            },

            get isDirectToActive() {
                return this._isDirectToActive;
            },

            get activeLeg() {
                return this._activeLeg;
            }
        };
    }

    _initSettings() {
        this._settings = new WT_G3x5_TSCFlightPlanSettings(this._instrumentID);
        this._settings.init();

        this._state._settings = this._settings;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCFlightPlanSettings}
     */
    get settings() {
        return this._settings;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCFlightPlanHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCFlightPlan.Source}
     */
    get source() {
        return this._source;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCFlightPlanUnitsModel}
     */
    get unitsModel() {
        return this._unitsModel;
    }

    _initPopUps() {
        this._flightPlanOptionsPopUp = new WT_G3x5_TSCElementContainer("Flight Plan Options", "FlightPlanOptions", new WT_G3x5_TSCFlightPlanOptions());
        this._flightPlanOptionsPopUp.setGPS(this.instrument);

        this._airwaySelectionPopUp = new WT_G3x5_TSCElementContainer("Airway Selection", "AirwaySelection", new WT_G3x5_TSCAirwaySelection());
        this._airwaySelectionPopUp.setGPS(this.instrument);

        this._activateLegConfirmPopUp = new WT_G3x5_TSCElementContainer("Activate Leg Confirm", "ActivateLegConfirm", new WT_G3x5_TSCActivateLegConfirmation());
        this._activateLegConfirmPopUp.setGPS(this.instrument);
    }

    _createHTMLElement() {
        return new WT_G3x5_TSCFlightPlanHTMLElement();
    }

    _initHTMLElement() {
        this.htmlElement.setParentPage(this);
    }

    _initButtonEventHandlerMap() {
        /**
         * @type {((event:WT_G3x5_TSCFlightPlanButtonEvent) => void)[]}
         */
        this._buttonEventHandlers = [];
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DRCT] = this._onDRCTButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ACTIVATE_STANDBY] = this._onActivateStandbyButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.PROC] = this._onProcButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.STANDBY_FLIGHT_PLAN] = this._onStandbyFlightPlanButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ACTIVE_FLIGHT_PLAN] = this._onActiveFlightPlanButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.VNAV] = this._onVNAVButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.FLIGHT_PLAN_OPTIONS] = this._onFlightPlanOptionsButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.HEADER] = this._onHeaderButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.LEG_WAYPOINT] = this._onLegWaypointButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.LEG_ALTITUDE] = this._onLegAltitudeButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ENROUTE_ADD] = this._onEnrouteAddButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ORIGIN_SELECT] = this._onOriginSelectButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DEPARTURE_SELECT] = this._onDepartureSelectButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ORIGIN_REMOVE] = this._onOriginRemoveButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ORIGIN_INFO] = this._onOriginInfoButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DESTINATION_SELECT] = this._onDestinationSelectButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ARRIVAL_SELECT] = this._onArrivalSelectButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.APPROACH_SELECT] = this._onApproachSelectButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DESTINATION_REMOVE] = this._onDestinationRemoveButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DESTINATION_INFO] = this._onDestinationInfoButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.INSERT_BEFORE] = this._onInsertBeforeButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.INSERT_AFTER] = this._onInsertAfterButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.WAYPOINT_DRCT] = this._onWaypointDRCTButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ACTIVATE_LEG] = this._onActivateLegButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.LOAD_AIRWAY] = this._onLoadAirwayButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.WAYPOINT_REMOVE] = this._onWaypointRemoveButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.WAYPOINT_INFO] = this._onWaypointInfoButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.AIRWAY_COLLAPSE] = this._onAirwayCollapseButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.AIRWAY_EXPAND] = this._onAirwayExpandButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.AIRWAY_COLLAPSE_ALL] = this._onAirwayCollapseAllButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.AIRWAY_EXPAND_ALL] = this._onAirwayExpandAllButtonPressed.bind(this);
        this._buttonEventHandlers[WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.AIRWAY_REMOVE] = this._onAirwayRemoveButtonPressed.bind(this);
    }

    _initButtonListener() {
        this._initButtonEventHandlerMap();
        this.htmlElement.addButtonListener(this._onButtonPressed.bind(this));
    }

    init(root) {
        this._fpm = this.instrument.flightPlanManagerWT;
        this._unitsModel = new WT_G3x5_TSCFlightPlanUnitsModel(this.instrument.unitsSettingModel);

        this._initPopUps();
        this._htmlElement = this._createHTMLElement();
        root.appendChild(this.htmlElement);
        this._initHTMLElement();
        this._initButtonListener();
        this._isInit = true;
        this._updateFromSource();
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanRowHTMLElement} selectedRow
     * @returns {WT_FlightPlanElement}
     */
    _getSelectedElement(selectedRow) {
        if (!selectedRow) {
            return null;
        }

        switch (selectedRow.getMode()) {
            case WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG:
            case WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.AIRWAY_FOOTER:
                return selectedRow.getActiveModeHTMLElement().leg;
            case WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.HEADER:
                return selectedRow.getActiveModeHTMLElement().sequence;
        }

        return null;
    }

    _getTitle() {
        let selectedElement = this._getSelectedElement(this._selectedRow);
        if (selectedElement instanceof WT_FlightPlanLeg) {
            return "Waypoint Options";
        } else if (selectedElement instanceof WT_FlightPlanAirwaySequence) {
            return "Airway Options";
        } else if (selectedElement instanceof WT_FlightPlanSegment) {
            switch (selectedElement.segment) {
                case WT_FlightPlan.Segment.ORIGIN:
                case WT_FlightPlan.Segment.DEPARTURE:
                    return "Origin Options";
                case WT_FlightPlan.Segment.DESTINATION:
                case WT_FlightPlan.Segment.ARRIVAL:
                case WT_FlightPlan.Segment.APPROACH:
                    return "Destination Options";
            }
        }

        return this._source === WT_G3x5_TSCFlightPlan.Source.ACTIVE ? "Active Flight Plan" : "Standby Flight Plan";
    }

    _updateTitle() {
        this.container.title = this._getTitle();
    }

    _updateFromSource() {
        let flightPlan;
        let flightPlanVNAV = null;
        if (this._source === WT_G3x5_TSCFlightPlan.Source.ACTIVE) {
            flightPlan = this._fpm.activePlan;
            flightPlanVNAV = this._fpm.activePlanVNAV;
        } else {
            flightPlan = this._fpm.standbyPlan;
        }
        this._setDisplayedFlightPlan(flightPlan, flightPlanVNAV);
        this.htmlElement.setSource(this._source);
        this._updateTitle();
        this.updateFlightPlanPreview();
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlan.Source} source
     */
    setSource(source) {
        if (this._source === source) {
            return;
        }

        this._source = source;
        if (this._isInit) {
            this._updateFromSource();
        }
    }

    updateFlightPlanPreview() {
        let paneSettings = this.instrument.getSelectedPaneSettings();
        if (paneSettings.display.mode === WT_G3x5_PaneDisplaySetting.Mode.FLIGHT_PLAN) {
            let selectedElement = this._getSelectedElement(this.htmlElement.getSelectedRow());
            let source = this._source === WT_G3x5_TSCFlightPlan.Source.ACTIVE ? WT_G3x5_FlightPlanDisplayFlightPlanSetting.Source.ACTIVE : WT_G3x5_FlightPlanDisplayFlightPlanSetting.Source.STANDBY;
            paneSettings.flightPlan.setFlightPlan(source, -1, selectedElement);
        }
    }

    _setDisplayedFlightPlan(flightPlan, flightPlanVNAV) {
        this._displayedFlightPlan = flightPlan;
        this._displayedFlightPlanVNAV = flightPlanVNAV;
        this.htmlElement.setFlightPlan(flightPlan, flightPlanVNAV);
    }

    /**
     *
     * @param {WT_FlightPlan} flightPlan
     * @param {WT_FlightPlan.Segment} segment
     * @param {Number} index
     */
    _findPreviousLegFromSegmentIndex(flightPlan, segment, index) {
        let previousLegSegment = segment;
        let segmentElement = flightPlan.getSegment(previousLegSegment);
        index = Math.min(index, segmentElement.elements.length);
        let element;
        if (segmentElement.elements.length > 0) {
            element = segmentElement.elements.get(index - 1);
        }
        while (!element && previousLegSegment > 0) {
            previousLegSegment--;
            segmentElement = flightPlan.getSegment(previousLegSegment);
            if (segmentElement) {
                element = segmentElement.elements.last();
            }
        }
        let previousLeg;
        if (element) {
            previousLeg = element.legs.last();
        }
        return previousLeg;
    }

    /**
     *
     * @param {WT_ICAOWaypoint} waypoint
     */
    _selectOrigin(waypoint) {
        if (!waypoint) {
            return;
        }

        try {
            if (this._source === WT_G3x5_TSCFlightPlan.Source.ACTIVE) {
                this._fpm.setActiveOrigin(waypoint);
            } else {
                this._displayedFlightPlan.setOrigin(waypoint);
            }
        } catch (e) {
            console.log(e);
        }
    }

    /**
     *
     * @param {WT_ICAOWaypoint} waypoint
     */
    _selectDestination(waypoint) {
        if (!waypoint) {
            return;
        }

        try {
            if (this._source === WT_G3x5_TSCFlightPlan.Source.ACTIVE) {
                this._fpm.setActiveDestination(waypoint);
            } else {
                this._displayedFlightPlan.setDestination(waypoint);
            }
        } catch (e) {
            console.log(e);
        }
    }

    _removeOrigin() {
        if (this._source === WT_G3x5_TSCFlightPlan.Source.ACTIVE) {
            this._fpm.removeActiveOrigin();
        } else {
            this._displayedFlightPlan.removeOrigin();
        }
    }

    _removeDestination() {
        if (this._source === WT_G3x5_TSCFlightPlan.Source.ACTIVE) {
            this._fpm.removeActiveDestination();
        } else {
            this._displayedFlightPlan.removeDestination();
        }
    }

    /**
     *
     * @param {WT_FlightPlan.Segment} segment
     * @param {WT_ICAOWaypoint} waypoint
     * @param {Number} [index]
     */
    async _insertWaypointToIndex(segment, waypoint, index) {
        try {
            if (this._source === WT_G3x5_TSCFlightPlan.Source.ACTIVE) {
                this._fpm.addWaypointToActive(segment, waypoint, index);
            } else {
                await this._displayedFlightPlan.insertWaypoint(segment, {waypoint: waypoint}, index);
            }
            return true;
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     * @param {Number} deltaIndex
     * @param {WT_ICAOWaypoint} waypoint
     */
    async _insertWaypointFromLeg(leg, deltaIndex, waypoint) {
        if (!waypoint || leg.flightPlan !== this._displayedFlightPlan) {
            return false;
        }

        let legSegmentIndex = leg.flightPlan.getSegment(leg.segment).elements.indexOf(leg);
        return this._insertWaypointToIndex(leg.segment, waypoint, legSegmentIndex + deltaIndex);
    }

    /**
     *
     * @param {WT_ICAOWaypoint} waypoint
     */
    async _appendToEnroute(waypoint) {
        if (!waypoint) {
            return false;
        }

        return this._insertWaypointToIndex(WT_FlightPlan.Segment.ENROUTE, waypoint);
    }

    /**
     *
     * @param {WT_FlightPlan.Segment} segment
     * @param {WT_Airway} airway
     * @param {WT_ICAOWaypoint[]} waypointSequence
     * @param {Number} [index]
     */
    async _insertAirwayToIndex(segment, airway, waypointSequence, index) {
        try {
            let previousLeg = this._findPreviousLegFromSegmentIndex(this._displayedFlightPlan, segment, index);

            let enter = waypointSequence[0];
            let exit = waypointSequence[waypointSequence.length - 1];
            if (previousLeg && enter.equals(previousLeg.fix)) {
                // if the airway entry waypoint is equal to the previous leg fix,
                // then set the entry waypoint to the next in the sequence to avoid duplicating a leg
                enter = waypointSequence[1];
            }
            if (this._source === WT_G3x5_TSCFlightPlan.Source.ACTIVE) {
                this._fpm.addAirwaySequenceToActive(segment, airway, enter, exit, index);
            } else {
                await this._displayedFlightPlan.insertAirway(segment, airway, enter, exit, index);
            }
            return true;
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    /**
     *
     * @param {WT_FlightPlanLeg} referenceLeg
     * @param {Number} indexDelta
     * @param {WT_Airway} airway
     * @param {WT_ICAOWaypoint[]} waypointSequence
     */
    async _insertAirwayFromLeg(referenceLeg, indexDelta, airway, waypointSequence) {
        if (referenceLeg.flightPlan !== this._displayedFlightPlan || !airway || !waypointSequence) {
            return false;
        }

        let segmentElement = referenceLeg.flightPlan.getSegment(referenceLeg.segment);
        let index;
        if (referenceLeg.parent instanceof WT_FlightPlanAirwaySequence) {
            index = segmentElement.elements.indexOf(referenceLeg.parent);
        } else {
            index = segmentElement.elements.indexOf(referenceLeg);
        }

        if (index >= 0) {
            return this._insertAirwayToIndex(referenceLeg.segment, airway, waypointSequence, index + indexDelta);
        } else {
            return false;
        }
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     */
    _removeLeg(leg) {
        try {
            if (this._source === WT_G3x5_TSCFlightPlan.Source.ACTIVE) {
                switch (leg.segment) {
                    case WT_FlightPlan.Segment.ORIGIN:
                        this._fpm.removeActiveOrigin();
                        break;
                    case WT_FlightPlan.Segment.ENROUTE:
                        this._fpm.removeFromActive(leg);
                        break;
                    case WT_FlightPlan.Segment.DESTINATION:
                        this._fpm.removeActiveDestination();
                        break;
                }
            } else {
                switch (leg.segment) {
                    case WT_FlightPlan.Segment.ORIGIN:
                        this._displayedFlightPlan.removeOrigin();
                        break;
                    case WT_FlightPlan.Segment.DESTINATION:
                        this._displayedFlightPlan.removeDestination();
                        break;
                    default:
                        this._displayedFlightPlan.removeElement(leg.segment, leg);
                }
            }
            return true;
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    /**
     *
     * @param {WT_FlightPlanAirwaySequence} sequence
     */
    _removeAirwaySequence(sequence) {
        if (sequence.segment !== WT_FlightPlan.Segment.ENROUTE) {
            return false;
        }

        try {
            if (this._source === WT_G3x5_TSCFlightPlan.Source.ACTIVE) {
                this._fpm.removeFromActive(sequence);
            } else {
                this._displayedFlightPlan.removeElement(sequence.segment, sequence);
            }
            return true;
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     * @param {WT_NumberUnit} altitude
     */
    async _setVNAVAltitude(leg, altitude) {
        try {
            if (this._source === WT_G3x5_TSCFlightPlan.Source.ACTIVE) {
                this._fpm.setCustomLegAltitudeInActive(leg, altitude);
            } else {
                leg.altitudeConstraint.setCustomAltitude(altitude);
            }
            return true;
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     */
    async _removeVNAVAltitude(leg) {
        try {
            if (this._source === WT_G3x5_TSCFlightPlan.Source.ACTIVE) {
                this._fpm.removeCustomLegAltitudeInActive(leg);
            } else {
                leg.altitudeConstraint.removeCustomAltitude();
            }
            return true;
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     * @param {WT_NumberUnitReadOnly} altitudeRestriction
     */
    async _activateVNAVDRCT(leg, altitudeRestriction) {
        if (this._source !== WT_G3x5_TSCFlightPlan.Source.ACTIVE) {
            return false;
        }

        try {
            this._fpm.activateVNAVDirectTo(leg);
            return true;
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     */
    async _activateLeg(leg) {
        try {
            await this._fpm.setActiveLeg(leg);
            return true;
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    _openWaypointKeyboard(callback) {
        this.instrument.waypointKeyboard.element.setContext({
            homePageGroup: this.homePageGroup,
            homePageName: this.homePageName,
            searchTypes: null,
            callback: callback
        });
        this.instrument.switchToPopUpPage(this.instrument.waypointKeyboard);
    }

    _openPage(pageGroup, pageName) {
        this.instrument.SwitchToPageName(pageGroup, pageName);
    }

    _openDRCTPage(waypoint, vnavAltitude) {
        this.instrument.commonPages.directTo.element.presetWaypoint(waypoint, vnavAltitude, WT_Unit.NMILE.createNumber(0));
        this.instrument.SwitchToPageName("MFD", "Direct To");
    }

    _openWaypointInfoPage(waypoint) {
        if (!waypoint || !(waypoint instanceof WT_ICAOWaypoint)) {
            return;
        }

        let infoPage;
        let pages = this.instrument.getSelectedMFDPanePages();
        switch (waypoint.type) {
            case WT_ICAOWaypoint.Type.AIRPORT:
                infoPage = pages.airportInfo;
                break;
            case WT_ICAOWaypoint.Type.VOR:
                infoPage = pages.vorInfo;
                break;
            case WT_ICAOWaypoint.Type.NDB:
                infoPage = pages.ndbInfo;
                break;
            case WT_ICAOWaypoint.Type.INT:
                infoPage = pages.intInfo;
                break;
        }
        if (infoPage) {
            infoPage.element.setWaypoint(waypoint);
            this.instrument.SwitchToPageName("MFD", infoPage.name);
        }
    }

    _openConfirmationTextPopUp(text, confirmCallback) {
        this.instrument.confirmationTextPopUp.element.setContext({
            homePageGroup: this.homePageGroup,
            homePageName: this.homePageName,
            text: text,
            callback: (confirmed => {
                if (confirmed) {
                    confirmCallback();
                }
            }).bind(this)
        });
        this.instrument.switchToPopUpPage(this.instrument.confirmationTextPopUp);
    }

    _openFlightPlanOptionsPopUp() {
        this._flightPlanOptionsPopUp.element.setContext({
            homePageGroup: this.homePageGroup,
            homePageName: this.homePageName,
            flightPlanPage: this,
            flightPlanManager: this._fpm,
            flightPlan: this._displayedFlightPlan,
            settings: this.settings,
            paneSettings: this.instrument.getSelectedPaneSettings()
        });
        this.instrument.switchToPopUpPage(this._flightPlanOptionsPopUp);
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     */
    _openAirwaySelectPopUp(leg) {
        let insertLeg;
        // if the selected leg is inside an airway, we need to set the insertion point to after the last leg of the airway
        if (leg.parent instanceof WT_FlightPlanAirwaySequence) {
            insertLeg = leg.parent.legs.last();
        } else {
            insertLeg = leg;
        }
        this._airwaySelectionPopUp.element.setContext({
            homePageGroup: this.homePageGroup,
            homePageName: this.homePageName,
            entryWaypoint: leg.fix,
            callback: this._insertAirwayFromLeg.bind(this, insertLeg, 1)
        });
        this.instrument.switchToPopUpPage(this._airwaySelectionPopUp);
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     * @returns {WT_NumberUnitReadOnly}
     */
    _getVNAVAltitudeKeyboardInitialValue(leg) {
        let initialValue = WT_Unit.FOOT.createNumber(0);
        if (leg.altitudeConstraint.customAltitude) {
            initialValue.set(leg.altitudeConstraint.customAltitude);
        } else if (leg.altitudeConstraint.advisoryAltitude) {
            initialValue.set(leg.altitudeConstraint.advisoryAltitude);
        } else if (leg.altitudeConstraint.publishedConstraint) {
            switch (leg.altitudeConstraint.publishedConstraint.type) {
                case WT_AltitudeConstraint.Type.AT:
                case WT_AltitudeConstraint.Type.AT_OR_BELOW:
                case WT_AltitudeConstraint.Type.BETWEEN:
                    initialValue.set(leg.altitudeConstraint.publishedConstraint.ceiling);
                    break;
                case WT_AltitudeConstraint.Type.AT_OR_ABOVE:
                    initialValue.set(leg.altitudeConstraint.publishedConstraint.floor);
                    break;
            }
        }
        return initialValue.readonly();
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     */
    _openVNAVAltitudeKeyboardPopUp(leg) {
        let initialValue = this._getVNAVAltitudeKeyboardInitialValue(leg);

        let vnavLegRestriction = this._source === WT_G3x5_TSCFlightPlan.Source.ACTIVE ? this._fpm.activePlanVNAV.legRestrictions.get(leg.index) : null;
        let isLegRestrictionValid = vnavLegRestriction ? (vnavLegRestriction.isDesignated && vnavLegRestriction.isValid) : false;

        this.instrument.vnavAltitudeKeyboard.element.setContext({
            homePageGroup: this.homePageGroup,
            homePageName: this.homePageName,
            showDirectTo: isLegRestrictionValid && this._fpm.isVNAVEnabled,
            leg,
            unit: this.unitsModel.altitudeUnit,
            initialValue: initialValue,
            valueEnteredCallback: this._setVNAVAltitude.bind(this, leg),
            removeCallback: this._removeVNAVAltitude.bind(this, leg),
            vnavDRCTCallback: this._activateVNAVDRCT.bind(this, leg),
        });
        this.instrument.switchToPopUpPage(this.instrument.vnavAltitudeKeyboard);
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     */
    _openActivateLegConfirmPopUp(leg) {
        let previousLeg = leg.previousLeg();
        this._activateLegConfirmPopUp.element.setContext({
            homePageGroup: this.homePageGroup,
            homePageName: this.homePageName,
            leg: leg,
            callback: (confirmed => {
                if (confirmed && leg.flightPlan === this._displayedFlightPlan && leg.previousLeg() === previousLeg) {
                    this._activateLeg(leg);
                }
            }).bind(this)
        });
        this.instrument.switchToPopUpPage(this._activateLegConfirmPopUp);
    }

    _setAirwaySequenceCollapse(airwaySequence, value) {
        this.htmlElement.setAirwaySequenceCollapse(airwaySequence, value);
    }

    _setAllAirwaySequenceCollapse(value) {
        this._fpm.activePlan.getEnroute().elements.forEach(element => {
            if (element instanceof WT_FlightPlanAirwaySequence) {
                this.htmlElement.setAirwaySequenceCollapse(element, value);
            }
        });
    }

    _onDRCTButtonPressed(event) {
        let selectedRow = this.htmlElement.getSelectedRow();
        let selectedRowModeHTMLElement = selectedRow ? selectedRow.getActiveModeHTMLElement() : null;
        let waypoint = null;
        let vnavAltitude = null;
        if (selectedRow && selectedRowModeHTMLElement.leg) {
            waypoint = selectedRowModeHTMLElement.leg.fix;
            if (this._displayedFlightPlanVNAV) {
                let legRestriction = this._displayedFlightPlanVNAV.legRestrictions.get(selectedRowModeHTMLElement.leg.index);
                vnavAltitude = (legRestriction && legRestriction.isDesignated && legRestriction.isValid) ? legRestriction.altitude : null;
            }
        }
        this._openDRCTPage(waypoint, vnavAltitude);
    }

    _onActivateStandbyButtonPressed(event) {
        this._openConfirmationTextPopUp("Activate Standby Flight Plan and Replace Current Active Route?", this._fpm.activateStandby.bind(this._fpm));
    }

    _onProcButtonPressed(event) {
        this.instrument.commonPages.procedures.element.setSource(this._source);
        this._openPage("MFD", "Procedures");
    }

    _onStandbyFlightPlanButtonPressed(event) {
        this.setSource(WT_G3x5_TSCFlightPlan.Source.STANDBY);
    }

    _onActiveFlightPlanButtonPressed(event) {
        this.setSource(WT_G3x5_TSCFlightPlan.Source.ACTIVE);
    }

    _onVNAVButtonPressed(event) {
        this._openPage("MFD", "VNAV Profile");
    }

    _onFlightPlanOptionsButtonPressed(event) {
        this._openFlightPlanOptionsPopUp();
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onOriginHeaderButtonPressed(event) {
        if (!this._displayedFlightPlan.hasOrigin()) {
            this._openWaypointKeyboard(this._selectOrigin.bind(this));
        } else {
            this.htmlElement.toggleRowSelection(event.row);
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onDestinationHeaderButtonPressed(event) {
        if (!this._displayedFlightPlan.hasDestination()) {
            this._openWaypointKeyboard(this._selectDestination.bind(this));
        } else {
            this.htmlElement.toggleRowSelection(event.row);
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onEnrouteHeaderButtonPressed(event) {
        this.htmlElement.toggleRowSelection(event.row);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onAirwaySequenceHeaderButtonPressed(event) {
        this.htmlElement.toggleRowSelection(event.row);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onHeaderButtonPressed(event) {
        if (event.sequence instanceof WT_FlightPlanSegment) {
            switch (event.sequence.segment) {
                case WT_FlightPlan.Segment.ORIGIN:
                case WT_FlightPlan.Segment.DEPARTURE:
                    this._onOriginHeaderButtonPressed(event);
                    break;
                case WT_FlightPlan.Segment.DESTINATION:
                case WT_FlightPlan.Segment.ARRIVAL:
                case WT_FlightPlan.Segment.APPROACH:
                    this._onDestinationHeaderButtonPressed(event);
                    break;
                case WT_FlightPlan.Segment.ENROUTE:
                    this._onEnrouteHeaderButtonPressed(event);
                    break;
            }
        } else if (event.sequence instanceof WT_FlightPlanAirwaySequence) {
            this._onAirwaySequenceHeaderButtonPressed(event);
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onLegWaypointButtonPressed(event) {
        this.htmlElement.toggleRowSelection(event.row);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onLegAltitudeButtonPressed(event) {
        if (event.leg.segment !== WT_FlightPlan.Segment.ORIGIN &&
            event.leg.segment !== WT_FlightPlan.Segment.DESTINATION) {

            this._openVNAVAltitudeKeyboardPopUp(event.leg);
        }
    }

    _onEnrouteAddButtonPressed(event) {
        this._openWaypointKeyboard(this._appendToEnroute.bind(this));
    }

    _onOriginSelectButtonPressed(event) {
        this._openWaypointKeyboard(this._selectOrigin.bind(this));
    }

    _onDepartureSelectButtonPressed(event) {
        this.instrument.commonPages.departureSelection.element.setSource(this._source);
        this._openPage("MFD", "Departure Selection");
    }

    _onOriginRemoveButtonPressed(event) {
        this._removeOrigin();
    }

    _onOriginInfoButtonPressed(event) {
        let origin = this._displayedFlightPlan.getOrigin().waypoint;
        this._openWaypointInfoPage(origin);
    }

    _onDestinationSelectButtonPressed(event) {
        this._openWaypointKeyboard(this._selectDestination.bind(this));
    }

    _onArrivalSelectButtonPressed(event) {
        this.instrument.commonPages.arrivalSelection.element.setSource(this._source);
        this._openPage("MFD", "Arrival Selection");
    }

    _onApproachSelectButtonPressed(event) {
        this.instrument.commonPages.approachSelection.element.setSource(this._source);
        this._openPage("MFD", "Approach Selection");
    }

    _onDestinationRemoveButtonPressed(event) {
        this._removeDestination();
    }

    _onDestinationInfoButtonPressed(event) {
        let destination = this._displayedFlightPlan.getDestination().waypoint;
        this._openWaypointInfoPage(destination);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onInsertBeforeButtonPressed(event) {
        this._openWaypointKeyboard(this._insertWaypointFromLeg.bind(this, event.leg, 0));
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onInsertAfterButtonPressed(event) {
        this._openWaypointKeyboard(this._insertWaypointFromLeg.bind(this, event.leg, 1));
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onWaypointDRCTButtonPressed(event) {
        let vnavAltitude = null;
        if (this._displayedFlightPlanVNAV) {
            let legRestriction = this._displayedFlightPlanVNAV.legRestrictions.get(event.leg.index);
            vnavAltitude = (legRestriction && legRestriction.isDesignated && legRestriction.isValid) ? legRestriction.altitude : null;
        }
        this._openDRCTPage(event.leg.fix, vnavAltitude);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onActivateLegButtonPressed(event) {
        this._openActivateLegConfirmPopUp(event.leg);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onLoadAirwayButtonPressed(event) {
        this._openAirwaySelectPopUp(event.leg);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onWaypointRemoveButtonPressed(event) {
        this._removeLeg(event.leg);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onWaypointInfoButtonPressed(event) {
        this._openWaypointInfoPage(event.leg.fix);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onAirwayCollapseButtonPressed(event) {
        this._setAirwaySequenceCollapse(event.sequence, true);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
     _onAirwayExpandButtonPressed(event) {
        this._setAirwaySequenceCollapse(event.sequence, false);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onAirwayCollapseAllButtonPressed(event) {
        this._setAllAirwaySequenceCollapse(true);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
     _onAirwayExpandAllButtonPressed(event) {
        this._setAllAirwaySequenceCollapse(false);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onAirwayRemoveButtonPressed(event) {
        this._removeAirwaySequence(event.sequence);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onButtonPressed(event) {
        let handler = this._buttonEventHandlers[event.type];
        if (handler) {
            handler(event);
        }
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

    _autoSetActiveSource() {
        let lastPage = this.instrument.lastFocus.page;
        if (lastPage && lastPage.name === "MFD Home") {
            this.setSource(WT_G3x5_TSCFlightPlan.Source.ACTIVE);
        }
    }

    onEnter() {
        this._autoSetActiveSource();
        this.htmlElement.open();
        this.updateFlightPlanPreview();
    }

    _updateState() {
        this._state._airplaneHeadingTrue = this.instrument.airplane.navigation.headingTrue();
        this._state._isDirectToActive = this.instrument.flightPlanManagerWT.directTo.isActive();
        this._state._activeLeg = this._state.isDirectToActive ? this.instrument.flightPlanManagerWT.getDirectToLeg(true) : this.instrument.flightPlanManagerWT.getActiveLeg(true);
    }

    _updateSelectedRow() {
        let selectedRow = this.htmlElement.getSelectedRow();
        if (selectedRow !== this._selectedRow) {
            this._selectedRow = selectedRow;
            this.updateFlightPlanPreview();
            this._updateTitle();
        }
    }

    onUpdate(deltaTime) {
        this._updateState();
        this.htmlElement.update(this._state);
        this._updateSelectedRow();
    }

    _deactivateFlightPlanPreview() {
        let displaySetting = this.instrument.getSelectedPaneSettings().display;
        if (displaySetting.mode === WT_G3x5_PaneDisplaySetting.Mode.FLIGHT_PLAN) {
            displaySetting.setValue(WT_G3x5_PaneDisplaySetting.Mode.NAVMAP);
        }
    }

    onExit() {
        this.htmlElement.close();
        this._deactivateFlightPlanPreview();
    }

    _onUpPressed() {
        this.htmlElement.scrollUp();
    }

    _onDownPressed() {
        this.htmlElement.scrollDown();
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_TSCFlightPlan.Source = {
    ACTIVE: 0,
    STANDBY: 1
};

/**
 * @typedef WT_G3x5_TSCFlightPlanState
 * @property {readonly WT_G3x5_TSCFlightPlanSettings} settings
 * @property {readonly Number} airplaneHeadingTrue
 * @property {readonly Boolean} isDirectToActive
 * @property {readonly WT_FlightPlanLeg} activeLeg
 */

class WT_G3x5_TSCFlightPlanUnitsModel extends WT_G3x5_UnitsSettingModelAdapter {
    /**
     * @param {WT_G3x5_UnitsSettingModel} unitsSettingModel
     */
    constructor(unitsSettingModel) {
        super(unitsSettingModel);

        this._initListeners();
        this._initModel();
    }

    /**
     * @readonly
     * @type {WT_NavAngleUnit}
     */
    get bearingUnit() {
        return this._bearingUnit;
    }

    /**
     * @readonly
     * @type {WT_Unit}
     */
    get distanceUnit() {
        return this._distanceUnit;
    }

    /**
     * @readonly
     * @type {WT_Unit}
     */
    get altitudeUnit() {
        return this._altitudeUnit;
    }

    /**
     * @readonly
     * @type {WT_Unit}
     */
    get fuelUnit() {
        return this._fuelUnit;
    }

    _updateBearing() {
        this._bearingUnit = this.unitsSettingModel.navAngleSetting.getNavAngleUnit();
    }

    _updateDistance() {
        this._distanceUnit = this.unitsSettingModel.distanceSpeedSetting.getDistanceUnit();
    }

    _updateAltitude() {
        this._altitudeUnit = this.unitsSettingModel.altitudeSetting.getAltitudeUnit();
    }

    _updateFuel() {
        this._fuelUnit = this.unitsSettingModel.fuelSetting.getUnit();
    }
}

class WT_G3x5_TSCFlightPlanDataFieldSetting extends WT_DataStoreSetting {
    /**
     * @param {WT_DataStoreSettingModel} model
     * @param {Number} index
     * @param {WT_G3x5_TSCFlightPlanDataFieldSetting.Mode} defaultValue
     */
    constructor(model, index, defaultValue) {
        super(model, `${WT_G3x5_TSCFlightPlanDataFieldSetting.KEY}_${index}`, defaultValue, true, true);

        this._mode = this.getValue();
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCFlightPlanDataFieldSetting.Mode}
     */
    get mode() {
        return this._mode;
    }

    update() {
        this._mode = this.getValue();
    }
}
WT_G3x5_TSCFlightPlanDataFieldSetting.KEY = "WT_FlightPlan_DataField";
/**
 * @enum {Number}
 */
WT_G3x5_TSCFlightPlanDataFieldSetting.Mode = {
    CUM: 0,
    DIS: 1,
    DTK: 2,
    ETA: 3,
    ETE: 4,
    FUEL: 5
};

class WT_G3x5_TSCFlightPlanSettings {
    constructor(instrumentID) {
        this._instrumentID = instrumentID;

        this._initSettings();
    }

    _initDataFieldSettings() {
        this._dataFieldSettings = new WT_ReadOnlyArray([...Array(2)].map((value, index) => new WT_G3x5_TSCFlightPlanDataFieldSetting(this._settingModel, index, WT_G3x5_TSCFlightPlanSettings.DATA_FIELD_DEFAULT_VALUES[index]), this));
    }

    _initNewAirwayCollapseSetting() {
        this._newAirwayCollapseSetting = new WT_DataStoreSetting(this._settingModel, WT_G3x5_TSCFlightPlanSettings.NEW_AIRWAY_COLLAPSE_KEY, true, false, true)
    }

    _initSettings() {
        this._settingModel = new WT_DataStoreSettingModel(this._instrumentID);

        this._initDataFieldSettings();
        this._initNewAirwayCollapseSetting();
    }

    /**
     * @readonly
     * @type {WT_ReadOnlyArray<WT_G3x5_TSCFlightPlanDataFieldSetting>}
     */
    get dataFieldSettings() {
        return this._dataFieldSettings;
    }

    /**
     * @readonly
     * @type {WT_DataStoreSetting}
     */
    get newAirwayCollapseSetting() {
        return this._newAirwayCollapseSetting;
    }

    init() {
        this.dataFieldSettings.forEach(setting => setting.init());
        this.newAirwayCollapseSetting.init();
    }
}
WT_G3x5_TSCFlightPlanSettings.DATA_FIELD_DEFAULT_VALUES = [
    WT_G3x5_TSCFlightPlanDataFieldSetting.Mode.DTK,
    WT_G3x5_TSCFlightPlanDataFieldSetting.Mode.DIS
];
WT_G3x5_TSCFlightPlanSettings.NEW_AIRWAY_COLLAPSE_KEY = "WT_FlightPlan_NewAirway_Collapse";

class WT_G3x5_TSCFlightPlanHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._flightPlanListener = this._onFlightPlanChanged.bind(this);
        this._flightPlanVNAVListener = this._onFlightPlanVNAVChanged.bind(this);
        this._rowButtonListener = this._onRowButtonPressed.bind(this);

        /**
         * @type {Map<WT_FlightPlanAirwaySequence,Boolean>}
         */
        this._airwayCollapseMap = new Map();

        /**
         * @type {WT_G3x5_TSCFlightPlan}
         */
        this._parentPage = null;
        /**
         * @type {WT_FlightPlan}
         */
        this._flightPlan = null;
        /**
         * @type {WT_FlightPlanVNAV}
         */
        this._flightPlanVNAV = null;
        this._source = WT_G3x5_TSCFlightPlan.Source.ACTIVE;
        /**
         * @type {WT_G3x5_TSCFlightPlanRowHTMLElement[]}
         */
        this._visibleRows = [];
        this._selectedRow = null;
        this._activeArrowShow = null;
        this._activeArrowFrom = 0;
        this._activeArrowTo = 0;
        this._needRedrawFlightPlan = false;
        this._isInit = false;

        this._bearingUnit = null;
        this._distanceUnit = null;
        this._fuelUnit = null;
        this._altitudeUnit = null;
        this._dataFieldIsDynamic = [false, false];
        this._dataFieldLastRefreshTimes = [0, 0];

        /**
         * @type {((event:WT_G3x5_TSCFlightPlanButtonEvent) => void)[]}
         */
        this._buttonListeners = [];
    }

    _getTemplate() {
        return WT_G3x5_TSCFlightPlanHTMLElement.TEMPLATE;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCFlightPlan}
     */
    get parentPage() {
        return this._parentPage;
    }

    async _defineOriginBannerButtons() {
        [
            this._originSelectButton,
            this._departureSelectButton,
            this._originRemoveButton,
            this._originInfoButton
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#originselect`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#departureselect`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#originremove`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#origininfo`, WT_TSCLabeledButton),
        ]);
    }

    async _defineDestinationBannerButtons() {
        [
            this._destinationSelectButton,
            this._arrivalSelectButton,
            this._approachSelectButton,
            this._destinationRemoveButton,
            this._destinationInfoButton
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#destinationselect`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#arrivalselect`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#approachselect`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#destinationremove`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#destinationinfo`, WT_TSCLabeledButton),
        ]);
    }

    async _defineWaypointBannerButtons() {
        [
            this._insertBeforeButton,
            this._insertAfterButton,
            this._waypointDRCTButton,
            this._activateLegButton,
            this._loadAirwayButton,
            this._waypointRemoveButton,
            this._waypointInfoButton
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#insertbefore`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#insertafter`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#waypointdrct`, WT_TSCImageButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#activateleg`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#loadairway`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#waypointremove`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#waypointinfo`, WT_TSCLabeledButton),
        ]);
    }

    async _defineAirwayBannerButtons() {
        [
            this._airwayCollapseButton,
            this._airwayExpandButton,
            this._airwayCollapseAllButton,
            this._airwayExpandAllButton,
            this._airwayLoadNewButton,
            this._airwayRemoveButton,
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#airwaycollapse`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#airwayexpand`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#collapseall`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#expandall`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#loadnewairways`, WT_TSCValueButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#airwayremove`, WT_TSCLabeledButton)
        ]);
    }

    async _defineChildren() {
        this._wrapper = new WT_CachedElement(this.shadowRoot.querySelector(`#wrapper`));

        this._nameTitle = this.shadowRoot.querySelector(`#nametitle`);
        this._dataFieldTitle = this.shadowRoot.querySelector(`#datafieldtitle`);

        [
            this._drctButton,
            this._activateStandbyButton,
            this._procButton,
            this._standbyFlightPlanButton,
            this._activeFlightPlanButton,
            this._vnavButton,
            this._flightPlanOptionsButton,
            this._rows,
            this._banner
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#drct`, WT_TSCImageButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#activatestdby`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#proc`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#stdbyfpln`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#activefpln`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#vnav`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#fplnoptions`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#rows`, WT_TSCScrollList),
            WT_CustomElementSelector.select(this.shadowRoot, `#banner`, WT_TSCSlidingBanner),
            this._defineOriginBannerButtons(),
            this._defineDestinationBannerButtons(),
            this._defineWaypointBannerButtons(),
            this._defineAirwayBannerButtons()
        ]);

        this._rowsContainer = this.shadowRoot.querySelector(`#rowscontainer`);
        this._activeArrowStemRect = this.shadowRoot.querySelector(`#activearrowstem rect`);
        this._activeArrowHead = this.shadowRoot.querySelector(`#activearrowhead`);
    }

    _initLeftButtonListeners() {
        this._drctButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._drctButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DRCT
        }));
        this._activateStandbyButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._activateStandbyButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ACTIVATE_STANDBY
        }));
        this._procButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._procButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.PROC
        }));
        this._standbyFlightPlanButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._standbyFlightPlanButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.STANDBY_FLIGHT_PLAN
        }));
        this._activeFlightPlanButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._activeFlightPlanButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ACTIVE_FLIGHT_PLAN
        }));
        this._vnavButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._vnavButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.VNAV
        }));
        this._flightPlanOptionsButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._flightPlanOptionsButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.FLIGHT_PLAN_OPTIONS
        }));
    }

    _initOriginBannerButtonListeners() {
        this._originSelectButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._originSelectButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ORIGIN_SELECT
        }));
        this._departureSelectButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._departureSelectButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DEPARTURE_SELECT
        }));
        this._originRemoveButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._originRemoveButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ORIGIN_REMOVE
        }));
        this._originInfoButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._originInfoButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ORIGIN_INFO
        }));
    }

    _initDestinationBannerButtonListeners() {
        this._destinationSelectButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._destinationSelectButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DESTINATION_SELECT
        }));
        this._arrivalSelectButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._arrivalSelectButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ARRIVAL_SELECT
        }));
        this._approachSelectButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._approachSelectButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.APPROACH_SELECT
        }));
        this._destinationRemoveButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._destinationRemoveButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DESTINATION_REMOVE
        }));
        this._destinationInfoButton.addButtonListener(this._notifyButtonListeners.bind(this, {
            button: this._destinationInfoButton,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.DESTINATION_INFO
        }));
    }

    _initWaypointBannerButtonListeners() {
        this._insertBeforeButton.addButtonListener(this._onWaypointBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.INSERT_BEFORE));
        this._insertAfterButton.addButtonListener(this._onWaypointBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.INSERT_AFTER));
        this._waypointDRCTButton.addButtonListener(this._onWaypointBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.WAYPOINT_DRCT));
        this._activateLegButton.addButtonListener(this._onWaypointBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ACTIVATE_LEG));
        this._loadAirwayButton.addButtonListener(this._onWaypointBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.LOAD_AIRWAY));
        this._waypointRemoveButton.addButtonListener(this._onWaypointBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.WAYPOINT_REMOVE));
        this._waypointInfoButton.addButtonListener(this._onWaypointBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.WAYPOINT_INFO));
    }

    _initAirwayBannerButtonListeners() {
        this._airwayCollapseButton.addButtonListener(this._onAirwayBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.AIRWAY_COLLAPSE));
        this._airwayExpandButton.addButtonListener(this._onAirwayBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.AIRWAY_EXPAND));
        this._airwayCollapseAllButton.addButtonListener(this._onAirwayBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.AIRWAY_COLLAPSE_ALL));
        this._airwayExpandAllButton.addButtonListener(this._onAirwayBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.AIRWAY_EXPAND_ALL));
        this._airwayRemoveButton.addButtonListener(this._onAirwayBannerButtonPressed.bind(this, WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.AIRWAY_REMOVE));
    }

    _initButtonListeners() {
        this._initLeftButtonListeners();
        this._initOriginBannerButtonListeners();
        this._initDestinationBannerButtonListeners();
        this._initWaypointBannerButtonListeners();
        this._initAirwayBannerButtonListeners();
    }

    _initRowRecycler() {
        this._rowRecycler = new WT_CustomHTMLElementRecycler(this._rowsContainer, WT_G3x5_TSCFlightPlanRowHTMLElement, (element => element.setParentPage(this.parentPage)).bind(this));
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._initButtonListeners();
        this._initRowRecycler();
        this._isInit = true;
        if (this._parentPage) {
            this._updateFromParentPage();
        }
        if (this._flightPlan) {
            this._updateFromFlightPlan();
        }
        this._updateFromSource();
        this._updateFromActiveArrowShow();
        this._updateFromActiveArrowPosition();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _initAirwayLoadNewButtonManager() {
        let elementHandler = new WT_TSCStandardSelectionElementHandler(["Expanded", "Collapsed"]);
        let context = {
            title: "Load New Airways Setting",
            subclass: "standardDynamicSelectionListWindow",
            closeOnSelect: true,
            elementConstructor: elementHandler,
            elementUpdater: elementHandler,
            homePageGroup: this.parentPage.homePageGroup,
            homePageName: this.parentPage.homePageName
        };
        this._airwayLoadNewButtonManager = new WT_TSCSettingValueButtonManager(this.parentPage.instrument, this._airwayLoadNewButton, this.parentPage.settings.newAirwayCollapseSetting, this.parentPage.instrument.selectionListWindow1, context, value => value ? "Collapsed" : "Expanded", [false, true]);
        this._airwayLoadNewButtonManager.init();
    }

    _initSettingListeners() {
        this._parentPage.settings.dataFieldSettings.forEach((setting, index) => {
            setting.addListener(this._onDataFieldSettingChanged.bind(this, index));
            this._updateDataField(index, setting.mode);
        }, this);

        this._updateDataFieldTitle();
    }

    _updateFromParentPage() {
        this._initAirwayLoadNewButtonManager();
        this._initSettingListeners();
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlan} parentPage
     */
    setParentPage(parentPage) {
        if (!parentPage || this.parentPage) {
            return;
        }

        this._parentPage = parentPage;
        if (this._isInit) {
            this._updateFromParentPage();
        }
    }

    _cleanUpFlightPlanRenderer() {
        this._flightPlanRenderer = null;
    }

    _cleanUpFlightPlanListener() {
        this._flightPlan.removeListener(this._flightPlanListener);
    }

    _cleanUpFlightPlanVNAVListener() {
        if (!this._flightPlanVNAV) {
            return;
        }

        this._flightPlanVNAV.removeListener(this._flightPlanVNAVListener);
    }

    _cleanUpHeader() {
        this._nameTitle.textContent = "______/______";
    }

    _cleanUpRows() {
        this.unselectRow();
        this._rowRecycler.recycleAll();
        this._visibleRows.forEach(row => row.removeButtonListener(this._rowButtonListener));
        this._visibleRows = [];
    }

    _cleanUpFlightPlan() {
        if (!this._flightPlan) {
            return;
        }

        this._cleanUpFlightPlanRenderer();
        this._cleanUpFlightPlanListener();
        this._cleanUpFlightPlanVNAVListener();
        this._cleanUpHeader();
        this._cleanUpRows();
    }

    _initFlightPlanRenderer() {
        this._flightPlanRenderer = new WT_G3x5_TSCFlightPlanRenderer(this, this._flightPlan, this._flightPlanVNAV);
    }

    _initFlightPlanListener() {
        this._flightPlan.addListener(this._flightPlanListener);
    }

    _initFlightPlanVNAVListener() {
        if (!this._flightPlanVNAV) {
            return;
        }

        this._flightPlanVNAV.addListener(this._flightPlanVNAVListener);
    }

    _updateFromFlightPlan() {
        if (!this._flightPlan) {
            return;
        }

        this._initFlightPlanRenderer();
        this._initFlightPlanListener();
        this._initFlightPlanVNAVListener();
        this._drawFlightPlan();
    }

    /**
     *
     * @param {WT_FlightPlan} flightPlan
     * @param {WT_FlightPlanVNAV} flightPlanVNAV
     */
    setFlightPlan(flightPlan, flightPlanVNAV) {
        if (flightPlan === this._flightPlan) {
            return;
        }

        this._cleanUpFlightPlan();
        this._flightPlan = flightPlan;
        this._flightPlanVNAV = flightPlanVNAV;
        if (this._isInit) {
            this._updateFromFlightPlan();
        }
    }

    _updateFromSource() {
        this._wrapper.setAttribute("source", WT_G3x5_TSCFlightPlanHTMLElement.SOURCE_ATTRIBUTES[this._source]);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlan.Source} source
     */
    setSource(source) {
        if (this._source === source) {
            return;
        }

        this._source = source;
        if (this._isInit) {
            this._updateFromSource();
        }
    }

    _initRow(row) {
        row.addButtonListener(this._rowButtonListener);
        this._visibleRows.push(row);
    }

    clearRows() {
        if (this._isInit) {
            this._cleanUpRows();
        }
    }

    requestRow() {
        if (this._isInit) {
            let row = this._rowRecycler.request();
            this._initRow(row);
            return row;
        } else {
            return null;
        }
    }

    /**
     *
     * @returns {WT_G3x5_TSCFlightPlanRowHTMLElement}
     */
    getSelectedRow() {
        return this._selectedRow;
    }

    _cleanUpSelectedRow() {
        let row = this.getSelectedRow();
        if (row) {
            row.onUnselected();
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanRowHTMLElement} row
     * @returns {WT_G3x5_TSCFlightPlanHTMLElement.BannerMode}
     */
    _getBannerModeFromRow(row) {
        switch (row.getMode()) {
            case WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.HEADER:
                let sequence = row.getActiveModeHTMLElement().sequence;
                if ((sequence === this._flightPlan.getOrigin() && this._flightPlan.hasOrigin()) || sequence === this._flightPlan.getDeparture()) {
                    return WT_G3x5_TSCFlightPlanHTMLElement.BannerMode.ORIGIN;
                } else if ((sequence === this._flightPlan.getDestination() && this._flightPlan.hasDestination()) || sequence === this._flightPlan.getArrival() || sequence === this._flightPlan.getApproach()) {
                    return WT_G3x5_TSCFlightPlanHTMLElement.BannerMode.DESTINATION;
                } else if (sequence instanceof WT_FlightPlanAirwaySequence) {
                    return WT_G3x5_TSCFlightPlanHTMLElement.BannerMode.AIRWAY;
                }
                break;
            case WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG:
            case WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.AIRWAY_FOOTER:
                return WT_G3x5_TSCFlightPlanHTMLElement.BannerMode.WAYPOINT;
        }
        return undefined;
    }

    _updateWaypointBanner() {
        let row = this.getSelectedRow();
        let leg = row.getActiveModeHTMLElement().leg;
        let isEditable = leg.parent === leg.flightPlan.getEnroute();
        let isRemovable = isEditable || leg.segment === WT_FlightPlan.Segment.ORIGIN || leg.segment === WT_FlightPlan.Segment.DESTINATION;

        this._insertBeforeButton.enabled = isEditable;
        this._insertAfterButton.enabled = isEditable;
        this._loadAirwayButton.enabled = leg.segment === WT_FlightPlan.Segment.ENROUTE && leg.fix.airways && leg.fix.airways.length > 0;
        this._waypointRemoveButton.enabled = isRemovable;
    }

    _updateAirwayBanner() {
        let row = this.getSelectedRow();
        let sequence = row.getActiveModeHTMLElement().sequence;
        let isCollapsed = this.getAirwaySequenceCollapse(sequence);

        this._airwayCollapseButton.enabled = !isCollapsed;
        this._airwayExpandButton.enabled = isCollapsed;
    }

    _updateBanner(mode) {
        if (mode === WT_G3x5_TSCFlightPlanHTMLElement.BannerMode.WAYPOINT) {
            this._updateWaypointBanner();
        } else if (mode === WT_G3x5_TSCFlightPlanHTMLElement.BannerMode.AIRWAY) {
            this._updateAirwayBanner();
        }
    }

    _initSelectedRow() {
        let row = this.getSelectedRow();
        let bannerMode;
        if (row) {
            row.onSelected();
            this._rows.scrollManager.scrollToElement(row);
            bannerMode = this._getBannerModeFromRow(row);
        }

        if (bannerMode !== undefined) {
            this.setBannerMode(bannerMode);
            this._updateBanner(bannerMode);
            this.showBanner();
        } else {
            this.hideBanner();
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanRowHTMLElement} row
     */
    selectRow(row) {
        if (this.getSelectedRow() === row) {
            return;
        }

        this._cleanUpSelectedRow();
        this._selectedRow = row;
        this._initSelectedRow();
    }

    unselectRow() {
        this.selectRow(null);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanRowHTMLElement} row
     */
    toggleRowSelection(row) {
        if (row === this.getSelectedRow()) {
            this.unselectRow();
        } else {
            this.selectRow(row);
        }
    }

    _updateFromActiveArrowShow() {
        this._wrapper.setAttribute("activearrow-show", `${this._activeArrowShow}`);
    }

    setActiveArrowVisible(value) {
        this._activeArrowShow = value;
        if (this._isInit) {
            this._updateFromActiveArrowShow();
        }
    }

    _updateFromActiveArrowPosition() {
        let top = Math.min(this._activeArrowFrom, this._activeArrowTo);
        let height = Math.max(0.01, Math.abs(this._activeArrowTo - this._activeArrowFrom)); // enforce minimum height b/c otherwise rendering will not be updated if height = 0

        this._activeArrowStemRect.setAttribute("y", `${top}`);
        this._activeArrowStemRect.setAttribute("height", `${height}`);
        this._activeArrowHead.style.transform = `translateY(${this._activeArrowTo}px) rotateX(0deg)`;
    }

    moveActiveArrow(from, to) {
        this._activeArrowFrom = from;
        this._activeArrowTo = to;
        if (this._isInit) {
            this._updateFromActiveArrowPosition();
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement.BannerMode} mode
     */
    setBannerMode(mode) {
        this._wrapper.setAttribute("banner-mode", WT_G3x5_TSCFlightPlanHTMLElement.BANNER_MODE_ATTRIBUTES[mode]);
    }

    showBanner() {
        this._banner.slideIn(WT_TSCSlidingBanner.Direction.RIGHT);
    }

    hideBanner() {
        this._banner.slideOut(WT_TSCSlidingBanner.Direction.RIGHT);
    }

    toggleBanner() {
        if (this._banner.isVisible) {
            this.showBanner();
        } else {
            this.hideBanner();
        }
    }

    /**
     *
     * @param {WT_FlightPlanAirwaySequence} airwaySequence
     * @returns {Boolean}
     */
    getAirwaySequenceCollapse(airwaySequence) {
        let value = this._airwayCollapseMap.get(airwaySequence);
        if (value === undefined) {
            value = this._parentPage.settings.newAirwayCollapseSetting.getValue();
            this._airwayCollapseMap.set(airwaySequence, value);
        }
        return value;
    }

    /**
     *
     * @param {WT_FlightPlanAirwaySequence} airwaySequence
     * @param {Boolean} value
     */
    setAirwaySequenceCollapse(airwaySequence, value) {
        let oldValue = this.getAirwaySequenceCollapse(airwaySequence);
        this._airwayCollapseMap.set(airwaySequence, value);
        if (oldValue !== value) {
            this._needRedrawFlightPlan = true;
        }
    }

    /**
     *
     * @param {(event:WT_G3x5_TSCFlightPlanButtonEvent) => void} listener
     */
    addButtonListener(listener) {
        this._buttonListeners.push(listener);
    }

    /**
     *
     * @param {(event:WT_G3x5_TSCFlightPlanButtonEvent) => void} listener
     */
    removeButtonListener(listener) {
        let index = this._buttonListeners.indexOf(listener);
        if (index >= 0) {
            this._buttonListeners.splice(index, 1);
        }
    }

    _drawName() {
        let originWaypoint = this._flightPlan.getOrigin().waypoint;
        let destinationWaypoint = this._flightPlan.getDestination().waypoint;
        this._nameTitle.textContent = `${originWaypoint ? originWaypoint.ident : "______"}/${destinationWaypoint ? destinationWaypoint.ident : "______"}`;
    }

    _drawRows(isDirectToActive, activeLeg) {
        this._flightPlanRenderer.draw(isDirectToActive, activeLeg);
    }

    _drawFlightPlan(isDirectToActive, activeLeg) {
        this._drawName();
        this._drawRows(isDirectToActive, activeLeg);
    }

    _redrawFlightPlan(isDirectToActive, activeLeg) {
        this._cleanUpRows();
        this._drawFlightPlan(isDirectToActive, activeLeg);
    }

    _updateAirwayCollapseMap() {
        let toDelete = [];
        this._airwayCollapseMap.forEach((value, key) => {
            if (key.flightPlan !== this._flightPlan) {
                toDelete.push(key);
            }
        }, this);
        toDelete.forEach(key => this._airwayCollapseMap.delete(key));
    }

    _onFlightPlanChanged(event) {
        if (event.types !== WT_FlightPlanEvent.Type.LEG_ALTITUDE_CHANGED) {
            this._updateAirwayCollapseMap();
            this._redrawFlightPlan();
        }
    }

    _onFlightPlanVNAVChanged(source) {
        this._flightPlanRenderer.refreshAllAltitudeConstraints();
    }

    _updateDataFieldTitle() {
        let dataFieldSettings = this.parentPage.settings.dataFieldSettings;
        this._dataFieldTitle.textContent = `${WT_G3x5_TSCFlightPlanHTMLElement.DATA_FIELD_MODE_TEXTS[dataFieldSettings.get(0).mode]}/${WT_G3x5_TSCFlightPlanHTMLElement.DATA_FIELD_MODE_TEXTS[dataFieldSettings.get(1).mode]}`;
    }

    _isDataFieldModeDynamic(mode) {
        switch (mode) {
            case WT_G3x5_TSCFlightPlanDataFieldSetting.Mode.ETA:
            case WT_G3x5_TSCFlightPlanDataFieldSetting.Mode.ETE:
            case WT_G3x5_TSCFlightPlanDataFieldSetting.Mode.FUEL:
                return true;
            default:
                return false;
        }
    }

    _refreshDataField(index) {
        this._flightPlanRenderer.refreshDataField(index);
        this._dataFieldLastRefreshTimes[index] = this._parentPage.instrument.currentTimeStamp;
    }

    _refreshAllDataFields() {
        this._flightPlanRenderer.refreshAllDataFields();
        this._dataFieldLastRefreshTimes.forEach((value, index, array) => array[index] = this._parentPage.instrument.currentTimeStamp);
    }

    _updateDataField(index, mode) {
        this._dataFieldIsDynamic[index] = this._isDataFieldModeDynamic(mode);
        if (this._flightPlanRenderer) {
            this._refreshDataField(index);
        }
    }

    _onDataFieldSettingChanged(index, setting, newValue, oldValue) {
        this._updateDataFieldTitle();
        this._updateDataField(index, newValue);
    }

    _notifyButtonListeners(event) {
        this._buttonListeners.forEach(listener => listener(event));
    }

    _onRowButtonPressed(event) {
        this._notifyButtonListeners(event);
    }

    _onWaypointBannerButtonPressed(eventType, button) {
        let row = this.getSelectedRow();
        let modeHTMLElement = row.getActiveModeHTMLElement();
        let leg = modeHTMLElement.leg ? modeHTMLElement.leg : null;

        if (leg) {
            this._notifyButtonListeners({
                button: button,
                type: eventType,
                row: row,
                leg: leg
            });
        }
    }

    _onAirwayBannerButtonPressed(eventType, button) {
        let row = this.getSelectedRow();
        let sequence = row.getMode() === WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.HEADER ? row.getActiveModeHTMLElement().sequence : null;

        if (sequence) {
            this._notifyButtonListeners({
                button: button,
                type: eventType,
                row: row,
                sequence: sequence
            });
        }
    }

    open() {
    }

    close() {
        this.unselectRow();
        if (this._isInit) {
            this._banner.popOut();
            this._rows.scrollManager.cancelScroll();
        }
    }

    _scrollSelectedRow(direction) {
        let index = this._visibleRows.indexOf(this.getSelectedRow());
        if (index < 0) {
            return;
        }

        index += direction;
        let row = this._visibleRows[index];
        while (row) {
            let mode = row.getMode();
            if (mode === WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG || mode === WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.AIRWAY_FOOTER) {
                this.selectRow(row);
                return;
            }
            index += direction;
            row = this._visibleRows[index];
        }
    }

    scrollUp() {
        if (!this._isInit) {
            return;
        }

        if (this.getSelectedRow()) {
            this._scrollSelectedRow(-1);
        } else {
            this._rows.scrollManager.scrollUp();
        }
    }

    scrollDown() {
        if (!this._isInit) {
            return;
        }

        if (this.getSelectedRow()) {
            this._scrollSelectedRow(1);
        } else {
            this._rows.scrollManager.scrollDown();
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanState} state
     */
    _updateFlightPlan(state) {
        if (this._needRedrawFlightPlan) {
            this._redrawFlightPlan(state.isDirectToActive, state.activeLeg);
            this._needRedrawFlightPlan = false;
        }
        this._flightPlanRenderer.update(state);
    }

    _updateDataFieldUnits() {
        let updated = false;
        if (!this._parentPage.unitsModel.bearingUnit.equals(this._bearingUnit)) {
            this._bearingUnit = this._parentPage.unitsModel.bearingUnit;
            updated = true;
        }
        if (!this._parentPage.unitsModel.distanceUnit.equals(this._distanceUnit)) {
            this._distanceUnit = this._parentPage.unitsModel.distanceUnit;
            updated = true;
        }
        if (!this._parentPage.unitsModel.fuelUnit.equals(this._fuelUnit)) {
            this._fuelUnit = this._parentPage.unitsModel.fuelUnit;
            updated = true;
        }
        if (updated) {
            this._flightPlanRenderer.updateDataFieldUnits();
        }
    }

    _updateAltitudeUnits() {
        if (!this._parentPage.unitsModel.altitudeUnit.equals(this._altitudeUnit)) {
            this._altitudeUnit = this._parentPage.unitsModel.altitudeUnit;
            this._flightPlanRenderer.refreshAllAltitudeConstraints();
        }
    }

    _updateUnits() {
        this._updateDataFieldUnits();
        this._updateAltitudeUnits();
    }

    _updateDynamicDataFields() {
        for (let i = 0; i < this._dataFieldIsDynamic.length; i++) {
            if (this._dataFieldIsDynamic[i] && (this._parentPage.instrument.currentTimeStamp - this._dataFieldLastRefreshTimes[i] >= WT_G3x5_TSCFlightPlanHTMLElement.DYNAMIC_DATA_FIELD_UPDATE_INTERVAL)) {
                this._refreshDataField(i);
            }
        }
    }

    _updateScroll() {
        this._rows.scrollManager.update();
    }

    _doUpdate(state) {
        this._updateFlightPlan(state);
        this._updateUnits();
        this._updateDynamicDataFields();
        this._updateScroll();
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanState} state
     */
    update(state) {
        if (!this._isInit || !this._flightPlan) {
            return;
        }

        this._doUpdate(state);
    }
}
WT_G3x5_TSCFlightPlanHTMLElement.SOURCE_ATTRIBUTES = [
    "active",
    "standby"
];
/**
 * @enum {Number}
 */
WT_G3x5_TSCFlightPlanHTMLElement.BannerMode = {
    ORIGIN: 0,
    DESTINATION: 1,
    WAYPOINT: 2,
    AIRWAY: 3
};
WT_G3x5_TSCFlightPlanHTMLElement.BANNER_MODE_ATTRIBUTES = [
    "origin",
    "destination",
    "waypoint",
    "airway"
];
/**
 * @enum {Number}
 */
WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType = {
    DRCT: 0,
    ACTIVATE_STANDBY: 1,
    PROC: 2,
    STANDBY_FLIGHT_PLAN: 3,
    ACTIVE_FLIGHT_PLAN: 4,
    VNAV: 5,
    FLIGHT_PLAN_OPTIONS: 6,
    HEADER: 7,
    LEG_WAYPOINT: 8,
    LEG_ALTITUDE: 9,
    ENROUTE_ADD: 10,
    ENROUTE_DONE: 11,
    ORIGIN_SELECT: 12,
    DEPARTURE_SELECT: 13,
    ORIGIN_REMOVE: 14,
    ORIGIN_INFO: 15,
    DESTINATION_SELECT: 16,
    ARRIVAL_SELECT: 17,
    APPROACH_SELECT: 18,
    DESTINATION_REMOVE: 19,
    DESTINATION_INFO: 20,
    INSERT_BEFORE: 21,
    INSERT_AFTER: 22,
    WAYPOINT_DRCT: 23,
    ACTIVATE_LEG: 24,
    LOAD_AIRWAY: 25,
    WAYPOINT_REMOVE: 26,
    WAYPOINT_INFO: 27,
    AIRWAY_COLLAPSE: 28,
    AIRWAY_EXPAND: 29,
    AIRWAY_COLLAPSE_ALL: 30,
    AIRWAY_EXPAND_ALL: 31,
    AIRWAY_REMOVE: 32,
    AIRWAY_EDIT: 33
};
WT_G3x5_TSCFlightPlanHTMLElement.DATA_FIELD_MODE_TEXTS = [
    "CUM",
    "DIS",
    "DTK",
    "ETA",
    "ETE",
    "FUEL"
];
WT_G3x5_TSCFlightPlanHTMLElement.DYNAMIC_DATA_FIELD_UPDATE_INTERVAL = 2000; // milliseconds
WT_G3x5_TSCFlightPlanHTMLElement.NAME = "wt-tsc-flightplan";
WT_G3x5_TSCFlightPlanHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCFlightPlanHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            width: 100%;
            height: 100%;
        }

        #wrapper {
            width: 100%;
            height: 100%;
        }
            #wrapper[source="active"] .standbyOnly {
                display: none;
            }
            #wrapper[source="standby"] .activeOnly {
                display: none;
            }
            #grid {
                position: absolute;
                left: 0%;
                top: 0%;
                width: 100%;
                height: 100%;
                display: grid;
                grid-template-rows: 100%;
                grid-template-columns: var(--flightplan-left-width, 4em) 1fr;
                grid-gap: 0 var(--flightplan-left-margin-right, 0.2em);
            }
                #left {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    display: grid;
                    grid-template-rows: repeat(5, 1fr);
                    grid-template-columns: 100%;
                    grid-gap: var(--flightplan-left-button-margin-vertical, 0.2em) 0;
                }
                    #drct {
                        --button-img-image-height: 90%;
                    }
                    #activatestdby,
                    #stdbyfpln,
                    #activefpln,
                    #fplnoptions {
                        font-size: 0.85em;
                    }
                    #wrapper[source="standby"] #fplnoptions {
                        grid-area: 5 / 1;
                    }
                #tablecontainer {
                    position: relative;
                    border-radius: 3px;
                    background: linear-gradient(#1f3445, black 25px);
                    border: 3px solid var(--wt-g3x5-bordergray);
                }
                    #table {
                        position: absolute;
                        left: var(--flightplan-table-padding-left, 0.1em);
                        top: var(--flightplan-table-padding-top, 0.1em);
                        width: calc(100% - var(--flightplan-table-padding-left, 0.1em) - var(--flightplan-table-padding-right, 0.1em));
                        height: calc(100% - var(--flightplan-table-padding-top, 0.1em) - var(--flightplan-table-padding-bottom, 0.1em));
                        display: grid;
                        grid-template-columns: 100%;
                        grid-template-rows: var(--flightplan-table-head-height, 1em) 1fr;
                        grid-gap: var(--flightplan-table-head-margin-bottom, 0.1em) 0;
                    }
                        #header {
                            position: relative;
                            width: calc(100% - var(--scrolllist-scrollbar-width, 1vw) - var(--flightplan-table-row-margin-right, 0.2em));
                            height: 100%;
                            display: grid;
                            grid-template-rows: 100%;
                            grid-template-columns: var(--flightplan-table-grid-columns, 2fr 1fr 1fr);
                            grid-gap: 0 var(--flightplan-table-grid-column-gap, 0.2em);
                            align-items: center;
                            justify-items: center;
                            font-size: var(--flightplan-table-header-font-size, 0.85em);
                            color: white;
                        }
                            #nametitle {
                                justify-self: start;
                                margin: 0 0.2em;
                            }
                        #rows {
                            position: relative;
                            width: 100%;
                            height: 100%;
                            --scrolllist-padding-left: 0%;
                            --scrolllist-padding-right: var(--flightplan-table-row-margin-right, 0.2em);
                            --scrolllist-padding-top: 0%;
                        }
                            #scrollcontainer {
                                position: relative;
                                width: 100%;
                            }
                            #rowscontainer {
                                position: relative;
                                width: 100%;
                                display: flex;
                                flex-flow: column nowrap;
                                align-items: stretch;
                            }
                                wt-tsc-flightplan-row {
                                    height: var(--flightplan-table-row-height, 3em);
                                    margin-bottom: var(--flightplan-table-row-margin-vertical, 0.1em);
                                    transform: rotateX(0deg);
                                }
                            .activeArrow {
                                display: none;
                            }
                            #wrapper[activearrow-show="true"] .activeArrow {
                                display: block;
                            }
                            #activearrowstem {
                                position: absolute;
                                left: var(--flightplan-table-arrow-left, 0.2em);
                                top: 0%;
                                width: calc(100% - var(--flightplan-table-arrow-right, calc(100% - 1.5em)) - var(--flightplan-table-arrow-left, 0.2em) - var(--flightplan-table-arrow-head-size, 0.75em) / 2);
                                height: 100%;
                                transform: rotateX(0deg);
                            }
                                #activearrowstem rect {
                                    stroke-width: var(--flightplan-table-arrow-stroke-width, 0.2em);
                                    stroke: var(--wt-g3x5-purple);
                                    fill: transparent;
                                    transform: translate(calc(var(--flightplan-table-arrow-stroke-width, 0.2em) / 2), 0);
                                }
                            #activearrowhead {
                                position: absolute;
                                right: var(--flightplan-table-arrow-right, calc(100% - 1.5em));
                                top: calc(-1 * var(--flightplan-table-arrow-head-size, 0.75em) / 2);
                                width: var(--flightplan-table-arrow-head-size, 0.75em);
                                height: var(--flightplan-table-arrow-head-size, 0.75em);
                                transform: rotateX(0deg);
                            }
                                #activearrowhead polygon {
                                    fill: var(--wt-g3x5-purple);
                                }
            #banner {
                position: absolute;
                right: -1vw;
                top: 50%;
                width: calc(var(--flightplan-banner-width, 40%) + 1vw + var(--flightplan-banner-margin-right, 0px));
                height: var(--flightplan-banner-height, 100%);
                transform: translateY(-50%);
                --slidingbanner-padding-right: calc(1vw + var(--flightplan-banner-margin-right, 0px));
            }
                #bannerpadding {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    border-radius: 5px;
                    border: 3px solid var(--wt-g3x5-bordergray);
                    background: black;
                }
                    .bannerContent {
                        display: none;
                        position: absolute;
                        left: var(--flightplan-banner-padding-left, 0.1em);
                        top: var(--flightplan-banner-padding-top, 0.1em);
                        width: calc(100% - var(--flightplan-banner-padding-left, 0.1em) - var(--flightplan-banner-padding-right, 0.1em));
                        height: calc(100% - var(--flightplan-banner-padding-top, 0.1em) - var(--flightplan-banner-padding-bottom, 0.1em));
                        font-size: var(--flightplan-banner-font-size, 0.85em);
                        grid-template-rows: repeat(5, 1fr);
                        grid-template-columns: 1fr 1fr;
                        grid-gap: var(--flightplan-banner-grid-gap, 0.1em);
                    }
                    #wrapper[banner-mode="origin"] #originbanner {
                        display: grid;
                    }
                    #wrapper[banner-mode="destination"] #destinationbanner {
                        display: grid;
                    }
                    #wrapper[banner-mode="waypoint"] #waypointbanner {
                        display: grid;
                    }
                    #wrapper[banner-mode="airway"] #airwaybanner {
                        display: grid;
                    }
                        .bannerPosition11 {
                            grid-area: 1 / 1;
                        }
                        .bannerPosition12 {
                            grid-area: 1 / 2;
                        }
                        .bannerPosition21 {
                            grid-area: 2 / 1;
                        }
                        .bannerPosition22 {
                            grid-area: 2 / 2;
                        }
                        .bannerPosition31 {
                            grid-area: 3 / 1;
                        }
                        .bannerPosition32 {
                            grid-area: 3 / 2;
                        }
                        .bannerPosition41 {
                            grid-area: 4 / 1;
                        }
                        .bannerPosition42 {
                            grid-area: 4 / 2;
                        }
                        .bannerPosition51 {
                            grid-area: 5 / 1;
                        }
                        .bannerPosition52 {
                            grid-area: 5 / 2;
                        }
                        #waypointdrct {
                            --button-img-image-height: 90%;
                        }
                        #wrapper[source="active"] #hold {
                            grid-area: 4 / 1;
                        }
                        #wrapper[source="standby"] #hold {
                            grid-area: 2 / 1;
                        }
                        #loadnewairways {
                            grid-area: 3 / 1 / 4 / 3;
                        }
    </style>
    <div id="wrapper">
        <div id="grid">
            <div id="left">
                <wt-tsc-button-img id="drct" class="activeOnly" imgsrc="/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_MAP_DIRECT_TO_1.png"></wt-tsc-button-img>
                <wt-tsc-button-label id="activatestdby" class="standbyOnly" labeltext="Activate Standby"></wt-tsc-button-label>
                <wt-tsc-button-label id="proc" labeltext="PROC"></wt-tsc-button-label>
                <wt-tsc-button-label id="stdbyfpln" class="activeOnly" labeltext="Standby Flight Plan"></wt-tsc-button-label>
                <wt-tsc-button-label id="activefpln" class="standbyOnly" labeltext="Active Flight Plan"></wt-tsc-button-label>
                <wt-tsc-button-label id="vnav" labeltext="VNAV" class="activeOnly"></wt-tsc-button-label>
                <wt-tsc-button-label id="fplnoptions" labeltext="Flight Plan Options"></wt-tsc-button-label>
            </div>
            <div id="tablecontainer">
                <div id="table">
                    <div id="header">
                        <div id="nametitle">______/______</div>
                        <div id="alttitle">ALT</div>
                        <div id="datafieldtitle"></div>
                    </div>
                    <wt-tsc-scrolllist id="rows">
                        <div id="scrollcontainer" slot="content">
                            <div id="rowscontainer"></div>
                            <svg id="activearrowstem" class="activeArrow">
                                <rect x="0" y="0" rx="10" ry="10" width="1000" height="0" />
                            </svg>
                            <svg id="activearrowhead" class="activeArrow" viewBox="0 0 86.6 100">
                                <polygon points="0,0 86.6,50 0,100" />
                            </svg>
                        </div>
                    </wt-tsc-scrolllist>
                </div>
            </div>
        </div>
        <wt-tsc-slidingbanner id="banner">
            <div id="bannerpadding" slot="content">
                <div id="originbanner" class="bannerContent">
                    <wt-tsc-button-label id="originselect" class="bannerPosition11" labeltext="Select Origin Airport"></wt-tsc-button-label>
                    <wt-tsc-button-label id="departurerwyselect" class="bannerPosition21" labeltext="Select Departure Runway" enabled="false"></wt-tsc-button-label>
                    <wt-tsc-button-label id="departureselect" class="bannerPosition31" labeltext="Select Departure"></wt-tsc-button-label>
                    <wt-tsc-button-label id="originremove" class="bannerPosition51" labeltext="Remove Origin Airport"></wt-tsc-button-label>
                    <wt-tsc-button-label id="origininfo" class="bannerPosition12" labeltext="Waypoint Info"></wt-tsc-button-label>
                    <wt-tsc-button-label id="takeoffdata" class="bannerPosition22" labeltext="Takeoff Data" enabled="false"></wt-tsc-button-label>
                </div>
                <div id="destinationbanner" class="bannerContent">
                    <wt-tsc-button-label id="destinationselect" class="bannerPosition11" labeltext="Select Destination Airport"></wt-tsc-button-label>
                    <wt-tsc-button-label id="arrivalrwyselect" class="bannerPosition21" labeltext="Select Arrival Runway" enabled="false"></wt-tsc-button-label>
                    <wt-tsc-button-label id="arrivalselect" class="bannerPosition31" labeltext="Select Arrival"></wt-tsc-button-label>
                    <wt-tsc-button-label id="approachselect" class="bannerPosition41" labeltext="Select Approach"></wt-tsc-button-label>
                    <wt-tsc-button-label id="destinationremove" class="bannerPosition51" labeltext="Remove Destination Airport"></wt-tsc-button-label>
                    <wt-tsc-button-label id="destinationinfo" class="bannerPosition12" labeltext="Waypoint Info"></wt-tsc-button-label>
                    <wt-tsc-button-label id="landingdata" class="bannerPosition22" labeltext="Landing Data" enabled="false"></wt-tsc-button-label>
                </div>
                <div id="waypointbanner" class="bannerContent">
                    <wt-tsc-button-label id="insertbefore" class="bannerPosition11" labeltext="Insert<br>Before"></wt-tsc-button-label>
                    <wt-tsc-button-label id="insertafter" class="bannerPosition12" labeltext="Insert<br>After"></wt-tsc-button-label>
                    <wt-tsc-button-img id="waypointdrct" class="activeOnly bannerPosition21" imgsrc="/WTg3000/SDK/Assets/Images/Garmin/TSC/ICON_MAP_DIRECT_TO_1.png"></wt-tsc-button-img>
                    <wt-tsc-button-label id="activateleg" class="activeOnly bannerPosition22" labeltext="Activate Leg to Waypoint"></wt-tsc-button-label>
                    <wt-tsc-button-label id="joinppos" class="standbyOnly bannerPosition22" labeltext="Join From P.POS" enabled="false"></wt-tsc-button-label>
                    <wt-tsc-button-label id="loadairway" class="bannerPosition31" labeltext="Load Airway"></wt-tsc-button-label>
                    <wt-tsc-button-label id="alongtrack" class="bannerPosition32" labeltext="Along Track Waypoint" enabled="false"></wt-tsc-button-label>
                    <wt-tsc-button-label id="hold" labeltext="Hold at Waypoint" enabled="false"></wt-tsc-button-label>
                    <wt-tsc-button-label id="waypointinfo" class="bannerPosition42" labeltext="Waypoint Info"></wt-tsc-button-label>
                    <wt-tsc-button-label id="waypointremove" class="bannerPosition51" labeltext="Remove Waypoint"></wt-tsc-button-label>
                    <wt-tsc-button-statusbar id="flyover" class="bannerPosition52" labeltext="Fly Over Waypoint" enabled="false"></wt-tsc-button-statusbar>
                </div>
                <div id="airwaybanner" class="bannerContent">
                    <wt-tsc-button-label id="airwaycollapse" class="bannerPosition11" labeltext="Collapse<br>Airway"></wt-tsc-button-label>
                    <wt-tsc-button-label id="airwayexpand" class="bannerPosition12" labeltext="Expand<br>Airway"></wt-tsc-button-label>
                    <wt-tsc-button-label id="collapseall" class="bannerPosition21" labeltext="Collapse<br>All"></wt-tsc-button-label>
                    <wt-tsc-button-label id="expandall" class="bannerPosition22" labeltext="Expand<br>All"></wt-tsc-button-label>
                    <wt-tsc-button-value id="loadnewairways" labeltext="Load New Airways"></wt-tsc-button-value>
                    <wt-tsc-button-label id="airwayremove" class="bannerPosition51" labeltext="Remove Airway"></wt-tsc-button-label>
                    <wt-tsc-button-statusbar id="airwayedit" class="bannerPosition52" labeltext="Edit Airway" enabled="false"></wt-tsc-button-statusbar>
                </div>
            </div>
        </wt-tsc-slidingbanner>
    </div>
`;

customElements.define(WT_G3x5_TSCFlightPlanHTMLElement.NAME, WT_G3x5_TSCFlightPlanHTMLElement);

/**
 * @typedef WT_G3x5_TSCFlightPlanButtonEvent
 * @property {WT_TSCButton} button
 * @property {WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType} type
 * @property {WT_G3x5_TSCFlightPlanRowHTMLElement} [row]
 * @property {WT_FlightPlanSequence} [sequence]
 * @property {WT_FlightPlanLeg} [leg]
 */

class WT_G3x5_TSCFlightPlanRowHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {((event:WT_G3x5_TSCFlightPlanButtonEvent) => void)[]}
         */
        this._buttonListeners = [];

        this._mode = WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.NONE;
        this._isInit = false;

        this._initChildren();
    }

    _getTemplate() {
        return WT_G3x5_TSCFlightPlanRowHTMLElement.TEMPLATE;
    }

    _initLeg() {
        this._leg = new WT_G3x5_TSCFlightPlanRowLegHTMLElement();
        this._leg.id = WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS[WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG];
        this._leg.classList.add("mode");
        this._modeHTMLElements.push(this._leg);
    }

    _initHeader() {
        this._header = new WT_G3x5_TSCFlightPlanRowHeaderHTMLElement();
        this._header.id = WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS[WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.HEADER];
        this._header.classList.add("mode");
        this._modeHTMLElements.push(this._header);
    }

    _initEnrouteFooter() {
        this._enrouteFooter = new WT_G3x5_TSCFlightPlanRowEnrouteFooterHTMLElement();
        this._enrouteFooter.id = WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS[WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.ENROUTE_FOOTER];
        this._enrouteFooter.classList.add("mode");
        this._modeHTMLElements.push(this._enrouteFooter);
    }

    _initAirwayFooter() {
        this._airwayFooter = new WT_G3x5_TSCFlightPlanRowAirwaySequenceFooterHTMLElement();
        this._airwayFooter.id = WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS[WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.AIRWAY_FOOTER];
        this._airwayFooter.classList.add("mode");
        this._modeHTMLElements.push(this._airwayFooter);
    }

    _initChildren() {
        this._modeHTMLElements = [null];
        this._initLeg();
        this._initHeader();
        this._initEnrouteFooter();
        this._initAirwayFooter();
    }

    _appendChildren() {
        this._modeHTMLElements.forEach(element => {
            if (element) {
                this.shadowRoot.appendChild(element);
            }
        });
    }

    _initLegButtonListeners() {
        let mode = this.getModeHTMLElement(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG);
        mode.addWaypointButtonListener(this._onLegWaypointButtonPressed.bind(this));
        mode.addAltitudeButtonListener(this._onLegAltitudeButtonPressed.bind(this));
    }

    _initHeaderButtonListeners() {
        let mode = this.getModeHTMLElement(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.HEADER);
        mode.addButtonListener(this._onHeaderButtonPressed.bind(this));
    }

    _initEnrouteFooterButtonListeners() {
        let mode = this.getModeHTMLElement(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.ENROUTE_FOOTER);
        mode.addAddButtonListener(this._onEnrouteAddButtonPressed.bind(this));
        mode.addDoneButtonListener(this._onEnrouteDoneButtonPressed.bind(this));
    }

    _initAirwayFooterButtonListeners() {
        let mode = this.getModeHTMLElement(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.AIRWAY_FOOTER);
        mode.addWaypointButtonListener(this._onAirwayFooterWaypointButtonPressed.bind(this));
        mode.addAltitudeButtonListener(this._onAirwayFooterAltitudeButtonPressed.bind(this));
    }

    async _initButtonListeners() {
        await Promise.all(this._modeHTMLElements.filter(element => element !== null).map(element => WT_Wait.awaitCallback(() => element.isInitialized)));
        this._initLegButtonListeners();
        this._initHeaderButtonListeners();
        this._initEnrouteFooterButtonListeners();
        this._initAirwayFooterButtonListeners();
    }

    async _connectedCallbackHelper() {
        this._appendChildren();
        await this._initButtonListeners();
        this._isInit = true;
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _initFromParentPage() {
        this._leg.setParentPage(this._parentPage);
        this._airwayFooter.setParentPage(this._parentPage);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlan} parentPage
     */
    setParentPage(parentPage) {
        if (!parentPage || this._parentPage) {
            return;
        }

        this._parentPage = parentPage;
        this._initFromParentPage();
    }

    /**
     *
     * @returns {WT_G3x5_TSCFlightPlanRowHTMLElement.Mode}
     */
    getMode() {
        return this._mode;
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanRowHTMLElement.Mode} mode
     */
    setMode(mode) {
        if (this._mode !== mode) {
            this.setAttribute("mode", WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS[mode]);
            this._mode = mode;
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanRowHTMLElement.Mode} mode
     * @return {HTMLElement}
     */
    getModeHTMLElement(mode) {
        return this._modeHTMLElements[mode];
    }

    /**
     *
     * @return {HTMLElement}
     */
    getActiveModeHTMLElement() {
        return this._modeHTMLElements[this._mode];
    }

    /**
     *
     * @param {(event:WT_G3x5_TSCFlightPlanButtonEvent) => void} listener
     */
    addButtonListener(listener) {
        this._buttonListeners.push(listener);
    }

    /**
     *
     * @param {(event:WT_G3x5_TSCFlightPlanButtonEvent) => void} listener
     */
    removeButtonListener(listener) {
        let index = this._buttonListeners.indexOf(listener);
        if (index >= 0) {
            this._buttonListeners.splice(index, 1);
        }
    }

    _notifyButtonListeners(event) {
        this._buttonListeners.forEach(listener => listener(event));
    }

    _onLegWaypointButtonPressed(button) {
        let mode = this.getModeHTMLElement(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG);
        let event = {
            button: button,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.LEG_WAYPOINT,
            row: this,
            leg: mode.leg
        }
        this._notifyButtonListeners(event);
    }

    _onLegAltitudeButtonPressed(button) {
        let mode = this.getModeHTMLElement(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG);
        let event = {
            button: button,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.LEG_ALTITUDE,
            row: this,
            leg: mode.leg
        }
        this._notifyButtonListeners(event);
    }

    _onHeaderButtonPressed(button) {
        let mode = this.getModeHTMLElement(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.HEADER);
        let event = {
            button: button,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.HEADER,
            row: this,
            sequence: mode.sequence
        }
        this._notifyButtonListeners(event);
    }

    _onEnrouteAddButtonPressed(button) {
        let event = {
            button: button,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ENROUTE_ADD,
            row: this
        }
        this._notifyButtonListeners(event);
    }

    _onEnrouteDoneButtonPressed(button) {
        let event = {
            button: button,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.ENROUTE_DONE,
            row: this
        }
        this._notifyButtonListeners(event);
    }

    _onAirwayFooterWaypointButtonPressed(button) {
        let mode = this.getModeHTMLElement(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.AIRWAY_FOOTER);
        let event = {
            button: button,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.LEG_WAYPOINT,
            row: this,
            leg: mode.leg
        }
        this._notifyButtonListeners(event);
    }

    _onAirwayFooterAltitudeButtonPressed(button) {
        let mode = this.getModeHTMLElement(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.AIRWAY_FOOTER);
        let event = {
            button: button,
            type: WT_G3x5_TSCFlightPlanHTMLElement.ButtonEventType.LEG_ALTITUDE,
            row: this,
            leg: mode.leg
        }
        this._notifyButtonListeners(event);
    }

    onUnselected() {
        this._modeHTMLElements.forEach(element => {
            if (element) {
                element.onUnselected();
            }
        });
    }

    onSelected() {
        this._modeHTMLElements.forEach(element => {
            if (element) {
                element.onSelected();
            }
        });
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_TSCFlightPlanRowHTMLElement.Mode = {
    NONE: 0,
    LEG: 1,
    HEADER: 2,
    ENROUTE_FOOTER: 3,
    AIRWAY_FOOTER: 4
}
WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS = [
    "",
    "leg",
    "header",
    "enroutefooter",
    "airwayfooter"
];
WT_G3x5_TSCFlightPlanRowHTMLElement.NAME = "wt-tsc-flightplan-row";
WT_G3x5_TSCFlightPlanRowHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCFlightPlanRowHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
        }

        .mode {
            display: none;
        }

        :host([mode=${WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS[WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG]}]) #leg {
            display: block;
        }
        :host([mode=${WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS[WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.HEADER]}]) #header {
            display: block;
        }
        :host([mode=${WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS[WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.ENROUTE_FOOTER]}]) #enroutefooter {
            display: block;
        }
        :host([mode=${WT_G3x5_TSCFlightPlanRowHTMLElement.MODE_IDS[WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.AIRWAY_FOOTER]}]) #airwayfooter {
            display: block;
        }
    </style>
`;

customElements.define(WT_G3x5_TSCFlightPlanRowHTMLElement.NAME, WT_G3x5_TSCFlightPlanRowHTMLElement);

class WT_G3x5_TSCFlightPlanWaypointButton extends WT_G3x5_TSCWaypointButton {
    constructor() {
        super();
    }

    _createIdentStyle() {
        return `
            #ident {
                position: absolute;
                left: 2%;
                top: 5%;
                font-size: var(--waypoint-ident-font-size, 1.67em);
                text-align: left;
                color: var(--waypoint-ident-color, var(--wt-g3x5-lightblue));
            }
            :host([active=true]) #ident {
                color: var(--wt-g3x5-purple);
            }
            :host([highlight=true][primed=false][active=false]) #ident {
                color: black;
            }
        `;
    }

    _createNameStyle() {
        return `
            #name {
                position: absolute;
                left: 2%;
                width: 90%;
                bottom: 5%;
                font-size: var(--waypoint-name-font-size, 1em);
                text-align: left;
                white-space: nowrap;
                overflow: hidden;
                color: var(--waypoint-name-color, white);
            }
            :host([active=true]) #name {
                color: var(--wt-g3x5-purple);
            }
            :host([highlight=true][primed=false][active=false]) #name {
                color: black;
            }
        `;
    }

    get active() {
        return this.getAttribute("active");
    }

    set active(value) {
        this.setAttribute("active", value);
    }
}
WT_G3x5_TSCFlightPlanWaypointButton.NAME = "wt-tsc-button-fpwaypoint";

customElements.define(WT_G3x5_TSCFlightPlanWaypointButton.NAME, WT_G3x5_TSCFlightPlanWaypointButton);

class WT_G3x5_TSCFlightPlanRowLegHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {WT_G3x5_TSCFlightPlan}
         */
        this._parentPage = null;
        /**
         * @type {WT_FlightPlanLeg}
         */
        this._leg = null;
        /**
         * @type {WT_FlightPlanVNAVLegRestriction}
         */
        this._vnavLegRestriction = null;

        this._isActive = false;
        this._isInit = false;

        this._tempNM = WT_Unit.NMILE.createNumber(0);
        this._tempKnots = WT_Unit.KNOT.createNumber(0);
        this._tempGPH = WT_Unit.GPH_FUEL.createNumber(0);
    }

    _getTemplate() {
        return WT_G3x5_TSCFlightPlanRowLegHTMLElement.TEMPLATE;
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
     * @type {WT_FlightPlanLeg}
     */
    get leg() {
        return this._leg;
    }

    async _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);

        [
            this._waypointButton,
            this._altitudeConstraintButton,
            this._altitudeConstraint,
            this._dataFieldViews
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#waypoint`, WT_G3x5_TSCFlightPlanWaypointButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#altconstraintbutton`, WT_TSCContentButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#altconstraint`, WT_G3x5_TSCFlightPlanLegAltitudeConstraintHTMLElement),
            Promise.all([
                WT_CustomElementSelector.select(this.shadowRoot, `#datafield1`, WT_G3x5_NavDataInfoView),
                WT_CustomElementSelector.select(this.shadowRoot, `#datafield2`, WT_G3x5_NavDataInfoView)
            ])
        ]);
    }

    _initChildren() {
        this._waypointButton.setIconSrcFactory(new WT_G3x5_TSCWaypointButtonIconSrcFactory(WT_G3x5_TSCFlightPlanRowLegHTMLElement.WAYPOINT_ICON_IMAGE_DIRECTORY));
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._initChildren();
        this._isInit = true;
        this._updateFromLeg();
        this._updateFromActive();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    /**
     *
     * @param {WT_NumberUnit} value
     */
    _updateCumulativeDistance(value) {
        value.set(this.leg ? this.leg.cumulativeDistance : NaN);
    }

    /**
     *
     * @param {WT_NumberUnit} value
     */
    _updateLegDistance(value) {
        value.set(this.leg ? this.leg.distance : NaN);
    }

    /**
     *
     * @param {WT_NumberUnit} value
     */
    _updateDTK(value) {
        if (this.leg) {
            value.unit.setLocation(this.leg.desiredTrack.unit.location);
            value.set(this.leg.desiredTrack);
        } else {
            value.set(NaN);
        }
    }

    /**
     *
     * @param {WT_Time} time
     */
    _updateETA(time) {
        if (this.leg && !this._parentPage.instrument.airplane.sensors.isOnGround()) {
            let fpm = this._parentPage.instrument.flightPlanManagerWT;
            let activeLeg = fpm.directTo.isActive() ? fpm.getDirectToLeg(true) : fpm.getActiveLeg(true);
            if (activeLeg && activeLeg.flightPlan === this.leg.flightPlan && activeLeg.index <= this.leg.index) {
                let distanceToActiveLegFixNM = fpm.directTo.isActive() ? fpm.distanceToDirectTo(true, this._tempNM).number : fpm.distanceToActiveLegFix(true, this._tempNM).number;
                let distanceNM = this.leg.cumulativeDistance.asUnit(WT_Unit.NMILE) - activeLeg.cumulativeDistance.asUnit(WT_Unit.NMILE) + distanceToActiveLegFixNM;
                let speed = this._parentPage.instrument.airplane.navigation.groundSpeed(this._tempKnots);
                if (speed.compare(WT_G3x5_TSCFlightPlanRowLegHTMLElement.MIN_COMPUTE_SPEED) >= 0) {
                    let ete = distanceNM / speed.number;
                    time.set(this._parentPage.instrument.time);
                    time.add(ete, WT_Unit.HOUR);
                    return;
                }
            }
        }
        time.set(NaN);
    }

    /**
     *
     * @param {WT_NumberUnit} value
     */
    _updateETE(value) {
        if (this.leg && !this._parentPage.instrument.airplane.sensors.isOnGround()) {
            let distanceNM = this.leg.distance.asUnit(WT_Unit.NMILE);
            let speed = this._parentPage.instrument.airplane.navigation.groundSpeed(this._tempKnots);
            value.set(speed.compare(WT_G3x5_TSCFlightPlanRowLegHTMLElement.MIN_COMPUTE_SPEED) >= 0 ? (distanceNM / speed.number) : NaN, WT_Unit.HOUR);
        } else {
            value.set(NaN);
        }
    }

    /**
     *
     * @param {WT_NumberUnit} value
     */
    _updateFuelToDestination(value) {
        if (this.leg && !this._parentPage.instrument.airplane.sensors.isOnGround()) {
            let distanceToDestinationNM = this.leg.flightPlan.legs.last().cumulativeDistance.asUnit(WT_Unit.NMILE) - this.leg.cumulativeDistance.asUnit(WT_Unit.NMILE);
            let speed = this._parentPage.instrument.airplane.navigation.groundSpeed(this._tempKnots);
            let fuelFlow = this._parentPage.instrument.airplane.engineering.fuelFlowTotal(this._tempGPH);
            value.set((speed.compare(WT_G3x5_TSCFlightPlanRowLegHTMLElement.MIN_COMPUTE_SPEED) >= 0 && fuelFlow.compare(WT_G3x5_TSCFlightPlanRowLegHTMLElement.MIN_COMPUTE_FUEL_FLOW) >= 0) ? (distanceToDestinationNM / speed.number * fuelFlow.number) : NaN, WT_Unit.GALLON_FUEL);
        } else {
            value.set(NaN);
        }
    }

    _initNavDataInfos() {
        this._navDataInfos = [
            new WT_G3x5_NavDataInfoNumber({shortName: "", longName: "CUM"}, new WT_NumberUnitModelAutoUpdated(WT_Unit.NMILE, {updateValue: this._updateCumulativeDistance.bind(this)})),
            new WT_G3x5_NavDataInfoNumber({shortName: "", longName: "DIS"}, new WT_NumberUnitModelAutoUpdated(WT_Unit.NMILE, {updateValue: this._updateLegDistance.bind(this)})),
            new WT_G3x5_NavDataInfoNumber({shortName: "", longName: "DTK"}, new WT_NumberUnitModelAutoUpdated(new WT_NavAngleUnit(true), {updateValue: this._updateDTK.bind(this)})),
            new WT_G3x5_NavDataInfoTime({shortName: "", longName: "ETA"}, new WT_G3x5_TimeModel(new WT_TimeModelAutoUpdated("", {updateTime: this._updateETA.bind(this)}), this._parentPage.instrument.avionicsSystemSettingModel.timeFormatSetting, this._parentPage.instrument.avionicsSystemSettingModel.timeLocalOffsetSetting)),
            new WT_G3x5_NavDataInfoNumber({shortName: "", longName: "ETE"}, new WT_NumberUnitModelAutoUpdated(WT_Unit.SECOND, {updateValue: this._updateETE.bind(this)})),
            new WT_G3x5_NavDataInfoNumber({shortName: "", longName: "FUEL"}, new WT_NumberUnitModelAutoUpdated(WT_Unit.GALLON_FUEL, {updateValue: this._updateFuelToDestination.bind(this)}))
        ];
    }

    _initNavDataFormatters() {
        let bearingFormatter = new WT_NumberFormatter({
            precision: 1,
            unitSpaceBefore: false
        });

        let distanceFormatter = new WT_NumberFormatter({
            precision: 0.1,
            maxDigits: 3,
            unitSpaceBefore: false,
            unitCaps: true
        });

        let fuelFormatter = new WT_NumberFormatter({
            precision: 0.1,
            maxDigits: 3,
            unitSpaceBefore: false,
            unitCaps: true
        });

        let durationFormatter = new WT_TimeFormatter({
            timeFormat: WT_TimeFormatter.Format.HH_MM_OR_MM_SS,
            delim: WT_TimeFormatter.Delim.COLON_OR_CROSS
        });

        this._navDataFormatters = [
            new WT_G3x5_NavDataInfoViewNumberFormatter(distanceFormatter),
            new WT_G3x5_NavDataInfoViewNumberFormatter(distanceFormatter),
            new WT_G3x5_NavDataInfoViewDegreeFormatter(bearingFormatter),
            new WT_G3x5_NavDataInfoViewTimeFormatter(),
            new WT_G3x5_NavDataInfoViewDurationFormatter(durationFormatter, "__:__"),
            new WT_G3x5_NavDataInfoViewNumberFormatter(fuelFormatter)
        ];
    }

    _initFromParentPage() {
        this._initNavDataInfos();
        this._initNavDataFormatters();
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlan} parentPage
     */
    setParentPage(parentPage) {
        if (!parentPage || this._parentPage) {
            return;
        }

        this._parentPage = parentPage;
        this._initFromParentPage();
    }

    _clearWaypointButton() {
        this._waypointButton.setWaypoint(null);
    }

    _clearAltitudeConstraint() {
        this._altitudeConstraint.update(null, null, this._parentPage.unitsModel.altitudeUnit);
    }

    _clearAirway() {
        this._wrapper.setAttribute("airway", "false");
    }

    _updateWaypointFromLeg() {
        this._waypointButton.setWaypoint(this._leg.fix);
    }

    _updateAltitudeConstraint() {
        this._altitudeConstraint.update(this._leg.altitudeConstraint, this._vnavLegRestriction, this._parentPage.unitsModel.altitudeUnit);
    }

    /**
     *
     * @param {Number} index
     */
    _updateDataFieldFromLeg(index) {
        let view = this._dataFieldViews[index];
        let mode = this._parentPage.settings.dataFieldSettings.get(index).mode;
        view.update(this._navDataInfos[mode], this._navDataFormatters[mode]);
    }

    _updateDataFieldsFromLeg() {
        for (let i = 0; i < this._dataFieldViews.length; i++) {
            this._updateDataFieldFromLeg(i);
        }
    }

    _updateAirwayFromLeg() {
        this._wrapper.setAttribute("airway", `${this._leg.parent instanceof WT_FlightPlanAirwaySequence}`);
    }

    _updateFromLeg() {
        if (this._leg) {
            this._updateWaypointFromLeg();
            this._updateAltitudeConstraint();
            this._updateAirwayFromLeg();
        } else {
            this._clearWaypointButton();
            this._clearAltitudeConstraint();
            this._clearAirway();
        }
        this._updateDataFieldsFromLeg();
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     */
    setLeg(leg) {
        if (leg === this._leg) {
            return;
        }

        this._leg = leg;
        if (this._isInit) {
            this._updateFromLeg();
        }
    }

    _updateFromVNAVLegRestriction() {
        this._updateAltitudeConstraint();
    }

    /**
     *
     * @param {WT_FlightPlanVNAVLegRestriction} restriction
     */
    setVNAVLegRestriction(restriction) {
        if (this._vnavLegRestriction === restriction) {
            return;
        }

        this._vnavLegRestriction = restriction;
        if (this._isInit) {
            this._updateFromVNAVLegRestriction();
        }
    }

    _updateFromActive() {
        this._wrapper.setAttribute("active", `${this._isActive}`);
        this._waypointButton.active = `${this._isActive}`;
    }

    setActive(value) {
        if (value === this._isActive) {
            return;
        }

        this._isActive = value;
        if (this._isInit) {
            this._updateFromActive();
        }
    }

    addWaypointButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._waypointButton.addButtonListener(listener);
    }

    removeWaypointButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._waypointButton.removeButtonListener(listener);
    }

    addAltitudeButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._altitudeConstraintButton.addButtonListener(listener);
    }

    removeAltitudeButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._altitudeConstraintButton.removeButtonListener(listener);
    }

    onUnselected() {
        this._waypointButton.highlight = "false";
    }

    onSelected() {
        this._waypointButton.highlight = "true";
    }

    refreshAltitudeConstraint() {
        if (!this._isInit) {
            return;
        }

        this._updateAltitudeConstraint();
    }

    updateDataFieldUnits() {
        if (!this._parentPage) {
            return;
        }

        this._navDataInfos[WT_G3x5_TSCFlightPlanDataFieldSetting.Mode.CUM].setDisplayUnit(this._parentPage.unitsModel.distanceUnit);
        this._navDataInfos[WT_G3x5_TSCFlightPlanDataFieldSetting.Mode.DIS].setDisplayUnit(this._parentPage.unitsModel.distanceUnit);
        this._navDataInfos[WT_G3x5_TSCFlightPlanDataFieldSetting.Mode.DTK].setDisplayUnit(this._parentPage.unitsModel.bearingUnit);
        this._navDataInfos[WT_G3x5_TSCFlightPlanDataFieldSetting.Mode.FUEL].setDisplayUnit(this._parentPage.unitsModel.fuelUnit);

        if (this._isInit) {
            this._updateDataFieldsFromLeg();
        }
    }

    refreshAllDataFields() {
        if (!this._isInit) {
            return;
        }

        this._updateDataFieldsFromLeg();
    }

    refreshDataField(index) {
        if (!this._isInit) {
            return;
        }

        this._updateDataFieldFromLeg(index);
    }

    /**
     *
     * @param {Number} airplaneHeadingTrue
     */
    _updateWaypointButton(airplaneHeadingTrue) {
        this._waypointButton.update(airplaneHeadingTrue);
    }

    /**
     *
     * @param {Number} airplaneHeadingTrue
     */
    update(airplaneHeadingTrue) {
        if (!this._isInit || !this._leg) {
            return;
        }

        this._updateWaypointButton(airplaneHeadingTrue);
    }
}
WT_G3x5_TSCFlightPlanRowLegHTMLElement.MIN_COMPUTE_SPEED = WT_Unit.KNOT.createNumber(30);
WT_G3x5_TSCFlightPlanRowLegHTMLElement.MIN_COMPUTE_FUEL_FLOW = WT_Unit.GPH_FUEL.createNumber(1);
WT_G3x5_TSCFlightPlanRowLegHTMLElement.WAYPOINT_ICON_IMAGE_DIRECTORY = "/WTg3000/SDK/Assets/Images/Garmin/TSC/Waypoints";
WT_G3x5_TSCFlightPlanRowLegHTMLElement.UNIT_CLASS = "unit";
WT_G3x5_TSCFlightPlanRowLegHTMLElement.NAME = "wt-tsc-flightplan-row-leg";
WT_G3x5_TSCFlightPlanRowLegHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCFlightPlanRowLegHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            width: 100%;
            height: 100%;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
        }
            #airwaylink {
                display: none;
                position: absolute;
                left: var(--flightplan-table-row-airwaylink-left, 0.25em);
                top: -50%;
                width: calc(100% - var(--flightplan-table-row-airwaylink-right, calc(100% - 1em)) - var(--flightplan-table-row-airwaylink-left, 0.25em));
                height: 100%;
            }
            #wrapper[airway="true"] #airwaylink {
                display: block;
            }
                #airwaylink #stem {
                    stroke-width: var(--flightplan-table-row-airwaylink-stroke-width, 0.2em);
                    fill: transparent;
                    transform: translate(calc(var(--flightplan-table-row-airwaylink-stroke-width, 0.2em) / 2), calc(-100% - var(--flightplan-table-row-airwaylink-stroke-width, 0.2em) / 2));
                }
            #grid {
                position: relative;
                width: 100%;
                height: 100%;
                display: grid;
                grid-template-rows: 100%;
                grid-template-columns: var(--flightplan-table-grid-columns, 2fr 1fr 1fr);
                grid-gap: 0 var(--flightplan-table-grid-column-gap, 0.2em);
            }
                #waypoint {
                    font-size: var(--flightplan-table-row-waypointbutton-font-size, 0.85em);
                    --button-padding-left: var(--flightplan-table-row-leg-waypointbutton-padding-left, 1.5em);
                }
                #wrapper[airway="true"] #waypoint {
                    justify-self: end;
                    width: calc(var(--flightplan-table-row-airwaylink-right, calc(100% - 1em)) - var(--flightplan-table-row-airwaylink-left, 0.25em));
                    --button-padding-left: var(--flightplan-table-row-leg-waypointbutton-airway-padding-left, 0.5em);
                }
                #datafields {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    display: grid;
                    grid-template-columns: 100%;
                    grid-template-rows: 50% 50%;
                    justify-items: end;
                    align-items: center;
                }
                    wt-navdatainfo-view {
                        height: auto;
                        --navdatainfo-justify-content: flex-end;
                    }
                    #wrapper[active="true"] wt-navdatainfo-view {
                        --navdatainfo-value-color: var(--wt-g3x5-purple);
                    }

        .${WT_G3x5_TSCFlightPlanRowLegHTMLElement.UNIT_CLASS} {
            font-size: var(--flightplan-unit-font-size, 0.75em);
        }
    </style>
    <div id="wrapper">
        <svg id="airwaylink">
            <defs>
                <linearGradient id="airwaylink-gradient" gradientTransform="rotate(90)">
                    <stop offset="55%" stop-color="#bce8eb" stop-opacity="0" />
                    <stop offset="70%" stop-color="#bce8eb" stop-opacity="1" />
                </linearGradient>
            </defs>
            <rect id="stem" x="0" y="0" rx="10" ry="10" width="200%" height="200%" stroke="url(#airwaylink-gradient)" />
        </svg>
        <div id="grid">
            <wt-tsc-button-fpwaypoint id="waypoint"></wt-tsc-button-fpwaypoint>
            <wt-tsc-button-content id="altconstraintbutton">
                <wt-tsc-flightplan-row-altitudeconstraint id="altconstraint" slot="content"></wt-tsc-flightplan-row-altitudeconstraint>
            </wt-tsc-button-content>
            <div id="datafields">
                <wt-navdatainfo-view id="datafield1"></wt-navdatainfo-view>
                <wt-navdatainfo-view id="datafield2"></wt-navdatainfo-view>
            </div>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCFlightPlanRowLegHTMLElement.NAME, WT_G3x5_TSCFlightPlanRowLegHTMLElement);

class WT_G3x5_TSCFlightPlanRowAirwaySequenceFooterHTMLElement extends WT_G3x5_TSCFlightPlanRowLegHTMLElement {
    /**
     *
     * @param {WT_NumberUnit} value
     */
    _updateLegDistance(value) {
        value.set(this.leg ? this.leg.parent.distance : NaN);
    }

    /**
     *
     * @param {WT_NumberUnit} value
     */
    _updateDTK(value) {
        value.set(NaN);
    }

    /**
     *
     * @param {WT_NumberUnit} value
     */
    _updateETE(value) {
        if (this.leg && !this._parentPage.instrument.airplane.sensors.isOnGround()) {
            let distanceNM = this.leg.parent.distance.asUnit(WT_Unit.NMILE);
            let speed = this._parentPage.instrument.airplane.navigation.groundSpeed(this._tempKnots);
            value.set(speed.compare(WT_G3x5_TSCFlightPlanRowLegHTMLElement.MIN_COMPUTE_SPEED) >= 0 ? (distanceNM / speed.number) : NaN, WT_Unit.HOUR);
        } else {
            value.set(NaN);
        }
    }
}
WT_G3x5_TSCFlightPlanRowAirwaySequenceFooterHTMLElement.NAME = "wt-tsc-flightplan-row-airwayfooter";

customElements.define(WT_G3x5_TSCFlightPlanRowAirwaySequenceFooterHTMLElement.NAME, WT_G3x5_TSCFlightPlanRowAirwaySequenceFooterHTMLElement);

class WT_G3x5_TSCFlightPlanLegAltitudeConstraintHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {WT_FlightPlanLegAltitudeConstraint}
         */
        this._legConstraint = null;
        /**
         * @type {WT_FlightPlanVNAVLegRestriction}
         */
        this._vnavLegRestriction = null;
        this._altitudeUnit = null;
        this._isInit = false;

        this._initFormatter();
    }

    _getTemplate() {
        return WT_G3x5_TSCFlightPlanLegAltitudeConstraintHTMLElement.TEMPLATE;
    }

    _initFormatter() {
        let formatterOpts = {
            precision: 1,
            unitCaps: true
        };
        let htmlFormatterOpts = {
            numberUnitDelim: "",
            classGetter: {
                _numberClassList: [],
                _unitClassList: [WT_G3x5_TSCFlightPlanLegAltitudeConstraintHTMLElement.UNIT_CLASS],
                getNumberClassList() {
                    return this._numberClassList;
                },
                getUnitClassList() {
                    return this._unitClassList;
                }
            }
        };
        this._altitudeFormatter = new WT_NumberHTMLFormatter(new WT_NumberFormatter(formatterOpts), htmlFormatterOpts);
    }

    _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);

        this._ceilText = this.shadowRoot.querySelector(`#ceiltext`);
        this._floorText = this.shadowRoot.querySelector(`#floortext`);
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
        this._doUpdate();
    }

    _setDesignated(value) {
        this._wrapper.setAttribute("designated", `${value}`);
    }

    _setInvalid(value) {
        this._wrapper.setAttribute("invalid", `${value}`);
    }

    _displayNone() {
        this._ceilText.innerHTML = `_____${this._altitudeFormatter.getFormattedUnitHTML(WT_Unit.FOOT.createNumber(0), this._altitudeUnit)}`;
        this._wrapper.setAttribute("mode", "none");
    }

    _displayCustomAltitude(altitude) {
        this._ceilText.innerHTML = this._altitudeFormatter.getFormattedHTML(altitude, this._altitudeUnit);
        this._wrapper.setAttribute("mode", "custom");
    }

    _displayDefaultAltitude(altitude) {
        this._ceilText.innerHTML = this._altitudeFormatter.getFormattedHTML(altitude, this._altitudeUnit);
        this._wrapper.setAttribute("mode", "default");
    }

    /**
     *
     * @param {WT_AltitudeConstraint} constraint
     */
    _displayPublishedConstraint(constraint) {
        switch (constraint.type) {
            case WT_AltitudeConstraint.Type.AT_OR_ABOVE:
                this._floorText.innerHTML = this._altitudeFormatter.getFormattedHTML(constraint.floor, this._altitudeUnit);
                this._wrapper.setAttribute("mode", "above");
                break;
            case WT_AltitudeConstraint.Type.AT_OR_BELOW:
                this._ceilText.innerHTML = this._altitudeFormatter.getFormattedHTML(constraint.ceiling, this._altitudeUnit);
                this._wrapper.setAttribute("mode", "below");
                break;
            case WT_AltitudeConstraint.Type.AT:
                this._ceilText.innerHTML = this._altitudeFormatter.getFormattedHTML(constraint.ceiling, this._altitudeUnit);
                this._wrapper.setAttribute("mode", "at");
                break;
            case WT_AltitudeConstraint.Type.BETWEEN:
                this._ceilText.innerHTML = this._altitudeFormatter.getFormattedHTML(constraint.ceiling, this._altitudeUnit);
                this._floorText.innerHTML = this._altitudeFormatter.getFormattedHTML(constraint.floor, this._altitudeUnit);
                this._wrapper.setAttribute("mode", "between");
                break;
            default:
                this._displayNone();
        }
    }

    _doUpdate() {
        let isDesignated = false;
        let isInvalid = false;
        if (this._vnavLegRestriction) {
            isDesignated = this._vnavLegRestriction.isDesignated;
            isInvalid = isDesignated && !this._vnavLegRestriction.isValid;
        }

        this._setDesignated(isDesignated);
        this._setInvalid(isInvalid);

        // order of precedence for display:
        // 1) VNAV designated altitude
        // 2) VNAV advisory altitude
        // 3) flight plan custom altitude
        // 4) flight plan advisory altitude
        // 5) published altitude

        if (isDesignated) {
            if (this._legConstraint && this._legConstraint.customAltitude) {
                this._displayCustomAltitude(this._vnavLegRestriction.altitude);
            } else {
                this._displayDefaultAltitude(this._vnavLegRestriction.altitude);
            }
        } else if (this._vnavLegRestriction) {
            this._displayDefaultAltitude(this._vnavLegRestriction.altitude);
        } else if (this._legConstraint && this._legConstraint.customAltitude) {
            this._displayCustomAltitude(this._legConstraint.customAltitude);
        } else if (this._legConstraint && this._legConstraint.advisoryAltitude) {
            this._displayDefaultAltitude(this._legConstraint.advisoryAltitude);
        } else if (this._legConstraint && this._legConstraint.publishedConstraint) {
            this._displayPublishedConstraint(this._legConstraint.publishedConstraint);
        } else {
            this._displayNone();
        }
    }

    /**
     *
     * @param {WT_FlightPlanLegAltitudeConstraint} legConstraint
     * @param {WT_FlightPlanVNAVLegRestriction} vnavLegRestriction
     * @param {WT_Unit} altitudeUnit
     */
    update(legConstraint, vnavLegRestriction, altitudeUnit) {
        this._legConstraint = legConstraint;
        this._vnavLegRestriction = vnavLegRestriction;
        this._altitudeUnit = altitudeUnit;
        if (this._isInit) {
            this._doUpdate();
        }
    }
}
WT_G3x5_TSCFlightPlanLegAltitudeConstraintHTMLElement.UNIT_CLASS = "unit";
WT_G3x5_TSCFlightPlanLegAltitudeConstraintHTMLElement.NAME = "wt-tsc-flightplan-row-altitudeconstraint";
WT_G3x5_TSCFlightPlanLegAltitudeConstraintHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCFlightPlanLegAltitudeConstraintHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            width: 100%;
            height: 100%;
        }

        #wrapper {
            position: absolute;
            left: var(--flightplanaltitudeconstraint-padding-left, 0.2em);
            top: var(--flightplanaltitudeconstraint-padding-top, 0.2em);
            width: calc(100% - var(--flightplanaltitudeconstraint-padding-left, 0.2em) - var(--flightplanaltitudeconstraint-padding-right, 0.2em));
            height: calc(100% - var(--flightplanaltitudeconstraint-padding-top, 0.2em) - var(--flightplanaltitudeconstraint-padding-bottom, 0.2em));
            --flightplanaltitudeconstraint-content-color: white;
        }
        #wrapper[designated="true"] {
            --flightplanaltitudeconstraint-content-color: var(--wt-g3x5-lightblue);
        }
            #flexbox {
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                flex-flow: row nowrap;
                justify-content: center;
                align-items: center;
            }
                #altitude {
                    display: flex;
                    flex-flow: column nowrap;
                    align-items: center;
                    color: var(--flightplanaltitudeconstraint-content-color);
                }
                    .altitudeComponent {
                        display: none;
                    }
                    #wrapper[mode="none"] .none,
                    #wrapper[mode="custom"] .custom,
                    #wrapper[mode="default"] .default,
                    #wrapper[mode="above"] .above,
                    #wrapper[mode="below"] .below,
                    #wrapper[mode="at"] .at,
                    #wrapper[mode="between"] .between {
                        display: block;
                    }
                    #ceilbar {
                        width: 100%;
                        height: 0;
                        border-bottom: solid var(--flightplanaltitudeconstraint-bar-stroke-width, 2px) var(--flightplanaltitudeconstraint-content-color);
                    }
                    #floorbar {
                        width: 100%;
                        height: 0;
                        border-top: solid var(--flightplanaltitudeconstraint-bar-stroke-width, 2px) var(--flightplanaltitudeconstraint-content-color);
                    }
                #editicon {
                    display: none;
                    width: var(--flightplanaltitudeconstraint-editicon-size, 0.8em);
                    height: var(--flightplanaltitudeconstraint-editicon-size, 0.8em);
                    fill: var(--flightplanaltitudeconstraint-content-color);
                }
                #wrapper[mode="custom"] #editicon {
                    display: block;
                }
            #invalidicon {
                display: none;
                position: absolute;
                left: 0%;
                top: 0%;
                width: 100%;
                height: 100%;
                fill: transparent;
                stroke-width: 5;
                stroke: var(--flightplanaltitudeconstraint-content-color);
            }
            #wrapper[invalid="true"] #invalidicon {
                display: block;
            }

        .${WT_G3x5_TSCFlightPlanLegAltitudeConstraintHTMLElement.UNIT_CLASS} {
            font-size: var(--flightplanaltitudeconstraint-unit-font-size, 0.75em)
        }
    </style>
    <div id="wrapper">
        <div id="flexbox">
            <div id="altitude">
                <div id="ceilbar" class="altitudeComponent between at below"></div>
                <div id="ceiltext" class="altitudeComponent between at below default custom none"></div>
                <div id="floortext" class="altitudeComponent between above"></div>
                <div id="floorbar" class="altitudeComponent between at above"></div>
            </div>
            <svg id="editicon" viewBox="0 0 64 64">
                <path d="M48.4,6.28l3.1-3.11S55.39-.71,60.05,4s.78,8.55.78,8.55l-3.11,3.1Z" />
                <path d="M46.84,7.84,4.11,50.56S1,61.44,1.78,62.22s11.66-2.33,11.66-2.33L56.16,17.16Z" />
            </svg>
            <svg id="invalidicon" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M 5 5 L 95 95 M 5 95 L 95 5" vector-effect="non-scaling-stroke" />
            </svg>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCFlightPlanLegAltitudeConstraintHTMLElement.NAME, WT_G3x5_TSCFlightPlanLegAltitudeConstraintHTMLElement);

class WT_G3x5_TSCFlightPlanRowHeaderHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._sequence = null;
        this._titleText = "";
        this._subtitleText = "";
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCFlightPlanRowHeaderHTMLElement.TEMPLATE;
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
     * @type {WT_FlightPlanSequence}
     */
    get sequence() {
        return this._sequence;
    }

    async _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);

        this._button = await WT_CustomElementSelector.select(this.shadowRoot, `#header`, WT_TSCContentButton);

        this._title = this.shadowRoot.querySelector(`#title`);
        this._subtitle = this.shadowRoot.querySelector(`#subtitle`);
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
        this._updateFromSequence();
        this._updateFromTitleText();
        this._updateFromSubtitleText();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _clearAirway() {
        this._wrapper.setAttribute("airway", "false");
    }

    _updateAirwayFromSequence() {
        this._wrapper.setAttribute("airway", `${this._sequence instanceof WT_FlightPlanAirwaySequence}`);
    }

    _updateFromSequence() {
        if (this._sequence) {
            this._updateAirwayFromSequence();
        } else {
            this._clearAirway();
        }
    }

    /**
     *
     * @param {WT_FlightPlanSequence} sequence
     */
    setSequence(sequence) {
        this._sequence = sequence;
        if (this._isInit) {
            this._updateFromSequence();
        }
    }

    _updateFromTitleText() {
        this._title.innerHTML = this._titleText;
    }

    setTitleText(text) {
        if (this._titleText === text) {
            return;
        }

        this._titleText = text;
        if (this._isInit) {
            this._updateFromTitleText();
        }
    }

    _updateFromSubtitleText() {
        this._subtitle.innerHTML = this._subtitleText;
    }

    setSubtitleText(text) {
        if (this._subtitleText === text) {
            return;
        }

        this._subtitleText = text;
        if (this._isInit) {
            this._updateFromSubtitleText();
        }
    }

    addButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._button.addButtonListener(listener);
    }

    removeButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._button.removeButtonListener(listener);
    }

    onUnselected() {
        this._button.highlight = "false";
    }

    onSelected() {
        this._button.highlight = "true";
    }
}
WT_G3x5_TSCFlightPlanRowHeaderHTMLElement.NAME = "wt-tsc-flightplan-row-header";
WT_G3x5_TSCFlightPlanRowHeaderHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCFlightPlanRowHeaderHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            width: 100%;
            height: 100%;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: 100%;
            grid-template-columns: var(--flightplan-table-grid-columns, 2fr 1fr 1fr);
            grid-gap: 0 var(--flightplan-table-grid-column-gap, 0.2em);
        }
            #header {
                grid-column: 1 / span 3;
            }
                #headercontent {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-flow: column nowrap;
                    justify-content: center;
                    align-items: center;
                }
                    #title {
                        color: var(--wt-g3x5-lightblue);
                    }
                    #subtitle {
                        color: white;
                    }
                    #header[highlight=true][primed=false] #title,
                    #header[highlight=true][primed=false] #subtitle {
                        color: black;
                    }
            #airwaylink {
                display: none;
                position: absolute;
                left: calc(var(--flightplan-table-row-airwaylink-left, 0.25em) + var(--flightplan-table-row-airwaylink-stroke-width, 0.2em) / 2);
                top: 50%;
                width: var(--flightplan-table-row-airwaylink-header-size, 0.5em);
                height: var(--flightplan-table-row-airwaylink-header-size, 0.5em);
                transform: translate(-50%, -50%);
            }
                #wrapper[airway="true"] #airwaylink {
                    display: block;
                }
    </style>
    <div id="wrapper">
        <wt-tsc-button-content id="header">
            <div id="headercontent" slot="content">
                <div id="title"></div>
                <div id="subtitle"></div>
            </div>
        </wt-tsc-button-content>
        <svg id="airwaylink" viewBox="0 0 100 100">
            <defs>
                <radialGradient id="airwaylink-header-gradient">
                    <stop offset="70%" stop-color="#bce8eb" stop-opacity="1" />
                    <stop offset="100%" stop-color="#bce8eb" stop-opacity="0" />
                </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#airwaylink-header-gradient)" />
        </svg>
    </div>
`;

customElements.define(WT_G3x5_TSCFlightPlanRowHeaderHTMLElement.NAME, WT_G3x5_TSCFlightPlanRowHeaderHTMLElement);

class WT_G3x5_TSCFlightPlanRowEnrouteFooterHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCFlightPlanRowEnrouteFooterHTMLElement.TEMPLATE;
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get isInitialized() {
        return this._isInit;
    }

    async _defineChildren() {
        [
            this._addButton,
            this._doneButton
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#enroutefooteradd`, WT_TSCLabeledButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#enroutefooterdone`, WT_TSCLabeledButton)
        ]);
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    addAddButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._addButton.addButtonListener(listener);
    }

    removeAddButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._addButton.removeButtonListener(listener);
    }

    addDoneButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._doneButton.addButtonListener(listener);
    }

    removeDoneButtonListener(listener) {
        if (!this._isInit) {
            return;
        }

        this._doneButton.removeButtonListener(listener);
    }

    onUnselected() {
    }

    onSelected() {
    }
}
WT_G3x5_TSCFlightPlanRowEnrouteFooterHTMLElement.NAME = "wt-tsc-flightplan-row-enroutefooter";
WT_G3x5_TSCFlightPlanRowEnrouteFooterHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCFlightPlanRowEnrouteFooterHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            width: 100%;
            height: 100%;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: 100%;
            grid-template-columns: var(--flightplan-table-grid-columns, 2fr 1fr 1fr);
            grid-gap: 0 var(--flightplan-table-grid-column-gap, 0.2em);
        }
            #enroutefooter {
                color: white;
            }
                #enroutefooteradd {
                    grid-column: 1 / span 2;
                }
    </style>
    <div id="wrapper">
        <wt-tsc-button-label id="enroutefooteradd" labeltext="Add Enroute Waypoint"></wt-tsc-button-label>
        <wt-tsc-button-label id="enroutefooterdone" labeltext="Done"></wt-tsc-button-label>
    </div>
`;

customElements.define(WT_G3x5_TSCFlightPlanRowEnrouteFooterHTMLElement.NAME, WT_G3x5_TSCFlightPlanRowEnrouteFooterHTMLElement);

class WT_G3x5_TSCFlightPlanRenderer {
    /**
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     * @param {WT_FlightPlan} flightPlan
     * @param {WT_FlightPlanVNAV} flightPlanVNAV
     */
    constructor(htmlElement, flightPlan, flightPlanVNAV) {
        this._htmlElement = htmlElement;
        this._flightPlan = flightPlan;
        this._flightPlanVNAV = flightPlanVNAV;

        this._origin = new WT_G3x5_TSCFlightPlanOriginRenderer(this, flightPlan.getOrigin());
        this._enroute = new WT_G3x5_TSCFlightPlanEnrouteRenderer(this, flightPlan.getEnroute());
        this._destination = new WT_G3x5_TSCFlightPlanDestinationRenderer(this, flightPlan.getDestination());

        this._departure = null;
        this._arrival = null;
        this._approach = null;

        /**
         * @type {Map<WT_FlightPlanLeg,WT_G3x5_TSCFlightPlanRowHTMLElement>}
         */
        this._legRows = new Map();
        this._isDirectToActive = false;
        /**
         * @type {WT_FlightPlanLeg}
         */
        this._activeLeg = null;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCFlightPlanHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     * @readonly
     * @type {WT_FlightPlan}
     */
    get flightPlan() {
        return this._flightPlan;
    }

    /**
     * @readonly
     * @type {WT_FlightPlanVNAV}
     */
    get flightPlanVNAV() {
        return this._flightPlanVNAV;
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get isDirectToActive() {
        return this._isDirectToActive;
    }

    /**
     * @readonly
     * @type {WT_FlightPlanLeg}
     */
    get activeLeg() {
        return this._activeLeg;
    }

    clearLegRows() {
        this._legRows.clear();
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     * @param {WT_G3x5_TSCFlightPlanRowHTMLElement} row
     */
    registerLegRow(leg, row) {
        this._legRows.set(leg, row);
    }

    /**
     *
     * @param {Boolean} [isDirectToActive]
     * @param {WT_FlightPlanLeg} [activeLeg]
     */
    draw(isDirectToActive, activeLeg) {
        this.clearLegRows();

        if (this.flightPlan.hasDeparture()) {
            this._departure = new WT_G3x5_TSCFlightPlanDepartureRenderer(this, this.flightPlan.getDeparture());
            this._departure.draw();
        } else {
            this._origin.draw();
            this._departure = null;
        }
        this._enroute.draw();
        if (this.flightPlan.hasArrival()) {
            this._arrival = new WT_G3x5_TSCFlightPlanArrivalRenderer(this, this.flightPlan.getArrival());
            this._arrival.draw();
        } else {
            this._destination.draw();
            this._arrival = null;
        }
        if (this.flightPlan.hasApproach()) {
            this._approach = new WT_G3x5_TSCFlightPlanApproachRenderer(this, this.flightPlan.getApproach());
            this._approach.draw();
        } else {
            this._approach = null;
        }

        this._isDirectToActive = isDirectToActive === undefined ? false : isDirectToActive;
        this._activeLeg = activeLeg ? activeLeg : null;
        this._redrawActiveLeg();
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     */
    refreshAltitudeConstraint(leg) {
        let row = this._legRows.get(leg);
        if (row) {
            let modeHTMLElement = row.getActiveModeHTMLElement();
            modeHTMLElement.setVNAVLegRestriction(this.flightPlanVNAV ? this.flightPlanVNAV.legRestrictions.get(leg.index) : null);
            modeHTMLElement.refreshAltitudeConstraint();
        }
    }

    refreshAllAltitudeConstraints() {
        this._legRows.forEach(row => {
            let modeHTMLElement = row.getActiveModeHTMLElement();
            modeHTMLElement.setVNAVLegRestriction(this.flightPlanVNAV ? this.flightPlanVNAV.legRestrictions.get(modeHTMLElement.leg.index) : null);
            modeHTMLElement.refreshAltitudeConstraint();
        }, this);
    }

    updateDataFieldUnits() {
        this._legRows.forEach(row => row.getActiveModeHTMLElement().updateDataFieldUnits());
    }

    refreshAllDataFields() {
        this._legRows.forEach(row => row.getActiveModeHTMLElement().refreshAllDataFields());
    }

    refreshDataField(index) {
        this._legRows.forEach(row => row.getActiveModeHTMLElement().refreshDataField(index));
    }

    _redrawActiveLeg() {
        let showArrow = false;
        if (this._activeLeg) {
            let activeLegRow = this._legRows.get(this._activeLeg);
            if (activeLegRow) {
                let previousLeg;
                if (!this._isDirectToActive) {
                    previousLeg = this._activeLeg.previousLeg();
                }

                let activeLegCenterY = activeLegRow.offsetTop + activeLegRow.offsetHeight / 2;
                let previousLegCenterY = activeLegCenterY;

                if (previousLeg) {
                    let previousLegRow = this._legRows.get(previousLeg);
                    if (previousLegRow) {
                        previousLegCenterY = previousLegRow.offsetTop + previousLegRow.offsetHeight / 2;
                    }
                }

                this.htmlElement.moveActiveArrow(previousLegCenterY, activeLegCenterY);
                showArrow = true;
            }
        }
        this.htmlElement.setActiveArrowVisible(showArrow);
    }

    /**
     *
     * @param {Boolean} isDirectToActive
     * @param {WT_FlightPlanLeg} activeLeg
     */
    _updateActiveLeg(isDirectToActive, activeLeg) {
        if (this._activeLeg === activeLeg && this._isDirectToActive === isDirectToActive) {
            return;
        }

        // check if old or new active leg is part of a collapsed airway sequence
        let oldCollapsed = false;
        let newCollapsed = false;
        if (this._activeLeg && this._activeLeg.parent instanceof WT_FlightPlanAirwaySequence) {
            oldCollapsed = this.htmlElement.getAirwaySequenceCollapse(this._activeLeg.parent);
        }
        if (activeLeg && activeLeg.parent instanceof WT_FlightPlanAirwaySequence) {
            newCollapsed = this.htmlElement.getAirwaySequenceCollapse(activeLeg.parent);
        }

        // figure out if we need to redraw the flight plan in order to uncollapse or recollapse an airway sequence
        let needRedraw = (oldCollapsed !== newCollapsed) || ((oldCollapsed || newCollapsed) && this._activeLeg.parent !== activeLeg.parent);

        this._isDirectToActive = isDirectToActive;
        this._activeLeg = activeLeg;
        if (needRedraw) {
            this.htmlElement.clearRows();
            this.draw(isDirectToActive, activeLeg);
        } else {
            this._redrawActiveLeg();
        }
    }

    _updateChildren(state) {
        if (this._departure) {
            this._departure.update(state);
        } else {
            this._origin.update(state);
        }
        this._enroute.update(state);
        if (this._arrival) {
            this._arrival.update(state);
        } else {
            this._destination.update(state);
        }
        if (this._approach) {
            this._approach.update(state);
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanState} state
     */
    update(state) {
        this._updateActiveLeg(state.isDirectToActive, state.activeLeg);
        this._updateChildren(state);
    }
}

/**
 * @template {WT_FlightPlanElement} T
 */
class WT_G3x5_TSCFlightPlanElementRenderer {
    /**
     * @param {WT_G3x5_TSCFlightPlanRenderer} parent
     * @param {T} element
     */
    constructor(parent, element) {
        this._parent = parent;
        this._element = element;
    }

    /**
     * @readonly
     * @type {T}
     */
    get element() {
        return this._element;
    }

    /**
     *
     */
    draw() {
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanState} state
     */
    update(state) {
    }
}

/**
 * @template {WT_FlightPlanSequence} T
 * @extends WT_G3x5_TSCFlightPlanElementRenderer<T>
 */
class WT_G3x5_TSCFlightPlanSequenceRenderer extends WT_G3x5_TSCFlightPlanElementRenderer {
    /**
     * @param {WT_G3x5_TSCFlightPlanRenderer} parent
     * @param {T} sequence
     */
    constructor(parent, sequence) {
        super(parent, sequence);

        /**
         * @type {WT_G3x5_TSCFlightPlanElementRenderer[]}
         */
        this._children = [];
    }

    _mapElementToRenderer(element) {
        if (element instanceof WT_FlightPlanAirwaySequence) {
            return new WT_G3x5_FlightPlanAirwayRenderer(this._parent, element);
        } else if (element instanceof WT_FlightPlanLeg) {
            return new WT_G3x5_TSCFlightPlanLegRenderer(this._parent, element);
        }
        return null;
    }

    _initChildren() {
        this._children = this.element.elements.map(this._mapElementToRenderer.bind(this));
    }

    _drawHeader() {
        this._header = this._parent.htmlElement.requestRow();
        this._header.setMode(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.HEADER);
        this._headerModeHTMLElement = this._header.getActiveModeHTMLElement();
        this._headerModeHTMLElement.setSequence(this.element);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    _drawChildren(htmlElement) {
        this._children.forEach(child => child.draw(htmlElement));
    }

    draw() {
        this._initChildren();
        this._drawHeader();
        this._drawChildren();
    }

    _updateChildren(state) {
        this._children.forEach(child => child.update(state));
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanState} state
     */
    update(state) {
        this._updateChildren(state);
    }
}

/**
 * @extends WT_G3x5_TSCFlightPlanSequenceRenderer<WT_FlightPlanAirwaySequence>
 */
class WT_G3x5_FlightPlanAirwayRenderer extends WT_G3x5_TSCFlightPlanSequenceRenderer {
    _initChildren() {
        this._shouldCollapse = !(this._parent.activeLeg && this.element === this._parent.activeLeg.parent) && this._parent.htmlElement.getAirwaySequenceCollapse(this.element);
        if (this._shouldCollapse) {
            this._children.push(new WT_G3x5_TSCFlightPlanAirwaySequenceFooterRenderer(this._parent, this.element.legs.last()));
        } else {
            this._children = this.element.elements.map(this._mapElementToRenderer.bind(this));
        }
    }

    _drawHeader() {
        super._drawHeader();

        this._headerModeHTMLElement.setTitleText(`Airway – ${this.element.airway.name}.${this.element.legs.last().fix.ident}${this._shouldCollapse ? " (collapsed)": ""}`);
        this._headerModeHTMLElement.setSubtitleText("");
    }
}

/**
 * @template {WT_FlightPlanSegment} T
 * @extends WT_G3x5_TSCFlightPlanSequenceRenderer<T>
 */
class WT_G3x5_TSCFlightPlanSegmentRenderer extends WT_G3x5_TSCFlightPlanSequenceRenderer {
}

/**
 * @extends WT_G3x5_TSCFlightPlanSegmentRenderer<WT_FlightPlanOrigin>
 */
class WT_G3x5_TSCFlightPlanOriginRenderer extends WT_G3x5_TSCFlightPlanSegmentRenderer {
    _drawHeader() {
        super._drawHeader();

        if (this.element.waypoint) {
            this._headerModeHTMLElement.setTitleText(`Origin – ${this.element.waypoint.ident}`);
            this._headerModeHTMLElement.setSubtitleText("");
        } else {
            this._headerModeHTMLElement.setTitleText("");
            this._headerModeHTMLElement.setSubtitleText("Add Origin");
        }
    }
}

/**
 * @extends WT_G3x5_TSCFlightPlanSegmentRenderer<WT_FlightPlanDestination>
 */
class WT_G3x5_TSCFlightPlanDestinationRenderer extends WT_G3x5_TSCFlightPlanSegmentRenderer {
    _drawHeader() {
        super._drawHeader();

        if (this.element.waypoint) {
            this._headerModeHTMLElement.setTitleText(`Destination – ${this.element.waypoint.ident}`);
            this._headerModeHTMLElement.setSubtitleText("");
        } else {
            this._headerModeHTMLElement.setTitleText("");
            this._headerModeHTMLElement.setSubtitleText("Add Destination");
        }
    }
}

/**
 * @extends WT_G3x5_TSCFlightPlanSegmentRenderer<WT_FlightPlanDeparture>
 */
class WT_G3x5_TSCFlightPlanDepartureRenderer extends WT_G3x5_TSCFlightPlanSegmentRenderer {
    _initChildren() {
        super._initChildren();

        if (!this.element.procedure.runwayTransitions.getByIndex(this.element.runwayTransitionIndex)) {
            // if the departure does not have a runway selected, add the origin as the first "leg"
            this._children.unshift(new WT_G3x5_TSCFlightPlanLegRenderer(this._parent, this.element.flightPlan.getOrigin().leg()));
        }
    }

    _drawHeader() {
        super._drawHeader();

        let departure = this.element.procedure;
        let rwyTransition = departure.runwayTransitions.getByIndex(this.element.runwayTransitionIndex);
        let enrouteTransition = departure.enrouteTransitions.getByIndex(this.element.enrouteTransitionIndex);
        let prefix = `${rwyTransition ? `RW${rwyTransition.runway.designationFull}` : "ALL"}.`;
        let suffix = (enrouteTransition && this.element.legs.length > 0) ? `.${this.element.legs.last().fix.ident}` : "";
        this._headerModeHTMLElement.setTitleText(`Departure –<br>${departure.airport.ident}–${prefix}${departure.name}${suffix}`);
        this._headerModeHTMLElement.setSubtitleText("");
    }
}

/**
 * @extends WT_G3x5_TSCFlightPlanSegmentRenderer<WT_FlightPlanEnroute>
 */
class WT_G3x5_TSCFlightPlanEnrouteRenderer extends WT_G3x5_TSCFlightPlanSegmentRenderer {
    /**
     *
     * @param {WT_G3x5_TSCFlightPlanHTMLElement} htmlElement
     */
    _drawHeader() {
        if (this.element.length > 0) {
            super._drawHeader();
            this._headerModeHTMLElement.setTitleText("Enroute");
            this._headerModeHTMLElement.setSubtitleText("");
        }
    }

    _drawFooter() {
        this._footer = this._parent.htmlElement.requestRow();
        this._footer.setMode(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.ENROUTE_FOOTER);
    }

    draw() {
        super.draw();

        this._drawFooter();
    }
}

/**
 * @extends WT_G3x5_TSCFlightPlanSegmentRenderer<WT_FlightPlanArrival>
 */
class WT_G3x5_TSCFlightPlanArrivalRenderer extends WT_G3x5_TSCFlightPlanSegmentRenderer {
    _initChildren() {
        super._initChildren();

        // we need to manually add the destination "leg" to the end of the arrival since the sim doesn't give it to us automatically
        this._children.push(new WT_G3x5_TSCFlightPlanLegRenderer(this._parent, this.element.flightPlan.getDestination().leg()));
    }

    _drawHeader() {
        super._drawHeader();

        let arrival = this.element.procedure;
        let enrouteTransition = arrival.enrouteTransitions.getByIndex(this.element.enrouteTransitionIndex);
        let rwyTransition = arrival.runwayTransitions.getByIndex(this.element.runwayTransitionIndex);
        let prefix = (enrouteTransition && this.element.legs.length > 0) ? `${this.element.legs.first().fix.ident}.` : "";
        let suffix = `.${rwyTransition ? `RW${rwyTransition.runway.designationFull}` : "ALL"}`;
        this._headerModeHTMLElement.setTitleText(`Arrival –<br>${arrival.airport.ident}–${prefix}${arrival.name}${suffix}`);
        this._headerModeHTMLElement.setSubtitleText("");
    }
}

/**
 * @extends WT_G3x5_TSCFlightPlanSegmentRenderer<WT_FlightPlanApproach>
 */
class WT_G3x5_TSCFlightPlanApproachRenderer extends WT_G3x5_TSCFlightPlanSegmentRenderer {
    _drawHeader() {
        super._drawHeader();

        let approach = this.element.procedure;
        this._headerModeHTMLElement.setTitleText(`Approach –<br>${approach.airport.ident}–${approach.name}`);
        this._headerModeHTMLElement.setSubtitleText("");
    }
}

/**
 * @extends WT_G3x5_TSCFlightPlanElementRenderer<WT_FlightPlanLeg>
 */
class WT_G3x5_TSCFlightPlanLegRenderer extends WT_G3x5_TSCFlightPlanElementRenderer {
    draw() {
        this._row = this._parent.htmlElement.requestRow();
        this._row.setMode(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG);

        this._modeHTMLElement = this._row.getActiveModeHTMLElement();
        this._modeHTMLElement.setLeg(this.element);
        this._modeHTMLElement.setVNAVLegRestriction(this._parent.flightPlanVNAV ? this._parent.flightPlanVNAV.legRestrictions.get(this.element.index) : null);
        this._modeHTMLElement.updateDataFieldUnits();

        this._parent.registerLegRow(this.element, this._row);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanState} state
     */
    _updateModeHTMLElement(state) {
        this._modeHTMLElement.update(state.airplaneHeadingTrue);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanState} state
     */
    _updateActive(state) {
        this._modeHTMLElement.setActive(state.activeLeg === this.element);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanState} state
     */
    update(state) {
        this._updateModeHTMLElement(state);
        this._updateActive(state);
    }
}

class WT_G3x5_TSCFlightPlanAirwaySequenceFooterRenderer extends WT_G3x5_TSCFlightPlanLegRenderer {
    draw() {
        this._row = this._parent.htmlElement.requestRow();
        this._row.setMode(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.AIRWAY_FOOTER);

        this._modeHTMLElement = this._row.getActiveModeHTMLElement();
        this._modeHTMLElement.setLeg(this.element);
        this._modeHTMLElement.setVNAVLegRestriction(this._parent.flightPlanVNAV ? this._parent.flightPlanVNAV.legRestrictions.get(this.element.index) : null);
        this._modeHTMLElement.updateDataFieldUnits();

        this._parent.registerLegRow(this.element, this._row);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanState} state
     */
    update(state) {
        this._updateModeHTMLElement(state);
    }
}

class WT_G3x5_TSCActivateLegConfirmation extends WT_G3x5_TSCConfirmationPopUp {
    _createHTMLElement() {
        return new WT_G3x5_TSCActivateLegConfirmationHTMLElement();
    }

    onEnter() {
        super.onEnter();

        this.htmlElement.setLeg(this.context.leg);
    }
}

class WT_G3x5_TSCActivateLegConfirmationHTMLElement extends WT_G3x5_TSCConfirmationPopUpHTMLElement {
    constructor() {
        super();

        /**
         * @type {WT_FlightPlanLeg}
         */
        this._leg = null;
    }

    _getTemplate() {
        return WT_G3x5_TSCActivateLegConfirmationHTMLElement.TEMPLATE;
    }

    _getOKButtonQuery() {
        return "#ok";
    }

    _getCancelButtonQuery() {
        return "#cancel";
    }

    async _defineChildren() {
        await super._defineChildren();

        this._fromText = this.shadowRoot.querySelector(`#from`);
        this._toText = this.shadowRoot.querySelector(`#to`);
    }

    _onInit() {
        this._updateFromLeg();
    }

    _updateFromLeg() {
        if (this._leg) {
            let previousLeg = this._leg.previousLeg();
            this._fromText.textContent = previousLeg ? previousLeg.fix.ident : "";
            this._toText.textContent = this._leg.fix.ident;
        } else {
            this._fromText.textContent = "";
            this._toText.textContent = "";
        }
    }

    setLeg(leg) {
        if (this._leg === leg) {
            return;
        }

        this._leg = leg;
        if (this._isInit) {
            this._updateFromLeg();
        }
    }
}
WT_G3x5_TSCActivateLegConfirmationHTMLElement.NAME = "wt-tsc-activatelegconfirm";
WT_G3x5_TSCActivateLegConfirmationHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCActivateLegConfirmationHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            border-radius: 5px;
            background: linear-gradient(#1f3445, black 25px);
            border: 3px solid var(--wt-g3x5-bordergray);
        }

        #wrapper {
            position: absolute;
            left: var(--activatelegconfirm-padding-left, 1em);
            top: var(--activatelegconfirm-padding-top, 1em);
            width: calc(100% - var(--activatelegconfirm-padding-left, 1em) - var(--activatelegconfirm-padding-right, 1em));
            height: calc(100% - var(--activatelegconfirm-padding-top, 1em) - var(--activatelegconfirm-padding-bottom, 1em));
        }
            #title {
                position: absolute;
                left: 50%;
                top: 0%;
                transform: translateX(-50%);
            }
            #info {
                position: absolute;
                left: 0%;
                top: 40%;
                width: 100%;
                transform: translateY(-50%);
                display: grid;
                grid-template-rows: auto;
                grid-template-columns: 1fr var(--activatelegconfirm-arrow-size, 1em) 1fr;
                grid-gap: 0 0.5em;
                align-items: center;
            }
                #from {
                    text-align: right;
                }
                #arrow {
                    width: var(--activatelegconfirm-arrow-size, 1em);
                    height: var(--activatelegconfirm-arrow-size, 1em);
                    fill: transparent;
                    stroke-width: 10;
                    stroke: var(--wt-g3x5-purple);
                }
                #to {
                    text-align: left;
                }
            #buttons {
                position: absolute;
                left: 0%;
                top: 60%;
                width: 100%;
                height: 40%;
                display: flex;
                flex-flow: row nowrap;
                justify-content: space-between;
                align-items: center;
            }
                .button {
                    width: var(--activatelegconfirm-button-width, 40%);
                    height: var(--activatelegconfirm-button-height, 3em);
                    font-size: var(--activatelegconfirm-button-font-size, 0.85em);
                }
    </style>
    <div id="wrapper">
        <div id="title">Activate Leg?</div>
        <div id="info">
            <div id="from"></div>
            <svg id="arrow" viewbox="-50 -50 100 100">
                <path d="M -40 0 L 40 0 M 20 20 L 40 0 L 20 -20" />
            </svg>
            <div id="to"></div>
        </div>
        <div id="buttons">
            <wt-tsc-button-label id="ok" class="button" labeltext="OK"></wt-tsc-button-label>
            <wt-tsc-button-label id="cancel" class="button" labeltext="Cancel"></wt-tsc-button-label>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCActivateLegConfirmationHTMLElement.NAME, WT_G3x5_TSCActivateLegConfirmationHTMLElement);