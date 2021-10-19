class WT_G3x5_FlightPlanDisplayPane extends WT_G3x5_DisplayPane {
    /**
     * @param {String} paneID
     * @param {WT_G3x5_PaneSettings} paneSettings
     * @param {WT_PlayerAirplane} airplane
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory
     * @param {WT_FlightPlanManager} flightPlanManager
     * @param {WT_CitySearchHandler} citySearcher
     * @param {WT_MapViewBorderData} borderData
     * @param {WT_G3x5_UnitsSettingModel} unitsSettingModel
     */
    constructor(paneID, paneSettings, airplane, icaoWaypointFactory, flightPlanManager, citySearcher, borderData, unitsSettingModel) {
        super(paneID, paneSettings);

        this._airplane = airplane;
        this._icaoWaypointFactory = icaoWaypointFactory;
        this._fpm = flightPlanManager;
        this._citySearcher = citySearcher;
        this._borderData = borderData;
        this._unitsSettingModel = unitsSettingModel;
        this._mapID = `${paneID}_${WT_G3x5_FlightPlanDisplayPane.MAP_ID_SUFFIX}`;

        /**
         * @type {WT_FlightPlan}
         */
        this._flightPlan = null;

        this._title = "";
    }

    getTitle() {
        return this._title;
    }

    _initFlightPlanPreview() {
        this._flightPlanPreview = new WT_G3x5_FlightPlanPreview(this._mapModel, this._mapView, this._mapSettingModel, this._icaoWaypointFactory, this._citySearcher, this._borderData, this._unitsSettingModel, this._mapID, this.paneID);
        this._flightPlanPreview.init();
    }

    _initSettingListeners() {
        this.paneSettings.flightPlan.addListener(this._onFlightPlanSettingChanged.bind(this));
    }

    _initSettings() {
        this.paneSettings.flightPlan.init();
        this._initSettingListeners();
    }

    init(viewElement) {
        this._mapModel = new WT_MapModel(this._airplane);
        this._mapView = viewElement;
        this._mapView.setModel(this._mapModel);
        this._mapSettingModel = new WT_MapSettingModel(this._mapID, this._mapModel, this._mapView);

        this._initFlightPlanPreview();
        this._initSettings();
        this._updateFlightPlan();
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

        this._flightPlan = flightPlan;
        this._flightPlanPreview.setFlightPlan(flightPlan);
    }

    _updateFlightPlan() {
        let flightPlanSetting = this.paneSettings.flightPlan;
        this._updateTitle();

        let flightPlan = null;
        if (flightPlanSetting.source === WT_G3x5_FlightPlanDisplayFlightPlanSetting.Source.ACTIVE) {
            flightPlan = this._fpm.activePlan;
        } else if (flightPlanSetting.source === WT_G3x5_FlightPlanDisplayFlightPlanSetting.Source.STANDBY) {
            flightPlan = this._fpm.standbyPlan;
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
WT_G3x5_FlightPlanDisplayPane.MAP_ID_SUFFIX = "FlightPlan";