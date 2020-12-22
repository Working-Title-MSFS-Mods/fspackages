class WT_MapViewFlightPlanLayer extends WT_MapViewMultiLayer {
    /**
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory - a factory to create waypoint objects from ICAO strings.
     * @param {WT_MapViewTextLabelManager} labelManager - the text label manager to use for managing waypoint labels.
     * @param {String} [className] - the name of the class to add to the new layer's top-level HTML element's class list.
     * @param {String} [configName] - the name of the property in the map view's config file to be associated with the new layer.
     */
    constructor(icaoWaypointFactory, labelManager, className = WT_MapViewFlightPlanLayer.CLASS_DEFAULT, configName = WT_MapViewFlightPlanLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._icaoWaypointFactory = icaoWaypointFactory;
        this._labelManager = labelManager;
        this._fpm = new WT_FlightPlanManager(icaoWaypointFactory);
        this._renderer = new WT_MapViewFlightPlanCanvasRenderer();
        this._renderer.setFlightPlan(this._fpm.activePlan);

        /**
         * @type {Map<String,WT_MapViewFlightPlanRegisteredWaypointEntry>}
         */
        this._registeredWaypoints = new Map();

        this._iconCache = new WT_MapViewWaypointImageIconCache(WT_MapViewFlightPlanLayer.WAYPOINT_ICON_CACHE_SIZE);
        this._labelCache = new WT_MapViewWaypointLabelCache(WT_MapViewFlightPlanLayer.WAYPOINT_LABEL_CACHE_SIZE);

        this._pathLayer = new WT_MapViewPersistentCanvas(WT_MapViewFlightPlanLayer.OVERDRAW_FACTOR);
        this._iconLayer = new WT_MapViewCanvas(true, true);
        this.addSubLayer(this._pathLayer);
        this.addSubLayer(this._iconLayer);

        this._optsManager = new WT_OptionsManager(this, WT_MapViewFlightPlanLayer.OPTIONS_DEF);

        this._tempOptions = {icon: {}, label: {}};

        this._activeLeg = null;
        this._lastDrawnActiveLeg = null;
        this._lastFPMUpdateTime = 0;
    }

    async _test() {
        this._flightPlanInterface = new WT_FlightPlanAsoboInterface(this._icaoWaypointFactory);
        let flightPlan = new WT_FlightPlan(this._icaoWaypointFactory);
        //await flightPlanInterface.syncFromGame(flightPlan);
        let kdtw = await this._icaoWaypointFactory.getAirport("A      KDTW ");
        flightPlan.setOrigin(kdtw);
        await flightPlan.setDeparture("BARII2", 1, 0);
        flightPlan.setDestination(kdtw);
        await flightPlan.setArrival("BONZZ2", 0, 2);
        await flightPlan.setApproach("ILS 3R", 0);
        let flightPlanCopy = new WT_FlightPlan(this._icaoWaypointFactory);
        flightPlanCopy.copyFrom(flightPlan);
        this._renderer.setFlightPlan(flightPlanCopy);
    }

    /**
     * @param {WT_MapViewState} state
     */
    onConfigLoaded(state) {
        for (let property of WT_MapViewFlightPlanLayer.CONFIG_PROPERTIES) {
            this._setPropertyFromConfig(property);
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    onAttached(state) {
        super.onAttached(state);
    }

    async _syncFlightPlan() {
        await this._fpm.syncActiveFromGame();
        this._renderer.setActiveLeg(await this._fpm.getActiveLeg());
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateFlightPlan(state) {
        let dt = state.currentTime / 1000 - this._lastFPMUpdateTime;
        if (dt < WT_MapViewFlightPlanLayer.FLIGHT_PLAN_SYNC_INTERVAL) {
            return;
        }

        this._syncFlightPlan();
        this._lastFPMUpdateTime = state.currentTime / 1000;
    }

    /**
     * Gets and saves icon and label options for the specified waypoint to an options object.
     * @param {WT_Waypoint} waypoint - the waypoint for which to get options.
     * @param {{icon:WT_MapViewWaypointIconOptions, label:WT_MapViewWaypointLabelOptions}} options - the options object to which to save the options.
     */
    _getWaypointIconAndLabelOptions(waypoint, options) {
        options.label.fontSize = this.waypointLabelFontSize;
        options.label.fontWeight = this.waypointLabelFontWeight;
        options.label.fontColor = this.waypointLabelFontColor;
        options.label.fontOutlineWidth = this.waypointLabelFontOutlineWidth;
        options.label.fontOutlineColor = this.waypointLabelFontOutlineColor;
        options.label.showBackground = this.waypointLabelShowBackground;
        options.label.backgroundColor = this.waypointLabelBackgroundColor;
        options.label.backgroundPadding = this.waypointLabelBackgroundPadding;
        options.label.backgroundOutlineWidth = this.waypointLabelBackgroundOutlineWidth;
        options.label.backgroundOutlineColor = this.waypointLabelBackgroundOutlineColor;
        options.label.alwaysShow = this.waypointLabelAlwaysShow;

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
     *
     * @param {WT_Waypoint} waypoint
     * @param {WT_MapViewWaypointIconOptions} options
     */
    _getIcon(waypoint, options) {
        let icon = this._iconCache.getIcon(waypoint, options.priority, this.iconDirectory);
        icon.size = options.size;
        return icon;
    }

    /**
     *
     * @param {WT_Waypoint} waypoint
     * @param {WT_MapViewWaypointLabelOptions} options
     */
    _getLabel(waypoint, options) {
        let label = this._labelCache.getLabel(waypoint, options.priority, options.alwaysShow);
        label.setOptions(options);
        return label;
    }

    /**
     *
     * @param {WT_Waypoint} waypoint
     */
    _registerWaypoint(waypoint) {
        let entry = this._registeredWaypoints.get(waypoint.uniqueID);
        if (!entry) {
            this._getWaypointIconAndLabelOptions(waypoint, this._tempOptions);
            this._registeredWaypoints.set(waypoint.uniqueID, {waypoint: waypoint, icon: this._getIcon(waypoint, this._tempOptions.icon), label: this._getLabel(waypoint, this._tempOptions.label), showLabel: false});
        }
    }

    /**
     *
     * @param {WT_Waypoint} waypoint
     */
    _deregisterWaypoint(waypoint) {
        let entry = this._registeredWaypoints.get(waypoint.uniqueID);
        if (entry) {
            if (entry.showLabel) {
                this._labelManager.remove(entry.label);
            }
            this._registeredWaypoints.delete(waypoint.uniqueID);
        }
    }

    _clearRenderedWaypoints() {
        for (let waypoint of this._renderer.waypointsRendered()) {
            this._deregisterWaypoint(waypoint);
        }
    }

    _registerRenderedWaypoints() {
        for (let waypoint of this._renderer.waypointsRendered()) {
            if (waypoint.icao !== undefined) {
                this._registerWaypoint(waypoint);
            }
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    _renderFlightPlan(state) {
        this._clearRenderedWaypoints();
        this._pathLayer.resetBuffer(state);
        this._renderer.render(state, this._pathLayer.buffer.projectionRenderer, this._pathLayer.buffer.context);
        this._pathLayer.redrawDisplay(state);
        this._registerRenderedWaypoints();
        this._lastDrawnActiveLeg = this._activeLeg;
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateRegisteredWaypoints(state) {
        let iconsToDraw = [];
        for (let entry of this._registeredWaypoints.values()) {
            let show = state.projection.isInView(entry.waypoint.location, 0.05);
            if (show) {
                iconsToDraw.push(entry.icon);
            }
            if (show && !entry.showLabel) {
                this._labelManager.add(entry.label);
            } else if (!show && entry.showLabel) {
                this._labelManager.remove(entry.label);
            }
            entry.showLabel = show;
        }

        iconsToDraw.sort((a, b) => b.priority - a.priority);
        this._iconLayer.buffer.clear();
        for (let icon of iconsToDraw) {
            icon.draw(state, this._iconLayer.buffer.context);
        }
        this._iconLayer.display.clear();
        this._iconLayer.copyBufferToCanvas();
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updatePath(state) {
        this._pathLayer.update(state);

        let isImageInvalid = this._pathLayer.display.isInvalid ||
                             this._renderer.needsRedraw();

        if (isImageInvalid) {
            this._renderFlightPlan(state);
        }

        this._updateRegisteredWaypoints(state);
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        super.onUpdate(state);

        this._updateFlightPlan(state)
        this._updatePath(state);
    }
}
WT_MapViewFlightPlanLayer.CLASS_DEFAULT = "flightPlanLayer";
WT_MapViewFlightPlanLayer.CONFIG_NAME_DEFAULT = "flightPlan";
WT_MapViewFlightPlanLayer.FLIGHT_PLAN_SYNC_INTERVAL = 5; // seconds
WT_MapViewFlightPlanLayer.WAYPOINT_ICON_CACHE_SIZE = 100;
WT_MapViewFlightPlanLayer.WAYPOINT_LABEL_CACHE_SIZE = 100;
WT_MapViewFlightPlanLayer.OVERDRAW_FACTOR = 1.91421356237;
WT_MapViewFlightPlanLayer.OPTIONS_DEF = {
    iconDirectory: {default: "", auto: true},

    userIconSize: {default: 15, auto: true},
    airportIconSize: {default: 30, auto: true},
    vorIconSize: {default: 25, auto: true},
    ndbIconSize: {default: 30, auto: true},
    intIconSize: {default: 15, auto: true},

    waypointLabelFontSize: {default: 15, auto: true},
    waypointLabelFontWeight: {default: "bold", auto: true},
    waypointLabelFontColor: {default: "black", auto: true},
    waypointLabelFontOutlineWidth: {default: 0, auto: true},
    waypointLabelFontOutlineColor: {default: "black", auto: true},
    waypointLabelShowBackground: {default: true, auto: true},
    waypointLabelBackgroundColor: {default: "white", auto: true},
    waypointLabelBackgroundPadding: {default: [1], auto: true},
    waypointLabelBackgroundOutlineWidth: {default: 1, auto: true},
    waypointLabelBackgroundOutlineColor: {default: "black", auto: true},

    waypointLabelAlwaysShow: {default: true, auto: true},

    userIconPriority: {default: 15, auto: true},
    airportIconPriority: {default: 10, auto: true},
    vorIconPriority: {default: 2, auto: true},
    ndbIconPriority: {default: 1, auto: true},
    intIconPriority: {default: 0, auto: true},

    userLabelPriority: {default: 1025, auto: true},
    airportLabelPriority: {default: 1020, auto: true},
    vorLabelPriority: {default: 1012, auto: true},
    ndbLabelPriority: {default: 1011, auto: true},
    intLabelPriority: {default: 1010, auto: true},

    userLabelOffset: {default: {x: 0, y: -20}, auto: true},
    airportLabelOffset: {default: {x: 0, y: -27.5}, auto: true},
    vorLabelOffset: {default: {x: 0, y: -25}, auto: true},
    ndbLabelOffset: {default: {x: 0, y: -27.5}, auto: true},
    intLabelOffset: {default: {x: 0, y: -20}, auto: true},
};
WT_MapViewFlightPlanLayer.CONFIG_PROPERTIES = [
    "iconDirectory",
    "userIconSize",
    "airportIconSize",
    "vorIconSize",
    "ndbIconSize",
    "intIconSize",
    "waypointLabelFontSize",
    "waypointLabelFontWeight",
    "waypointLabelFontColor",
    "waypointLabelFontOutlineWidth",
    "waypointLabelFontOutlineColor",
    "waypointLabelShowBackground",
    "waypointLabelBackgroundColor",
    "waypointLabelBackgroundPadding",
    "waypointLabelBackgroundOutlineWidth",
    "waypointLabelBackgroundOutlineColor",
    "waypointLabelAlwaysShow",
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
 * @typedef WT_MapViewFlightPlanRegisteredWaypointEntry
 * @property {WT_Waypoint} waypoint
 * @property {WT_MapViewWaypointIcon} icon
 * @property {WT_MapViewWaypointLabel} label
 */