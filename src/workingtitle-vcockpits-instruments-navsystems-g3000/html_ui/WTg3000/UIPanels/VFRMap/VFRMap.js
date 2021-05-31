class VFRMapData {
}

class VFRMapListener extends ViewListener.ViewListener {
    bindBingMap(type) {
        this.trigger("JS_BIND_BINGMAP", type);
    }
    onDataChange(callback) {
        this.on("updateData", callback);
    }
}

var GameVFRMapisLoaded = false;
document.addEventListener('beforeunload', function () {
    GameVFRMapisLoaded = false;
}, false);

class WT_VFRMapPanel extends HTMLElement {
    constructor() {
        super();

        this._modConfigLoaded = false;

        this._lastTime = 0;
    }

    /**
     * The real-world time stamp of the current update cycle.
     * @readonly
     * @type {Number}
     */
    get currentTimeStamp() {
        return this._currentTimeStamp;
    }

    async _defineChildren() {
        this._panel = document.querySelector(`#${WT_VFRMapPanel.FRAME_ID}`);

        // wait until templates are loaded
        await WT_Wait.awaitCallback(() => typeof ToggleButtonElement === "function" && typeof NewPushButtonElement === "function" && typeof MapInstrument === "function");

        [
            this._toggleIsolinesButton,
            this._followPlaneButton,
            this._backOnTrackButton,
            this._mapAsoboHTMLElement,
            this._mapWTHTMLElement,
        ] = await Promise.all([
            WT_CustomElementSelector.select(this, `#ToggleIsolines`, ToggleButtonElement),
            WT_CustomElementSelector.select(this, `#FollowPlane`, ToggleButtonElement),
            WT_CustomElementSelector.select(this, `#BackOnTrack`, NewPushButtonElement),
            WT_CustomElementSelector.select(this, `map-instrument`, MapInstrument),
            WT_CustomElementSelector.select(this, `map-view`, WT_MapView)
        ]);
    }

    async _loadModConfig() {
        await WT_g3000_ModConfig.initialize();
        this._modConfigLoaded = true;
    }

    _initVFRMapListener() {
        this.m_vfrMapListener = RegisterViewListenerT("JS_LISTENER_VFRMAP", this._onVFRMapRegistered.bind(this), VFRMapListener);
        this.m_vfrMapListener.onDataChange(this._onVFRMapDataSent.bind(this));
    }

    _initAsoboMap() {
        this._map = new WT_VFRMapAsobo(this, this._mapAsoboHTMLElement);
    }

    _initWTMap() {
        this._map = new WT_VFRMapWT(this, this._mapWTHTMLElement);
    }

    _initMap() {
        if (WT_g3000_ModConfig.INSTANCE.vfrMap.useCustom) {
            switch (WT_PlayerAirplane.getAircraftType()) {
                case WT_PlayerAirplane.Type.TBM930:
                case WT_PlayerAirplane.Type.CITATION_LONGITUDE:
                    this._initWTMap();
                    break;
                default:
                    this._initAsoboMap();
            }
        } else {
            this._initAsoboMap();
        }

        this._map.htmlElement.setAttribute("active", "true");
    }

    _initFooter() {
        this._toggleIsolinesButton.addEventListener("OnValidate", this._onShowIsolines.bind(this));
        this._followPlaneButton.addEventListener("OnValidate", this._onFollowPlane.bind(this));
        this._backOnTrackButton.addEventListener("OnValidate", this._onBackOnTrack.bind(this));
    }

    _initResizeListener() {
        this._panel.addEventListener("onResizeElement", this._onPanelResized.bind(this));
    }

    _initUpdateLoop() {
        GameVFRMapisLoaded = true;
        this._updateLoop();
    }

    _doInit() {
        this._initMap();
        this._initFooter();
        this._initVFRMapListener();
        this._initResizeListener();
        this._initUpdateLoop();
    }

    async _connectedCallbackHelper() {
        await Promise.all([
            this._defineChildren(),
            this._loadModConfig()
        ]);
        await WT_Wait.awaitCallback(() => window["simvar"] && this._modConfigLoaded, this);
        this._doInit();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _onVFRMapRegistered() {
    }

    _onPanelResized() {
        this._map.onResized();
    }

    _onVFRMapDataSent(data) {
        this._map.setShowAirplane(data.showPlane);

        this._followPlaneButton.setVisible(data.showPlane);
        this._followPlaneButton.setValue(data.showPlane);
        this._map.setFollowAirplane(data.showPlane);

        if (data.latLongStr != "") {
            let split = data.latLongStr.toLowerCase().split(",");
            if (split.length > 1) {
                try {
                    let center = new WT_GeoPoint(parseFloat(split[0]), parseFloat(split[1]));
                    this._map.setCenter(center);
                } catch (e) {
                }
            }
        }

        this._backOnTrackButton.setVisible(data.backOnTrackEnabled);
    }

    _onFollowPlane() {
        this._map.setFollowAirplane(this._followPlaneButton.toggled);
    }

    _onShowIsolines() {
        this._map.setShowIsolines(this._toggleIsolinesButton.toggled);
    }

    _onBackOnTrack() {
        this._map.startBackOnTrack();
    }

    _updateMap(deltaTime) {
        if (this._map.isReady) {
            this._map.onUpdate(deltaTime);
        }
    }

    _updateFollowPlane() {
        let isFollowing = this._map.isFollowingAirplane();
        if (this._followPlaneButton.toggled !== isFollowing) {
            this._followPlaneButton.setValue(isFollowing);
        }
    }

    onUpdate(deltaTime) {
        this._currentTimeStamp = Date.now();
        try {
            this._updateMap(deltaTime);
            this._updateFollowPlane();
        } catch (e) {
            console.log(e);
        }
    }

    _updateLoop() {
        if (window["IsDestroying"] === true || !GameVFRMapisLoaded) {
            return;
        }

        if (!this._panel.classList.contains("panelInvisible")) {
            let currentTime = Date.now();
            let deltaTime = currentTime - this._lastTime;
            this._lastTime = currentTime;
            this.onUpdate(deltaTime);
        }

        requestAnimationFrame(this._updateLoop.bind(this));
    }
}
WT_VFRMapPanel.FRAME_ID = "VFRMap_Frame";

class WT_VFRMap {
    constructor(vfrMapPanel, htmlElement) {
        this._vfrMapPanel = vfrMapPanel;
        this._htmlElement = htmlElement;
        this._isReady = false;
    }

    /**
     * @readonly
     * @type {WT_VFRMapPanel}
     */
    get vfrMapPanel() {
        return this._vfrMapPanel;
    }

    /**
     * @readonly
     * @type {HTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get isReady() {
        return this._isReady;
    }

    isFollowingAirplane() {
        return false;
    }

    setCenter(center) {
    }

    setShowAirplane(value) {
    }

    setFollowAirplane(value) {
    }

    setShowIsolines(value) {
    }

    startBackOnTrack() {
    }

    onResized() {
    }

    onUpdate(deltaTime) {
    }
}

class WT_VFRMapAsobo extends WT_VFRMap {
    constructor(vfrMapPanel, htmlElement) {
        super(vfrMapPanel, htmlElement);

        TemplateElement.call(this.htmlElement, this._init.bind(this));
        this.htmlElement.minimizedIntersectionMaxRange = 45;
        this.htmlElement.minimizedVorMaxRange = 600;
        this.htmlElement.minimizedNdbMaxRange = 300;
    }

    _init() {
        this.htmlElement.init("VFRMap");
        this._isReady = true;
    }

    isFollowingAirplane() {
        return this.htmlElement.bVfrMapFollowPlane;
    }

    setCenter(center) {
        this.htmlElement.setCenter(new LatLong(center.lat, center.long));
    }

    setShowAirplane(value) {
        this.htmlElement.setAttribute("show-airplane", value.toString());
    }

    setFollowAirplane(value) {
        this.htmlElement.bVfrMapFollowPlane = value;
    }

    setShowIsolines(value) {
        this.htmlElement.showIsolines(value);
    }

    startBackOnTrack() {
        this.htmlElement.flightPlanManager.recomputeActiveWaypointIndex(() => {
            Coherent.trigger("ON_BACK_ON_TRACK_START");
            let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
            let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
            let hasActiveWaypoint = this.htmlElement.onBackOnTrack(lat, long);
            if (hasActiveWaypoint) {
                if (this._hidePlaneTimeout) {
                    clearTimeout(this._hidePlaneTimeout);
                }
                this._hidePlaneTimeout = setTimeout(() => {
                    Coherent.trigger("ON_BACK_ON_TRACK_END");
                    this.htmlElement.setAttribute("show-airplane", "false");
                }, 20000);
            }
        });
    }

    onResized() {
        this.htmlElement.resize();
    }

    onUpdate(deltaTime) {
        this.htmlElement.update(deltaTime);
    }
}

class WT_VFRMapWT extends WT_VFRMap {
    constructor(vfrMapPanel, htmlElement) {
        super(vfrMapPanel, htmlElement);

        this._airplane = new WT_PlayerAirplane((() => this.vfrMapPanel.currentTimeStamp).bind(this));

        this._icaoWaypointFactory = new WT_ICAOWaypointFactory();
        this._icaoSearchers = {
            airport: new WT_ICAOSearcher("VFRMap", WT_ICAOSearcher.Keys.AIRPORT),
            vor: new WT_ICAOSearcher("VFRMap", WT_ICAOSearcher.Keys.VOR),
            ndb: new WT_ICAOSearcher("VFRMap", WT_ICAOSearcher.Keys.NDB),
            int: new WT_ICAOSearcher("VFRMap", WT_ICAOSearcher.Keys.INT)
        };

        this._fpm = new WT_FlightPlanManager(false, "VFRMap", this._airplane, this._icaoWaypointFactory);
        this._lastFPMSyncTime = 0;

        this._citySearcher = new WT_CitySearcher();

        this._rangeIndex = WT_VFRMapWT.MAP_RANGE_LEVELS.findIndex(range => range.equals(WT_VFRMapWT.MAP_RANGE_DEFAULT));
        this._target = new WT_GeoPoint(0, 0);
        this._isFollowingAirplane = false;
        this._scrollDelta = new WT_GVector2(0, 0);
        this._isMouseDown = false;
        this._lastMousePos = new WT_GVector2(0, 0);

        this._init();
    }

    /**
     * The player airplane.
     * @readonly
     * @type {WT_PlayerAirplane}
     */
    get airplane() {
        return this._airplane;
    }

    /**
     * The model associated with this map.
     * @readonly
     * @type {WT_MapModel}
     */
    get model() {
        return this._model;
    }

    /**
     * The view associated with this map.
     * @readonly
     * @type {WT_MapView}
     */
    get view() {
        return this.htmlElement;
    }

    _initModel(modConfig) {
        this.model.addModule(new WT_MapModelUnitsModule());
        this.model.addModule(new WT_MapModelAirplaneIconModule());
        this.model.addModule(new WT_MapModelTerrainModule());
        this.model.addModule(new WT_MapModelWeatherDisplayModule());
        this.model.addModule(new WT_MapModelBordersModule());
        this.model.addModule(new WT_MapModelWaypointsModule());
        this.model.addModule(new WT_MapModelActiveFlightPlanModule());

        this.model.addModule(new WT_MapModelCitiesModule());

        this.model.terrain.mode = WT_MapModelTerrainModule.TerrainMode.ABSOLUTE;

        this.model.borders.stateBorderShow = true;
        this.model.borders.stateBorderRange = WT_VFRMapWT.STATE_BORDER_RANGE;

        this.model.waypoints.airportLargeRange = WT_VFRMapWT.AIRPORT_LARGE_RANGE;
        this.model.waypoints.airportMediumRange = WT_VFRMapWT.AIRPORT_MEDIUM_RANGE;
        this.model.waypoints.airportSmallRange = WT_VFRMapWT.AIRPORT_SMALL_RANGE;

        this.model.activeFlightPlan.flightPlanManager = this._fpm;

        this.model.cities.show = true;
        this.model.cities.largeRange = WT_VFRMapWT.CITY_LARGE_RANGE;
        this.model.cities.mediumRange = WT_VFRMapWT.CITY_MEDIUM_RANGE;
        this.model.cities.smallRange = WT_VFRMapWT.CITY_SMALL_RANGE;

        if (modConfig.roads.showInVFRMap) {
            this.model.addModule(new WT_MapModelRoadsModule());
            this.model.roads.show = true;
            this.model.roads.highwayRange = WT_VFRMapWT.ROAD_HIGHWAY_RANGE;
            this.model.roads.primaryRange = WT_VFRMapWT.ROAD_PRIMARY_RANGE;
        }
    }

    _initBorderData() {
        let borderData = new WT_MapViewBorderData();
        borderData.startLoad();
        return borderData;
    }

    _getRoadRegionsFromConfig(modConfig) {
        let regions = [];
        for (let regionName in WT_MapViewRoadFeatureCollection.Region) {
            let configName = `load${regionName}`;
            if (modConfig.roads[configName]) {
                regions.push(WT_MapViewRoadFeatureCollection.Region[regionName]);
            }
        }
        return regions;
    }

    _getRoadMaxQualityLODFromConfig(modConfig) {
        return 4 - modConfig.roads.quality;
    }

    _getRoadLabelDataFromRegions(regions) {
        let data = [];
        for (let region of regions) {
            switch (region) {
                case WT_MapViewRoadFeatureCollection.Region.NA:
                    data.push(new WT_Garmin_MapViewNARouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.CA:
                    data.push(new WT_Garmin_MapViewMexicoRouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.SA:
                    data.push(new WT_Garmin_MapViewSARouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.EI:
                    data.push(new WT_Garmin_MapViewEIRouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.EN:
                    data.push(new WT_Garmin_MapViewENRouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.EW:
                    data.push(new WT_Garmin_MapViewEWRouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.EC:
                    data.push(new WT_Garmin_MapViewECRouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.RU:
                    data.push(new WT_Garmin_MapViewRussiaRouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.CH:
                    data.push(new WT_Garmin_MapViewCHRouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.AE:
                    data.push(new WT_Garmin_MapViewAERouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.OC:
                    data.push(new WT_Garmin_MapViewOCRouteCollection());
                    break;
            }
        }
        return data;
    }

    _initRoadData(modConfig) {
        let regions = this._getRoadRegionsFromConfig(modConfig);
        let featureData = new WT_MapViewRoadFeatureCollection(
            regions,
            [WT_MapViewRoadFeatureCollection.Type.HIGHWAY, WT_MapViewRoadFeatureCollection.Type.PRIMARY],
            this._getRoadMaxQualityLODFromConfig(modConfig)
        );
        let labelData = this._getRoadLabelDataFromRegions(regions);

        return {feature: featureData, label: labelData};
    }

    _loadRoadData(roadFeatureData, roadLabelData) {
        roadFeatureData.startLoad();
        for (let data of roadLabelData) {
            data.startLoad();
        }
    }

    _initView(modConfig) {
        let labelManager = new WT_MapViewTextLabelManager({preventOverlap: true});
        this._waypointRenderer = new WT_MapViewWaypointCanvasRenderer(labelManager);
        let borderData = this._initBorderData();
        let roadData;
        if (modConfig.roads.showInVFRMap) {
            roadData = this._initRoadData(modConfig);
            this._loadRoadData(roadData.feature, roadData.label);
        }

        this.view.addLayer(new WT_MapViewBingLayer("VFRMap"));
        this.view.addLayer(new WT_MapViewBorderLayer(borderData, WT_VFRMapWT.BORDER_LOD_RESOLUTION_THRESHOLDS, labelManager));
        if (modConfig.roads.showInVFRMap) {
            this.view.addLayer(new WT_MapViewRoadLayer(roadData.feature, roadData.label, WT_VFRMapWT.ROAD_LOD_RESOLUTION_THRESHOLDS));
        }
        this.view.addLayer(new WT_MapViewCityLayer(this._citySearcher, labelManager));
        this.view.addLayer(new WT_MapViewWaypointLayer(this._icaoSearchers, this._icaoWaypointFactory, this._waypointRenderer, labelManager));
        this.view.addLayer(new WT_MapViewActiveFlightPlanLayer(this._icaoWaypointFactory, this._waypointRenderer, labelManager, new WT_G3x5_MapViewFlightPlanLegCanvasStyler(), false));
        this.view.addLayer(new WT_MapViewTextLabelLayer(labelManager));
        this.view.addLayer(this._airplaneLayer = new WT_MapViewAirplaneLayer());
    }

    _initListeners() {
        this.view.addEventListener("mousedown", this._onMouseDown.bind(this));
        this.view.addEventListener("mousemove", this._onMouseMove.bind(this));
        this.view.addEventListener("mouseup", this._onMouseUp.bind(this));
        this.view.addEventListener("mouseleave", this._onMouseLeave.bind(this));
        this.view.addEventListener("mousewheel", this._onMouseWheel.bind(this));
    }

    _init() {
        let modConfig = WT_g3000_ModConfig.INSTANCE;
        this._model = new WT_MapModel(this.airplane);
        this.view.setModel(this.model);
        this._initModel(modConfig);
        this._initView(modConfig);
        this._initListeners();

        this._isReady = true;
    }

    _onMouseDown(event) {
        this._isMouseDown = true;
        this._lastMousePos.set(event.x, event.y);
    }

    _onMouseMove(event) {
        if (this._isMouseDown) {
            this._scrollDelta.add(this._lastMousePos).subtract(event.x, event.y);
            this._lastMousePos.set(event.x, event.y);
            this.setFollowAirplane(false);
        }
    }

    _onMouseUp(event) {
        this._isMouseDown = false;
    }

    _onMouseLeave(event) {
        this._isMouseDown = false;
    }

    _onMouseWheel(event) {
        if (event.deltaY < 0) {
            this._changeRange(-1);
        } else if (event.deltaY > 0) {
            this._changeRange(1);
        }
    }

    isFollowingAirplane() {
        return this._isFollowingAirplane;
    }

    setCenter(center) {
        this.model.target = this._target.set(center);
    }

    setShowAirplane(value) {
        this._airplaneLayer.setEnabled(value);
    }

    setFollowAirplane(value) {
        this._isFollowingAirplane = value;
    }

    setShowIsolines(value) {
        this.model.terrain.showIsolines = value;
    }

    async _doStartBackOnTrack() {
        await this._fpm.syncActiveFromGame();
        Coherent.trigger("ON_BACK_ON_TRACK_START");
        this.setShowAirplane(true);
        this.setCenter(this.model.airplane.navigation.position());

        if (this._hidePlaneTimeout) {
            clearTimeout(this._hidePlaneTimeout);
        }
        this._hidePlaneTimeout = setTimeout(() => {
            Coherent.trigger("ON_BACK_ON_TRACK_END");
            this.setShowAirplane(false);
        }, 20000);
    }

    startBackOnTrack() {
        this._doStartBackOnTrack();
    }

    _changeRange(delta) {
        let newIndex = Math.max(0, Math.min(WT_VFRMapWT.MAP_RANGE_LEVELS.length, this._rangeIndex + delta));
        this._rangeIndex = newIndex;
    }

    _updateICAOWaypointFactory() {
        this._icaoWaypointFactory.update();
    }

    _updateFlightPlanManager() {
        let currentTime = Date.now();
        if (currentTime - this._fpm.lastActivePlanSyncTime >= WT_VFRMapWT.FLIGHT_PLAN_SYNC_INTERVAL) {
            this._fpm.syncActiveFromGame(true);
        }
        this._fpm.update(currentTime);
    }

    _updateScrollInputs() {
        let scrollUp = GetInputStatus("PLANE", "KEY_VFRMAP_SCROLL_UP");
        let scrollDown = GetInputStatus("PLANE", "KEY_VFRMAP_SCROLL_DOWN");
        let scrollLeft = GetInputStatus("PLANE", "KEY_VFRMAP_SCROLL_LEFT");
        let scrollRight = GetInputStatus("PLANE", "KEY_VFRMAP_SCROLL_RIGHT");
        let scrollX = 0;
        let scrollY = 0;
        if (scrollUp === EInputStatus.down) {
            scrollY = WT_VFRMapWT.HOTKEY_SCROLL_STEP;
        }
        else if (scrollDown === EInputStatus.down) {
            scrollY = -WT_VFRMapWT.HOTKEY_SCROLL_STEP;
        }
        if (scrollLeft === EInputStatus.down) {
            scrollX = WT_VFRMapWT.HOTKEY_SCROLL_STEP;
        }
        else if (scrollRight === EInputStatus.down) {
            scrollX = -WT_VFRMapWT.HOTKEY_SCROLL_STEP;
        }

        if (scrollX || scrollY) {
            this._scrollDelta.set(scrollX, scrollY);
            this.setFollowAirplane(false);
        }
    }

    _updateZoomInputs() {
        let zoomIn = GetInputStatus("PLANE", "KEY_VFRMAP_ZOOM_IN");
        let zoomOut = GetInputStatus("PLANE", "KEY_VFRMAP_ZOOM_OUT");
        if (zoomIn === EInputStatus.pressed) {
            this._changeRange(-1);
        }
        else if (zoomOut === EInputStatus.pressed) {
            this._changeRange(1);
        }
    }

    _updateInputs() {
        this._updateScrollInputs();
        this._updateZoomInputs();
    }

    _updateRange() {
        this.model.range = WT_VFRMapWT.MAP_RANGE_LEVELS[this._rangeIndex];
    }

    _scroll() {
        if (this._scrollDelta.length === 0) {
            return;
        }

        this.view.projection.invert(this._scrollDelta.add(this.view.projection.viewTarget), this._target);
        this._scrollDelta.set(0, 0);
    }

    /**
     *
     * @param {WT_GeoPoint} target
     */
    _handleLatitudeCompensation(target) {
        let longDimensionFactor = Math.max(1, this.view.viewWidth / this.view.viewHeight);
        let latDelta = this.model.range.asUnit(WT_Unit.GA_RADIAN) * Avionics.Utils.RAD2DEG * longDimensionFactor * 0.5;
        let edgeLat = target.lat + (target.lat >= 0 ? 1 : -1) * latDelta;
        if (Math.abs(edgeLat) > WT_VFRMapWT.MAX_LATITUDE) {
            let compensatedLat = Math.max(0, WT_VFRMapWT.MAX_LATITUDE - latDelta) * (target.lat >= 0 ? 1 : -1);
            target.set(compensatedLat, target.long);
        }
    }

    _updateTarget() {
        if (this.isFollowingAirplane()) {
            this.model.airplane.navigation.position(this._target);
        } else {
            this._scroll();
        }

        this._handleLatitudeCompensation(this._target);

        this.model.target = this._target;
    }

    _updateView() {
        this.view.update();
        this._waypointRenderer.update(this.view.state);
    }

    onUpdate(deltaTime) {
        this._updateICAOWaypointFactory();
        this._updateFlightPlanManager();
        this._updateInputs();
        this._updateRange();
        this._updateTarget();
        this._updateView();
    }
}
WT_VFRMapWT.MAX_LATITUDE = 85;
WT_VFRMapWT.FLIGHT_PLAN_SYNC_INTERVAL = 3000; // ms
WT_VFRMapWT.HOTKEY_SCROLL_STEP = 10;

WT_VFRMapWT.BORDER_LOD_RESOLUTION_THRESHOLDS = [
    WT_Unit.NMILE.createNumber(0),
    WT_Unit.NMILE.createNumber(0.06),
    WT_Unit.NMILE.createNumber(0.3),
    WT_Unit.NMILE.createNumber(0.9),
    WT_Unit.NMILE.createNumber(3)
];
WT_VFRMapWT.ROAD_LOD_RESOLUTION_THRESHOLDS = [
    WT_Unit.NMILE.createNumber(0),
    WT_Unit.NMILE.createNumber(0.01),
    WT_Unit.NMILE.createNumber(0.05),
    WT_Unit.NMILE.createNumber(0.3)
];
WT_VFRMapWT.MAP_RANGE_LEVELS = [0.25, 0.5, 0.75, 1, 1.5, 2.5, 4, 5, 7.5, 10, 15, 25, 40, 50, 75, 100, 150, 250, 400, 500, 750, 1000, 1250, 1500, 1750, 2000].map(range => new WT_NumberUnit(range, WT_Unit.NMILE));
WT_VFRMapWT.MAP_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(25);

WT_VFRMapWT.STATE_BORDER_RANGE = WT_Unit.NMILE.createNumber(750);

WT_VFRMapWT.AIRPORT_LARGE_RANGE = WT_Unit.NMILE.createNumber(500);
WT_VFRMapWT.AIRPORT_MEDIUM_RANGE = WT_Unit.NMILE.createNumber(100);
WT_VFRMapWT.AIRPORT_SMALL_RANGE = WT_Unit.NMILE.createNumber(25);

WT_VFRMapWT.CITY_LARGE_RANGE = WT_Unit.NMILE.createNumber(1000);
WT_VFRMapWT.CITY_MEDIUM_RANGE = WT_Unit.NMILE.createNumber(100);
WT_VFRMapWT.CITY_SMALL_RANGE = WT_Unit.NMILE.createNumber(25);

WT_VFRMapWT.ROAD_HIGHWAY_RANGE = WT_Unit.NMILE.createNumber(500);
WT_VFRMapWT.ROAD_PRIMARY_RANGE = WT_Unit.NMILE.createNumber(150);

window.customElements.define("vfrmap-panel", WT_VFRMapPanel);
checkAutoload();
//# sourceMappingURL=GameVFRMap.js.map