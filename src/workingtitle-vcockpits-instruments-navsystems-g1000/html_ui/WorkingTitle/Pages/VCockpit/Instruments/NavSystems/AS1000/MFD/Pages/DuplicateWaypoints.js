
class WT_MFD_Duplicate_Waypoints_View extends WT_Duplicate_Waypoints_View {
    coordinateToGps(value) {
        // This is probably wrong, I rushed it
        const hours = Math.floor(value);
        const minutes = Math.floor((Math.abs(value) % 1) * 60);
        const seconds = Math.floor((Math.abs(value) % 1) * 3600) % 60;

        /*if (value < 0) {
            minutes = 59 - minutes;
            seconds = 59 - seconds;
        }*/

        return `${hours}° ${minutes}' ${seconds}"`;
    }
    formatLat(lat) {
        return `${this.coordinateToGps(lat)} ${lat > 0 ? "N" : "S"}`;
    }
    formatLong(long) {
        return `${this.coordinateToGps(long)} ${long > 0 ? "E" : "W"}`;
    }
    /**
     * @param {WT_Duplicate_Waypoints_Model} model
     */
    setModel(model) {
        super.setModel(model);
        this.model.selectedWaypoint.subscribe(waypoint => {
            if (!waypoint)
                return;
            this.elements.name.textContent = waypoint.infos.name;
            this.elements.city.textContent = waypoint.infos.city;
            const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
            const long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
            const planeCoordinates = new LatLong(lat, long);
            this.elements.bearing.textContent = `${Avionics.Utils.computeGreatCircleHeading(planeCoordinates, waypoint.infos.coordinates).toFixed(0)}°`;
            const distance = Avionics.Utils.computeGreatCircleDistance(planeCoordinates, waypoint.infos.coordinates);
            this.elements.distance.innerHTML = `${distance.toFixed(0)}<span class="units">NM</span>`;

            this.elements.coordinatesLat.textContent = this.formatLat(waypoint.infos.coordinates.lat);
            this.elements.coordinatesLong.textContent = this.formatLong(waypoint.infos.coordinates.long);
        });
    }
}
customElements.define("g1000-duplicate-waypoints", WT_MFD_Duplicate_Waypoints_View);