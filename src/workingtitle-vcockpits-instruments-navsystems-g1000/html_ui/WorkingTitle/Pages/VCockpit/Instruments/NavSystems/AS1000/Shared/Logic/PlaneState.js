class WT_Plane_State {
    /**
     * @param {Subject} electricityAvailable 
     */
    constructor(electricityAvailable) {
        this.onShutDown = new WT_Event();
        this.onPowerOn = new WT_Event();
        this.electricity = electricityAvailable;
    }
    powerOn() {
        this.onPowerOn.fire();
    }
    shutDown() {
        this.onShutDown.fire();
    }
}