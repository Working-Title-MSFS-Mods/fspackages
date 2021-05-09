/**
 * A layer which depicts a flight plan. This layer will draw the flight plan's waypoints and paths between waypoints/
 * fixes. The use of this layer requires the .flightPlan module to be added to the map model.
 */
class WT_MapViewFlightPlanLayer extends WT_MapViewMultiLayer {
    /**
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory - a factory to create waypoint objects from ICAO strings.
     * @param {WT_MapViewWaypointCanvasRenderer} waypointRenderer - the renderer to use for drawing waypoints.
     * @param {WT_MapViewTextLabelManager} labelManager - the text label manager to use for managing waypoint labels.
     * @param {WT_MapViewFlightPlanLegCanvasStyler} legStyler - the leg styler to use for determining how to render the paths for individual flight plan legs.
     * @param {String} [className] - the name of the class to add to the new layer's top-level HTML element's class list.
     * @param {String} [configName] - the name of the property in the map view's config file to be associated with the new layer.
     */
    constructor(icaoWaypointFactory, waypointRenderer, labelManager, legStyler, className = WT_MapViewFlightPlanLayer.CLASS_DEFAULT, configName = WT_MapViewFlightPlanLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._icaoWaypointFactory = icaoWaypointFactory;
        this._labelManager = labelManager;
        this._fpRenderer = new WT_MapViewFlightPlanCanvasRenderer(legStyler);

        this._pathLayer = new WT_MapViewPersistentCanvas(WT_MapViewFlightPlanLayer.OVERDRAW_FACTOR);
        this._iconLayer = new WT_MapViewCanvas(false, true);
        this.addSubLayer(this._pathLayer);
        this.addSubLayer(this._iconLayer);

        this._waypointRenderer = waypointRenderer;

        this._initWaypointRenderer();
        this._initWaypointStyleHandler();
        this._initOptionsManager();
    }

    _initWaypointRenderer() {
        this._waypointRenderer.setCanvasContext(WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN, this._iconLayer.display.context);
    }

    _initWaypointStyleHandler() {
        this._waypointStyleHandler = {getOptions: this._getWaypointStyleOptions.bind(this)};
    }

    _initOptionsManager() {
        this._optsManager = new WT_OptionsManager(this, WT_MapViewFlightPlanLayer.OPTIONS_DEF);
    }

    /**
     * @param {WT_MapViewState} state
     */
    isVisible(state) {
        return state.model.flightPlan.show;
    }

    _getConfigProperties() {
        return WT_MapViewFlightPlanLayer.CONFIG_PROPERTIES;
    }

    _setFlightPlanRendererOpts(options) {
        this._fpRenderer.setOptions(options);
    }

    _setFlightPlanLegStylerOpts(options) {
        this._fpRenderer.legStyler.setOptions(options);
    }

    /**
     *
     * @param {WT_MapViewState} state - the current map view state.
     * @param {WT_Waypoint} waypoint - the waypoint for which to get options.
     * @param {Object} styles
     */
    _chooseOptionsFromStyles(state, waypoint, styles) {
        if (waypoint instanceof WT_ICAOWaypoint) {
            switch (waypoint.type) {
                case WT_ICAOWaypoint.Type.AIRPORT:
                    return styles.airport[waypoint.size];
                case WT_ICAOWaypoint.Type.VOR:
                    return styles.vor;
                case WT_ICAOWaypoint.Type.NDB:
                    return styles.ndb;
                case WT_ICAOWaypoint.Type.INT:
                    return styles.int;
            }
        }

        if (waypoint instanceof WT_RunwayWaypoint) {
            return styles.rwy;
        } else if (waypoint instanceof WT_FlightPathWaypoint) {
            return styles.flightPath;
        }

        return styles.user;
    }

    /**
     * Gets icon and label style options for waypoint that is not part of the current active leg.
     * @param {WT_MapViewState} state - the current map view state.
     * @param {WT_Waypoint} waypoint - the waypoint for which to get options.
     */
    _getWaypointStyleOptions(state, waypoint) {
        return this._chooseOptionsFromStyles(state, waypoint, this._styles);
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
        this._styles = {
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
            flightPath: {
                icon: {
                    priority: this.flightPathIconPriority,
                    size: this.flightPathIconSize
                },
                label: {
                    priority: this.flightPathLabelPriority,
                    alwaysShow: this.waypointLabelAlwaysShow,
                    offset: this.flightPathLabelOffset,
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

        this._setCommonLabelStyles(this._styles.airport[0].label);
        this._setCommonLabelStyles(this._styles.airport[1].label);
        this._setCommonLabelStyles(this._styles.airport[2].label);
        this._setCommonLabelStyles(this._styles.vor.label);
        this._setCommonLabelStyles(this._styles.ndb.label);
        this._setCommonLabelStyles(this._styles.int.label);
        this._setCommonLabelStyles(this._styles.rwy.label);
        this._setCommonLabelStyles(this._styles.flightPath.label);
        this._setCommonLabelStyles(this._styles.user.label);
    }

    _setWaypointRendererFactories() {
        let iconFactory = new WT_MapViewWaypointImageIconCachedFactory(WT_MapViewFlightPlanLayer.WAYPOINT_ICON_CACHE_SIZE, this.iconDirectory);
        this._waypointRenderer.setIconFactory(WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN, iconFactory);

        let labelFactory = new WT_MapViewWaypointIdentLabelCachedFactory(WT_MapViewFlightPlanLayer.WAYPOINT_LABEL_CACHE_SIZE);
        this._waypointRenderer.setLabelFactory(WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN, labelFactory);
    }

    _setWaypointRendererStyleHandlers() {
        this._initStyleOptions();
        this._waypointRenderer.setStyleOptionHandler(WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN, this._waypointStyleHandler);
    }

    /**
     * @param {WT_MapViewState} state
     */
    onConfigLoaded(state) {
        for (let property of this._getConfigProperties()) {
            this._setPropertyFromConfig(property);
        }
        this._setFlightPlanRendererOpts(this.flightPlanRendererOptions);
        this._setFlightPlanLegStylerOpts(this.flightPlanLegStylerOptions);
        this._setWaypointRendererFactories();
        this._setWaypointRendererStyleHandlers();
    }

    _updateFlightPlan(state) {
        if (this._fpRenderer.flightPlan !== state.model.flightPlan.plan) {
            this._fpRenderer.setFlightPlan(state.model.flightPlan.plan);
        }
    }

    _registerWaypoint(waypoint, context) {
        this._waypointRenderer.register(waypoint, context);
    }

    _clearRenderedWaypoints() {
        for (let waypoint of this._fpRenderer.getWaypointsRendered()) {
            this._waypointRenderer.deregister(waypoint, WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN);
        }
    }

    _registerRenderedWaypoints() {
        for (let waypoint of this._fpRenderer.getWaypointsRendered()) {
            this._registerWaypoint(waypoint, WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN);
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    _renderFlightPlan(state) {
        this._clearRenderedWaypoints();
        this._pathLayer.syncBuffer(state);
        this._fpRenderer.render(state, this._pathLayer.buffer.projectionRenderer, this._pathLayer.buffer.context);
        this._pathLayer.syncDisplay(state);
        this._pathLayer.resetBuffer();
        this._registerRenderedWaypoints();
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateWaypointLayer(state) {
        this._iconLayer.display.clear();
    }

    /**
     * @param {WT_MapViewState} state
     * @returns {Boolean}
     */
    _checkIfImageInvalid(state) {
        return this._pathLayer.display.isInvalid ||
               this._fpRenderer.needsRedraw();
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updatePath(state) {
        this._pathLayer.update(state);

        let isImageInvalid = this._checkIfImageInvalid(state);

        if (isImageInvalid) {
            this._renderFlightPlan(state);
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    _doUpdate(state) {
        this._updateFlightPlan(state);
        this._updatePath(state);
        this._updateWaypointLayer(state);
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        super.onUpdate(state);

        this._doUpdate(state);
    }
}
WT_MapViewFlightPlanLayer.CLASS_DEFAULT = "flightPlanLayer";
WT_MapViewFlightPlanLayer.CONFIG_NAME_DEFAULT = "flightPlan";
WT_MapViewFlightPlanLayer.WAYPOINT_ICON_CACHE_SIZE = 100;
WT_MapViewFlightPlanLayer.WAYPOINT_LABEL_CACHE_SIZE = 100;
WT_MapViewFlightPlanLayer.OVERDRAW_FACTOR = 1.91421356237;
WT_MapViewFlightPlanLayer.OPTIONS_DEF = {
    flightPlanRendererOptions: {default: {}, auto: true},
    flightPlanLegStylerOptions: {default: {}, auto: true},

    iconDirectory: {default: "", auto: true},

    userIconSize: {default: 15, auto: true},
    airportIconSize: {default: 30, auto: true},
    vorIconSize: {default: 25, auto: true},
    ndbIconSize: {default: 30, auto: true},
    intIconSize: {default: 15, auto: true},
    rwyIconSize: {default: 15, auto: true},
    flightPathIconSize: {default: 10, auto: true},

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

    waypointLabelAlwaysShow: {default: true, auto: true},

    userIconPriority: {default: 115, auto: true},
    airportIconPriority: {default: 110, auto: true},
    vorIconPriority: {default: 103, auto: true},
    ndbIconPriority: {default: 102, auto: true},
    intIconPriority: {default: 101, auto: true},
    rwyIconPriority: {default: 101, auto: true},
    flightPathIconPriority: {default: 100, auto: true},

    userLabelPriority: {default: 1025, auto: true},
    airportLabelPriority: {default: 1020, auto: true},
    vorLabelPriority: {default: 1013, auto: true},
    ndbLabelPriority: {default: 1012, auto: true},
    intLabelPriority: {default: 1011, auto: true},
    rwyLabelPriority: {default: 1011, auto: true},
    flightPathLabelPriority: {default: 1010, auto: true},

    userLabelOffset: {default: {x: 0, y: -20}, auto: true},
    airportLabelOffset: {default: {x: 0, y: -27.5}, auto: true},
    vorLabelOffset: {default: {x: 0, y: -25}, auto: true},
    ndbLabelOffset: {default: {x: 0, y: -27.5}, auto: true},
    intLabelOffset: {default: {x: 0, y: -20}, auto: true},
    rwyLabelOffset: {default: {x: 0, y: -20}, auto: true},
    flightPathLabelOffset: {default: {x: 0, y: -17.5}, auto: true}
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