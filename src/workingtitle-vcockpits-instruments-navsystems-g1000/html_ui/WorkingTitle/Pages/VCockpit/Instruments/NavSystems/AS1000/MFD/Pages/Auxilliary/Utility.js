class WT_Utility_Page_Model extends WT_Model {
    /**
     * @param {WT_Plane_Statistics} planeStatistics 
     */
    constructor(planeStatistics) {
        super();
        this.planeStatistics = planeStatistics;
        this.flightTimeMode = new rxjs.BehaviorSubject("inAir");
        this.departureTimeMode = new rxjs.BehaviorSubject("inAir");
    }
    resetStatistics() {
        this.planeStatistics.resetStatistics();
    }
    setFlightTimeMode(mode) {
        this.flightTimeMode.next(mode);
    }
    setDepartureTimeMode(mode) {
        this.departureTimeMode.next(mode);
    }
}

class WT_Utility_Page_Soft_Key_Menu extends WT_Soft_Key_Menu {
    /**
     * @param {WT_Utility_Page_View} model 
     */
    constructor(view) {
        super(true);

        this.addSoftKey(5, new WT_Soft_Key("RESET", () => view.resetStatistics()));
    }
}

class WT_Utility_Page_View extends WT_HTML_View {
    /**
     * @param {WT_MFD_Soft_Key_Menu_Handler} softKeyMenuHandler 
     * @param {WT_Show_Confirm_Dialog_Handler} confirmDialogHandler 
     * @param {WT_Unit_Chooser} unitChooser 
     */
    constructor(softKeyMenuHandler, confirmDialogHandler, unitChooser) {
        super();
        this.softKeyMenuHandler = softKeyMenuHandler;
        this.confirmDialogHandler = confirmDialogHandler;
        this.unitChooser = unitChooser;
        this.subscriptions = new Subscriptions();
        this.softKeyMenu = new WT_Utility_Page_Soft_Key_Menu(this);
        this.inputLayer = new Selectables_Input_Layer(new Selectables_Input_Layer_Dynamic_Source(this));
    }
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;

        const template = document.getElementById('template-utility-page');
        this.appendChild(template.content.cloneNode(true));

        super.connectedCallback();
    }
    /**
     * @param {WT_Utility_Page_Model} model 
     */
    setModel(model) {
        this.model = model;
    }
    resetStatistics() {
        this.confirmDialogHandler.show("Are you sure you want to reset the odometer and ground speed?").then(() => this.model.resetStatistics());
    }
    activate() {
        const renderHtml = (values) => {
            if (values === null)
                return "-";
            const value = values[0];
            const units = values[1];
            return `${value}<span class="units">${units}</span>`;
        }

        const statistics = this.model.planeStatistics;

        const observeSource = (source, modifier, decimals, units) => {
            return source.pipe(
                rxjs.operators.startWith(null),
                rxjs.operators.map(value => value === null ? null : [(value * modifier).toFixed(decimals), units])
            );
        }

        const renderStatistic = (observable, element) => {
            return observable.pipe(
                rxjs.operators.map(renderHtml),
                rxjs.operators.distinctUntilChanged()
            ).subscribe(html => element.innerHTML = html);
        }

        this.subscriptions.add([
            renderStatistic(this.unitChooser.observeDistance(observeSource(statistics.odometer, 1, 1, "KM"), observeSource(statistics.odometer, 0.539957, 1, "NM")), this.elements.odometer),
            renderStatistic(this.unitChooser.observeDistance(observeSource(statistics.tripOdometer, 1, 1, "KM"), observeSource(statistics.tripOdometer, 0.539957, 1, "NM")), this.elements.tripOdometer),
            renderStatistic(this.unitChooser.observeSpeed(observeSource(statistics.averageGroundSpeed, 1, 1, "KPH"), observeSource(statistics.averageGroundSpeed, 0.539957, 1, "KTS")), this.elements.averageGroundSpeed),
            renderStatistic(this.unitChooser.observeSpeed(observeSource(statistics.maximumGroundSpeed, 1, 1, "KPH"), observeSource(statistics.maximumGroundSpeed, 0.539957, 1, "KTS")), this.elements.maximumGroundSpeed),

            this.model.flightTimeMode.pipe(
                rxjs.operators.switchMap(mode => {
                    switch (mode) {
                        case "inAir":
                            return statistics.inAirTimer;
                        case "powerOn":
                            return statistics.powerOnTimer;
                    }
                }),
                rxjs.operators.distinctUntilChanged()
            ).subscribe(time => {
                this.elements.flightTime.textContent = time === null ? "-" : this.formatTime(time, true);
            }),

            this.model.departureTimeMode.pipe(
                rxjs.operators.switchMap(mode => {
                    switch (mode) {
                        case "inAir":
                            return statistics.inAirDepartureTime;
                        case "powerOn":
                            return statistics.powerOnDepartureTime;
                    }
                }),
                rxjs.operators.distinctUntilChanged()
            ).subscribe(time => {
                this.elements.departureTime.innerHTML = time === null ? "-" : `${this.formatTime(time)}<span class="units">LCL</span>`;
            })
        ]);

        this.softKeyMenuHandle = this.softKeyMenuHandler.show(this.softKeyMenu);
    }
    setFlightTimeMode(mode) {
        this.model.setFlightTimeMode(mode);
    }
    setDepartureTimeMode(mode) {
        this.model.setDepartureTimeMode(mode);
    }
    formatTime(v, showSeconds = false) {
        const hours = Math.floor(v / 3600);
        const minutes = Math.floor((v % 3600) / 60);
        const seconds = Math.floor(v % 60);
        return `${hours.toFixed(0).padStart(2, "0")}:${minutes.toFixed(0).padStart(2, "0")}${showSeconds ? `:${seconds.toFixed(0).padStart(2, "0")}` : ""}`;
    }
    deactivate() {
        this.subscriptions.unsubscribe();
        if (this.softKeyMenuHandle) {
            this.softKeyMenuHandle = this.softKeyMenuHandle.pop();
        }
    }
    /**
     * @param {Input_Stack} inputStack 
     */
    enter(inputStack) {
        this.inputStackHandle = inputStack.push(this.inputLayer);
    }
    exit() {
        if (this.inputStackHandle) {
            this.inputStackHandle = this.inputStackHandle.pop();
        }
    }
}
customElements.define("g1000-utility", WT_Utility_Page_View);