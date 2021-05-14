class WT_G3x5_ProcedureDisplayPane extends WT_G3x5_DisplayPane {
    /**
     * @param {String} paneID
     * @param {WT_G3x5_PaneSettings} paneSettings
     * @param {WT_PlayerAirplane} airplane
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory
     * @param {WT_G3x5_UnitsSettingModel} unitsSettingModel
     */
    constructor(paneID, paneSettings, airplane, icaoWaypointFactory, unitsSettingModel) {
        super(paneID, paneSettings);

        this._airplane = airplane;
        this._icaoWaypointFactory = icaoWaypointFactory;
        this._unitsSettingModel = unitsSettingModel;

        this._flightPlan = new WT_FlightPlan(icaoWaypointFactory);
        this._procedureSegment = null;
        this._procedureName = "Procedure";

        this._airportRequestID = 0;
    }

    /**
     * The setting model associated with this procedure display.
     * @readonly
     * @type {WT_MapSettingModel}
     */
    get settingModel() {
        return this._settingModel;
    }

    getTitle() {
        return this._procedureName;
    }

    /**
     * Gets the currently displayed procedure segment.
     * @returns {WT_FlightPlanProcedureSegment} the currently displayed procedure segment, or null if no procedure
     *                                          segment is being displayed.
     */
    getProcedureSegment() {
        return this._procedureSegment;
    }

    _initFlightPlanPreview() {
        this._flightPlanPreview = new WT_G3x5_FlightPlanPreview(this._mapModel, this._mapView, this._icaoWaypointFactory, this._unitsSettingModel, this.paneID);
        this._flightPlanPreview.setFlightPlan(this._flightPlan);
        this._flightPlanPreview.init();
    }

    _initSettingListeners() {
        this.paneSettings.procedure.init();

        this.paneSettings.procedure.addListener(this._onProcedureSettingChanged.bind(this));
        this._updateProcedure();
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

    _updateProcedureName() {
        let segment = this.getProcedureSegment();
        if (segment) {
            let typeText;
            let airportIdent = segment.procedure.airport.ident;
            let prefix = "";
            let name = segment.procedure.name;
            let suffix = "";
            switch (segment.segment) {
                case WT_FlightPlan.Segment.DEPARTURE:
                    typeText = "Departure";
                    if (segment.runwayTransitionIndex >= 0 && segment.runwayTransitionIndex < segment.procedure.runwayTransitions.array.length) {
                        prefix = `RW${segment.procedure.runwayTransitions.getByIndex(segment.runwayTransitionIndex).runway.designationFull}.`;
                    }
                    if (segment.enrouteTransitionIndex >= 0 && segment.enrouteTransitionIndex < segment.procedure.enrouteTransitions.array.length) {
                        suffix = `.${segment.procedure.enrouteTransitions.getByIndex(segment.enrouteTransitionIndex).name}`;
                    }
                    break;
                case WT_FlightPlan.Segment.ARRIVAL:
                    typeText = "Arrival";
                    if (segment.enrouteTransitionIndex >= 0 && segment.enrouteTransitionIndex < segment.procedure.enrouteTransitions.array.length) {
                        prefix = `${segment.procedure.enrouteTransitions.getByIndex(segment.enrouteTransitionIndex).name}.`;
                    }
                    if (segment.runwayTransitionIndex >= 0 && segment.runwayTransitionIndex < segment.procedure.runwayTransitions.array.length) {
                        suffix = `.RW${segment.procedure.runwayTransitions.getByIndex(segment.runwayTransitionIndex).runway.designationFull}`;
                    }
                    break;
                case WT_FlightPlan.Segment.APPROACH:
                    typeText = "Approach";
                    if (segment.transitionIndex >= 0 && segment.transitionIndex < segment.procedure.transitions.array.length) {
                        prefix = `${segment.procedure.transitions.getByIndex(segment.transitionIndex).name}.`;
                    }
                    break;
            }
            this._procedureName = `${typeText} – ${airportIdent}–${prefix}${name}${suffix}`;
        } else {
            this._procedureName = "Procedure";
        }
    }

    async _updateProcedure() {
        let procedureSetting = this.paneSettings.procedure;
        let requestID = ++this._airportRequestID;
        if (procedureSetting.airportICAO && procedureSetting.procedureType !== WT_G3x5_ProcedureDisplayProcedureSetting.ProcedureType.NONE && procedureSetting.procedureIndex >= 0) {
            try {
                let airport = await this._icaoWaypointFactory.getAirport(procedureSetting.airportICAO);
                if (requestID !== this._airportRequestID) {
                    // superseded by a more recent update
                    return;
                }

                let procedure;
                switch (procedureSetting.procedureType) {
                    case WT_G3x5_ProcedureDisplayProcedureSetting.ProcedureType.DEPARTURE:
                        procedure = airport.departures.getByIndex(procedureSetting.procedureIndex);
                        break;
                    case WT_G3x5_ProcedureDisplayProcedureSetting.ProcedureType.ARRIVAL:
                        procedure = airport.arrivals.getByIndex(procedureSetting.procedureIndex);
                        break;
                    case WT_G3x5_ProcedureDisplayProcedureSetting.ProcedureType.APPROACH:
                        procedure = airport.approaches.getByIndex(procedureSetting.procedureIndex);
                        break;
                }

                let runwayTransitionIndex = -1;
                if (procedureSetting.procedureType !== WT_G3x5_ProcedureDisplayProcedureSetting.ProcedureType.APPROACH && procedureSetting.runwayDesignation) {
                    runwayTransitionIndex = procedure.runwayTransitions.array.findIndex(transition => transition.runway.designation === procedureSetting.runwayDesignation, this);
                }
                this._flightPlan.clear();
                switch (procedureSetting.procedureType) {
                    case WT_G3x5_ProcedureDisplayProcedureSetting.ProcedureType.DEPARTURE:
                        this._flightPlan.setOrigin(airport);
                        await this._flightPlan.setDeparture(procedure.name, runwayTransitionIndex, procedureSetting.transitionIndex);
                        this._procedureSegment = this._flightPlan.getDeparture();
                        break;
                    case WT_G3x5_ProcedureDisplayProcedureSetting.ProcedureType.ARRIVAL:
                        this._flightPlan.setDestination(airport);
                        await this._flightPlan.setArrival(procedure.name, procedureSetting.transitionIndex, runwayTransitionIndex);
                        this._procedureSegment = this._flightPlan.getArrival();
                        break;
                    case WT_G3x5_ProcedureDisplayProcedureSetting.ProcedureType.APPROACH:
                        this._flightPlan.setDestination(airport);
                        await this._flightPlan.setApproach(procedure.name, procedureSetting.transitionIndex);
                        this._procedureSegment = this._flightPlan.getApproach();
                        break;
                }
            } catch (e) {
                console.log(e);
                this.__flightPlan.clear();
                this._procedureSegment = null;
            }
        } else {
            this._flightPlan.clear();
            this._procedureSegment = null;
        }

        this._updateProcedureName();
    }

    _onProcedureSettingChanged(setting, newValue, oldValue) {
        this._updateProcedure();
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