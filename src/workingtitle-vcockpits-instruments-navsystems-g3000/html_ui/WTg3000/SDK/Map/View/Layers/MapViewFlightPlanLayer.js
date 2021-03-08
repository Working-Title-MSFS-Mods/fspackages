/**
 * The active flight plan (including Direct To). This layer will draw the active flight plan's waypoints and paths between
 * waypoints/fixes. Options are available to style the path/waypoint for the active leg differently from non-active legs.
 */
class WT_MapViewFlightPlanLayer extends WT_MapViewMultiLayer {
    /**
     * @param {WT_FlightPlanManager} flightPlanManager - the flight plan manager containing the active flight plan to render.
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory - a factory to create waypoint objects from ICAO strings.
     * @param {WT_MapViewWaypointCanvasRenderer} waypointRenderer - the renderer to use for drawing waypoints.
     * @param {WT_MapViewTextLabelManager} labelManager - the text label manager to use for managing waypoint labels.
     * @param {String} [className] - the name of the class to add to the new layer's top-level HTML element's class list.
     * @param {String} [configName] - the name of the property in the map view's config file to be associated with the new layer.
     */
    constructor(flightPlanManager, icaoWaypointFactory, waypointRenderer, labelManager, legStyleChooser, className = WT_MapViewFlightPlanLayer.CLASS_DEFAULT, configName = WT_MapViewFlightPlanLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._fpm = flightPlanManager;
        this._icaoWaypointFactory = icaoWaypointFactory;
        this._labelManager = labelManager;
        this._fpRenderer = new WT_MapViewFlightPlanCanvasRenderer(legStyleChooser);
        this._fpRenderer.setFlightPlan(this._fpm.activePlan);
        this._drctRenderer = new WT_MapViewDirectToCanvasRenderer();
        this._drctRenderer.setDirectTo(this._fpm.directTo);

        this._pathLayer = new WT_MapViewPersistentCanvas(WT_MapViewFlightPlanLayer.OVERDRAW_FACTOR);
        this._iconLayer = new WT_MapViewCanvas(true, true);
        this.addSubLayer(this._pathLayer);
        this.addSubLayer(this._iconLayer);

        this._waypointRenderer = waypointRenderer;
        this._waypointRenderer.setCanvasContext(WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN, this._iconLayer.buffer.context);
        this._waypointRenderer.setCanvasContext(WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN_ACTIVE, this._iconLayer.buffer.context);
        this._inactiveWaypointStyleHandler = {getOptions: this._getInactiveWaypointStyleOptions.bind(this)};
        this._activeWaypointStyleHandler = {getOptions: this._getActiveWaypointStyleOptions.bind(this)};

        this._optsManager = new WT_OptionsManager(this, WT_MapViewFlightPlanLayer.OPTIONS_DEF);

        this._lastActiveWaypoint = null;

        this._lastFPMUpdateTime = 0;
    }

    _setFlightPlanRendererOpts(options) {
        this._fpRenderer.setOptions(options);
    }

    /**
     * Gets icon and label style options for waypoint that is not part of the current active leg.
     * @param {WT_MapViewState} state - the current map view state.
     * @param {WT_Waypoint} waypoint - the waypoint for which to get options.
     */
    _getInactiveWaypointStyleOptions(state, waypoint) {
        if (waypoint instanceof WT_ICAOWaypoint) {
            switch (waypoint.type) {
                case WT_ICAOWaypoint.Type.AIRPORT:
                    return this._inactiveStyles.airport[waypoint.size];
                case WT_ICAOWaypoint.Type.VOR:
                    return this._inactiveStyles.vor;
                case WT_ICAOWaypoint.Type.NDB:
                    return this._inactiveStyles.ndb;
                case WT_ICAOWaypoint.Type.INT:
                    return this._inactiveStyles.int;
            }
        }

        if (waypoint instanceof WT_RunwayWaypoint) {
            return this._inactiveStyles.rwy;
        }

        return this._inactiveStyles.user;
    }

    /**
     * Gets icon and label style options a waypoint that is part of the current active leg.
     * @param {WT_MapViewState} state - the current map view state.
     * @param {WT_Waypoint} waypoint - the waypoint for which to get options.
     */
    _getActiveWaypointStyleOptions(state, waypoint) {
        if (waypoint.icao) {
            switch (waypoint.type) {
                case WT_ICAOWaypoint.Type.AIRPORT:
                    return this._activeStyles.airport[waypoint.size];
                case WT_ICAOWaypoint.Type.VOR:
                    return this._activeStyles.vor;
                case WT_ICAOWaypoint.Type.NDB:
                    return this._activeStyles.ndb;
                case WT_ICAOWaypoint.Type.INT:
                    return this._activeStyles.int;
            }
        }

        if (waypoint instanceof WT_RunwayWaypoint) {
            return this._activeStyles.rwy;
        }

        return this._activeStyles.user;
    }

    _setCommonInactiveLabelStyles(options) {
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

    _initInactiveStyleOptions() {
        this._inactiveStyles = {
            airport: [
                {
                    icon: {
                        priority: this.airportIconPriority,
                        size: this.airportIconSize
                    },
                    label: {
                        priority: this.airportLabelPriority,
                        alwaysShow: this.waypointLabelAlwaysShow,
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
                        alwaysShow: this.waypointLabelAlwaysShow,
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
                        alwaysShow: this.waypointLabelAlwaysShow,
                        offset: this.airportLabelOffset,
                    }
                }
            ],
            vor: {
                icon: {
                    priority: this.vorIconPriority,
                    size: this.vorIconSize
                },
                label: {
                    priority: this.vorLabelPriority,
                    alwaysShow: this.waypointLabelAlwaysShow,
                    offset: this.vorLabelOffset,
                }
            },
            ndb: {
                icon: {
                    priority: this.ndbIconPriority,
                    size: this.ndbIconSize
                },
                label: {
                    priority: this.ndbLabelPriority,
                    alwaysShow: this.waypointLabelAlwaysShow,
                    offset: this.ndbLabelOffset,
                }
            },
            int: {
                icon: {
                    priority: this.intIconPriority,
                    size: this.intIconSize
                },
                label: {
                    priority: this.intLabelPriority,
                    alwaysShow: this.waypointLabelAlwaysShow,
                    offset: this.intLabelOffset,
                }
            },
            rwy: {
                icon: {
                    priority: this.rwyIconPriority,
                    size: this.rwyIconSize
                },
                label: {
                    priority: this.rwyLabelPriority,
                    alwaysShow: this.waypointLabelAlwaysShow,
                    offset: this.rwyLabelOffset,
                }
            },
            user: {
                icon: {
                    priority: this.userIconPriority,
                    size: this.userIconSize
                },
                label: {
                    priority: this.userLabelPriority,
                    alwaysShow: this.waypointLabelAlwaysShow,
                    offset: this.userLabelOffset,
                }
            }
        };

        this._setCommonInactiveLabelStyles(this._inactiveStyles.airport[0].label);
        this._setCommonInactiveLabelStyles(this._inactiveStyles.airport[1].label);
        this._setCommonInactiveLabelStyles(this._inactiveStyles.airport[2].label);
        this._setCommonInactiveLabelStyles(this._inactiveStyles.vor.label);
        this._setCommonInactiveLabelStyles(this._inactiveStyles.ndb.label);
        this._setCommonInactiveLabelStyles(this._inactiveStyles.int.label);
        this._setCommonInactiveLabelStyles(this._inactiveStyles.rwy.label);
        this._setCommonInactiveLabelStyles(this._inactiveStyles.user.label);
    }

    _setCommonActiveLabelStyles(options) {
        options.fontWeight = this.activeLabelFontWeight;
        options.fontSize = this.activeLabelFontSize;
        options.fontColor = this.activeLabelFontColor;
        options.fontOutlineWidth = this.activeLabelFontOutlineWidth;
        options.fontOutlineColor = this.activeLabelFontOutlineColor;
        options.showBackground = this.activeLabelShowBackground;
        if (options.showBackground) {
            options.backgroundColor = this.activeLabelBackgroundColor;
            options.backgroundPadding = this.activeLabelBackgroundPadding;
            options.backgroundBorderRadius = this.activeLabelBackgroundBorderRadius;
            options.backgroundOutlineWidth = this.activeLabelBackgroundOutlineWidth;
            options.backgroundOutlineColor = this.activeLabelBackgroundOutlineColor;
        }
    }

    _initActiveStyleOptions() {
        this._activeStyles = {
            airport: [
                {
                    icon: {
                        priority: this.airportIconPriority + 50,
                        size: this.airportIconSize
                    },
                    label: {
                        priority: this.airportLabelPriority + 50,
                        alwaysShow: this.waypointLabelAlwaysShow,
                        offset: this.airportLabelOffset,
                    }
                },
                {
                    icon: {
                        priority: this.airportIconPriority + 50 - 1,
                        size: this.airportIconSize
                    },
                    label: {
                        priority: this.airportLabelPriority + 50 - 1,
                        alwaysShow: this.waypointLabelAlwaysShow,
                        offset: this.airportLabelOffset,
                    }
                },
                {
                    icon: {
                        priority: this.airportIconPriority + 50 - 2,
                        size: this.airportIconSize
                    },
                    label: {
                        priority: this.airportLabelPriority + 50 - 2,
                        alwaysShow: this.waypointLabelAlwaysShow,
                        offset: this.airportLabelOffset,
                    }
                }
            ],
            vor: {
                icon: {
                    priority: this.vorIconPriority + 50,
                    size: this.vorIconSize
                },
                label: {
                    priority: this.vorLabelPriority + 50,
                    alwaysShow: this.waypointLabelAlwaysShow,
                    offset: this.vorLabelOffset,
                }
            },
            ndb: {
                icon: {
                    priority: this.ndbIconPriority + 50,
                    size: this.ndbIconSize
                },
                label: {
                    priority: this.ndbLabelPriority + 50,
                    alwaysShow: this.waypointLabelAlwaysShow,
                    offset: this.ndbLabelOffset,
                }
            },
            int: {
                icon: {
                    priority: this.intIconPriority + 50,
                    size: this.intIconSize
                },
                label: {
                    priority: this.intLabelPriority + 50,
                    alwaysShow: this.waypointLabelAlwaysShow,
                    offset: this.intLabelOffset,
                }
            },
            rwy: {
                icon: {
                    priority: this.rwyIconPriority + 50,
                    size: this.rwyIconSize
                },
                label: {
                    priority: this.rwyLabelPriority + 50,
                    alwaysShow: this.waypointLabelAlwaysShow,
                    offset: this.rwyLabelOffset,
                }
            },
            user: {
                icon: {
                    priority: this.userIconPriority + 50,
                    size: this.userIconSize
                },
                label: {
                    priority: this.userLabelPriority + 50,
                    alwaysShow: this.waypointLabelAlwaysShow,
                    offset: this.userLabelOffset,
                }
            }
        };

        this._setCommonActiveLabelStyles(this._activeStyles.airport[0].label);
        this._setCommonActiveLabelStyles(this._activeStyles.airport[1].label);
        this._setCommonActiveLabelStyles(this._activeStyles.airport[2].label);
        this._setCommonActiveLabelStyles(this._activeStyles.vor.label);
        this._setCommonActiveLabelStyles(this._activeStyles.ndb.label);
        this._setCommonActiveLabelStyles(this._activeStyles.int.label);
        this._setCommonActiveLabelStyles(this._activeStyles.rwy.label);
        this._setCommonActiveLabelStyles(this._activeStyles.user.label);
    }

    _initStyleOptions() {
        this._initInactiveStyleOptions();
        this._initActiveStyleOptions();
    }

    _setWaypointRendererFactories() {
        let inactiveIconFactory = new WT_MapViewWaypointImageIconCachedFactory(WT_MapViewFlightPlanLayer.WAYPOINT_ICON_CACHE_SIZE, this.iconDirectory);
        let activeIconFactory = new WT_MapViewWaypointImageIconCachedFactory(WT_MapViewFlightPlanLayer.WAYPOINT_ICON_CACHE_SIZE, this.iconDirectory);
        this._waypointRenderer.setIconFactory(WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN, inactiveIconFactory);
        this._waypointRenderer.setIconFactory(WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN_ACTIVE, activeIconFactory);

        let inactiveLabelFactory = new WT_MapViewWaypointIdentLabelCachedFactory(WT_MapViewFlightPlanLayer.WAYPOINT_LABEL_CACHE_SIZE);
        let activeLabelFactory = new WT_MapViewWaypointIdentLabelCachedFactory(WT_MapViewFlightPlanLayer.WAYPOINT_LABEL_CACHE_SIZE);
        this._waypointRenderer.setLabelFactory(WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN, inactiveLabelFactory);
        this._waypointRenderer.setLabelFactory(WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN_ACTIVE, activeLabelFactory);
    }

    _setWaypointRendererStyleHandlers() {
        this._initStyleOptions();
        this._waypointRenderer.setStyleOptionHandler(WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN, this._inactiveWaypointStyleHandler);
        this._waypointRenderer.setStyleOptionHandler(WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN_ACTIVE, this._activeWaypointStyleHandler);
    }

    /**
     * @param {WT_MapViewState} state
     */
    onConfigLoaded(state) {
        for (let property of WT_MapViewFlightPlanLayer.CONFIG_PROPERTIES) {
            this._setPropertyFromConfig(property);
        }
        this._setFlightPlanRendererOpts(this.flightPlanOptions);
        this._setWaypointRendererFactories();
        this._setWaypointRendererStyleHandlers();
    }

    _registerWaypoint(waypoint, context) {
        if (waypoint instanceof WT_ICAOWaypoint || waypoint instanceof WT_RunwayWaypoint) {
            this._waypointRenderer.register(waypoint, context);
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateActiveLeg(state) {
        let currentActiveLeg = this._fpm.getActiveLeg(true);
        this._fpRenderer.setActiveLeg(currentActiveLeg);
        let currentActiveWaypoint = currentActiveLeg ? currentActiveLeg.fix : (this._drctRenderer.destinationRendered());

        if ((this._lastActiveWaypoint === null && currentActiveWaypoint === null) || (this._lastActiveWaypoint && this._lastActiveWaypoint.equals(currentActiveWaypoint))) {
            return;
        }

        if (this._lastActiveWaypoint) {
            this._waypointRenderer.deregister(this._lastActiveWaypoint, WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN_ACTIVE);
        }
        if (currentActiveWaypoint) {
            this._registerWaypoint(currentActiveWaypoint, WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN_ACTIVE);
        }
        this._lastActiveWaypoint = currentActiveWaypoint;
    }

    _clearRenderedWaypoints() {
        for (let waypoint of this._fpRenderer.getWaypointsRendered()) {
            this._waypointRenderer.deregister(waypoint, WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN | WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN_ACTIVE);
        }
        this._waypointRenderer.deregister(this._drctRenderer.originRendered(), WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN | WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN_ACTIVE);
        this._waypointRenderer.deregister(this._drctRenderer.destinationRendered(), WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN | WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN_ACTIVE);
        this._lastActiveWaypoint = null;
    }

    _registerRenderedWaypoints() {
        for (let waypoint of this._fpRenderer.getWaypointsRendered()) {
            this._registerWaypoint(waypoint, WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN);
        }
        let drctOrigin = this._drctRenderer.originRendered();
        if (drctOrigin) {
            this._registerWaypoint(drctOrigin, WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN);
        }
        let drctDestination = this._drctRenderer.destinationRendered();
        if (drctDestination) {
            this._registerWaypoint(drctDestination, WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN);
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    _renderFlightPlan(state) {
        this._clearRenderedWaypoints();
        this._pathLayer.syncBuffer(state);
        this._fpRenderer.render(state, this._pathLayer.buffer.projectionRenderer, this._pathLayer.buffer.context);
        this._drctRenderer.render(state, this._pathLayer.buffer.projectionRenderer, this._pathLayer.buffer.context);
        this._pathLayer.syncDisplay(state);
        this._pathLayer.resetBuffer();
        this._registerRenderedWaypoints();
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateWaypointLayer(state) {
        this._iconLayer.display.clear();
        this._iconLayer.copyBufferToCanvas();
        this._iconLayer.resetBuffer();
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updatePath(state) {
        this._pathLayer.update(state);

        let isImageInvalid = this._pathLayer.display.isInvalid ||
                             this._fpRenderer.needsRedraw() ||
                             this._drctRenderer.needsRedraw();

        if (isImageInvalid) {
            this._renderFlightPlan(state);
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        super.onUpdate(state);

        this._updateActiveLeg(state);
        this._updatePath(state);
        this._updateWaypointLayer(state);
    }
}
WT_MapViewFlightPlanLayer.CLASS_DEFAULT = "flightPlanLayer";
WT_MapViewFlightPlanLayer.CONFIG_NAME_DEFAULT = "flightPlan";
WT_MapViewFlightPlanLayer.FLIGHT_PLAN_SYNC_INTERVAL = 5; // seconds
WT_MapViewFlightPlanLayer.WAYPOINT_ICON_CACHE_SIZE = 100;
WT_MapViewFlightPlanLayer.WAYPOINT_LABEL_CACHE_SIZE = 100;
WT_MapViewFlightPlanLayer.OVERDRAW_FACTOR = 1.91421356237;
WT_MapViewFlightPlanLayer.OPTIONS_DEF = {
    flightPlanOptions: {default: {}, auto: true},

    iconDirectory: {default: "", auto: true},

    userIconSize: {default: 15, auto: true},
    airportIconSize: {default: 30, auto: true},
    vorIconSize: {default: 25, auto: true},
    ndbIconSize: {default: 30, auto: true},
    intIconSize: {default: 15, auto: true},
    rwyIconSize: {default: 15, auto: true},

    waypointLabelFontSize: {default: 15, auto: true},
    waypointLabelFontWeight: {default: "bold", auto: true},
    waypointLabelFontColor: {default: "black", auto: true},
    waypointLabelFontOutlineWidth: {default: 0, auto: true},
    waypointLabelFontOutlineColor: {default: "black", auto: true},
    waypointLabelShowBackground: {default: true, auto: true},
    waypointLabelBackgroundColor: {default: "white", auto: true},
    waypointLabelBackgroundPadding: {default: [1], auto: true},
    waypointLabelBackgroundBorderRadius: {default: 0, auto: true},
    waypointLabelBackgroundOutlineWidth: {default: 1, auto: true},
    waypointLabelBackgroundOutlineColor: {default: "black", auto: true},

    activeLabelFontSize: {default: 15, auto: true},
    activeLabelFontWeight: {default: "bold", auto: true},
    activeLabelFontColor: {default: "9c70b1", auto: true},
    activeLabelFontOutlineWidth: {default: 0, auto: true},
    activeLabelFontOutlineColor: {default: "black", auto: true},
    activeLabelShowBackground: {default: true, auto: true},
    activeLabelBackgroundColor: {default: "black", auto: true},
    activeLabelBackgroundPadding: {default: [1], auto: true},
    activeLabelBackgroundBorderRadius: {default: 0, auto: true},
    activeLabelBackgroundOutlineWidth: {default: 1, auto: true},
    activeLabelBackgroundOutlineColor: {default: "white", auto: true},

    waypointLabelAlwaysShow: {default: true, auto: true},

    userIconPriority: {default: 115, auto: true},
    airportIconPriority: {default: 110, auto: true},
    vorIconPriority: {default: 102, auto: true},
    ndbIconPriority: {default: 101, auto: true},
    intIconPriority: {default: 100, auto: true},
    rwyIconPriority: {default: 100, auto: true},

    userLabelPriority: {default: 1025, auto: true},
    airportLabelPriority: {default: 1020, auto: true},
    vorLabelPriority: {default: 1012, auto: true},
    ndbLabelPriority: {default: 1011, auto: true},
    intLabelPriority: {default: 1010, auto: true},
    rwyLabelPriority: {default: 1010, auto: true},

    userLabelOffset: {default: {x: 0, y: -20}, auto: true},
    airportLabelOffset: {default: {x: 0, y: -27.5}, auto: true},
    vorLabelOffset: {default: {x: 0, y: -25}, auto: true},
    ndbLabelOffset: {default: {x: 0, y: -27.5}, auto: true},
    intLabelOffset: {default: {x: 0, y: -20}, auto: true},
    rwyLabelOffset: {default: {x: 0, y: -20}, auto: true}
};
WT_MapViewFlightPlanLayer.CONFIG_PROPERTIES = [
    "flightPlanOptions",
    "iconDirectory",
    "userIconSize",
    "airportIconSize",
    "vorIconSize",
    "ndbIconSize",
    "intIconSize",
    "rwyIconSize",
    "waypointLabelFontSize",
    "waypointLabelFontWeight",
    "waypointLabelFontColor",
    "waypointLabelFontOutlineWidth",
    "waypointLabelFontOutlineColor",
    "waypointLabelShowBackground",
    "waypointLabelBackgroundColor",
    "waypointLabelBackgroundPadding",
    "waypointLabelBackgroundBorderRadius",
    "waypointLabelBackgroundOutlineWidth",
    "waypointLabelBackgroundOutlineColor",
    "activeLabelFontSize",
    "activeLabelFontWeight",
    "activeLabelFontColor",
    "activeLabelFontOutlineWidth",
    "activeLabelFontOutlineColor",
    "activeLabelShowBackground",
    "activeLabelBackgroundColor",
    "activeLabelBackgroundPadding",
    "activeLabelBackgroundBorderRadius",
    "activeLabelBackgroundOutlineWidth",
    "activeLabelBackgroundOutlineColor",
    "waypointLabelAlwaysShow",
    "userLabelPriority",
    "airportLabelPriority",
    "vorLabelPriority",
    "ndbLabelPriority",
    "intLabelPriority",
    "rwyLabelPriority",
    "userLabelOffset",
    "airportLabelOffset",
    "vorLabelOffset",
    "ndbLabelOffset",
    "intLabelOffset",
    "rwyLabelOffset"
];

/**
 * @typedef WT_MapViewFlightPlanRegisteredWaypointEntry
 * @property {WT_Waypoint} waypoint
 * @property {WT_MapViewWaypointIcon} icon
 * @property {WT_MapViewWaypointLabel} label
 */