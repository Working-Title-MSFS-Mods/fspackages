class WT_Map_Setup_Source {
    constructor() {
        this.listeners = [];
    }
    addListener(listener) {
        this.listeners.push(listener);
    }
    fireListeners(key) {
        this.listeners.forEach(listener => listener(key, this.getValue(key)));
    }
    getValue(key) {
        throw new Error("WT_Map_Setup_Source.getValue not implemented");
    }
}

class WT_Map_Setup {
    constructor(defaults) {
        this.listeners = [];
        this.values = {};

        this.defaults = defaults;
        this.load(defaults);
    }
    getStorageKey(key) {
        return `MapSetup.${key}`;
    }
    load(defaults) {
        for (let key in defaults) {
            this.values[key] = WTDataStore.get(this.getStorageKey(key), defaults[key]);
        }
    }
    saveKey(key) {
        const storageKey = this.getStorageKey(key);
        if (this.defaults[key] != this.values[key]) {
            WTDataStore.set(storageKey, this.values[key]);
        } else {
            WTDataStore.remove(storageKey);
        }
    }
    saveAll() {
        for (let key in this.values) {
            this.saveKey(key);
        }
    }
    addListener(listener) {
        this.listeners.push(listener);
    }
    removeListener(listener) {
        const index = this.listeners.indexOf(listener);
        if (index > -1)
            this.listeners.splice(index);
    }
    fireListeners(key) {
        this.listeners.forEach(listener => listener(key, this.getValue(key)));
    }
    observe(key) {
        const observable = new rxjs.BehaviorSubject(this.getValue(key));
        const listener = (listenKey, value) => {
            if (key == listenKey) {
                observable.next(value);
            }
        }
        this.addListener(listener);
        return observable.pipe(
            rxjs.operators.finalize(() => this.removeListener(listener))
        );
    }
    getValue(key) {
        if (key in this.values) {
            return this.values[key];
        }
        if (key in this.defaults) {
            return this.defaults[key];
        }
        throw new Error("Map setting key was invalid");
    }
    setValue(key, value) {
        if (typeof this.defaults[key] == "number") {
            value = parseInt(value);
        }
        this.values[key] = value;
        this.saveKey(key);
        this.fireListeners(key);
    }
    toggleValue(key) {
        if (typeof this.defaults[key] == "boolean") {
            this.setValue(key, !this.getValue(key));
        }
    }
    resetToDefaults() {
        for (let key in this.defaults) {
            const storageKey = this.getStorageKey(key);
            WTDataStore.remove(storageKey);
            this.values[key] = this.defaults[key];
            this.fireListeners(key);
        }
    }
}
function zoomToIndex(zoom) {
    const feet = 1 / 6076;
    const ranges = [500 * feet, 800 * feet, 1000 * feet, 1500 * feet, 2000 * feet, 3000 * feet, 5000 * feet, 1, 1.5, 2, 3, 5, 8, 10, 15, 20, 30, 50, 80, 100, 150, 200, 300, 500, 800, 1000];
    for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];
        if (range >= zoom)
            return i;
    }
    return ranges.length - 1;
}
WT_Map_Setup.DEFAULT = {
    // Map
    orientation: "north",
    autoZoom: "all on",
    trackVectorEnabled: true,
    trackVectorLength: 60,
    windVectorEnabled: true,
    navRangeRingEnabled: true,
    topographyEnabled: true,
    topographyMaxRange: 4000,
    terrainDataEnabled: false,
    fuelRingEnabled: true,
    fuelRingReserveTime: 45 * 60,
    fieldOfViewEnabled: true,
    nexradEnabled: false,

    // Land
    latLongText: "small",
    latLongRange: zoomToIndex(0),
    freewayRange: zoomToIndex(300),
    nationalHighwayRange: zoomToIndex(30),
    localRoadRange: zoomToIndex(8),
    railroadRange: zoomToIndex(15),
    largeCityText: "medium",
    largeCityRange: zoomToIndex(800),
    mediumCityText: "medium",
    mediumCityRange: zoomToIndex(100),
    smallCityText: "medium",
    smallCityRange: zoomToIndex(20),
    stateProvinceText: "large",
    stateProvinceRange: zoomToIndex(800),
    riverLakeText: "small",
    riverLakeRange: zoomToIndex(200),
    userWaypointText: "small",
    userWaypointRange: zoomToIndex(150),

    // Aviation
    largeAirportText: "medium",
    largeAirportRange: zoomToIndex(800),
    mediumAirportText: "medium",
    mediumAirportRange: zoomToIndex(100),
    smallAirportText: "medium",
    smallAirportRange: zoomToIndex(20),
    intersectionText: "medium",
    intersectionRange: zoomToIndex(20),
    vorText: "medium",
    vorRange: zoomToIndex(100),
    ndbText: "medium",
    ndbRange: zoomToIndex(20),
}

class WT_Map_Setup_Handler {
    /**
     * @param {WT_Map_Setup} mapSetup
     * @param {MapInstrument} map
     */
    constructor(mapSetup, map) {
        this.mapSetup = mapSetup;
        this.map = map;

        this.handlers = this.getHandlers();
        this.setInitialValues(this.handlers);
        this.mapSetup.addListener((key, value) => {
            if (key in this.handlers) {
                this.handlers[key](value);
            }
        });
    }
    getHandlers() {
        const m = this.map;
        return {
            trackVectorEnabled: value => m.showTrackVector = value,
            trackVectorLength: value => m.trackVectorElement.lookahead = value,
            orientation: value => {
                switch (value) {
                    case "north": {
                        m.rotateWithPlane(false);
                        m.planeTrackedPosY = 0.5;
                        m.querySelector(".map-orientation").textContent = "NORTH UP";
                        return;
                    }
                    case "track": {
                        m.rotateWithPlane(true);
                        m.planeTrackedPosY = 2 / 3;
                        m.querySelector(".map-orientation").textContent = "TRACK UP";
                        return;
                    }
                    case "heading": {
                        m.rotateWithPlane(true);
                        m.planeTrackedPosY = 2 / 3;
                        m.querySelector(".map-orientation").textContent = "HEADING UP";
                        return;
                    }
                }
            },
            topographyEnabled: value => { m.showIsolines(value) },
            terrainDataEnabled: value => {
                if (value) {
                    m.mapConfigId = 2;
                    m.bingMapRef = EBingReference.PLANE;
                } else {
                    m.mapConfigId = 1;
                    m.bingMapRef = EBingReference.SEA;
                }
            },
            nexradEnabled: value => {
                if (value) {
                    m.showWeather(EWeatherRadar.TOPVIEW)
                } else {
                    m.showWeather(EWeatherRadar.OFF)
                }
            },
            fuelRingEnabled: value => m.showFuelRing = value,
            fuelRingReserveTime: value => m.fuelRingElement.reserveFuelTime = value / 60,
            navRangeRingEnabled: value => {
                m.showRangeRing = value;
                m.showRangeCompass = value;
            },
            smallCityRange: value => m.smallCityMaxRangeIndex = value,
            mediumCityRange: value => m.medCityMaxRangeIndex = value,
            largeCityRange: value => m.largeCityMaxRangeIndex = value,
            smallAirportRange: value => m.smallAirportMaxRangeIndex = value,
            mediumAirportRange: value => m.medAirportMaxRangeIndex = value,
            largeAirportRange: value => m.largeAirportMaxRangeIndex = value,
            intersectionRange: value => m.intMaxRangeIndex = value,
            vorRange: value => m.vorMaxRangeIndex = value,
            ndbRange: value => m.ndbMaxRangeIndex = value,
        }
    }
    setInitialValues(handlers) {
        for (let key in handlers) {
            handlers[key](this.mapSetup.getValue(key));
        }
    }
}

class WT_Map_Setup_Model {
    /**
     * @param {WT_Map_Setup} setup
     */
    constructor(setup) {
        this.mapSetup = setup;
        this.maxRanges = {
            freeway: 800,
            nationalHighway: 80,
            localHighway: 30,
            localRoad: 15,
            railroad: 30,
            largeCity: 1500,
            mediumCity: 200,
            smallCity: 50,
            stateProvince: 1500,
            river: 500,
            userWaypoint: 300,
            largeAirport: 1500,
            mediumAirport: 300,
            smallAirport: 100,
            intersection: 30,
            ndb: 30,
            vor: 300,
        }
    }
    setValue(key, value) {
        this.mapSetup.setValue(key, value);
    }
    getValue(key) {
        return this.mapSetup.getValue(key);
    }
}

class WT_Map_Setup_Input_Layer extends Selectables_Input_Layer {
    constructor(view) {
        super(new Selectables_Input_Layer_Dynamic_Source(view));
        this.view = view;
    }
    onCLR() {
        this.view.exit();
    }
    onNavigationPush() {
        this.view.exit();
    }
    onMenuPush() {

    }
}

class WT_Map_Setup_View extends WT_HTML_View {
    /**
     * @param {WT_MFD_Soft_Key_Menu_Handler} softKeyMenuHandler
     * @param {MapInstrument} map
     */
    constructor(softKeyMenuHandler, map) {
        super();
        this.softKeyMenuHandler = softKeyMenuHandler;
        this.map = map;

        this.inputLayer = new WT_Map_Setup_Input_Layer(this);
        this.onExit = new WT_Event();

        this.rangeDropDownKeys = [
            "freeway", "nationalHighway", "localHighway", "localRoad", "railroad",
            "largeCity", "mediumCity", "smallCity",
            "stateProvince", "river", "userWaypoint",
            "largeAirport", "mediumAirport", "smallAirport",
            "intersection", "vor", "ndb",
        ]

        const setBoolHandler = value => value == "On";
        this.setHandlers = {
            trackVectorEnabled: setBoolHandler,
            windVectorEnabled: setBoolHandler,
            navRangeRingEnabled: setBoolHandler,
            topographyEnabled: setBoolHandler,
            terrainDataEnabled: setBoolHandler,
            fuelRingEnabled: setBoolHandler,
            fieldOfViewEnabled: setBoolHandler,
            nexradEnabled: setBoolHandler,
        }

        const getBoolHandler = value => value ? "On" : "Off";
        this.getHandlers = {
            trackVectorEnabled: getBoolHandler,
            windVectorEnabled: getBoolHandler,
            navRangeRingEnabled: getBoolHandler,
            topographyEnabled: getBoolHandler,
            terrainDataEnabled: getBoolHandler,
            fuelRingEnabled: getBoolHandler,
            fieldOfViewEnabled: getBoolHandler,
            nexradEnabled: getBoolHandler,
        }
    }
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;

        const template = document.getElementById('map-setup-pane');
        this.appendChild(template.content.cloneNode(true));
        super.connectedCallback();

        DOMUtilities.AddScopedEventListener(this, ".options", "input", e => {
            const key = e.target.dataset.setting;
            let value = e.target.value;
            if (key in this.setHandlers) {
                value = this.setHandlers[key](value);
            }
            console.log(`Set ${key} to ${value}`);
            this.model.setValue(key, value);
        });
    }
    /**
     * @param {WT_Map_Setup_Model} model
     */
    setModel(model) {
        this.model = model;

        for (let rangeDropDownKey of this.rangeDropDownKeys) {
            const dropDown = this.elements[`${rangeDropDownKey}Range`];
            if (!dropDown)
                continue;
            const maxRange = this.model.maxRanges[rangeDropDownKey];
            dropDown.clearOptions();
            dropDown.addOption(-1, "Off");
            for (let i = 0; i < this.map.zoomRanges.length; i++) {
                const range = this.map.zoomRanges[i];
                if (range <= maxRange) {
                    dropDown.addOption(i, range >= 1 ? `${range}<span class="units">NM</span>` : `${(range * 6076.12).toFixed(0)}<span class="units">FT</span>`);
                }
            }
        }

        for (let element of this.querySelectorAll("[data-setting]")) {
            const key = element.dataset.setting;
            let value = this.model.getValue(key);
            if (key in this.getHandlers) {
                value = this.getHandlers[key](value);
            }
            element.value = value;
        }
    }
    setGroup(group) {
        for (let element of this.querySelectorAll(".options")) {
            element.removeAttribute("visible");
        }
        this.querySelector(`[data-group=${group}]`).setAttribute("visible", "");
    }
    enter(inputStack) {
        this.inputStackHandle = inputStack.push(this.inputLayer);
        this.inputStackHandle.onPopped.subscribe(() => {
            this.onExit.fire();
        });
    }
    exit() {
        if (this.inputStackHandle) {
            this.inputStackHandle = this.inputStackHandle.pop();
        }
    }
    activate() {
        this.menuHandler = this.softKeyMenuHandler.show(null);
    }
    deactivate() {
        if (this.menuHandler) {
            this.menuHandler = this.menuHandler.pop();
        }
    }
}
customElements.define("g1000-map-setup-pane", WT_Map_Setup_View);