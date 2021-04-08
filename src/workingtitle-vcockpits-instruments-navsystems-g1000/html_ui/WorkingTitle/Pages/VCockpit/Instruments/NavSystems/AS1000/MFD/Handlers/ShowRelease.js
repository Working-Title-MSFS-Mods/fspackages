class WT_Show_Release_Handler {
    /**
     * @param {WT_Page_Controller} pageController 
     */
    constructor(pageController) {
        this.pageController = pageController;
    }
    show(release) {
        const model = new WT_Release_Page_Model(release);
        const view = new WT_Release_Page_View();

        this.pageController.showPage(new WT_Page("RELEASE - New Release", () => model, () => view), true);
    }
}