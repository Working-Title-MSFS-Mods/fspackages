class WT_G3x5_ChartsView extends HTMLElement {
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
        return WT_G3x5_ChartsView.TEMPLATE;
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

    async _defineChildren() {
        this._wrapper = new WT_CachedElement(this.shadowRoot.querySelector(`#wrapper`));
        /**
         * @type {WT_G3x5_ChartHTMLElement}
         */
        this._chartHTMLElement = await WT_CustomElementSelector.select(this.shadowRoot, `#chart`, WT_G3x5_ChartHTMLElement);
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    setContext(context) {
        this._context = context;
    }

    _updateViewSize() {
        this._viewWidth = this.clientWidth;
        this._viewHeight = this.clientHeight;
    }

    _updateBanners() {
        let model = this._context.model;
        if (model.navigraphStatus === WT_G3x5_ChartsModel.NavigraphStatus.ACCESS_AVAILABLE) {
            if (model.chartID === "") {
                this._wrapper.setAttribute("status", "nocharts");
            } else {
                this._wrapper.setAttribute("status", "ok");
            }
        } else {
            this._wrapper.setAttribute("status", "datafail");
        }
    }

    _updateBoundsFromChart(chart, usePlanView) {
        let bbox = (usePlanView && chart.planview) ? chart.planview.bbox_local : chart.bbox_local;
        this._bounds[0] = bbox[WT_NavigraphChart.BoundsIndex.LEFT];
        this._bounds[1] = bbox[WT_NavigraphChart.BoundsIndex.TOP];
        this._bounds[2] = bbox[WT_NavigraphChart.BoundsIndex.RIGHT];
        this._bounds[3] = bbox[WT_NavigraphChart.BoundsIndex.BOTTOM];
    }

    _resetBounds() {
        this._bounds[0] = 0;
        this._bounds[1] = 0;
        this._bounds[2] = 0;
        this._bounds[3] = 0;
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
            this._resetBounds();
            return;
        }

        this._updateBoundsFromChart(model.chart, model.sectionMode === WT_G3x5_ChartsModel.SectionMode.PLAN);
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

    _updateChartHTMLElement() {
        let chart = this._context.model.chart;
        let url = this._context.model.useNightView ? this._context.model.chartNightViewURL : this._context.model.chartDayViewURL;
        this._chartHTMLElement.update(chart, url, this.chartBounds, this.chartTransform);
    }

    _doUpdate() {
        this._updateViewSize();
        this._updateBanners();
        this._updateChartTransform();
        this._updateChartHTMLElement();
    }

    update() {
        if (!this._isInit || !this._context) {
            return;
        }

        this._doUpdate();
    }
}
WT_G3x5_ChartsView.NAME = "wt-charts-view";
WT_G3x5_ChartsView.TEMPLATE = document.createElement("template");
WT_G3x5_ChartsView.TEMPLATE.innerHTML = `
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
            #map {
                position: absolute;
                left: 0%;
                height: 0%;
                width: 100%;
                height: 100%;
                transform: rotate(0deg);
            }
            .banner {
                display: none;
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                font-weight: bold;
                font-size: var(--charts-banner-font-size, 1.5em);
                color: white;
            }
            #wrapper[status="nocharts"] #nocharts {
                display: block;
            }
            #wrapper[status="datafail"] #datafail {
                display: block;
            }
    </style>
    <div id="wrapper">
        <div id="chartcontainer">
            <wt-charts-chart id="chart"></wt-charts-chart>
        </div>
        <slot name="map" id="map"></slot>
        <div id="nocharts" class="banner">No Available Charts</div>
        <div id="datafail" class="banner">Unable To Display Chart</div>
    </div>
`;

customElements.define(WT_G3x5_ChartsView.NAME, WT_G3x5_ChartsView);

class WT_G3x5_ChartHTMLElement extends HTMLElement {
    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._displayedChart = null;
        this._displayedURL = "";

        this._imgWidth = 0;
        this._imgHeight = 0;
        /**
         * @type {{left:Number, top:Number, right:Number, bottom:Number}}
         */
        this._imgBounds = {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,

            /**
             *
             * @param {{left:Number, top:Number, right:Number, bottom:Number}} bounds
             */
            copyFrom(bounds) {
                this.left = bounds.left;
                this.top = bounds.top;
                this.right = bounds.right;
                this.bottom = bounds.bottom;
            },

            /**
             *
             * @param {{left:Number, top:Number, right:Number, bottom:Number}} bounds
             * @returns {Boolean}
             */
            equals(bounds) {
                return this.left === bounds.left &&
                       this.top === bounds.top &&
                       this.right === bounds.right &&
                       this.bottom === bounds.bottom;
            }
        };
        this._imgTransform = "";

        this._isImgLoading = false;
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_ChartHTMLElement.TEMPLATE;
    }

    /**
     * @readonly
     * @type {WT_NavigraphChartDefinition}
     */
    get displayedChart() {
        return this._displayedChart;
    }

    _defineChildren() {
        this._container = this.shadowRoot.querySelector(`#container`);
        this._img = this.shadowRoot.querySelector(`img`);
        this._img.onload = this._onImgSrcLoaded.bind(this);
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
    }

    _updateImageSize() {
        let imgWidth = this._imgBounds.right - this._imgBounds.left;
        let imgHeight = this._imgBounds.bottom - this._imgBounds.top;

        this._container.style.width = `${imgWidth}px`;
        this._container.style.height = `${imgHeight}px`;

        this._img.style.left = `${-this._imgBounds.left}px`;
        this._img.style.top = `${-this._imgBounds.top}px`;
        //this._img.style.width = `${imgWidth}px`;
        //this._img.style.height = `${imgHeight}px`;
    }

    _onImgSrcLoaded() {
        this._isImgLoading = false;
        this._img.style.display = "block";
    }

    _setChart(chart, url, bounds) {
        if (url === this._displayedURL && this._imgBounds.equals(bounds)) {
            return;
        }

        this._imgBounds.copyFrom(bounds);
        this._updateImageSize();

        if (url !== this._displayedURL) {
            this._img.style.display = "none";
            this._img.src = url;

            this._displayedChart = chart;
            this._displayedURL = url;
            this._isImgLoading = true;
        }
    }

    /**
     *
     * @param {WT_GTransform2ReadOnly} transform
     */
    _updateTransform(transform) {
        let transformString = `matrix(${transform.element(0, 0)}, ${transform.element(1, 0)}, ${transform.element(0, 1)}, ${transform.element(1, 1)}, ${transform.element(0, 2).toFixed(1)}, ${transform.element(1, 2).toFixed(1)})`;
        if (transformString !== this._imgTransform) {
            this._container.style.transform = transformString;
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
        if (!this._isInit) {
            return;
        }

        this._setChart(chart, url, bounds);
        if (!this._displayedChart || this._isImgLoading) {
            return;
        }

        this._updateTransform(transform);
    }
}
WT_G3x5_ChartHTMLElement.NAME = "wt-charts-chart";
WT_G3x5_ChartHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_ChartHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            width: 100%;
            height: 100%;
        }

        #container {
            position: absolute;
            top: 0%;
            left: 0%;
            transform-origin: top left;
            overflow: hidden;
        }
            img {
                position: absolute;
            }
    </style>
    <div id="container">
        <img />
    </div>
`;

customElements.define(WT_G3x5_ChartHTMLElement.NAME, WT_G3x5_ChartHTMLElement);