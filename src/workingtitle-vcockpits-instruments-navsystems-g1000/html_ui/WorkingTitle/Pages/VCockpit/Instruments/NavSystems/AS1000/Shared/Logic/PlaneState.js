class WT_Plane_State {
    /**
     * @param {Subject} electricityAvailable 
     */
    constructor(update$, electricityAvailable) {
        this.onShutDown = new WT_Event();
        this.onPowerOn = new WT_Event();
        this.powerState = new Subject(false);
        this.electricity = electricityAvailable;

        this.indicatedAltitude = WT_RX.observeSimVar(update$, "INDICATED ALTITUDE:1", "feet", false);
        this.latitude = WT_RX.observeSimVar(update$, "PLANE LATITUDE", "degree latitude", false);
        this.longitude = WT_RX.observeSimVar(update$, "PLANE LONGITUDE", "degree longitude", false);
        this.coordinates = rxjs.zip(
            this.latitude, this.longitude, this.indicatedAltitude,
            (lat, long, alt) => new LatLongAlt(lat, long, alt)
        ).pipe(
            WT_RX.shareReplay(),
        );

        this.groundSpeed = WT_RX.observeSimVar(update$, "GPS GROUND SPEED", "kilometers per hour");

        this.heading = WT_RX.observeSimVar(update$, "PLANE HEADING DEGREES MAGNETIC", "degree");
        this.trueHeading = WT_RX.observeSimVar(update$, "PLANE HEADING DEGREES TRUE", "degree");
        this.track = WT_RX.observeSimVar(update$, "GPS GROUND MAGNETIC TRACK", "degrees");

        this.verticalSpeed = WT_RX.observeSimVar(update$, "VERTICAL SPEED", "feet per minute");

        this.orientation = WT_RX.observeGameVar(update$, "AIRCRAFT ORIENTATION AXIS", "XYZ");
        this.turnCoordinator = WT_RX.observeSimVar(update$, "TURN COORDINATOR BALL", "position");
        this.turnRate = WT_RX.observeSimVar(update$, "TURN INDICATOR RATE", "degree per second");

        this.onGround = this.groundSpeed.pipe(
            rxjs.operators.map(speed => speed < 90),
            rxjs.operators.distinctUntilChanged(),
            WT_RX.shareReplay()
        )

        this.inAir = this.groundSpeed.pipe(
            rxjs.operators.map(speed => speed > 90),
            rxjs.operators.distinctUntilChanged(),
            WT_RX.shareReplay()
        )
    }
    getLowResCoordinates(resolution) {
        return this.coordinates.pipe(
            rxjs.operators.scan((previousPosition, current) => {
                if (previousPosition == null)
                    return current;
                const movedFarEnough = Avionics.Utils.computeGreatCircleDistance(previousPosition, current) > resolution;
                return movedFarEnough ? current : previousPosition
            }, null),
            rxjs.operators.distinctUntilChanged()
        );
    }
    powerOn() {
        this.onPowerOn.fire();
        this.powerState.value = true;
    }
    shutDown() {
        this.onShutDown.fire();
        this.powerState.value = false;
    }
}