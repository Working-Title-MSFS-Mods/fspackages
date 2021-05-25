/**
 * A line drawn from the player airplane's position to the currently selected nearest waypoint. The use of this layer
 * requires the .waypointDisplay module to be added to the map model.
 */
class WT_G3x5_MapViewNearestWaypointLineLayer extends WT_MapViewMultiLayer {
    constructor(className = WT_G3x5_MapViewNearestWaypointLineLayer.CLASS_DEFAULT, configName = WT_G3x5_MapViewNearestWaypointLineLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._optsManager = new WT_OptionsManager(this, WT_G3x5_MapViewNearestWaypointLineLayer.OPTIONS_DEF);

        this._lineLayer = new WT_MapViewCanvas(false, true);
        this.addSubLayer(this._lineLayer);

        this._geoJSON = {
            type: "LineString",
            coordinates: [[0, 0], [0, 0]]
        };

        this._tempGeoPoint = new WT_GeoPoint(0, 0);
    }

    /**
     * @param {WT_MapViewState} state
     */
    isVisible(state) {
        return state.model.waypointDisplay.waypoint !== null;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onConfigLoaded(state) {
        for (let property of WT_G3x5_MapViewNearestWaypointLineLayer.CONFIG_PROPERTIES) {
            this._setPropertyFromConfig(property);
        }
    }

    /**
     * Applies a stroke to this layer's canvas rendering context using the specified styles.
     * @param {Number} lineWidth - the width of the stroke, in pixels.
     * @param {String|CanvasGradient|CanvasPattern} strokeStyle - the style of the stroke.
     * @param {Number[]} lineDash - an array describing the dash pattern of the stroke
     */
    _applyStroke(lineWidth, strokeStyle, lineDash) {
        this._lineLayer.display.context.lineWidth = lineWidth;
        this._lineLayer.display.context.strokeStyle = strokeStyle;
        this._lineLayer.display.context.setLineDash(lineDash);
        this._lineLayer.display.context.stroke();
    }

    /**
     *
     * @param {WT_GeoPoint} start
     * @param {WT_GeoPoint} end
     */
    _setGeoJSONCoordinates(start, end) {
        this._geoJSON.coordinates[0][0] = start.long;
        this._geoJSON.coordinates[0][1] = start.lat;
        this._geoJSON.coordinates[1][0] = end.long;
        this._geoJSON.coordinates[1][1] = end.lat;
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateGeoJSON(state) {
        let planePos = state.model.airplane.navigation.position(this._tempGeoPoint);
        this._setGeoJSONCoordinates(planePos, state.model.waypointDisplay.waypoint.location);
    }

    /**
     * @param {WT_MapViewState} state
     */
    _drawLine(state) {
        this._lineLayer.display.clear();
        this._lineLayer.display.context.beginPath();
        state.projection.renderer.renderCanvas(this._geoJSON, this._lineLayer.display.context);
        if (this.outlineWidth > 0) {
            this._applyStroke((this.outlineWidth * 2 + this.strokeWidth) * state.dpiScale, this.outlineColor, this.outlineDash.map(value => value * state.dpiScale));
        }
        this._applyStroke(this.strokeWidth * state.dpiScale, this.strokeColor, this.strokeDash.map(value => value * state.dpiScale));
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        super.onUpdate(state);

        this._updateGeoJSON(state);
        this._drawLine(state);
    }
}
WT_G3x5_MapViewNearestWaypointLineLayer.CLASS_DEFAULT = "nearestWaypointLineLayer";
WT_G3x5_MapViewNearestWaypointLineLayer.CONFIG_NAME_DEFAULT = "nearestWaypointLine";
WT_G3x5_MapViewNearestWaypointLineLayer.OPTIONS_DEF = {
    strokeWidth: {default: 2, auto: true},
    strokeColor: {default: "white", auto: true},
    strokeDash: {default: [8, 8], auto: true},
    outlineWidth: {default: 0, auto: true},
    outlineColor: {default: "black", auto: true},
    outlineDash: {default: [], auto: true}
};
WT_G3x5_MapViewNearestWaypointLineLayer.CONFIG_PROPERTIES = [
    "strokeWidth",
    "strokeColor",
    "strokeDash",
    "outlineWidth",
    "outlineColor",
    "outlineDash"
];