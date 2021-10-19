class WT_G3x5_FlightPlanPreview {
    /**
     * @param {WT_MapModel} mapModel - the model of the map to use for the new preview.
     * @param {WT_MapView} mapView - the view object of the map to use for the new preview.
     * @param {WT_MapSettingModel} mapSettingModel - the settings model of the map to use for the new preview.
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory - the factory with which the new preview will use to create
     * ICAO waypoints.
     * @param {WT_CitySearchHandler} citySearcher - the city searcher to use.
     * @param {WT_MapViewBorderData} borderData - the border data to use.
     * @param {WT_G3x5_UnitsSettingModel} unitsSettingModel - the units settings model to use for the new preview.
     * @param {String} mapID - the ID of the map.
     * @param {String} bingMapID - the ID to use for the Bing layer of the new preview's map.
     */
    constructor(mapModel, mapView, mapSettingModel, icaoWaypointFactory, citySearcher, borderData, unitsSettingModel, mapID, bingMapID) {
        this._mapModel = mapModel;
        this._mapView = mapView;
        this._mapSettingModel = mapSettingModel;
        this._icaoWaypointFactory = icaoWaypointFactory;
        this._citySearcher = citySearcher;
        this._borderData = borderData;
        this._unitsSettingModel = unitsSettingModel;
        this._mapID = mapID;
        this._bingMapID = bingMapID;

        /**
         * @type {WT_FlightPlan}
         */
        this._flightPlan = null;
        /**
         * @type {WT_FlightPlanLeg[]}
         */
        this._focus = [];
        this._focusReadOnly = new WT_ReadOnlyArray(this._focus);

        this._isInit = false;
    }

    /**
     * The flight plan that is the subject of this preview.
     * @readonly
     * @type {WT_FlightPlan}
     */
    get flightPlan() {
        return this._flightPlan;
    }

    /**
     * This preview's map model.
     * @readonly
     * @type {WT_MapModel}
     */
    get mapModel() {
        return this._mapModel;
    }

    /**
     * This preview's map view.
     * @readonly
     * @type {WT_MapView}
     */
    get mapView() {
        return this._mapView;
    }

    /**
     * This preview's map setting model.
     * @readonly
     * @type {WT_MapSettingModel}
     */
    get mapSettingModel() {
        return this._mapSettingModel;
    }

    _initMapModel() {
        this._unitsAdapter = new WT_G3x5_UnitsSettingModelMapModelAdapter(this._unitsSettingModel, this.mapModel);
        this.mapModel.addModule(new WT_MapModelCrosshairModule());
        this.mapModel.addModule(new WT_MapModelAirplaneIconModule());
        this.mapModel.addModule(new WT_MapModelTerrainModule());
        this.mapModel.addModule(new WT_MapModelWeatherDisplayModule());
        this.mapModel.addModule(new WT_MapModelOrientationModule());
        this.mapModel.addModule(new WT_G3x5_MapModelPointerModule());
        this.mapModel.addModule(new WT_MapModelRangeRingModule());
        this.mapModel.addModule(new WT_MapModelFlightPlanModule());
        this.mapModel.addModule(new WT_MapModelBordersModule());
        this.mapModel.addModule(new WT_MapModelCitiesModule());
        this.mapModel.addModule(new WT_G3x5_MapModelWaypointDisplayModule());

        this.mapModel.crosshair.show = true;
        this.mapModel.terrain.mode = WT_MapModelTerrainModule.TerrainMode.OFF;

        this.mapModel.borders.stateBorderRange = WT_G3x5_FlightPlanPreview.STATE_BORDER_RANGE;

        this.mapModel.cities.show = true;
        this.mapModel.cities.largeRange = WT_G3x5_FlightPlanPreview.CITY_LARGE_RANGE;
        this.mapModel.cities.mediumRange = WT_G3x5_FlightPlanPreview.CITY_MEDIUM_RANGE;
        this.mapModel.cities.smallRange = WT_G3x5_FlightPlanPreview.CITY_SMALL_RANGE;
    }

    _initMapView() {
        let labelManager = new WT_MapViewTextLabelManager({preventOverlap: true});
        this._waypointRenderer = new WT_MapViewWaypointCanvasRenderer(labelManager);

        this.mapView.addLayer(this._bingLayer = new WT_MapViewBingLayer(this._bingMapID));
        this.mapView.addLayer(new WT_MapViewBorderLayer(this._borderData, WT_G3x5_FlightPlanPreview.BORDER_LOD_RESOLUTION_THRESHOLDS, labelManager));
        this.mapView.addLayer(new WT_MapViewCityLayer(this._citySearcher, labelManager));
        this.mapView.addLayer(new WT_MapViewFlightPlanLayer(this._icaoWaypointFactory, this._waypointRenderer, labelManager, new WT_G3x5_MapViewFlightPlanLegCanvasStyler()));
        this.mapView.addLayer(new WT_MapViewTextLabelLayer(labelManager));
        this.mapView.addLayer(new WT_MapViewRangeRingLayer());
        this.mapView.addLayer(new WT_MapViewCrosshairLayer());
        this.mapView.addLayer(new WT_MapViewAirplaneLayer());
        this.mapView.addLayer(new WT_G3x5_MapViewPointerLayer());
        this.mapView.addLayer(new WT_MapViewOrientationDisplayLayer(WT_G3x5_FlightPlanPreview.ORIENTATION_DISPLAY_TEXT));
        this.mapView.addLayer(new WT_MapViewMiniCompassLayer());
        this.mapView.addLayer(new WT_G3x5_MapViewPointerInfoLayer());
    }

    _initMapSettingModel() {
        this._mapSettings = new WT_G3x5_FlightPlanPreviewSettings(this.mapSettingModel, true);

        this.mapSettingModel.init();
        this.mapSettingModel.update();
    }

    _initPointerController() {
        this._pointerController = new WT_G3x5_MapPointerController(this.mapModel, this.mapView, new WT_G3x5_MapPointerEventHandler(this._mapID));
    }

    _initRangeTargetController() {
        this._rangeTargetController = new WT_G3x5_FlightPlanPreviewRangeTargetController(this._focusReadOnly, this.mapModel, this.mapView, this._mapSettings.rangeSetting, WT_G3x5_FlightPlanPreviewSettings.MAP_RANGE_DEFAULT);
    }

    /**
     * Initializes this flight plan preview. Calling this method will initialize the preview's map with the appropriate
     * modules and layers and sets up the controller which is responsible for automatically adjusting the map's center
     * and range to keep the previewed flight plan in view.
     */
    init() {
        this._initMapModel();
        this._initMapView();
        this._initMapSettingModel();
        this._initPointerController();
        this._initRangeTargetController();
        this._isInit = true;
        this._updateFromFlightPlan();
    }

    _updateFromFlightPlan() {
        this.mapModel.flightPlan.plan = this._flightPlan;
        this._rangeTargetController.setFlightPlan(this._flightPlan);
    }

    setFlightPlan(flightPlan) {
        if (this._flightPlan === flightPlan) {
            return;
        }

        this._flightPlan = flightPlan;
        if (this._isInit) {
            this._updateFromFlightPlan();
        }
    }

    /**
     *
     * @param {WT_FlightPlanLeg[]} legs
     */
    setFocus(legs) {
        if (this._focus.length === legs.length && this._focus.every((leg, index) => leg === legs[index])) {
            return;
        }

        this._focus.splice(0, this._focus.length);
        if (legs) {
            this._focus.push(...legs);
        }
        if (this._isInit) {
            this._rangeTargetController.onFocusChanged();
        }
    }

    sleep() {
        this._bingLayer.sleep();
    }

    wake() {
    }

    update() {
        if (!this._isInit) {
            return;
        }

        this._pointerController.update();
        this._rangeTargetController.update();
        this.mapView.update();
        this._waypointRenderer.update(this.mapView.state);
    }
}
WT_G3x5_FlightPlanPreview.BORDER_LOD_RESOLUTION_THRESHOLDS = [
    WT_Unit.NMILE.createNumber(0),
    WT_Unit.NMILE.createNumber(0.06),
    WT_Unit.NMILE.createNumber(0.3),
    WT_Unit.NMILE.createNumber(0.9),
    WT_Unit.NMILE.createNumber(3)
];
WT_G3x5_FlightPlanPreview.STATE_BORDER_RANGE = WT_Unit.NMILE.createNumber(400);

WT_G3x5_FlightPlanPreview.CITY_LARGE_RANGE = WT_Unit.NMILE.createNumber(100);
WT_G3x5_FlightPlanPreview.CITY_MEDIUM_RANGE = WT_Unit.NMILE.createNumber(50);
WT_G3x5_FlightPlanPreview.CITY_SMALL_RANGE = WT_Unit.NMILE.createNumber(10);

WT_G3x5_FlightPlanPreview.ORIENTATION_DISPLAY_TEXT = ["NORTH UP"];

class WT_G3x5_FlightPlanPreviewRangeTargetController {
    /**
     * @param {WT_ReadOnlyArray<WT_FlightPlanLeg>} focus
     * @param {WT_MapModel} mapModel
     * @param {WT_MapView} mapView
     * @param {WT_MapRangeSetting} rangeSetting
     * @param {WT_NumberUnit[]} rangeLevels
     * @param {WT_NumberUnit} defaultRange
     */
     constructor(focus, mapModel, mapView, rangeSetting, defaultRange) {
        this._mapModel = mapModel;
        this._mapView = mapView;

        mapView.setTargetOffsetHandler(this);
        mapView.setRangeInterpreter(this);

        this._rangeSetting = rangeSetting;
        this._rangeIndexDefault = this._findRangeIndex(defaultRange);

        /**
         * @type {WT_FlightPlan}
         */
        this._flightPlan = null;
        this._focus = focus;
        this._aspectRatio = 0;
        this._needAutoUpdate = false;

        this._flightPlanListener = this._onFlightPlanChanged.bind(this);

        this._initSettingListeners();

        this._tempVector3 = new WT_GVector3(0, 0, 0);
        this._tempNM = WT_Unit.NMILE.createNumber(0);
        this._tempGeoPoint = new WT_GeoPoint(0, 0);
    }

    _initSettingListeners() {
        this._rangeSetting.addListener(this._onRangeSettingChanged.bind(this));
    }

    _cleanUpFromFlightPlan() {
        if (!this._flightPlan) {
            return;
        }

        this._flightPlan.removeListener(this._flightPlanListener);
    }

    _initFromFlightPlan() {
        if (!this._flightPlan) {
            return;
        }

        this._flightPlan.addListener(this._flightPlanListener);
    }

    setFlightPlan(flightPlan) {
        if (this._flightPlan === flightPlan) {
            return;
        }

        this._cleanUpFromFlightPlan();
        this._flightPlan = flightPlan;
        this._initFromFlightPlan();
        this._needAutoUpdate = true;
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

    onFocusChanged() {
        this._needAutoUpdate = true;
    }

    _findRangeIndex(minRange) {
        let index = this._rangeSetting.ranges.findIndex(range => range.compare(minRange) >= 0);
        return index >= 0 ? index : (this._rangeSetting.ranges.length - 1);
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

        let legs = this._flightPlan ? (this._focus.length === 0 ? this._flightPlan.legs : this._focus) : [];
        if (legs.length === 0) {
            return boundingCircle;
        }
        if (legs.length === 1) {
            boundingCircle.center.set(legs.first().fix.location);
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
        while (outside = legs.find(leg => leg.fix.location.cartesian(this._tempVector3).subtract(center).length > radius + WT_G3x5_FlightPlanPreviewRangeTargetController.BOUNDING_CIRCLE_TOLERANCE, this)) {
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
    _calculateMapRangeIndex(boundingRadius, aspectRatio) {
        if (boundingRadius.number === 0) {
            return this._rangeIndexDefault;
        }

        let range = this._tempNM.set(boundingRadius);
        // scale by 0.5 to adjust for the fact that nominal map range only covers half the distance from the center to the top/bottom map edge
        // then scale again by buffer factor to avoid placing waypoints right at the edge of the map
        range.scale(0.5 * (1 + WT_G3x5_FlightPlanPreviewRangeTargetController.RANGE_BUFFER_FACTOR), true);

        // aspect ratio compensation
        range.scale(1 / Math.min(1, aspectRatio), true);
        return this._findRangeIndex(range);
    }

    /**
     * Adjusts the specified map view target to ensure the area displayed by the map view remains below a certain
     * maximum latitude defined by WT_G3x5_FlightPlanPreviewRangeTargetController.MAX_LATITUDE.
     * @param {WT_GeoPoint} target - the map view target.
     * @param {WT_NumberUnit} range - the nominal map range.
     */
    _handleLatitudeCompensation(target, range) {
        let latDelta = range.asUnit(WT_Unit.GA_RADIAN) * Avionics.Utils.RAD2DEG * 2; // scale by 2 to adjust for the fact that nominal map range is half the distance from center to the top/bottom map edge
        let edgeLat = target.lat + (target.lat >= 0 ? 1 : -1) * latDelta;
        if (Math.abs(edgeLat) > WT_G3x5_FlightPlanPreviewRangeTargetController.MAX_LATITUDE) {
            let compensatedLat = Math.max(0, WT_G3x5_FlightPlanPreviewRangeTargetController.MAX_LATITUDE - latDelta) * (target.lat >= 0 ? 1 : -1);
            target.set(compensatedLat, target.long);
        }
    }

    _updateTargetRange() {
        if (this._aspectRatio === 0) {
            return;
        }

        let boundingCircle = this._findBoundingCircle();
        let mapTarget = this._tempGeoPoint.set(boundingCircle.center);
        let mapRangeIndex = this._calculateMapRangeIndex(boundingCircle.radius, this._aspectRatio);
        let mapRange = this._rangeSetting.ranges.get(mapRangeIndex);
        this._handleLatitudeCompensation(mapTarget, mapRange);

        this._mapModel.target = mapTarget;
        this._rangeSetting.setValue(mapRangeIndex);

        if (this._mapModel.pointer.show) {
            this._mapModel.pointer.position = this._mapView.projection.absXYToRelXY(this._mapView.projection.viewTarget);
            this._mapModel.pointer.target = mapTarget;
        }
    }

    updateFromFlightPlan() {
        this._updateTargetRange();
    }

    /**
     *
     * @param {WT_FlightPlanEvent} event
     */
    _onFlightPlanChanged(event) {
        if (event.types !== WT_FlightPlanEvent.Type.LEG_ALTITUDE_CHANGED) {
            this._needAutoUpdate = true;
        }
    }

    /**
     *
     * @param {WT_MapRangeSetting} setting
     * @param {Number} newValue
     * @param {Number} oldValue
     */
    _onRangeSettingChanged(setting, newValue, oldValue) {
        this._mapModel.range = setting.getRange();
    }

    _updateFromPointer() {
        this._mapModel.target = this._mapModel.pointer.target;
    }

    _updateAspectRatio() {
        let aspectRatio = 0;
        if (this._mapView.viewWidth > 0 && this._mapView.viewHeight) {
            aspectRatio = this._mapView.viewWidth / this._mapView.viewHeight;
        }
        if (aspectRatio !== this._aspectRatio) {
            this._aspectRatio = aspectRatio;
            this._needAutoUpdate = true;
        }
    }

    update() {
        if (this._mapModel.pointer.show) {
            this._updateFromPointer();
        }

        this._updateAspectRatio();
        if (this._needAutoUpdate) {
            this._updateTargetRange();
            this._needAutoUpdate = false;
        }
    }
}
WT_G3x5_FlightPlanPreviewRangeTargetController.BOUNDING_CIRCLE_TOLERANCE = 1e-6; // ~6 meters
WT_G3x5_FlightPlanPreviewRangeTargetController.RANGE_BUFFER_FACTOR = 0.2;
WT_G3x5_FlightPlanPreviewRangeTargetController.MAX_LATITUDE = 85;