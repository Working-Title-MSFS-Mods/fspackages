class WT_Auto_Pilot {
    /**
     * @param {rxjs.Observable} update$ 
     */
    constructor(update$) {
        this.enabled = WT_RX.observeSimVar(update$, "AUTOPILOT MASTER", "Bool");

        this.flightDirector = {
            enabled: rxjs.combineLatest(this.enabled, WT_RX.observeSimVar(update$, "AUTOPILOT FLIGHT DIRECTOR ACTIVE", "Bool")).pipe(
                WT_RX.distinctMap(([autopilotEnabled, flightDirectorEnabled]) => autopilotEnabled || flightDirectorEnabled),
                WT_RX.shareReplay()
            ),
            pitch: WT_RX.observeSimVar(update$, "AUTOPILOT FLIGHT DIRECTOR PITCH", "degree"),
            bank: WT_RX.observeSimVar(update$, "AUTOPILOT FLIGHT DIRECTOR BANK", "degree"),
        }
    }
}