class WT_MapViewRunwayCanvasRenderer {
    constructor(labelManager) {
        this._labelManager = labelManager;

        /**
         * @type {Map<String, WT_MapViewRunwayLabelLayerAirportEntry>}
         */
        this._registered = new Map();

        this._tempVector = new WT_GVector2(0, 0);
        this._tempGeoPoint = new WT_GeoPoint(0, 0);
        this._emptyDash = [];
    }

    /**
     *
     * @param {WT_Airport} airport
     */
    registerAirport(airport, styleOptions) {
        let entry = this._registered.get(airport.uniqueID);
        if (!entry) {
            entry = new WT_MapViewRunwayLabelLayerAirportEntry(airport, styleOptions, this._labelManager);
            this._registered.set(airport.uniqueID, entry);
        }
    }

    /**
     *
     * @param {WT_Airport} airport
     */
    deregisterAirport(airport) {
        let entry = this._registered.get(airport.uniqueID);
        if (entry) {
            entry.cleanup();
            this._registered.delete(airport.uniqueID);
        }
    }

    /**
     *
     * @param {CanvasRenderingContext2D} context
     * @param {WT_MapProjectionRenderer} projectionRenderer
     * @param {WT_Runway} runway
     */
    _loadRunwayPath(context, projectionRenderer, runway) {
        context.beginPath();
        let halfWidth = runway.width.asUnit(WT_Unit.GA_RADIAN) / 2;

        let corner = this._tempGeoPoint.set(runway.start).offset(runway.direction + 90, halfWidth, true);
        let projectedCorner = projectionRenderer.project(corner, this._tempVector);
        context.moveTo(projectedCorner.x, projectedCorner.y);

        corner.set(runway.end).offset(runway.direction + 90, halfWidth, true);
        projectionRenderer.project(corner, projectedCorner);
        context.lineTo(projectedCorner.x, projectedCorner.y);

        corner.set(runway.end).offset(runway.direction - 90, halfWidth, true);
        projectionRenderer.project(corner, projectedCorner);
        context.lineTo(projectedCorner.x, projectedCorner.y);

        corner.set(runway.start).offset(runway.direction - 90, halfWidth, true);
        projectionRenderer.project(corner, projectedCorner);
        context.lineTo(projectedCorner.x, projectedCorner.y);

        context.closePath();
    }

    /**
     *
     * @param {CanvasRenderingContext2D} context
     * @param {WT_MapProjectionRenderer} projectionRenderer
     * @param {WT_Runway} runway
     */
    _loadCenterlinePath(context, projectionRenderer, runway) {
        context.beginPath();

        let end = this._tempGeoPoint.set(runway.start);
        let projectedEnd = projectionRenderer.project(end, this._tempVector);
        context.moveTo(projectedEnd.x, projectedEnd.y);

        end.set(runway.end);
        projectionRenderer.project(end, projectedEnd);
        context.lineTo(projectedEnd.x, projectedEnd.y);
    }

    _strokeRunwayPath(context, lineWidth, strokeStyle) {
        context.lineWidth = lineWidth;
        context.strokeStyle = strokeStyle;
        context.stroke();
    }

    _fillRunwayPath(context, fillStyle) {
        context.fillStyle = fillStyle;
        context.fill();
    }

    _strokeCenterlinePath(context, lineWidth, strokeStyle, dash) {
        context.lineWidth = lineWidth;
        context.strokeStyle = strokeStyle;
        context.setLineDash(dash);
        context.stroke();
        context.setLineDash(this._emptyDash);
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {CanvasRenderingContext2D} context
     * @param {WT_MapProjectionRenderer} projectionRenderer
     * @param {WT_Runway} runway
     */
    _renderRunway(state, context, projectionRenderer, runway, style) {
        if (runway.length.ratio(state.projection.viewResolution) < (10 * state.dpiScale)) {
            return;
        }
        this._loadRunwayPath(context, projectionRenderer, runway);
        if (style.outlineWidth > 0) {
            this._strokeRunwayPath(context, 2 * style.outlineWidth * state.dpiScale, style.outlineColor);
        }
        this._fillRunwayPath(context, style.fillColor);

        this._loadCenterlinePath(context, projectionRenderer, runway);
        this._strokeCenterlinePath(context, style.centerlineWidth * state.dpiScale, style.centerlineColor, style.centerlineDash);
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {CanvasRenderingContext2D} context
     * @param {WT_MapProjectionRenderer} projectionRenderer
     * @param {WT_MapViewRunwayLabelLayerAirportEntry} entry
     */
    _renderAirport(state, context, projectionRenderer, entry) {
        for (let runway of entry.physicalRunways) {
            this._renderRunway(state, context, projectionRenderer, runway, entry.styleOptions.runway);
        }
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {CanvasRenderingContext2D} context
     * @param {WT_MapProjectionRenderer} projectionRenderer
     */
    render(state, context, projectionRenderer) {
        for (let entry of this._registered.values()) {
            this._renderAirport(state, context, projectionRenderer, entry);
        }
    }
}

class WT_MapViewRunwayLabel extends WT_MapViewSimpleTextLabel {
    /**
     * @param {WT_Runway} runway - the runway with which the new label is associated.
     * @param {Number} priority - the display priority of the new label.
     * @param {Boolean} [alwaysShow] - whether the new label is immune to culling. False by default.
     */
    constructor(runway, priority, alwaysShow = false) {
        super(runway.designation, priority, alwaysShow);

        this._runway = runway;

        this._anchor.set(0.5, 0.5);
    }

    /**
     * @readonly
     * @property {WT_Runway} runway - the runway with which this label is associated.
     * @type {WT_Runway}
     */
    get runway() {
        return this._runway;
    }

    /**
     * Updates this label according to the current map view state.
     * @param {WT_MapViewState} state - the current map view state.
     */
    update(state) {
        state.projection.project(this.runway.start, this._position);

        super.update(state);
    }
}

class WT_MapViewRunwayLabelLayerAirportEntry {
    /**
     * @param {WT_Airport} airport
     * @param {Object} styleOptions
     * @param {WT_MapViewTextLabelManager} labelManager
     */
    constructor(airport, styleOptions, labelManager) {
        this._airport = airport;
        this._styleOptions = styleOptions;
        this._labelManager = labelManager;

        this._physicalRunways = [];
        this._labels = [];

        this._init();
    }

    _initLabel(runway) {
        let label = new WT_MapViewRunwayLabel(runway, this.styleOptions.label.priority, this.styleOptions.label.alwaysShow);
        label.setOptions(this.styleOptions.label);
        this._labels.push(label);
        this._labelManager.add(label);
    }

    /**
     * @param {WT_Runway} runway1
     * @param {WT_Runway} runway2
     */
    _compareRunways(runway1, runway2) {
        return runway1.reciprocal === runway2;
    }

    _filterPhysicalRunways(runway) {
        let existing = this._physicalRunways.find(this._compareRunways.bind(this, runway));
        if (!existing) {
            this._physicalRunways.push(runway);
        }
    }

    _init() {
        for (let runway of this.airport.runways) {
            this._initLabel(runway);
            this._filterPhysicalRunways(runway);
        }
    }

    /**
     * @readonly
     * @property {WT_Airport} airport
     * @type {WT_Airport}
     */
    get airport() {
        return this._airport;
    }

    /**
     * @readonly
     * @property {WT_Runway[]} physicalRunways
     * @type {WT_Runway[]}
     */
    get physicalRunways() {
        return this._physicalRunways;
    }

    /**
     * @readonly
     * @property {Object} styleOptions
     * @type {Object}
     */
    get styleOptions() {
        return this._styleOptions;
    }

    cleanup() {
        for (let label of this._labels) {
            this._labelManager.remove(label);
        }
    }
}