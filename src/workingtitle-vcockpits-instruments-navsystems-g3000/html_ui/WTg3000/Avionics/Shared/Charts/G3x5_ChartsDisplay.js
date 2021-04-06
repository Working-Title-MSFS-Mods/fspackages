class WT_G3x5_ChartsDisplay {
    /**
     * @param {String} instrumentID
     * @param {WT_PlayerAirplane} airplane
     * @param {WT_NavigraphAPI} navigraphAPI
     */
    constructor(instrumentID, airplane, navigraphAPI) {
        this._settingModelID = `${instrumentID}_${WT_G3x5_ChartsDisplay.SETTING_MODEL_ID}`;

        this._airplane = airplane;
        this._navigraphAPI = navigraphAPI;
    }

    /**
     * @readonly
     * @type {String}
     */
    get settingModelID() {
        return this._settingModelID;
    }

    /**
     * The model associated with this charts display.
     * @readonly
     * @type {WT_G3x5_ChartsModel}
     */
    get model() {
        return this._model;
    }

    /**
     * The view associated with this charts display.
     * @readonly
     * @type {WT_G3x5_ChartsDisplayHTMLElement}
     */
    get view() {
        return this._view;
    }

    /**
     * The setting model associated with this charts display.
     * @readonly
     * @type {WT_DataStoreSettingModel}
     */
    get settingModel() {
        return this._settingModel;
    }

    _initView() {
        this.view.setContext({model: this.model});
    }

    _initSettingListeners() {
        this._chartIDSetting.addListener(this._onChartIDSettingChanged.bind(this));
    }

    _initSettingModel() {
        this.settingModel.addSetting(this._chartIDSetting = new WT_G3x5_ChartsChartIDSetting(this.settingModel));

        this._initSettingListeners();

        this.settingModel.init();
    }

    _initMapView() {
        this._mapView.addLayer(new WT_MapViewAirplaneLayer());
    }

    _initMap(viewElement) {
        this._mapModel = new WT_MapModel(this._airplane);
        this._mapView = viewElement.querySelector(`map-view`);
        this._mapView.setModel(this._mapModel);

        this._initMapView();
    }

    init(viewElement) {
        this._model = new WT_G3x5_ChartsModel(this._navigraphAPI);
        this._view = viewElement;
        this._settingModel = new WT_DataStoreSettingModel(this.settingModelID);

        this._initView();
        this._initSettingModel();
        this._initMap(viewElement);
    }

    _onChartIDSettingChanged(setting, newValue, oldValue) {
        this.model.chartID = newValue;
    }

    sleep() {
    }

    wake() {
    }

    update() {
        this.view.update();
    }
}
WT_G3x5_ChartsDisplay.SETTING_MODEL_ID = "Charts";

class WT_G3x5_ChartsMapRangeTargetController {
    /**
     * @param {WT_MapModel} mapModel
     * @param {WT_MapView} mapView
     */
    constructor(mapModel, mapView) {
        this._icaoWaypointFactory = icaoWaypointFactory;

        this.addSetting(this._rangeSetting);

        mapView.setTargetOffsetHandler(this);
        mapView.setRangeInterpreter(this);

        this._aspectRatio = 1;
    }

    /**
     *
     * @param {WT_MapModel} model
     * @param {WT_GVector2} offset
     */
    getTargetOffset(model, offset) {
        offset.set(0, 0);
    }

    /**
     *
     * @param {WT_MapModel} model
     * @param {WT_NumberUnit} range
     */
    getTrueRange(model, range) {
        // nominal range should be 90% of half the smallest dimension
        let rangeHeightFactor = Math.min(0.45, this._aspectRatio * 0.45);
        range.set(model.range).scale(1 / rangeHeightFactor, true);
    }

    _updateTarget() {
        this.mapModel.target = this.mapModel.airplane.navigation.position(this._target);
    }

    _updateRotation() {
        this.mapModel.rotation = -this.mapModel.airplane.navigation.headingTrue();
    }

    update() {
        let aspectRatio = this.mapView.projection.viewWidth / this.mapView.projection.viewHeight;
        if (aspectRatio !== this._aspectRatio) {
            this._aspectRatio = aspectRatio;
        }

        this._updateTarget();
        this._updateRotation();
    }
}

class WT_G3x5_ChartsDisplayHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        /**
         * @type {{model:WT_G3x5_ChartsModel}}
         */
        this._context = null;
        this._isInit = false;

        this._displayedChart = null;
    }

    _getTemplate() {
        return WT_G3x5_ChartsDisplayHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        /**
         * @type {HTMLCanvasElement}
         */
        this._chartImg = this.shadowRoot.querySelector(`#chart`);
    }

    _initChartView() {
        this._chartView = new WT_G3x5_ChartsDisplayChartView(this._chartImg);
    }

    connectedCallback() {
        this._defineChildren();
        this._initChartView();
        this._isInit = true;
    }

    setContext(context) {
        this._context = context;
    }

    _updateViewSize() {
        this._width = this.clientWidth;
        this._height = this.clientHeight;
    }

    _updateChartView() {
        let chart = this._context.model.chart;
        let url = this._context.model.useNightView ? this._context.model.chartNightViewURL : this._context.model.chartDayViewURL;
        this._chartView.update(this._width, this._height, chart, url);
    }

    _doUpdate() {
        this._updateViewSize();
        this._updateChartView();
    }

    update() {
        if (!this._isInit || !this._context) {
            return;
        }

        this._doUpdate();
    }
}
WT_G3x5_ChartsDisplayHTMLElement.NAME = "wt-charts";
WT_G3x5_ChartsDisplayHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_ChartsDisplayHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
            #chartcontainer {
                position: absolute;
                left: 0%;
                top: 0%;
                width: 100%;
                height: 100%;
            }
                #chart {
                    position: absolute;
                }
            #noairplanecontainer {
                display: none;
                position: absolute;
                right: 1px;
                bottom: 1px;
                width: var(--charts-noairplane-size, 1.2em);
                height: var(--charts-noairplane-size, 1.2em);
                background-color: black;
                border: solid 1px white;
                border-radius: 3px;
                transform: rotate(0deg);
            }
            #noscale {
                display: none;
                position: absolute;
                right: calc(5px + var(--charts-noairplane-size, 1.2em));
                bottom: 1px;
                background-color: black;
                border: solid 1px white;
                border-radius: 3px;
                font-size: var(--charts-scale-font-size, 1em);
                color: var(--wt-g3x5-lightblue);
                padding: 0 0.2em;
                transform: rotate(0deg);
            }
            #map {
                position: absolute;
                left: 0%;
                height: 0%;
                width: 100%;
                height: 100%;
                transform: rotate(0deg);
            }
    </style>
    <div id="wrapper">
        <div id="chartcontainer">
            <canvas id="chart" />
        </div>
        <slot name="map" id="map"></slot>
        <div id="noairplanecontainer">
        </div>
        <div id="scalecontainer">
        </div>
        <div id="noscale">NOT TO SCALE</div>
    </div>
`;

customElements.define(WT_G3x5_ChartsDisplayHTMLElement.NAME, WT_G3x5_ChartsDisplayHTMLElement);

class WT_G3x5_ChartsDisplayChartView {
    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        this._canvas = canvas;
        this._context = canvas.getContext("2d");

        this._img = new Image();
        this._img.onload = this._onImgSrcLoaded.bind(this);

        this._displayedChart = null;
        this._displayedURL = "";

        this._viewWidth = 0;
        this._viewHeight = 0;

        this._imgWidth = 0;
        this._imgHeight = 0;
        this._imgDisplayWidth = 0;
        this._imgDisplayHeight = 0;
    }

    /**
     * @readonly
     * @type {WT_NavigraphChartDefinition}
     */
    get displayedChart() {
        return this._displayedChart;
    }

    _onImgSrcLoaded() {
        this._canvas.width = this._imgWidth;
        this._canvas.height = this._imgHeight;
        this._context.drawImage(this._img, 0, 0);

        this._canvas.style.width = `${this._imgWidth}px`;
        this._canvas.style.height = `${this._imgHeight}px`;
        this._canvas.style.display = "block";
    }

    _setChart(chart, url) {
        if (url === this._displayedURL) {
            return;
        }

        this._canvas.style.display = "none";
        this._img.src = url;

        this._displayedChart = chart;
        this._displayedURL = url;
        if (chart) {
            this._imgWidth = Math.abs(chart.bbox_local[3] - chart.bbox_local[2]);
            this._imgHeight = Math.abs(chart.bbox_local[1] - chart.bbox_local[0]);
        } else {
            this._imgWidth = 0;
            this._imgHeight = 0;
        }
    }

    _updateDimensions(viewWidth, viewHeight) {
        let viewAspectRatio = viewWidth / viewHeight;
        let imgAspectRatio = this._imgWidth / this._imgHeight;

        let scaleFactor = 1;
        if (imgAspectRatio > viewAspectRatio) {
            scaleFactor = viewWidth / this._imgWidth;
        } else {
            scaleFactor = viewHeight / this._imgHeight;
        }

        let displayWidth = scaleFactor * this._imgWidth;
        let displayHeight = scaleFactor * this._imgHeight;
        if (displayWidth !== this._imgDisplayWidth || displayHeight !== this._imgDisplayHeight) {
            this._canvas.style.left = `${(viewWidth - this._imgWidth) / 2}px`;
            this._canvas.style.top = `${(viewHeight - this._imgHeight) / 2}px`;
            this._canvas.style.transform = `scale(${scaleFactor})`;
            this._imgDisplayWidth = displayWidth;
            this._imgDisplayHeight = displayHeight;
        }
    }

    update(viewWidth, viewHeight, chart, url) {
        if (viewWidth === 0 || viewHeight === 0) {
            return;
        }

        this._setChart(chart, url);
        if (!this._displayedChart) {
            return;
        }

        this._updateDimensions(viewWidth, viewHeight);
    }
}