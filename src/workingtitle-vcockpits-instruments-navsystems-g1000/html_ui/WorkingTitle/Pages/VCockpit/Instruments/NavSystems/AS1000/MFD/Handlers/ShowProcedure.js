class WT_Show_Procedure_Handler {
    /**
     * @param {WT_Page_Controller} pageController 
     * @param {FlightPlanManager} flightPlanManager 
     * @param {WT_Procedure_Facility_Repository} procedureFacilityRepository
     */
    constructor(pageController, flightPlanManager, procedureFacilityRepository, viewFactory) {
        this.pageController = pageController;
        this.flightPlanManager = flightPlanManager;
        this.viewFactory = viewFactory;
        this.procedureFacilityRepository = procedureFacilityRepository;
    }
    getView(icao, procedureIndex = null) {
        let model = new WT_Procedure_Page_Model(this.flightPlanManager, this.procedureFacilityRepository);
        if (icao !== null) {
            model.setICAO(icao);
        }
        model.setInitialProcedureIndex(procedureIndex);
        let view = this.pageController.showPage(new WT_Page("PROC - Procedures", () => model, this.viewFactory), true);
        view.onExit.subscribe(() => {
            this.pageController.goTo("MAP", "Map");
        });
        return view;
    }
    showApproaches(icao = null, procedureIndex = null) {
        const view = this.getView(icao, procedureIndex);
        view.showSubPage("APR");
    }
    showDepartures(icao = null, procedureIndex = null) {
        const view = this.getView(icao, procedureIndex);
        view.showSubPage("DP");
    }
    showArrivals(icao = null, procedureIndex = null) {
        const view = this.getView(icao, procedureIndex);
        view.showSubPage("STAR");
    }
}