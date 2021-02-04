class WT_MapViewWaypointHighlightLayer extends WT_MapViewMultiLayer {
    /**
     * @param {WT_MapViewWaypointCanvasRenderer} waypointRenderer
     * @param {String} className
     * @param {String} configName
     */
    constructor(waypointRenderer, className = WT_MapViewWaypointHighlightLayer.CLASS_DEFAULT, configName = WT_MapViewWaypointHighlightLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._highlightLayer = new WT_MapViewCanvas(true, true);
        this.addSubLayer(this._highlightLayer);

        this._waypointRenderer = waypointRenderer;
        this._waypointRenderer.setCanvasContext(WT_MapViewWaypointCanvasRenderer.Context.HIGHLIGHT, this._highlightLayer.buffer.context);
        this._waypointStyleHandler = {getOptions: this._getWaypointStyleOptions.bind(this)};

        this._optsManager = new WT_OptionsManager(this, WT_MapViewWaypointHighlightLayer.OPTIONS_DEF);

        this._lastHighlightedWaypoint = null;
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
        let iconFactory = new WT_MapViewWaypointHighlightImageIconCachedFactory(WT_MapViewWaypointHighlightLayer.WAYPOINT_ICON_CACHE_SIZE, this.iconDirectory);
        this._waypointRenderer.setIconFactory(WT_MapViewWaypointCanvasRenderer.Context.HIGHLIGHT, iconFactory);

        let labelFactory = new WT_MapViewWaypointIdentLabelCachedFactory(WT_MapViewWaypointHighlightLayer.WAYPOINT_LABEL_CACHE_SIZE);
        this._waypointRenderer.setLabelFactory(WT_MapViewWaypointCanvasRenderer.Context.HIGHLIGHT, labelFactory);
    }

    _setWaypointRendererStyleHandler() {
        this._initStyleOptions();
        this._waypointRenderer.setStyleOptionHandler(WT_MapViewWaypointCanvasRenderer.Context.HIGHLIGHT, this._waypointStyleHandler);
    }

    /**
     * @param {WT_MapViewState} state
     */
    onConfigLoaded(state) {
        for (let property of WT_MapViewWaypointHighlightLayer.CONFIG_PROPERTIES) {
            this._setPropertyFromConfig(property);
        }

        this._setWaypointRendererFactories();
        this._setWaypointRendererStyleHandler();
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateHighlightWaypoint(state) {
        let currentHighlight = state.model.waypointHighlight.waypoint;
        if (currentHighlight === null && this._lastHighlightedWaypoint === null || (this._lastHighlightedWaypoint && this._lastHighlightedWaypoint.equals(currentHighlight))) {
            return;
        }

        if (this._lastHighlightedWaypoint) {
            this._waypointRenderer.deregister(this._lastHighlightedWaypoint, WT_MapViewWaypointCanvasRenderer.Context.HIGHLIGHT);
        }
        if (currentHighlight) {
            this._waypointRenderer.register(currentHighlight, WT_MapViewWaypointCanvasRenderer.Context.HIGHLIGHT);
        }

        this._lastHighlightedWaypoint = currentHighlight;
    }

    _updateHighlightLayer(state) {
        this._highlightLayer.display.clear();
        this._highlightLayer.copyBufferToCanvas();
        this._highlightLayer.resetBuffer();
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        super.onUpdate(state);

        this._updateHighlightWaypoint(state);
        this._updateHighlightLayer(state);
    }
}
WT_MapViewWaypointHighlightLayer.CLASS_DEFAULT = "waypointHighlightLayer";
WT_MapViewWaypointHighlightLayer.CONFIG_NAME_DEFAULT = "waypointHighlight";
WT_MapViewWaypointHighlightLayer.WAYPOINT_ICON_CACHE_SIZE = 50;
WT_MapViewWaypointHighlightLayer.WAYPOINT_LABEL_CACHE_SIZE = 50;
WT_MapViewWaypointHighlightLayer.OPTIONS_DEF = {
    iconDirectory: {default: "", auto: true},

    userIconSize: {default: 15, auto: true},
    airportIconSize: {default: 30, auto: true},
    vorIconSize: {default: 25, auto: true},
    ndbIconSize: {default: 30, auto: true},
    intIconSize: {default: 15, auto: true},

    waypointLabelFontWeight: {default: "bold", auto: true},
    waypointLabelFontSize: {default: 15, auto: true},
    waypointLabelFontColor: {default: "black", auto: true},
    waypointLabelFontOutlineWidth: {default: 0, auto: true},
    waypointLabelFontOutlineColor: {default: "black", auto: true},
    waypointLabelShowBackground: {default: true, auto: true},
    waypointLabelBackgroundColor: {default: "white", auto: true},
    waypointLabelBackgroundPadding: {default: [1], auto: true},
    waypointLabelBackgroundBorderRadius: {default: 0, auto: true},
    waypointLabelBackgroundOutlineWidth: {default: 1, auto: true},
    waypointLabelBackgroundOutlineColor: {default: "black", auto: true},

    userIconPriority: {default: 15, auto: true},
    airportIconPriority: {default: 10, auto: true},
    vorIconPriority: {default: 2, auto: true},
    ndbIconPriority: {default: 1, auto: true},
    intIconPriority: {default: 0, auto: true},

    userLabelPriority: {default: 2015, auto: true},
    airportLabelPriority: {default: 2010, auto: true},
    vorLabelPriority: {default: 2002, auto: true},
    ndbLabelPriority: {default: 2001, auto: true},
    intLabelPriority: {default: 2000, auto: true},

    userLabelOffset: {default: {x: 0, y: -20}, auto: true},
    airportLabelOffset: {default: {x: 0, y: -27.5}, auto: true},
    vorLabelOffset: {default: {x: 0, y: -25}, auto: true},
    ndbLabelOffset: {default: {x: 0, y: -27.5}, auto: true},
    intLabelOffset: {default: {x: 0, y: -20}, auto: true}
};
WT_MapViewWaypointHighlightLayer.CONFIG_PROPERTIES = [
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
    "intLabelOffset"
];

class WT_MapViewWaypointHighlightImageIcon extends WT_MapViewWaypointIcon {
    /**
     * @param {WT_MapViewWaypointImageIcon} baseIcon
     * @param {Number} priority
     */
    constructor(baseIcon, priority) {
        super(baseIcon.waypoint, priority);
        this._baseIcon = baseIcon;

        this._optsManager = new WT_OptionsManager(this, WT_MapViewWaypointHighlightImageIcon.OPTIONS_DEF);
    }

    /**
     * @readonly
     * @property {WT_MapViewWaypointImageIcon} baseIcon - the icon responsible for drawing the base icon image.
     * @type {WT_MapViewWaypointImageIcon}
     */
    get baseIcon() {
        return this._baseIcon;
    }

    setOptions(opts) {
        this._optsManager.setOptions(opts);
    }

    /**
     *
     * @param {CanvasRenderingContext2D} context
     * @param {Number} lineWidth
     * @param {String|CanvasGradient|CanvasPattern} strokeStyle
     */
    _applyStroke(context, lineWidth, strokeStyle) {
        context.lineWidth = lineWidth;
        context.strokeStyle = strokeStyle,
        context.stroke();
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {CanvasRenderingContext2D} context
     */
    _drawRing(state, context) {
        let radius = (this.baseIcon.size * 1.41421356237 / 2 + this.buffer) * state.dpiScale;
        context.beginPath();
        context.arc(this.baseIcon._viewPosition.x, this.baseIcon._viewPosition.y, radius, 0, 2 * Math.PI);
        if (this.outlineWidth > 0) {
            this._applyStroke(context, (this.strokeWidth + 2 * this.outlineWidth) * state.dpiScale, this.outlineColor);
        }
        this._applyStroke(context, this.strokeWidth * state.dpiScale, this.strokeColor);
    }

    /**
     * Draws this icon to a canvas rendering context.
     * @param {WT_MapViewState} state - the current map view state.
     * @param {CanvasRenderingContext2D} context - the context to which to draw.
     */
    draw(state, context) {
        this.baseIcon.draw(state, context);
        this._drawRing(state, context);
    }
}
WT_MapViewWaypointHighlightImageIcon.OPTIONS_DEF = {
    buffer: {default: 0, auto: true},
    strokeWidth: {default: 4, auto: true},
    strokeColor: {default: "white", auto: true},
    outlineWidth: {default: 0, auto: true},
    outlineColor: {default: "black", auto: true}
}

/**
 * A factory for highlighted waypoint icons that caches icons for re-use after they have been created.
 */
class WT_MapViewWaypointHighlightImageIconCachedFactory extends WT_MapViewWaypointImageIconCachedFactory {
    _createIcon(waypoint, priority) {
        return new WT_MapViewWaypointHighlightImageIcon(super._createIcon(waypoint, priority), priority);
    }
}