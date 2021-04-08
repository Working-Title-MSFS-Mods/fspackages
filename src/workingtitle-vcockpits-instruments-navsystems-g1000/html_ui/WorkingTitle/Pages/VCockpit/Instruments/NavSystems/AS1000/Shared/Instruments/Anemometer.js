class WT_Anemometer {
    /**
     * @param {*} frame$ 
     * @param {WT_Plane_State} planeState 
     */
    constructor(frame$, planeState) {
        const throttledUpdate$ = WT_RX.frameUpdate(frame$, 0, 0.1).pipe(WT_RX.shareReplay());

        this.direction = WT_RX.observeSimVar(throttledUpdate$, "AMBIENT WIND DIRECTION", "degree");

        this.relativeDirection = throttledUpdate$.pipe(
            rxjs.operators.withLatestFrom(this.direction, planeState.heading),
            rxjs.operators.map(([frame, windDirection, planeHeading]) => (windDirection + 180) % 360 - planeHeading)
        );

        this.speed = WT_RX.observeSimVar(throttledUpdate$, "AMBIENT WIND VELOCITY", "knots");
    }
}