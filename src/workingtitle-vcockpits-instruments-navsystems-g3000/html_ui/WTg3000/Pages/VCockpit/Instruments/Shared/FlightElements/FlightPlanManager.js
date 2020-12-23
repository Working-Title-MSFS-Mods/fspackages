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
        return this._interface.getActiveLeg(this._active);
    }
}