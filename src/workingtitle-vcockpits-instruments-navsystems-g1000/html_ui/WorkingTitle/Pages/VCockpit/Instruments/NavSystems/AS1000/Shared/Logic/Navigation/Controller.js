class WT_Flight_Plan_Controller {
    /**
     * @param {FlightPlanManager} flightPlan 
     */
    constructor(flightPlan) {
        this.mode = null;
        this.flightPlan = flightPlan;
    }
    /**
     * @param {WT_Flight_Plan_Mode} mode 
     */
    setMode(mode) {
        if (this.mode)
            this.mode.deactivate();
        this.mode = mode;
        if (this.mode)
            this.mode.activate();
    }
    update(dt) {
        if (this.mode) {
            this.mode.update(dt);
        }
    }
    getMode() {
        return this.mode;
    }
}

class WT_Flight_Plan_Leg_Information {
    /**
     * @param {number} mode 
     * @param {string} from 
     * @param {string} to 
     * @param {string} symbol 
     * @param {number} distance 
     * @param {number} bearing 
     */
    constructor(mode, from, to, symbol, distance, bearing) {
        this.mode = mode;
        this.from = from;
        this.to = to;
        this.symbol = symbol;
        this.distance = distance;
        this.bearing = bearing;
    }
    encode() {
        return JSON.stringify([this.mode, this.from, this.to, this.symbol, this.distance, this.bearing]);
    }
    static decode(str) {
        const data = JSON.decode(str);
        return new WT_Flight_Plan_Leg_Information(...data);
    }
}

class WT_Flight_Plan_Mode {
    getLegInformation() {
        throw new Error(`WT_Flight_Plan_Mode.getLegInformation not implemented`);
    }
}
WT_Flight_Plan_Mode.MODE_NORMAL = 1;
WT_Flight_Plan_Mode.MODE_DIRECT_TO = 2;
WT_Flight_Plan_Mode.MODE_OBS = 3;
WT_Flight_Plan_Mode.MODE_HOLD = 3;

class WT_Flight_Plan_Active_Leg_Information {
    constructor() {
        this.activeLeg = new Subject(null);
        window.addEventListener('storage', async e => {
            if (e.key == "UpdateActiveLegInformation") {
                const json = JSON.decode(e.newValue);
                this.processUpdate(json);
            }
        });
    }
    /**
     * @param {WT_Flight_Plan_Leg_Information} information
     */
    setInformation(information) {
        window.localStorage.setItem("UpdateActiveLegInformation", information.encode());
        this.activeLeg.value = item;
    }
    /**
     * @param {string} json 
     */
    processUpdate(json) {
        this.activeLeg.value = WT_Flight_Plan_Leg_Information.decode(json);
    }
}

class WT_Flight_Plan_Update_Watcher {
    /**
     * @param {WT_Flight_Plan_Controller} flightPlanController 
     * @param {WT_Normal_Flight_Plan_Controller_Factory} normalFactory 
     * @param {WT_Direct_To_Controller_Factory} directToFactory 
     */
    constructor(flightPlanController, normalFactory, directToFactory) {
        this.flightPlanController = flightPlanController;
        this.normalFactory = normalFactory;
        this.directToFactory = directToFactory;

        window.addEventListener('storage', async e => {
            if (e.key == "SetFlightPlan") {
                const json = JSON.decode(e.newValue);
                this.processUpdate(json);
            }
        });
    }
    async processUpdate(json) {
        switch (json.mode) {
            // Normal flight
            case 1: {
                const controller = this.normalFactory.create();
                this.flightPlanController.setMode(controller);
                break;
            }
            // Direct to
            case 2: {
                const controller = await this.directToFactory.create(json.icao, json.course);
                this.flightPlanController.setMode(controller);
                break;
            }
        }
    }
}