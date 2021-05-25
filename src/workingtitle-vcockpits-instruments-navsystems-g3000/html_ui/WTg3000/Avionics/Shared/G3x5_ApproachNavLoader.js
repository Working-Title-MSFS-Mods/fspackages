class WT_G3x5_ApproachNavLoader {
    /**
     * @param {WT_PlayerAirplane} airplane
     */
    constructor(airplane) {
        this._airplane = airplane;
        this._fpm = airplane.fms.flightPlanManager;
        this._nav1 = airplane.navCom.getNav(1);
        this._nav2 = airplane.navCom.getNav(2);

        /**
         * @type {WT_Approach}
         */
        this._currentApproach = null;
        this._isApproachActive = false;
        this._isApproachOnFinal = false;

        this._tempNM = WT_Unit.NMILE.createNumber(0);
    }

    /**
     *
     * @param {WT_Approach} appr1
     * @param {WT_Approach} appr2
     * @returns {Boolean}
     */
    _areApproachesEqual(appr1, appr2) {
        return (!appr1 && !appr2) || (appr1 && appr1.equals(appr2));
    }

    /**
     *
     * @param {WT_AirplaneNavSlot} nav
     * @param {WT_Frequency} frequency
     * @param {Boolean} toActive
     */
    _loadFrequency(nav, frequency, toActive) {
        nav.setStandbyFrequency(frequency);
        if (toActive) {
            nav.swapFrequency();
        }
    }

    _updateApproachLoaded() {
        let approach;
        if (this._fpm.activePlan.hasApproach()) {
            approach = this._fpm.activePlan.getApproach().procedure;
        } else {
            approach = null;
        }

        if (this._areApproachesEqual(this._currentApproach, approach)) {
            return false;
        }

        this._currentApproach = approach;
        this._isApproachActive = false;
        this._isApproachOnFinal = false;

        if (this._currentApproach === null) {
            return false;
        }

        return this._currentApproach.frequency !== undefined;
    }

    _updateApproachActivated() {
        if (!this._currentApproach) {
            this._isApproachActive = false;
            return false;
        }

        let activeLeg = this._fpm.getActiveLeg(true);
        let isActive = activeLeg ? (activeLeg.segment === WT_FlightPlan.Segment.APPROACH) : false;
        if (isActive !== this._isApproachActive) {
            this._isApproachActive = isActive;
            return this._isApproachActive;
        } else {
            return false;
        }
    }

    /**
     *
     * @param {WT_FlightPlanLeg} activeLeg
     */
    _checkApproachOnFinal(activeLeg) {
        let result = false;
        let fafIndex = this._fpm.activePlan.legs.length - 2;
        if (activeLeg.index > fafIndex) {
            result = true;
        } else if (activeLeg.index === fafIndex && this._fpm.distanceToActiveLegFix(true, this._tempNM).compare(WT_G3x5_ApproachNavLoader.NAV_SWITCH_MAX_FAF_DISTANCE) <= 0) {
            if (activeLeg.firstStep().endpoint.equals(activeLeg.endpoint)) {
                result = true;
            } else {
                // if the faf leg has multiple steps, only return true if the currently "active" step is the last one
                // (i.e. the step to the actual faf waypoint); otherwise airplane may not be on the final approach course
                let gpsLat = SimVar.GetSimVarValue("GPS WP NEXT LAT", "degrees");
                let gpsLong = SimVar.GetSimVarValue("GPS WP NEXT LON", "degrees");
                result = activeLeg.fix.location.distance(gpsLat, gpsLong) <= WT_FlightPlanManager.ACTIVE_STEP_FIX_TOLERANCE;
            }
        }
        return result;
    }

    _switchAutopilotToNav() {
        let frequency = this._currentApproach.frequency;
        if (!frequency || this._airplane.autopilot.navigationSource() !== WT_AirplaneAutopilot.NavSource.FMS) {
            return;
        }

        if (frequency.equals(this._nav1.activeFrequency())) {
            this._airplane.autopilot.setNavigationSource(WT_AirplaneAutopilot.NavSource.NAV1);
        } else if (frequency.equals(this._nav2.activeFrequency())) {
            this._airplane.autopilot.setNavigationSource(WT_AirplaneAutopilot.NavSource.NAV2);
        }
    }

    _updateApproachOnFinal() {
        if (!this._isApproachActive) {
            this._isApproachOnFinal = false;
            return;
        }

        let activeLeg = this._fpm.getActiveLeg(true);
        let isOnFinal = this._checkApproachOnFinal(activeLeg);

        if (isOnFinal !== this._isApproachOnFinal) {
            this._isApproachOnFinal = isOnFinal;
            if (this._isApproachOnFinal && this._currentApproach.frequency) {
                this._switchAutopilotToNav();
            }
        }
    }

    update() {
        let isNewApproachLoaded = this._updateApproachLoaded();
        let isNewApproachActivated = this._updateApproachActivated();

        if (isNewApproachActivated) {
            this._onApproachActivated();
        } else if (isNewApproachLoaded) {
            this._onApproachLoaded();
        }

        this._updateApproachOnFinal();
    }

    _onApproachLoaded() {
    }

    _onApproachActivated() {
    }
}
WT_G3x5_ApproachNavLoader.NAV_SWITCH_MAX_FAF_DISTANCE = WT_Unit.NMILE.createNumber(15);