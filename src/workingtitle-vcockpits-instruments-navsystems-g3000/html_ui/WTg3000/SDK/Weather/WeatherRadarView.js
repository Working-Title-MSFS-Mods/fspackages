class WT_WeatherRadarView extends HTMLElement {
    constructor() {
        super();

        this._model = null;

        this._bingMap = document.createElement("bing-map");
        this._bingMap.style.position = "absolute";
        this._bingMap.addConfig(this._initBingConfig());
        this._bingMap.setConfig(1);
        this._bingMap.setMode(EBingMode.PLANE);
        this._bingMap.setReference(EBingReference.SEA);
        this._bingMap.setVisible(true);
        this._setScanMode();

        this._overlay = document.createElementNS(Avionics.SVG.NS, "svg");
        this._overlay.style.position = "absolute";
        this._boundaryLines = document.createElementNS(Avionics.SVG.NS, "path");
        this._boundaryLines.classList.add(WT_WeatherRadarView.BOUNDARY_CLASS);
        this._boundaryLines.setAttribute("fill-opacity", "0");
        this._boundaryLines.setAttribute("stroke", "white");
        this._boundaryLines.setAttribute("stroke-width", "2");
        this._boundaryLines.setAttribute("stroke-opacity", "1");

        this._rangeLines = document.createElementNS(Avionics.SVG.NS, "path");
        this._rangeLines.classList.add(WT_WeatherRadarView.RANGE_MARKER_CLASS);
        this._rangeLines.setAttribute("fill-opacity", "0");
        this._rangeLines.setAttribute("stroke", "white");
        this._rangeLines.setAttribute("stroke-width", "5");
        this._rangeLines.setAttribute("stroke-dasharray", "2 12");
        this._rangeLines.setAttribute("stroke-opacity", "1");

        this._bearingLine = document.createElementNS(Avionics.SVG.NS, "path");
        this._bearingLine.classList.add(WT_WeatherRadarView.BEARING_LINE_CLASS);
        this._bearingLine.setAttribute("fill-opacity", "1");
        this._bearingLine.setAttribute("fill", "cyan");
        this._bearingLine.setAttribute("stroke-opacity", "0");
        this._bearingLine.setAttribute("display", "inherit");

        this._overlay.appendChild(this._bearingLine);
        this._overlay.appendChild(this._rangeLines);
        this._overlay.appendChild(this._boundaryLines);

        this._rangeLabels = [
            new WT_WeatherRadarViewRangeLabel(),
            new WT_WeatherRadarViewRangeLabel(),
            new WT_WeatherRadarViewRangeLabel(),
            new WT_WeatherRadarViewRangeLabel()
        ];

        this._viewWidth = 0;
        this._viewHeight = 0;

        this._tempNM = new WT_NumberUnit(0, WT_Unit.NMILE);
        this._tempVector1 = new WT_GVector2(0, 0);
        this._tempVector2 = new WT_GVector2(0, 0);
        this._tempVector3 = new WT_GVector2(0, 0);
        this._tempVector4 = new WT_GVector2(0, 0);
        this._tempGeoPoint = new WT_GeoPoint(0, 0);
        this._tempTransform = new WT_GTransform2();
    }

    _initBingConfig() {
        let config = new BingMapsConfig();
        config.aspectRatio = 1;
        config.resolution = 1024;
        config.clearColor = "#000000";
        config.heightColors = new Array(60).fill(0);
        return config;
    }

    static get observedAttributes() {
        return ["showlabels"];
    }

    /**
     * @readonly
     * @property {Number} viewWidth - the width, in pixels, of the viewing window.
     * @type {Number}
     */
    get viewWidth() {
        return this._viewWidth;
    }

    /**
     * @readonly
     * @property {Number} viewHeight - the height, in pixels, of the viewing window.
     * @type {Number}
     */
    get viewHeight() {
        return this._viewHeight;
    }

    /**
     * @readonly
     * @property {WT_WeatherRadarModel} model - the model associated with this view.
     * @type {WT_WeatherRadarModel}
     */
    get model() {
        return this._model;
    }

    get showLabels() {
        return this._showLabels;
    }

    set showLabels(value) {
        this.setAttribute("showlabels", value);
    }

    connectedCallback() {
        this.style.backgroundColor = "black";
        this.showLabels = "true";
        this.appendChild(this._bingMap);
        this.appendChild(this._overlay);
        for (let rangeLabel of this._rangeLabels) {
            this.appendChild(rangeLabel);
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "showlabels") {
            this._showLabels = newValue === "true";
            this._showRangeLabels(this._showLabels);
        }
    }

    setBingMapID(id) {
        this._bingMap.setBingId(id);
    }

    setModel(model) {
        this._model = model;
    }

    _showRangeLabels(value) {
        for (let rangeLabel of this._rangeLabels) {
            rangeLabel.style.display = value ? "block" : "none";
        }
    }

    _setScanMode() {
        this._bingMap.showWeather(EWeatherRadar.HORIZONTAL, Math.PI / 2);
    }

    _resizeOverlay() {
        let viewWidth = this.viewWidth;
        let viewHeight = this.viewHeight;

        this._overlay.style.width = `${viewWidth}px`;
        this._overlay.style.height = `${viewHeight}px`;
        this._overlay.style.left = "0";
        this._overlay.style.top = "0";
        this._overlay.setAttribute("viewBox", `0 0 ${viewWidth} ${viewHeight}`);
    }

    _drawBearingLine(origin, targetHeight, facing) {
        let angularWidth = WT_WeatherRadarView.BEARING_LINE_ANGULAR_WIDTH * Avionics.Utils.DEG2RAD;

        let rotation = WT_GTransform2.rotation(angularWidth, origin, this._tempTransform);

        let leftAngle = facing - angularWidth / 2;

        let left = this._tempVector2.setFromPolar(targetHeight, leftAngle).add(origin);
        let right = rotation.apply(this._tempVector3.set(left), true);

        let path = `M ${left.x} ${left.y} L ${origin.x} ${origin.y} L ${right.x} ${right.y} Z`;
        this._bearingLine.setAttribute("d", path);
    }

    _drawBoundaryLines(origin, left, rotation) {
        let right = rotation.apply(this._tempVector3.set(left), true);

        let boundaryPath = `M ${left.x} ${left.y} L ${origin.x} ${origin.y} L ${right.x} ${right.y}`;
        this._boundaryLines.setAttribute("d", boundaryPath);
    }

    _drawRangeLines(origin, targetHeight, leftAngle, rightAngle, rotation) {
        let rangeLabelOffset = this._tempVector4.setFromPolar(10, rightAngle + Math.PI / 2);

        // set anchor point for range labels based on quadrant they appear in
        let labelXProperty = Math.cos(rightAngle) >= 0 ? "left" : "right";
        let labelYProperty = Math.sin(rightAngle) >= 0 ? "top" : "bottom";

        let rangePath = "";
        for (let i = 4; i > 0; i--) {
            let radius = targetHeight * i / 4;
            let left = this._tempVector2.setFromPolar(radius, leftAngle).add(origin);
            let right = rotation.apply(this._tempVector3.set(left), true);
            rangePath += `M ${left.x} ${left.y} A ${radius} ${radius} 0 0 1 ${right.x} ${right.y} `;

            let rangeLabelPosition = right.add(rangeLabelOffset);
            this._rangeLabels[i - 1].style[labelXProperty] = `${rangeLabelPosition.x}px`;
            this._rangeLabels[i - 1].style[labelYProperty] = `${rangeLabelPosition.y}px`;
            this._rangeLabels[i - 1].setRange(this._tempNM.set(this.model.range).scale(i / 4));
        }
        this._rangeLines.setAttribute("d", rangePath);
    }

    _redrawOverlay(origin, targetHeight, facing, angularWidth) {
        facing *= Avionics.Utils.DEG2RAD;
        angularWidth *= Avionics.Utils.DEG2RAD;

        this._drawBearingLine(origin, targetHeight, facing);

        let leftAngle = facing - angularWidth / 2;
        let rightAngle = leftAngle + angularWidth;

        let rotation = WT_GTransform2.rotation(angularWidth, origin, this._tempTransform);

        let left = this._tempVector2.setFromPolar(targetHeight, leftAngle).add(origin);

        this._drawBoundaryLines(origin, left, rotation);
        this._drawRangeLines(origin, targetHeight, leftAngle, rightAngle, rotation);
    }

    _redrawHorizontal() {
        let viewWidth = this.viewWidth;
        let viewHeight = this.viewHeight;

        let targetHeight = Math.min(viewHeight - 2 * WT_WeatherRadarView.EDGE_PADDING, (viewWidth - 2 * WT_WeatherRadarView.EDGE_PADDING) * (2 / 3) / 1.41421356237);
        let bingMapSize = targetHeight * 2;
        let origin = this._tempVector1.set(viewWidth / 2, viewHeight - WT_WeatherRadarView.EDGE_PADDING);

        this._bingMap.style.width = `${bingMapSize}px`;
        this._bingMap.style.height = `${bingMapSize}px`;
        this._bingMap.style.left = `${origin.x - targetHeight}px`;
        this._bingMap.style.top = `${origin.y - targetHeight}px`;


        this._redrawOverlay(origin, targetHeight, 0, WT_WeatherRadarView.HORIZONTAL_ANGULAR_WIDTH);
    }

    _redraw() {
        if (this.model.scanMode === WT_WeatherRadarModel.ScanMode.HORIZONTAL) {
            this._redrawHorizontal();
        }
    }

    _updateWeatherVisibility() {
        if (this.model.display === WT_WeatherRadarModel.Display.OFF && this._bingMap.style.display !== "none") {
            this._bingMap.style.display = "none";
        } else if (this.model.display === WT_WeatherRadarModel.Display.WEATHER && this._bingMap.style.display !== "block") {
            this._bingMap.style.display = "block";
        }
    }

    _updateCenterAndRange() {
        let range = this.model.range.asUnit(WT_Unit.METER);
        let target = this.model.airplane.position(this._tempGeoPoint);
        if (isNaN(range) || !target) {
            return;
        }

        let params = {
            lla: new LatLong(target.lat, target.long),
            radius: range
        };
        this._bingMap.setParams(params);
    }

    _updateRangeLabels() {
        for (let i = 0; i < this._rangeLabels.length; i++) {
            this._rangeLabels[i].setRange(this._tempNM.set(this.model.range).scale((i + 1) / 4, true));
        }
    }

    _updateBearingLineVisibility() {
        if (!this.model.showBearingLine && this._bearingLine.getAttribute("display") !== "none") {
            this._bearingLine.setAttribute("display", "none");
        } else if (this.model.showBearingLine && this._bearingLine.getAttribute("display") !== "inherit") {
            this._bearingLine.setAttribute("display", "inherit");
        }
    }

    update() {
        if (!this.model) {
            return;
        }

        let viewWidth = this.clientWidth;
        let viewHeight = this.clientHeight;
        if (viewWidth * viewHeight === 0) {
            return;
        }

        if (viewWidth != this._viewWidth || viewHeight != this._viewHeight) {
            this._viewWidth = viewWidth;
            this._viewHeight = viewHeight;
            this._resizeOverlay();
            this._redraw();
        }

        this._updateWeatherVisibility();
        this._updateCenterAndRange();
        this._updateRangeLabels();
        this._updateBearingLineVisibility();
    }
}
WT_WeatherRadarView.BOUNDARY_CLASS = "weatherRadarBoundary";
WT_WeatherRadarView.RANGE_MARKER_CLASS = "weatherRadarRangeMarker";
WT_WeatherRadarView.BEARING_LINE_CLASS = "weatherRadarBearingLine";
WT_WeatherRadarView.RANGE_LABEL_CLASS = "weatherRadarRangeLabel";
WT_WeatherRadarView.EDGE_PADDING = 10; // pixels
WT_WeatherRadarView.BEARING_LINE_ANGULAR_WIDTH = 1;
WT_WeatherRadarView.HORIZONTAL_ANGULAR_WIDTH = 90;
WT_WeatherRadarView.VERTICAL_ANGULAR_WIDTH = 60;

customElements.define("weatherradar-view", WT_WeatherRadarView);

class WT_WeatherRadarViewRangeLabel extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_WeatherRadarViewRangeLabel.TEMPLATE.content.cloneNode(true));

        let formatterOpts = {
            precision: 0.01,
            forceDecimalZeroes: false,
            maxDigits: 3,
            unitCaps: true
        };
        let htmlFormatterOpts = {
            numberUnitDelim: "",
            classGetter: {
                getNumberClassList() {
                    return ["rangeNumber"];
                },
                getUnitClassList() {
                    return ["rangeUnit"];
                }
            }
        };
        this._formatter = new WT_NumberHTMLFormatter(new WT_NumberFormatter(formatterOpts), htmlFormatterOpts);
    }

    connectedCallback() {
        this._rangeElement = this.shadowRoot.querySelector(`#range`);
    }

    setRange(range) {
        let unit;
        unit = WT_Unit.NMILE;
        this._rangeElement.innerHTML = this._formatter.getFormattedHTML(range, unit);
    }
}
WT_WeatherRadarViewRangeLabel.TEMPLATE = document.createElement("template");
WT_WeatherRadarViewRangeLabel.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: absolute;
            background-color: black;
            border: solid 1px white;
            border-radius: 0.5em;
            text-align: center;
            font-size: 2vh;
            color: #67e8ef;
        }
            div {
                margin: 0.25em 0.5em;
            }
            .rangeUnit {
                font-size: 0.75em;
            }
    </style>
    <div id="range"></div>
`;

customElements.define("weatherradar-view-rangelabel", WT_WeatherRadarViewRangeLabel);

class WT_WeatherRadarViewScale extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_WeatherRadarViewScale.TEMPLATE.content.cloneNode(true));
    }

    /**
     * @readonly
     * @property {WT_WeatherRadarModel} model - the model associated with this view.
     * @type {WT_WeatherRadarModel}
     */
    get model() {
        return this._model;
    }

    setModel(model) {
        this._model = model;
    }
}
WT_WeatherRadarViewScale.TEMPLATE = document.createElement("template");
WT_WeatherRadarViewScale.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: absolute;
            background-color: black;
            border: solid 1px white;
            border-radius: 1em;
            font-size: 2.5vh;
            color: white;
        }

            #wrapper {
                position: relative;
                height: 100%;
                width: 100%;
                display: grid;
                grid-template-columns: auto;
                grid-template-rows: 1.5em 1fr;
                font-weight: bold;
            }
                #title {
                    margin: 0 10%;
                    border-bottom: 1px solid white;
                    text-align: var(--radar-scale-title-text-align, left);
                }
                #grid {
                    position: relative;
                    margin: 25% 5% 5% 15%;
                    display: grid;
                    width: 80%;
                    height: 70%;
                    grid-template-columns: 1fr 4fr;
                    grid-template-rows: repeat(4, 1fr);
                    grid-template-areas:
                        "heavy heavyLabel"
                        "medium ."
                        "light lightLabel"
                        "black ."
                }
                    #heavy {
                        grid-area: heavy;
                        background-color: var(--radar-scale-heavy-color, red);
                    }
                    #medium {
                        grid-area: medium;
                        background-color: var(--radar-scale-medium-color, #cb7300);
                    }
                    #light {
                        grid-area: light;
                        background-color: var(--radar-scale-light-color, #004c00);
                    }
                    #black {
                        grid-area: black;
                        background-color: black;
                    }
                    .bar {
                        border: 0.15em ridge gray;
                    }

                    #heavyLabel {
                        grid-area: heavyLabel;
                    }
                    #lightLabel {
                        grid-area: lightLabel;
                    }
                    .label {
                        position: absolute;
                        width: 100%;
                        top: 50%;
                        transform: translateY(-50%);
                        text-align: center;
                    }

    </style>
    <div id="wrapper">
        <div id="title">Scale</div>
        <div id="scale">
            <div id="grid">
                <div id="heavy" class="bar"></div>
                <div id="medium" class="bar"></div>
                <div id="light" class="bar"></div>
                <div id="black" class="bar"></div>
                <div id="heavyLabel" class="label">Heavy</div>
                <div id="lightLabel" class="label">Light</div>
            </div>
        </div>
    </div>
`;

customElements.define("weatherradar-view-scale", WT_WeatherRadarViewScale);

class WT_WeatherRadarViewSettingsDisplay extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_WeatherRadarViewSettingsDisplay.TEMPLATE.content.cloneNode(true));
    }

    /**
     * @readonly
     * @property {WT_WeatherRadarModel} model - the model associated with this view.
     * @type {WT_WeatherRadarModel}
     */
    get model() {
        return this._model;
    }

    connectedCallback() {
        this._tiltValue = this.shadowRoot.querySelector(`#tiltValue`);
        this._bearingValue = this.shadowRoot.querySelector(`#bearingValue`);
        this._gainValue = this.shadowRoot.querySelector(`#gainValue`);
    }

    setModel(model) {
        this._model = model;
    }

    _updateTilt() {
        let tilt = this.model.tilt;
        this._tiltValue.innerHTML = `${tilt >= 0 ? "UP" : "DOWN"} ${Math.abs(tilt).toFixed(2)}°`;
    }

    _updateBearing() {
        let bearing = this.model.bearing;
        this._bearingValue.innerHTML = `${bearing <= 0 ? "L" : "R"} ${Math.abs(bearing).toFixed(0)}°`;
    }

    _updateGain() {
        let gain = this.model.gain;
        let text;
        if (gain < 0) {
            text = "Calibrated";
        } else {
            text = gain.toFixed(1);
        }
        this._gainValue.innerHTML = text;
    }

    update() {
        if (!this.model) {
            return;
        }

        this._updateTilt();
        this._updateBearing();
        this._updateGain();
    }
}
WT_WeatherRadarViewSettingsDisplay.TEMPLATE = document.createElement("template");
WT_WeatherRadarViewSettingsDisplay.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: absolute;
            background-color: black;
            border: solid 1px white;
            border-radius: 1em;
            font-size: 2.5vh;
            line-height: 1em;
        }

            #wrapper {
                position: relative;
                margin: 10% 5%;
                display: grid;
                width: 90%;
                height: 80%;
                grid-template-columns: auto;
                grid-template-rows: repeat(3, 1fr);
            }
                .row {
                    display: flex;
                    flex-flow: row nowrap;
                    justify-content: space-between;
                    align-items: baseline;
                }
                    .title {
                        display: inline-block;
                        font-size: 0.75em;
                        line-height: 1.33em;
                        color: var(--radar-settings-title-color, white);
                        text-align: left;
                    }
                    .value {
                        display: inline-block;
                        color: var(--radar-settings-title-color, #67e8ef);
                        text-align: right;
                    }

    </style>
    <div id="wrapper">
        <div class="row">
            <span class="title">Tilt</span><span id="tiltValue" class="value"></span>
        </div>
        <div class="row">
            <span class="title">BRG</span><span id="bearingValue" class="value"></span>
        </div>
        <div class="row">
            <span class="title">Gain</span><span id="gainValue" class="value"></span>
        </div>
    </div>
`;

customElements.define("weatherradar-view-settings", WT_WeatherRadarViewSettingsDisplay);