class Base_Input_Layer extends Input_Layer {
    /**
     * @param {NavSystem} navSystem 
     * @param {WT_Nav_Frequencies_Model} navFrequenciesModel 
     * @param {WT_Com_Frequencies_Model} comFrequenciesModel 
     * @param {WT_Show_Direct_To_Handler} showDirectToHandler 
     * @param {WT_Barometer} barometer
     * @param {WT_Menu_Push_Handler} menuPushHandler 
     */
    constructor(navSystem, navFrequenciesModel, comFrequenciesModel, showDirectToHandler, barometer, menuPushHandler) {
        super();
        this.navSystem = navSystem;
        this.navFrequenciesModel = navFrequenciesModel;
        this.comFrequenciesModel = comFrequenciesModel;
        this.showDirectToHandler = showDirectToHandler;
        this.barometer = barometer;
        this.menuPushHandler = menuPushHandler;
    }

    onBaroIncrement(inputStack) { this.barometer.incrementBaro(); }
    onBaroDecrement(inputStack) { this.barometer.decrementBaro(); }

    onMenuPush(inputStack) { if (this.menuPushHandler) { this.menuPushHandler.push(); } }
    onProceduresPush(inputStack) { this.navSystem.showProcedures(); }
    onFlightPlan(inputStack) { this.navSystem.showFlightPlan(); }
    onDirectTo(inputStack) { this.showDirectToHandler.show(); }

    onCLRLong(inputStack) { this.navSystem.resetPage(); }

    onNavPush(inputStack) { this.navFrequenciesModel.toggleActive(); }
    onNavSwitch(inputStack) { this.navFrequenciesModel.transferActive(); }
    onNavLargeInc(inputStack) { this.navFrequenciesModel.incrementWhole(); }
    onNavLargeDec(inputStack) { this.navFrequenciesModel.decrementWhole(); }
    onNavSmallInc(inputStack) { this.navFrequenciesModel.incrementFractional(); }
    onNavSmallDec(inputStack) { this.navFrequenciesModel.decrementFractional(); }
    onVolume1Inc(inputStack) { this.navFrequenciesModel.increaseVolume(); }
    onVolume1Dec(inputStack) { this.navFrequenciesModel.decreaseVolume(); }

    onComPush(inputStack) { this.comFrequenciesModel.toggleActive(); }
    onComSwitch(inputStack) { this.comFrequenciesModel.transferActive(); }
    onComSwitchLong(inputStack) { this.comFrequenciesModel.setEmergencyFrequency(); }
    onComLargeInc(inputStack) { this.comFrequenciesModel.incrementWhole(); }
    onComLargeDec(inputStack) { this.comFrequenciesModel.decrementWhole(); }
    onComSmallInc(inputStack) { this.comFrequenciesModel.incrementFractional(); }
    onComSmallDec(inputStack) { this.comFrequenciesModel.decrementFractional(); }
    onVolume2Inc(inputStack) { this.comFrequenciesModel.increaseVolume(); }
    onVolume2Dec(inputStack) { this.comFrequenciesModel.decreaseVolume(); }
}