class WT_Normal_Flight_Plan_Controller_Factory {
    /**
     * @param {FlightPlanManager} flightPlanManager 
     */
    constructor(flightPlanManager) {
        this.flightPlanManager = flightPlanManager;
    }
    create() {
        return new WT_Normal_Flight_Plan_Controller(this.flightPlanManager);
    }
}

class WT_Normal_Flight_Plan_Controller extends WT_Flight_Plan_Mode {
    /**
     * @param {FlightPlanManager} flightPlanManager 
     */
    constructor(flightPlanManager) {
        super();
        this.flightPlanManager = flightPlanManager;
    }
    async activate() {
        const fpm = this.flightPlanManager;
        fpm.createNewFlightPlan(() => {
            fpm.setCurrentFlightPlanIndex(1, () => fpm.setCurrentFlightPlanIndex(0));
        });
    }
    deactivate() {

    }
    update(dt) {

    }
    getLegInformation() {
        let from = null;
        let to = null;
        let symbol = null;
        let distance = null;
        let bearing = null;
        const flightPlanActive = SimVar.GetSimVarValue("GPS IS ACTIVE FLIGHT PLAN", "boolean");
        if (flightPlanActive) {
            to = SimVar.GetSimVarValue("GPS WP NEXT ID", "string");
            if (!to)
                to = "---";
            //images: Pages/VCockpit/Instruments/NavSystems/Shared/Images/GPS/
            if (this.flightPlanManager.getIsDirectTo()) {
                symbol = "direct_to.bmp";
            } else {
                from = SimVar.GetSimVarValue("GPS WP PREV ID", "string");
                if (!from)
                    from = "---";
                symbol = "course_to.bmp";
            }

            distance = SimVar.GetSimVarValue("GPS WP DISTANCE", "kilometers");
            bearing = Math.round(SimVar.GetSimVarValue("GPS WP BEARING", "degree"));
        }

        return new WT_Flight_Plan_Leg_Information(WT_Flight_Plan_Mode.MODE_NORMAL, from, to, symbol, distance, bearing);
    }
}