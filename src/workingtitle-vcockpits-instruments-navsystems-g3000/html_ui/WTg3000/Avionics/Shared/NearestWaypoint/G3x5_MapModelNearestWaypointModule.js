class WT_G3x5_MapModelNearestWaypointModule extends WT_MapModelModule {
    constructor(icaoWaypointFactory, name = WT_G3x5_MapModelNearestWaypointModule.NAME_DEFAULT) {
        super(name);

        this._icaoWaypointFactory = icaoWaypointFactory;

        this._waypointICAO = "";
        this._waypoint = null;
        this._waypointRequestID = 0;

        this._optsManager.addOptions(WT_G3x5_MapModelNearestWaypointModule.OPTIONS_DEF);
    }

    /**
     * @type {String}
     */
    get waypointICAO() {
        return this._waypointICAO;
    }

    set waypointICAO(icao) {
        if (icao === this._waypointICAO) {
            return;
        }

        this._waypointICAO = icao;
        this._waypointRequestID++;
        if (icao) {
            this._requestWaypoint(icao, this._waypointRequestID);
        } else {
            this._setWaypoint(null);
        }
    }

    /**
     * @type {WT_ICAOWaypoint}
     */
    get waypoint() {
        return this._waypoint;
    }

    set waypoint(waypoint) {
        this._waypoint = waypoint;
    }

    _setWaypoint(waypoint) {
        this._waypoint = waypoint;
    }

    async _requestWaypoint(icao, requestID) {
        let waypoint = null;
        try {
            waypoint = await this._icaoWaypointFactory.getWaypoint(icao);
        } catch (e) {}

        if (requestID === this._waypointRequestID) {
            this._setWaypoint(waypoint);
        }
    }
}
WT_G3x5_MapModelNearestWaypointModule.NAME_DEFAULT = "nearestWaypoint";
WT_G3x5_MapModelNearestWaypointModule.OPTIONS_DEF = {
    waypointICAO: {default: ""},
    waypoint: {default: null}
};