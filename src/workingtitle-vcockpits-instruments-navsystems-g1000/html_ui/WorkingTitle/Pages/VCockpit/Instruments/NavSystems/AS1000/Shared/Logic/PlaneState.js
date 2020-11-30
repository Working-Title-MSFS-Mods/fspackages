class WT_Plane_State {
    /**
     * @param {Subject} electricityAvailable 
     */
    constructor(update$, electricityAvailable) {
        this.onShutDown = new WT_Event();
        this.onPowerOn = new WT_Event();
        this.powerState = new Subject(false);
        this.electricity = electricityAvailable;

        this.updateObservable = new rxjs.Subject();
        this.coordinates = update$.pipe(
            rxjs.operators.map(() => new LatLong(SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude"), SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude"))),
            rxjs.operators.shareReplay(1),
        );

        this.indicatedAltitude = update$.pipe(
            rxjs.operators.map(() => SimVar.GetSimVarValue("INDICATED ALTITUDE", "feet")),
            rxjs.operators.shareReplay(1),
        );

        this.groundSpeed = update$.pipe(
            rxjs.operators.map(() => SimVar.GetSimVarValue("GPS GROUND SPEED", "kilometers per hour")),
            rxjs.operators.shareReplay(1),
        );
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