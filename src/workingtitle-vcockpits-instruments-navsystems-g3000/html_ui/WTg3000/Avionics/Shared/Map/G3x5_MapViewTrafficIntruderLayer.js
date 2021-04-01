class WT_G3x5_MapViewTrafficIntruderLayer extends WT_MapViewMultiLayer {
    constructor(className = WT_G3x5_MapViewTrafficIntruderLayer.CLASS_DEFAULT, configName = WT_G3x5_MapViewTrafficIntruderLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._motionVectorLayer = new WT_MapViewCanvas(false, true);
        this._iconLayer = new WT_MapViewSubLayer(true);
        this.addSubLayer(this._motionVectorLayer);
        this.addSubLayer(this._iconLayer);

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
     */
    _updateIntruders(state) {
        this._intruderViews.forEach(value => this._intruderViewsToRemove.add(value), this);
        /**
         * @type {WT_ReadOnlyArray<WT_G3x5_TrafficSystemIntruderEntry>}
         */
        let intruderEntries = state.model.traffic.trafficSystem.intruders;
        intruderEntries.forEach(intruderEntry => {
            let view = this._intruderViews.get(intruderEntry);
            if (!view) {
                view = new WT_G3x5_MapViewTrafficIntruderView(intruderEntry, this._intruderViewHTMLElementRecycler);
                this._intruderViews.set(intruderEntry, view);
            } else {
                this._intruderViewsToRemove.delete(view);
            }
            view.update(state, this.iconSize, this.fontSize);
        }, this);

        this._intruderViewsToRemove.forEach(view => {
            view.destroy();
            this._intruderViews.delete(view.intruderEntry);
        });
        this._intruderViewsToRemove.clear();
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        super.onUpdate(state);

        this._updateIntruders(state);
    }
}
WT_G3x5_MapViewTrafficIntruderLayer.CLASS_DEFAULT = "trafficIntruderLayer";
WT_G3x5_MapViewTrafficIntruderLayer.CONFIG_NAME_DEFAULT = "trafficIntruder";
WT_G3x5_MapViewTrafficIntruderLayer.OPTIONS_DEF = {
    iconSize: {default: 40, auto: true},
    fontSize: {default: 25, auto: true}
};

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
     * @type {WT_GVector2ReadOnly}
     */
    get viewPosition() {
        return this._viewPosition.readonly();
    }

    /**
     *
     * @param {WT_MapViewState} state
     */
    _updatePosition(state) {
        let intruderPos = this.intruderEntry.intruder.position;
        let airplanePos = state.model.airplane.navigation.position(this._tempGeoPoint);
        let horizontalSeparation = intruderPos.distance(airplanePos);
        if (horizontalSeparation > state.model.traffic.outerRange.asUnit(WT_Unit.GA_RADIAN)) {
            this._isOffScale = true;
            state.projection.project(airplanePos.offset(airplanePos.bearingTo(intruderPos), state.model.traffic.outerRange.asUnit(WT_Unit.GA_RADIAN), true), this._viewPosition);
        } else {
            this._isOffScale = false;
            state.projection.project(this.intruderEntry.intruder.position, this._viewPosition);
        }
    }

    _updateHTMLElement(state, iconSize, fontSize) {
        this.htmlElement.setIconSize(iconSize * state.dpiScale);
        this.htmlElement.setFontSize(fontSize * state.dpiScale);
        this.htmlElement.update(state);
    }

    _updateMotionVector(state) {
    }

    update(state, iconSize, fontSize) {
        this._updatePosition(state);
        this._updateHTMLElement(state, iconSize, fontSize);
        this._updateMotionVector(state);
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

        this._isVisible = false;
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

    _updateVisibility(state) {
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

    _setAltitudeDelta(state, feet) {
    }

    _updateAltitudeDelta(state) {
        let altitudeDeltaFeet = WT_Unit.METER.convert(this.intruderView.intruderEntry.intruder.positionVector.z, WT_Unit.FOOT);
        this._setAltitudeDelta(state, altitudeDeltaFeet);
    }

    _setVerticalSpeed(state, fpm) {
    }

    _updateVerticalSpeed(state) {
        let fpm = WT_Unit.MPS.convert(this.intruderView.intruderEntry.intruder.velocityVector.z, WT_Unit.FPM);
        this._setVerticalSpeed(state, fpm);
    }

    _updateDisplay(state) {
        this._updateVisibility(state);
        if (!this._isVisible) {
            return;
        }

        this._updatePosition(state);
        this._updateAlertLevel(state);
        this._updateOffScale(state);
        this._updateGroundTrack(state);
        this._updateAltitudeDelta(state);
        this._updateVerticalSpeed(state);
    }

    update(state) {
        if (!this._isInit || !this.intruderView) {
            return;
        }

        this._updateDisplay(state);
    }
}