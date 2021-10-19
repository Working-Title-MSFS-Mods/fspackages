class WT_G3x5_MFDMainPane extends WT_G3x5_MFDElement {
    constructor(instrumentID) {
        super();

        this._instrumentID = instrumentID;

        this._mode = WT_G3x5_MFDMainPaneModeSetting.Mode.FULL;

        this._updateCounter = 0;
    }

    /**
     * @readonly
     * @type {String}
     */
    get instrumentID() {
        return this._instrumentID;
    }

    /**
     * @readonly
     * @type {WT_G3x5_MFDMainPaneHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     * @readonly
     * @type {WT_DataStoreSettingModel}
     */
    get settingModel() {
        return this._settingModel;
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
                    data.push(new WT_Garmin_MapViewNARouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.CA:
                    data.push(new WT_Garmin_MapViewMexicoRouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.SA:
                    data.push(new WT_Garmin_MapViewSARouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.EI:
                    data.push(new WT_Garmin_MapViewEIRouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.EN:
                    data.push(new WT_Garmin_MapViewENRouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.EW:
                    data.push(new WT_Garmin_MapViewEWRouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.EC:
                    data.push(new WT_Garmin_MapViewECRouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.RU:
                    data.push(new WT_Garmin_MapViewRussiaRouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.CH:
                    data.push(new WT_Garmin_MapViewCHRouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.AE:
                    data.push(new WT_Garmin_MapViewAERouteCollection());
                    break;
                case WT_MapViewRoadFeatureCollection.Region.OC:
                    data.push(new WT_Garmin_MapViewOCRouteCollection());
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

    _initSettingModel() {
        this._settingModel = new WT_DataStoreSettingModel(this.instrumentID);
        this._settingModel.addSetting(this._modeSetting = new WT_G3x5_MFDMainPaneModeSetting(this._settingModel));
        this._modeSetting.addListener(this._onModeSettingChanged.bind(this));

        this._settingModel.init();
        this._settingModel.update();

        this._setMode(this._modeSetting.getValue());
    }

    /**
     *
     * @param {WT_G3x5_MFDHalfPane.ID} paneID
     * @param {Object} data
     * @returns {WT_G3x5_MFDHalfPane}
     */
    _createHalfPane(paneID, data) {
    }

    _initHalfPanes() {
        let data = {
            airplane: this.instrument.airplane,
            airspeedSensorIndex: this.instrument.referenceAirspeedSensor.index,
            altimeterIndex: this.instrument.referenceAltimeter.index,
            icaoWaypointFactory: this.instrument.icaoWaypointFactory,
            icaoSearchers: this.instrument.icaoSearchers,
            flightPlanManager: this.instrument.flightPlanManagerWT,
            trafficSystem: this.instrument.trafficSystem,
            navigraphNetworkAPI: this.instrument.navigraphNetworkAPI,
            unitsSettingModel: this.instrument.unitsSettingModel,
            citySearcher: this.instrument.citySearcher,
            borderData: this._borderData,
            roadFeatureData: this._roadFeatureData,
            roadLabelData: this._roadLabelData
        }
        this._left = this._createHalfPane(WT_G3x5_MFDHalfPane.ID.LEFT, data);
        this._right = this._createHalfPane(WT_G3x5_MFDHalfPane.ID.RIGHT, data);
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
        this._initSettingModel();
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
                this._left.setSize(WT_G3x5_DisplayPane.Size.HALF);
                this._right.setSize(WT_G3x5_DisplayPane.Size.HALF);
                this._right.wake();
            } else {
                this._left.setSize(WT_G3x5_DisplayPane.Size.FULL);
                this._right.setSize(WT_G3x5_DisplayPane.Size.OFF);
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


class WT_G3x5_MFDMainPaneHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_MFDMainPaneHTMLElement.TEMPLATE_SHADOW.content.cloneNode(true));

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
WT_G3x5_MFDMainPaneHTMLElement.TEMPLATE_SHADOW = document.createElement("template");
WT_G3x5_MFDMainPaneHTMLElement.TEMPLATE_SHADOW.innerHTML = `
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

customElements.define("mfd-mainpane", WT_G3x5_MFDMainPaneHTMLElement);

class WT_G3x5_MFDHalfPane {
    constructor(htmlElement, instrumentID, halfPaneID, instrument, data) {
        this._htmlElement = htmlElement;
        this._instrument = instrument;

        this._paneID = `${instrumentID}-${halfPaneID}`;

        this._createSettings();
        this._createPanes(data);

        this._displayMode;
        /**
         * @type {WT_G3x5_DisplayPane}
         */
        this._activeDisplayPane = null;
        this._waypointICAO = "";
        this._halfRefresh = false;
        this._size = WT_G3x5_DisplayPane.Size.OFF;
        this._isAsleep = false;
        this._isInit = false;

        this._refreshCounter = 0;

        this._init();
    }

    _createSettings() {
        this._settings = new WT_G3x5_PaneSettings(this.paneID);

        this._settings.display.init();

        this._settings.control.addListener(this._onControlSettingChanged.bind(this));
        this._settings.display.addListener(this._onDisplaySettingChanged.bind(this));
    }

    /**
     * @returns {WT_G3x5_NavMap}
     */
    _createNavMap(airplane, airspeedSensorIndex, altimeterIndex, icaoWaypointFactory, icaoSearchers, flightPlanManager, unitsSettingModel, citySearcher, borderData, roadFeatureData, roadLabelData, trafficSystem) {
    }

    /**
     * @returns {WT_G3x5_TrafficMap}
     */
    _createTrafficMap(airplane, trafficSystem, unitsSettingModel) {
    }

    /**
     * @returns {WT_G3x5_WeatherRadar}
     */
    _createWeatherRadar(airplane) {
        return new WT_G3x5_WeatherRadar(this.paneID, airplane);
    }

    /**
     * @returns {WT_G3x5_FlightPlanDisplayPane}
     */
    _createFlightPlanDisplayPane(airplane, icaoWaypointFactory, flightPlanManager, citySearcher, borderData, unitsSettingModel) {
        return new WT_G3x5_FlightPlanDisplayPane(this.paneID, this.settings, airplane, icaoWaypointFactory, flightPlanManager, citySearcher, borderData, unitsSettingModel);
    }

    /**
     * @returns {WT_G3x5_ProcedureDisplayPane}
     */
    _createProcedureDisplayPane(airplane, icaoWaypointFactory, citySearcher, borderData, unitsSettingModel) {
        return new WT_G3x5_ProcedureDisplayPane(this.paneID, this.settings, airplane, icaoWaypointFactory, citySearcher, borderData, unitsSettingModel);
    }

    /**
     * @returns {WT_G3x5_ChartsDisplayPane}
     */
    _createChartsDisplayPane(airplane, navigraphNetworkAPI, unitsSettingModel) {
    }

    /**
     * @returns {WT_G3x5_WaypointInfoDisplayPane}
     */
    _createWaypointInfoDisplayPane(airplane, icaoWaypointFactory, icaoSearchers, unitsSettingModel) {
        return new WT_G3x5_WaypointInfoDisplayPane(this.paneID, this.settings, airplane, icaoWaypointFactory, icaoSearchers, unitsSettingModel);
    }

    /**
     * @returns {WT_G3x5_NearestWaypointDisplayPane}
     */
    _createNearestWaypointDisplayPane(airplane, icaoWaypointFactory, icaoSearchers, unitsSettingModel) {
        return new WT_G3x5_NearestWaypointDisplayPane(this.paneID, this.settings, airplane, icaoWaypointFactory, icaoSearchers, unitsSettingModel);
    }

    _createPanes(data) {
        this._navMapPane = new WT_G3x5_NavMapDisplayPane(this.paneID, this.settings, this._instrument, this._createNavMap(data.airplane, data.airspeedSensorIndex, data.altimeterIndex, data.icaoWaypointFactory, data.icaoSearchers, data.flightPlanManager, data.unitsSettingModel, data.citySearcher, data.borderData, data.roadFeatureData, data.roadLabelData, data.trafficSystem));
        this._trafficMapPane = new WT_G3x5_TrafficMapDisplayPane(this.paneID, this.settings, this._createTrafficMap(data.airplane, data.trafficSystem, data.unitsSettingModel));
        this._weatherRadarPane = new WT_G3x5_WeatherRadarDisplayPane(this.paneID, this.settings, this._createWeatherRadar(data.airplane));
        this._flightPlanPane = this._createFlightPlanDisplayPane(data.airplane, data.icaoWaypointFactory, data.flightPlanManager, data.citySearcher, data.borderData, data.unitsSettingModel);
        this._procedurePane = this._createProcedureDisplayPane(data.airplane, data.icaoWaypointFactory, data.citySearcher, data.borderData, data.unitsSettingModel);
        this._chartsPane = this._createChartsDisplayPane(data.airplane, data.navigraphNetworkAPI, data.unitsSettingModel);
        this._waypointInfoPane = this._createWaypointInfoDisplayPane(data.airplane, data.icaoWaypointFactory, data.icaoSearchers, data.unitsSettingModel);
        this._nearestWaypointPane = this._createNearestWaypointDisplayPane(data.airplane, data.icaoWaypointFactory, data.icaoSearchers, data.unitsSettingModel);
    }

    /**
     * @readonly
     * @type {String}
     */
    get paneID() {
        return this._paneID;
    }

    /**
     * @readonly
     * @type {WT_G3x5_PaneSettings}
     */
    get settings() {
        return this._settings;
    }

    async _initDisplayPanes() {
        let [
            navMapElement,
            trafficMapElement,
            flightPlanElement,
            procedureElement,
            chartsElement,
            waypointInfoElement,
            nearestWaypointElement,
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.htmlElement, `.navMapDisplayPane`),
            WT_CustomElementSelector.select(this.htmlElement, `.trafficMap`),
            WT_CustomElementSelector.select(this.htmlElement, `.flightPlanMap`),
            WT_CustomElementSelector.select(this.htmlElement, `.procedureMap`),
            WT_CustomElementSelector.select(this.htmlElement, `.charts`),
            WT_CustomElementSelector.select(this.htmlElement, `.waypointInfo`),
            WT_CustomElementSelector.select(this.htmlElement, `.nearestWaypoint`)
        ]);

        this._navMapPane.init(navMapElement);
        this._trafficMapPane.init(trafficMapElement);
        this._weatherRadarPane.init(this.htmlElement.querySelector(`.weatherRadar`));
        this._flightPlanPane.init(flightPlanElement);
        this._procedurePane.init(procedureElement);
        this._chartsPane.init(chartsElement);
        this._waypointInfoPane.init(waypointInfoElement);
        this._nearestWaypointPane.init(nearestWaypointElement);
    }

    _initDisplay() {
        this.settings.display.update();
        this.settings.control.update();
        this._setDisplayMode(this.settings.display.mode);
        this._setControl(this.settings.control.getValue());
    }

    async _init() {
        await this._initDisplayPanes();
        this._isInit = true;
        this._initDisplay();
    }

    /**
     * @readonly
     * @type {WT_G3x5_MFDHalfPaneHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     * @readonly
     * @type {WT_DataStoreSettingModel}
     */
    get settingModel() {
        return this._settingModel;
    }

    _onControlSettingChanged(setting, newValue, oldValue) {
        if (!this._isInit) {
            return;
        }

        this._setControl(newValue);
    }

    _onDisplaySettingChanged(setting, newValue, oldValue) {
        if (!this._isInit) {
            return;
        }

        this._setDisplayMode(newValue);
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

    /**
     *
     * @param {WT_G3x5_DisplayPane.Size} size
     */
    setSize(size) {
        this._size = size;
        if (this._activeDisplayPane) {
            this._activeDisplayPane.setSize(size);
        }
    }

    sleep() {
        if (!this._activeDisplayPane) {
            return;
        }

        this._activeDisplayPane.sleep();
    }

    wake() {
        if (!this._activeDisplayPane) {
            return;
        }

        this._activeDisplayPane.wake();
        this._activeDisplayPane.setSize(this._size);
    }

    _setControl(value) {
        this.htmlElement.setControl(value);
    }

    _getDisplayPaneFromMode(mode) {
        switch (mode) {
            case WT_G3x5_PaneDisplaySetting.Mode.NAVMAP:
                return this._navMapPane;
            case WT_G3x5_PaneDisplaySetting.Mode.TRAFFIC:
                return this._trafficMapPane;
            case WT_G3x5_PaneDisplaySetting.Mode.WEATHER:
                return this._weatherRadarPane;
            case WT_G3x5_PaneDisplaySetting.Mode.FLIGHT_PLAN:
                return this._flightPlanPane;
            case WT_G3x5_PaneDisplaySetting.Mode.PROCEDURE:
                return this._procedurePane;
            case WT_G3x5_PaneDisplaySetting.Mode.CHARTS:
                return this._chartsPane;
            case WT_G3x5_PaneDisplaySetting.Mode.WAYPOINT_INFO:
                return this._waypointInfoPane;
            case WT_G3x5_PaneDisplaySetting.Mode.NRST_WAYPOINT:
                return this._nearestWaypointPane;
            default:
                return null;
        }
    }

    _updateSleepWake(oldDisplayPane, newDisplayPane) {
        if (oldDisplayPane) {
            oldDisplayPane.sleep();
        }
        if (newDisplayPane) {
            newDisplayPane.wake();
            newDisplayPane.setSize(this._size);
        }
    }

    _setDisplayMode(mode) {
        let oldDisplayPane = this._activeDisplayPane;
        this._displayMode = mode;
        this._activeDisplayPane = this._getDisplayPaneFromMode(mode);
        this._updateSleepWake(oldDisplayPane, this._activeDisplayPane);
        this.htmlElement.setDisplay(mode);
    }

    _setWaypointICAO(icao) {
        if (this._waypointICAO === icao) {
            return;
        }

        this._waypointICAO = icao;
        this._updateMapWaypoint();
    }

    update(updateCycle) {
        if (!this._isInit) {
            return;
        }

        if (!this.isHalfRefresh() || updateCycle === 0) {
            let title = "";
            if (this._activeDisplayPane) {
                title = this._activeDisplayPane.getTitle();
                this._activeDisplayPane.update();
            }
            this.htmlElement.setTitle(title);
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

    _defineChildren() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);
        this._titledPane = new WT_CachedElement(this.shadowRoot.querySelector(`#titledpane`));
    }

    connectedCallback() {
        this._defineChildren();
    }

    setTitle(title) {
        this._titledPane.setAttribute("titletext", title);
    }

    setControl(value) {
        switch (value) {
            case WT_G3x5_PaneControlSetting.Touchscreen.LEFT:
                this._titledPane.setAttribute("control", "left");
                break;
            case WT_G3x5_PaneControlSetting.Touchscreen.RIGHT:
                this._titledPane.setAttribute("control", "right");
                break;
            case WT_G3x5_PaneControlSetting.Touchscreen.LEFT | WT_G3x5_PaneControlSetting.Touchscreen.RIGHT:
                this._titledPane.setAttribute("control", "both");
                break;
            default:
                this._titledPane.setAttribute("control", "none");
        }
    }

    _updateView(display) {
        this._wrapper.setAttribute("active-view", WT_G3x5_MFDHalfPaneHTMLElement.DISPLAY_MODE_ATTRIBUTES[display]);
    }

    setDisplay(display) {
        this._updateView(display);
    }
}
WT_G3x5_MFDHalfPaneHTMLElement.DISPLAY_MODE_ATTRIBUTES = [
    "navmap",
    "trafficmap",
    "weatherradar",
    "flightplan",
    "procedure",
    "charts",
    "waypointinfo",
    "nearestwaypoint"
];
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
                .content {
                    display: none;
                    position: relative;
                    width: 100%;
                    height: 100%;
                }
                    #wrapper[active-view="navmap"] #navmap,
                    #wrapper[active-view="trafficmap"] #trafficmap,
                    #wrapper[active-view="weatherradar"] #weatherradar,
                    #wrapper[active-view="flightplan"] #flightplan,
                    #wrapper[active-view="procedure"] #procedure,
                    #wrapper[active-view="charts"] #charts,
                    #wrapper[active-view="waypointinfo"] #waypointinfo,
                    #wrapper[active-view="nearestwaypoint"] #nearestwaypoint {
                        display: block;
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
        <wt-pane-titled id="titledpane" titletext="">
            <slot slot="content" id="navmap" class="content" name="navmap"></slot>
            <slot slot="content" id="trafficmap" class="content" name="trafficmap"></slot>
            <slot slot="content" id="weatherradar" class="content" name="weatherradar"></slot>
            <slot slot="content" id="flightplan" class="content" name="flightplan"></slot>
            <slot slot="content" id="procedure" class="content" name="procedure"></slot>
            <slot slot="content" id="charts" class="content" name="charts"></slot>
            <slot slot="content" id="waypointinfo" class="content" name="waypointinfo"></slot>
            <slot slot="content" id="nearestwaypoint" class="content" name="nearestwaypoint"></slot>
        </wt-pane-titled>
    </div>
`;

customElements.define("mfd-halfpane", WT_G3x5_MFDHalfPaneHTMLElement);

class WT_G3x5_MFDMainPaneModeSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = WT_G3x5_MFDMainPaneModeSetting.Mode.FULL, autoUpdate = false, isPersistent = false, key = WT_G3x5_MFDMainPaneModeSetting.KEY) {
        super(model, key, defaultValue, autoUpdate, isPersistent);
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