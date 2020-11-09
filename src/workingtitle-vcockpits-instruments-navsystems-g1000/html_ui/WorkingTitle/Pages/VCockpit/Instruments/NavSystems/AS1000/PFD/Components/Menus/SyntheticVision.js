class WT_PFD_Synthetic_Vision_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_PFD_Menu_Handler} menus 
     * @param {WT_Synthetic_Vision} syntheticVision
     * @param {WT_PFD_Alert_Key} alertsKey
     */
    constructor(menus, syntheticVision, alertsKey) {
        super(false);
        this.syntheticVision = syntheticVision;
        this.pathway = new WT_Soft_Key("PATHWAY");
        this.synVis = new WT_Soft_Key("SYN TERR", () => syntheticVision.toggle());
        this.horizonHeadings = new WT_Soft_Key("HRZN HDG", () => syntheticVision.toggleHorizonHeadings());
        this.airportSigns = new WT_Soft_Key("APTSIGNS", () => syntheticVision.toggleAirportSigns());
        this.addSoftKey(1, this.pathway);
        this.addSoftKey(2, this.synVis);
        this.addSoftKey(3, this.horizonHeadings);
        this.addSoftKey(4, this.airportSigns);
        this.addSoftKey(11, menus.backKey);
        this.addSoftKey(12, alertsKey);

        this.subscriptions = new Subscriptions();
    }
    activate() {
        this.subscriptions.add(this.syntheticVision.enabled.subscribe(enabled => {
            this.synVis.selected = enabled;
            this.pathway.disabled = true;//!enabled;
            this.horizonHeadings.disabled = !enabled;
            this.airportSigns.disabled = !enabled;
        }));
        this.subscriptions.add(this.syntheticVision.airportSigns.subscribe(enabled => {
            this.airportSigns.selected = enabled;
        }));
        this.subscriptions.add(this.syntheticVision.horizonHeadings.subscribe(enabled => {
            this.horizonHeadings.selected = enabled;
        }));
    }
    deactivate() {
        this.subscriptions.unsubscribe();
    }
}