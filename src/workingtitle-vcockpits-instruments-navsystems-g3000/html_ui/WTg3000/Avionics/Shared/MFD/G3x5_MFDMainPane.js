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
                case WT_MapViewRoadFeatureCollection.Region.EI:
                    data.push(new WT_Garmin_MapViewEIRouteCollection());
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
            navigraphAPI: this.instrument.navigraphAPI,
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
    constructor(htmlElement, instrumentID, halfPaneID, data) {
        this._htmlElement = htmlElement;

        let id = `${instrumentID}-${halfPaneID}`;

        // TODO: find a more elegant way to do this
        if (halfPaneID === WT_G3x5_MFDHalfPane.ID.LEFT) {
            this._defaultControl = data.airplane.type === WT_PlayerAirplane.Type.TBM930 ? WT_G3x5_MFDHalfPaneControlSetting.Touchscreen.LEFT | WT_G3x5_MFDHalfPaneControlSetting.Touchscreen.RIGHT : WT_G3x5_MFDHalfPaneControlSetting.Touchscreen.LEFT;
        } else {
            this._defaultControl = 0;
        }

        this._settingModel = new WT_DataStoreSettingModel(id, null);
        this._settingModel.addSetting(this._controlSetting = new WT_G3x5_MFDHalfPaneControlSetting(this._settingModel, this._defaultControl));
        this._settingModel.addSetting(this._displaySetting = new WT_G3x5_MFDHalfPaneDisplaySetting(this._settingModel));
        this._settingModel.addSetting(this._waypointSetting = new WT_G3x5_MFDHalfPaneWaypointSetting(this._settingModel));
        this._controlSetting.addListener(this._onControlSettingChanged.bind(this));
        this._displaySetting.addListener(this._onDisplaySettingChanged.bind(this));
        this._waypointSetting.addListener(this._onWaypointSettingChanged.bind(this));

        this._navMap = new WT_G3x5_NavMapDisplayPane(this._createNavMap(id, data.airplane, data.airspeedSensorIndex, data.altimeterIndex, data.icaoWaypointFactory, data.icaoSearchers, data.flightPlanManager, data.unitsSettingModel, data.citySearcher, data.borderData, data.roadFeatureData, data.roadLabelData, data.trafficSystem));
        this._trafficMap = new WT_G3x5_TrafficMapDisplayPane(this._createTrafficMap(data.airplane, data.trafficSystem));
        this._weatherRadar = new WT_G3x5_WeatherRadarDisplayPane(this._createWeatherRadar(id, data.airplane));
        this._charts = new WT_G3x5_ChartsDisplayPane(this._createCharts(id, data.airplane, data.navigraphAPI));
        this._waypointInfo = new WT_G3x5_WaypointInfoDisplayPane(this._createWaypointInfo(id, data.airplane, data.icaoWaypointFactory, data.icaoSearchers));

        this._displayMode;
        /**
         * @type {WT_G3x5_DisplayPane}
         */
        this._activeDisplayPane = null;
        this._waypointICAO = "";
        this._halfRefresh = false;
        this._isAsleep = false;
        this._isInit = false;

        this._refreshCounter = 0;

        this._init();
    }

    /**
     * @returns {WT_G3x5_NavMap}
     */
    _createNavMap(id, airplane, airspeedSensorIndex, altimeterIndex, icaoWaypointFactory, icaoSearchers, flightPlanManager, unitsController, citySearcher, borderData, roadFeatureData, roadLabelData, trafficSystem) {
    }

    /**
     * @returns {WT_G3x5_TrafficMap}
     */
    _createTrafficMap(airplane, trafficSystem) {
    }

    /**
     * @returns {WT_G3x5_WeatherRadar}
     */
    _createWeatherRadar(id, airplane) {
        return new WT_G3x5_WeatherRadar(id, airplane);
    }

    /**
     * @returns {WT_G3x5_ChartsDisplay}
     */
    _createCharts(id, airplane, navigraphAPI) {
        return new WT_G3x5_ChartsDisplay(id, airplane, navigraphAPI);
    }

    /**
     * @returns {WT_G3x5_WaypointInfo}
     */
    _createWaypointInfo(id, airplane, icaoWaypointFactory, icaoSearchers) {
        return new WT_G3x5_WaypointInfo(id, airplane, icaoWaypointFactory, icaoSearchers);
    }

    async _initDisplayPanes() {
        let [
            navMapElement,
            trafficMapElement,
            chartsElement,
            waypointInfoElement
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.htmlElement, `.navMap`),
            WT_CustomElementSelector.select(this.htmlElement, `.trafficMap`),
            WT_CustomElementSelector.select(this.htmlElement, `.charts`),
            WT_CustomElementSelector.select(this.htmlElement, `.waypointInfo`),
        ]);

        this._navMap.init(navMapElement);
        this._trafficMap.init(trafficMapElement);
        this._weatherRadar.init(this.htmlElement.querySelector(`.weatherRadar`));
        this._charts.init(chartsElement);
        this._waypointInfo.init(waypointInfoElement);
    }

    _initDisplay() {
        this._setDisplayMode(WT_G3x5_MFDHalfPaneDisplaySetting.Display.NAVMAP);
        this._setControl(this._defaultControl);
    }

    _initSettings() {
        this._settingModel.init();
        this._settingModel.update();
    }

    async _init() {
        await this._initDisplayPanes();
        this._initDisplay();
        this._initSettings();
        this._isInit = true;
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

    _onWaypointSettingChanged(setting, newValue, oldValue) {
        if (!this._isInit) {
            return;
        }

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
    }

    _setControl(value) {
        this.htmlElement.setControl(value);
    }

    _getDisplayPaneFromMode(mode) {
        switch (mode) {
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.NAVMAP:
                return this._navMap;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.TRAFFIC:
                return this._trafficMap;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.WEATHER:
                return this._weatherRadar;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.CHARTS:
                return this._charts;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.AIRPORT_NRST:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.VOR_NRST:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.NDB_NRST:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.INT_NRST:
                return null;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.AIRPORT_INFO:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.VOR_INFO:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.NDB_INFO:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.INT_INFO:
                return this._waypointInfo;
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
        }
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
        let oldDisplayPane = this._activeDisplayPane;
        this._displayMode = mode;
        this._activeDisplayPane = this._getDisplayPaneFromMode(mode);
        this._updateSleepWake(oldDisplayPane, this._activeDisplayPane);
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

    _setActiveView(view) {
        this._wrapper.setAttribute("active-view", view);
    }

    _updateView(display) {
        switch (display) {
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.NAVMAP:
                this._setActiveView("navmap");
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.TRAFFIC:
                this._setActiveView("trafficmap");
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.WEATHER:
                this._setActiveView("weatherradar");
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.CHARTS:
                this._setActiveView("charts");
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.AIRPORT_NRST:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.VOR_NRST:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.NDB_NRST:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.INT_NRST:
                break;
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.AIRPORT_INFO:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.VOR_INFO:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.NDB_INFO:
            case WT_G3x5_MFDHalfPaneDisplaySetting.Display.INT_INFO:
                this._setActiveView("waypointinfo");
                break;
        }
    }

    setDisplay(display) {
        this._updateView(display);
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
                .content {
                    display: none;
                    position: relative;
                    width: 100%;
                    height: 100%;
                }
                    #wrapper[active-view="navmap"] #navmap {
                        display: block;
                    }
                    #wrapper[active-view="trafficmap"] #trafficmap {
                        display: block;
                    }
                    #wrapper[active-view="weatherradar"] #weatherradar {
                        display: block;
                    }
                    #wrapper[active-view="charts"] #charts {
                        display: block;
                    }
                    #wrapper[active-view="waypointinfo"] #waypointinfo {
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
        <pane-titled id="titledpane" titletext="">
            <slot slot="content" id="navmap" class="content" name="navmap"></slot>
            <slot slot="content" id="trafficmap" class="content" name="trafficmap"></slot>
            <slot slot="content" id="weatherradar" class="content" name="weatherradar"></slot>
            <slot slot="content" id="charts" class="content" name="charts"></slot>
            <slot slot="content" id="waypointinfo" class="content" name="waypointinfo"></slot>
        </pane-titled>
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

class WT_G3x5_MFDHalfPaneControlSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = 0, autoUpdate = false, isPersistent = false, key = WT_G3x5_MFDHalfPaneControlSetting.KEY) {
        super(model, key, defaultValue, autoUpdate, isPersistent);
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
    constructor(model, defaultValue = WT_G3x5_MFDHalfPaneDisplaySetting.Display.NAVMAP, autoUpdate = false, isPersistent = false, key = WT_G3x5_MFDHalfPaneDisplaySetting.KEY) {
        super(model, key, defaultValue, autoUpdate, isPersistent);
    }
}
WT_G3x5_MFDHalfPaneDisplaySetting.KEY = "WT_MFDHalfPane_Display"
/**
 * @enum {Number}
 */
WT_G3x5_MFDHalfPaneDisplaySetting.Display = {
    NAVMAP: 0,
    TRAFFIC: 1,
    WEATHER: 2,
    CHARTS: 3,
    AIRPORT_INFO: 4,
    VOR_INFO: 5,
    NDB_INFO: 6,
    INT_INFO: 7,
    AIRPORT_NRST: 8,
    VOR_NRST: 9,
    NDB_NRST: 10,
    INT_NRST: 11,
}

class WT_G3x5_MFDHalfPaneWaypointSetting extends WT_DataStoreSetting {
    constructor(model, defaultValue = "", autoUpdate = false, isPersistent = false, key = WT_G3x5_MFDHalfPaneWaypointSetting.KEY) {
        super(model, key, defaultValue, autoUpdate, isPersistent);
    }
}
WT_G3x5_MFDHalfPaneWaypointSetting.KEY = "WT_MFDHalfPane_Waypoint"