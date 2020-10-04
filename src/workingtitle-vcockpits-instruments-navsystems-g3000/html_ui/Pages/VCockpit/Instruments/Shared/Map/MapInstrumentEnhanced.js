class MapInstrumentEnhanced extends MapInstrument {
	constructor() {
		super();
		
		this._ranges = MapInstrumentEnhanced.ZOOM_RANGES_DEFAULT;
		
		/*
		 * Defines orientation of the map:
		 * hdg: current aircraft heading up
		 * trk: current ground track up
		 * north: North up
		 */
		this.orientation = "hdg";
		
		this.rotation = 0; // current rotation of map, in degrees
		
		this.airspaceMaxRange = this._ranges[10]
		this.smallAirportMaxRange = this._ranges[10];
		this.medAirportMaxRange = this._ranges[10];
		this.largeAirportMaxRange = this._ranges[10];
		this.vorMaxRange = this._ranges[10];
		this.intMaxRange = this._ranges[10];
		this.ndbMaxRange = this._ranges[10];
		this.roadHighwayMaxRange = this._ranges[10];
		this.roadTrunkMaxRange = this._ranges[10];
		this.roadPrimaryMaxRange = this._ranges[10];
	}
	
	init(arg) {
        if (arg !== undefined) {
            if (arg instanceof BaseInstrument) {
                this.instrument = arg;
                this.selfManagedInstrument = false;
                if (this.instrument instanceof NavSystem) {
                    this.gps = this.instrument;
                }
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
        if (this.gps) {
            if (!this.gps.currFlightPlanManager) {
                this.gps.currFlightPlanManager = new FlightPlanManager(this.instrument);
                this.gps.currFlightPlanManager.registerListener();
            }
            this.gps.addEventListener("FlightStart", this.onFlightStart.bind(this));
        }
        else {
            if (!this._flightPlanManager) {
                this._flightPlanManager = new FlightPlanManager(this.instrument);
                this._flightPlanManager.registerListener();
            }
        }
        let bingMapId = this.bingId;
        if (this.gps && this.gps.urlConfig.index)
            bingMapId += "_GPS" + this.gps.urlConfig.index;
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
            this.navMap = new SvgMapEnhanced(this, { svgElement: this.getElementsByTagName("svg")[0], configPath: this.configPath });
            this.navMap.lineCanvas = this.lineCanvas;
            var mapSVG = this.querySelector("#MapSVG");
            mapSVG.setAttribute("display", "visible");
            this.insertBefore(this.lineCanvas, mapSVG);
            this.wpt = this.querySelector("#WPT");
            this.dtkMap = this.querySelector("#DTKMap");
            this.disMap = this.querySelector("#DISMap");
            this.gsMap = this.querySelector("#GSMap");
            this.mapRangeElement = this.querySelector("#MapRange");
			this.mapRangeElementRange = this.mapRangeElement.getElementsByClassName("range")[0];
            this.mapOrientationElement = this.querySelector("#MapOrientation");
            if (!this.bShowOverlay) {
                this.mapRangeElement.classList.add("hide");
                this.mapOrientationElement.classList.add("hide");
            }
            this.mapNearestAirportListNoRunway = new NearestAirportList(this.instrument);
            this.mapNearestIntersectionList = new NearestIntersectionList(this.instrument);
            this.mapNearestNDBList = new NearestNDBList(this.instrument);
            this.mapNearestVorList = new NearestVORList(this.instrument);
            this.testAirspaceList = new NearestAirspaceList(this.instrument);
            this.roadNetwork = new SvgRoadNetworkElementEnhanced();
            this.cityManager = new SvgCityManager(this.navMap);
            this.airwayIterator = 0;
            this.airspaceIterator = 0;
            this.smartIterator = new SmartIterator();
            this.roadsBuffer = [];
            this.drawCounter = 0;
            this.airportLoader = new AirportLoader(this.instrument);
            this.intersectionLoader = new IntersectionLoader(this.instrument);
            this.vorLoader = new VORLoader(this.instrument);
            this.ndbLoader = new NDBLoader(this.instrument);
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
            this.npcAirplaneManager = new NPCAirplaneManagerEnhanced();
            this.airplaneIconElement = new SvgAirplaneElementEnhanced();
            this.flightPlanElement = new SvgFlightPlanElement();
            this.flightPlanElement.source = this.flightPlanManager;
            this.flightPlanElement.flightPlanIndex = 0;
            this.tmpFlightPlanElement = new SvgFlightPlanElement();
            this.tmpFlightPlanElement.source = this.flightPlanManager;
            this.tmpFlightPlanElement.flightPlanIndex = 1;
            this.directToElement = new SvgBackOnTrackElement();
            Coherent.call("RESET_ROAD_ITERATOR");
            //FacilityLoader.Instance.registerListener();
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
	
	onBeforeMapRedraw() {
        if (this.eBingMode !== EBingMode.HORIZON) {
            this.drawCounter++;
            this.drawCounter %= 100;
            this.npcAirplaneManager.update();
            if (this.showRoads && (this.getDisplayRange() <= Math.max(this.roadHighwayMaxRange, this.roadTrunkMaxRange, this.roadPrimaryMaxRange))) {
                let t0 = performance.now();
                while (this.roadsBuffer.length > 0 && (performance.now() - t0 < 1)) {
                    let road = this.roadsBuffer.pop();
                    if (road) {
                        if (road.path.length > 100) {
                            let truncRoad = {
                                id: 0,
                                path: road.path.splice(90),
                                type: road.type,
                                lod: road.lod
                            };
                            this.roadsBuffer.push(truncRoad);
                        }
                        this.roadNetwork.addRoad(road.path, road.type, road.lod);
                    }
                }
                if (this.roadsBuffer.length < 100) {
                    Coherent.call("GET_ROADS_BAG_SIZE").then((size) => {
                        let iterator = this.smartIterator.getIteration(size - 1);
                        if (isFinite(iterator)) {
                            Coherent.call("GET_ROADS_BAG", iterator).then((roadBag) => {
                                this.roadsBuffer.push(...roadBag);
                            });
                        }
                    });
                }
            }
            this.flightPlanManager.updateWaypointIndex();
            if (this.drawCounter === 25) {
                this.updateFlightPlanVisibility();
                this.flightPlanManager.updateFlightPlan();
            }
            if (this.drawCounter === 75) {
                this.flightPlanManager.updateCurrentApproach();
                if (this.debugApproachFlightPlanElement) {
                    Coherent.call("GET_APPROACH_FLIGHTPLAN").then(data => {
                        this.debugApproachFlightPlanElement.source = data;
                    });
                }
            }
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
                if (this.isDisplayingWeather()) {
                    this.navMap.setRange(this.getWeatherRange());
                }
                else {
                    this.navMap.setRange(this.getDisplayRange());
                }
                var bingRadius = this.navMap.NMWidth * 0.5 * this.rangeFactor * MapInstrumentEnhanced.OVERDRAW_FACTOR;
                if (!this.isDisplayingWeather())
                    this.updateBingMapSize();
                if (this.navMap.lastCenterCoordinates)
                    this.bingMap.setParams({ lla: this.navMap.lastCenterCoordinates, radius: bingRadius });
            }
            if (this.navMap.centerCoordinates) {
                let centerCoordinates = this.navMap.centerCoordinates;
                if (this.showAirports) {
                    this.airportLoader.searchLat = centerCoordinates.lat;
                    this.airportLoader.searchLong = centerCoordinates.long;
                    this.airportLoader.searchRange = Math.min(this.navMap.NMWidth, this.largeAirportMaxRange) * 1.5;
                    this.airportLoader.currentMapAngularHeight = this.navMap.angularHeight;
                    this.airportLoader.currentMapAngularWidth = this.navMap.angularWidth;
                    this.airportLoader.update();
                }
                if (this.showIntersections) {
                    this.intersectionLoader.searchLat = centerCoordinates.lat;
                    this.intersectionLoader.searchLong = centerCoordinates.long;
                    this.intersectionLoader.searchRange = this.navMap.NMWidth * 1.5;
                    this.intersectionLoader.currentMapAngularHeight = this.navMap.angularHeight;
                    this.intersectionLoader.currentMapAngularWidth = this.navMap.angularWidth;
                    this.intersectionLoader.update();
                }
                if (this.showVORs) {
                    this.vorLoader.searchLat = centerCoordinates.lat;
                    this.vorLoader.searchLong = centerCoordinates.long;
                    this.vorLoader.searchRange = Math.min(this.navMap.NMWidth, this.vorMaxRange) * 1.5;
                    this.vorLoader.currentMapAngularHeight = this.navMap.angularHeight;
                    this.vorLoader.currentMapAngularWidth = this.navMap.angularWidth;
                    this.vorLoader.update();
                }
                if (this.showNDBs) {
                    this.ndbLoader.searchLat = centerCoordinates.lat;
                    this.ndbLoader.searchLong = centerCoordinates.long;
                    this.ndbLoader.searchRange = Math.min(this.navMap.NMWidth, this.ndbMaxRange) * 1.5;
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
            if (this.showAirways && (this.drawCounter % 50 === 40)) {
                if (this.getDeclutteredRange() < this.intersectionMaxRange) {
                    let intersection = this.intersectionLoader.waypoints[this.airwayIterator];
                    if (intersection instanceof NearestIntersection) {
                        if (intersection.routes.length > 0 && !intersection.airwaysDrawn) {
                            for (let i = 0; i < intersection.routes.length; i++) {
                                if (intersection.routes[i]) {
                                    let routeCoordinates = new LatLong(intersection.coordinates.lat, intersection.coordinates.long);
                                    let coordinatesPrev = intersection.routes[i].prevWaypoint.GetInfos().coordinates;
                                    if (coordinatesPrev) {
                                        let routePrevStart = new LatLong(coordinatesPrev.lat, coordinatesPrev.long);
                                        let coordinatesNext = intersection.routes[i].nextWaypoint.GetInfos().coordinates;
                                        if (coordinatesNext) {
                                            let routeNextStart = new LatLong(coordinatesNext.lat, coordinatesNext.long);
                                            this.roadNetwork.addRoad([routePrevStart, routeCoordinates, routeNextStart], 101, 8);
                                            this.roadNetwork.addRoad([routePrevStart, routeCoordinates, routeNextStart], 101, 12);
                                            this.roadNetwork.addRoad([routePrevStart, routeCoordinates, routeNextStart], 101, 14);
                                            intersection.airwaysDrawn = true;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    this.airwayIterator++;
                    if (this.airwayIterator > this.intersectionLoader.waypoints.length) {
                        this.airwayIterator = 0;
                    }
                }
            }
            this.navMap.mapElements = [];
            if (!this.isDisplayingWeatherRadar() || !this.weatherHideGPS) {
				/*
				 * Because of the weird way SvgRoadNetworkElement draws its subelements, when it gets removed from the map its subelements
				 * don't get properly cleaned up and remain on the map indefinitely as static graphics. To prevent this, we will use the 
				 * hack-y workaround of ensuring SvgRoadNetworkElement is always loaded into the map so it can properly update and hide 
				 * its subelements as needed.
				 */
				this.navMap.mapElements.push(this.roadNetwork);
				
                if (this.showTraffic) {
                    if (this.getDeclutteredRange() < this.npcAirplaneMaxRange) {
                        this.navMap.mapElements.push(...this.npcAirplaneManager.npcAirplanes);
                    }
                }
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
                let margin = 0.05;
                if (this.showAirports) {
                    for (let i = 0; i < this.airportLoader.waypoints.length; i++) {
                        let airport = this.airportLoader.waypoints[i];
                        if (airport && airport.infos instanceof AirportInfo) {
                            if (this.navMap.isLatLongInFrame(airport.infos.coordinates, margin)) {
                                if (this.getDisplayRange() <= this.smallAirportMaxRange) {
                                    this.navMap.mapElements.push(airport.getSvgElement(this.navMap.index));
                                }
                                else if (this.getDisplayRange() <= this.medAirportMaxRange) {
                                    if (airport.infos.getClassSize() !== AirportSize.Small) {
                                        this.navMap.mapElements.push(airport.getSvgElement(this.navMap.index));
                                    }
                                }
                                else if (this.getDisplayRange() <= this.largeAirportMaxRange) {
                                    if (airport.infos.getClassSize() === AirportSize.Large) {
                                        this.navMap.mapElements.push(airport.getSvgElement(this.navMap.index));
                                    }
                                }
                            }
                        }
                    }
                }
                if (this.showVORs && (this.getDisplayRange() <= this.vorMaxRange/* || this.getDeclutteredRange() < this.minimizedVorMaxRange*/)) {
                    for (let i = 0; i < this.vorLoader.waypoints.length; i++) {
                        let vor = this.vorLoader.waypoints[i];
                        vor.getSvgElement(this.navMap.index).minimize = false;//this.getDeclutteredRange() > this.vorMaxRange;
                        if (this.navMap.isLatLongInFrame(vor.infos.coordinates, margin)) {
                            this.navMap.mapElements.push(vor.getSvgElement(this.navMap.index));
                        }
                    }
                }
                if (this.showNDBs && (this.getDisplayRange() <= this.ndbMaxRange/* || this.getDeclutteredRange() < this.minimizedNdbMaxRange*/)) {
                    for (let i = 0; i < this.ndbLoader.waypoints.length; i++) {
                        let ndb = this.ndbLoader.waypoints[i];
                        ndb.getSvgElement(this.navMap.index).minimize = false;//this.getDeclutteredRange() > this.ndbMaxRange;
                        if (this.navMap.isLatLongInFrame(ndb.infos.coordinates, margin)) {
                            this.navMap.mapElements.push(ndb.getSvgElement(this.navMap.index));
                        }
                    }
                }
                if (this.showIntersections && (this.getDisplayRange() <= this.intMaxRange/* || this.getDeclutteredRange() < this.minimizedIntersectionMaxRange*/)) {
                    for (let i = 0; i < this.intersectionLoader.waypoints.length; i++) {
                        let intersection = this.intersectionLoader.waypoints[i];
                        intersection.getSvgElement(this.navMap.index).minimize = false;//this.getDeclutteredRange() > this.intersectionMaxRange;
                        if (this.navMap.isLatLongInFrame(intersection.infos.coordinates, margin)) {
                            this.navMap.mapElements.push(intersection.getSvgElement(this.navMap.index));
                        }
                    }
                }
                if (this.showCities) {
                    for (let i = 0; i < this.cityManager.displayedCities.length; i++) {
                        let city = this.cityManager.displayedCities[i];
                        if (this.getDeclutteredRange() < this.smallCityMaxRange) {
                            this.navMap.mapElements.push(city);
                        }
                        else if (this.getDeclutteredRange() < this.medCityMaxRange) {
                            if (city.size !== CitySize.Small) {
                                this.navMap.mapElements.push(city);
                            }
                        }
                        else if (this.getDeclutteredRange() < this.largeCityMaxRange) {
                            if (city.size === CitySize.Large) {
                                this.navMap.mapElements.push(city);
                            }
                        }
                    }
                }
                if (this.showConstraints) {
                    for (let i = 0; i < this.constraints.length; i++) {
                        this.navMap.mapElements.push(this.constraints[i]);
                    }
                }
                if (this.flightPlanManager && this.bIsFlightPlanVisible) {
                    let l = this.flightPlanManager.getWaypointsCount();
                    if (l > 1) {
                        if (SimVar.GetSimVarValue("L:MAP_SHOW_TEMPORARY_FLIGHT_PLAN", "number") === 1) {
                            this.navMap.mapElements.push(this.tmpFlightPlanElement);
                            let lTmpFlightPlan = this.flightPlanManager.getWaypointsCount(1);
                            if (lTmpFlightPlan > 1) {
                                for (let i = 0; i < lTmpFlightPlan; i++) {
                                    let waypoint = this.flightPlanManager.getWaypoint(i, 1);
                                    if (waypoint && waypoint.ident !== "" && waypoint.ident !== "USER") {
                                        if (waypoint.getSvgElement(this.navMap.index)) {
                                            if (!this.navMap.mapElements.find(w => {
                                                return (w instanceof SvgWaypointElement) && w.source.ident === waypoint.ident;
                                            })) {
                                                this.navMap.mapElements.push(waypoint.getSvgElement(this.navMap.index));
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        this.navMap.mapElements.push(this.flightPlanElement);
                        for (let i = 0; i < l; i++) {
                            let waypoint = this.flightPlanManager.getWaypoint(i);
                            if (waypoint && waypoint.ident !== "" && waypoint.ident !== "USER") {
                                if (waypoint.getSvgElement(this.navMap.index)) {
                                    if (!this.navMap.mapElements.find(w => {
                                        return (w instanceof SvgWaypointElement) && w.source.ident === waypoint.ident;
                                    })) {
                                        this.navMap.mapElements.push(waypoint.getSvgElement(this.navMap.index));
                                    }
                                }
                            }
                        }
                    }
                    let approachWaypoints = this.flightPlanManager.getApproachWaypoints();
                    let lAppr = approachWaypoints.length;
                    for (let i = 0; i < lAppr; i++) {
                        let apprWaypoint = approachWaypoints[i];
                        if (apprWaypoint && apprWaypoint.ident !== "" && apprWaypoint.ident !== "USER") {
                            if (apprWaypoint.getSvgElement(this.navMap.index)) {
                                if (!this.navMap.mapElements.find(w => {
                                    return (w instanceof SvgWaypointElement) && w.source.ident === apprWaypoint.ident;
                                })) {
                                    this.navMap.mapElements.push(apprWaypoint.getSvgElement(this.navMap.index));
                                }
                            }
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
                this.navMap.mapElements.push(...this.maskElements);
                this.navMap.mapElements.push(...this.topOfCurveElements);
                this.navMap.mapElements = this.navMap.mapElements.sort((a, b) => { return b.sortIndex - a.sortIndex; });
                if (this.bingMap) {
                    let transform = "";
					if (!this.isDisplayingWeatherRadar()) {
						var roundedCompass = 0;
						if (this.orientation == "hdg") {
							roundedCompass = fastToFixed(SimVar.GetSimVarValue("PLANE HEADING DEGREES TRUE", "degree"), 3);
						} else if (this.orientation == "trk") {
							roundedCompass = fastToFixed(SimVar.GetSimVarValue("GPS GROUND TRUE TRACK", "degree"), 3);
						}
						transform = "rotate(" + -roundedCompass + "deg)";
					}
					this.bingMap.style.transform = transform;
					this.rotation = -roundedCompass;
                }
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
    }
	
	update() {
        this.updateVisibility();
        this.updateSize(true);
        if (this.selfManagedInstrument) {
            this.instrument.doUpdate();
        }
        if (this.wpt) {
            var wpId = SimVar.GetSimVarValue("GPS WP NEXT ID", "string");
            if (this.wpIdValue != wpId) {
                this.wpt.textContent = wpId;
                this.wpIdValue = wpId;
            }
        }
        if (this.dtkMap) {
            var wpDtk = fastToFixed(SimVar.GetSimVarValue("GPS WP DESIRED TRACK", "degree"), 0);
            if (this.wpDtkValue != wpDtk) {
                this.dtkMap.textContent = wpDtk;
                this.wpDtkValue = wpDtk;
            }
        }
        if (this.disMap) {
            var wpDis = fastToFixed(SimVar.GetSimVarValue("GPS WP DISTANCE", "nautical mile"), 1);
            if (this.wpDisValue != wpDis) {
                this.disMap.textContent = wpDis;
                this.wpDisValue = wpDis;
            }
        }
        if (this.gsMap) {
            var gs = fastToFixed(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots"), 0);
            if (this.gsValue != gs) {
                this.gsMap.textContent = gs;
                this.gsValue = gs;
            }
        }
        if (this.mapRangeElement) {
			let currentRange = this.getDisplayRange();
            if (this.rangeValue != currentRange) {
				Avionics.Utils.diffAndSet(this.mapRangeElementRange, currentRange);
                this.rangeValue = currentRange;
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
	
	setOrientation(_val) {
		switch (_val) {
			case "trk":
			case "north":
				this.orientation = _val;
				break;
			case "hdg":
			default:
				this.orientation = "hdg";
		}
		if (this.navMap) {
			this.navMap.setOrientation(this.orientation);
		}
		Avionics.Utils.diffAndSet(this.mapOrientationElement, this.orientation.toUpperCase() + " UP");
	}
	
	get templateID() { return "MapInstrumentEnhancedTemplate"; }
	
	// adapt this method to the new orientation model for compatibility purposes
	rotateWithPlane(_val) {
		if (_val) {
			this.setOrientation("hdg");
		} else {
			this.setOrientation("north");
		}
	}
	
	updateBingMapSize() {
        let w = this.curWidth;
        let h = this.curHeight;
        let max = Math.max(w, h);
		
		// to compensate for potential rotation, we need to overdraw the map
		max *= MapInstrumentEnhanced.OVERDRAW_FACTOR;
		
        if (w * h > 1 && w * h !== this.lastWH) {
            this.lastWH = w * h;
            this.bingMap.style.width = fastToFixed(max, 0) + "px";
            this.bingMap.style.height = fastToFixed(max, 0) + "px";
            this.bingMap.style.top = fastToFixed((h - max) / 2, 0) + "px";
            this.bingMap.style.left = fastToFixed((w - max) / 2, 0) + "px";
        }
    }
	
	getTrueRange() {
		return this.getDisplayRange() * MapInstrumentEnhanced.OVERDRAW_FACTOR;
	}
	
	centerOnPlane() {
		if (this.orientation == "north") {
			super.centerOnPlane();
		} else {
			// if orientation is heading or track up, we want to place the plane 33% from the bottom of the map,
			// but vector needs to be adjusted for overdraw factor of sqrt(2)
			let target = this.navMap.XYToCoordinatesFromPlaneWithRotation(new Vec2(500, 382));
			this.setNavMapCenter(target);
		}
    }
	
	get zoomRanges() {
        return this._ranges;
    }
	
	set airspaceMaxRangeIndex(_index) {
		this.airspaceMaxRange = this._ranges[Math.min(Math.max(_index, 0), this._ranges.length - 1)];
	}
	
	set smallAirportMaxRangeIndex(_index) {
		this.smallAirportMaxRange = this._ranges[Math.min(Math.max(_index, 0), this._ranges.length - 1)];
	}
	
	set medAirportMaxRangeIndex(_index) {
		this.medAirportMaxRange = this._ranges[Math.min(Math.max(_index, 0), this._ranges.length - 1)];
	}
	
	set largeAirportMaxRangeIndex(_index) {
		this.largeAirportMaxRange = this._ranges[Math.min(Math.max(_index, 0), this._ranges.length - 1)];
	}
	
	set vorMaxRangeIndex(_index) {
		this.vorMaxRange = this._ranges[Math.min(Math.max(_index, 0), this._ranges.length - 1)];
	}
	
	set intMaxRangeIndex(_index) {
		this.intMaxRange = this._ranges[Math.min(Math.max(_index, 0), this._ranges.length - 1)];
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
}
MapInstrumentEnhanced.OVERDRAW_FACTOR = Math.sqrt(2);
MapInstrumentEnhanced.ZOOM_RANGES_DEFAULT = [0.5, 1, 2, 3, 5, 10, 15, 20, 25, 35, 50, 100, 150, 200, 250, 400, 500, 750, 1000];

customElements.define("map-instrument-enhanced", MapInstrumentEnhanced);
checkAutoload();