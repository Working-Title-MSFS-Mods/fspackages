class WT_Show_Waypoint_Info_Handler {
    /**
     * @param {WT_Page_Controller} pageController 
     */
    constructor(pageController) {
        this.pageController = pageController;
    }
    /**
     * @param {WayPoint} waypoint 
     */
    show(waypoint) {
        const type = waypoint.icao[0];
        switch (type) {
            case "A": {
                this.pageController.goTo("WPT", "Airport Information", { waypoint: waypoint });
                break;
            }
            case "W": {
                this.pageController.goTo("WPT", "Intersection Information", { waypoint: waypoint });
                break;
            }
            case "V": {
                break;
            }
            case "N": {
                break;
            }
        }
    }
}