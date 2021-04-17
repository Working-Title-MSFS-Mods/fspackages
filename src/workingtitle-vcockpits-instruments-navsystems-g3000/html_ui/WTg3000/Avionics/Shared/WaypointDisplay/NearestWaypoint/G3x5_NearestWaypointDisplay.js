class WT_G3x5_NearestWaypointDisplay extends WT_G3x5_WaypointDisplay {
    _getSettingModelID(instrumentID) {
        return `${instrumentID}_${WT_G3x5_NearestWaypointDisplay.SETTING_MODEL_ID}`;
    }

    _initMapView() {
        let labelManager = new WT_MapViewTextLabelManager({preventOverlap: true});
        this._waypointRenderer = new WT_MapViewWaypointCanvasRenderer(labelManager);

        this.mapView.addLayer(this._bingLayer = new WT_MapViewBingLayer(this.instrumentID));
        this.mapView.addLayer(new WT_MapViewWaypointLayer(this._icaoSearchers, this._icaoWaypointFactory, this._waypointRenderer, labelManager));
        this.mapView.addLayer(new WT_MapViewWaypointHighlightLayer(this._waypointRenderer));
        this.mapView.addLayer(new WT_G3x5_MapViewNearestWaypointLineLayer());
        this.mapView.addLayer(new WT_MapViewTextLabelLayer(labelManager));
        this.mapView.addLayer(new WT_MapViewRangeRingLayer());
        this.mapView.addLayer(new WT_MapViewAirplaneLayer());
        this.mapView.addLayer(new WT_MapViewOrientationDisplayLayer(WT_G3x5_WaypointDisplay.ORIENTATION_DISPLAY_TEXT));
        this.mapView.addLayer(new WT_MapViewMiniCompassLayer());
    }

    _initRangeTargetController() {
        this._rangeTargetController = new WT_G3x5_NearestWaypointRangeTargetController(this.mapModel, this.mapView, WT_G3x5_WaypointDisplay.MAP_RANGE_LEVELS, WT_G3x5_NearestWaypointDisplay.MAP_RANGE_DEFAULT);
    }

    init(viewElement) {
        super.init(viewElement);

        this._initRangeTargetController();
    }

    sleep() {
        this._bingLayer.sleep();
    }

    wake() {
    }

    update() {
        this._rangeTargetController.update();
        this.mapView.update();
        this._waypointRenderer.update(this.mapView.state);
    }
}
WT_G3x5_NearestWaypointDisplay.SETTING_MODEL_ID = "NearestWaypoint";
WT_G3x5_NearestWaypointDisplay.MAP_RANGE_DEFAULT = WT_Unit.NMILE.createNumber(25);

class WT_G3x5_NearestWaypointRangeTargetController {
    /**
     * @param {WT_MapModel} mapModel
     * @param {WT_MapView} mapView
     * @param {WT_NumberUnit[]} rangeLevels
     * @param {WT_NumberUnit} defaultRange
     */
    constructor(mapModel, mapView, rangeLevels, defaultRange) {
        this._mapModel = mapModel;
        this._mapView = mapView;

        mapView.setTargetOffsetHandler(this);
        mapView.setRangeInterpreter(this);

        this._rangeLevels = rangeLevels;
        this._rangeIndexDefault = rangeLevels.findIndex(range => range.equals(defaultRange));
        this._rangeIndex = this._rangeIndexDefault;

        this._tempVector2 = new WT_GVector2(0, 0);
        this._tempNM = WT_Unit.NMILE.createNumber(0);
        this._tempGeoPoint = new WT_GeoPoint(0, 0);
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

    _updateTarget() {
        this._mapModel.target = this._mapModel.airplane.navigation.position(this._tempGeoPoint);
    }

    /**
     *
     * @param {WT_Waypoint} waypoint
     */
    _calculateNormalizedDistance(waypoint) {
        let waypointViewPos = this._mapView.projection.project(waypoint.location, this._tempVector2);
        let delta = waypointViewPos.subtract(this._mapView.projection.viewCenter);
        let thetaAbs = Math.abs(delta.theta);
        let theta0 = Math.atan2(this._mapView.projection.viewWidth, this._mapView.projection.viewHeight);
        let viewDistanceToEdge;
        if (thetaAbs < theta0 || thetaAbs > Math.PI - theta0) {
            // constrained by height
            viewDistanceToEdge = Math.abs(this._mapView.projection.viewHeight / 2 / Math.cos(thetaAbs));
        } else {
            // constrained by width
            viewDistanceToEdge = this._mapView.projection.viewWidth / 2 / Math.sin(thetaAbs);
        }
        return delta.length / viewDistanceToEdge;
    }

    _setRangeIndex(index) {
        this._rangeIndex = index;
        this._mapModel.range = this._rangeLevels[index];
    }

    _updateRange() {
        let waypoint = this._mapModel.waypointDisplay.waypoint;
        if (!waypoint) {
            this._setRangeIndex(this._rangeIndexDefault);
            return;
        }

        let rangeIndex = this._rangeIndex;
        while (rangeIndex >= 0 && rangeIndex < this._rangeLevels.length - 1) {
            this._setRangeIndex(rangeIndex);
            this.getTrueRange(this._mapModel, this._tempNM);
            this._mapView.projection.range = this._tempNM;

            let normDistance = this._calculateNormalizedDistance(waypoint);
            let indexDelta;
            if (normDistance < WT_G3x5_NearestWaypointRangeTargetController.DISTANCE_NORM_MIN) {
                indexDelta = -1;
            } else if (normDistance > WT_G3x5_NearestWaypointRangeTargetController.DISTANCE_NORM_MAX) {
                indexDelta = 1;
            } else {
                break;
            }
            rangeIndex += indexDelta;
        }
    }

    update() {
        this._updateTarget();
        this._updateRange();
    }
}
WT_G3x5_NearestWaypointRangeTargetController.DISTANCE_NORM_MIN = 0.2;
WT_G3x5_NearestWaypointRangeTargetController.DISTANCE_NORM_MAX = 0.8;