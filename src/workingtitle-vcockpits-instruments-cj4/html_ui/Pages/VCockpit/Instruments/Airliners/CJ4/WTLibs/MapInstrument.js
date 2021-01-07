class SmartIterator {
    constructor() {
        this._minReturned = NaN;
        this._maxReturned = NaN;
    }
    getIteration(max) {
        if (isNaN(this._minReturned) || isNaN(this._maxReturned)) {
            this._minReturned = max;
            this._maxReturned = max;
            return max;
        }
        if (this._maxReturned < max) {
            this._maxReturned++;
            return this._maxReturned;
        }
        if (this._minReturned > 0) {
            this._minReturned--;
            return this._minReturned;
        }
        return NaN;
    }
}

class MapInstrument extends ISvgMapRootElement {
    constructor() {
        super();
        this.intersectionMaxRange = MapInstrument.INT_RANGE_DEFAULT;
        this.termWptsMaxRange = MapInstrument.INT_RANGE_DEFAULT -1;
        this.vorMaxRange = MapInstrument.VOR_RANGE_DEFAULT;
        this.ndbMaxRange = MapInstrument.NDB_RANGE_DEFAULT;
        this.minimizedIntersectionMaxRange = MapInstrument.INT_RANGE_MIN_DEFAULT;
        this.minimizedVorMaxRange = MapInstrument.VOR_RANGE_MIN_DEFAULT;
        this.minimizedNdbMaxRange = MapInstrument.NDB_RANGE_MIN_DEFAULT;
        this.airportMaxRanges = MapInstrument.AIRPORT_RANGES_DEFAULT;
        this.cityMaxRanges = MapInstrument.CITY_RANGES_DEFAULT;
        this.npcAirplaneMaxRange = MapInstrument.PLANE_RANGE_DEFAULT;
        this.showRoads = false;
        this.showAirspaces = false;
        this.showAirways = false;
        this.showFlightPlan = true;
        this.showIntersections = false;
        this.showTermWpts = false;
        this.showVORs = false;
        this.showNDBs = false;
        this.showAirports = false;
        this.showObstacles = false;
        this.showCities = false;
        this.showTraffic = false;
        this.showConstraints = false;
        this._ranges = MapInstrument.ZOOM_RANGES_DEFAULT;
        this.rangeIndex = 4;
        this._declutterLevel = 0;
        this.rangeFactor = 1852;
        this.wpIdValue = "";
        this.wpDtkValue = "";
        this.wpDisValue = "";
        this.gsValue = "";
        this.rangeValue = "";
        this.bingMapConfigId = 0;
        this.showBingMap = true;
        this.constraints = [];
        this.airwayIterator = 0;
        this.airspaceIterator = 0;
        this.smartIterator = new SmartIterator();
        this.drawCounter = 0;
        this.selfManagedInstrument = false;
        this.bMouseDown = false;
        this.scrollDisp = { x: 0, y: 0 };
        this._supportMouseWheel = true;
        this.svgSmooth = 5;
        this.SVG_SMOOTH_DEFAULT = 5;
        this.SVG_SMOOTH_CURSOR = 2;
        this.SVG_SMOOTH_VFR = 3;
        this.bingId = "";
        this.eBingMode = EBingMode.PLANE;
        this.eBingRef = EBingReference.SEA;
        this.bVfrMapFollowPlane = false;
        this.bVfrMapPlanePositionReady = false;
        this.bShowAirplane = true;
        this.bShowAirplaneOnWeather = false;
        this.bShowOverlay = true;
        this.bRotateWithAirplane = false;
        this.bEnableCenterOnFplnWaypoint = false;
        this.bHideFlightPlanIfBushtrip = false;
        this.bIsFlightPlanVisible = false;
        this.maskElements = [];
        this.topOfCurveElements = [];
        this.backOnTracks = [];
        this.bIsInit = false;
        this.curWidth = 0;
        this.curHeight = 0;
        this.configPath = "./";
        this.quality = Quality.high;
        this.cursorX = 50;
        this.cursorY = 50;
        this.bIsCursorDisplayed = false;
        this.weatherRanges = [5, 10, 25, 50, 100, 200, 300, 600];
        this.weatherHideGPS = false;
        this.isBushTrip = false;

        // MOD START: new class variables

        this.overdrawFactor = MapInstrument.OVERDRAW_FACTOR_DEFAULT;

        this.rangeDefinitionContext = new MapInstrument_RangeDefinitionContext(this);

        this.rangeDefinition = MapInstrument_DefaultRangeDefinition.INSTANCE; // defines how the map should interpret the target zoom levels set via setZoom()

        this.planeTrackedPosX = 0.5; // X pos of plane when map is tracking the plane; 0.5 = center, 0 = left, 1 = right;
        this.planeTrackedPosY = 0.5; // Y pos of plane when map is tracking the plane; 0.5 = center, 0 = top, 1 = bottom;

        this.rotation = 0; // current rotation of map, in degrees
        this.rotationHandler = MapInstrument_DefaultRotationHandler.INSTANCE; // returns what the rotation of the map should be in degrees

        this.showRangeDisplay = MapInstrument.RANGE_DISPLAY_SHOW_DEFAULT;

        this.showRangeRing = false;
        this.showRangeCompass = false;
        this.showTrackVector = false;
        this.showFuelRing = false;
        this.showAltitudeIntercept = false;

        this.airspaceMaxRange = MapInstrument.AIRSPACE_RANGE_DEFAULT;
        this.roadHighwayMaxRange = MapInstrument.ROAD_HIGHWAY_RANGE_DEFAULT;
        this.roadTrunkMaxRange = MapInstrument.ROAD_TRUNK_RANGE_DEFAULT;
        this.roadPrimaryMaxRange = MapInstrument.ROAD_PRIMARY_RANGE_DEFAULT;

        this._todWaypoint = undefined;
        this._displayMapElements = [];
        // MOD END
    }
    get flightPlanManager() {
        return this._flightPlanManager;
    }
    setNPCAirplaneManagerTCASMode(mode) {
        this.npcAirplaneManager.useTCAS = mode;
    }
    getHideReachedWaypoints() {
        return this.flightPlanElement ? this.flightPlanElement.hideReachedWaypoints : false;
    }
    setHideReachedWaypoints(b) {
        if (this.flightPlanElement) {
            this.flightPlanElement.hideReachedWaypoints = b;
        }
    }
    get dummyObstacles() {
        if (!this._dummyObstacles) {
            let obstacleA = new SvgObstacleElement("high-voltage-pyl");
            obstacleA.lat = 47.349613;
            obstacleA.long = -122.123143;
            obstacleA.alt = 328;
            let obstacleB = new SvgObstacleElement("radio-tower");
            obstacleB.lat = 47.277525;
            obstacleB.long = -122.291616;
            obstacleB.alt = 426;
            let obstacleC = new SvgObstacleElement("radio-tower");
            obstacleC.lat = 47.263344;
            obstacleC.long = -122.348211;
            obstacleC.alt = 393;
            let obstacleD = new SvgObstacleElement("maybe-tree");
            obstacleD.lat = 47.426000;
            obstacleD.long = -122.436833;
            obstacleD.alt = 196;
            let obstacleE = new SvgObstacleElement("space-needle");
            obstacleE.lat = 47.620402;
            obstacleE.long = -122.349301;
            obstacleE.alt = 603;
            let obstacleF = new SvgObstacleElement("university-of-washington-tower");
            obstacleF.lat = 47.660527;
            obstacleF.long = -122.314670;
            obstacleF.alt = 325;
            this._dummyObstacles = [obstacleA, obstacleB, obstacleC, obstacleD, obstacleE, obstacleF];
        }
        return this._dummyObstacles;
    }
    get templateID() { return "MapInstrumentTemplate"; }
    connectedCallback() {
        this.lineCanvas = document.createElement("canvas");
        this.lineCanvas.id = "line-canvas";
        this.lineCanvas.style.position = "absolute";
        this.lineCanvas.style.top = "0px";
        this.lineCanvas.style.left = "0px";
        this.lineCanvas.style.width = "100%";
        this.lineCanvas.style.height = "100%";
        if (this.hasAttribute("bing-id")) {
            this.bingId = this.getAttribute("bing-id");
        }
        else {
            console.warn("No BingID specified !");
        }
        if (this.hasAttribute("config-path")) {
            this.configPath = this.getAttribute("config-path");
        }
        for (let i = 0; i < MapInstrument.observedAttributes.length; i++) {
            let attr = MapInstrument.observedAttributes[i];
            if (this.hasAttribute(attr)) {
                this.attributeChangedCallback(attr, null, this.getAttribute(attr));
            }
        }
        super.connectedCallback();
    }
    static get observedAttributes() {
        return [
            "bing-mode",
            "bing-ref",
            "show-bing-map",
            "show-airplane",
            "show-overlay",
            "show-roads",
            "show-airspaces",
            "show-airways",
            "show-flightplan",
            "hide-flightplan-if-bushtrip",
            "show-waypoints",
            "show-obstacles",
            "show-constraints",
            "show-vors",
            "show-intersections",
            "show-termwpts",
            "show-ndbs",
            "show-airports",
            "show-cities",
            "show-traffic",
        ];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        let lowercaseName = name.toLowerCase();
        if (lowercaseName == "bing-mode") {
            var attr = newValue.toLowerCase();
            if (attr === "vfr") {
                this.eBingMode = EBingMode.VFR;
            }
            else if (attr === "horizon") {
                this.eBingMode = EBingMode.HORIZON;
            }
            else {
                this.eBingMode = EBingMode.PLANE;
            }
            if (this.bingMap)
                this.bingMap.setMode(this.eBingMode);
        }
        else if (lowercaseName == "bing-ref") {
            var attr = newValue.toLowerCase();
            if (attr === "plane") {
                this.eBingRef = EBingReference.PLANE;
            }
            else {
                this.eBingRef = EBingReference.SEA;
            }
            if (this.bingMap)
                this.bingMap.setReference(this.eBingRef);
        }
        else if (lowercaseName === "show-bing-map") {
            if (newValue === "true") {
                this.showBingMap = true;
                if (this.bingMap) {
                    this.bingMap.setVisible(true);
                }
            }
            else {
                this.showBingMap = false;
                if (this.bingMap) {
                    this.bingMap.setVisible(false);
                }
            }
        }
        else if (lowercaseName === "show-airplane") {
            if (newValue === "false" || newValue == null)
                this.bShowAirplane = false;
            else
                this.bShowAirplane = true;
        }
        else if (lowercaseName === "show-overlay") {
            if (newValue === "false" || newValue == null)
                this.bShowOverlay = false;
            else
                this.bShowOverlay = true;
        }
        else if (lowercaseName === "show-roads") {
            this.showRoads = false;
            if (newValue === "true") {
                this.showRoads = true;
            }
        }
        else if (lowercaseName === "show-cities") {
            this.showCities = false;
            if (newValue === "true") {
                this.showCities = true;
            }
        }
        else if (lowercaseName === "show-airspaces") {
            this.showAirspaces = false;
            if (newValue === "true") {
                this.showAirspaces = true;
            }
        }
        else if (lowercaseName === "show-airways") {
            this.showAirways = false;
            if (newValue === "true") {
                this.showAirways = true;
            }
        }
        else if (lowercaseName === "show-flightplan") {
            this.showFlightPlan = false;
            if (newValue === "true") {
                this.showFlightPlan = true;
                this.updateFlightPlanVisibility();
            }
        }
        else if (lowercaseName === "hide-flightplan-if-bushtrip") {
            this.bHideFlightPlanIfBushtrip = false;
            if (newValue === "true") {
                this.bHideFlightPlanIfBushtrip = true;
                this.bIsFlightPlanVisible = false;
                this.updateFlightPlanVisibility();
            }
        }
        else if (lowercaseName === "show-vors") {
            this.showVORs = false;
            if (newValue === "true") {
                this.showVORs = true;
            }
        }
        else if (lowercaseName === "show-intersections") {
            this.showIntersections = false;
            if (newValue === "true") {
                this.showIntersections = true;
            }
        }
        else if (lowercaseName === "show-termwpts") {
            this.showTermWpts = false;
            if (newValue === "true") {
                this.showTermWpts = true;
            }
        }
        else if (lowercaseName === "show-ndbs") {
            this.showNDBs = false;
            if (newValue === "true") {
                this.showNDBs = true;
            }
        }
        else if (lowercaseName === "show-airports") {
            this.showAirports = false;
            if (newValue === "true") {
                this.showAirports = true;
            }
        }
        else if (lowercaseName === "show-obstacles") {
            this.showObstacles = false;
            if (newValue === "true") {
                this.showObstacles = true;
            }
        }
        else if (lowercaseName === "show-traffic") {
            this.showTraffic = false;
            if (newValue === "true") {
                this.showTraffic = true;
            }
        }
        else if (lowercaseName === "show-constraints") {
            this.showConstraints = false;
            if (newValue === "true") {
                this.showConstraints = true;
            }
        }
    }
    isInit() {
        return this.bIsInit;
    }
    init(arg) {
        if (arg !== undefined) {
            if (arg instanceof BaseInstrument) {
                this.instrument = arg;
                this.useSvgImages = true;
                this.selfManagedInstrument = false;
            }
            else {
                this.instrument = document.createElement("base-instrument");
                this.selfManagedInstrument = true;
                if (typeof (arg) === "string") {
                    this.instrument.setInstrumentIdentifier(arg);
                }
            }
        }
        else {
        }
        this._flightPlanManager = this.instrument.flightPlanManager;
        if (this._flightPlanManager) {
            this.instrument.addEventListener("FlightStart", this.onFlightStart.bind(this));
        }
        else {
            this._flightPlanManager = new FlightPlanManager(this.instrument);
        }
        let bingMapId = this.bingId;
        if (this.instrument.urlConfig.index)
            bingMapId += "_GPS" + this.instrument.urlConfig.index;
        this.bingMap = this.getElementsByTagName("bing-map")[0];
        this.bingMap.setMode(this.eBingMode);
        this.bingMap.setReference(this.eBingRef);
        this.bingMap.setBingId(bingMapId);
        this.bingMap.setVisible(this.showBingMap);
        this.bVfrMapPlanePositionReady = true;
        if (this.eBingMode === EBingMode.VFR || this.eBingMode === EBingMode.CURSOR) {
            this.bVfrMapPlanePositionReady = false;
        }
        SimVar.SetSimVarValue("L:AIRLINER_MCDU_CURRENT_FPLN_WAYPOINT", "number", -1);
        if (this.eBingMode !== EBingMode.HORIZON) {
            this.navMap = new SvgMap(this, { svgElement: this.getElementsByTagName("svg")[0], configPath: this.configPath });
            this.navMap.lineCanvas = this.lineCanvas;
            var mapSVG = this.querySelector("#MapSVG");
            mapSVG.setAttribute("display", "visible");
            this.insertBefore(this.lineCanvas, mapSVG);
            this.wpt = this.querySelector("#WPT");
            this.dtkMap = this.querySelector("#DTKMap");
            this.disMap = this.querySelector("#DISMap");
            this.gsMap = this.querySelector("#GSMap");
            this.mapRangeElement = this.querySelector("#MapRange");
            this.mapRangeElementRange = this.mapRangeElement.getElementsByClassName("range")[0]; // MOD: new range display text box
            this.mapOrientationElement = this.querySelector("#MapOrientation");
            if (!this.bShowOverlay) {
                this.mapRangeElement.classList.add("hide");
                this.mapOrientationElement.classList.add("hide");
            }
            // this.mapNearestAirportListNoRunway = new NearestAirportList(this.instrument);
            // this.mapNearestIntersectionList = new NearestIntersectionList(this.instrument);
            // this.mapNearestNDBList = new NearestNDBList(this.instrument);
            // this.mapNearestVorList = new NearestVORList(this.instrument);
            // this.testAirspaceList = new NearestAirspaceList(this.instrument);
            //this.roadNetwork = new SvgRoadNetworkElement();
            this.cityManager = new SvgCityManager(this.navMap);
            this.airwayIterator = 0;
            this.airspaceIterator = 0;
            this.smartIterator = new SmartIterator();
            this.roadsBuffer = [];
            this.drawCounter = 0;
            this.airportLoader = new AirportLoader(this.instrument, false);
            this.airportLoader.maxItemsSearchCount = 30;
            this.airportLoader.searchRange = this.navMap.NMWidth * 1.5;
            this.airportLoader.speed = 10000;
            this.intersectionLoader = new IntersectionLoader(this.instrument, true, false);
            this.intersectionLoader.maxItemsSearchCount = 30;
            this.intersectionLoader.searchRange = this.navMap.NMWidth * 2;
            this.intersectionLoader.speed = 7500;
            this.termWptsLoader = new IntersectionLoader(this.instrument, true, true, "TermWptsLoader");
            this.termWptsLoader.maxItemsSearchCount = 30;
            this.termWptsLoader.searchRange = this.navMap.NMWidth;
            this.termWptsLoader.speed = 10000;
            this.vorLoader = new VORLoader(this.instrument);
            this.vorLoader.maxItemsSearchCount = 30;
            this.vorLoader.searchRange = this.navMap.NMWidth * 2;
            this.vorLoader.speed = 7500;
            this.ndbLoader = new NDBLoader(this.instrument);
            this.ndbLoader.maxItemsSearchCount = 30;
            this.ndbLoader.searchRange = this.navMap.NMWidth * 1.5;
            this.ndbLoader.speed = 15000;
            this.nearestAirspacesLoader = new NearestAirspacesLoader(this.instrument);
            this.nearestAirspacesLoader.onNewAirspaceAddedCallback = (airspace) => {
                if (airspace) {
                    this.roadsBuffer.push({
                        id: 0,
                        path: airspace.segments,
                        type: airspace.type + 100,
                        lod: 8
                    }, {
                        id: 0,
                        path: airspace.segments,
                        type: airspace.type + 100,
                        lod: 12
                    }, {
                        id: 0,
                        path: airspace.segments,
                        type: airspace.type + 100,
                        lod: 14
                    });
                }
            };
            this.npcAirplaneManager = new NPCAirplaneManager();
            this.airplaneIconElement = new SvgAirplaneElement();
            this.flightPlanElement = new SvgFlightPlanElement();
            this.flightPlanElement.source = this.flightPlanManager;
            this.flightPlanElement.flightPlanIndex = 0;
            this.tmpFlightPlanElement = new SvgFlightPlanElement();
            this.tmpFlightPlanElement.source = this.flightPlanManager;
            this.tmpFlightPlanElement.flightPlanIndex = 1;
            this.directToElement = new SvgBackOnTrackElement();
            Coherent.call("RESET_ROAD_ITERATOR");
            this.addEventListener("mousedown", this.OnMouseDown.bind(this));
            this.addEventListener("mousemove", this.OnMouseMove.bind(this));
            this.addEventListener("mouseup", this.OnMouseUp.bind(this));
            this.addEventListener("mouseleave", this.OnMouseUp.bind(this));
            this.addEventListener("mousewheel", this.OnMouseWheel.bind(this));
        }
        this.loadBingMapConfig();
        if (this.bingMap.isReady())
            this.onBingMapReady();
        else
            this.bingMap.addEventListener("BingMapReady", this.onBingMapReady.bind(this));
        this.cursorSvg = this.querySelector("#MapCursor");
        this.weatherSVG = this.querySelector("#WeatherSVG");
        window.document.addEventListener("OnVCockpitPanelAttributesChanged", this.updateVisibility.bind(this));
        this.bIsInit = true;
    }
    onFlightStart() {
        this.checkBushTripCase();
    }
    onBingMapReady() {
        this.checkBushTripCase();
    }
    checkBushTripCase() {
        if (this.eBingMode !== EBingMode.HORIZON) {
            Coherent.call("GET_IS_BUSHTRIP").then(v => {
                this.isBushTrip = v;
                if (this.isBushTrip)
                    console.log("Bushtrip Detected");
                if (this.flightPlanElement) {
                    this.flightPlanElement.highlightActiveLeg = !this.isBushTrip;
                    this.flightPlanElement.hideReachedWaypoints = !this.isBushTrip;
                }
                this.updateFlightPlanVisibility();
            });
        }
    }
    updateFlightPlanVisibility() {
        if (this.showFlightPlan) {
            if (this.bHideFlightPlanIfBushtrip) {
                if (this.isBushTrip) {
                    this.bIsFlightPlanVisible = false;
                }
                else {
                    this.bIsFlightPlanVisible = true;
                }
            }
            else {
                this.bIsFlightPlanVisible = true;
            }
        }
        else {
            this.bIsFlightPlanVisible = false;
        }
    }

    onBeforeMapRedraw() {
        if (this.eBingMode !== EBingMode.HORIZON) {
            this.rotation = this.rotationHandler.getRotation();
            this.drawCounter++;
            this.drawCounter %= 100;
            this.npcAirplaneManager.update();
            // if (this.showRoads && (this.getDisplayRange() <= Math.max(this.roadHighwayMaxRange, this.roadTrunkMaxRange, this.roadPrimaryMaxRange))) {
            //     let t0 = performance.now();
            //     while (this.roadsBuffer.length > 0 && (performance.now() - t0 < 1)) {
            //         let road = this.roadsBuffer.pop();
            //         if (road) {
            //             if (road.path.length > 100) {
            //                 let truncRoad = {
            //                     id: 0,
            //                     path: road.path.splice(90),
            //                     type: road.type,
            //                     lod: road.lod
            //                 };
            //                 this.roadsBuffer.push(truncRoad);
            //             }
            //             this.roadNetwork.addRoad(road.path, road.type, road.lod);
            //         }
            //     }
            //     if (this.roadsBuffer.length < 100) {
            //         Coherent.call("GET_ROADS_BAG_SIZE").then((size) => {
            //             let iterator = this.smartIterator.getIteration(size - 1);
            //             if (isFinite(iterator)) {
            //                 Coherent.call("GET_ROADS_BAG", iterator).then((roadBag) => {
            //                     this.roadsBuffer.push(...roadBag);
            //                 });
            //             }
            //         });
            //     }
            // }

            this.flightPlanManager.updateWaypointIndex();
            //this.updateFlightPlanVisibility();
            this.flightPlanManager.updateFlightPlan();

            if (!this.showConstraints && this.constraints && this.constraints.length > 0) {
                this.constraints = [];
            }
            if (this.drawCounter === 45 || (this.showConstraints && (!this.constraints || this.constraints.length === 0))) {
                if (this.showConstraints) {
                    let wpWithConstraints = this.flightPlanManager.getWaypointsWithAltitudeConstraints();
                    this.constraints = [];
                    for (let i = 0; i < wpWithConstraints.length; i++) {
                        let svgConstraint = new SvgConstraintElement(wpWithConstraints[i]);
                        this.constraints.push(svgConstraint);
                    }
                }
            }
            let lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
            let long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
            let planeLla;
            let needCenterOnPlane = false;
            if (lat && long && isFinite(lat) && isFinite(long)) {
                planeLla = new LatLongAlt(lat, long);
                let unsmoothedMove = this.navMap.setPlaneCoordinates(lat, long, 0.95);
                if (unsmoothedMove) {
                    console.warn("Plane appears to have been teleported. FlightPlan active Waypoint index recalculated.");
                    this.flightPlanManager.recomputeActiveWaypointIndex();
                }
                if (this.eBingMode === EBingMode.PLANE) {
                    needCenterOnPlane = true;
                    if (this.bEnableCenterOnFplnWaypoint) {
                        let airlinerMcduCurrentFplnWaypointIndex = SimVar.GetSimVarValue("L:AIRLINER_MCDU_CURRENT_FPLN_WAYPOINT", "number");
                        if (airlinerMcduCurrentFplnWaypointIndex >= 0) {
                            if (this.flightPlanManager) {
                                let airlinerMcduCurrentFplnWaypoint = this.flightPlanManager.getWaypoint(airlinerMcduCurrentFplnWaypointIndex, NaN, true);
                                if (airlinerMcduCurrentFplnWaypoint && airlinerMcduCurrentFplnWaypoint.infos.coordinates) {
                                    this.setNavMapCenter(airlinerMcduCurrentFplnWaypoint.infos.coordinates);
                                    needCenterOnPlane = false;
                                }
                            }
                        }
                    }
                }
                else if (!this.bVfrMapPlanePositionReady) {
                    needCenterOnPlane = true;
                    if (SimVar.GetSimVarValue("GROUND VELOCITY", "knots") > 10) {
                        setTimeout(() => {
                            this.bVfrMapPlanePositionReady = true;
                        }, 3000);
                    }
                }
                else if (this.eBingMode === EBingMode.VFR && this.bVfrMapFollowPlane) {
                    needCenterOnPlane = true;
                }
            }
            if (needCenterOnPlane)
                this.centerOnPlane();
            else
                this.scrollMap(this.scrollDisp.x, this.scrollDisp.y);
            this.scrollDisp.x = 0;
            this.scrollDisp.y = 0;
            if (this.bingMap) {
                let rangeTarget = this.getDisplayRange() * 1000 / Math.abs(this.rangeDefinition.getRangeDefinition(this.rangeDefinitionContext));
                this.navMap.setRange(rangeTarget);
                var bingRadius = this.navMap.NMWidth * 0.5 * this.rangeFactor * this.overdrawFactor; // MOD: Need to expand map range to compensate for overdraw
                if (!this.isDisplayingWeather())
                    this.updateBingMapSize();
                if (this.navMap.lastCenterCoordinates)
                    this.bingMap.setParams({ lla: this.navMap.lastCenterCoordinates, radius: bingRadius });
            }
            if (typeof CJ4_MFD === 'function' && planeLla && (this.drawCounter % 2 === 1)) {
                let centerCoordinates = planeLla;
                if (this.showAirports) {
                    this.airportLoader.searchLat = centerCoordinates.lat;
                    this.airportLoader.searchLong = centerCoordinates.long;
                    this.airportLoader.currentMapAngularHeight = this.navMap.angularHeight;
                    this.airportLoader.currentMapAngularWidth = this.navMap.angularWidth;
                    this.airportLoader.update();
                }
                if (this.showIntersections) {
                    this.intersectionLoader.searchLat = centerCoordinates.lat;
                    this.intersectionLoader.searchLong = centerCoordinates.long;
                    this.intersectionLoader.currentMapAngularHeight = this.navMap.angularHeight;
                    this.intersectionLoader.currentMapAngularWidth = this.navMap.angularWidth;
                    this.intersectionLoader.update();
                }
                if (this.showTermWpts) {
                    this.termWptsLoader.searchLat = centerCoordinates.lat;
                    this.termWptsLoader.searchLong = centerCoordinates.long;
                    this.termWptsLoader.currentMapAngularHeight = this.navMap.angularHeight;
                    this.termWptsLoader.currentMapAngularWidth = this.navMap.angularWidth;
                    this.termWptsLoader.update();
                }
                if (this.showVORs) {
                    this.vorLoader.searchLat = centerCoordinates.lat;
                    this.vorLoader.searchLong = centerCoordinates.long;
                    this.vorLoader.currentMapAngularHeight = this.navMap.angularHeight;
                    this.vorLoader.currentMapAngularWidth = this.navMap.angularWidth;
                    this.vorLoader.update();
                }
                if (this.showNDBs) {
                    this.ndbLoader.searchLat = centerCoordinates.lat;
                    this.ndbLoader.searchLong = centerCoordinates.long;
                    this.ndbLoader.currentMapAngularHeight = this.navMap.angularHeight;
                    this.ndbLoader.currentMapAngularWidth = this.navMap.angularWidth;
                    this.ndbLoader.update();
                }
                if (this.showCities) {
                    this.cityManager.update();
                }
                if (this.showAirspaces) {
                    if (this.drawCounter === 50) {
                        this.nearestAirspacesLoader.lla.lat = centerCoordinates.lat;
                        this.nearestAirspacesLoader.lla.long = centerCoordinates.long;
                        this.nearestAirspacesLoader.update();
                    }
                }
            }
            // if (this.showAirways && (this.drawCounter % 50 === 40)) {
            //     if (this.getDeclutteredRange() <= this.intersectionMaxRange) {
            //         let intersection = this.intersectionLoader.waypoints[this.airwayIterator];
            //         if (intersection instanceof NearestIntersection) {
            //             if (intersection.routes.length > 0 && !intersection.airwaysDrawn) {
            //                 for (let i = 0; i < intersection.routes.length; i++) {
            //                     if (intersection.routes[i]) {
            //                         let routeCoordinates = new LatLong(intersection.coordinates.lat, intersection.coordinates.long);
            //                         let coordinatesPrev = intersection.routes[i].prevWaypoint.GetInfos().coordinates;
            //                         if (coordinatesPrev) {
            //                             let routePrevStart = new LatLong(coordinatesPrev.lat, coordinatesPrev.long);
            //                             let coordinatesNext = intersection.routes[i].nextWaypoint.GetInfos().coordinates;
            //                             if (coordinatesNext) {
            //                                 let routeNextStart = new LatLong(coordinatesNext.lat, coordinatesNext.long);
            //                                 this.roadNetwork.addRoad([routePrevStart, routeCoordinates, routeNextStart], 101, 8);
            //                                 this.roadNetwork.addRoad([routePrevStart, routeCoordinates, routeNextStart], 101, 12);
            //                                 this.roadNetwork.addRoad([routePrevStart, routeCoordinates, routeNextStart], 101, 14);
            //                                 intersection.airwaysDrawn = true;
            //                             }
            //                         }
            //                     }
            //                 }
            //             }
            //         }
            //         this.airwayIterator++;
            //         if (this.airwayIterator > this.intersectionLoader.waypoints.length) {
            //             this.airwayIterator = 0;
            //         }
            //     }
            // }
            if ((this.drawCounter % 5 === 1)) {
                this.navMap.mapElements = [];
                this._displayMapElements = [];
                if (!this.isDisplayingWeatherRadar() || !this.weatherHideGPS) {
                    /*
                     * Because of the weird way SvgRoadNetworkElement draws its subelements, when it gets removed from the map its subelements
                     * don't get properly cleaned up and remain on the map indefinitely as static graphics. To prevent this, we will use the
                     * hack-y workaround of ensuring SvgRoadNetworkElement is always loaded into the map so it can properly update and hide
                     * its subelements as needed.
                     */
                    //this.navMap.mapElements.push(this.roadNetwork);

                    // if (this.showTraffic) {
                    // if (this.getDeclutteredRange() < this.npcAirplaneMaxRange) {
                    // this.navMap.mapElements.push(...this.npcAirplaneManager.npcAirplanes);
                    // }
                    // }
                    if (this.bShowAirplane) {
                        this.navMap.mapElements.push(this.airplaneIconElement);
                    }
                    if (this.showObstacles && this.navMap.centerCoordinates) {
                        if (Math.abs(this.navMap.centerCoordinates.lat - 47.6) < 2) {
                            if (Math.abs(this.navMap.centerCoordinates.long + 122.3) < 2) {
                                this.navMap.mapElements.push(...this.dummyObstacles);
                            }
                        }
                    }

                    if (this.flightPlanManager && this.bIsFlightPlanVisible) {
                        let l = this.flightPlanManager.getWaypointsCount(0);
                        if (l > 1) {

                            this.navMap.mapElements.push(this.flightPlanElement);
                            this.updateFplnWaypoints(0);
                        }

                        if (SimVar.GetSimVarValue("L:MAP_SHOW_TEMPORARY_FLIGHT_PLAN", "number") === 1) {
                            this.navMap.mapElements.push(this.tmpFlightPlanElement);
                            let lTmpFlightPlan = this.flightPlanManager.getWaypointsCount(1);
                            if (lTmpFlightPlan > 1) {
                                this.updateFplnWaypoints(1);
                            }
                        }

                        const todDist = SimVar.GetSimVarValue("L:WT_CJ4_TOD_DISTANCE", "number");
                        if (todDist > 0) {
                            this.updateTodWaypoint();
                            if (this._todWaypoint) {
                                this.navMap.mapElements.push(this._todWaypoint.getSvgElement(this.navMap.index));
                            }
                        }

                        if (this.flightPlanManager.getIsDirectTo()) {
                            this.directToElement.llaRequested = this.flightPlanManager.getDirecToOrigin();
                            this.directToElement.targetWaypoint = this.flightPlanManager.getDirectToTarget();
                            this.directToElement.planeHeading = SimVar.GetSimVarValue("PLANE HEADING DEGREES TRUE", "degree");
                            this.navMap.mapElements.push(this.directToElement);
                        }
                        if (this.tmpDirectToElement) {
                            this.navMap.mapElements.push(this.tmpDirectToElement);
                        }
                        this.navMap.mapElements.push(...this.backOnTracks);
                        if ((SimVar.GetSimVarValue("L:FLIGHTPLAN_USE_DECEL_WAYPOINT", "number") === 1) && this.flightPlanManager.decelWaypoint) {
                            this.navMap.mapElements.push(this.flightPlanManager.decelWaypoint.getSvgElement(this.navMap.index));
                        }
                        if (this.debugApproachFlightPlanElement) {
                            this.navMap.mapElements.push(this.debugApproachFlightPlanElement);
                        }
                    }

                    let margin = 0.05;
                    let maxElements = WTDataStore.get("WT_CJ4_MaxMapSymbols", 40);
                    if (this.showVORs) {
                        for (let i = 0; i < this.vorLoader.waypoints.length; i++) {
                            let vor = this.vorLoader.waypoints[i];
                            if (this._displayMapElements.length < maxElements && this.navMap.isLatLongInFrame(vor.infos.coordinates, margin)) {
                                this._displayMapElements.push(vor.getSvgElement(this.navMap.index));
                            }
                        }
                    }
                    if (this.showIntersections && (this.rangeIndex < this.intersectionMaxRange)) {
                        for (let i = 0; i < this.intersectionLoader.waypoints.length; i++) {
                            let intersection = this.intersectionLoader.waypoints[i];
                            if (this._displayMapElements.length < maxElements && this.navMap.isLatLongInFrame(intersection.infos.coordinates, margin)) {
                                this._displayMapElements.push(intersection.getSvgElement(this.navMap.index));
                            }
                        }
                    }
                    if (this.showNDBs && (this.rangeIndex < this.ndbMaxRange)) {
                        for (let i = 0; i < this.ndbLoader.waypoints.length; i++) {
                            let ndb = this.ndbLoader.waypoints[i];
                            if (this._displayMapElements.length < maxElements && this.navMap.isLatLongInFrame(ndb.infos.coordinates, margin)) {
                                this._displayMapElements.push(ndb.getSvgElement(this.navMap.index));
                            }
                        }
                    }
                    if (this.showAirports) {
                        for (let i = 0; i < this.airportLoader.waypoints.length; i++) {
                            let airport = this.airportLoader.waypoints[i];
                            if (airport && airport.infos instanceof AirportInfo) {
                                if (this._displayMapElements.length < maxElements && this.navMap.isLatLongInFrame(airport.infos.coordinates, margin)) {
                                    this._displayMapElements.push(airport.getSvgElement(this.navMap.index));
                                }
                            }
                        }
                    }
                    if (this.showTermWpts && (this.rangeIndex < this.termWptsMaxRange)) {
                        for (let i = 0; i < this.termWptsLoader.waypoints.length; i++) {
                            let intersection = this.termWptsLoader.waypoints[i];
                            if (this._displayMapElements.length < maxElements && this.navMap.isLatLongInFrame(intersection.infos.coordinates, margin)) {
                                this._displayMapElements.push(intersection.getSvgElement(this.navMap.index));
                            }
                        }
                    }

                    this.updateDisplayMapElements();

                    if (this.showCities) {
                        for (let city of this.cityManager.displayedCities) {
                            if (this.getDeclutteredRange() <= this.cityMaxRanges[city.size]) {
                                this.navMap.mapElements.push(city);
                            }
                        }
                    }
                    if (this.showConstraints) {
                        for (let i = 0; i < this.constraints.length; i++) {
                            this.navMap.mapElements.push(this.constraints[i]);
                        }
                    }

                    if (this.showTrackVector && this.trackVectorElement) {
                        this.navMap.mapElements.push(this.trackVectorElement);
                    }

                    if (this.showAltitudeIntercept && this.altitudeInterceptElement) {
                        this.navMap.mapElements.push(this.altitudeInterceptElement);
                    }

                    if (this.showFuelRing && this.fuelRingElement) {
                        this.navMap.mapElements.push(this.fuelRingElement);
                    }

                    if (this.eBingMode != EBingMode.CURSOR) {
                        if (this.showRangeRing && this.rangeRingElement) {
                            this.navMap.mapElements.push(this.rangeRingElement);
                        }
                        if (this.showRangeCompass && this.rangeCompassElement) {
                            this.navMap.mapElements.push(this.rangeCompassElement);
                        }
                    }
                    //this.navMap.mapElements.push(...this.maskElements);
                    // this.navMap.mapElements.push(...this.topOfCurveElements);
                    this.navMap.mapElements = this.navMap.mapElements.sort((a, b) => { return b.sortIndex - a.sortIndex; });
                }
                else {
                    if (this.bShowAirplaneOnWeather) {
                        this.navMap.mapElements.push(this.airplaneIconElement);
                    }
                    if (this.bingMap) {
                        let transform = "";
                        if (this.bingMap.getWeather() == EWeatherRadar.VERTICAL)
                            transform = "scale(0.75)";
                        this.bingMap.style.transform = transform;
                    }
                }
            }
            if (this.bingMap && (!this.isDisplayingWeatherRadar() || !this.weatherHideGPS)) {
                // MOD: handle bing map rotation
                this.bingMap.style.transform = "rotate(" + this.rotation + "deg)";
            }
        }
    }
    updateFplnWaypoints(fplnIdx = 0) {
        let l = this.flightPlanManager.getWaypointsCount(fplnIdx);
        if (l > 1) {
            for (let i = Math.max(0, this.flightPlanManager.getActiveWaypointIndex() - 1); i < l; i++) {
                let waypoint = this.flightPlanManager.getWaypoint(i, fplnIdx);
                if (waypoint && waypoint.ident !== "" && waypoint.ident !== "USER" && waypoint.ident !== "POI" && this.navMap.isLatLongInFrame(waypoint.infos.coordinates, 0.1)) {
                    if (waypoint.getSvgElement(this.navMap.index)) {
                        if (!this.navMap.mapElements.find(w => {
                            return (w instanceof SvgWaypointElement) && w.source.ident === waypoint.ident;
                        })) {
                            waypoint.isInFlightPlan = true;
                            this.navMap.mapElements.push(waypoint.getSvgElement(this.navMap.index));
                        }
                    }
                }
            }
        }
    }
    updateTodWaypoint() {
        const pathActive = SimVar.GetSimVarValue("L:WT_VNAV_PATH_STATUS", "number") === 3;
        const apprActive = SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "number") === 1;
        const todDistanceRemaining = SimVar.GetSimVarValue("L:WT_CJ4_TOD_REMAINING", "number");
        if (!pathActive && !apprActive && todDistanceRemaining > 0.1) {
            if (this._todWaypoint === undefined) {
                // create it
                const waypoint = new WayPoint(this._instrument);
                waypoint.type = 'W';
                waypoint.isInFlightPlan = false;

                waypoint.infos = new WayPointInfo(this._instrument);

                waypoint.ident = "TOD";
                waypoint.infos.ident = "TOD";
                waypoint.getSvgElement(this.navMap.index);
                this._todWaypoint = waypoint;
            }

            // update it
            const todDist = SimVar.GetSimVarValue("L:WT_CJ4_TOD_DISTANCE", "number");
            const todLLA = this.flightPlanManager.getCoordinatesAtNMFromDestinationAlongFlightPlan(todDist);
            this._todWaypoint.infos.coordinates = todLLA;
        }
        else {
            this._todWaypoint = undefined;
        }
    }
    updateDisplayMapElements() {
        let l = this._displayMapElements.length;
        if (l > 0) {
            let maxElements = Math.min(WTDataStore.get("WT_CJ4_MaxMapSymbols", 40), l);
            this.navMap.mapElements.push(...this._displayMapElements.slice(0, maxElements));
        }
    }
    loadBingMapConfig() {
        if (this.eBingMode !== EBingMode.HORIZON) {
            let setConfig = () => {
                if (this.navMap.configLoaded) {
                    for (let i = 0; i < 3; i++) {
                        let conf = this.navMap.config.generateBing(i);
                        if (conf)
                            this.bingMap.addConfig(conf);
                    }
                    this.bingMap.setConfig(this.bingMapConfigId);
                }
                else {
                    setTimeout(setConfig, 1000);
                }
            };
            setConfig();
        }
        else {
            var svgConfig = null;
            var svgConfigLoaded = false;
            let loadSVGConfig = () => {
                if (typeof (SvgMapConfig) !== "undefined") {
                    svgConfig = new SvgMapConfig();
                    svgConfig.load(this.configPath, () => {
                        svgConfigLoaded = true;
                    });
                }
                else {
                    setTimeout(loadSVGConfig, 200);
                }
            };
            loadSVGConfig();
            let setBingConfig = () => {
                if (svgConfigLoaded && this.instrument.isComputingAspectRatio()) {
                    for (let i = 0; i < 3; i++) {
                        let conf = svgConfig.generateBing(i);
                        if (conf) {
                            conf.aspectRatio = (this.instrument.isAspectRatioForced()) ? this.instrument.getForcedScreenRatio() : 1.0;
                            this.bingMap.addConfig(conf);
                        }
                    }
                    this.bingMap.setConfig(this.bingMapConfigId);
                }
                else {
                    setTimeout(setBingConfig, 1000);
                }
            };
            setBingConfig();
        }
    }
    update(_deltaTime) {
        this.updateVisibility();
        this.updateSize(false);
        if (this.selfManagedInstrument) {
            this.instrument.doUpdate();
            this.flightPlanManager.update(_deltaTime);
        }

        // Adapt code to new range display formatting
        if (this.mapRangeElement) {
            if (this.showRangeDisplay) {
                let currentRange = this.getDisplayRange();
                if (this.rangeValue != currentRange) {
                    Avionics.Utils.diffAndSet(this.mapRangeElementRange, MapInstrument.getFormattedRangeDisplayText(currentRange));
                    this.rangeValue = currentRange;
                }
                Avionics.Utils.diffAndSetAttribute(this.mapRangeElement, "state", "Active");
            } else {
                Avionics.Utils.diffAndSetAttribute(this.mapRangeElement, "state", "Inactive");
            }
        }
        if (this.navMap) {
            this.navMap.update();
        }
        if (this.navMap && this.navMap.centerCoordinates) {
            this.updateInputs();
        }
        if (this.bIsCursorDisplayed && this.eBingMode != EBingMode.CURSOR) {
            this.hideCursor();
        }
    }
    updateVisibility() {
        if (!this.instrument)
            return;
        var wantedQuality = this.instrument.getQuality();
        if (wantedQuality != this.quality) {
            this.quality = wantedQuality;
            this.refreshDisplay();
        }
    }
    refreshDisplay() {
        if (this.isDisplayingWeatherRadar() && this.weatherHideGPS) {
            if (this.navMap && this.navMap.svgHtmlElement)
                this.navMap.svgHtmlElement.style.display = "block";
            if (this.lineCanvas)
                this.lineCanvas.style.display = "none";
            if (this.roadNetwork)
                this.roadNetwork.setVisible(false);
            return;
        }
        if (this.quality == Quality.ultra || this.quality == Quality.high) {
            if (this.navMap && this.navMap.svgHtmlElement)
                this.navMap.svgHtmlElement.style.display = "block";
            if (this.lineCanvas)
                this.lineCanvas.style.display = "block";
            if (this.roadNetwork)
                this.roadNetwork.setVisible(true);
            this.bingMap.setVisible(this.showBingMap);
        }
        else if (this.quality == Quality.medium) {
            if (this.navMap && this.navMap.svgHtmlElement)
                this.navMap.svgHtmlElement.style.display = "block";
            if (this.lineCanvas)
                this.lineCanvas.style.display = "none";
            if (this.roadNetwork)
                this.roadNetwork.setVisible(false);
            this.bingMap.setVisible(this.showBingMap);
        }
        else {
            if (this.navMap && this.navMap.svgHtmlElement)
                this.navMap.svgHtmlElement.style.display = "none";
            if (this.lineCanvas)
                this.lineCanvas.style.display = "none";
            if (this.roadNetwork)
                this.roadNetwork.setVisible(false);
            if (this.quality == Quality.low || this.quality == Quality.hidden)
                this.bingMap.setVisible(this.showBingMap);
            else
                this.bingMap.setVisible(false);
        }
    }
    updateInputs() {
        if (this.eBingMode === EBingMode.VFR) {
            var scrollUp = GetInputStatus("PLANE", "KEY_VFRMAP_SCROLL_UP");
            var scrollDown = GetInputStatus("PLANE", "KEY_VFRMAP_SCROLL_DOWN");
            var scrollLeft = GetInputStatus("PLANE", "KEY_VFRMAP_SCROLL_LEFT");
            var scrollRight = GetInputStatus("PLANE", "KEY_VFRMAP_SCROLL_RIGHT");
            var scrollX = 0;
            var scrollY = 0;
            var scrollFactor = 10;
            if (scrollUp == EInputStatus.down) {
                scrollY = scrollFactor;
            }
            else if (scrollDown == EInputStatus.down) {
                scrollY = -scrollFactor;
            }
            if (scrollLeft == EInputStatus.down) {
                scrollX = scrollFactor;
            }
            else if (scrollRight == EInputStatus.down) {
                scrollX = -scrollFactor;
            }
            if (scrollX != 0 || scrollY != 0) {
                this.scrollDisp.x += scrollX;
                this.scrollDisp.y += scrollY;
                this.svgSmooth = this.SVG_SMOOTH_VFR;
                this.bVfrMapPlanePositionReady = true;
                this.bVfrMapFollowPlane = false;
            }
        }
        var zoomIn = GetInputStatus("PLANE", "KEY_VFRMAP_ZOOM_IN");
        var zoomOut = GetInputStatus("PLANE", "KEY_VFRMAP_ZOOM_OUT");
        if (zoomIn == EInputStatus.pressed) {
            this.zoomIn();
        }
        else if (zoomOut == EInputStatus.pressed) {
            this.zoomOut();
        }
    }
    resize() {
        this.updateSize(true);
    }
    updateSize(_bForce = false) {
        if (_bForce || this.curWidth <= 0 || this.curHeight <= 0) {
            this.curWidth = this.clientWidth;
            this.curHeight = this.clientHeight;
        }
    }

    getWidth() {
        return this.curWidth;
    }

    getHeight() {
        return this.curHeight;
    }

    getAspectRatio() {
        return this.getWidth() / this.getHeight();
    }

    get minVisibleY() {
        return 500 * (1 - Math.min(1 / this.getAspectRatio(), 1));
    }

    get maxVisibleY() {
        return 500 * (1 + Math.min(1 / this.getAspectRatio(), 1));
    }

    get minVisibleX() {
        return 500 * (1 - Math.min(this.getAspectRatio(), 1));
    }

    get maxVisibleX() {
        return 500 * (1 + Math.min(this.getAspectRatio(), 1));
    }

    onEvent(_event) {
        if (_event === "RANGE_DEC" || _event === "RNG_Zoom") {
            this.zoomIn();
        }
        if (_event === "RANGE_INC" || _event === "RNG_Dezoom") {
            this.zoomOut();
        }
        if (_event === "JOYSTICK_PUSH") {
            if (this.eBingMode === EBingMode.PLANE || this.eBingMode === EBingMode.VFR) {
                this.activateCursor();
            }
            else if (this.eBingMode === EBingMode.CURSOR) {
                this.deactivateCursor();
            }
        }
        if (_event === "ActivateMapCursor") {
            if (this.eBingMode === EBingMode.PLANE || this.eBingMode === EBingMode.VFR) {
                this.activateCursor();
            }
        }
        if (_event === "DeactivateMapCursor") {
            if (this.eBingMode === EBingMode.CURSOR) {
                this.deactivateCursor();
            }
        }
        if (this.eBingMode === EBingMode.CURSOR) {
            let cursorSpeed = 2;
            let mapSpeed = 4;
            switch (_event) {
                case "PanLeft":
                case "JOYSTICK_LEFT":
                    if (this.cursorX > 10) {
                        this.setCursorPos(this.cursorX - cursorSpeed, this.cursorY);
                    }
                    else {
                        this.scrollDisp.x += mapSpeed;
                        this.svgSmooth = this.SVG_SMOOTH_CURSOR;
                    }
                    break;
                case "PanRight":
                case "JOYSTICK_RIGHT":
                    if (this.cursorX < 90) {
                        this.setCursorPos(this.cursorX + cursorSpeed, this.cursorY);
                    }
                    else {
                        this.scrollDisp.x -= mapSpeed;
                        this.svgSmooth = this.SVG_SMOOTH_CURSOR;
                    }
                    break;
                case "PanUp":
                case "JOYSTICK_UP":
                    if (this.cursorY > 10) {
                        this.setCursorPos(this.cursorX, this.cursorY - cursorSpeed);
                    }
                    else {
                        this.scrollDisp.y += mapSpeed;
                        this.svgSmooth = this.SVG_SMOOTH_CURSOR;
                    }
                    break;
                case "PanDown":
                case "JOYSTICK_DOWN":
                    if (this.cursorY < 90) {
                        this.setCursorPos(this.cursorX, this.cursorY + cursorSpeed);
                    }
                    else {
                        this.scrollDisp.y -= mapSpeed;
                        this.svgSmooth = this.SVG_SMOOTH_CURSOR;
                    }
                    break;
            }
        }
    }
    onBackOnTrack(_lat, _long) {
        let bot;
        let previousBot = this.backOnTracks[this.backOnTracks.length - 1];
        if (previousBot) {
            let dLat = Math.abs(previousBot.llaRequested.lat - _lat);
            let dLon = Math.abs(previousBot.llaRequested.long - _long);
            if (dLat < 0.5 / 60 && dLon < 0.5 / 60) {
                bot = previousBot;
            }
            else {
                bot = new SvgBackOnTrackElement();
            }
        }
        else {
            bot = new SvgBackOnTrackElement();
        }
        bot.llaRequested = new LatLongAlt(_lat, _long);
        bot.targetWaypoint = this.flightPlanManager.getActiveWaypoint();
        this.setCenter(bot.llaRequested);
        this.setAttribute("show-airplane", "true");
        if (bot.targetWaypoint) {
            if (this.backOnTracks.indexOf(bot) === -1) {
                this.backOnTracks.push(bot);
            }
            while (this.backOnTracks.length > 15) {
                this.backOnTracks.splice(0, 1);
            }
            return true;
        }
        return false;
    }

    centerOnPlane() {
        // MOD: allow for arbitrary placement of plane
        let r_x = Math.min(this.navMap.aspectRatio, 1);
        let r_y = Math.min(1 / this.navMap.aspectRatio, 1);
        let posX = 500 * (1 - r_x) + 1000 * (1 - this.planeTrackedPosX) * r_x;
        let posY = 500 * (1 - r_y) + 1000 * (1 - this.planeTrackedPosY) * r_y;
        this.setNavMapCenter(this.navMap.XYToCoordinatesFromPlaneWithRotation(new Vec2(posX, posY)));
    }

    centerOnActiveWaypoint(_val) {
        this.bEnableCenterOnFplnWaypoint = _val;
    }

    // keeping this for back-compat
    rotateWithPlane(_val) {
        if (this.rotationHandler instanceof MapInstrument_DefaultRotationHandler) {
            this.rotationHandler.rotateWithPlane = _val;
        }
    }

    // g1000 compatibility
    setTrackUpDisabled(_val) {
        if (this.rotationHandler instanceof MapInstrument_DefaultRotationHandler) {
            this.rotationHandler.rotationDisabled = _val;
        }
    }

    setPlaneScale(_scale) {
        if (this.airplaneIconElement) {
            this.airplaneIconElement.setScale(this.navMap, _scale);
        }
    }
    setPlaneIcon(_id) {
        if (this.airplaneIconElement) {
            this.airplaneIconElement.setIcon(this.navMap, _id);
        }
    }
    set zoomRanges(_values) {
        this._ranges = _values;
    }
    get declutterLevel() {
        return this._declutterLevel;
    }
    set declutterLevel(_val) {
        this._declutterLevel = _val;
    }

    getDisplayRange() {
        return this._ranges[this.rangeIndex];
    }

    // MOD: get the actual range of the map when accounting for overdraw
    getTrueRange() {
        return this.getDisplayRange() * this.overdrawFactor;
    }

    getDeclutteredRange() {
        return this._ranges[this.rangeIndex + this._declutterLevel];
    }
    getWeatherRange() {
        return this.getDisplayRange();
        if (this.rangeIndex < this.weatherRanges.length)
            return this.weatherRanges[this.rangeIndex];
        return this.weatherRanges[this.weatherRanges.length - 1];
    }
    updateBingMapSize() {
        let w = this.curWidth;
        let h = this.curHeight;
        let max = Math.max(w, h);

        // to compensate for potential rotation, we need to overdraw the map
        max *= this.overdrawFactor;

        if (w * h > 1 && w * h !== this.lastWH) {
            this.lastWH = w * h;
            this.bingMap.style.width = fastToFixed(max, 0) + "px";
            this.bingMap.style.height = fastToFixed(max, 0) + "px";
            this.bingMap.style.top = fastToFixed((h - max) / 2, 0) + "px";
            this.bingMap.style.left = fastToFixed((w - max) / 2, 0) + "px";
        }
    }
    setBingMapStyle(_top, _left, _width, _height) {
        if (this.bingMap) {
            this.bingMap.style.top = _top;
            this.bingMap.style.left = _left;
            this.bingMap.style.width = _width;
            this.bingMap.style.height = _height;
        }
    }
    get bingMapMode() {
        return this.eBingMode;
    }
    set bingMapRef(_ref) {
        if (this.eBingRef != _ref) {
            this.eBingRef = _ref;
            if (this.bingMap)
                this.bingMap.setReference(this.eBingRef);
        }
    }
    get bingMapRef() {
        return this.eBingRef;
    }
    set mapConfigId(_id) {
        if (this.bingMapConfigId != _id) {
            this.bingMapConfigId = _id;
            if (this.bingMap)
                this.bingMap.setConfig(_id);
        }
    }
    get mapConfigId() {
        return this.bingMapConfigId;
    }
    showIsolines(_show) {
        this.bingMap.showIsolines(_show);
    }
    getIsolines() {
        return this.bingMap.getIsolines();
    }
    showWeather(_mode) {
        let cone = 0;
        if (_mode == EWeatherRadar.HORIZONTAL)
            cone = Math.PI / 2;
        else if (_mode == EWeatherRadar.VERTICAL)
            cone = Math.PI / 3.5;
        else if (_mode == EWeatherRadar.OFF) {
            if (this.weatherSVG)
                Utils.RemoveAllChildren(this.weatherSVG);
        }
        this.bingMap.showWeather(_mode, cone);
        this.bShowAirplaneOnWeather = false;
        this.weatherHideGPS = true;
        this.lastWH = 0;
        if (!this.isDisplayingWeatherRadar())
            this.updateBingMapSize();
        this.refreshDisplay();
    }
    showWeatherWithGPS(_mode, _cone) {
        if (_cone == 0) {
            if (_mode == EWeatherRadar.HORIZONTAL)
                _cone = Math.PI / 2;
            else if (_mode == EWeatherRadar.VERTICAL)
                _cone = Math.PI / 3.5;
        }
        this.bingMap.showWeather(_mode, _cone);
        this.weatherHideGPS = false;
        this.lastWH = 0;
        if (!this.isDisplayingWeatherRadar())
            this.updateBingMapSize();
        this.refreshDisplay();
    }
    getWeather() {
        return this.bingMap.getWeather();
    }
    setShowingWpt(_bool) {
        this._showingWpt = _bool;
    }
    isDisplayingWeather() {
        if (this.bingMap && (this.bingMap.getWeather() != undefined && this.bingMap.getWeather() != EWeatherRadar.OFF))
            return true;
        return false;
    }
    isDisplayingWeatherRadar() {
        if (this.bingMap && (this.bingMap.getWeather() == EWeatherRadar.HORIZONTAL || this.bingMap.getWeather() == EWeatherRadar.VERTICAL))
            return true;
        return false;
    }
    setFlightPlanAsDashed(_val) {
        if (this.flightPlanElement)
            this.flightPlanElement.setAsDashed(_val);
    }
    activateCursor() {
        if (EBingMode.VFR) {
            this.bWasCenteredOnPlane = true;
        }
        else {
            this.bWasCenteredOnPlane = false;
            this.lastCenter = this.navMap.centerCoordinates;
        }
        this.eBingMode = EBingMode.CURSOR;
        this.setCursorPos(50, 50);
    }
    deactivateCursor() {
        if (this.bWasCenteredOnPlane) {
            this.eBingMode = EBingMode.PLANE;
            this.centerOnPlane();
        }
        else {
            this.eBingMode = EBingMode.VFR;
            this.setCenter(this.lastCenter);
        }
        this.hideCursor();
    }
    setCursorPos(x, y) {
        this.cursorSvg.setAttribute("style", "left:" + x + "%;top:" + y + "%;");
        this.cursorX = x;
        this.cursorY = y;
        this.bIsCursorDisplayed = true;
    }
    hideCursor() {
        this.cursorSvg.setAttribute("style", "display: none");
        this.bIsCursorDisplayed = false;
    }
    setCenter(_coordinates) {
        if (this.eBingMode != EBingMode.CURSOR) {
            this.eBingMode = EBingMode.VFR;
            this.setNavMapCenter(_coordinates);
        }
        else {
            this.bWasCenteredOnPlane = false;
            this.lastCenter = _coordinates;
        }
    }
    setCenteredOnPlane() {
        if (this.eBingMode != EBingMode.CURSOR) {
            this.eBingMode = EBingMode.PLANE;
        }
        else {
            this.bWasCenteredOnPlane = true;
        }
    }
    setNavMapCenter(_coordinates, _smoothness = 5) {
        if (_coordinates && isFinite(_coordinates.lat) && isFinite(_coordinates.long)) {
            this.navMap.setCenterCoordinates(_coordinates.lat, _coordinates.long, _smoothness);
            if (this.eBingMode == EBingMode.VFR) {
                var latLong = _coordinates.toStringFloat();
                Coherent.trigger("ON_VFRMAP_COORDINATES_CHANGED", latLong);
            }
        }
    }
    scrollMap(_dispX, _dispY) {
        if (this.navMap.lastCenterCoordinates) {
            // MOD: Adjust for map rotation
            let hdg = -this.rotation;
            let hdgRad = hdg * Avionics.Utils.DEG2RAD;
            let newX = _dispX * Math.cos(hdgRad) - _dispY * Math.sin(hdgRad);
            let newY = _dispY * Math.cos(hdgRad) + _dispX * Math.sin(hdgRad);
            _dispX = newX;
            _dispY = newY;
            var scaleFactor = parseInt(window.getComputedStyle(this).height) / 1000;
            let long = -_dispX * this.navMap.angularWidth / (1000 * scaleFactor);
            let lat = _dispY * this.navMap.angularHeight / (1000 * scaleFactor);
            let newCoordinates = new LatLongAlt(this.navMap.lastCenterCoordinates);
            newCoordinates.long += long;
            newCoordinates.lat += lat;
            if (newCoordinates.long > 180) {
                newCoordinates.long -= 360;
            }
            else if (newCoordinates.long < -180) {
                newCoordinates.long += 360;
            }
            if (newCoordinates.lat > 90) {
                newCoordinates.lat -= 180;
            }
            else if (newCoordinates.lat < -90) {
                newCoordinates.lat += 180;
            }
            this.setNavMapCenter(newCoordinates, this.svgSmooth);
        }
    }
    zoomIn() {
        this.rangeIndex--;
        this.rangeIndex = Math.max(0, this.rangeIndex);
    }
    zoomOut() {
        this.rangeIndex++;
        this.rangeIndex = Math.min(this._ranges.length - 1, this.rangeIndex);
    }
    setZoom(_index) {
        this.rangeIndex = _index;
        this.rangeIndex = Math.max(0, this.rangeIndex);
        this.rangeIndex = Math.min(this._ranges.length - 1, this.rangeIndex);
    }
    getZoom() {
        return this.rangeIndex;
    }
    OnMouseDown(_e) {
        this.bMouseDown = true;
        this.refMousePos = { x: _e.x, y: _e.y };
    }
    OnMouseMove(_e) {
        if (this.bMouseDown && this.eBingMode === EBingMode.VFR) {
            this.scrollDisp.x += _e.x - this.refMousePos.x;
            this.scrollDisp.y += _e.y - this.refMousePos.y;
            this.refMousePos.x = _e.x;
            this.refMousePos.y = _e.y;
            this.svgSmooth = this.SVG_SMOOTH_VFR;
            this.bVfrMapPlanePositionReady = true;
            this.bVfrMapFollowPlane = false;
        }
    }
    OnMouseUp(_e) {
        this.bMouseDown = false;
    }
    OnMouseWheel(_e) {
        if (this._supportMouseWheel) {
            if (_e.deltaY < 0) {
                this.zoomIn();
            }
            else if (_e.deltaY > 0) {
                this.zoomOut();
            }
        }
    }
    supportMouseWheel(_val) {
        this._supportMouseWheel = _val;
    }

    // MOD: helpers for zoom range settings

    get zoomRanges() {
        return this._ranges;
    }

    set airspaceMaxRangeIndex(_index) {
        this.airspaceMaxRange = this._ranges[Math.min(Math.max(_index, 0), this._ranges.length - 1)];
    }

    set smallAirportMaxRangeIndex(_index) {
        this.airportMaxRanges[AirportSize.Small] = this._ranges[Math.min(Math.max(_index, 0), this._ranges.length - 1)];
    }

    set medAirportMaxRangeIndex(_index) {
        this.airportMaxRanges[AirportSize.Medium] = this._ranges[Math.min(Math.max(_index, 0), this._ranges.length - 1)];
    }

    set largeAirportMaxRangeIndex(_index) {
        this.airportMaxRanges[AirportSize.Large] = this._ranges[Math.min(Math.max(_index, 0), this._ranges.length - 1)];
    }

    set vorMaxRangeIndex(_index) {
        this.vorMaxRange = this._ranges[Math.min(Math.max(_index, 0), this._ranges.length - 1)];
    }

    set intMaxRangeIndex(_index) {
        this.intersectionMaxRange = this._ranges[Math.min(Math.max(_index, 0), this._ranges.length - 1)];
    }

    set ndbMaxRangeIndex(_index) {
        this.ndbMaxRange = this._ranges[Math.min(Math.max(_index, 0), this._ranges.length - 1)];
    }

    set roadHighwayMaxRangeIndex(_index) {
        this.roadHighwayMaxRange = this._ranges[Math.min(Math.max(_index, 0), this._ranges.length - 1)];
    }

    set roadTrunkMaxRangeIndex(_index) {
        this.roadTrunkMaxRange = this._ranges[Math.min(Math.max(_index, 0), this._ranges.length - 1)];
    }

    set roadPrimaryMaxRangeIndex(_index) {
        this.roadPrimaryMaxRange = this._ranges[Math.min(Math.max(_index, 0), this._ranges.length - 1)];
    }

    set smallCityMaxRangeIndex(_index) {
        this.cityMaxRanges[CitySize.Small] = this._ranges[Math.min(Math.max(_index, 0), this._ranges.length - 1)];
    }

    set medCityMaxRangeIndex(_index) {
        this.cityMaxRanges[CitySize.Medium] = this._ranges[Math.min(Math.max(_index, 0), this._ranges.length - 1)];
    }

    set largeCityMaxRangeIndex(_index) {
        this.cityMaxRanges[CitySize.Large] = this._ranges[Math.min(Math.max(_index, 0), this._ranges.length - 1)];
    }

    // MOD: formats range display numbers
    static getFormattedRangeDisplayText(_range) {
        if (_range >= 10) {
            return _range.toFixed(0);
        }

        let decimals = 0;
        if (_range < 1) {
            decimals = 1;
        }

        while (decimals >= 0) {
            if (Math.abs(parseFloat(_range.toFixed(decimals)) - _range) >= 0.01) {
                break;
            }
            decimals--;
        }
        return _range.toFixed(decimals + 1);
    }
}

MapInstrument.OVERDRAW_FACTOR_DEFAULT = Math.sqrt(2);
MapInstrument.ZOOM_RANGES_DEFAULT = [5, 10, 25, 50, 100, 200, 300, 600];

MapInstrument.RANGE_DISPLAY_SHOW_DEFAULT = true;

MapInstrument.INT_RANGE_DEFAULT = 4;
MapInstrument.INT_RANGE_MIN_DEFAULT = 0;
MapInstrument.VOR_RANGE_DEFAULT = 200;
MapInstrument.VOR_RANGE_MIN_DEFAULT = 0;
MapInstrument.NDB_RANGE_DEFAULT = 4;
MapInstrument.NDB_RANGE_MIN_DEFAULT = 0;
MapInstrument.AIRPORT_RANGES_DEFAULT = [35, 100, Infinity];
MapInstrument.CITY_RANGES_DEFAULT = [1500, 200, 100];
MapInstrument.PLANE_RANGE_DEFAULT = 60;
MapInstrument.AIRSPACE_RANGE_DEFAULT = Infinity;
MapInstrument.ROAD_HIGHWAY_RANGE_DEFAULT = Infinity;
MapInstrument.ROAD_TRUNK_RANGE_DEFAULT = Infinity;
MapInstrument.ROAD_PRIMARY_RANGE_DEFAULT = Infinity;

class MapInstrument_RangeDefinitionContext {
    constructor(_map) {
        this._map = _map;
    }

    get top() {
        return this._map.minVisibleY;
    }

    get bottom() {
        return this._map.maxVisibleY;
    }

    get left() {
        return this._map.minVisibleX;
    }

    get right() {
        return this._map.maxVisibleX;
    }

    get planePos() {
        return this._map.navMap.coordinatesToXY(this._map.navMap.planeCoordinates);
    }
}

class MapInstrument_DefaultRangeDefinition {
    getRangeDefinition(_context) {
        return _context.bottom - _context.top;
    }
}
MapInstrument_DefaultRangeDefinition.INSTANCE = new MapInstrument_DefaultRangeDefinition();

class MapInstrument_DefaultRotationHandler {
    constructor(_rotateWithPlane = false) {
        this.rotateWithPlane = _rotateWithPlane;
        this.rotationDisabled = false;
    }

    getRotation() {
        if (this.rotateWithPlane && !this.rotationDisabled) {
            return -SimVar.GetSimVarValue("PLANE HEADING DEGREES TRUE", "degree");
        } else {
            return 0;
        }
    }
}
MapInstrument_DefaultRotationHandler.INSTANCE = new MapInstrument_DefaultRotationHandler();

customElements.define("map-instrument", MapInstrument);
checkAutoload();