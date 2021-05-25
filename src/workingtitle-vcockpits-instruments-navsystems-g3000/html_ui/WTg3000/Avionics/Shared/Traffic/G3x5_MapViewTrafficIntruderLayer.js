class WT_G3x5_MapViewTrafficIntruderLayer extends WT_MapViewMultiLayer {
    constructor(useOuterRangeMaxScale, className = WT_G3x5_MapViewTrafficIntruderLayer.CLASS_DEFAULT, configName = WT_G3x5_MapViewTrafficIntruderLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._useOuterRangeMaxScale = useOuterRangeMaxScale;

        this._motionVectorLayer = new WT_MapViewCanvas(false, true);
        this._iconLayer = new WT_MapViewSubLayer(true);
        this.addSubLayer(this._motionVectorLayer);
        this.addSubLayer(this._iconLayer);

        if (!useOuterRangeMaxScale) {
            this._offScaleLayer = new WT_MapViewSubLayer(true);
            this.addSubLayer(this._offScaleLayer);
            this._offScaleHTMLElement = this._createOffScaleHTMLElement();
            this._offScaleLayer.container.appendChild(this._offScaleHTMLElement);
        }

        /**
         * @type {WT_HTMLElementRecycler<WT_G3x5_MapViewTrafficIntruderHTMLElement>}
         */
        this._intruderViewHTMLElementRecycler = this._createIntruderViewHTMLElementRecycler();

        /**
         * @type {Map<WT_G3x5_TrafficSystemIntruderEntry,WT_G3x5_MapViewTrafficIntruderView>}
         */
        this._intruderViews = new Map();
        /**
         * @type {Set<WT_G3x5_MapViewTrafficIntruderView>}
         */
        this._intruderViewsToRemove = new Set();

        this._optsManager = new WT_OptionsManager(this, WT_G3x5_MapViewTrafficIntruderLayer.OPTIONS_DEF);
    }

    _createOffScaleHTMLElement() {
    }

    _createIntruderViewHTMLElementRecycler() {
    }

    /**
     * @param {WT_MapViewState} state
     */
    isVisible(state) {
        return state.model.traffic.show;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onConfigLoaded(state) {
        for (let property of WT_G3x5_MapViewTrafficIntruderLayer.CONFIG_PROPERTIES) {
            this._setPropertyFromConfig(property);
        }
    }

    /**
     * @param {WT_MapViewState} state
     * @returns {Boolean}
     */
    _getShowSymbol(state) {
        let range = state.model.traffic.symbolRange;
        if (range === undefined) {
            return true;
        } else {
            return range.compare(state.model.range) >= 0;
        }
    }

    /**
     * @param {WT_MapViewState} state
     * @returns {Boolean}
     */
    _getShowLabel(state) {
        let show = state.model.traffic.labelShow;
        let range = state.model.traffic.labelRange;
        if (show === undefined || range === undefined) {
            return true;
        } else {
            return show && range.compare(state.model.range) >= 0;
        }
    }

    /**
     *
     * @param {CanvasRenderingContext2D} context
     * @param {Number} lineWidth
     * @param {String|CanvasGradient|CanvasPattern} strokeStyle
     */
    _applyStroke(context, lineWidth, strokeStyle) {
        context.lineWidth = lineWidth;
        context.strokeStyle = strokeStyle;
        context.stroke();
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {Number} strokeWidth
     * @param {String} strokeColor
     * @param {Number} outlineWidth
     * @param {String} outlineColor
     */
    _strokeMotionVectorsWithStyle(state, strokeWidth, strokeColor, outlineWidth, outlineColor) {
        if (this.relativeVectorOutlineWidth > 0) {
            this._applyStroke(this._motionVectorLayer.display.context, (strokeWidth + 2 * outlineWidth) * state.dpiScale, outlineColor);
        }
        this._applyStroke(this._motionVectorLayer.display.context, strokeWidth * state.dpiScale, strokeColor);
    }

    /**
     *
     * @param {WT_MapViewState} state
     */
    _strokeMotionVectors(state) {
        if (state.model.traffic.motionVectorMode === WT_G3x5_MapModelTrafficModule.MotionVectorMode.OFF) {
            return;
        }

        if (state.model.traffic.motionVectorMode === WT_G3x5_MapModelTrafficModule.MotionVectorMode.ABSOLUTE) {
            this._strokeMotionVectorsWithStyle(state, this.absoluteVectorStrokeWidth, this.absoluteVectorStrokeColor, this.absoluteVectorOutlineWidth, this.absoluteVectorOutlineColor);
        } else {
            this._strokeMotionVectorsWithStyle(state, this.relativeVectorStrokeWidth, this.relativeVectorStrokeColor, this.relativeVectorOutlineWidth, this.relativeVectorOutlineColor);
        }
    }

    /**
     *
     * @param {WT_G3x5_TrafficSystemIntruderEntry} intruderEntry
     * @returns {WT_G3x5_MapViewTrafficIntruderView}
     */
    _createIntruderView(intruderEntry) {
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_G3x5_MapViewTrafficIntruderView} view
     * @param {Boolean} showSymbol
     * @param {Boolean} showLabel
     */
    _updateIntruderView(state, view, showSymbol, showLabel) {
        view.update(state, this.iconSize, this.fontSize, this._motionVectorLayer, this._useOuterRangeMaxScale, showSymbol, showLabel);
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {Boolean} showSymbol
     * @param {Boolean} showLabel
     * @param {WT_G3x5_TrafficSystemIntruderEntry} entry
     */
    _updateIntruderEntry(state, showSymbol, showLabel, intruderEntry) {
        let view = this._intruderViews.get(intruderEntry);
        if (!view) {
            view = this._createIntruderView(intruderEntry);
            this._intruderViews.set(intruderEntry, view);
        } else {
            this._intruderViewsToRemove.delete(view);
        }
        this._updateIntruderView(state, view, showSymbol, showLabel);
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateIntruders(state) {
        let showSymbol = this._getShowSymbol(state);
        let showLabel = this._getShowLabel(state);

        this._motionVectorLayer.display.clear();
        this._motionVectorLayer.display.context.beginPath();

        this._intruderViews.forEach(value => this._intruderViewsToRemove.add(value), this);
        /**
         * @type {WT_ReadOnlyArray<WT_G3x5_TrafficSystemIntruderEntry>}
         */
        let intruderEntries = state.model.traffic.trafficSystem.intruders;
        intruderEntries.forEach(this._updateIntruderEntry.bind(this, state, showSymbol, showLabel));

        this._strokeMotionVectors(state);

        this._intruderViewsToRemove.forEach(view => {
            view.destroy();
            this._intruderViews.delete(view.intruderEntry);
        });
        this._intruderViewsToRemove.clear();
    }

    _updateOffScale(state) {
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        super.onUpdate(state);

        this._updateIntruders(state);
        if (this._offScaleHTMLElement) {
            this._updateOffScale(state);
        }
    }
}
WT_G3x5_MapViewTrafficIntruderLayer.CLASS_DEFAULT = "trafficIntruderLayer";
WT_G3x5_MapViewTrafficIntruderLayer.CONFIG_NAME_DEFAULT = "trafficIntruder";
WT_G3x5_MapViewTrafficIntruderLayer.OPTIONS_DEF = {
    iconSize: {default: 40, auto: true},
    fontSize: {default: 25, auto: true},
    absoluteVectorStrokeWidth: {default: 2, auto: true},
    absoluteVectorStrokeColor: {default: "white", auto: true},
    absoluteVectorOutlineWidth: {default: 0, auto: true},
    absoluteVectorOutlineColor: {default: "black", auto: true},
    relativeVectorStrokeWidth: {default: 2, auto: true},
    relativeVectorStrokeColor: {default: "#4ecc3d", auto: true},
    relativeVectorOutlineWidth: {default: 0, auto: true},
    relativeVectorOutlineColor: {default: "black", auto: true}
};
WT_G3x5_MapViewTrafficIntruderLayer.CONFIG_PROPERTIES = [
    "iconSize",
    "fontSize",
    "absoluteVectorStrokeWidth",
    "absoluteVectorStrokeColor",
    "absoluteVectorOutlineWidth",
    "absoluteVectorOutlineColor",
    "relativeVectorStrokeWidth",
    "relativeVectorStrokeColor",
    "relativeVectorOutlineWidth",
    "relativeVectorOutlineColor"
];

class WT_G3x5_MapViewTrafficIntruderView {
    /**
     * @param {WT_G3x5_TrafficSystemIntruderEntry} intruderEntry
     * @param {WT_HTMLElementRecycler<WT_G3x5_MapViewTrafficIntruderHTMLElement>} htmlElementRecycler
     */
    constructor(intruderEntry, htmlElementRecycler) {
        this._intruderEntry = intruderEntry;
        this._htmlElementRecycler = htmlElementRecycler;
        this._htmlElement = htmlElementRecycler.request();
        this._htmlElement.setIntruderView(this);

        this._viewPosition = new WT_GVector2(0, 0);
        this._isOffScale = false;
        this._isVisible = false;

        this._tempVector2_1 = new WT_GVector2(0, 0);
        this._tempVector2_2 = new WT_GVector2(0, 0);
        this._tempGeoPoint = new WT_GeoPoint(0, 0);
    }

    /**
     * @readonly
     * @type {WT_G3x5_TrafficSystemIntruderEntry}
     */
    get intruderEntry() {
        return this._intruderEntry;
    }

    /**
     * @readonly
     * @type {WT_G3x5_MapViewTrafficIntruderHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get isOffScale() {
        return this._isOffScale;
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get isVisible() {
        return this._isVisible;
    }

    /**
     * @readonly
     * @type {WT_GVector2ReadOnly}
     */
    get viewPosition() {
        return this._viewPosition.readonly();
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_GeoPoint} ownAirplanePos
     * @param {WT_GeoPoint} intruderPos
     */
    _handleOffScaleMapView(state, ownAirplanePos, intruderPos) {
        state.projection.project(intruderPos, this._viewPosition);
        if (state.projection.isInView(this.viewPosition)) {
            this._isOffScale = false;
        } else {
            this._isOffScale = true;
        }
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_GeoPoint} ownAirplanePos
     * @param {WT_GeoPoint} intruderPos
     */
    _handleOffScaleOuterRange(state, ownAirplanePos, intruderPos) {
        let horizontalSeparation = intruderPos.distance(ownAirplanePos);
        if (horizontalSeparation > state.model.traffic.outerRange.asUnit(WT_Unit.GA_RADIAN)) {
            this._isOffScale = true;
            state.projection.project(ownAirplanePos.offset(ownAirplanePos.bearingTo(intruderPos), state.model.traffic.outerRange.asUnit(WT_Unit.GA_RADIAN), true), this._viewPosition);
        } else {
            this._isOffScale = false;
            state.projection.project(intruderPos, this._viewPosition);
        }
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {Boolean} useOuterRangeMaxScale
     */
    _updatePosition(state, useOuterRangeMaxScale) {
        let intruderPos = this.intruderEntry.intruder.position;
        let ownAirplanePos = state.model.airplane.navigation.position(this._tempGeoPoint);
        if (useOuterRangeMaxScale) {
            this._handleOffScaleOuterRange(state, ownAirplanePos, intruderPos);
        } else {
            this._handleOffScaleMapView(state, ownAirplanePos, intruderPos);
        }
    }

    _updateVisibility(state, useOuterRangeMaxScale, showSymbol) {
    }

    _updateHTMLElement(state, iconSize, fontSize, showLabel) {
        this.htmlElement.setIconSize(iconSize * state.dpiScale);
        this.htmlElement.setFontSize(fontSize * state.dpiScale);
        this.htmlElement.update(state, this.isVisible, showLabel);
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_MapViewCanvas} motionVectorLayer
     * @param {WT_GVector2} vector
     */
    _drawMotionVector(state, motionVectorLayer, vector) {
        let distance = vector.length * state.model.traffic.motionVectorLookahead.asUnit(WT_Unit.SECOND);
        let distanceView = distance / state.projection.viewResolution.asUnit(WT_Unit.METER);
        let track = vector.theta;
        let angle = track + state.projection.rotation * Avionics.Utils.DEG2RAD;
        let start = this.viewPosition;
        let end = this._tempVector2_2.setFromPolar(distanceView, angle).add(start);
        motionVectorLayer.display.context.moveTo(start.x, start.y);
        motionVectorLayer.display.context.lineTo(end.x, end.y);
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_MapViewCanvas} motionVectorLayer
     */
    _updateMotionVector(state, motionVectorLayer) {
        if (state.model.traffic.motionVectorMode === WT_G3x5_MapModelTrafficModule.MotionVectorMode.OFF || !this.isVisible) {
            return;
        }

        let vector;
        if (state.model.traffic.motionVectorMode === WT_G3x5_MapModelTrafficModule.MotionVectorMode.ABSOLUTE) {
            vector = this._tempVector2_1.set(this.intruderEntry.intruder.velocityVector);
        } else {
            vector = this._tempVector2_1.set(this.intruderEntry.intruder.relativeVelocityVector);
        }
        this._drawMotionVector(state, motionVectorLayer, vector);
    }

    update(state, iconSize, fontSize, motionVectorLayer, useOuterRangeMaxScale, showSymbol, showLabel) {
        this._updatePosition(state, useOuterRangeMaxScale);
        this._updateVisibility(state, useOuterRangeMaxScale, showSymbol);
        this._updateHTMLElement(state, iconSize, fontSize, showLabel);
        this._updateMotionVector(state, motionVectorLayer);
    }

    destroy() {
        this._htmlElementRecycler.recycle(this.htmlElement);
    }
}

class WT_G3x5_MapViewTrafficIntruderHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._intruderView = null;
        this._size = null;
        this._iconSize = null;
        this._fontSize = null;
        this._isInit = false;

        this._position = new WT_GVector2(0, 0);

        this._tempVector2 = new WT_GVector2(0, 0);
    }

    _getTemplate() {
    }

    /**
     * @readonly
     * @type {WT_G3x5_MapViewTrafficIntruderView}
     */
    get intruderView() {
        return this._intruderView;
    }

    _defineChildren() {
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
    }

    setIntruderView(intruderView) {
        this._intruderView = intruderView;
    }

    _computeSize(iconSize) {
    }

    _setSize(iconSize) {
        let size = this._computeSize(iconSize);

        this.style.position = "absolute";
        this.style.width = `${size}px`;
        this.style.height = `${size}px`;
        this.style.left = `${-size / 2}px`;
        this.style.top = `${-size / 2}px`;
        this._size = size;
    }

    setIconSize(size) {
        if (size === this._iconSize) {
            return;
        }

        this._setSize(size);
        this._iconSize = size;
    }

    setFontSize(size) {
        if (size === this._fontSize) {
            return;
        }

        this.style.fontSize = `${size}px`;
        this._fontSize = size;
    }

    _updateVisibility(state, isVisible) {
    }

    _updatePosition(state) {
        if (this._position.equals(this.intruderView.viewPosition)) {
            return;
        }

        this._position.set(this.intruderView.viewPosition);
        this.style.transform = `translate(${this._position.x}px, ${this._position.y}px)`;
    }

    _setAlertLevel(state, level) {
    }

    _updateAlertLevel(state) {
        this._setAlertLevel(state, this.intruderView.intruderEntry.alertLevel);
    }

    _setOffScale(state, value) {
    }

    _updateOffScale(state) {
        this._setOffScale(state, this.intruderView.isOffScale);
    }

    _setGroundTrack(state, track) {
    }

    _updateGroundTrack(state) {
        let horizVector = this._tempVector2.set(this.intruderView.intruderEntry.intruder.velocityVector);
        let groundTrack = horizVector.theta * Avionics.Utils.RAD2DEG;
        this._setGroundTrack(state, groundTrack);
    }

    _setAltitudeDisplay(state, isRelative, feet, isAbove) {
    }

    _updateAltitude(state) {
        let altitudeDeltaFeet = WT_Unit.METER.convert(this.intruderView.intruderEntry.intruder.positionVector.z, WT_Unit.FOOT);
        if (state.model.traffic.altitudeMode === WT_G3x5_MapModelTrafficModule.AltitudeMode.RELATIVE) {
            this._setAltitudeDisplay(state, true, altitudeDeltaFeet, altitudeDeltaFeet >= 0);
        } else {
            let altitudeAbsoluteFeet = this.intruderView.intruderEntry.intruder.altitude.asUnit(WT_Unit.FOOT);
            this._setAltitudeDisplay(state, false, altitudeAbsoluteFeet, altitudeDeltaFeet >= 0);
        }
    }

    _setVerticalSpeed(state, fpm) {
    }

    _updateVerticalSpeed(state) {
        let fpm = WT_Unit.MPS.convert(this.intruderView.intruderEntry.intruder.velocityVector.z, WT_Unit.FPM);
        this._setVerticalSpeed(state, fpm);
    }

    _setLabelVisibility(value) {
    }

    _updateLabelVisibility(state, showLabel) {
        this._setLabelVisibility(showLabel);
    }

    _updateDisplay(state, isVisible, showLabel) {
        this._updateVisibility(state, isVisible);
        if (!isVisible) {
            return;
        }

        this._updatePosition(state);
        this._updateAlertLevel(state);
        this._updateOffScale(state);
        this._updateGroundTrack(state);
        this._updateAltitude(state);
        this._updateVerticalSpeed(state);
        this._updateLabelVisibility(state, showLabel);
    }

    update(state, isVisible, showLabel) {
        if (!this._isInit || !this.intruderView) {
            return;
        }

        this._updateDisplay(state, isVisible, showLabel);
    }
}