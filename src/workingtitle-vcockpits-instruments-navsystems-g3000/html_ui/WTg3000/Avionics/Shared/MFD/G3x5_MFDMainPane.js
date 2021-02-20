class WT_G3x5_MFDMainPane extends NavSystemElement {
    constructor(instrumentID, icaoWaypointFactory, icaoSearchers, flightPlanManager, citySearcher) {
        super();

        this._instrumentID = instrumentID;
        this._icaoWaypointFactory = icaoWaypointFactory;
        this._icaoSearchers = icaoSearchers;
        this._flightPlanManager = flightPlanManager;
        this._citySearcher = citySearcher;

        this._mode = WT_G3x5_MFDMainPaneModeSetting.Mode.FULL;

        this._updateCounter = 0;
    }

    /**
     * @readonly
     * @property {String} instrumentID
     * @type {String}
     */
    get instrumentID() {
        return this._instrumentID;
    }

    /**
     * @readonly
     * @property {WT_G3000MFDMainPaneHTMLElement} htmlElement
     * @type {WT_G3000MFDMainPaneHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     * @readonly
     * @property {WT_DataStoreController} controller
     * @type {WT_DataStoreController}
     */
    get controller() {
        return this._controller;
    }

    _initBorderData() {
        this._borderData = new WT_MapViewBorderData();
        this._borderData.startLoad();
    }

    _getRoadRegionsFromConfig(modConfig) {
        let regions = [];
        for (let regionName in WT_MapViewRoadFeatureCollection.Region) {
            let configName = `load${regionName}`;
            if (modConfig.roads[configName]) {
                regions.push(WT_MapViewRoadFeatureCollection.Region[regionName]);
            }
        }
        return regions;
    }

    _getRoadMaxQualityLODFromConfig(modConfig) {
        return 4 - modConfig.roads.quality;
    }

    _getRoadLabelDataFromRegions(regions) {
        let data = [];
        for (let region of regions) {
            switch (region) {
                case WT_MapViewRoadFeatureCollection.Region.NA:
                    data.push(new WT_MapViewUSRouteCollection());
                    data.push(new WT_MapViewCanadaRouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.CA:
                    data.push(new WT_MapViewMexicoRouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.EI:
                    data.push(new WT_MapViewIcelandRouteCollection());
                    data.push(new WT_MapViewUKIrelandRouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.EW:
                    data.push(new WT_MapViewSpainRouteCollection());
                    data.push(new WT_MapViewFranceRouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.EC:
                    data.push(new WT_MapViewECRouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.RU:
                    data.push(new WT_MapViewRussiaRouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.CH:
                    data.push(new WT_MapViewChinaRouteCollection());
                    data.push(new WT_MapViewTaiwanRouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.AE:
                    data.push(new WT_MapViewJapanRouteCollection());
                    data.push(new WT_MapViewSKRouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.OC:
                    data.push(new WT_MapViewAURouteCollection());
                    data.push(new WT_MapViewNZRouteCollection());
                    break;
            }
        }
        return data;
    }

    _initRoadData() {
        let modConfig = WT_g3000_ModConfig.INSTANCE;
        let regions = this._getRoadRegionsFromConfig(modConfig);
        this._roadFeatureData = new WT_MapViewRoadFeatureCollection(
            regions,
            [WT_MapViewRoadFeatureCollection.Type.HIGHWAY, WT_MapViewRoadFeatureCollection.Type.PRIMARY],
            this._getRoadMaxQualityLODFromConfig(modConfig)
        );
        this._roadLabelData = this._getRoadLabelDataFromRegions(regions);

        this._roadFeatureData.startLoad();
        for (let labelData of this._roadLabelData) {
            if (!labelData.hasLoadStarted()) {
                labelData.startLoad();
            }
        }
    }

    _initController() {
        this._controller = new WT_DataStoreController(this.instrumentID, null);
        this._controller.addSetting(this._modeSetting = new WT_G3x5_MFDMainPaneModeSetting(this._controller));
        this._modeSetting.addListener(this._onModeSettingChanged.bind(this));

        this._controller.init();
        this._controller.update();
    }

    _initHalfPanes() {
        this._left = new WT_G3x5_MFDHalfPane(this.htmlElement.querySelector(`mfd-halfpane[slot="left"]`), this.instrumentID, WT_G3x5_MFDHalfPane.ID.LEFT, this._icaoWaypointFactory, this._icaoSearchers, this._flightPlanManager, this._citySearcher, this._borderData, this._roadFeatureData, this._roadLabelData);
        this._right = new WT_G3x5_MFDHalfPane(this.htmlElement.querySelector(`mfd-halfpane[slot="right"]`), this.instrumentID, WT_G3x5_MFDHalfPane.ID.RIGHT, this._icaoWaypointFactory, this._icaoSearchers, this._flightPlanManager, this._citySearcher, this._borderData, this._roadFeatureData, this._roadLabelData);
    }

    /**
     *
     * @param {HTMLElement} root
     */
    init(root) {
        this._htmlElement = root;

        this._initBorderData();
        this._initRoadData();
        this._initHalfPanes();
        this._initController();
    }

    _onModeSettingChanged(setting, newValue, oldValue) {
        this._setMode(newValue);
    }

    _setMode(mode) {
        let isHalf = mode === WT_G3x5_MFDMainPaneModeSetting.Mode.HALF;
        if (this._left) {
            this._left.setHalfRefresh(isHalf);
            this._right.setHalfRefresh(isHalf);

            if (isHalf) {
                this._right.wake();
            } else {
                this._right.sleep();
            }
        }

        this.htmlElement.setMode(mode);
        this._mode = mode;
    }

    _updateHalfPanes(updateCounter) {
        this._left.update(updateCounter % 2);
        if (this._mode === WT_G3x5_MFDMainPaneModeSetting.Mode.HALF) {
            this._right.update((updateCounter + 1) % 2);
        }
    }

    onUpdate(deltaTime) {
        this._updateHalfPanes(this._updateCounter);
        this._updateCounter = this._updateCounter + 1;
    }

    onEvent(event) {
    }
}
WT_G3x5_MFDMainPane.LEFT_TSC_COLOR = "#97d9d5";
WT_G3x5_MFDMainPane.RIGHT_TSC_COLOR = "#d08dff";
WT_G3x5_MFDMainPane.BOTH_TSC_COLOR = "#2c22ff";


class WT_G3000MFDMainPaneHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3000MFDMainPaneHTMLElement.TEMPLATE_SHADOW.content.cloneNode(true));

        this._showWeather = false;
    }

    connectedCallback() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);
    }

    setMode(mode) {
        switch (mode) {
            case WT_G3x5_MFDMainPaneModeSetting.Mode.HALF:
                this._wrapper.setAttribute("state", "half");
                break;
            default:
                this._wrapper.setAttribute("state", "full");
        }
    }
}
WT_G3000MFDMainPaneHTMLElement.TEMPLATE_SHADOW = document.createElement("template");
WT_G3000MFDMainPaneHTMLElement.TEMPLATE_SHADOW.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            background-color: black;
            display: grid;
            grid-template-columns: 100%;
            grid-template-rows: auto;
        }
            mfd-halfpane {
                position: relative;
                width: 100%;
                height: 100%;
            }
            #left {
                display: block;
            }
            #right {
                display: none;
            }
        #wrapper[state="half"] {
            grid-template-columns: 50% 50%;
        }
            #wrapper[state="half"] #right {
                display: block;
            }
    </style>
    <div id="wrapper">
        <slot name="left" id="left"></slot>
        <slot name="right" id="right"></slot>
    </div>
`;

customElements.define("mfd-mainpane", WT_G3000MFDMainPaneHTMLElement);

class WT_G3x5_MFDHalfPane {
    constructor(htmlElement, instrumentID, halfPaneID, icaoWaypointFactory, icaoSearchers, flightPlanManager, citySearcher, borderData, roadFeatureData, roadLabelData) {
        this._htmlElement = htmlElement;

        let id = `${instrumentID}-${halfPaneID}`;

        // TODO: find a more elegant way to do this
        let defaultControl;
        if (halfPaneID === WT_G3x5_MFDHalfPane.ID.LEFT) {
            defaultControl = WT_PlayerAirplane.INSTANCE.type() === WT_PlayerAirplane.Type.TBM930 ? WT_G3x5_MFDHalfPaneControlSetting.Touchscreen.LEFT | WT_G3x5_MFDHalfPaneControlSetting.Touchscreen.RIGHT : WT_G3x5_MFDHalfPaneControlSetting.Touchscreen.LEFT;
        } else {
            defaultControl = 0;
        }

        this._controller = new WT_DataStoreController(id, null);
        this._controller.addSetting(this._controlSetting = new WT_G3x5_MFDHalfPaneControlSetting(this._controller, defaultControl));
        this._controller.addSetting(this._displaySetting = new WT_G3x5_MFDHalfPaneDisplaySetting(this._controller));
        this._controller.addSetting(this._waypointSetting = new WT_G3x5_MFDHalfPaneWaypointSetting(this._controller));
        this._controlSetting.addListener(this._onControlSettingChanged.bind(this));
        this._displaySetting.addListener(this._onDisplaySettingChanged.bind(this));
        this._waypointSetting.addListener(this._onWaypointSettingChanged.bind(this));

        this._navMap = new WT_G3x5_NavMap(id, icaoWaypointFactory, icaoSearchers, flightPlanManager, citySearcher, borderData, roadFeatureData, roadLabelData);
        this._weatherRadar = new WT_G3x5_WeatherRadar(id);
        this._waypointInfo = new WT_G3x5_WaypointInfo(id, icaoWaypointFactory, icaoSearchers);

        this._displayMode;
        this._waypointICAO = "";
        this._halfRefresh = false;
        this._isAsleep = false;

        this._refreshCounter = 0;

        this._initChildren();

        this._setDisplayMode(WT_G3x5_MFDHalfPaneDisplaySetting.Display.NAVMAP);
        this._setControl(defaultControl);

        this._controller.init();
        this._controller.update();
    }

    _initChildren() {
        this._navMap.init(this.htmlElement.querySelector(`.navMap`));
        this._weatherRadar.init(this.htmlElement.querySelector(`.weatherRadar`));
        this._waypointInfo.init(this.htmlElement.querySelector(`.waypointInfo`));
    }

    /**
     * @readonly
     * @property {WT_G3x5_MFDHalfPaneHTMLElement} htmlElement
     * @type {WT_G3x5_MFDHalfPaneHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     * @readonly
     * @property {WT_DataStoreController} controller
     * @type {WT_DataStoreController}
     */
    get controller() {
        return this._controller;
    }

    _onControlSettingChanged(setting, newValue, oldValue) {
        this._setControl(newValue);
    }

    _onDisplaySettingChanged(setting, newValue, oldValue) {
        this._setDisplayMode(newValue);
    }

    _onWaypointSettingChanged(setting, newValue, oldValue) {
        this._setWaypointICAO(newValue);
    }

    /**
     * @returns {Number}
     */
    displayMode() {
        return this._displayMode;
    }

    /**
     * @returns {Boolean}
     */
    isHalfRefresh() {
        return this._halfRefresh;
    }

    setHalfRefresh(value) {
        this._halfRefresh = value;
    }

    _sleepPane(displayMode) {
        switch (displayMode) {
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.NAVMAP:
                this._navMap.sleep();
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.WEATHER:
                this._weatherRadar.sleep();
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.AIRPORT_INFO:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.VOR_INFO:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.NDB_INFO:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.INT_INFO:
                this._waypointInfo.sleep();
                break;
        }
    }

    sleep() {
        this._sleepPane(this.displayMode());
    }

    _wakePane(displayMode) {
        switch (displayMode) {
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.NAVMAP:
                this._navMap.wake();
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.WEATHER:
                this._weatherRadar.wake();
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.AIRPORT_INFO:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.VOR_INFO:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.NDB_INFO:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.INT_INFO:
                this._waypointInfo.wake();
                break;
        }
    }

    wake() {
        this._wakePane(this.displayMode());
    }

    _setControl(value) {
        this.htmlElement.setControl(value);
    }

    _updateSleepWake(oldDisplay, newDisplay) {
        this._sleepPane(oldDisplay);
        this._wakePane(newDisplay);
    }

    _updateMapWaypoint() {
        switch (this._displayMode) {
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.AIRPORT_INFO:
                this._waypointInfo.waypointInfoModule.mode = WT_MapModelWaypointInfoModule.Mode.AIRPORT;
                this._waypointInfo.waypointInfoModule.waypointICAO = this._waypointICAO;
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.VOR_INFO:
                this._waypointInfo.waypointInfoModule.mode = WT_MapModelWaypointInfoModule.Mode.VOR;
                this._waypointInfo.waypointInfoModule.waypointICAO = this._waypointICAO;
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.NDB_INFO:
                this._waypointInfo.waypointInfoModule.mode = WT_MapModelWaypointInfoModule.Mode.NDB;
                this._waypointInfo.waypointInfoModule.waypointICAO = this._waypointICAO;
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.INT_INFO:
                this._waypointInfo.waypointInfoModule.mode = WT_MapModelWaypointInfoModule.Mode.INT;
                this._waypointInfo.waypointInfoModule.waypointICAO = this._waypointICAO;
                break;
        }
    }

    _setDisplayMode(mode) {
        let old = this._displayMode;
        this._displayMode = mode;
        this._updateSleepWake(old, mode);
        this._updateMapWaypoint();
        this.htmlElement.setDisplay(mode);
    }

    _setWaypointICAO(icao) {
        if (this._waypointICAO === icao) {
            return;
        }

        this._waypointICAO = icao;
        this._updateMapWaypoint();
    }

    _updateChildren() {
        switch (this._displayMode) {
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.NAVMAP:
                this._navMap.update();
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.AIRPORT_NRST:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.VOR_NRST:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.NDB_NRST:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.INT_NRST:
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.WEATHER:
                this._weatherRadar.update();
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.AIRPORT_INFO:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.VOR_INFO:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.NDB_INFO:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.INT_INFO:
                this._waypointInfo.update();
                break;
        }
    }

    update(updateCycle) {
        if (!this.isHalfRefresh() || updateCycle === 0) {
            this._updateChildren();
        }
    }
}
/**
 * @enum {String}
 */
WT_G3x5_MFDHalfPane.ID = {
    LEFT: "LEFT",
    RIGHT: "RIGHT"
}

class WT_G3x5_MFDHalfPaneHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_MFDHalfPaneHTMLElement.TEMPLATE_SHADOW.content.cloneNode(true));
    }

    /**
     * @readonly
     * @property {HTMLElement} navMapContainer
     * @type {HTMLElement}
     */
    get navMapContainer() {
        return this._navMap;
    }

    /**
     * @readonly
     * @property {HTMLElement} weatherRadarContainer
     * @type {HTMLElement}
     */
    get weatherRadarContainer() {
        return this._weatherRadar;
    }

    /**
     * @readonly
     * @property {HTMLElement} waypointInfoContainer
     * @type {HTMLElement}
     */
    get waypointInfoContainer() {
        return this._waypointInfo;
    }

    _defineChildren() {
        this._titledPane = this.shadowRoot.querySelector(`#titledpane`);
        this._navMap = this.shadowRoot.querySelector(`#navMap`);
        this._weatherRadar = this.shadowRoot.querySelector(`#weatherRadar`);
        this._waypointInfo = this.shadowRoot.querySelector(`#waypointInfo`);
    }

    connectedCallback() {
        this._defineChildren();
    }

    _setTitle(title) {
        this._titledPane.titleText = title;
    }

    setControl(value) {
        switch (value) {
            case WT_G3x5_MFDHalfPaneControlSetting.Touchscreen.LEFT:
                this._titledPane.setAttribute("control", "left");
                break;
            case WT_G3x5_MFDHalfPaneControlSetting.Touchscreen.RIGHT:
                this._titledPane.setAttribute("control", "right");
                break;
            case WT_G3x5_MFDHalfPaneControlSetting.Touchscreen.LEFT | WT_G3x5_MFDHalfPaneControlSetting.Touchscreen.RIGHT:
                this._titledPane.setAttribute("control", "both");
                break;
            default:
                this._titledPane.setAttribute("control", "none");
        }
    }

    _updateTitle(display) {
        switch (display) {
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.NAVMAP:
                this._setTitle("Navigation Map");
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.WEATHER:
                this._setTitle("Weather Radar");
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.AIRPORT_INFO:
                this._setTitle("Airport Info");
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.VOR_INFO:
                this._setTitle("VOR Info");
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.NDB_INFO:
                this._setTitle("NDB Info");
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.INT_INFO:
                this._setTitle("Intersection Info");
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.AIRPORT_NRST:
                this._setTitle("Nearest Airport");
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.VOR_NRST:
                this._setTitle("Nearest VOR");
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.NDB_NRST:
                this._setTitle("Nearest NDB");
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.INT_NRST:
                this._setTitle("Nearest Intersection");
                break;
        }
    }

    _updateView(display) {
        switch (display) {
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.NAVMAP:
                this._navMap.style.display = "block";
                this._weatherRadar.style.display = "none";
                this._waypointInfo.style.display = "none";
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.AIRPORT_NRST:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.VOR_NRST:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.NDB_NRST:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.INT_NRST:
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.WEATHER:
                this._navMap.style.display = "none";
                this._weatherRadar.style.display = "block";
                this._waypointInfo.style.display = "none";
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.AIRPORT_INFO:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.VOR_INFO:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.NDB_INFO:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.INT_INFO:
                this._navMap.style.display = "none";
                this._weatherRadar.style.display = "none";
                this._waypointInfo.style.display = "block";
                break;
        }
    }

    setDisplay(display) {
        this._updateView(display);
        this._updateTitle(display);
    }
}
WT_G3x5_MFDHalfPaneHTMLElement.TEMPLATE_SHADOW = document.createElement("template");
WT_G3x5_MFDHalfPaneHTMLElement.TEMPLATE_SHADOW.innerHTML = `
    <style>
        :host {
            display: block;
            width: 100%;
            height: 100%;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            background-color: black;
        }
            #titledpane {
                position: absolute;
                left: 1px;
                right: 1px;
                top: 1px;
                bottom: 1px;
                border: solid 1px white;
                border-radius: 3px;
            }
                slot {
                    display: block;
                    position: relative;
                    width: 100%;
                    height: 100%;
                }
            #titledpane[control=left] {
                position: absolute;
                background-color: ${WT_G3x5_MFDMainPane.LEFT_TSC_COLOR};
                --pane-title-border-color: transparent;
                border: solid 1px black;
            }
            #titledpane[control=right] {
                position: absolute;
                background-color: ${WT_G3x5_MFDMainPane.RIGHT_TSC_COLOR};
                --pane-title-border-color: transparent;
                border: solid 1px black;
            }
            #titledpane[control=both] {
                position: absolute;
                background-color: ${WT_G3x5_MFDMainPane.BOTH_TSC_COLOR};
                --pane-title-border-color: transparent;
                border: solid 1px black;
            }
    </style>
    <div id="wrapper">
        <pane-titled id="titledpane" titletext="">
            <slot slot="content" id="navMap" class="content" name="navMap"></slot>
            <slot slot="content" id="weatherRadar" class="content" name="weatherRadar"></slot>
            <slot slot="content" id="waypointInfo" class="content" name="waypointInfo"></slot>
        </pane-titled>
    </div>
`;

customElements.define("mfd-halfpane", WT_G3x5_MFDHalfPaneHTMLElement);

class WT_G3x5_MFDMainPaneModeSetting extends WT_DataStoreSetting {
    constructor(controller, defaultValue = WT_G3x5_MFDMainPaneModeSetting.Mode.FULL, autoUpdate = false, isPersistent = false, key = WT_G3x5_MFDMainPaneModeSetting.KEY) {
        super(controller, key, defaultValue, autoUpdate, isPersistent);
    }
}
WT_G3x5_MFDMainPaneModeSetting.KEY = "WT_MFDMainPane_Mode"
/**
 * @enum {Number}
 */
WT_G3x5_MFDMainPaneModeSetting.Mode = {
    FULL: 0,
    HALF: 1
}

class WT_G3x5_MFDHalfPaneControlSetting extends WT_DataStoreSetting {
    constructor(controller, defaultValue = 0, autoUpdate = false, isPersistent = false, key = WT_G3x5_MFDHalfPaneControlSetting.KEY) {
        super(controller, key, defaultValue, autoUpdate, isPersistent);
    }

    hasControl(touchscreen, all = false) {
        let value = this.getValue();
        if (all) {
            return (value & touchscreen) === touchscreen;
        } else {
            return (value & touchscreen) !== 0;
        }
    }

    addControl(touchscreen) {
        this.setValue(this.getValue() | touchscreen);
    }

    removeControl(touchscreen) {
        this.setValue(this.getValue() & (~touchscreen));
    }
}
WT_G3x5_MFDHalfPaneControlSetting.KEY = "WT_MFDHalfPane_Control"
/**
 * @enum {Number}
 */
WT_G3x5_MFDHalfPaneControlSetting.Touchscreen = {
    LEFT: 1,
    RIGHT: 1 << 1
}

class WT_G3x5_MFDHalfPaneDisplaySetting extends WT_DataStoreSetting {
    constructor(controller, defaultValue = WT_G3x5_MFDHalfPaneDisplaySetting.Display.NAVMAP, autoUpdate = false, isPersistent = false, key = WT_G3x5_MFDHalfPaneDisplaySetting.KEY) {
        super(controller, key, defaultValue, autoUpdate, isPersistent);
    }
}
WT_G3x5_MFDHalfPaneDisplaySetting.KEY = "WT_MFDHalfPane_Display"
/**
 * @enum {Number}
 */
WT_G3x5_MFDHalfPaneDisplaySetting.Display = {
    NAVMAP: 0,
    WEATHER: 1,
    AIRPORT_INFO: 2,
    VOR_INFO: 3,
    NDB_INFO: 4,
    INT_INFO: 5,
    AIRPORT_NRST: 6,
    VOR_NRST: 7,
    NDB_NRST: 8,
    INT_NRST: 9,
}

class WT_G3x5_MFDHalfPaneWaypointSetting extends WT_DataStoreSetting {
    constructor(controller, defaultValue = "", autoUpdate = false, isPersistent = false, key = WT_G3x5_MFDHalfPaneWaypointSetting.KEY) {
        super(controller, key, defaultValue, autoUpdate, isPersistent);
    }
}
WT_G3x5_MFDHalfPaneWaypointSetting.KEY = "WT_MFDHalfPane_Waypoint"