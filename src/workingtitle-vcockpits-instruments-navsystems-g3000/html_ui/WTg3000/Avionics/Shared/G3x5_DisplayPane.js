class WT_G3x5_DisplayPane {
    getTitle() {
    }

    init(root) {
    }

    wake() {
    }

    sleep() {
    }

    update() {
    }
}

class WT_G3x5_NavMapDisplayPane extends WT_G3x5_DisplayPane {
    constructor(navMap) {
        super();

        this._navMap = navMap;
    }

    /**
     * @readonly
     * @type {WT_G3x5_NavMap}
     */
    get navMap() {
        return this._navMap;
    }

    getTitle() {
        return "Navigation Map";
    }

    init(root) {
        this.navMap.init(root);
    }

    wake() {
        this.navMap.wake();
    }

    sleep() {
        this.navMap.sleep();
    }

    update() {
        this.navMap.update();
    }
}

class WT_G3x5_TrafficMapDisplayPane extends WT_G3x5_DisplayPane {
    constructor(trafficMap) {
        super();

        this._trafficMap = trafficMap;
    }

    /**
     * @readonly
     * @type {WT_G3x5_TrafficMap}
     */
    get trafficMap() {
        return this._trafficMap;
    }

    getTitle() {
        return "Traffic Map";
    }

    init(root) {
        this.trafficMap.init(root);
    }

    update() {
        this.trafficMap.update();
    }
}

class WT_G3x5_WeatherRadarDisplayPane extends WT_G3x5_DisplayPane {
    constructor(weatherRadar) {
        super();

        this._weatherRadar = weatherRadar;
    }

    /**
     * @readonly
     * @type {WT_G3x5_WeatherRadar}
     */
    get weatherRadar() {
        return this._weatherRadar;
    }

    getTitle() {
        return "Weather Radar";
    }

    init(root) {
        this.weatherRadar.init(root);
    }

    wake() {
        this.weatherRadar.wake();
    }

    sleep() {
        this.weatherRadar.sleep();
    }

    update() {
        this.weatherRadar.update();
    }
}

class WT_G3x5_ChartsDisplayPane extends WT_G3x5_DisplayPane {
    constructor(charts) {
        super();

        this._charts = charts;
    }

    /**
     * @readonly
     * @type {WT_G3x5_ChartsDisplay}
     */
    get charts() {
        return this._charts;
    }

    getTitle() {
        let chart = this.charts.model.chart;
        return chart ? `${this.charts.model.airportIdent}–${chart.procedure_identifier}` : "Charts";
    }

    init(root) {
        this.charts.init(root);
    }

    wake() {
        this.charts.wake();
    }

    sleep() {
        this.charts.sleep();
    }

    update() {
        this.charts.update();
    }
}

class WT_G3x5_WaypointInfoDisplayPane extends WT_G3x5_DisplayPane {
    constructor(waypointInfo) {
        super();

        this._waypointInfo = waypointInfo;
    }

    /**
     * @readonly
     * @type {WT_G3x5_WaypointInfoDisplay}
     */
    get waypointInfo() {
        return this._waypointInfo;
    }

    getTitle() {
        let waypoint = this.waypointInfo.mapModel.waypointDisplay.waypoint;
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

    init(root) {
        this.waypointInfo.init(root);
    }

    wake() {
        this.waypointInfo.wake();
    }

    sleep() {
        this.waypointInfo.sleep();
    }

    update() {
        this.waypointInfo.update();
    }
}

class WT_G3x5_NearestWaypointDisplayPane extends WT_G3x5_DisplayPane {
    constructor(nearestWaypoint) {
        super();

        this._nearestWaypoint = nearestWaypoint;
    }

    /**
     * @readonly
     * @type {WT_G3x5_NearestWaypointDisplay}
     */
    get nearestWaypoint() {
        return this._nearestWaypoint;
    }

    getTitle() {
        let waypoint = this.nearestWaypoint.mapModel.waypointDisplay.waypoint;
        if (waypoint) {
            switch (waypoint.type) {
                case WT_ICAOWaypoint.Type.AIRPORT:
                    return "Nearest Airport";
                case WT_ICAOWaypoint.Type.VOR:
                    return "Nearest VOR";
                case WT_ICAOWaypoint.Type.NDB:
                    return "Nearest NDB";
                case WT_ICAOWaypoint.Type.INT:
                    return "Nearest Intersection";
                default:
                    return "Nearest Waypoint";
            }
        } else {
            return "Nearest Waypoint";
        }
    }

    init(root) {
        this.nearestWaypoint.init(root);
    }

    wake() {
        this.nearestWaypoint.wake();
    }

    sleep() {
        this.nearestWaypoint.sleep();
    }

    update() {
        this.nearestWaypoint.update();
    }
}