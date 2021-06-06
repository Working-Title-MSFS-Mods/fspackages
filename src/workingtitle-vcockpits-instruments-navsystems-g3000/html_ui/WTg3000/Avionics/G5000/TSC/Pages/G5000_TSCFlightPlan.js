class WT_G5000_TSCFlightPlan extends WT_G3x5_TSCFlightPlan {
    _initPopUps() {
        super._initPopUps();

        this._flightPlanKeyboardPopUp = new WT_G3x5_TSCElementContainer("Flight Plan Keyboard", "FlightPlanKeyboard", new WT_G5000_TSCFlightPlanKeyboard());
        this._flightPlanKeyboardPopUp.setGPS(this.instrument);
    }

    /**
     *
     * @param {WT_FlightPlan} flightPlan
     * @param {WT_Waypoint} referenceWaypoint
     * @param {WT_FlightPlan.Segment} segment
     * @param {Number} index
     * @param {WT_G5000_TSCFlightPlanKeyboardCommand} command
     * @returns {Promise<Boolean>}
     */
    async _flightPlanKeyboardCallback(flightPlan, referenceWaypoint, segment, index, command) {
        if (flightPlan !== this._displayedFlightPlan) {
            return false;
        }

        let previousLeg = this._findPreviousLegFromSegmentIndex(this._displayedFlightPlan, segment, index);
        let previousWaypoint = previousLeg ? previousLeg.fix : null;
        if ((!referenceWaypoint && previousWaypoint) || (referenceWaypoint && !referenceWaypoint.equals(previousWaypoint))) {
            return false;
        }

        let success;
        if (command.type === WT_G5000_TSCFlightPlanKeyboard.CommandType.INSERT_WAYPOINT) {
            success = await this._insertWaypointToIndex(segment, command.waypoint, index);
            referenceWaypoint = command.waypoint;
        } else {
            success = await this._insertAirwayToIndex(segment, command.airway, command.sequence, index);
            referenceWaypoint = command.sequence[command.sequence.length - 1];
        }

        if (success) {
            this._flightPlanKeyboardPopUp.element.context.callback = this._flightPlanKeyboardCallback.bind(this, flightPlan, referenceWaypoint, segment, index + 1);
            return true;
        } else {
            return false;
        }
    }

    _openFlightPlanKeyboard(flightPlan, segment, index) {
        let previousLeg = this._findPreviousLegFromSegmentIndex(this._displayedFlightPlan, segment, index);
        this._flightPlanKeyboardPopUp.element.setContext({
            homePageGroup: this.homePageGroup,
            homePageName: this.homePageName,
            airwaySelectionPopUp: this._airwaySelectionPopUp,
            initialWaypoint: previousLeg ? previousLeg.fix : null,
            callback: this._flightPlanKeyboardCallback.bind(this, flightPlan, previousLeg ? previousLeg.fix : null, segment, index)
        });
        this.instrument.switchToPopUpPage(this._flightPlanKeyboardPopUp);
    }

    _onEnrouteAddButtonPressed(event) {
        this._openFlightPlanKeyboard(this._displayedFlightPlan, WT_FlightPlan.Segment.ENROUTE, this._displayedFlightPlan.getSegment(WT_FlightPlan.Segment.ENROUTE).elements.length);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onInsertBeforeButtonPressed(event) {
        let index = event.leg.flightPlan.getSegment(event.leg.segment).elements.indexOf(event.leg);
        this._openFlightPlanKeyboard(this._displayedFlightPlan, event.leg.segment, index);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlanButtonEvent} event
     */
    _onInsertAfterButtonPressed(event) {
        let index = event.leg.flightPlan.getSegment(event.leg.segment).elements.indexOf(event.leg);
        this._openFlightPlanKeyboard(this._displayedFlightPlan, event.leg.segment, index + 1);
    }
}