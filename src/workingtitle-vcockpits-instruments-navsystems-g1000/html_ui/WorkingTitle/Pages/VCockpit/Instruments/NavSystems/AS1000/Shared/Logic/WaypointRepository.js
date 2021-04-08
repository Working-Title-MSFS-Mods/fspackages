class WT_Waypoint_Repository {
    /**
     * @param {FacilityLoader} facilityLoader 
     */
    constructor(facilityLoader) {
        this.facilityLoader = facilityLoader;
        this.waypoints = {};
    }
    async load(icao) {
        try {
            if (!(icao in this.waypoints)) {
                this.waypoints[icao] = await this.facilityLoader.getFacility(icao);
            }
            return this.waypoints[icao];
        } catch (e) {
            console.error(e.message);
        }
    }
}