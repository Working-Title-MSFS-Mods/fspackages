class WT_Map_Instrument_Display_State {
    constructor(defaultState = true) {
        this.showCities = defaultState;
        this.showVORs = defaultState;
        this.showNDBs = defaultState;
        this.showRoads = defaultState;
        this.showIntersections = defaultState;
        this.showAirspaces = defaultState;
        this.showAirports = defaultState;
        this.showFlightPlan = defaultState;
    }
}

class WT_Map_Instrument extends WT_HTML_View {
    constructor() {
        super();
        this.instrument = null;
        this.state = new WT_Map_Instrument_Display_State();
    }
    connectedCallback() {
        super.connectedCallback();

        this.instrument = this.querySelector("map-instrument");

        this.instrument.rangeRingElement = new SvgRangeRingElement();
        this.instrument.rangeCompassElement = new SvgRangeCompassElement();
        this.instrument.trackVectorElement = new SvgTrackVectorElement();
        this.instrument.fuelRingElement = new SvgFuelRingElement();
        this.instrument.altitudeInterceptElement = new SvgAltitudeInterceptElement();
        const feet = 1 / 6076;
        this.instrument.zoomRanges = [500 * feet, 800 * feet, 1000 * feet, 1500 * feet, 2000 * feet, 3000 * feet, 5000 * feet, 1, 1.5, 2, 3, 5, 8, 10, 15, 20, 30, 50, 80, 100, 150, 200, 300, 500, 800, 1000];

        this.applyState(this.state);
    }
    /**
     * @param {WT_Map_Setup} mapSetup 
     */
    applyMapSetup(mapSetup) {
        this.mapSetupHandler = new WT_Map_Setup_Handler(mapSetup, this.instrument);
    }
    /**
     * @param {WT_Map_Instrument_Display_State} state 
     */
    applyState(state) {
        const map = this.instrument;
        map.showCities = state.showCities;
        map.showVORs = state.showVORs;
        map.showNDBs = state.showNDBs;
        map.showRoads = state.showRoads;
        map.showIntersections = state.showIntersections;
        map.showAirspaces = state.showAirspaces;
        map.showAirports = state.showAirports;
        map.showFlightPlan = state.showFlightPlan;

        const previousState = this.state;
        this.state = state;
        return previousState;
    }
    update(dt) {
        if (this.offsetParent) {
            this.instrument.update(dt);
        }
    }
}
customElements.define("g1000-map", WT_Map_Instrument);