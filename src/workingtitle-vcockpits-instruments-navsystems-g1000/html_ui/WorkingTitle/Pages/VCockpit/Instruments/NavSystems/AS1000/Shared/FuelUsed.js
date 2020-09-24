class Fuel_Used {
    constructor(tanks = []) {
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
    }
    reset() {
        SimVar.SetSimVarValue(this.simVar, "number", 0);
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
            let currentFuel = SimVar.GetSimVarValue(tanks[t], "number");
            let delta = Math.max(0, this.previousFuel[t] - currentFuel);
            SimVar.SetSimVarValue(`${this.tankSimVar}:${i}`, "number", SimVar.GetSimVarValue(`${this.tankSimVar}:${i}`, "number") + delta);
            this.previousFuel[t] = currentFuel;
            i++;
        }

        // Update total
        let currentFuel = SimVar.GetSimVarValue("FUEL TOTAL QUANTITY", "number");
        let delta = Math.max(0, this.previousFuel.total - currentFuel);
        SimVar.SetSimVarValue(this.totalSimVar, "number", SimVar.GetSimVarValue(this.totalSimVar, "number") + delta);
        this.previousFuel.total = currentFuel;
    }
}