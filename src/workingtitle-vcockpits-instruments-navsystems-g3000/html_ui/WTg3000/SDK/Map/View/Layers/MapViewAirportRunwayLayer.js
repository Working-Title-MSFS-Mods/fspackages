/**
 * A graphic representation of an airport's runways. Runways are represented as rectangles with a center line.
 * Runways are labeled with their designation. The label is placed at the start of the runway.
 */
class WT_MapViewAirportRunwayLayer extends WT_MapViewMultiLayer {
    /**
     * @param {WT_MapViewRunwayCanvasRenderer} runwayRenderer - the renderer to use to draw the runways and labels.
     * @param {String} [className] - the name of the class to add to the new layer's top-level HTML element's class list.
     * @param {String} [configName] - the name of the property in the map view's config file to be associated with the new layer.
     */
    constructor(runwayRenderer, className = WT_MapViewAirportRunwayLayer.CLASS_DEFAULT, configName = WT_MapViewAirportRunwayLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._runwayRenderer = runwayRenderer;

        this._runwayLayer = new WT_MapViewPersistentCanvas(1.05);
        this.addSubLayer(this._runwayLayer);

        this._optsManager = new WT_OptionsManager(this, WT_MapViewAirportRunwayLayer.OPTIONS_DEF);

        this._lastAirport = null;
    }

    _initLabelStyleOptions() {
        this._styles = {
            runway: {
                fillColor: this.runwayFillColor,
                outlineWidth: this.runwayOutlineWidth,
                outlineColor: this.runwayOutlineColor,
                centerlineWidth: this.runwayCenterlineWidth,
                centerlineColor: this.runwayCenterlineColor,
                centerlineDash: this.runwayCenterlineDash
            },
            label: {
                priority: this.runwayLabelPriority,
                alwaysShow: this.runwayLabelAlwaysShow,
                fontSize: this.runwayLabelFontSize,
                fontWeight: this.runwayLabelFontWeight,
                fontColor: this.runwayLabelFontColor,
                fontOutlineWidth: this.runwayLabelFontOutlineWidth,
                fontOutlineColor: this.runwayLabelFontOutlineColor,
                showBackground: this.runwayLabelShowBackground,
                backgroundPadding: this.runwayLabelBackgroundPadding,
                backgroundBorderRadius: this.runwayLabelBackgroundBorderRadius,
                backgroundColor: this.runwayLabelBackgroundColor,
                backgroundOutlineWidth: this.runwayLabelBackgroundOutlineWidth,
                backgroundOutlineColor: this.runwayLabelBackgroundOutlineColor
            }
        };
    }

    /**
     * @param {WT_MapViewState} state
     */
    isVisible(state) {
        return state.model.waypointInfo.mode === WT_MapModelWaypointInfoModule.Mode.AIRPORT;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onConfigLoaded(state) {
        for (let property of WT_MapViewAirportRunwayLayer.CONFIG_PROPERTIES) {
            this._setPropertyFromConfig(property);
        }
    }

    onAttached(state) {
        super.onAttached(state);

        this._initLabelStyleOptions();
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateAirport(state) {
        let airport = state.model.waypointInfo.waypoint;
        if (airport === null && this._lastAirport === null || (airport && this._lastAirport && (airport.type !== WT_ICAOWaypoint.Type.AIRPORT || airport.uniqueID === this._lastAirport.uniqueID))) {
            return;
        }

        if (this._lastAirport) {
            this._runwayRenderer.deregisterAirport(this._lastAirport);
        }
        if (airport) {
            this._runwayRenderer.registerAirport(airport, this._styles);
        }

        this._redrawRunways(state);

        this._lastAirport = airport;
    }

    _redrawRunways(state) {
        this._runwayLayer.syncBuffer(state);
        this._runwayRenderer.render(state, this._runwayLayer.buffer.context, this._runwayLayer.buffer.projectionRenderer);
        this._runwayLayer.syncDisplay(state);
        this._runwayLayer.resetBuffer();
    }

    _updateRunwayLayer(state) {
        this._runwayLayer.update(state);

        if (this._runwayLayer.display.isInvalid) {
            this._redrawRunways(state);
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        super.onUpdate(state);

        this._updateAirport(state);
        this._updateRunwayLayer(state);
    }
}
WT_MapViewAirportRunwayLayer.CLASS_DEFAULT = "airportRunwayLayer";
WT_MapViewAirportRunwayLayer.CONFIG_NAME_DEFAULT = "airportRunway";
WT_MapViewAirportRunwayLayer.OPTIONS_DEF = {
    runwayFillColor: {default: "gray", auto: true},
    runwayOutlineWidth: {default: 1, auto: true},
    runwayOutlineColor: {default: "white", auto: true},
    runwayCenterlineWidth: {default: 1, auto: true},
    runwayCenterlineColor: {default: "white", auto: true},
    runwayCenterlineDash: {default: [10, 10], auto: true},

    runwayLabelPriority: {default: 200, auto: true},
    runwayLabelAlwaysShow: {default: true, auto: true},
    runwayLabelFontSize: {default: 15, auto: true},
    runwayLabelFontWeight: {default: "bold", auto: true},
    runwayLabelFontColor: {default: "blue", auto: true},
    runwayLabelFontOutlineWidth: {default: 0, auto: true},
    runwayLabelFontOutlineColor: {default: "black", auto: true},
    runwayLabelShowBackground: {default: true, auto: true},
    runwayLabelBackgroundPadding: {default: [1], auto: true},
    runwayLabelBackgroundBorderRadius: {default: 6, auto: true},
    runwayLabelBackgroundColor: {default: "white", auto: true},
    runwayLabelBackgroundOutlineWidth: {default: 1, auto: true},
    runwayLabelBackgroundOutlineColor: {default: "blue", auto: true},
};
WT_MapViewAirportRunwayLayer.CONFIG_PROPERTIES = [
    "runwayFillColor",
    "runwayOutlineWidth",
    "runwayOutlineColor",
    "runwayCenterlineWidth",
    "runwayCenterlineColor",
    "runwayCenterlineDash",
    "runwayLabelPriority",
    "runwayLabelAlwaysShow",
    "runwayLabelFontSize",
    "runwayLabelFontWeight",
    "runwayLabelFontColor",
    "runwayLabelFontOutlineWidth",
    "runwayLabelFontOutlineColor",
    "runwayLabelShowBackground",
    "runwayLabelBackgroundPadding",
    "runwayLabelBackgroundBorderRadius",
    "runwayLabelBackgroundColor",
    "runwayLabelBackgroundOutlineWidth",
    "runwayLabelBackgroundOutlineColor"
];