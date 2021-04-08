class WT_G3x5_ChartsDisplay {
    /**
     * @param {String} instrumentID
     * @param {WT_PlayerAirplane} airplane
     * @param {WT_NavigraphAPI} navigraphAPI
     */
    constructor(instrumentID, airplane, navigraphAPI) {
        this._airplane = airplane;
        this._navigraphAPI = navigraphAPI;

        this._settingModelID = `${instrumentID}_${WT_G3x5_ChartsDisplay.SETTING_MODEL_ID}`;
        this._scrollEventKey = `${WT_G3x5_ChartsDisplay.SCROLL_EVENT_KEY_PREFIX}_${instrumentID}`;

        this._tempVector2 = new WT_GVector2(0, 0);
        this._tempTransform = new WT_GTransform2();
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
        this._rotationSetting.addListener(this._onRotationSettingChanged.bind(this));
        this._zoomSetting.addListener(this._onZoomSettingChanged.bind(this));
        WT_CrossInstrumentEvent.addListener(this._scrollEventKey, this._onScrollEvent.bind(this));
    }

    _initSettingModel() {
        this.settingModel.addSetting(this._chartIDSetting = new WT_G3x5_ChartsChartIDSetting(this.settingModel));
        this.settingModel.addSetting(this._rotationSetting = new WT_G3x5_ChartsRotationSetting(this.settingModel));
        this.settingModel.addSetting(this._zoomSetting = new WT_G3x5_ChartsZoomSetting(this.settingModel));

        this._initSettingListeners();

        this.settingModel.init();
    }

    _initMapModel() {
        this._mapModel.addModule(new WT_MapModelAirplaneIconModule());
    }

    _initMapView() {
        this._mapView.addLayer(new WT_G3x5_MapViewChartsAirplaneLayer(this.model, this.view));
    }

    _initMapRangeTargetRotationController() {
        this._mapRangeTargetRotationController = new WT_G3x5_ChartsMapRangeTargetRotationController(this.model, this.view, this._mapModel);
    }

    _initMap(viewElement) {
        this._mapModel = new WT_MapModel(this._airplane);
        this._mapView = viewElement.querySelector(`map-view`);
        this._mapView.setModel(this._mapModel);

        this._initMapModel();
        this._initMapView();
        this._initMapRangeTargetRotationController();
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

    _updateChartRotation() {
        if (!this.model.chart) {
            return;
        }

        this.model.rotation = this._rotationSetting.getRotation();
    }

    _updateChartZoom() {
        if (!this.model.chart) {
            return;
        }

        this.model.scaleFactor = this._zoomSetting.getScaleFactor();
    }

    _onRotationSettingChanged(setting, newValue, oldValue) {
        this._updateChartRotation();
    }

    _onZoomSettingChanged(setting, newValue, oldValue) {
        this._updateChartZoom();
    }

    _scrollChart(deltaX, deltaY) {
        if (!this.model.chart) {
            return;
        }

        let transform = this._tempTransform.set(this.view.chartTransformInverse).setTranslate(0, 0);

        let offset = transform.apply(this._tempVector2.set(-deltaX, -deltaY), true).add(this.model.offset);
        let halfWidth = (this.view.chartBounds.right - this.view.chartBounds.left) / 2;
        let halfHeight = (this.view.chartBounds.bottom - this.view.chartBounds.top) / 2;
        let boundedOffsetX = Math.max(-halfWidth, Math.min(halfWidth, offset.x));
        let boundedOffsetY = Math.max(-halfHeight, Math.min(halfHeight, offset.y));
        this.model.offset = offset.set(boundedOffsetX, boundedOffsetY);
    }

    _onScrollEvent(key, data) {
        let split = data.split(",");
        let deltaX = parseFloat(split[0]);
        let deltaY = parseFloat(split[1]);
        this._scrollChart(deltaX, deltaY);
    }

    sleep() {
    }

    wake() {
    }

    update() {
        this.view.update();
        this._mapRangeTargetRotationController.update();
        this._mapView.update();
    }
}
WT_G3x5_ChartsDisplay.SETTING_MODEL_ID = "Charts";

class WT_G3x5_ChartsMapRangeTargetRotationController {
    /**
     * @param {WT_G3x5_ChartsModel} chartsModel
     * @param {WT_G3x5_ChartsDisplayHTMLElement} chartsView
     * @param {WT_MapModel} mapModel
     */
    constructor(chartsModel, chartsView, mapModel) {
        this._chartsModel = chartsModel;
        this._chartsView = chartsView;
        this._mapModel = mapModel;

        this._geoRef = {
            /**
             * @type {WT_NavigraphChartDefinition}
             */
            chart: null,
            isValid: false,

            /**
             * @type {Number[]}
             */
            geoBounds: null,
            geoAngularWidth: 0,
            geoAngularHeight: 0,
            geoWidth: WT_Unit.GA_RADIAN.createNumber(0),
            geoHeight: WT_Unit.GA_RADIAN.createNumber(0),

            /**
             * @type {Number[]}
             */
            viewBounds: null,
            viewWidth: 0,
            viewHeight: 0,
            viewCenter: new WT_GVector2(0, 0),
        };

        this._tempGARad = WT_Unit.GA_RADIAN.createNumber(0);
        this._tempVector2 = new WT_GVector2(0, 0);
        this._tempGeoPoint = new WT_GeoPoint(0, 0);
    }

    _imgBoundToViewBound(value, index, array) {
        switch (index) {
            case WT_NavigraphChart.BoundsIndex.LEFT:
            case WT_NavigraphChart.BoundsIndex.RIGHT:
                return value - array[WT_NavigraphChart.BoundsIndex.LEFT];
            case WT_NavigraphChart.BoundsIndex.TOP:
            case WT_NavigraphChart.BoundsIndex.BOTTOM:
                return value - array[WT_NavigraphChart.BoundsIndex.TOP];
        }
    }

    _updateGeoRef() {
        let chart = this._chartsModel.chart;
        if (!chart || !chart.georef || !this._chartsModel.usePlanView || !chart.planview) {
            this._geoRef.isValid = false;
            return;
        }

        if ((this._geoRef.chart && chart.id === this._geoRef.chart.id) && this._geoRef.isValid) {
            return;
        }

        this._geoRef.chart = chart;
        this._geoRef.isValid = true;
        this._geoRef.geoBounds = chart.planview.bbox_geo;

        let deltaLat = chart.planview.bbox_geo[WT_NavigraphChart.BoundsIndex.TOP] - chart.planview.bbox_geo[WT_NavigraphChart.BoundsIndex.BOTTOM];
        let deltaLong = chart.planview.bbox_geo[WT_NavigraphChart.BoundsIndex.RIGHT] - chart.planview.bbox_geo[WT_NavigraphChart.BoundsIndex.LEFT];
        let deltaLatAbs = Math.abs(deltaLat);
        let deltaLongAbs = Math.abs(deltaLong);
        this._geoRef.geoAngularWidth = Math.min(deltaLongAbs, 360 - deltaLongAbs);
        this._geoRef.geoAngularHeight = Math.min(deltaLatAbs, 360 - deltaLatAbs);

        let centerLat = chart.planview.bbox_geo[WT_NavigraphChart.BoundsIndex.BOTTOM] + deltaLat / 2;
        let centerLong = chart.planview.bbox_geo[WT_NavigraphChart.BoundsIndex.LEFT] + deltaLong / 2;
        this._geoRef.geoWidth.set(this._tempGeoPoint.set(centerLat, chart.planview.bbox_geo[WT_NavigraphChart.BoundsIndex.LEFT]).distance(centerLat, chart.planview.bbox_geo[WT_NavigraphChart.BoundsIndex.RIGHT]));
        this._geoRef.geoHeight.set(this._tempGeoPoint.set(chart.planview.bbox_geo[WT_NavigraphChart.BoundsIndex.TOP], centerLong).distance(chart.planview.bbox_geo[WT_NavigraphChart.BoundsIndex.BOTTOM], centerLong));

        this._geoRef.viewBounds = chart.planview.bbox_local.map(this._imgBoundToViewBound.bind(this));
        this._geoRef.viewWidth = chart.planview.bbox_local[WT_NavigraphChart.BoundsIndex.RIGHT] - chart.planview.bbox_local[WT_NavigraphChart.BoundsIndex.LEFT];
        this._geoRef.viewHeight = chart.planview.bbox_local[WT_NavigraphChart.BoundsIndex.BOTTOM] - chart.planview.bbox_local[WT_NavigraphChart.BoundsIndex.TOP];
        this._geoRef.viewCenter.set(this._geoRef.viewWidth / 2, this._geoRef.viewHeight / 2);
    }

    _updateRotation() {
        this._mapModel.rotation = this._chartsModel.rotation;
    }

    _updateTarget() {
        let viewTargetX = this._geoRef.viewCenter.x + this._chartsModel.offset.x;
        let viewTargetY = this._geoRef.viewCenter.y + this._chartsModel.offset.y;

        let geoTargetLat = this._geoRef.geoBounds[WT_NavigraphChart.BoundsIndex.TOP] - viewTargetY / this._geoRef.viewHeight * this._geoRef.geoAngularHeight;
        let geoTargetLong = this._geoRef.geoBounds[WT_NavigraphChart.BoundsIndex.LEFT] + viewTargetX / this._geoRef.viewWidth * this._geoRef.geoAngularWidth;

        this._mapModel.target = this._tempGeoPoint.set(geoTargetLat, geoTargetLong);
    }

    _updateRange() {
        let scaleFactor = this._chartsView.viewHeight / this._chartsView.chartReferenceDisplayHeight * this._chartsModel.scaleFactor;

        this._mapModel.range = this._tempGARad.set(this._geoRef.geoHeight).scale(scaleFactor, true);
    }

    update() {
        this._updateGeoRef();
        if (this._geoRef.isValid) {
            this._updateRotation();
            this._updateTarget();
            this._updateRange();
            this._mapModel.airplaneIcon.show = true;
        } else {
            this._mapModel.airplaneIcon.show = false;
        }
    }
}

WT_G3x5_ChartsDisplay.SCROLL_EVENT_KEY_PREFIX = "WT_Charts_Scroll";

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

        this._viewWidth = 0;
        this._viewHeight = 0;

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

        this._referenceDisplayWidth = 0;
        this._referenceDisplayHeight = 0;

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
     * @type {Number}
     */
    get viewWidth() {
        return this._viewWidth;
    }

    /**
     * @readonly
     * @type {Number}
     */
    get viewHeight() {
        return this._viewHeight;
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
     * @type {Number}
     */
    get chartReferenceDisplayWidth() {
        return this._referenceDisplayWidth;
    }

    /**
     * @readonly
     * @type {Number}
     */
    get chartReferenceDisplayHeight() {
        return this._referenceDisplayHeight;
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
    get chartTransformInverse() {
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
        let bbox = (usePlanView && chart.planview) ? chart.planview.bbox_local : chart.bbox_local;
        this._bounds[0] = bbox[WT_NavigraphChart.BoundsIndex.LEFT];
        this._bounds[1] = bbox[WT_NavigraphChart.BoundsIndex.TOP];
        this._bounds[2] = bbox[WT_NavigraphChart.BoundsIndex.RIGHT];
        this._bounds[3] = bbox[WT_NavigraphChart.BoundsIndex.BOTTOM];
    }

    _calculateReferenceScaleFactor(imgWidth, imgHeight) {
        let viewAspectRatio = this._viewWidth / this._viewHeight;
        let imgAspectRatio = imgWidth / imgHeight;

        if (imgAspectRatio > viewAspectRatio) {
            return this._viewWidth / imgWidth;
        } else {
            return this._viewHeight / imgHeight;
        }
    }

    _updateChartTransform() {
        let model = this._context.model;
        if (!model.chart) {
            return;
        }

        this._updateBoundsFromChart(model.chart, model.usePlanView);
        let imgWidth = this.chartBounds.right - this.chartBounds.left;
        let imgHeight = this.chartBounds.bottom - this.chartBounds.top;

        let scaleFactor = this._calculateReferenceScaleFactor(imgWidth, imgHeight);
        this._referenceDisplayWidth = imgWidth * scaleFactor;
        this._referenceDisplayHeight = imgHeight * scaleFactor;

        scaleFactor *= model.scaleFactor;

        let rotation = model.rotation * Avionics.Utils.DEG2RAD;

        WT_GTransform2.translation(-imgWidth / 2 - model.offset.x, -imgHeight / 2 - model.offset.y, this._transform)                // translate center to origin
            .concat(WT_GTransform2.scale(scaleFactor, this._tempTransform), true)                                                   // scale
            .concat(WT_GTransform2.rotation(rotation, this._tempTransform), true)                                                   // rotate
            .concat(WT_GTransform2.translation(this._viewWidth / 2, this._viewHeight / 2, this._tempTransform), true);              // translate center to view center (with offset)

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