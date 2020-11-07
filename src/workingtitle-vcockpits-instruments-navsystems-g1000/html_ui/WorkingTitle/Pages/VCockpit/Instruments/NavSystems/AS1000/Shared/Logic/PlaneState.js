class WT_Plane_State {
    constructor() {
        this.onShutDown = new WT_Event();
        this.onPowerOn = new WT_Event();
    }
    powerOn() {
        this.onPowerOn.fire();
    }
    shutDown() {
        this.onShutDown.fire();
    }
}