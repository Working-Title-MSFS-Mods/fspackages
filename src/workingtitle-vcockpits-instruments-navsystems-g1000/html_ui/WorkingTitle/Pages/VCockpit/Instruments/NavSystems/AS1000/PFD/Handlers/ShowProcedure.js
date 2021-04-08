class WT_PFD_Show_Procedure_Handler {
    /**
     * @param {WT_PFD_Mini_Page_Controller} pageController 
     * @param {WT_Waypoint_Input_Model} waypointInputModel 
     * @param {WT_Procedure_Page_Model} procedurePageModel 
     * @param {WT_Approach_Page_View} approachPageView 
     * @param {WT_Arrival_Page_View} arrivalPageView 
     * @param {WT_Departure_Page_View} departurePageView 
     */
    constructor(pageController, waypointInputModel, procedurePageModel, approachPageView, arrivalPageView, departurePageView) {
        this.pageController = pageController;
        this.waypointInputModel = waypointInputModel;
        this.procedurePageModel = procedurePageModel;
        this.approachPageView = approachPageView;
        this.arrivalPageView = arrivalPageView;
        this.departurePageView = departurePageView;
    }
    /**
     * @param {WT_PFD_Procedure_Page_View} view 
     */
    showView(view) {
        this.pageController.appendChild(view);
        view.classList.add("mini-page");
        view.setModel(this.procedurePageModel);
        const subscriptions = new Subscriptions();
        subscriptions.add(view.onExit.subscribe(() => {
            this.pageController.removeChild(view);
            subscriptions.unsubscribe();
        }));
        this.pageController.showPage(view);
    }
    showApproaches(icao = null, procedureIndex = null) {
        const view = new WT_PFD_Procedure_Page_View(this.waypointInputModel, this.approachPageView);
        this.showView(view);
    }
    showDepartures(icao = null, procedureIndex = null) {
        const view = new WT_PFD_Procedure_Page_View(this.waypointInputModel, this.departurePageView);
        this.showView(view);
    }
    showArrivals(icao = null, procedureIndex = null) {
        const view = new WT_PFD_Procedure_Page_View(this.waypointInputModel, this.arrivalPageView);
        this.showView(view);
    }
}