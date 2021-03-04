class WT_MapModelWaypointInfoModule extends WT_MapModelModule {
    constructor(icaoWaypointFactory, name = WT_MapModelWaypointInfoModule.NAME_DEFAULT) {
        super(name);

        this._icaoWaypointFactory = icaoWaypointFactory;

        this._waypointICAO = "";
        this._waypoint = null;
        this._waypointRequestID = 0;

        this._optsManager.addOptions(WT_MapModelWaypointInfoModule.OPTIONS_DEF);
    }

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

    get waypoint() {
        return this._waypoint;
    }

    set waypoint(waypoint) {
        this._waypoint = waypoint;
        this._waypointICAO = waypoint ? waypoint.icao : "";
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
WT_MapModelWaypointInfoModule.NAME_DEFAULT = "waypointInfo";
/**
 * @enum {Number}
 */
WT_MapModelWaypointInfoModule.Mode = {
    OFF: 0,
    AIRPORT: 1,
    VOR: 2,
    NDB: 3,
    INT: 4
}
WT_MapModelWaypointInfoModule.OPTIONS_DEF = {
    mode: {default: WT_MapModelWaypointInfoModule.Mode.OFF, auto: true},
    waypointICAO: {default: ""},
    waypoint: {default: null}
};