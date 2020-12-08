class WT_PFD_Alert_Key extends WT_Soft_Key {
    /**
     * @param {WT_Annunciations_Model} annunciationsModel 
     * @param {WT_PFD_Mini_Page_Controller} miniPageController 
     */
    constructor(annunciationsModel, miniPageController) {
        super("ALERTS", null);
        this.miniPageController = miniPageController;

        this.setOnClick(this.click.bind(this));
        this.pressAcknowledgesAnnunciations = false;

        this.setAnnunciationsModel(annunciationsModel);
    }
    /**
    * @param {WT_Annunciations_Model} annuncationsModel 
    */
    setAnnunciationsModel(model) {
        this.annunciationsModel = model;
        model.alertLevel.subscribe(this.updateAlertLevel.bind(this));
        model.hasUnacknowledgedAnnunciations.subscribe(has => {
            this.setAttribute("state", has ? "flashing" : "");
        });
    }
    click() {
        if (this.pressAcknowledgesAnnunciations) {
            this.annunciationsModel.acknowledgeAll();
        } else {
            this.miniPageController.showAlerts();
        }
    }
    updateAlertLevel(level) {
        this.pressAcknowledgesAnnunciations = true;
        switch (level) {
            case 0:
                this.pressAcknowledgesAnnunciations = false;
                this.textContent = "ALERTS";
                this.setAttribute("level", "alert");
                break;
            case 1:
                this.textContent = "ADVISORY";
                this.setAttribute("level", "advisory");
                break;
            case 2:
                this.textContent = "CAUTION";
                this.setAttribute("level", "caution");
                break;
            case 3:
                this.textContent = "WARNING";
                this.setAttribute("level", "warning");
                break;
        }
    }
}
customElements.define("g1000-soft-key-alert", WT_PFD_Alert_Key);