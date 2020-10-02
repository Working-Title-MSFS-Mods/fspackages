// prototype singleton, this needs to be different ofc
let PosInitPage1Instance = undefined;

class CJ4_FMC_PosInitPage {
    constructor(fmc) {
        this._fmc = fmc;
        this._isDirty = true; // render on first run ofc

        this._currPos = this.getFmsPos();

        this.originCell = "----";
        this.originPos = "";
        this.refAirport = "-----";
        this.refAirportCoordinates = "";
        this.irsPos = "□□□°□□.□ □□□□°□□.□";
    }

    prepare() {
        // return if nothing changed
        if (!this._isDirty) return;

        // TODO not sure if this should be after render or here :thinking:
        this._isDirty = false;

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

        if (this._fmc.refAirport && this._fmc.refAirport.ident) {
            this.refAirport = this._fmc.refAirport.ident;
        }

        if (this._fmc.refAirport && this._fmc.refAirport.infos && this._fmc.refAirport.infos.coordinates) {
            this.refAirportCoordinates = this._fmc.refAirport.infos.coordinates.toDegreeString();
        }
    }

    start() {
        this.prepare();
        this.render();
        this.bindEvents(); // TODO maybe just call invalidate, but care about the dirtyflag
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
        this._fmc.onLeftInput[2] = async () => {
            let value = this._fmc.inOut;
            this._fmc.inOut = "";
            if (await this._fmc.tryUpdateRefAirport(value)) {
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
        this._fmc.onRightInput[4] = async () => {
            let value = this._fmc.inOut;
            this._fmc.inOut = "";
            if (await this._fmc.tryUpdateIrsCoordinatesDisplay(value)) {
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
        const fmsPos = this.getFmsPos()
        if (this._currPos != fmsPos) {
            this._currPos = fmsPos;
            this._isDirty = true;
        }

        // TODO check if it was changed, but we invalidate from input event anyway
        if (this._fmc.initCoordinates) {
            this.irsPos = this._fmc.initCoordinates;
        }

        if (this._isDirty) {
            this.invalidate();
        }
    }

    render() {
        this._fmc.clearDisplay();
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
        //this.prepare(); // in this case i will not always call prepare as data doesn't change
        this.render();
        this.bindEvents(); // TODO i would love to only call it once, but fmc.clearDisplay()
    }

    // helper functions
    getFmsPos() {
        return new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude")).toDegreeString()
    }


    static ShowPage1(fmc) {
        fmc.clearDisplay();
        PosInitPage1Instance = new CJ4_FMC_PosInitPage(fmc);
        PosInitPage1Instance.start();
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