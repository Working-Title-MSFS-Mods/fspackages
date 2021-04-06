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
        return chart ? `${this.charts.model.airportIdent}–${chart.procedure_identifier}` : "";
    }

    init(root) {
        this.charts.init(root);
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
     * @type {WT_G3x5_WaypointInfo}
     */
    get waypointInfo() {
        return this._waypointInfo;
    }

    getTitle() {
        switch (this.waypointInfo.model.waypointInfo.mode) {
            case WT_MapModelWaypointInfoModule.Mode.AIRPORT:
                return "Airport Info";
            case WT_MapModelWaypointInfoModule.Mode.VOR:
                return "VOR Info";
            case WT_MapModelWaypointInfoModule.Mode.NDB:
                return "NDB Info";
            case WT_MapModelWaypointInfoModule.Mode.INT:
                return "Intersection Info";
            default:
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