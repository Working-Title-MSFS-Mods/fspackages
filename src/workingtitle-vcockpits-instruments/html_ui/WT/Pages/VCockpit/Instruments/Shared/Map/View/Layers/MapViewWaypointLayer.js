/**
 * A display of waypoints, which includes user waypoints, airports, VORs, NDBs, and intersections.
 */
class WT_MapViewWaypointLayer extends WT_MapViewMultiLayer {
    /**
     * @param {{airport:WT_ICAOSearcher}} icaoSearchers - searchers to use for enumerating ICAO strings of waypoints within range of the map view.
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory - a factory to create waypoint objects from ICAO strings.
     * @param {WT_MapViewTextLabelManager} labelManager - the text label manager to use for managing waypoint labels.
     * @param {String} [className] - the name of the class to add to the new layer's top-level HTML element's class list.
     * @param {String} [configName] - the name of the property in the map view's config file to be associated with the new layer.
     */
    constructor(icaoSearchers, icaoWaypointFactory, labelManager, className = WT_MapViewWaypointLayer.CLASS_DEFAULT, configName = WT_MapViewWaypointLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._icaoSearchers = icaoSearchers;
        this._icaoWaypointFactory = icaoWaypointFactory;
        this._labelManager = labelManager;
        this._searchRequests;
        this._searchedWaypoints = [];
        this._airwayWaypoints = [];

        /**
         * @type {Map<String,WT_MapViewManagedWaypointEntry>}
         */
        this._registeredWaypoints = new Map();

        this._waypointIconCache = new WT_MapViewWaypointImageIconCache(WT_MapViewWaypointLayer.WAYPOINT_ICON_CACHE_SIZE);
        this._waypointLabelCache = new WT_MapViewWaypointLabelCache(WT_MapViewWaypointLayer.WAYPOINT_LABEL_CACHE_SIZE);
        this._airwaySegmentLabelCache = new WT_MapViewAirwaySegmentLabelCache(WT_MapViewWaypointLayer.AIRWAY_LABEL_CACHE_SIZE);
        this._airwayLabelsToShow = new Set();

        this._optsManager = new WT_OptionsManager(this, WT_MapViewWaypointLayer.OPTIONS_DEF);

        this._airwayLayer = new WT_MapViewPersistentCanvas(WT_MapViewWaypointLayer.AIRWAY_OVERDRAW_FACTOR);
        this._iconLayer = new WT_MapViewCanvas(true, true);
        this.addSubLayer(this._airwayLayer);
        this.addSubLayer(this._iconLayer);

        let airwayRendererEventHandler = {
            onStarted() {},
            onPaused: this._onAirwayRenderPaused.bind(this),
            onFinished: this._onAirwayRenderFinished.bind(this),
            onAborted: this._onAirwayRenderAborted.bind(this)
        }
        this._airwayRenderer = new WT_MapViewAirwayCanvasRenderer(airwayRendererEventHandler, this._airwayLayer.buffer.context, 300);
        this._shouldDrawUnfinishedAirways = false;

        this._lastRadius = new WT_NumberUnit(0, WT_Unit.NMILE);
        this._lastCenter = {lat: 0, long: 0};
        this._searchParamChangeTimer = 0;

        this._lastSearchParams = {
            time: 0,
            center: new LatLong(0, 0),
            radius: new WT_NumberUnit(0, WT_Unit.NMILE)
        };

        this._lastSearchAirport = false;
        this._lastSearchVOR = false;
        this._lastSearchNDB = false;
        this._lastSearchINT = false;
        this._lastSearchedWaypointsCount = 0;
        this._lastShowAirway = false;
        this._lastTime = 0;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onConfigLoaded(state) {
        for (let property of WT_MapViewWaypointLayer.CONFIG_PROPERTIES) {
            this._setPropertyFromConfig(property);
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    onProjectionViewChanged(state) {
        super.onProjectionViewChanged(state);
        this._airwayRenderer.desiredLabelDistance = Math.min(state.projection.viewWidth, state.projection.viewHeight) * 0.75;
    }

    _isInBounds(position, left, top, right, bottom) {
        return position.x >= left &&
               position.x <= right &&
               position.y >= top &&
               position.y <= bottom;
    }

    /**
     * Registers a waypoint to be managed and drawn by this layer. Waypoints can be registered with a status as standalone or
     * in association with a drawn airway segment. Only waypoints registered with a status as standalone will be labeled.
     * @param {WT_Waypoint} waypoint - a waypoint.
     * @param {Boolean} airway - whether the waypoint should be registered in association with a drawn airway segment.
     *                           If false, the airway will be registered as standalone instead.
     */
    _registerWaypoint(waypoint, airway) {
        let entry = this._registeredWaypoints.get(waypoint.uniqueID);
        if (!entry) {
            this._registeredWaypoints.set(waypoint.uniqueID, {waypoint: waypoint, icon: null, label: null, showIcon: false, showLabel: false, standalone: !airway, airway: airway, timer: 0});
        } else {
            entry.standalone = entry.standalone || !airway;
            entry.airway = entry.airway || airway;
        }
    }

    /**
     * De-registers a waypoint. Waypoints can be de-registered from status as standalone or in association with a drawn airway
     * segment. If a waypoint is registered with both statuses, de-registration from standalone will not affect its status in
     * association with an airway and vice versa.
     * @param {WT_Waypoint} waypoint - a waypoint.
     * @param {Boolean} airway - whether the waypoint should be de-registered from status in association with a drawn airway
     *                           segment. If false, the airway will be de-registered from status as standalone instead.
     */
    _deregisterWaypoint(waypoint, airway) {
        let entry = this._registeredWaypoints.get(waypoint.uniqueID);
        if (entry) {
            entry.standalone = entry.standalone && airway;
            entry.airway = entry.airway && !airway;
            if (!entry.standalone && !entry.airway) {
                this._registeredWaypoints.delete(waypoint.uniqueID);
            }
        }
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
    _updateSearchParams(center, radius) {
        let radiusNM = radius.asUnit(WT_Unit.NMILE);
        let area = radiusNM * radiusNM * Math.PI;
        let airportSearchSize = Math.round(Math.max(WT_MapViewWaypointLayer.SEARCH_SIZE_MIN, Math.min(WT_MapViewWaypointLayer.SEARCH_SIZE_MAX, area * WT_MapViewWaypointLayer.SEARCH_AIRPORT_DENSITY)));
        let vorSearchSize = Math.round(Math.max(WT_MapViewWaypointLayer.SEARCH_SIZE_MIN, Math.min(WT_MapViewWaypointLayer.SEARCH_SIZE_MAX, area * WT_MapViewWaypointLayer.SEARCH_VOR_DENSITY)));
        let ndbSearchSize = Math.round(Math.max(WT_MapViewWaypointLayer.SEARCH_SIZE_MIN, Math.min(WT_MapViewWaypointLayer.SEARCH_SIZE_MAX, area * WT_MapViewWaypointLayer.SEARCH_NDB_DENSITY)));
        let intSearchSize = Math.round(Math.max(WT_MapViewWaypointLayer.SEARCH_SIZE_MIN, Math.min(WT_MapViewWaypointLayer.SEARCH_SIZE_MAX, area * WT_MapViewWaypointLayer.SEARCH_INT_DENSITY)));
        if (this._searchRequests) {
            this._searchRequests.airport.setParameters(center, radius, airportSearchSize);
            this._searchRequests.vor.setParameters(center, radius, vorSearchSize);
            this._searchRequests.ndb.setParameters(center, radius, ndbSearchSize);
            this._searchRequests.int.setParameters(center, radius, intSearchSize);
        } else {
            this._searchRequests = {
                airport: this._icaoSearchers.airport.openRequest(center, radius, airportSearchSize),
                vor: this._icaoSearchers.vor.openRequest(center, radius, vorSearchSize),
                ndb: this._icaoSearchers.ndb.openRequest(center, radius, ndbSearchSize),
                int: this._icaoSearchers.int.openRequest(center, radius, intSearchSize)
            };
        }
        this._lastSearchParams.center = center;
        this._lastSearchParams.radius = radius;
    }

    /**
     * Updates an ICAO search request and pushes the search results in the form of waypoint objects to an array.
     * @param {WT_ICAOSearchRequest} searchRequest - the ICAO search request to update.
     * @param {Function} factoryMethod - the WT_ICAOWaypointFactor method with which to create waypoint objects from the search results.
     * @param {Array} array - the array in which to save the search results.
     */
    async _loadWaypointsFromSearch(searchRequest, factoryMethod, array) {
        await searchRequest.update();
        let waypoints = await factoryMethod(searchRequest.results);
        array.push(...waypoints);
    }

    /**
     * Refreshes this layer's ICAO search requests and updates the internal cache of waypoints in range of the map view from
     * the search results.
     * @param {Number} currentTime - the current time.
     * @param {Boolean} searchAirports - whether to include airports in the search.
     * @param {Boolean} searchVORs - whether to include VORs in the search.
     * @param {Boolean} searchNDBs - whether to include NDBs in the search.
     * @param {Boolean} searchINTs - whether to include INTs in the search.
     */
    async _refreshSearches(currentTime, searchAirports, searchVORs, searchNDBs, searchINTs) {
        let searchedWaypoints = [];
        this._lastSearchParams.time = currentTime;
        await Promise.all([
            searchAirports ? this._loadWaypointsFromSearch(this._searchRequests.airport, this._icaoWaypointFactory.getAirports.bind(this._icaoWaypointFactory), searchedWaypoints) : Promise.resolve(),
            searchVORs ? this._loadWaypointsFromSearch(this._searchRequests.vor, this._icaoWaypointFactory.getVORs.bind(this._icaoWaypointFactory), searchedWaypoints) : Promise.resolve(),
            searchNDBs ? this._loadWaypointsFromSearch(this._searchRequests.ndb, this._icaoWaypointFactory.getNDBs.bind(this._icaoWaypointFactory), searchedWaypoints) : Promise.resolve(),
            searchINTs ? this._loadWaypointsFromSearch(this._searchRequests.int, this._icaoWaypointFactory.getINTs.bind(this._icaoWaypointFactory), searchedWaypoints) : Promise.resolve()
        ]);

        for (let waypoint of searchedWaypoints) {
            this._registerWaypoint(waypoint, false);
        }
        this._searchedWaypoints = searchedWaypoints;
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
     * Retrieves a caches a list of waypoints in range of the map view.
     * @param {WT_MapViewState} state - the current map view state.
     */
    _retrieveWaypointsInRange(state) {
        let long = Math.max(state.projection.viewWidth, state.projection.viewHeight);
        let searchRadius = state.projection.range.scale(long / state.projection.viewHeight * WT_MapViewWaypointLayer.WAYPOINT_SEARCH_RANGE_FACTOR / 2);

        if (!this._searchRequests) {
            this._updateSearchParams(state.projection.center, searchRadius);
        } else {
            // if map zoom changes or map is panned beyond a certain threshold, we must update search parameters. However, instead of
            // updating immediately, we start a timer that is reset every time the map zoom changes or the map is panned beyond the
            // threshold again. The search parameters are updated when the timer expires. This avoids needlessly updating parameters
            // multiple times when e.g. the player is cycling through multiple map zoom levels in a short period of time or panning
            // the map quickly using the cursor.
            if (this._searchParamChangeTimer > 0) {
                let lastCenterOffset = state.projection.viewCenter.minus(state.projection.project(this._lastCenter));
                if (!this._lastRadius.equals(searchRadius) || Math.abs(lastCenterOffset.x) > long * 0.9 || Math.abs(lastCenterOffset.y) > long * 0.9) {
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
                let searchCenterOffset = state.projection.viewCenter.minus(state.projection.project(this._lastSearchParams.center));
                if (!this._lastSearchParams.radius.equals(searchRadius) || Math.abs(searchCenterOffset.x) > long * 0.9 || Math.abs(searchCenterOffset.y) > long * 0.9) {
                    this._startSearchParamChangeTimer(state.projection.center, searchRadius, WT_MapViewWaypointLayer.SEARCH_PARAM_CHANGE_DELAY);
                    return;
                }
            }
        }

        let showAirway = this._shouldShowSymbolFromModel(state, state.model.waypoints.airwayShow, state.model.waypoints.airwayRange);
        let showAirport = this._shouldShowSymbolFromModel(state, state.model.waypoints.airportShow, state.model.waypoints.airportLargeRange) ||
                          this._shouldShowSymbolFromModel(state, state.model.waypoints.airportShow, state.model.waypoints.airportMediumRange) ||
                          this._shouldShowSymbolFromModel(state, state.model.waypoints.airportShow, state.model.waypoints.airportSmallRange)
        let showVOR = this._shouldShowSymbolFromModel(state, state.model.waypoints.vorShow, state.model.waypoints.vorRange);
        let showNDB = this._shouldShowSymbolFromModel(state, state.model.waypoints.ndbShow, state.model.waypoints.ndbRange);
        let showINT = this._shouldShowSymbolFromModel(state, state.model.waypoints.intShow, state.model.waypoints.intRange);

        let searchAirport = showAirport;
        let searchVOR = showVOR || showAirway;
        let searchNDB = showNDB || showAirway;
        let searchINT = showINT || showAirway;

        if ((state.currentTime - this._lastSearchParams.time) / 1000 >= WT_MapViewWaypointLayer.SEARCH_UPDATE_INTERVAL ||
            (searchAirport && !this._lastSearchAirport) ||
            (searchVOR && !this._lastSearchVOR) ||
            (searchNDB && !this._lastSearchNDB) ||
            (searchINT && !this._lastSearchINT)) {
            this._refreshSearches(state.currentTime, searchAirport, searchVOR, searchNDB, searchINT);
        }

        this._lastSearchAirport = searchAirport;
        this._lastSearchVOR = searchVOR;
        this._lastSearchNDB = searchNDB;
        this._lastSearchINT = searchINT;
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
            this._deregisterWaypoint(waypoint, true);
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
            this._registerWaypoint(waypoint, true);
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
        label.outlineWidth = this.airwayLabelFontOutlineWidth;
        label.outlineColor = this.airwayLabelFontOutlineColor;
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
        this._airwayRenderer.render(this._getAirwaysToDraw(state, this._searchedWaypoints), this._airwayLayer.buffer.projectionRenderer);
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
                           (this._lastSearchedWaypointsCount != this._searchedWaypoints.length) ||
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
     * Gets and saves icon and label options for the specified waypoint to an options object.
     * @param {WT_Waypoint} waypoint - the waypoint for which to get options.
     * @param {{icon:WT_MapViewWaypointIconOptions, label:WT_MapViewWaypointLabelOptions}} options - the options object to which to save the options.
     */
    _getWaypointIconAndLabelOptions(waypoint, options) {
        if (waypoint.icao) {
            switch (waypoint.type) {
                case WT_ICAOWaypoint.Type.AIRPORT:
                    options.icon.priority = this.airportIconPriority - waypoint.size;
                    options.icon.size = this.airportIconSize;
                    options.label.priority = this.airportLabelPriority - waypoint.size;
                    options.label.offset = this.airportLabelOffset;
                    break;
                case WT_ICAOWaypoint.Type.VOR:
                    options.icon.priority = this.vorIconPriority;
                    options.icon.size = this.vorIconSize;
                    options.label.priority = this.vorLabelPriority;
                    options.label.offset = this.vorLabelOffset;
                    break;
                case WT_ICAOWaypoint.Type.NDB:
                    options.icon.priority = this.ndbIconPriority;
                    options.icon.size = this.ndbIconSize;
                    options.label.priority = this.ndbLabelPriority;
                    options.label.offset = this.ndbLabelOffset;
                    break;
                case WT_ICAOWaypoint.Type.INT:
                    options.icon.priority = this.intIconPriority;
                    options.icon.size = this.intIconSize;
                    options.label.priority = this.intLabelPriority;
                    options.label.offset = this.intLabelOffset;
                    break;
            }
        } else {
            options.icon.priority = this.userIconPriority;
            options.icon.size = this.userIconSize;
            options.label.priority = this.userLabelPriority;
            options.label.offset = this.userLabelOffset;
        }
    }

    /**
     * Gets an icon for the specified waypoint.
     * @param {WT_Waypoint} waypoint - the waypoint for which to get an icon.
     * @param {WT_MapViewWaypointIconOptions} options - icon options to use for the icon.
     */
    _getWaypointIcon(waypoint, options) {
        let icon = this._waypointIconCache.getIcon(waypoint, options.priority, this.iconDirectory);
        icon.size = options.size;
        return icon;
    }

    /**
     * Gets a label for the specified waypoint.
     * @param {WT_Waypoint} waypoint - the waypoint for which to get a label.
     * @param {WT_MapViewWaypointLabelOptions} options - label options to use for the label.
     */
    _getWaypointLabel(waypoint, options) {
        let label = this._waypointLabelCache.getLabel(waypoint, options.priority);
        label.fontSize = this.waypointLabelFontSize;
        label.fontColor = this.waypointLabelFontColor;
        label.outlineWidth = this.waypointLabelFontOutlineWidth;
        label.outlineColor = this.waypointLabelFontOutlineColor;
        label.offset = options.offset;
        return label;
    }

    /**
     * Updates all waypoints registered to this layer.
     * @param {WT_MapViewState} state - the current map view state.
     */
    _updateRegisteredWaypoints(state) {
        let tempVector = new WT_GVector2(0, 0);
        let dt = state.currentTime / 1000 - this._lastTime;
        let deprecateSize = Math.max(state.projection.viewWidth, state.projection.viewHeight) * WT_MapViewWaypointLayer.WAYPOINT_SEARCH_RANGE_FACTOR;

        let viewBoundLeft = -state.projection.viewWidth * 0.05;
        let viewBoundRight = state.projection.viewWidth * 1.05;
        let viewBoundTop = -state.projection.viewHeight * 0.05;
        let viewBoundBottom = state.projection.viewHeight * 1.05;

        let deprecateBoundLeft = (state.projection.viewWidth - deprecateSize) / 2;
        let deprecateBoundRight = (deprecateSize - state.projection.viewWidth) / 2;
        let deprecateBoundTop = deprecateBoundLeft + deprecateSize;
        let deprecateBoundBottom = deprecateBoundTop + deprecateSize;

        let showAirport = [
            this._shouldShowSymbolFromModel(state, state.model.waypoints.airportShow, state.model.waypoints.airportLargeRange),
            this._shouldShowSymbolFromModel(state, state.model.waypoints.airportShow, state.model.waypoints.airportMediumRange),
            this._shouldShowSymbolFromModel(state, state.model.waypoints.airportShow, state.model.waypoints.airportSmallRange)
        ];
        let showVOR = this._shouldShowSymbolFromModel(state, state.model.waypoints.vorShow, state.model.waypoints.vorRange);
        let showNDB = this._shouldShowSymbolFromModel(state, state.model.waypoints.ndbShow, state.model.waypoints.ndbRange);
        let showINT = this._shouldShowSymbolFromModel(state, state.model.waypoints.intShow, state.model.waypoints.intRange);

        this._iconLayer.buffer.clear();
        let iconsToDraw = [];
        let options = {
            icon: {size: 0},
            label: {priority: 0, offset: undefined}
        }

        for (let entry of this._registeredWaypoints.values()) {
            let viewPosition = state.projection.project(entry.waypoint.location, tempVector);
            let isInView = this._isInBounds(viewPosition, viewBoundLeft, viewBoundTop, viewBoundRight, viewBoundBottom);
            let showStandalone = false;
            let showAirway = entry.airway;
            if (entry.waypoint.icao !== undefined) {
                switch (entry.waypoint.type) {
                    case WT_ICAOWaypoint.Type.AIRPORT:
                        showStandalone = showAirport[entry.waypoint.size];
                        break;
                    case WT_ICAOWaypoint.Type.VOR:
                        showStandalone = showVOR;
                        break;
                    case WT_ICAOWaypoint.Type.NDB:
                        showStandalone = showNDB;
                        break;
                    case WT_ICAOWaypoint.Type.INT:
                        showStandalone = showINT;
                        break;
                }
            }

            let showIcon = (showStandalone || showAirway) && isInView;
            let showLabel = showIcon && showStandalone;
            if (!entry.icon || (showLabel && !entry.label)) {
                this._getWaypointIconAndLabelOptions(entry.waypoint, options);
            }
            if (showIcon) {
                if (!entry.icon) {
                    entry.icon = this._getWaypointIcon(entry.waypoint, options.icon);
                }
                iconsToDraw.push(entry.icon);
            }
            if (showLabel && !entry.showLabel) {
                if (!entry.label) {
                    entry.label = this._getWaypointLabel(entry.waypoint, options.label);
                }
                this._labelManager.add(entry.label);
            } else if (!showLabel && entry.showLabel) {
                this._labelManager.remove(entry.label);
            }

            if (entry.standalone && !this._isInBounds(viewPosition, deprecateBoundLeft, deprecateBoundTop, deprecateBoundRight, deprecateBoundBottom)) {
                entry.timer += dt;
                if (entry.timer >= WT_MapViewWaypointLayer.WAYPOINT_DEPRECATE_DELAY) {
                    this._deregisterWaypoint(entry.waypoint, false);
                }
            } else {
                entry.timer = 0;
            }

            entry.showIcon = showIcon;
            entry.showLabel = showLabel;
        }

        for (let icon of iconsToDraw.sort((a, b) => a.priority - b.priority)) {
            icon.draw(state, this._iconLayer.buffer.context);
        }
        this._iconLayer.display.clear();
        this._iconLayer.copyBufferToCanvas();
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        super.onUpdate(state);

        this._retrieveWaypointsInRange(state);
        this._updateAirways(state);
        this._updateRegisteredWaypoints(state);
        this._lastTime = state.currentTime / 1000;
        this._lastSearchedWaypointsCount = this._searchedWaypoints.length;
    }
}
WT_MapViewWaypointLayer.CLASS_DEFAULT = "waypointLayer";
WT_MapViewWaypointLayer.CONFIG_NAME_DEFAULT = "waypoints";
WT_MapViewWaypointLayer.WAYPOINT_ICON_CACHE_SIZE = 1000;
WT_MapViewWaypointLayer.WAYPOINT_LABEL_CACHE_SIZE = 1000;
WT_MapViewWaypointLayer.AIRWAY_LABEL_CACHE_SIZE = 1000;
WT_MapViewWaypointLayer.SEARCH_PARAM_CHANGE_DELAY = 0.5;                // seconds.
WT_MapViewWaypointLayer.SEARCH_UPDATE_INTERVAL = 1;                     // seconds.
WT_MapViewWaypointLayer.SEARCH_SIZE_MIN = 10;
WT_MapViewWaypointLayer.SEARCH_SIZE_MAX = 1000;
WT_MapViewWaypointLayer.SEARCH_AIRPORT_DENSITY = 0.01;                  // per square nautical mile
WT_MapViewWaypointLayer.SEARCH_VOR_DENSITY = 0.0005;                    // per square nautical mile
WT_MapViewWaypointLayer.SEARCH_NDB_DENSITY = 0.0005;                    // per square nautical mile
WT_MapViewWaypointLayer.SEARCH_INT_DENSITY = 0.04;                      // per square nautical mile
WT_MapViewWaypointLayer.WAYPOINT_SEARCH_RANGE_FACTOR = 1.91421356237;
WT_MapViewWaypointLayer.AIRWAY_OVERDRAW_FACTOR = 1.91421356237;
WT_MapViewWaypointLayer.WAYPOINT_DEPRECATE_DELAY = 60;                  // seconds.
WT_MapViewWaypointLayer.OPTIONS_DEF = {
    iconDirectory: {default: "", auto: true},

    userIconSize: {default: 15, auto: true},
    airportIconSize: {default: 30, auto: true},
    vorIconSize: {default: 25, auto: true},
    ndbIconSize: {default: 30, auto: true},
    intIconSize: {default: 15, auto: true},

    waypointLabelFontSize: {default: 15, auto: true},
    waypointLabelFontColor: {default: "white", auto: true},
    waypointLabelFontOutlineWidth: {default: 6, auto: true},
    waypointLabelFontOutlineColor: {default: "black", auto: true},

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
    airwayLabelBackgroundOutlineColor: {default: "color", auto: true},

    airwayLabelPriority: {default: 100, auto: true}
};
WT_MapViewWaypointLayer.CONFIG_PROPERTIES = [
    "iconDirectory",
    "userIconSize",
    "airportIconSize",
    "vorIconSize",
    "ndbIconSize",
    "intIconSize",
    "labelFontSize",
    "labelFontColor",
    "labelFontOutlineWidth",
    "labelFontOutlineColor",
    "userLabelPriority",
    "airportLabelPriority",
    "vorLabelPriority",
    "ndbLabelPriority",
    "intLabelPriority",
    "userLabelOffset",
    "airportLabelOffset",
    "vorLabelOffset",
    "ndbLabelOffset",
    "intLabelOffset"
];

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
  * @typedef WT_MapViewManagedWaypointEntry
  * @property {WT_Waypoint} waypoint
  * @property {WT_MapViewWaypointIcon} icon
  * @property {WT_MapViewWaypointLabel} label
  * @property {Boolean} showIcon
  * @property {Boolean} showLabel
  * @property {Boolean} standalone
  * @property {Boolean} airway
  */