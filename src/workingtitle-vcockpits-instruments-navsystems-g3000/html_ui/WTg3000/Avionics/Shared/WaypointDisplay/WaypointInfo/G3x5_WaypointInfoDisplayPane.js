class WT_G3x5_WaypointInfoDisplayPane extends WT_G3x5_WaypointDisplayPane {
    _getSettingModelID(paneID) {
        return `${paneID}_${WT_G3x5_WaypointInfoDisplayPane.SETTING_MODEL_ID}`;
    }

    getTitle() {
        let waypoint = this.mapModel.waypointDisplay.waypoint;
        if (waypoint) {
            switch (waypoint.type) {
                case WT_ICAOWaypoint.Type.AIRPORT:
                    return "Airport Info";
                case WT_ICAOWaypoint.Type.VOR:
                    return "VOR Info";
                case WT_ICAOWaypoint.Type.NDB:
                    return "NDB Info";
                case WT_ICAOWaypoint.Type.INT:
                    return "Intersection Info";
                default:
                    return "Waypoint Info";
            }
        } else {
            return "Waypoint Info";
        }
    }

    _initMapView() {
        let labelManager = new WT_MapViewTextLabelManager({preventOverlap: true});
        this._waypointRenderer = new WT_MapViewWaypointCanvasRenderer(labelManager);
        let runwayRenderer = new WT_G3x5_MapViewRunwayCanvasRenderer(labelManager);

        this.mapView.addLayer(this._bingLayer = new WT_MapViewBingLayer(this.paneID));
        this.mapView.addLayer(new WT_G3x5_MapViewAirportRunwayLayer(runwayRenderer));
        this.mapView.addLayer(new WT_MapViewWaypointLayer(this._icaoSearchers, this._icaoWaypointFactory, this._waypointRenderer, labelManager));
        this.mapView.addLayer(new WT_MapViewWaypointHighlightLayer(this._waypointRenderer));
        this.mapView.addLayer(new WT_MapViewTextLabelLayer(labelManager));
        this.mapView.addLayer(new WT_MapViewRangeRingLayer());
        this.mapView.addLayer(new WT_MapViewCrosshairLayer());
        this.mapView.addLayer(new WT_MapViewAirplaneLayer());
        this.mapView.addLayer(new WT_MapViewOrientationDisplayLayer(WT_G3x5_WaypointInfoDisplayPane.ORIENTATION_DISPLAY_TEXT));
        this.mapView.addLayer(new WT_MapViewMiniCompassLayer());
    }

    _initRangeTargetController() {
        this._rangeTargetController = new WT_G3x5_WaypointInfoRangeTargetController(this.mapModel, this.mapView, WT_G3x5_WaypointDisplayPane.MAP_RANGE_LEVELS, WT_G3x5_WaypointInfoDisplayPane.MAP_RANGE_DEFAULT);
    }

    init(viewElement) {
        super.init(viewElement);

        this._initRangeTargetController();
    }

    sleep() {
        this._bingLayer.sleep();
    }

    update() {
        this._rangeTargetController.update();
        this.mapView.update();
        this._waypointRenderer.update(this.mapView.state);
    }
}
WT_G3x5_WaypointInfoDisplayPane.SETTING_MODEL_ID = "WaypointInfo";
WT_G3x5_WaypointInfoDisplayPane.MAP_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(1);

class WT_G3x5_WaypointInfoRangeTargetController {
    /**
     *
     * @param {WT_MapModel} mapModel
     * @param {WT_MapView} mapView
     * @param {WT_NumberUnit[]} rangeLevels
     * @param {WT_NumberUnit} defaultRange
     */
    constructor(mapModel, mapView, rangeLevels, defaultRange) {
        this._mapModel = mapModel;
        this._mapView = mapView;

        this._rangeLevels = rangeLevels;
        this._rangeIndexDefault = rangeLevels.findIndex(range => range.equals(defaultRange));

        mapView.setTargetOffsetHandler(this);
        mapView.setRangeInterpreter(this);

        this._target = new WT_GeoPoint(0, 0);
        /**
         * @type {WT_ICAOWaypoint}
         */
        this._waypoint = null;

        this._aspectRatio = 1;
    }

    /**
     *
     * @param {WT_MapModel} model
     * @param {WT_GVector2} offset
     */
    getTargetOffset(model, offset) {
        offset.set(0, 0);
    }

    /**
     *
     * @param {WT_MapModel} model
     * @param {WT_NumberUnit} range
     */
    getTrueRange(model, range) {
        range.set(model.range).scale(4, true);
    }

    /**
     *
     * @param {WT_Airport} airport
     */
    _calculateAirportRadius(airport) {
        let maxRunwayDistance = airport.runways.array.reduce((accum, runway) => {
            let distance = Math.max(runway.start.distance(airport.location), runway.end.distance(airport.location));
            return (distance > accum) ? distance : accum;
        }, 0);
        return maxRunwayDistance;
    }

    /**
     *
     * @param {WT_ICAOWaypoint} waypoint
     */
    _setInitialRange(waypoint) {
        let range = this._rangeLevels[this._rangeIndexDefault];
        if (waypoint && waypoint.type === WT_ICAOWaypoint.Type.AIRPORT) {
            let airportRadius = this._calculateAirportRadius(waypoint);
            if (airportRadius > 0) {
                airportRadius *= 0.6 * Math.max(1, 1 / this._aspectRatio);
                range = this._rangeLevels.find(rangeLevel => rangeLevel.compare(airportRadius, WT_Unit.GA_RADIAN) >= 0);
            }
        }
        this._range = range;
    }

    _setWaypoint(waypoint) {
        if (waypoint) {
            this._target.set(waypoint.location);
        } else {
            this._target.set(0, 0);
        }
        this._setInitialRange(waypoint);
        this._waypoint = waypoint;
    }

    _updateWaypoint() {
        let waypoint = this._mapModel.waypointDisplay.waypoint;
        if (this._waypoint === null && waypoint === null || (this._waypoint && this._waypoint.equals(waypoint))) {
            return;
        }

        this._setWaypoint(waypoint);
    }

    _updateTarget() {
        this._mapModel.target = this._target;
    }

    _updateRange() {
        this._mapModel.range = this._range;
    }

    update() {
        let aspectRatio = this._mapView.projection.viewWidth / this._mapView.projection.viewHeight;
        if (aspectRatio !== this._aspectRatio) {
            this._aspectRatio = aspectRatio;
            this._setInitialRange(this._waypoint);
        }

        this._updateWaypoint();
        this._updateTarget();
        this._updateRange();
    }
}