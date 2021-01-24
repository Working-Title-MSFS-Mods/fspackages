/**
 * A display of waypoints, which includes user waypoints, airports, VORs, NDBs, and intersections, and airways. The use of this layer requires the
 * .waypoints module to be added to the map model.
 */
class WT_MapViewWaypointLayer extends WT_MapViewMultiLayer {
    /**
     * @param {{airport:WT_ICAOSearcher}} icaoSearchers - searchers to use for enumerating ICAO strings of waypoints within range of the map view.
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory - a factory to create waypoint objects from ICAO strings.
     * @param {WT_MapViewWaypointCanvasRenderer} waypointRenderer - the renderer to use for drawing waypoints.
     * @param {WT_MapViewTextLabelManager} labelManager - the text label manager to use for managing waypoint labels.
     * @param {String} [className] - the name of the class to add to the new layer's top-level HTML element's class list.
     * @param {String} [configName] - the name of the property in the map view's config file to be associated with the new layer.
     */
    constructor(icaoSearchers, icaoWaypointFactory, waypointRenderer, labelManager, className = WT_MapViewWaypointLayer.CLASS_DEFAULT, configName = WT_MapViewWaypointLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._icaoSearchers = icaoSearchers;
        this._icaoWaypointFactory = icaoWaypointFactory;
        this._labelManager = labelManager;
        this._searchRequestsOpened = false;
        this._airwayWaypoints = [];

        this._airportSearch = new WT_MapViewWaypointSearch(icaoWaypointFactory.getAirports.bind(icaoWaypointFactory), WT_MapViewWaypointLayer.SEARCH_UPDATE_INTERVAL_MIN, WT_MapViewWaypointLayer.SEARCH_UPDATE_INTERVAL_MAX, WT_MapViewWaypointLayer.SEARCH_UPDATE_INTERVAL_INC_THRESHOLD);
        this._vorSearch = new WT_MapViewWaypointSearch(icaoWaypointFactory.getVORs.bind(icaoWaypointFactory), WT_MapViewWaypointLayer.SEARCH_UPDATE_INTERVAL_MIN, WT_MapViewWaypointLayer.SEARCH_UPDATE_INTERVAL_MAX, WT_MapViewWaypointLayer.SEARCH_UPDATE_INTERVAL_INC_THRESHOLD);
        this._ndbSearch = new WT_MapViewWaypointSearch(icaoWaypointFactory.getNDBs.bind(icaoWaypointFactory), WT_MapViewWaypointLayer.SEARCH_UPDATE_INTERVAL_MIN, WT_MapViewWaypointLayer.SEARCH_UPDATE_INTERVAL_MAX, WT_MapViewWaypointLayer.SEARCH_UPDATE_INTERVAL_INC_THRESHOLD);
        this._intSearch = new WT_MapViewWaypointSearch(icaoWaypointFactory.getINTs.bind(icaoWaypointFactory), WT_MapViewWaypointLayer.SEARCH_UPDATE_INTERVAL_MIN, WT_MapViewWaypointLayer.SEARCH_UPDATE_INTERVAL_MAX, WT_MapViewWaypointLayer.SEARCH_UPDATE_INTERVAL_INC_THRESHOLD);

        this._showAirport = [false, false, false];
        this._showVOR = false;
        this._showNDB = false;
        this._showINT = false;
        this._showAirway = false;

        this._standaloneWaypoints = new Set();

        this._airwaySegmentLabelCache = new WT_MapViewAirwaySegmentLabelCache(WT_MapViewWaypointLayer.AIRWAY_LABEL_CACHE_SIZE);
        this._airwayLabelsToShow = new Set();

        this._optsManager = new WT_OptionsManager(this, WT_MapViewWaypointLayer.OPTIONS_DEF);

        this._airwayLayer = new WT_MapViewPersistentCanvas(WT_MapViewWaypointLayer.AIRWAY_OVERDRAW_FACTOR);
        this._iconLayer = new WT_MapViewCanvas(true, true);
        this.addSubLayer(this._airwayLayer);
        this.addSubLayer(this._iconLayer);

        this._waypointRenderer = waypointRenderer;
        this._waypointRenderer.setCanvasContext(WT_MapViewWaypointCanvasRenderer.Context.NORMAL, this._iconLayer.buffer.context);
        this._waypointRenderer.setCanvasContext(WT_MapViewWaypointCanvasRenderer.Context.AIRWAY, this._iconLayer.buffer.context);
        this._waypointRenderer.setVisibilityHandler(WT_MapViewWaypointCanvasRenderer.Context.NORMAL, {isVisible: this._shouldShowNormalWaypoint.bind(this)});
        this._waypointStyleHandler = {getOptions: this._getWaypointStyleOptions.bind(this)};

        let airwayRendererEventHandler = {
            onStarted() {},
            onPaused: this._onAirwayRenderPaused.bind(this),
            onFinished: this._onAirwayRenderFinished.bind(this),
            onAborted: this._onAirwayRenderAborted.bind(this)
        }
        this._airwayRenderer = new WT_MapViewAirwayCanvasRenderer(airwayRendererEventHandler, this._airwayLayer.buffer.context, 300);
        this._shouldDrawUnfinishedAirways = false;

        this._viewDiagonal = 0;

        this._lastRadius = new WT_NumberUnit(0, WT_Unit.NMILE);
        this._lastCenter = {lat: 0, long: 0};
        this._searchParamChangeTimer = 0;
        this._isChangingSearchParams = false;

        this._lastSearchParams = {
            time: 0,
            center: new WT_GeoPoint(0, 0),
            radius: new WT_NumberUnit(0, WT_Unit.NMILE)
        };

        this._lastShouldSearchAirport = false;
        this._lastShouldSearchVOR = false;
        this._lastShouldSearchNDB = false;
        this._lastShouldSearchINT = false;
        this._lastStandaloneWaypointsCount = 0;
        this._lastShowAirway = false;
        this._lastTime = 0;

        this._tempNM = new WT_NumberUnit(0, WT_Unit.NMILE);
        this._tempVector1 = new WT_GVector2(0, 0);
        this._tempVector2 = new WT_GVector2(0, 0);
    }

    /**
     *
     * @param {WT_MapViewState} state - the current map view state.
     * @param {WT_Waypoint} waypoint
     */
    _shouldShowNormalWaypoint(state, waypoint) {
        let show = true;
        if (waypoint.icao !== undefined) {
            switch (waypoint.type) {
                case WT_ICAOWaypoint.Type.AIRPORT:
                    show = this._showAirport[waypoint.size];
                    break;
                case WT_ICAOWaypoint.Type.VOR:
                    show = this._showVOR;
                    break;
                case WT_ICAOWaypoint.Type.NDB:
                    show = this._showNDB;
                    break;
                case WT_ICAOWaypoint.Type.INT:
                    show = this._showINT;
                    break;
            }
        }
        return show;
    }

    /**
     * Gets icon and label style options for a waypoint.
     * @param {WT_MapViewState} state - the current map view state.
     * @param {WT_Waypoint} waypoint - the waypoint for which to get options.
     */
    _getWaypointStyleOptions(state, waypoint) {
        if (waypoint.icao) {
            switch (waypoint.type) {
                case WT_ICAOWaypoint.Type.AIRPORT:
                    return this._airportStyles[waypoint.size];
                case WT_ICAOWaypoint.Type.VOR:
                    return this._vorStyle;
                case WT_ICAOWaypoint.Type.NDB:
                    return this._ndbStyle;
                case WT_ICAOWaypoint.Type.INT:
                    return this._intStyle;
            }
        } else {
            return this._userStyle;
        }
    }

    _setCommonLabelStyles(options) {
        options.fontWeight = this.waypointLabelFontWeight;
        options.fontSize = this.waypointLabelFontSize;
        options.fontColor = this.waypointLabelFontColor;
        options.fontOutlineWidth = this.waypointLabelFontOutlineWidth;
        options.fontOutlineColor = this.waypointLabelFontOutlineColor;
        options.showBackground = this.waypointLabelShowBackground;
        if (options.showBackground) {
            options.backgroundColor = this.waypointLabelBackgroundColor;
            options.backgroundPadding = this.waypointLabelBackgroundPadding;
            options.backgroundBorderRadius = this.waypointLabelBackgroundBorderRadius;
            options.backgroundOutlineWidth = this.waypointLabelBackgroundOutlineWidth;
            options.backgroundOutlineColor = this.waypointLabelBackgroundOutlineColor;
        }
    }

    _initStyleOptions() {
        this._airportStyles = [
            {
                icon: {
                    priority: this.airportIconPriority,
                    size: this.airportIconSize
                },
                label: {
                    priority: this.airportLabelPriority,
                    alwaysShow: false,
                    offset: this.airportLabelOffset,
                }
            },
            {
                icon: {
                    priority: this.airportIconPriority - 1,
                    size: this.airportIconSize
                },
                label: {
                    priority: this.airportLabelPriority - 1,
                    alwaysShow: false,
                    offset: this.airportLabelOffset,
                }
            },
            {
                icon: {
                    priority: this.airportIconPriority - 2,
                    size: this.airportIconSize
                },
                label: {
                    priority: this.airportLabelPriority - 2,
                    alwaysShow: false,
                    offset: this.airportLabelOffset,
                }
            }
        ];
        this._vorStyle = {
            icon: {
                priority: this.vorIconPriority,
                size: this.vorIconSize
            },
            label: {
                priority: this.vorLabelPriority,
                alwaysShow: false,
                offset: this.vorLabelOffset,
            }
        };
        this._ndbStyle = {
            icon: {
                priority: this.ndbIconPriority,
                size: this.ndbIconSize
            },
            label: {
                priority: this.ndbLabelPriority,
                alwaysShow: false,
                offset: this.ndbLabelOffset,
            }
        };
        this._intStyle = {
            icon: {
                priority: this.intIconPriority,
                size: this.intIconSize
            },
            label: {
                priority: this.intLabelPriority,
                alwaysShow: false,
                offset: this.intLabelOffset,
            }
        };
        this._userStyle = {
            icon: {
                priority: this.userIconPriority,
                size: this.userIconSize
            },
            label: {
                priority: this.userLabelPriority,
                alwaysShow: false,
                offset: this.userLabelOffset,
            }
        };

        this._setCommonLabelStyles(this._airportStyles[0].label);
        this._setCommonLabelStyles(this._airportStyles[1].label);
        this._setCommonLabelStyles(this._airportStyles[2].label);
        this._setCommonLabelStyles(this._vorStyle.label);
        this._setCommonLabelStyles(this._ndbStyle.label);
        this._setCommonLabelStyles(this._intStyle.label);
        this._setCommonLabelStyles(this._userStyle.label);
    }

    _setWaypointRendererFactories() {
        let factory = new WT_MapViewWaypointImageIconCachedFactory(WT_MapViewWaypointLayer.WAYPOINT_ICON_CACHE_SIZE, this.iconDirectory);
        this._waypointRenderer.setIconFactory(WT_MapViewWaypointCanvasRenderer.Context.NORMAL, factory);
        this._waypointRenderer.setIconFactory(WT_MapViewWaypointCanvasRenderer.Context.AIRWAY, factory);

        let labelFactory = new WT_MapViewWaypointIdentLabelCachedFactory(WT_MapViewWaypointLayer.WAYPOINT_LABEL_CACHE_SIZE);
        this._waypointRenderer.setLabelFactory(WT_MapViewWaypointCanvasRenderer.Context.NORMAL, labelFactory);
        this._waypointRenderer.setLabelFactory(WT_MapViewWaypointCanvasRenderer.Context.AIRWAY, labelFactory);
    }

    _setWaypointRendererStyleHandlers() {
        this._initStyleOptions();
        this._waypointRenderer.setStyleOptionHandler(WT_MapViewWaypointCanvasRenderer.Context.NORMAL, this._waypointStyleHandler);
        this._waypointRenderer.setStyleOptionHandler(WT_MapViewWaypointCanvasRenderer.Context.AIRWAY, this._waypointStyleHandler);
    }

    /**
     * @param {WT_MapViewState} state
     */
    onConfigLoaded(state) {
        for (let property of WT_MapViewWaypointLayer.CONFIG_PROPERTIES) {
            this._setPropertyFromConfig(property);
        }
        this._setWaypointRendererFactories();
        this._setWaypointRendererStyleHandlers();
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateDeprecateBounds(state) {
        let size = this._viewDiagonal * WT_MapViewWaypointLayer.WAYPOINT_SEARCH_RANGE_FACTOR;

        let left = (state.projection.viewWidth - size) / 2;
        let right = left + size;
        let top = (state.projection.viewHeight - size) / 2;
        let bottom = top + size;

        this._waypointRenderer.setDeprecateBounds([{x: left, y: top}, {x: right, y: bottom}]);
    }

    /**
     * @param {WT_MapViewState} state
     */
    _onViewChanged(state) {
        this._viewDiagonal = Math.sqrt(state.projection.viewWidth * state.projection.viewWidth + state.projection.viewHeight * state.projection.viewHeight);
        this._updateDeprecateBounds(state);
        this._airwayRenderer.desiredLabelDistance = Math.min(state.projection.viewWidth, state.projection.viewHeight) * 0.75;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onProjectionViewChanged(state) {
        super.onProjectionViewChanged(state);

        this._onViewChanged(state);
    }

    /**
     * @param {WT_MapViewState} state
     */
    onAttached(state) {
        super.onAttached(state);

        this._onViewChanged(state);
    }

    /**
     * Checks whether a type of symbol should be shown on the map according to the map model.
     * @param {WT_MapViewState} state - the current map view state.
     * @param {Boolean} show - the map model's visibility value for the symbol type.
     * @param {WT_NumberUnit} range - the map model's maximum range value for the symbol type.
     * @returns {Boolean} whether the type of symbol should be shown according to the map model.
     */
    _shouldShowSymbolFromModel(state, show, range) {
        return show && state.model.range.compare(range) <= 0;
    }

    /**
     * Sets the search parameters for this layer's ICAO search requests.
     * @param {{lat:Number, long:Number}} center - the center of the search circle.
     * @param {WT_NumberUnit} radius - the radius of the search circle.
     */
    async _updateSearchParams(center, radius) {
        this._isChangingSearchParams = true;

        let radiusNM = radius.asUnit(WT_Unit.NMILE);
        let area = radiusNM * radiusNM * Math.PI;
        let airportSearchSize = Math.round(Math.max(WT_MapViewWaypointLayer.SEARCH_SIZE_MIN, Math.min(WT_MapViewWaypointLayer.SEARCH_SIZE_MAX, area * WT_MapViewWaypointLayer.SEARCH_AIRPORT_DENSITY)));
        let vorSearchSize = Math.round(Math.max(WT_MapViewWaypointLayer.SEARCH_SIZE_MIN, Math.min(WT_MapViewWaypointLayer.SEARCH_SIZE_MAX, area * WT_MapViewWaypointLayer.SEARCH_VOR_DENSITY)));
        let ndbSearchSize = Math.round(Math.max(WT_MapViewWaypointLayer.SEARCH_SIZE_MIN, Math.min(WT_MapViewWaypointLayer.SEARCH_SIZE_MAX, area * WT_MapViewWaypointLayer.SEARCH_NDB_DENSITY)));
        let intSearchSize = Math.round(Math.max(WT_MapViewWaypointLayer.SEARCH_SIZE_MIN, Math.min(WT_MapViewWaypointLayer.SEARCH_SIZE_MAX, area * WT_MapViewWaypointLayer.SEARCH_INT_DENSITY)));
        this._lastSearchParams.center.set(center);
        this._lastSearchParams.radius.set(radius);
        if (this._searchRequestsOpened) {
            await Promise.all([
                this._airportSearch.request.setParameters(center, radius, airportSearchSize),
                this._vorSearch.request.setParameters(center, radius, vorSearchSize),
                this._ndbSearch.request.setParameters(center, radius, ndbSearchSize),
                this._intSearch.request.setParameters(center, radius, intSearchSize),
            ]);
        } else {
            this._airportSearch.setRequest(this._icaoSearchers.airport.openRequest(center, radius, airportSearchSize));
            this._vorSearch.setRequest(this._icaoSearchers.vor.openRequest(center, radius, vorSearchSize));
            this._ndbSearch.setRequest(this._icaoSearchers.ndb.openRequest(center, radius, ndbSearchSize));
            this._intSearch.setRequest(this._icaoSearchers.int.openRequest(center, radius, intSearchSize));
            this._searchRequestsOpened = true;
        }
        this._airportSearch.reset();
        this._vorSearch.reset();
        this._ndbSearch.reset();
        this._intSearch.reset();
        this._isChangingSearchParams = false;
    }

    /**
     * Starts the timer for changing this layer's search request parameters.
     * @param {{lat:Number, long:Number}} center - the current lat/long coordinates of the map center.
     * @param {WT_NumberUnit} radius - the current desired search radius.
     * @param {Number} currentTime - the current time.
     * @param {Number} delay - the value from which the timer should count down, in seconds.
     */
    _startSearchParamChangeTimer(center, radius, delay) {
        this._searchParamChangeTimer = delay;
        this._lastCenter = center;
        this._lastRadius.set(radius);
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_GVector2} lastCenter
     * @param {WT_NumberUnit} lastRadius
     * @param {WT_NumberUnit} currentRadius
     * @param {Number} viewMargin
     */
    _isSearchInvalid(state, lastCenter, lastRadius, currentRadius, viewMargin) {
        let centerOffset = this._tempVector1.set(state.projection.viewCenter).subtract(state.projection.project(lastCenter, this._tempVector2));
        return !lastRadius.equals(currentRadius) || centerOffset.length > viewMargin;
    }

    /**
     *
     * @param {WT_MapViewState} state
     */
    _handleSearchParameters(state) {
        let searchRadius = this._tempNM.set(state.projection.range).scale(this._viewDiagonal / state.projection.viewHeight * WT_MapViewWaypointLayer.WAYPOINT_SEARCH_RANGE_FACTOR / 2, true);
        let margin = this._viewDiagonal * (WT_MapViewWaypointLayer.WAYPOINT_SEARCH_RANGE_FACTOR - 1) / 2;

        if (!this._searchRequestsOpened) {
            this._updateSearchParams(state.projection.center, searchRadius);
        } else {
            // if map zoom changes or map is panned beyond a certain threshold, we must update search parameters. However, instead of
            // updating immediately, we start a timer that is reset every time the map zoom changes or the map is panned beyond the
            // threshold again. The search parameters are updated when the timer expires. This avoids needlessly updating parameters
            // multiple times when e.g. the player is cycling through multiple map zoom levels in a short period of time or panning
            // the map quickly using the cursor.
            if (this._searchParamChangeTimer > 0) {
                if (this._isSearchInvalid(state, this._lastCenter, this._lastRadius, searchRadius, margin)) {
                    this._startSearchParamChangeTimer(state.projection.center, searchRadius, WT_MapViewWaypointLayer.SEARCH_PARAM_CHANGE_DELAY);
                    return;
                }

                this._searchParamChangeTimer -= state.currentTime / 1000 - this._lastTime;
                if (this._searchParamChangeTimer <= 0) {
                    this._updateSearchParams(state.projection.center, searchRadius);
                } else {
                    return;
                }
            } else {
                if (this._isSearchInvalid(state, this._lastSearchParams.center, this._lastSearchParams.radius, searchRadius, margin)) {
                    this._startSearchParamChangeTimer(state.projection.center, searchRadius, WT_MapViewWaypointLayer.SEARCH_PARAM_CHANGE_DELAY);
                    return;
                }
            }
        }
    }

    /**
     * Updates a search and registers the waypoints returned by the search.
     * @param {WT_MapViewWaypointSearch} search
     */
    async _doUpdateSearch(search) {
        await search.update();
        for (let waypoint of search.results) {
            this._waypointRenderer.register(waypoint, WT_MapViewWaypointCanvasRenderer.Context.NORMAL);
            this._standaloneWaypoints.add(waypoint);
        }
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_MapViewWaypointSearch} search
     * @param {Boolean} shouldSearch
     * @param {Boolean} lastSearch
     */
    _updateSearch(state, search, shouldSearch, lastShouldSearch) {
        if ((shouldSearch && !lastShouldSearch)) {
            search.reset();
        }

        if (shouldSearch) {
            if (search.timeRemaining() <= 0) {
                if (!search.isBusy) {
                    this._doUpdateSearch(search);
                }
            } else {
                search.advanceTimer(state.currentTime / 1000 - this._lastTime);
            }
        }
    }

    /**
     *
     * @param {WT_MapViewState} state
     */
    _handleSearchUpdates(state) {
        let showAirway = this._showAirway;
        let showAirport = this._showAirport[0] || this._showAirport[1] || this._showAirport[2];
        let showVOR = this._showVOR;
        let showNDB = this._showNDB;
        let showINT = this._showINT;

        let searchAirport = showAirport;
        let searchVOR = showVOR || showAirway;
        let searchNDB = showNDB || showAirway;
        let searchINT = showINT || showAirway;

        this._updateSearch(state, this._airportSearch, searchAirport);
        this._updateSearch(state, this._vorSearch, searchVOR);
        this._updateSearch(state, this._ndbSearch, searchNDB);
        this._updateSearch(state, this._intSearch, searchINT);

        this._lastShouldSearchAirport = searchAirport;
        this._lastShouldSearchVOR = searchVOR;
        this._lastShouldSearchNDB = searchNDB;
        this._lastShouldSearchINT = searchINT;
    }

    /**
     * Retrieves a caches a list of waypoints in range of the map view.
     * @param {WT_MapViewState} state - the current map view state.
     */
    _retrieveWaypointsInRange(state) {
        this._handleSearchParameters(state);

        if (this._isChangingSearchParams) {
            return;
        }

        this._handleSearchUpdates(state);
    }

    /**
     * Searches a list of waypoints for airways containing those waypoints, then filters and returns a subset of those airways that
     * should be drawn on the map.
     * @param {WT_MapViewState} state - the current map view state.
     * @param {WT_Waypoint[]} waypoints - the waypoints from which to get airways.
     * @returns {WT_Airway[]} - an array of airways that should be drawn on the map.
     */
    _getAirwaysToDraw(state, waypoints) {
        let airways = new Map();

        let temp = new WT_GVector2(0, 0);

        let boundLeft = -this._airwayLayer.width * 0.05;
        let boundRight = this._airwayLayer.width * 1.05;
        let boundTop = -this._airwayLayer.height * 0.05;
        let boundBottom = this._airwayLayer.height * 1.05;

        for (let waypoint of waypoints) {
            if (waypoint.icao !== undefined) {
                let show = waypoint.airways && waypoint.airways.length > 0;
                if (!show) {
                    continue;
                }
            }

            let viewPosition = this._airwayLayer.buffer.projectionRenderer.project(waypoint.location, temp);
            if (viewPosition.x < boundLeft ||
                viewPosition.x > boundRight ||
                viewPosition.y < boundTop ||
                viewPosition.y > boundBottom) {
                continue;
            }

            for (let airway of waypoint.airways) {
                airways.set(airway.name, airway);
            }
        }
        return Array.from(airways.values());
    }

    /**
     * De-registers all waypoints associated with the most recently drawn airway segments.
     */
    _clearAirwayWaypoints() {
        for (let waypoint of this._airwayWaypoints) {
            this._waypointRenderer.deregister(waypoint, WT_MapViewWaypointCanvasRenderer.Context.AIRWAY);
        }
        this._airwayWaypoints = [];
    }

    /**
     * Draws any currently rendered airways to the airway canvas layer display.
     * @param {WT_MapViewState} state - the current map view state.
     */
    _drawAirwaysToDisplay(state) {
        this._airwayLayer.buffer.clear();
        this._airwayLayer.buffer.context.lineWidth = this.airwayStrokeWidth * state.dpiScale;
        this._airwayLayer.buffer.context.strokeStyle = this.airwayStrokeColor;
        this._airwayLayer.buffer.context.stroke();

        this._airwayLayer.redrawDisplay(state);

        this._clearAirwayWaypoints();
        for (let waypoint of this._airwayRenderer.waypointsRendered) {
            this._airwayWaypoints.push(waypoint);
            this._waypointRenderer.register(waypoint, WT_MapViewWaypointCanvasRenderer.Context.AIRWAY);
        }
    }

    /**
     * Removes all airway labels.
     */
    _clearAirwayLabels() {
        for (let label of this._airwayLabelsToShow.values()) {
            this._labelManager.remove(label);
        }
        this._airwayLabelsToShow.clear();
    }

    /**
     * Draws a label for the specified airway segment.
     * @param {WT_Airway} airway - the airway for which to draw a label.
     * @param {WT_ICAOWaypoint[]} segment - the airway segment for which to draw a label. This should be an array of size 2, with
     *                                      index 0 containing the waypoint defining the beginning of the segment, and index 1 containing
     *                                      the waypoint defining the end of the segment.
     * @param {Number} pathPosition - a number between 0 and 1 representing the position along the path of the segment at which the
     *                                label should be placed. A value of 0 represents the beginning of the segment, and a value of 1
     *                                represents the end of the segment.
     */
    _drawAirwaySegmentLabel(airway, segment, pathPosition) {
        let label = this._airwaySegmentLabelCache.getLabel(airway, segment, pathPosition, this.airwayLabelPriority);
        label.fontSize = this.airwayLabelFontSize;
        label.fontColor = this.airwayLabelFontColor;
        label.fontOutlineWidth = this.airwayLabelFontOutlineWidth;
        label.fontOutlineColor = this.airwayLabelFontOutlineColor;
        label.showBackground = this.airwayLabelShowBackground;
        if (this.airwayLabelShowBackground) {
            label.backgroundColor = this.airwayLabelBackgroundColor;
            label.backgroundPadding = this.airwayLabelBackgroundPadding;
            label.backgroundOutlineWidth = this.airwayLabelBackgroundOutlineWidth;
            label.backgroundOutlineColor = this.airwayLabelBackgroundOutlineColor;
        }
        this._airwayLabelsToShow.add(label);
        this._labelManager.add(label);
    }

    /**
     * Draws labels for the currently rendered airways.
     */
    _drawAirwayLabels() {
        for (let segmentData of this._airwayRenderer.labeledSegments) {
            this._drawAirwaySegmentLabel(segmentData.airway, segmentData.segment, segmentData.pathPosition);
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    _onAirwayRenderPaused(state) {
        if (this._shouldDrawUnfinishedAirways) {
            this._drawAirwaysToDisplay(state);
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    _onAirwayRenderFinished(state) {
        this._drawAirwaysToDisplay(state);
        this._drawAirwayLabels();
        this._shouldDrawUnfinishedAirways = false;
    }

    _onAirwayRenderAborted() {
        this._shouldDrawUnfinishedAirways = false;
    }

    /**
     * Starts rendering airways to the airway canvas layer.
     * @param {WT_MapViewState} state - the current map view state.
     */
    _startDrawAirways(state) {
        this._airwayLayer.resetBuffer(state);
        this._airwayRenderer.render(this._getAirwaysToDraw(state, this._standaloneWaypoints), this._airwayLayer.buffer.projectionRenderer);
    }

    /**
     * Updates the display of airways.
     * @param {WT_MapViewState} state - the current map view state.
     */
    _updateAirways(state) {
        this._airwayLayer.update(state);
        let transform = this._airwayLayer.display.transform;
        let offsetXAbs = Math.abs(transform.offset.x);
        let offsetYAbs = Math.abs(transform.offset.y);

        let showAirway = this._shouldShowSymbolFromModel(state, state.model.waypoints.airwayShow, state.model.waypoints.airwayRange);

        let isImageInvalid = this._airwayLayer.display.isInvalid ||
                             (!showAirway && this._lastShowAirway);

        let shouldRedraw = isImageInvalid ||
                           (this._lastStandaloneWaypointsCount != this._standaloneWaypoints.size) ||
                           (showAirway != this._lastShowAirway) ||
                           (offsetXAbs > transform.margin * 0.9 || offsetYAbs > transform.margin * 0.9);

        this._lastShowAirway = showAirway;

        if (isImageInvalid) {
            this._airwayLayer.redrawDisplay(state, false);
            this._clearAirwayWaypoints();
            this._clearAirwayLabels();
            this._shouldDrawUnfinishedAirways = true;
        }
        if (!showAirway) {
            return;
        }
        if (shouldRedraw) {
            this._startDrawAirways(state);
        }
        this._airwayRenderer.update(state);
    }

    /**
     *
     * @param {WT_MapViewState} state - the current map view state.
     */
    _updateVisibilityFromModel(state) {
        this._showAirport[0] = this._shouldShowSymbolFromModel(state, state.model.waypoints.airportShow, state.model.waypoints.airportLargeRange);
        this._showAirport[1] = this._shouldShowSymbolFromModel(state, state.model.waypoints.airportShow, state.model.waypoints.airportMediumRange);
        this._showAirport[2] = this._shouldShowSymbolFromModel(state, state.model.waypoints.airportShow, state.model.waypoints.airportSmallRange);
        this._showVOR = this._shouldShowSymbolFromModel(state, state.model.waypoints.vorShow, state.model.waypoints.vorRange);
        this._showNDB = this._shouldShowSymbolFromModel(state, state.model.waypoints.ndbShow, state.model.waypoints.ndbRange);
        this._showINT = this._shouldShowSymbolFromModel(state, state.model.waypoints.intShow, state.model.waypoints.intRange);
        this._showAirway = this._shouldShowSymbolFromModel(state, state.model.waypoints.airwayShow, state.model.waypoints.airwayRange);
    }

    /**
     *
     * @param {WT_MapViewState} state
     */
    _updateWaypointRenderer(state) {
        this._waypointRenderer.update(state);
        this._iconLayer.display.clear();
        this._iconLayer.copyBufferToCanvas();
    }

    /**
     * Updates the set of standalone waypoints.
     * @param {WT_MapViewState} state - the current map view state.
     */
    _updateStandaloneWaypoints(state) {
        let toRemove = [];
        for (let waypoint of this._standaloneWaypoints.values()) {
            if (!this._waypointRenderer.isRegistered(waypoint, WT_MapViewWaypointCanvasRenderer.Context.NORMAL)) {
                toRemove.push(waypoint);
            }
        }

        for (let waypoint of toRemove) {
            this._standaloneWaypoints.delete(waypoint);
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        super.onUpdate(state);
        this._updateVisibilityFromModel(state);
        this._retrieveWaypointsInRange(state);
        this._updateAirways(state);
        this._updateWaypointRenderer(state);
        this._updateStandaloneWaypoints(state);
        this._lastTime = state.currentTime / 1000;
        this._lastStandaloneWaypointsCount = this._standaloneWaypoints.size;
    }
}
WT_MapViewWaypointLayer.CLASS_DEFAULT = "waypointLayer";
WT_MapViewWaypointLayer.CONFIG_NAME_DEFAULT = "waypoints";
WT_MapViewWaypointLayer.WAYPOINT_ICON_CACHE_SIZE = 1000;
WT_MapViewWaypointLayer.WAYPOINT_LABEL_CACHE_SIZE = 1000;
WT_MapViewWaypointLayer.AIRWAY_LABEL_CACHE_SIZE = 1000;
WT_MapViewWaypointLayer.SEARCH_PARAM_CHANGE_DELAY = 0.5;                // seconds.
WT_MapViewWaypointLayer.SEARCH_UPDATE_INTERVAL_MIN = 0.5;               // seconds.
WT_MapViewWaypointLayer.SEARCH_UPDATE_INTERVAL_MAX = 20;                // seconds.
WT_MapViewWaypointLayer.SEARCH_UPDATE_INTERVAL_INC_THRESHOLD = 10;
WT_MapViewWaypointLayer.SEARCH_SIZE_MIN = 10;
WT_MapViewWaypointLayer.SEARCH_SIZE_MAX = 200;
WT_MapViewWaypointLayer.SEARCH_AIRPORT_DENSITY = 0.01;                  // per square nautical mile
WT_MapViewWaypointLayer.SEARCH_VOR_DENSITY = 0.0005;                    // per square nautical mile
WT_MapViewWaypointLayer.SEARCH_NDB_DENSITY = 0.0005;                    // per square nautical mile
WT_MapViewWaypointLayer.SEARCH_INT_DENSITY = 0.04;                      // per square nautical mile
WT_MapViewWaypointLayer.WAYPOINT_SEARCH_RANGE_FACTOR = 1.5;
WT_MapViewWaypointLayer.AIRWAY_OVERDRAW_FACTOR = 1.91421356237;
WT_MapViewWaypointLayer.WAYPOINT_DEPRECATE_DELAY = 30;                  // seconds.
WT_MapViewWaypointLayer.OPTIONS_DEF = {
    iconDirectory: {default: "", auto: true},

    userIconSize: {default: 15, auto: true},
    airportIconSize: {default: 30, auto: true},
    vorIconSize: {default: 25, auto: true},
    ndbIconSize: {default: 30, auto: true},
    intIconSize: {default: 15, auto: true},

    waypointLabelFontWeight: {default: "normal", auto: true},
    waypointLabelFontSize: {default: 15, auto: true},
    waypointLabelFontColor: {default: "white", auto: true},
    waypointLabelFontOutlineWidth: {default: 6, auto: true},
    waypointLabelFontOutlineColor: {default: "black", auto: true},
    waypointLabelShowBackground: {default: false, auto: true},
    waypointLabelBackgroundColor: {default: "white", auto: true},
    waypointLabelBackgroundPadding: {default: [0], auto: true},
    waypointLabelBackgroundBorderRadius: {default: 0, auto: true},
    waypointLabelBackgroundOutlineWidth: {default: 0, auto: true},
    waypointLabelBackgroundOutlineColor: {default: "black", auto: true},

    userIconPriority: {default: 15, auto: true},
    airportIconPriority: {default: 10, auto: true},
    vorIconPriority: {default: 2, auto: true},
    ndbIconPriority: {default: 1, auto: true},
    intIconPriority: {default: 0, auto: true},

    userLabelPriority: {default: 125, auto: true},
    airportLabelPriority: {default: 120, auto: true},
    vorLabelPriority: {default: 112, auto: true},
    ndbLabelPriority: {default: 111, auto: true},
    intLabelPriority: {default: 110, auto: true},

    userLabelOffset: {default: {x: 0, y: -20}, auto: true},
    airportLabelOffset: {default: {x: 0, y: -27.5}, auto: true},
    vorLabelOffset: {default: {x: 0, y: -25}, auto: true},
    ndbLabelOffset: {default: {x: 0, y: -27.5}, auto: true},
    intLabelOffset: {default: {x: 0, y: -20}, auto: true},

    airwayStrokeWidth: {default: 2, auto: true},
    airwayStrokeColor: {default: "#404040", auto: true},

    airwayLabelFontSize: {default: 15, auto: true},
    airwayLabelFontColor: {default: "black", auto: true},
    airwayLabelFontOutlineWidth: {default: 0, auto: true},
    airwayLabelFontOutlineColor: {default: "white", auto: true},
    airwayLabelShowBackground: {default: true, auto: true},
    airwayLabelBackgroundPadding: {default: [1], auto: true},
    airwayLabelBackgroundColor: {default: "#bdbdbd", auto: true},
    airwayLabelBackgroundOutlineWidth: {default: 1, auto: true},
    airwayLabelBackgroundOutlineColor: {default: "black", auto: true},

    airwayLabelPriority: {default: 100, auto: true}
};
WT_MapViewWaypointLayer.CONFIG_PROPERTIES = [
    "iconDirectory",
    "userIconSize",
    "airportIconSize",
    "vorIconSize",
    "ndbIconSize",
    "intIconSize",
    "waypointLabelFontWeight",
    "waypointLabelFontSize",
    "waypointLabelFontColor",
    "waypointLabelFontOutlineWidth",
    "waypointLabelFontOutlineColor",
    "waypointLabelShowBackground",
    "waypointLabelBackgroundColor",
    "waypointLabelBackgroundPadding",
    "waypointLabelBackgroundBorderRadius",
    "waypointLabelBackgroundOutlineWidth",
    "waypointLabelBackgroundOutlineColor",
    "userLabelPriority",
    "airportLabelPriority",
    "vorLabelPriority",
    "ndbLabelPriority",
    "intLabelPriority",
    "userLabelOffset",
    "airportLabelOffset",
    "vorLabelOffset",
    "ndbLabelOffset",
    "intLabelOffset",
    "airwayStrokeWidth",
    "airwayStrokeColor",
    "airwayLabelFontSize",
    "airwayLabelFontColor",
    "airwayLabelFontOutlineWidth",
    "airwayLabelFontOutlineColor",
    "airwayLabelShowBackground",
    "airwayLabelBackgroundPadding",
    "airwayLabelBackgroundColor",
    "airwayLabelBackgroundOutlineWidth",
    "airwayLabelBackgroundOutlineColor",
    "airwayLabelPriority",
];

class WT_MapViewWaypointSearch {
    constructor(factoryMethod, minDelay, maxDelay, delayIncThreshold) {
        this._request = null;
        this._factoryMethod = factoryMethod;
        this._minDelay = minDelay;
        this._maxDelay = maxDelay;
        this._delayIncThreshold = delayIncThreshold;

        this._results = [];
        this._isBusy = false;
        this._timer = 0;
        this._delay = 0;
        this._updateCount = 0;
    }

    /**
     * @readonly
     * @property {WT_ICAOSearchRequest} request
     * @type {WT_ICAOSearchRequest}
     */
    get request() {
        return this._request;
    }

    /**
     * @readonly
     * @property {WT_ICAOWaypoint[]} results
     * @type {WT_ICAOWaypoint[]}
     */
    get results() {
        return this._results;
    }

    /**
     * @readonly
     * @property {Boolean} isBusy
     * @type {Boolean}
     */
    get isBusy() {
        return this._isBusy;
    }

    /**
     *
     * @param {WT_ICAOSearchRequest} request
     */
    setRequest(request) {
        this._request = request;
    }

    /**
     * @returns {Number}
     */
    timeRemaining() {
        return this._timer;
    }

    advanceTimer(dt) {
        this._timer -= dt;
    }

    reset() {
        this._timer = 0;
        this._delay = this._minDelay;
        this._updateCount = 0;
    }

    async update() {
        this._isBusy = true;
        await this.request.update();
        this._results = await this._factoryMethod(this.request.results);
        this._timer = this._delay;
        this._updateCount++;
        if (this._results.length > 0 && this._updateCount > this._delayIncThreshold) {
            this._delay = Math.min(this._maxDelay, this._delay * 2);
        } else {
            this._delay = this._minDelay;
        }
        this._isBusy = false;
    }
}

/**
 * @typedef WT_MapViewWaypointIconOptions
 * @property {Number} priority - the priority of the icon. Icons with higher priority will always be placed on top of icons with
 *                               lower priority.
 * @property {Number} size - the size of the icon.
 */

/**
 * @typedef WT_MapViewWaypointLabelOptions
 * @property {Number} priority - the priority of the label text. Text with higher priority will be preferentially shown over text with
 *                               lower priority during label culling to avoid text overlap.
 * @property {{x:Number, y:Number}} offset - the offset, in pixel coordinates, of the label from the projected location of its waypoint.
 */

/**
 * @typedef WT_MapViewRegisteredWaypointEntry
 * @property {WT_Waypoint} waypoint
 * @property {WT_MapViewWaypointIcon} icon
 * @property {WT_MapViewWaypointLabel} label
 * @property {Boolean} showIcon
 * @property {Boolean} showLabel
 * @property {Boolean} standalone
 * @property {Boolean} airway
 */