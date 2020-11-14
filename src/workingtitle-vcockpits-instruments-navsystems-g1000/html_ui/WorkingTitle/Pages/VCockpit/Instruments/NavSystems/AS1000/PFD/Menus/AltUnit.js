class WT_PFD_Alt_Unit_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_PFD_Menu_Handler} menus 
     * @param {WT_Barometric_Pressure} barometricPressure
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
        this.altUnitUnsubscribe = this.barometricPressure.altUnit.subscribe(unit => {
            this.in.selected = unit == WT_Barometric_Pressure.IN_MG;
            this.hpa.selected = unit == WT_Barometric_Pressure.HPA;
        });
    }
    deactivate() {
        if (this.altUnitUnsubscribe)
            this.altUnitUnsubscribe = this.altUnitUnsubscribe();
    }
}