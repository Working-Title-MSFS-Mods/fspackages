// prototype singleton, this needs to be different ofc
let FuelMgmtPage1Instance = undefined;
let FuelMgmtPage2Instance = undefined;

class CJ4_FMC_FuelMgmtPageOne {
    constructor(fmc) {
        this._fmc = fmc;
        this._isDirty = true;

        this._fuelQuantityTotal = 0;

        this._totalFuelFlow = 0;
        this._hours = 0;
        this._minutes = 0;
        this._rngToResv = 0;
        this._spRng = 0;
    }

    prepare() {
        // Static stuff would get prepared here
    }

    update() {
        //CWB added direct read of fuel quantity simvars
        let fuelQuantityLeft = Math.trunc(6.7 * SimVar.GetSimVarValue("FUEL LEFT QUANTITY", "Gallons"));
        let fuelQuantityRight = Math.trunc(6.7 * SimVar.GetSimVarValue("FUEL RIGHT QUANTITY", "Gallons"));
        let fuelQuantityTotal = fuelQuantityRight + fuelQuantityLeft;
        let totalFuelFlow = Math.round(SimVar.GetSimVarValue("L:CJ4 FUEL FLOW:1", "Pounds per hour"))
            + Math.round(SimVar.GetSimVarValue("L:CJ4 FUEL FLOW:2", "Pounds per hour"));

        if ((fuelQuantityTotal !== this._fuelQuantityTotal) || (totalFuelFlow !== this._totalFuelFlow)) {
            this._isDirty = true;
            this._fuelQuantityTotal = fuelQuantityTotal;
            this._totalFuelFlow = totalFuelFlow;
            this.updateFuel();
        }

        if (this._isDirty) {
            this.invalidate();
        }
        // register refresh and bind to update which will only render on changes
        this._fmc.registerPeriodicPageRefresh(() => {
            this.update();
            return true;
        }, 1000, false);
    }

    updateFuel() {
        const hoursForResv = (this._fuelQuantityTotal - this._fmc.reserveFuel) / this._totalFuelFlow;
        this._hours = Math.trunc(hoursForResv);
        this._minutes = Math.trunc((hoursForResv % 1) * 60);
        let groundSpeed = Math.round(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots"));
        this._rngToResv = (groundSpeed * hoursForResv).toFixed(0);
        this._spRng = ((1 / this._totalFuelFlow) * groundSpeed).toFixed(2).toString().substr(1);

        if (this._totalFuelFlow == 0) {
            this._hours = "-";
            this._rngToResv = "----";
            this._minutes = "--";
            this._spRng = ".----";
        }

        if (groundSpeed == 0) {
            this._spRng = ".----";
            this._rngToResv = "----";
        }
    }

    render() {

        const fuelQuantityTotalText = WT_ConvertUnit.getWeight(this._fuelQuantityTotal).Value.toFixed(0).padStart(4, " ") + (WT_ConvertUnit.isMetric() ? "[d-text] KG[s-text]" : "[d-text] LB[s-text]");
        const totalFuelFlowText = WT_ConvertUnit.getWeight(this._totalFuelFlow).Value.toFixed(0).padStart(4, " ") + (WT_ConvertUnit.isMetric() ? "[d-text] KG/HR[s-text]" : "[d-text] LB/HR[s-text]");
        const reserveFuelText = WT_ConvertUnit.getWeight(this._fmc.reserveFuel).Value.toFixed(0).padStart(4, " ") + (WT_ConvertUnit.isMetric() ? " KG[s-text]" : " LB[s-text]");
        const spRangeText = this._spRng == ".----" ? ".----"
            : WT_ConvertUnit.isMetric() ? (this._spRng / 0.453592).toFixed(2) + "[d-text]NM/KG[s-text]"
            : this._spRng + "[d-text]NM/LB[s-text]";

        this._fmc._templateRenderer.setTemplateRaw([
            ["", "1/3[blue] ", "FUEL MGMT[blue]"],
            [" FUEL[blue]", "TIME TO RESV[blue] "],
            [" " + fuelQuantityTotalText, this._hours + ":" + this._minutes.toString().padStart(2, "0")],
            [" FUEL FLOW[blue]", "RNG TO RESV[blue] "],
            [" " + totalFuelFlowText, this._rngToResv + "[d-text]NM[s-text]"],
            [" RESERVES[blue]", "SP RNG GS[blue] "],
            [" " + reserveFuelText, spRangeText],
            [" GND SPD[blue]"],
            [Math.round(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots")).toString()],
            [""],
            ["measured/" + "MANUAL[green s-text]"],
            ["------------------------[blue]"],
            ["", "PERF MENU>"]
        ]);
    }

    bindEvents() {
        
        this._fmc.onLeftInput[2] = () => {
            let value = WT_ConvertUnit.setWeight(parseInt(this._fmc.inOut));
            if (value >= 0 && value <= 5000) {
                this._fmc.reserveFuel = value;
            }
            else {
                this._fmc.showErrorMessage("INVALID");
            }
            this._fmc.clearUserInput();
            //console.log(this._fmc.reserve);
            this.invalidate();
            this.update();
            this.updateFuel();
            this.render();
        };
        this._fmc.onPrevPage = () => { CJ4_FMC_FuelMgmtPage.ShowPage3(this._fmc); };
        this._fmc.onNextPage = () => { CJ4_FMC_FuelMgmtPage.ShowPage2(this._fmc); };
        this._fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage1(this._fmc); };
        this._fmc.updateSideButtonActiveStatus();
    }

    invalidate() {
        this._isDirty = true;
        this._fmc.clearDisplay();
        this.render();
        this.bindEvents(); // TODO could only call this once on init, but fmc.clearDisplay() clears events
        this._isDirty = false;
    }
}

class CJ4_FMC_FuelMgmtPageTwo {
    constructor(fmc) {
        this._fmc = fmc;

        this._fuelQuantityLeft = 0;
        this._fuelQuantityRight = 0;
        this._fuelBurnedLeftDisplay = 0;
        this._fuelBurnedRightDisplay = 0;
        this._fuelBurnedTotalDisplay = 0;
        this._fuelBurnedTotal;
        this._fuelFlowLeft = 0;
        this._fuelFlowRight = 0;
        this._totalFuelFlow = 0;
    }

    prepare() {
        // Static stuff would get prepared here
    }

    update() {
        // TODO i think this could be optimized
        const fuelWeight = 6.7;
        //console.log("fuel weight constant: " + fuelWeight);

        this._fuelQuantityLeft = Math.trunc(fuelWeight * SimVar.GetSimVarValue("FUEL LEFT QUANTITY", "Gallons"));
        this._fuelQuantityRight = Math.trunc(fuelWeight * SimVar.GetSimVarValue("FUEL RIGHT QUANTITY", "Gallons"));

        let fuelFlowLeft = Math.round(SimVar.GetSimVarValue("L:CJ4 FUEL FLOW:1", "Pounds per hour"));
        let fuelFlowRight = Math.round(SimVar.GetSimVarValue("L:CJ4 FUEL FLOW:2", "Pounds per hour"));
        let totalFuelFlow = fuelFlowLeft + fuelFlowRight;

        let fuelBurnedLeft = this._fmc.initialFuelLeft - this._fuelQuantityLeft;
        let fuelBurnedRight = this._fmc.initialFuelRight - this._fuelQuantityRight;
        let fuelBurnedTotal = fuelBurnedRight + fuelBurnedLeft;

        if ((totalFuelFlow !== this._totalFuelFlow) || (fuelBurnedTotal !== this._fuelBurnedTotal)) {
            this._isDirty = true;
            this._totalFuelFlow = totalFuelFlow;
            this._fuelBurnedTotal = fuelBurnedTotal;
            this._fuelFlowLeft = fuelFlowLeft;
            this._fuelFlowRight = fuelFlowRight;

            this._fuelBurnedLeftDisplay = fuelBurnedLeft < 0 ? 0
                : fuelBurnedLeft;
            this._fuelBurnedRightDisplay = fuelBurnedRight < 0 ? 0
                : fuelBurnedRight;
            this._fuelBurnedTotalDisplay = fuelBurnedTotal < 0 ? 0
                : fuelBurnedTotal;
        }

        if (this._isDirty) {
            this.invalidate();
        }
        // register refresh and bind to update which will only render on changes
        this._fmc.registerPeriodicPageRefresh(() => {
            this.update();
            return true;
        }, 1000, false);
    }

    render() {
        const fuelBurnedLeft = WT_ConvertUnit.getWeight(this._fuelBurnedLeftDisplay);
        const fuelBurned1Text = fuelBurnedLeft.Value.toFixed(0).padStart(4, " ") + " [d-text]";

        const fuelFlowLeft = WT_ConvertUnit.getFuelFlow(this._fuelFlowLeft);
        const fuelFlow1Text = fuelFlowLeft.Value.toFixed(0).padStart(4, " ") + "[d-text]";

        const fuelBurnedRight = WT_ConvertUnit.getWeight(this._fuelBurnedRightDisplay);
        const fuelBurned2Text = fuelBurnedRight.Value.toFixed(0).padStart(4, " ") + " [d-text]";

        const fuelFlowRight = WT_ConvertUnit.getFuelFlow(this._fuelFlowRight);
        const fuelFlow2Text = fuelFlowRight.Value.toFixed(0).padStart(4, " ") + "[d-text]";

        const fuelBurnedTotal = WT_ConvertUnit.getWeight(this._fuelBurnedTotalDisplay, "LB[s-text]", "KG[s-text]");
        const fuelBurnedTotalText = fuelBurnedTotal.Value.toFixed(0).padStart(4, " ") + " [d-text]";

        const fuelFlowTotal = WT_ConvertUnit.getFuelFlow(this._totalFuelFlow, "LB/HR[s-text]", "KG/HR[s-text]");
        const fuelFlowTotalText = fuelFlowTotal.Value.toFixed(0).padStart(4, " ") + "[d-text]";
        
        const fuelBurnedHead = fuelBurnedTotal.Unit;
        const fuelFlowHead = fuelFlowTotal.Unit;

        this._fmc._templateRenderer.setTemplateRaw([
            ["", "2/3[blue] ", "FUEL MGMT[blue]"],
            [" ENGINE[blue s-text]", "FLOW-FUEL-USED[blue s-text] ", ""],
            ["", fuelBurnedHead + "  ", fuelFlowHead],
            ["   1[d-text]", fuelBurned1Text, fuelFlow1Text],
            ["   2[d-text]", fuelBurned2Text, fuelFlow2Text],
            [" TOTAL[d-text]", fuelBurnedTotalText, fuelFlowTotalText],
            [""],
            [""],
            [""],
            [""],
            ["<RESET FUEL USED"],
            ["------------------------[blue]"],
            ["", "PERF MENU>"]
        ]);
    }

    bindEvents() {
        this._fmc.onLeftInput[4] = () => {
            this._fmc.resetFuelUsed();
        };

        this._fmc.onPrevPage = () => { CJ4_FMC_FuelMgmtPage.ShowPage1(this._fmc); };
        this._fmc.onNextPage = () => { CJ4_FMC_FuelMgmtPage.ShowPage3(this._fmc); };
        this._fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage1(this._fmc); };
        this._fmc.updateSideButtonActiveStatus();
    }

    invalidate() {
        this._isDirty = true;
        this._fmc.clearDisplay();
        // this.prepare();
        this.render();
        this.bindEvents(); // TODO could only call this once on init, but fmc.clearDisplay() clears events
        this._isDirty = false;
    }
}

class CJ4_FMC_FuelMgmtPage {

    static ShowPage1(fmc) { //FUEL MGMT Page 1
        fmc.clearDisplay();

        // create page instance and init 
        FuelMgmtPage1Instance = new CJ4_FMC_FuelMgmtPageOne(fmc);
        FuelMgmtPage1Instance.update();
    }

    static ShowPage2(fmc) { //FUEL MGMT Page 2
        fmc.clearDisplay();

        // create page instance and init 
        FuelMgmtPage2Instance = new CJ4_FMC_FuelMgmtPageTwo(fmc);

        // register refresh and bind to update which will only render on changes
        fmc.registerPeriodicPageRefresh(() => {
            FuelMgmtPage2Instance.update();
            return true;
        }, 1000, true);
    }

    static ShowPage3(fmc) { //FUEL MGMT Page 3
        fmc.clearDisplay();
        let destination = false;
        let origin = false;
        let destinationIdent = false;
        let destinationDistance = false;
        let destinationEte = false;
        let destinationFuel = false;

        fmc.registerPeriodicPageRefresh(() => {

            let totalFuelFlow = SimVar.GetSimVarValue("L:CJ4 FUEL FLOW:1", "Pounds per hour")
                + SimVar.GetSimVarValue("L:CJ4 FUEL FLOW:2", "Pounds per hour");
            let groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
            const fuelWeight = 6.7;
            //console.log("fuel weight constant: " + fuelWeight);
    
            let fuelQuantityLeft = Math.trunc(fuelWeight * SimVar.GetSimVarValue("FUEL LEFT QUANTITY", "Gallons"));
            let fuelQuantityRight = Math.trunc(fuelWeight * SimVar.GetSimVarValue("FUEL RIGHT QUANTITY", "Gallons"));
            let fuelQuantityTotal = fuelQuantityRight + fuelQuantityLeft;
            
            //destination data
            if (fmc.flightPlanManager.getDestination() && fmc.flightPlanManager.getOrigin()) {
                let currPos = new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"));
                destination = fmc.flightPlanManager.getDestination();
                destinationIdent = new String(fmc.flightPlanManager.getDestination().ident);
                let destinationDistanceDirect = Avionics.Utils.computeDistance(currPos, destination.infos.coordinates);
                let destinationDistanceFlightplan = 0;
                destinationDistance = destinationDistanceDirect;
                if (fmc.flightPlanManager.getActiveWaypoint()) {
                    let activeWaypointDist = new Number(fmc.flightPlanManager.getDistanceToActiveWaypoint());
                    destinationDistanceFlightplan = new Number(destination.cumulativeDistanceInFP - fmc.flightPlanManager.getActiveWaypoint().cumulativeDistanceInFP + activeWaypointDist);
                }
                else {
                    destinationDistanceFlightplan = destination.cumulativeDistanceInFP;
                }
                destinationDistance = destinationDistanceDirect > destinationDistanceFlightplan ? destinationDistanceDirect
                    : destinationDistanceFlightplan;
                destinationEte = groundSpeed < 50 || destinationDistance <= 0.1 ? new String("-:--")
                    : new Date((destinationDistance/groundSpeed) * 3600000).toISOString().substr(11, 5);
                destinationFuel = groundSpeed < 50 ? new String("-----")
                    : WT_ConvertUnit.getWeight(fuelQuantityTotal - (totalFuelFlow * destinationDistance / groundSpeed)).Value;
                origin = fmc.flightPlanManager.getOrigin();
            }
            
            const fuelFlowTotal = WT_ConvertUnit.getFuelFlow(totalFuelFlow, "PPH[s-text]", "KG/H[s-text]");
            const fuelFlowTotalText = totalFuelFlow > 100 ? fuelFlowTotal.Value.toFixed(0) + "[d-text] " + fuelFlowTotal.Unit : "----[d-text] " + fuelFlowTotal.Unit;
            const eteText = destination ? destinationEte.padStart(4, " ") : "-:--";
            const fuelRequiredText = (destination && groundSpeed > 100) ? WT_ConvertUnit.getWeight(totalFuelFlow * destinationDistance / groundSpeed).getString(0, "[d-text] ", "[s-text]")
                : "---[d-text] " + (WT_ConvertUnit.isMetric() ? "KG[s-text]" : "LB[s-text]");
            const distText = destination ? (destinationDistance >= 100 ? destinationDistance.toFixed(0) : destinationDistance.toFixed(1)) + "[d-text] NM[s-text]"
                : "----[d-text] NM[s-text]";
            const fromText = origin ? origin.ident : "-----";
            const toText = destination ? destinationIdent : "-----";

            fmc._templateRenderer.setTemplateRaw([
                ["", "3/3[blue]", "PERF TRIP[blue]"],
                [" FROM[blue s-text]"],
                [fromText, "PPOS>"],
                [" TO[blue s-text]"],
                [toText],
                [" DIST[blue s-text]"],
                [distText],
                [" GND SPD[blue s-text]", "FUEL FLOW[blue s-text] "],
                [Math.round(groundSpeed).toString() + "[d-text] KTS[s-text]", fuelFlowTotalText],
                [" ETE[blue s-text]", "FUEL REQ[blue s-text] "],
                [eteText + "", fuelRequiredText],
                ["------------------------[blue]"],
                ["<CLEAR", "PERF MENU>"]
            ]);
        }, 1000, true);
        fmc.onPrevPage = () => { CJ4_FMC_FuelMgmtPage.ShowPage2(fmc); };
        fmc.onNextPage = () => { CJ4_FMC_FuelMgmtPage.ShowPage1(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_PerfInitPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
}