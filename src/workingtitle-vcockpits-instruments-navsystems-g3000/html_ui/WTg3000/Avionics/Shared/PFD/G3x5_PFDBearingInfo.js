class WT_G3x5_PFDBearingInfoContainer {
    constructor(airplane, unitsController) {
        this._models = this._createModels(airplane, unitsController);
    }

    _createModels(airplane, unitsController) {
        let models = [];
        models[WT_G3x5_PFDBearingInfoContainer.Slot.ONE] = new WT_G3x5_PFDBearingInfoModel(airplane, WT_G3x5_PFDBearingInfoContainer.Slot.ONE, unitsController);
        models[WT_G3x5_PFDBearingInfoContainer.Slot.TWO] = new WT_G3x5_PFDBearingInfoModel(airplane, WT_G3x5_PFDBearingInfoContainer.Slot.TWO, unitsController);
        return models;
    }

    /**
     *
     * @param {WT_G3x5_PFDBearingInfoContainer} slot
     * @returns {WT_G3x5_PFDBearingInfoModel}
     */
    getModel(slot) {
        return this._models[slot];
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_PFDBearingInfoContainer.Slot = {
    ONE: 1,
    TWO: 2
}

class WT_G3x5_PFDBearingInfoModel {
    /**
     *
     * @param {WT_PlayerAirplane} airplane
     * @param {WT_G3x5_PFDBearingInfoContainer.Slot} slot
     * @param {WT_G3x5_UnitsController} unitsController
     */
    constructor(airplane, slot, unitsController) {
        this._airplane = airplane;
        this._slot = slot;

        this._distanceModel = new WT_NumberUnitModelAutoUpdated(WT_Unit.NMILE, {
            updateValue: this._updateDistance.bind(this)
        });
        this._bearingModel = new WT_NumberUnitModelAutoUpdated(new WT_NavAngleUnit(true), {
            updateValue: this._updateBearing.bind(this)
        });

        this._unitsControllerAdapter = new WT_G3x5_UnitsControllerPFDBearingInfoModelAdapter(unitsController, this);

        this._initAdapters();
    }

    _initAdapters() {
        this._adapters = [];
        this._adapters[WT_G3x5_PFDBearingInfoModel.Source.NONE] = new WT_G3x5_PFDBearingInfoModelNoSourceAdapter(this.airplane);
        this._adapters[WT_G3x5_PFDBearingInfoModel.Source.NAV1] = new WT_G3x5_PFDBearingInfoModelNAVAdapter(this.airplane, 1);
        this._adapters[WT_G3x5_PFDBearingInfoModel.Source.NAV2] = new WT_G3x5_PFDBearingInfoModelNAVAdapter(this.airplane, 2);
        this._adapters[WT_G3x5_PFDBearingInfoModel.Source.FMS] = new WT_G3x5_PFDBearingInfoModelFMSAdapter(this.airplane);
        this._adapters[WT_G3x5_PFDBearingInfoModel.Source.ADF] = new WT_G3x5_PFDBearingInfoModelADFAdapter(this.airplane, 1);
    }

    /**
     * @readonly
     * @property {WT_PlayerAirplane} airplane
     * @type {WT_PlayerAirplane}
     */
    get airplane() {
        return this._airplane;
    }

    /**
     * @readonly
     * @property {WT_G3x5_PFDBearingInfoContainer.Slot} slot
     * @type {WT_G3x5_PFDBearingInfoContainer.Slot}
     */
    get slot() {
        return this._slot;
    }

    /**
     *
     * @returns {WT_G3x5_PFDBearingInfoModel.Source}
     */
    getSource() {
        return SimVar.GetSimVarValue(`L:PFD_BRG${this.slot}_Source`, "Number");
    }

    _selectAdapter() {
        return this._adapters[this.getSource()];
    }

    hasData() {
        return this._selectAdapter().hasData();
    }

    getIdent() {
        return this._selectAdapter().getIdent();
    }

    hasDistance() {
        return this._selectAdapter().hasDistance();
    }

    _updateDistance(value) {
        this._selectAdapter().updateDistance(value);
    }

    getDistance() {
        return this._distanceModel;
    }

    _updateBearing(value) {
        this._selectAdapter().updateBearing(value);
    }

    getBearing() {
        return this._bearingModel;
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_PFDBearingInfoModel.Source = {
    NONE: 0,
    NAV1: 1,
    NAV2: 2,
    FMS: 3,
    ADF: 4
}

class WT_G3x5_PFDBearingInfoModelSourceAdapter {
    /**
     * @param {WT_PlayerAirplane} airplane
     */
    constructor(airplane) {
        this._airplane = airplane;
    }

    hasData() {
    }

    getIdent() {
    }

    hasDistance() {
    }

    updateDistance(value) {
    }

    updateBearing(value) {
    }
}

class WT_G3x5_PFDBearingInfoModelNoSourceAdapter extends WT_G3x5_PFDBearingInfoModelSourceAdapter {
    hasData() {
        return false;
    }

    getIdent() {
        return "";
    }

    hasDistance() {
        return false;
    }

    updateDistance(value) {
        value.set(0);
    }

    updateBearing(value) {
        value.set(0);
    }
}

class WT_G3x5_PFDBearingInfoModelNAVAdapter extends WT_G3x5_PFDBearingInfoModelSourceAdapter {
    /**
     * @param {WT_PlayerAirplane} airplane
     * @param {Number} slot
     */
    constructor(airplane, slot) {
        super(airplane);

        this._nav = airplane.navCom.getNav(slot);
    }

    hasData() {
        return this._nav.isReceiving();
    }

    getIdent() {
        return this._nav.ident();
    }

    hasDistance() {
        return this._nav.isReceiving() && this._nav.hasDME();
    }

    updateDistance(value) {
        if (this.hasDistance()) {
            this._nav.dme(value);
        } else {
            value.set(0);
        }
    }

    updateBearing(value) {
        if (this._nav.isReceiving()) {
            this._nav.radial(value);
            value.set((value.number + 180) % 360);
        } else {
            value.set(0);
        }
    }
}

class WT_G3x5_PFDBearingInfoModelFMSAdapter extends WT_G3x5_PFDBearingInfoModelSourceAdapter {
    /**
     * @param {WT_PlayerAirplane} airplane
     */
    constructor(airplane) {
        super(airplane);

        this._fms = airplane.fms;
    }

    hasData() {
        return this._fms.hasTarget();
    }

    getIdent() {
        return this._fms.targetIdent();
    }

    hasDistance() {
        return this._fms.hasTarget();
    }

    updateDistance(value) {
        if (this._fms.hasTarget()) {
            this._fms.targetDistance(value);
        } else {
            value.set(0);
        }
    }

    updateBearing(value) {
        if (this._fms.hasTarget()) {
            this._fms.targetBearing(value);
        } else {
            value.set(0);
        }
    }
}

class WT_G3x5_PFDBearingInfoModelADFAdapter extends WT_G3x5_PFDBearingInfoModelSourceAdapter {
    /**
     * @param {WT_PlayerAirplane} airplane
     * @param {Number} slot
     */
    constructor(airplane, slot) {
        super(airplane);

        this._adf = airplane.navCom.getADF(slot);
    }

    hasData() {
        return this._adf.isReceiving();
    }

    getIdent() {
        return this._adf.activeFrequency().hertz(WT_Frequency.Prefix.KHz).toFixed(1);
    }

    hasDistance() {
        return false;
    }

    updateDistance(value) {
        value.set(0);
    }

    updateBearing(value) {
        if (this._adf.isReceiving()) {
            this._airplane.navigation.heading(value);
            value.set((value.number + this._adf.bearing()) % 360);
        } else {
            value.set(0);
        }
    }
}

class WT_G3x5_UnitsControllerPFDBearingInfoModelAdapter extends WT_G3x5_UnitsControllerModelAdapter {
    /**
     * @param {WT_G3x5_UnitsController} controller
     * @param {WT_G3x5_PFDBearingInfoModel} bearingInfoModel
     */
    constructor(controller, bearingInfoModel) {
        super(controller);

        this._bearingInfoModel = bearingInfoModel;
        this._initListeners();
        this._initModel();
    }

    /**
     * @readonly
     * @property {WT_G3x5_PFDBearingInfoModel} bearingInfoModel
     * @type {WT_G3x5_PFDBearingInfoModel}
     */
    get bearingInfoModel() {
        return this._bearingInfoModel;
    }

    _updateBearing() {
        let unit = this.controller.navAngleSetting.getNavAngleUnit();
        this.bearingInfoModel.getBearing().setUnit(unit);
    }

    _updateDistance() {
        let unit = this.controller.distanceSpeedSetting.getDistanceUnit();
        this.bearingInfoModel.getDistance().setUnit(unit);
    }
}