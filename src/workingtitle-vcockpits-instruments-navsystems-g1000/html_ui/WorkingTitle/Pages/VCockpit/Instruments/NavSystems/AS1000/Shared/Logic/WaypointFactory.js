class WT_Waypoint_Factory {
    constructor(instrument) {
        this.instrument = instrument;
    }
    create() {
        let waypoint = new WayPoint(this.instrument);
        return waypoint;
    }
}