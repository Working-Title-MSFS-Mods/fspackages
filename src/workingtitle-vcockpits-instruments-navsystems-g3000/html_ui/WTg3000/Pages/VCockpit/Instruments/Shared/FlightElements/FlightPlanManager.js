class WT_FlightPlanManager {
    constructor(icaoWaypointFactory) {
        this._active = new WT_FlightPlan(icaoWaypointFactory);
        this._standby = new WT_FlightPlan(icaoWaypointFactory);
        this._directTo = null;

        this._interface = new WT_FlightPlanAsoboInterface(icaoWaypointFactory);

        this._directTo = new WT_DirectTo();
    }

    /**
     * @readonly
     * @property {WT_FlightPlan} activePlan
     * @type {WT_FlightPlan}
     */
    get activePlan() {
        return this._active;
    }

    /**
     * @readonly
     * @property {WT_FlightPlan} standbyPlan
     * @type {WT_FlightPlan}
     */
    get standbyPlan() {
        return this._standby;
    }

    /**
     * @readonly
     * @property {WT_DirectTo} directTo
     * @type {WT_DirectTo}
     */
    get directTo() {
        return this._directTo;
    }

    async copyToActive(flightPlan) {
        this._active.copyFrom(flightPlan);
        await this.syncActiveToGame();
    }

    async activateStandby() {
        await this.copyToActive(this._standby);
    }

    async syncActiveToGame() {
        await this._interface.syncToGame(this._active);
    }

    async syncActiveFromGame() {
        await this._interface.syncFromGame(this._active, this._directTo);
    }

    async getActiveLeg() {
        let index = await this._interface.getGameActiveWaypointIndex();
        if (index <= 0) {
            return null;
        }

        let ident = this._interface.getGameActiveWaypointIdent();
        let isApproachActive = this._interface.isApproachActive();

        let legs;
        if (isApproachActive) {
            legs = this._active.getApproach().legs();
        } else {
            legs = this._active.legs();
        }

        let leg = legs[index];
        if (!leg || (ident !== "USR" && leg.waypoint.ident !== ident)) {
            let legsBefore = legs.slice(0, index).reverse();
            let legsAfter = legs.slice(index + 1, legs.length);
            let before = legsBefore.findIndex(leg => leg.waypoint.ident === ident);
            let after = legsAfter.findIndex(leg => leg.waypoint.ident === ident);
            if (before < 0) {
                if (after >= 0) {
                    index += after + 1;
                } else {
                    index = -1
                }
            } else {
                if (after >= 0 && after <= before) {
                    index += after + 1;
                } else {
                    index -= before + 1;
                }
            }
            if (index >= 0) {
                return legs[index];
            }
        }
        return leg ? leg: null;
    }
}