class WT_Plane_Statistics {
    constructor() {
        this.odometer = new Subject(WTDataStore.get("odometer", 0));
        this.tripOdometer = new Subject(0);
        this.maximumGroundSpeed = new Subject(WTDataStore.get("max_ground_speed", 0));
        this.averageGroundSpeed = new Subject(0);
        this.totalAverageGroundSpeed = 0;
        this.numAverageMeasurements = 0;

        this.previousCoordinates = null;
        this.persistTimer = 0;
        this.lastOdometerTime = 0;
        this.odometerTimer = 0;
        this.averageTimer = 0;
    }
    updateOdometers() {
        const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
        const long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
        const planeCoordinates = new LatLong(lat, long);
        if (this.previousCoordinates) {
            const distanceMoved = Avionics.Utils.computeDistance(this.previousCoordinates, planeCoordinates)
            this.odometer.value = this.odometer.value + distanceMoved;
            this.tripOdometer.value = this.tripOdometer.value + distanceMoved;
        }
        this.previousCoordinates = planeCoordinates;
    }
    resetOdometers() {
        this.odometer.value = 0;
        this.tripOdometer.value = 0;
    }
    updateAverageGroundSpeed() {
        this.totalAverageGroundSpeed += SimVar.GetSimVarValue("GPS GROUND SPEED", "kilometers per hour");
        this.numAverageMeasurements++;
        this.averageGroundSpeed.value = this.totalAverageGroundSpeed / this.numAverageMeasurements;
    }
    update(dt) {
        this.maximumGroundSpeed.value = Math.max(this.maximumGroundSpeed.value, SimVar.GetSimVarValue("GPS GROUND SPEED", "kilometers per hour"));

        this.odometerTimer += dt;
        if (this.odometerTimer > this.lastOdometerTime + WT_Plane_Statistics.ODOMETER_FREQUENCY) {
            this.updateOdometers(this.odometerTimer - this.lastOdometerTime);
            this.lastOdometerTime = this.odometerTimer;
        }

        this.persistTimer += dt;
        if (this.persistTimer > WT_Plane_Statistics.PERSIST_FREQUENCY) { // 60 seconds
            this.persist();
            this.persistTimer = 0;
        }

        if (SimVar.GetSimVarValue("GPS GROUND SPEED", "kilometers per hour") > WT_Plane_Statistics.GROUND_SPEED_MINIMUM) {
            this.averageTimer += dt;
            if (this.averageTimer > WT_Plane_Statistics.GROUND_SPEED_FREQUENCY) { // 10 seconds
                this.updateAverageGroundSpeed();
                this.averageTimer = 0;
            }
        }
    }
    persist() {
        WTDataStore.set("odometer", this.odometer.value);
        WTDataStore.set("max_ground_speed", this.maximumGroundSpeed.value);
    }
}
WT_Plane_Statistics.ODOMETER_FREQUENCY = 1 * 1000;
WT_Plane_Statistics.PERSIST_FREQUENCY = 60 * 1000;
WT_Plane_Statistics.GROUND_SPEED_FREQUENCY = 1 * 1000;
WT_Plane_Statistics.GROUND_SPEED_MINIMUM = 50;