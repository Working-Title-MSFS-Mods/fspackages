class WT_G3x5_FlightPlanDisplayPane extends WT_G3x5_DisplayPane {
    /**
     * @param {String} paneID
     * @param {WT_G3x5_PaneSettings} paneSettings
     * @param {WT_PlayerAirplane} airplane
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory
     * @param {WT_FlightPlanManager} flightPlanManager
     * @param {WT_G3x5_UnitsSettingModel} unitsSettingModel
     */
    constructor(paneID, paneSettings, airplane, icaoWaypointFactory, flightPlanManager, unitsSettingModel) {
        super(paneID, paneSettings);

        this._airplane = airplane;
        this._icaoWaypointFactory = icaoWaypointFactory;
        this._fpm = flightPlanManager;
        this._unitsSettingModel = unitsSettingModel;

        /**
         * @type {WT_FlightPlan}
         */
        this._flightPlan = null;
        this._flightPlanListener = this._onFlightPlanChanged.bind(this);

        this._title = "";
    }

    getTitle() {
        return this._title;
    }

    _initFlightPlanPreview() {
        this._flightPlanPreview = new WT_G3x5_FlightPlanPreview(this._mapModel, this._mapView, this._icaoWaypointFactory, this._unitsSettingModel, this.paneID);
        this._flightPlanPreview.init();
    }

    _initSettingListeners() {
        this.paneSettings.flightPlan.init();

        this.paneSettings.flightPlan.addListener(this._onFlightPlanSettingChanged.bind(this));
        this._updateFlightPlan();
    }

    _initSettings() {
        this._initSettingListeners();
    }

    init(viewElement) {
        this._mapModel = new WT_MapModel(this._airplane);
        this._mapView = viewElement;
        this._mapView.setModel(this._mapModel);

        this._initFlightPlanPreview();
        this._initSettings();
    }

    /**
     *
     * @param {WT_FlightPlanEvent} event
     */
    _onFlightPlanChanged(event) {
        if (event.types !== WT_FlightPlanEvent.Type.LEG_ALTITUDE_CHANGED) {
            this._flightPlanPreview.flightPlan.copyFrom(event.source);
        }
    }

    _updateTitle() {
        switch (this.paneSettings.flightPlan.source) {
            case WT_G3x5_FlightPlanDisplayFlightPlanSetting.Source.ACTIVE:
                this._title = "Active Flight Plan";
                break;
            case WT_G3x5_FlightPlanDisplayFlightPlanSetting.Source.STANDBY:
                this._title = "Standby Flight Plan";
                break;
            default:
                this._title = "Flight Plan";
        }
    }

    _setFlightPlan(flightPlan) {
        if (this._flightPlan === flightPlan) {
            return;
        }

        if (this._flightPlan) {
            this._flightPlan.removeListener(this._flightPlanListener);
        }
        this._flightPlan = flightPlan;
        if (flightPlan) {
            this._flightPlan.addListener(this._flightPlanListener);
        }
    }

    _updateFlightPlan() {
        let flightPlanSetting = this.paneSettings.flightPlan;
        this._updateTitle();

        let flightPlan = null;
        if (flightPlanSetting.source === WT_G3x5_FlightPlanDisplayFlightPlanSetting.Source.ACTIVE) {
            flightPlan = this._fpm.activePlan;
        }
        this._setFlightPlan(flightPlan);

        let focusLegs = [];
        if (flightPlan && flightPlanSetting.focusLegStartIndex !== undefined) {
            if (flightPlanSetting.focusLegStartIndex === -1 && flightPlan.hasOrigin()) {
                focusLegs.push(flightPlan.getOrigin().leg());
            } else if (flightPlanSetting.focusLegStartIndex === -2 && flightPlan.hasDestination()) {
                focusLegs.push(flightPlan.getDestination().leg());
            } else {
                focusLegs = flightPlan.legs.slice(flightPlanSetting.focusLegStartIndex, flightPlanSetting.focusLegEndIndex + 1);
            }
        }
        this._flightPlanPreview.setFocus(focusLegs);
    }

    _onFlightPlanSettingChanged(setting, newValue, oldValue) {
        this._updateFlightPlan();
    }

    sleep() {
        this._flightPlanPreview.sleep();
    }

    wake() {
        this._flightPlanPreview.wake();
    }

    update() {
        this._flightPlanPreview.update();
    }
}