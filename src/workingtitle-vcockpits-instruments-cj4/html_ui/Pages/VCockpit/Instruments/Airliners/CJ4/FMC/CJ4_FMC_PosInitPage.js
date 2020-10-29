// prototype singleton, this needs to be different ofc
let PosInitPage1Instance = undefined;

class CJ4_FMC_PosInitPageOne {
    constructor(fmc) {
        this._fmc = fmc;
        this._isDirty = true; // render on first run ofc

        this._currPos = 0;

        this.originCell = "----";
        this.originPos = "";
        this.refAirport = "-----";
        this.refAirportCoordinates = "";
        this.irsPos = "□□□°□□.□ □□□□°□□.□";
    }

    prepare() {
        if (this._fmc && this._fmc.flightPlanManager) {
            let origin = this._fmc.flightPlanManager.getOrigin();
            if (origin) {
                this.originCell = origin.ident;
                this.originPos = this._currPos;
            }
            else if (this._fmc.tmpOrigin) {
                this.originCell = this._fmc.tmpOrigin;
            }
        }

        if (this._fmc.initCoordinates) {
            this.irsPos = this._fmc.initCoordinates;
        }

        if (this._fmc.refAirport && this._fmc.refAirport.ident) {
            this.refAirport = this._fmc.refAirport.ident;

            if (this._fmc.refAirport.infos && this._fmc.refAirport.infos.coordinates) {
                this.refAirportCoordinates = this._fmc.refAirport.infos.coordinates.toDegreeString();
            }
        }
    }

    bindEvents() {
        this._fmc.onLeftInput[0] = () => {
            this._fmc.inOut = this._currPos;
        };
        this._fmc.onRightInput[1] = () => {
            if (this.originCell != "----") {
                this._fmc.inOut = this._currPos;
            }
        };
        this._fmc.onLeftInput[2] = () => {
            let value = this._fmc.inOut;
            this._fmc.clearUserInput();
            if (this._fmc.tryUpdateRefAirport(value)) {
                this._isDirty = true;
                this.update(); // TODO hmm, i think invalidate() would be the more right thing to call but...
            }
        };
        this._fmc.onRightInput[2] = () => {
            this._fmc.inOut = this.refAirportCoordinates;
        };
        this._fmc.onRightInput[3] = () => {
            this._fmc.inOut = this._currPos;
        };
        this._fmc.onRightInput[4] = () => {
            let value = this._fmc.inOut;
            this._fmc.clearUserInput();
            if (this._fmc.tryUpdateIrsCoordinatesDisplay(value)) {
                this._isDirty = true;
                this.update();
            }
        };
        this._fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(this._fmc); };
        this._fmc.onRightInput[5] = () => { CJ4_FMC_RoutePage.ShowPage1(this._fmc); };
        this._fmc.onPrevPage = () => { CJ4_FMC_PosInitPage.ShowPage3(this._fmc); };
        this._fmc.onNextPage = () => { CJ4_FMC_PosInitPage.ShowPage2(this._fmc); };
        this._fmc.updateSideButtonActiveStatus();
    }

    update() {
        // check if active wpt changed
        const fmsPos = this.getFmsPos();
        if (this._currPos != fmsPos) {
            this._currPos = fmsPos;
            this._isDirty = true;
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
        this._fmc._templateRenderer.setTemplateRaw([
            ["", "1/2 [blue]", "POS INIT[blue]"],
            [" FMS POS[blue]"],
            [this._currPos + ""],
            [" AIRPORT[blue]"],
            [this.originCell, this.originPos],
            [" PILOT/REF WPT[blue]"],
            [this.refAirport, this.refAirportCoordinates],
            ["", "SET POS TO GNSS [blue]"],
            ["", this._currPos],
            ["", "SET POS      [blue]"],
            ["", this.irsPos],
            ["--------------------------[blue]"],
            ["<INDEX", "FPLN>"]
        ]);
    }

    invalidate() {
        this._isDirty = true;
        this._fmc.clearDisplay();
        this.prepare();
        this.render();
        this.bindEvents(); // TODO i would love to only call it once, but fmc.clearDisplay()
        this._isDirty = false;
    }

    // helper functions
    getFmsPos() {
        return new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude")).toDegreeString();
    }
}
class CJ4_FMC_PosInitPage {
    static ShowPage1(fmc) {
        fmc.clearDisplay();
        PosInitPage1Instance = new CJ4_FMC_PosInitPageOne(fmc);
        PosInitPage1Instance.update();
    }

    static ShowPage2(fmc) {
        fmc.clearDisplay();
        fmc.registerPeriodicPageRefresh(() => {
            let currPos = new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude")).toDegreeString();
            let groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
            fmc._templateRenderer.setTemplateRaw([
                ["", "2/2 [blue]", "POS INIT[blue]"],
                [" FMC POS[blue]", "GS [blue]"],
                [currPos + "", groundSpeed + ""],
                [" GNSS1 POS[blue]"],
                [currPos + "", groundSpeed + ""],
                [" GNSS2 POS[blue]"],
                [currPos + "", groundSpeed + ""],
                [""],
                [""],
                [""],
                [""],
                ["-----------------------[blue]"],
                ["<INDEX", "FPLN>"]
            ]);
        }, 1000, true);

        fmc.onLeftInput[5] = () => { CJ4_FMC_InitRefIndexPage.ShowPage1(fmc); };
        fmc.onRightInput[5] = () => { CJ4_FMC_RoutePage.ShowPage1(fmc); };
        fmc.onPrevPage = () => { CJ4_FMC_PosInitPage.ShowPage1(fmc); };
        fmc.updateSideButtonActiveStatus();
    }
}
//# sourceMappingURL=CJ4_FMC_PosInitPage.js.map