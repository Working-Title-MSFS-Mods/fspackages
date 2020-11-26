class WT_Plane_State {
    /**
     * @param {Subject} electricityAvailable 
     */
    constructor(electricityAvailable) {
        this.onShutDown = new WT_Event();
        this.onPowerOn = new WT_Event();
        this.powerState = new Subject(false);
        this.electricity = electricityAvailable;
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