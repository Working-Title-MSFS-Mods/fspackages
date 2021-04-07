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

        this._bounds = [0, 0, 0, 0];
        this._boundsReadOnly = {
            _bounds: this._bounds,
            get left() {
                return this._bounds[0];
            },
            get top() {
                return this._bounds[1];
            },
            get right() {
                return this._bounds[2];
            },
            get bottom() {
                return this._bounds[3];
            }
        };

        this._translation = new WT_GVector2(0, 0);
        this._scaleFactor = 1;
        this._rotation = 0;
        this._transform = new WT_GTransform2();
        this._inverseTransform = new WT_GTransform2();

        this._tempTransform = new WT_GTransform2();
    }

    _getTemplate() {
        return WT_G3x5_ChartsDisplayHTMLElement.TEMPLATE;
    }

    /**
     * @readonly
     * @type {{readonly left:Number, readonly top:Number, readonly right:Number, readonly bottom:Number}}
     */
    get chartBounds() {
        return this._boundsReadOnly;
    }

    /**
     * @readonly
     * @type {WT_GVector2ReadOnly}
     */
    get chartTranslation() {
        return this._translation.readonly();
    }

    /**
     * @readonly
     * @type {Number}
     */
    get chartScaleFactor() {
        return this._scaleFactor;
    }

    /**
     * @readonly
     * @type {Number}
     */
    get chartRotation() {
        return this._rotation;
    }

    /**
     * @readonly
     * @type {WT_GTransform2ReadOnly}
     */
    get chartTransform() {
        return this._transform.readonly();
    }

    /**
     * @readonly
     * @type {WT_GTransform2ReadOnly}
     */
    get chartInverseTransform() {
        return this._inverseTransform.readonly();
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
        this._viewWidth = this.clientWidth;
        this._viewHeight = this.clientHeight;
    }

    _updateBoundsFromChart(chart, usePlanView) {
        let bbox = usePlanView ? chart.planview.bbox_local : chart.bbox_local;
        this._bounds[0] = bbox[3]; // left
        this._bounds[1] = bbox[0]; // top
        this._bounds[2] = bbox[2]; // right
        this._bounds[3] = bbox[1]; // bottom
    }

    _updateChartTransform() {
        let model = this._context.model;
        if (!model.chart) {
            return;
        }

        this._updateBoundsFromChart(model.chart, model.usePlanView);
        let imgWidth = this.chartBounds.right - this.chartBounds.left;
        let imgHeight = this.chartBounds.bottom - this.chartBounds.top;

        let flipAspectRatio = ((model.rotation / 90) % 2) === 1;
        let imgAspectRatioWidth = flipAspectRatio ? imgHeight : imgWidth;
        let imgAspectRatioHeight = flipAspectRatio ? imgWidth : imgHeight;

        let viewAspectRatio = this._viewWidth / this._viewHeight;
        let imgAspectRatio = imgAspectRatioWidth / imgAspectRatioHeight;

        let scaleFactor = model.scaleFactor;
        if (imgAspectRatio > viewAspectRatio) {
            scaleFactor *= this._viewWidth / imgAspectRatioWidth;
        } else {
            scaleFactor *= this._viewHeight / imgAspectRatioHeight;
        }

        let rotation = model.rotation * Avionics.Utils.DEG2RAD;

        WT_GTransform2.translation(-imgWidth / 2, -imgHeight / 2, this._transform)                                       // translate center to origin
            .concat(WT_GTransform2.scale(scaleFactor, this._tempTransform), true)                                        // scale
            .concat(WT_GTransform2.rotation(rotation, this._tempTransform), true)                                        // rotate
            .concat(WT_GTransform2.translation(this._viewWidth / 2, this._viewHeight / 2, this._tempTransform), true);   // translate center to view center

        this._inverseTransform.set(this._transform).inverse(true);

        //this._translation.set(translateX, translateY);
        this._scaleFactor = scaleFactor;
        this._rotation = model.rotation;
    }

    _updateChartView() {
        let chart = this._context.model.chart;
        let url = this._context.model.useNightView ? this._context.model.chartNightViewURL : this._context.model.chartDayViewURL;
        this._chartView.update(chart, url, this.chartBounds, this.chartTransform);
    }

    _doUpdate() {
        this._updateViewSize();
        this._updateChartTransform();
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
                    left: 0%;
                    top: 0%;
                    transform-origin: top left;
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

        this._imgWidth = 0;
        this._imgHeight = 0;
        /**
         * @type {{readonly left:Number, readonly top:Number, readonly right:Number, readonly bottom:Number}}
         */
        this._imgBounds = null;
        this._imgTransform = "";

        this._isImgLoading = false;
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
        this._context.drawImage(this._img, this._imgBounds.left, this._imgBounds.top, this._imgWidth, this._imgHeight, 0, 0, this._imgWidth, this._imgHeight);

        this._canvas.style.width = `${this._imgWidth}px`;
        this._canvas.style.height = `${this._imgHeight}px`;
        this._canvas.style.display = "block";

        this._isImgLoading = false;
    }

    _setChart(chart, url, bounds) {
        if (url === this._displayedURL) {
            return;
        }

        this._imgBounds = bounds;
        if (chart) {
            this._imgWidth = this._imgBounds.right - this._imgBounds.left;
            this._imgHeight = this._imgBounds.bottom - this._imgBounds.top;
        } else {
            this._imgWidth = 0;
            this._imgHeight = 0;
        }

        this._canvas.style.display = "none";
        this._img.src = url;

        this._displayedChart = chart;
        this._displayedURL = url;
        this._isImgLoading = true;
    }

    /**
     *
     * @param {WT_GTransform2ReadOnly} transform
     */
    _updateTransform(transform) {
        let transformString = `matrix(${transform.element(0, 0)}, ${transform.element(1, 0)}, ${transform.element(0, 1)}, ${transform.element(1, 1)}, ${transform.element(0, 2).toFixed(1)}, ${transform.element(1, 2).toFixed(1)})`;
        if (transformString !== this._imgTransform) {
            this._canvas.style.transform = transformString;
            this._imgTransform = transformString;
        }
    }

    /**
     *
     * @param {WT_NavigraphChartDefinition} chart
     * @param {String} url
     * @param {{readonly left:Number, readonly top:Number, readonly right:Number, readonly bottom:Number}} bounds
     * @param {WT_GTransform2ReadOnly} transform
     */
    update(chart, url, bounds, transform) {
        this._setChart(chart, url, bounds);
        if (!this._displayedChart || this._isImgLoading) {
            return;
        }

        this._updateTransform(transform);
    }
}