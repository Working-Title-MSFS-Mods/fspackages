class WT_Fuel_Used {
    /**
     * @param {WT_Plane_State} planeState 
     * @param {*} tanks 
     */
    constructor(planeState, tanks = []) {
        this.planeState = planeState;

        this.totalSimVar = "L:WT TOTAL FUEL USED";
        this.tankSimVar = "L:WT TANK FUEL USED";
        this.previousFuel = {
            total: SimVar.GetSimVarValue("FUEL TOTAL QUANTITY", "number"),
        };
        for (let t in tanks) {
            this.previousFuel[t] = SimVar.GetSimVarValue(tanks[t], "number");
        }
        this.lastFuelUpdateTime = 0;
        this.tanks = tanks;

        this.planeState.onPowerOn.subscribe(() => this.reset());
    }
    reset() {
        SimVar.SetSimVarValue(this.totalSimVar, "number", 0);
    }
    update(dt) {
        this.lastFuelUpdateTime += dt;
        if (this.lastFuelUpdateTime < 1000)
            return;
        this.lastFuelUpdateTime = 0;

        // Update tanks
        let tanks = this.tanks;
        let i = 1;
        for (let t in tanks) {
            const currentFuel = SimVar.GetSimVarValue(tanks[t], "number");
            const delta = Math.max(0, this.previousFuel[t] - currentFuel);
            SimVar.SetSimVarValue(`${this.tankSimVar}:${i}`, "number", SimVar.GetSimVarValue(`${this.tankSimVar}:${i}`, "number") + delta);
            this.previousFuel[t] = currentFuel;
            i++;
        }

        // Update total
        const currentFuel = SimVar.GetSimVarValue("FUEL TOTAL QUANTITY", "number");
        const delta = Math.max(0, this.previousFuel.total - currentFuel);
        SimVar.SetSimVarValue(this.totalSimVar, "number", SimVar.GetSimVarValue(this.totalSimVar, "number") + delta);
        this.previousFuel.total = currentFuel;
    }
}