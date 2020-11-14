class WT_Show_Waypoint_Info_Handler {
    /**
     * @param {WT_Page_Controller} pageController 
     */
    constructor(pageController) {
        this.pageController = pageController;
    }
    show(icao) {
        const type = icao[0];
        switch (type) {
            case "A": {
                this.pageController.goTo("WPT", "Airport Information", icao);
                break;
            }
            case "W": {
                this.pageController.goTo("WPT", "Intersection Information", icao);
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