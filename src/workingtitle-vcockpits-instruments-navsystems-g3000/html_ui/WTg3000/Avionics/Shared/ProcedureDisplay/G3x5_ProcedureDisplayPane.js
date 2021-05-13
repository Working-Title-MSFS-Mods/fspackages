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

    /**
     * The model associated with this procedure display's map.
     * @readonly
     * @type {WT_MapModel}
     */
    get mapModel() {
        return this._mapModel;
    }

    /**
     * The view associated with this procedure display's map.
     * @readonly
     * @type {WT_MapView}
     */
    get mapView() {
        return this._mapView;
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

    _initMapModel() {
        this._unitsAdapter = new WT_G3x5_UnitsSettingModelMapModelAdapter(this._unitsSettingModel, this.mapModel);
        this.mapModel.addModule(new WT_MapModelCrosshairModule());
        this.mapModel.addModule(new WT_MapModelAirplaneIconModule());
        this.mapModel.addModule(new WT_MapModelTerrainModule());
        this.mapModel.addModule(new WT_MapModelWeatherDisplayModule());
        this.mapModel.addModule(new WT_MapModelOrientationModule());
        this.mapModel.addModule(new WT_MapModelRangeRingModule());
        this.mapModel.addModule(new WT_MapModelFlightPlanModule());

        this.mapModel.crosshair.show = true;
        this.mapModel.terrain.mode = WT_MapModelTerrainModule.TerrainMode.OFF;
        this.mapModel.flightPlan.plan = this._flightPlan;
    }

    _initMapView() {
        let labelManager = new WT_MapViewTextLabelManager({preventOverlap: true});
        this._waypointRenderer = new WT_MapViewWaypointCanvasRenderer(labelManager);

        this.mapView.addLayer(this._bingLayer = new WT_MapViewBingLayer(this._paneID));
        this.mapView.addLayer(new WT_MapViewFlightPlanLayer(this._icaoWaypointFactory, this._waypointRenderer, labelManager, new WT_G3x5_MapViewFlightPlanLegCanvasStyler()));
        this.mapView.addLayer(new WT_MapViewTextLabelLayer(labelManager));
        this.mapView.addLayer(new WT_MapViewRangeRingLayer());
        this.mapView.addLayer(new WT_MapViewCrosshairLayer());
        this.mapView.addLayer(new WT_MapViewAirplaneLayer());
        this.mapView.addLayer(new WT_MapViewOrientationDisplayLayer(WT_G3x5_ProcedureDisplayPane.ORIENTATION_DISPLAY_TEXT));
        this.mapView.addLayer(new WT_MapViewMiniCompassLayer());
    }

    _initRangeTargetController() {
        this._rangeTargetController = new WT_G3x5_ProcedureRangeTargetController(this._flightPlan, this.mapModel, this.mapView, WT_G3x5_ProcedureDisplayPane.MAP_RANGE_LEVELS, WT_G3x5_ProcedureDisplayPane.MAP_RANGE_DEFAULT);
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
        this.mapView.setModel(this.mapModel);

        this._initMapModel();
        this._initMapView();
        this._initRangeTargetController();
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
                this._flightPlan.clear();
                this._procedureSegment = null;
            }
        } else {
            this._flightPlan.clear();
            this._procedureSegment = null;
        }
        this._rangeTargetController.updateFromFlightPlan();

        this._updateProcedureName();
    }

    _onProcedureSettingChanged(setting, newValue, oldValue) {
        this._updateProcedure();
    }

    sleep() {
        this._bingLayer.sleep();
    }

    wake() {
    }

    update() {
        this._rangeTargetController.update();
        this.mapView.update();
        this._waypointRenderer.update(this.mapView.state);
    }
}

WT_G3x5_ProcedureDisplayPane.MAP_RANGE_LEVELS =
    [250, 500, 750, 1000].map(range => new WT_NumberUnit(range, WT_Unit.FOOT)).concat(
        [0.25, 0.5, 0.75, 1, 1.5, 2.5, 4, 5, 7.5, 10, 15, 25, 40, 50, 75, 100, 150, 250, 400, 500, 750, 1000].map(range => new WT_NumberUnit(range, WT_Unit.NMILE))
    );
WT_G3x5_ProcedureDisplayPane.MAP_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(1);

WT_G3x5_ProcedureDisplayPane.ORIENTATION_DISPLAY_TEXT = ["NORTH UP"];

class WT_G3x5_ProcedureRangeTargetController {
    /**
     * @param {WT_FlightPlan} flightPlan
     * @param {WT_MapModel} mapModel
     * @param {WT_MapView} mapView
     * @param {WT_NumberUnit[]} rangeLevels
     * @param {WT_NumberUnit} defaultRange
     */
     constructor(flightPlan, mapModel, mapView, rangeLevels, defaultRange) {
        this._flightPlan = flightPlan;
        this._mapModel = mapModel;
        this._mapView = mapView;

        mapView.setTargetOffsetHandler(this);
        mapView.setRangeInterpreter(this);

        this._rangeLevels = rangeLevels;
        this._rangeIndexDefault = this._findRangeIndex(defaultRange);

        this._aspectRatio = 0;

        this._tempVector3 = new WT_GVector3(0, 0, 0);
        this._tempNM = WT_Unit.NMILE.createNumber(0);
        this._tempGeoPoint = new WT_GeoPoint(0, 0);
    }

    /**
     *
     * @param {WT_MapModel} model
     * @param {WT_GVector2} offset
     */
    getTargetOffset(model, offset) {
        offset.set(0, 0);
    }

    /**
     *
     * @param {WT_MapModel} model
     * @param {WT_NumberUnit} range
     */
    getTrueRange(model, range) {
        range.set(model.range).scale(4, true);
    }

    _findRangeIndex(minRange) {
        let index = this._rangeLevels.findIndex(range => range.compare(minRange) >= 0);
        return index >= 0 ? index : (this._rangeLevels.length - 1);
    }

    /**
     *
     * @returns {{center:WT_GeoPoint, radius:WT_NumberUnit}}
     */
    _findBoundingCircle() {
        let boundingCircle = {
            center: new WT_GeoPoint(0, 0),
            radius: WT_Unit.NMILE.createNumber(0)
        };

        let legs = this._flightPlan.legs;
        if (legs.length === 0) {
            return boundingCircle;
        }
        if (legs.length === 1) {
            boundingCircle.center.set(legs.get(0).fix.location);
            return boundingCircle;
        }

        // Ritter's algorithm
        let first = legs.first().fix.location.cartesian();
        let maxDelta = new WT_GVector3(0, 0, 0);
        let compare = this._tempVector3;
        let second = legs.reduce((prev, curr) => {
            let delta = curr.fix.location.cartesian(compare).subtract(first);
            if (delta.length > maxDelta.length) {
                maxDelta.set(delta);
                return curr;
            } else {
                return prev;
            }
        }).fix.location.cartesian();
        maxDelta.scale(-1, true); // reverse maxDelta so it is pointing from 'second' rather than to it.
        legs.reduce((prev, curr) => {
            let delta = curr.fix.location.cartesian(compare).subtract(second);
            if (delta.length > maxDelta.length) {
                maxDelta.set(delta);
                return curr;
            } else {
                return prev;
            }
        });

        maxDelta.scale(0.5, true);
        let radius = maxDelta.length;
        let center = maxDelta.add(second);

        let outside;
        while (outside = legs.find(leg => leg.fix.location.cartesian(this._tempVector3).subtract(center).length > radius + WT_G3x5_ProcedureRangeTargetController.BOUNDING_CIRCLE_TOLERANCE, this)) {
            let delta = outside.fix.location.cartesian(this._tempVector3).subtract(center);
            radius = (delta.length + radius) / 2;
            center.add(delta.scale(1 - radius / delta.length, true));
        }

        boundingCircle.center.setFromCartesian(center);
        // use law of cosines to calculate geodetic radius of the bounding circle on Earth's surface
        let d = center.length; // distance of bounding sphere center to center of the earth
        let distance = Math.acos((1 + d * d - radius * radius) / (2 * d));
        boundingCircle.radius.set(distance, WT_Unit.GA_RADIAN);

        return boundingCircle;
    }

    /**
     *
     * @param {WT_NumberUnit} boundingRadius
     * @param {Number} aspectRatio
     */
    _calculateMapRange(boundingRadius, aspectRatio) {
        if (boundingRadius.number === 0) {
            return this._rangeLevels[this._rangeIndexDefault];
        }

        let range = this._tempNM.set(boundingRadius);
        // scale by 0.5 to adjust for the fact that nominal map range only covers half the distance from the center to the top/bottom map edge
        // then scale again by buffer factor to avoid placing waypoints right at the edge of the map
        range.scale(0.5 * (1 + WT_G3x5_ProcedureRangeTargetController.RANGE_BUFFER_FACTOR), true);

        // aspect ratio compensation
        range.scale(1 / Math.min(1, aspectRatio), true);
        return this._rangeLevels[this._findRangeIndex(range)];
    }

    _updateTargetRange() {
        if (this._aspectRatio === 0) {
            return;
        }

        let boundingCircle = this._findBoundingCircle();
        let mapRange = this._calculateMapRange(boundingCircle.radius, this._aspectRatio);
        this._mapModel.target = boundingCircle.center;
        this._mapModel.range = mapRange;
    }

    updateFromFlightPlan() {
        this._updateTargetRange();
    }

    update() {
        let aspectRatio = 0;
        if (this._mapView.viewWidth > 0 && this._mapView.viewHeight) {
            aspectRatio = this._mapView.viewWidth / this._mapView.viewHeight;
        }

        if (aspectRatio !== this._aspectRatio) {
            this._aspectRatio = aspectRatio;
            this._updateTargetRange();
        }
    }
}
WT_G3x5_ProcedureRangeTargetController.BOUNDING_CIRCLE_TOLERANCE = 1e-6; // ~6 meters
WT_G3x5_ProcedureRangeTargetController.RANGE_BUFFER_FACTOR = 0.2;