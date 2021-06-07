/**
 * A layer which depicts the active flight plan (including Direct To). This layer will draw the active flight plan's
 * waypoints and paths between waypoints/fixes. Options are available to style the path/waypoint for the active leg
 * differently from non-active legs.
 */
class WT_MapViewActiveFlightPlanLayer extends WT_MapViewFlightPlanLayer {
    /**
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory - a factory to create waypoint objects from ICAO strings.
     * @param {WT_MapViewWaypointCanvasRenderer} waypointRenderer - the renderer to use for drawing waypoints.
     * @param {WT_MapViewTextLabelManager} labelManager - the text label manager to use for managing waypoint labels.
     * @param {WT_MapViewFlightPlanLegCanvasStyler} legStyler - the leg styler to use for determining how to render the paths for individual flight plan legs.
     * @param {Boolean} shouldDrawVNAV - whether the new layer should draw VNAV indicators.
     * @param {String} [className] - the name of the class to add to the new layer's top-level HTML element's class list.
     * @param {String} [configName] - the name of the property in the map view's config file to be associated with the new layer.
     */
    constructor(icaoWaypointFactory, waypointRenderer, labelManager, legStyler, shouldDrawVNAV, className = WT_MapViewActiveFlightPlanLayer.CLASS_DEFAULT, configName = WT_MapViewActiveFlightPlanLayer.CONFIG_NAME_DEFAULT) {
        super(icaoWaypointFactory, waypointRenderer, labelManager, legStyler, className, configName);

        /**
         * @type {WT_FlightPlanManager}
         */
        this._fpm = null;
        this._drctRenderer = new WT_MapViewDirectToCanvasRenderer();

        this._shouldDrawVNAV = shouldDrawVNAV;
        if (this._shouldDrawVNAV) {
            this._vnavLayer = new WT_MapViewCanvas(false, true);
            this.addSubLayer(this._vnavLayer);

            /**
             * @type {WT_MapViewLocationTextLabel}
             */
            this._vnavLabel = null;

            this._tempSecond = WT_Unit.SECOND.createNumber(0);
            this._tempNM = WT_Unit.NMILE.createNumber(0);
            this._tempGeoPoint = new WT_GeoPoint(0, 0);
            this._tempVector2 = new WT_GVector2(0, 0);
        }
    }

    _initWaypointRenderer() {
        super._initWaypointRenderer();

        this._waypointRenderer.setCanvasContext(WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN_ACTIVE, this._iconLayer.display.context);
    }

    _initWaypointStyleHandler() {
        this._inactiveWaypointStyleHandler = {getOptions: this._getInactiveWaypointStyleOptions.bind(this)};
        this._activeWaypointStyleHandler = {getOptions: this._getActiveWaypointStyleOptions.bind(this)};
    }

    _initOptionsManager() {
        this._optsManager = new WT_OptionsManager(this, WT_MapViewActiveFlightPlanLayer.OPTIONS_DEF);
    }

    /**
     * Whether this layer draws VNAV indicators.
     * @readonly
     * @type {Boolean}
     */
    get doesDrawVNAV() {
        return this._shouldDrawVNAV;
    }

    /**
     * @param {WT_MapViewState} state
     */
    isVisible(state) {
        return state.model.activeFlightPlan.show;
    }

    _getConfigProperties() {
        return WT_MapViewActiveFlightPlanLayer.CONFIG_PROPERTIES;
    }

    /**
     * Gets icon and label style options for waypoint that is not part of the current active leg.
     * @param {WT_MapViewState} state - the current map view state.
     * @param {WT_Waypoint} waypoint - the waypoint for which to get options.
     */
    _getInactiveWaypointStyleOptions(state, waypoint) {
        return this._chooseOptionsFromStyles(state, waypoint, this._inactiveStyles);
    }

    /**
     * Gets icon and label style options a waypoint that is part of the current active leg.
     * @param {WT_MapViewState} state - the current map view state.
     * @param {WT_Waypoint} waypoint - the waypoint for which to get options.
     */
    _getActiveWaypointStyleOptions(state, waypoint) {
        return this._chooseOptionsFromStyles(state, waypoint, this._activeStyles);
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

        this._setCommonInactiveLabelStyles(this._inactiveStyles.airport[0].label);
        this._setCommonInactiveLabelStyles(this._inactiveStyles.airport[1].label);
        this._setCommonInactiveLabelStyles(this._inactiveStyles.airport[2].label);
        this._setCommonInactiveLabelStyles(this._inactiveStyles.vor.label);
        this._setCommonInactiveLabelStyles(this._inactiveStyles.ndb.label);
        this._setCommonInactiveLabelStyles(this._inactiveStyles.int.label);
        this._setCommonInactiveLabelStyles(this._inactiveStyles.rwy.label);
        this._setCommonInactiveLabelStyles(this._inactiveStyles.flightPath.label);
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
            flightPath: {
                icon: {
                    priority: this.flightPathIconPriority + 50,
                    size: this.flightPathIconSize
                },
                label: {
                    priority: this.flightPathLabelPriority + 50,
                    alwaysShow: this.waypointLabelAlwaysShow,
                    offset: this.flightPathLabelOffset,
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
        this._setCommonActiveLabelStyles(this._activeStyles.flightPath.label);
        this._setCommonActiveLabelStyles(this._activeStyles.user.label);
    }

    _initStyleOptions() {
        this._initInactiveStyleOptions();
        this._initActiveStyleOptions();
    }

    _setWaypointRendererFactories() {
        let inactiveIconFactory = new WT_MapViewWaypointImageIconCachedFactory(WT_MapViewActiveFlightPlanLayer.WAYPOINT_ICON_CACHE_SIZE, this.iconDirectory);
        let activeIconFactory = new WT_MapViewWaypointImageIconCachedFactory(WT_MapViewActiveFlightPlanLayer.WAYPOINT_ICON_CACHE_SIZE, this.iconDirectory);
        this._waypointRenderer.setIconFactory(WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN, inactiveIconFactory);
        this._waypointRenderer.setIconFactory(WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN_ACTIVE, activeIconFactory);

        let inactiveLabelFactory = new WT_MapViewWaypointIdentLabelCachedFactory(WT_MapViewActiveFlightPlanLayer.WAYPOINT_LABEL_CACHE_SIZE);
        let activeLabelFactory = new WT_MapViewWaypointIdentLabelCachedFactory(WT_MapViewActiveFlightPlanLayer.WAYPOINT_LABEL_CACHE_SIZE);
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
    _updateFlightPlanManager(state) {
        if (this._fpm !== state.model.activeFlightPlan.flightPlanManager) {
            this._fpm = state.model.activeFlightPlan.flightPlanManager;
            this._fpRenderer.setFlightPlan(this._fpm.activePlan);
            this._drctRenderer.setDirectTo(this._fpm.directTo);
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateActiveLeg(state) {
        let currentActiveWaypoint = null;
        if (this._fpm) {
            let currentActiveLeg = this._fpm.getActiveLeg(true);
            this._fpRenderer.setActiveLeg(currentActiveLeg);
            currentActiveWaypoint = currentActiveLeg ? currentActiveLeg.fix : (this._drctRenderer.destinationRendered());
        }

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
        super._clearRenderedWaypoints();

        this._waypointRenderer.deregister(this._drctRenderer.originRendered(), WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN);
        this._waypointRenderer.deregister(this._drctRenderer.destinationRendered(), WT_MapViewWaypointCanvasRenderer.Context.FLIGHT_PLAN);
    }

    _registerRenderedWaypoints() {
        super._registerRenderedWaypoints();

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
     * @returns {Boolean}
     */
    _checkIfImageInvalid(state) {
        return this._pathLayer.display.isInvalid ||
               this._fpRenderer.needsRedraw() ||
               this._drctRenderer.needsRedraw();
    }

    _clearVNAVLabel() {
        if (this._vnavLabel) {
            this._labelManager.remove(this._vnavLabel);
            this._vnavLabel = null;
        }
    }

    /**
     *
     * @param {WT_GeoPoint} location
     * @param {String} labelText
     * @returns {WT_MapViewLocationTextLabel}
     */
    _createVNAVLabel(location, labelText) {
        let label = new WT_MapViewLocationTextLabel(location, labelText, this.vnavLabelPriority, true);
        label.fontSize = this.vnavLabelFontSize;
        label.fontWeight = this.vnavLabelFontWeight;
        label.anchor = this.vnavLabelAnchor;
        label.offset = this.vnavLabelOffset;
        return label;
    }

    /**
     *
     * @param {CanvasRenderingContext2D} context
     * @param {String} lineWidth
     * @param {String|CanvasGradient|CanvasPattern} strokeStyle
     */
    _applyStroke(context, lineWidth, strokeStyle) {
        context.lineWidth = lineWidth;
        context.strokeStyle = strokeStyle;

        context.stroke();
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_GeoPoint} location
     */
    _drawVNAVIcon(state, location) {
        let projectedLocation = state.projection.project(location, this._tempVector2);

        this._vnavLayer.display.context.beginPath();
        this._vnavLayer.display.context.arc(projectedLocation.x, projectedLocation.y, this.vnavIconSize / 2 * state.dpiScale, 0, Math.PI * 2);
        if (this.vnavIconOutlineWidth > 0) {
            this._applyStroke(this._vnavLayer.display.context, (this.vnavIconOutlineWidth * 2 + this.vnavIconStrokeWidth) * state.dpiScale, this.vnavIconOutlineColor);
        }
        this._applyStroke(this._vnavLayer.display.context, this.vnavIconStrokeWidth * state.dpiScale, this.vnavIconStrokeColor);
    }

    /**
     *
     * @param {WT_GeoPoint} location
     * @param {String} labelText
     */
    _updateVNAVLabel(location, labelText) {
        if (this._vnavLabel && this._vnavLabel.location.equals(location) && this._vnavLabel.text === labelText) {
            return;
        }

        this._clearVNAVLabel();
        this._vnavLabel = this._createVNAVLabel(location, labelText);
        this._labelManager.add(this._vnavLabel);
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_GeoPoint} location
     * @param {String} labelText
     */
    _drawVNAVPoint(state, location, labelText) {
        this._drawVNAVIcon(state, location);
        this._updateVNAVLabel(location, labelText);
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateDirectToVNAV(state) {
        let finalBearing = this._fpm.directTo.getFinalBearing();
        let activeVNAVPath = this._fpm.getActiveVNAVPath(true);
        let vnavOffset = this._fpm.directTo.getVNAVOffset();
        let timeToTOD = this._fpm.timeToActiveVNAVPathStart(true, this._tempSecond);

        if (timeToTOD) {
            if (timeToTOD.number >= 0) {
                let distance = vnavOffset.asUnit(WT_Unit.GA_RADIAN) - activeVNAVPath.getTotalDistance().asUnit(WT_Unit.GA_RADIAN);
                let tod = this._tempGeoPoint.set(this._fpm.directTo.getDestination().location).offset(finalBearing.number, distance, true);
                this._drawVNAVPoint(state, tod, "TOD");
                return;
            } else if (this._fpm.directTo.getVNAVOffset().number !== 0) {
                // only draw BOD if it is not coincident with the direct to waypoint
                let timeToBOD = this._fpm.timeToActiveVNAVWaypoint(true, this._tempSecond);
                if (timeToBOD.number >= 0) {
                    let distance = vnavOffset.asUnit(WT_Unit.GA_RADIAN);
                    let bod = this._tempGeoPoint.set(this._fpm.directTo.getDestination().location).offset(finalBearing.number, distance, true);
                    this._drawVNAVPoint(state, bod, "BOD");
                    return;
                }
            }
        }

        this._clearVNAVLabel();
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     * @param {Number} offset
     * @param {WT_GeoPoint} reference
     */
    _findPointAlongFlightPlan(leg, offset, reference) {
        let currentLeg = leg;
        while (offset < 0 || offset > currentLeg.distance.asUnit(WT_Unit.NMILE)) {
            let delta = offset < 0 ? -1 : 1;
            let newIndex = currentLeg.index + delta;
            if (newIndex <= 0 || newIndex >= currentLeg.flightPlan.legs.length) {
                break;
            }

            if (delta > 0) {
                offset -= currentLeg.distance.asUnit(WT_Unit.NMILE);
            }
            currentLeg = leg.flightPlan.legs.get(newIndex);
            if (delta < 0) {
                offset += currentLeg.distance.asUnit(WT_Unit.NMILE);
            }
        }

        return currentLeg.getPointAlong(this._tempNM.set(offset), reference);
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateFlightPlanVNAV(state) {
        let timeToTOD = this._fpm.timeToActiveVNAVPathStart(true, this._tempSecond);
        if (timeToTOD && timeToTOD.number >= 0) {
            let legRestriction = this._fpm.getActiveVNAVLegRestriction(true);
            let totalVNAVDistance = legRestriction.vnavPath.getTotalDistance();
            let tod = this._findPointAlongFlightPlan(legRestriction.leg, legRestriction.leg.distance.asUnit(WT_Unit.NMILE) - totalVNAVDistance.asUnit(WT_Unit.NMILE), this._tempGeoPoint);
            this._drawVNAVPoint(state, tod, "TOD");
            return;
        }

        this._clearVNAVLabel();
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateVNAVLayer(state) {
        this._vnavLayer.display.clear();
        if (!this._fpm || !this._fpm.isVNAVEnabled) {
            this._clearVNAVLabel();
            return;
        }

        if (this._fpm.directTo.isVNAVActive()) {
            this._updateDirectToVNAV(state);
        } else if (this._fpm.getActiveVNAVLegRestriction(true)) {
            this._updateFlightPlanVNAV(state);
        } else {
            this._clearVNAVLabel();
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
     _doUpdate(state) {
        this._updateFlightPlanManager(state);
        this._updateActiveLeg(state);
        this._updatePath(state);
        this._updateWaypointLayer(state);
        if (this._shouldDrawVNAV) {
            this._updateVNAVLayer(state);
        }
    }
}
WT_MapViewActiveFlightPlanLayer.CLASS_DEFAULT = "activeFlightPlanLayer";
WT_MapViewActiveFlightPlanLayer.CONFIG_NAME_DEFAULT = "activeFlightPlan";
WT_MapViewActiveFlightPlanLayer.WAYPOINT_ICON_CACHE_SIZE = 100;
WT_MapViewActiveFlightPlanLayer.WAYPOINT_LABEL_CACHE_SIZE = 100;
WT_MapViewActiveFlightPlanLayer.OVERDRAW_FACTOR = 1.91421356237;
WT_MapViewActiveFlightPlanLayer.OPTIONS_DEF = {
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
    flightPathLabelOffset: {default: {x: 0, y: -17.5}, auto: true},

    vnavIconSize: {default: 10, auto: true},
    vnavIconStrokeWidth: {default: 2, auto: true},
    vnavIconStrokeColor: {default: "white", auto: true},
    vnavIconOutlineWidth: {default: 1, auto: true},
    vnavIconOutlineColor: {default: "black", auto: true},

    vnavLabelFontSize: {default: 15, auto: true},
    vnavLabelFontWeight: {default: "bold", auto: true},
    vnavLabelPriority: {default: 1010, auto: true},
    vnavLabelAnchor: {default: {x: 0, y: 0}, auto: true},
    vnavLabelOffset: {default: {x: 5, y: 5}, auto: true}
};
WT_MapViewActiveFlightPlanLayer.CONFIG_PROPERTIES = [
    ...WT_MapViewFlightPlanLayer.CONFIG_PROPERTIES,

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
    "vnavIconSize",
    "vnavIconStrokeWidth",
    "vnavIconStrokeColor",
    "vnavIconOutlineWidth",
    "vnavIconOutlineColor",
    "vnavLabelFontSize",
    "vnavLabelFontWeight",
    "vnavLabelPriority",
    "vnavLabelAnchor",
    "vnavLabelOffset"
];