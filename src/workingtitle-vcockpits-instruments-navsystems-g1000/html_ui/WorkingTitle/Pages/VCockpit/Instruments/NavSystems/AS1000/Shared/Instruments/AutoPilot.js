class WT_Auto_Pilot {
    /**
     * @param {rxjs.Observable} update$ 
     */
    constructor(update$) {
        this.enabled = WT_RX.observeSimVar(update$, "AUTOPILOT MASTER", "Bool");

        this.flightDirector = {
            enabled: rxjs.combineLatest(
                this.enabled,
                WT_RX.observeSimVar(update$, "AUTOPILOT FLIGHT DIRECTOR ACTIVE", "Bool"),
                (autopilotEnabled, flightDirectorEnabled) => autopilotEnabled || flightDirectorEnabled
            ).pipe(
                rxjs.operators.distinctUntilChanged(),
                rxjs.operators.shareReplay(1)
            ),
            pitch: WT_RX.observeSimVar(update$, "AUTOPILOT FLIGHT DIRECTOR PITCH", "degree"),
            bank: WT_RX.observeSimVar(update$, "AUTOPILOT FLIGHT DIRECTOR BANK", "degree"),
        }
    }
}