class WT_PFD_Alt_Unit_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_PFD_Menu_Handler} menus 
     * @param {WT_Barometer} barometricPressure
     */
    constructor(menus, barometricPressure) {
        super(false);
        this.barometricPressure = barometricPressure;
        this.addSoftKey(6, new WT_Soft_Key("METERS"));
        this.in = this.addSoftKey(8, new WT_Soft_Key("IN", () => barometricPressure.setInMG()));
        this.hpa = this.addSoftKey(9, new WT_Soft_Key("HPA", () => barometricPressure.setHpa()));
        this.addSoftKey(11, menus.backKey);
        this.addSoftKey(12, menus.alertsKey);
    }
    activate() {
        this.altUnitSubscription = this.barometricPressure.altUnit.subscribe(unit => {
            this.in.selected = unit == WT_Barometer.IN_MG;
            this.hpa.selected = unit == WT_Barometer.HPA;
        });
    }
    deactivate() {
        if (this.altUnitSubscription)
            this.altUnitSubscription = this.altUnitSubscription.unsubscribe();
    }
}