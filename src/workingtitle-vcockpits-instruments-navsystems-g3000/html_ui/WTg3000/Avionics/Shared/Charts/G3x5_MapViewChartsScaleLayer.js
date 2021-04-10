/**
 * A map scale.
 */
class WT_G3x5_MapViewChartsScaleLayer extends WT_MapViewLayer {
    constructor(className = WT_G3x5_MapViewChartsScaleLayer.CLASS_DEFAULT, configName = WT_G3x5_MapViewChartsScaleLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._optsManager = new WT_OptionsManager(this, WT_G3x5_MapViewChartsScaleLayer.OPTIONS_DEF);
    }

    _createHTMLElement() {
        return new WT_G3x5_MapViewChartsScaleHTMLElement();
    }

    _updateViewLengthTarget() {
        this.htmlElement.setViewLengthTarget(this.viewLengthTarget);
    }

    _convertGeoDistanceCandidates(candidates, unit) {
        return candidates.map(value => unit.createNumber(value));
    }

    _updateGeoDistanceCandidatesNautical() {
        let geoDistanceCandidatesConverted = this._convertGeoDistanceCandidates(this.geoDistanceCandidatesNautical, WT_Unit.NMILE);
        this.htmlElement.setGeoDistanceCandidatesNautical(geoDistanceCandidatesConverted);
    }

    _updateGeoDistanceCandidatesMetric() {
        let geoDistanceCandidatesConverted = this._convertGeoDistanceCandidates(this.geoDistanceCandidatesMetric, WT_Unit.KILOMETER);
        this.htmlElement.setGeoDistanceCandidatesMetric(geoDistanceCandidatesConverted);
    }

    onOptionChanged(name, oldValue, newValue) {
        switch (name) {
            case "viewLengthTarget":
                this._updateViewLengthTarget();
                break;
            case "geoDistanceCandidatesNautical":
                this._updateGeoDistanceCandidatesNautical();
                break;
            case "geoDistanceCandidatesMetric":
                this._updateGeoDistanceCandidatesMetric();
                break;
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    onConfigLoaded(state) {
        for (let property of WT_G3x5_MapViewChartsScaleLayer.CONFIG_PROPERTIES) {
            this._setPropertyFromConfig(property);
        }

        this.htmlElement.setAirplaneImage(this.config.imagePath);
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        this.htmlElement.update(state);
    }
}
WT_G3x5_MapViewChartsScaleLayer.CLASS_DEFAULT = "chartsScaleLayer";
WT_G3x5_MapViewChartsScaleLayer.CONFIG_NAME_DEFAULT = "chartsScale";
WT_G3x5_MapViewChartsScaleLayer.OPTIONS_DEF = {
    viewLengthTarget: {default: 100, auto: true, observed: true},
    geoDistanceCandidatesNautical: {default: [0.00822894, 0.0164579, 0.0411447, 0.0822894, 0.164579, 0.25, 0.5, 1, 2, 2.5, 5, 10, 15, 20], auto: true, observed: true}, // NM
    geoDistanceCandidatesMetric: {default: [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 15, 20, 25, 50], auto: true, observed: true}, // KM
};
WT_G3x5_MapViewChartsScaleLayer.CONFIG_PROPERTIES = [
    "viewLengthTarget",
    "geoDistanceCandidates"
];

class WT_G3x5_MapViewChartsScaleHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._initFormatter();

        this._viewLengthTarget = 0;
        this._geoDistanceCandidatesNautical = [WT_Unit.NMILE.createNumber(1)];
        this._geoDistanceCandidatesMetric = [WT_Unit.KILOMETER.createNumber(1)];
        this._lastUnitMode = WT_G3x5_MapViewChartsScaleHTMLElement.UnitMode.NAUTICAL;
        this._lastViewResolutionNM = 0;
        this._needUpdate = false;
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_MapViewChartsScaleHTMLElement.TEMPLATE;
    }

    _initFormatter() {
        this._formatter = new WT_NumberFormatter({
            precision: 0.01,
            forceDecimalZeroes: false,
            maxDigits: 3,
            unitCaps: true
        });
    }

    _defineChildren() {
        this._wrapper = new WT_CachedElement(this.shadowRoot.querySelector(`#wrapper`));
        this._bar = this.shadowRoot.querySelector(`#bar`);
        this._right = this.shadowRoot.querySelector(`#right`);
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
    }

    /**
     * Sets the target length of this scale in the viewing window, in pixels.
     * @param {Number} target - the new target length.
     */
    setViewLengthTarget(target) {
        this._viewLengthTarget = target;
        this._needUpdate = true;
    }

    /**
     * Sets the candidate geographic distances from which this scale can choose when picking a distance to mark in
     * nautical units mode.
     * @param {WT_NumberUnit[]} candidates - the new candidates.
     */
    setGeoDistanceCandidatesNautical(candidates) {
        this._geoDistanceCandidatesNautical = candidates.map(candidate => candidate.copy());
        this._needUpdate = true;
    }

    /**
     * Sets the candidate geographic distances from which this scale can choose when picking a distance to mark in
     * metric units mode.
     * @param {WT_NumberUnit[]} candidates - the new candidates.
     */
    setGeoDistanceCandidatesMetric(candidates) {
        this._geoDistanceCandidatesMetric = candidates.map(candidate => candidate.copy());
        this._needUpdate = true;
    }

    /**
     * Gets the appropriate distance unit mode from the current map view state.
     * @param {WT_MapViewState} state - the current map view state.
     * @returns {WT_G3x5_MapViewChartsScaleHTMLElement.UnitMode} a distance unit mode.
     */
    _getUnitMode(state) {
        let distanceUnit = state.model.units.distance;
        if (distanceUnit.equals(WT_Unit.NMILE) || distanceUnit.equals(WT_Unit.FOOT)) {
            return WT_G3x5_MapViewChartsScaleHTMLElement.UnitMode.NAUTICAL;
        } else {
            return WT_G3x5_MapViewChartsScaleHTMLElement.UnitMode.METRIC;
        }
    }

    /**
     * Finds the most suitable geographic distance to mark on this scale based on the current map resolution.
     * @param {WT_MapViewState} state - the current map view state.
     * @param {WT_G3x5_MapViewChartsScaleHTMLElement.UnitMode} unitMode - the current distance unit mode.
     * @returns {WT_NumberUnit} the most suitable geographic distance to mark on this scale.
     */
    _getGeoDistanceTarget(state, unitMode) {
        let viewResolution = state.projection.viewResolution;
        let viewLengthTarget = this._viewLengthTarget;
        let candidates = unitMode === WT_G3x5_MapViewChartsScaleHTMLElement.UnitMode.NAUTICAL ? this._geoDistanceCandidatesNautical : this._geoDistanceCandidatesMetric;
        let target = candidates.reduce((prev, curr) => Math.abs(prev.ratio(viewResolution) - viewLengthTarget) <= Math.abs(curr.ratio(viewResolution) - viewLengthTarget) ? prev : curr);
        return target;
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_NumberUnit} geoDistance
     */
    _setBarLength(state, geoDistance) {
        let viewLength = geoDistance.ratio(state.projection.viewResolution);
        this._bar.style.width = `${viewLength}px`;
    }

    /**
     *
     * @param {WT_NumberUnit} range
     * @param {WT_G3x5_MapViewChartsScaleHTMLElement.UnitMode} unitMode
     * @returns {WT_Unit}
     */
    _selectDisplayUnit(range, unitMode) {
        if (unitMode === WT_G3x5_MapViewChartsScaleHTMLElement.UnitMode.NAUTICAL) {
            return range.asUnit(WT_Unit.FOOT) <= 1001 ? WT_Unit.FOOT : WT_Unit.NMILE;
        } else {
            return range.asUnit(WT_Unit.METER) <= 501 ? WT_Unit.METER : WT_Unit.KILOMETER;
        }
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_NumberUnit} geoDistance
     * @param {WT_G3x5_MapViewChartsScaleHTMLElement.UnitMode} unitMode
     */
    _setRightLabel(state, geoDistance, unitMode) {
        let unit = this._selectDisplayUnit(geoDistance, unitMode);
        this._right.textContent = this._formatter.getFormattedString(geoDistance, unit);
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_NumberUnit} geoDistance
     * @param {WT_G3x5_MapViewChartsScaleHTMLElement.UnitMode} unitMode
     */
    _setScaleLength(state, geoDistance, unitMode) {
        this._setBarLength(state, geoDistance);
        this._setRightLabel(state, geoDistance, unitMode);
    }

    /**
     * @param {WT_MapViewState} state
     */
    update(state) {
        if (state.model.charts.isToScale) {
            this._wrapper.setAttribute("scale", "true");
        } else {
            this._wrapper.setAttribute("scale", "false");
            return;
        }

        let unitMode = this._getUnitMode(state);
        let viewResolutionNM = state.projection.viewResolution.asUnit(WT_Unit.NMILE);
        if (!this._isInit || (!this._needUpdate && this._lastUnitMode === unitMode && this._lastViewResolutionNM === viewResolutionNM)) {
            return;
        }

        let target = this._getGeoDistanceTarget(state, unitMode);
        this._setScaleLength(state, target, unitMode);
        this._lastUnitMode = unitMode;
        this._lastViewResolutionNM = viewResolutionNM;
        this._needUpdate = false;
    }
}
/**
 * @enum {Number}
 */
WT_G3x5_MapViewChartsScaleHTMLElement.UnitMode = {
    NAUTICAL: 0,
    METRIC: 1
}
WT_G3x5_MapViewChartsScaleHTMLElement.NAME = "wt-map-view-charts-scale";
WT_G3x5_MapViewChartsScaleHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_MapViewChartsScaleHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #scale {
            display: flex;
            flex-flow: row nowrap;
            justify-content: center;
            align-items: flex-end;
        }
        #wrapper[scale="false"] #scale {
            display: none;
        }
            #bar {
                height: var(--charts-scale-bar-height, 0.5em);
                border-bottom: var(--charts-scale-bar-stroke-width, 2px) solid var(--wt-g3x5-lightblue);
                border-left: var(--charts-scale-bar-stroke-width, 2px) solid var(--wt-g3x5-lightblue);
                border-right: var(--charts-scale-bar-stroke-width, 2px) solid var(--wt-g3x5-lightblue);
                z-index: 1;
            }
            .labelContainer {
                height: var(--charts-scale-bar-height, 0.5em);
                z-index: 2;
            }
                .label {
                    padding: var(--charts-scale-label-padding, 0.2em);
                    background: black;
                    border: 1px solid white;
                    border-radius: 3px;
                    color: var(--wt-g3x5-lightblue);
                    white-space: nowrap;
                }
                #left {
                    transform: translate(50%, -100%);
                }
                #right {
                    transform: translate(-50%, -100%);
                }
        #nottoscale {
            display: none;
            padding: var(--charts-scale-label-padding, 0.2em);
            background: black;
            border: 1px solid white;
            border-radius: 3px;
            color: var(--wt-g3x5-lightblue);
            white-space: nowrap;
        }
        #wrapper[scale="false"] #nottoscale {
            display: block;
        }
    </style>
    <div id="wrapper">
        <div id="scale">
            <div class="labelContainer">
                <div id="left" class="label">0</div>
            </div>
            <div id="bar"></div>
            <div class="labelContainer">
                <div id="right" class="label"></div>
            </div>
        </div>
        <div id="nottoscale">NOT TO SCALE</div>
    </div>
`;

customElements.define(WT_G3x5_MapViewChartsScaleHTMLElement.NAME, WT_G3x5_MapViewChartsScaleHTMLElement);