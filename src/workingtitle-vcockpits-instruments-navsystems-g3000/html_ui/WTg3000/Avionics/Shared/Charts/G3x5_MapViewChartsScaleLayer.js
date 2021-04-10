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

    _convertGeoDistanceCandidates() {
        return this.geoDistanceCandidates.map(value => WT_Unit.NMILE.createNumber(value));
    }

    _updateGeoDistanceCandidates() {
        let geoDistanceCandidatesConverted = this._convertGeoDistanceCandidates();
        this.htmlElement.setGeoDistanceCandidates(geoDistanceCandidatesConverted);
    }

    onOptionChanged(name, oldValue, newValue) {
        switch (name) {
            case "viewLengthTarget":
                this._updateViewLengthTarget();
                break;
            case "geoDistanceCandidates":
                this._updateGeoDistanceCandidates();
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
    geoDistanceCandidates: {default: [0.00822894, 0.0164579, 0.0411447, 0.0822894, 0.164579, 0.25, 0.5, 1, 2, 5, 10, 15, 20], auto: true, observed: true}
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
        this._geoDistanceCandidates = [WT_Unit.NMILE.createNumber(1)];
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
     * Sets the candidate geographic distances from which this scale can choose when picking a distance to mark.
     * @param {WT_NumberUnit[]} candidates - the new candidates.
     */
    setGeoDistanceCandidates(candidates) {
        this._geoDistanceCandidates = candidates.map(candidate => candidate.copy());
        this._needUpdate = true;
    }

    /**
     * Finds the most suitable geographic distance to mark on this scale based on the current map resolution.
     * @param {WT_MapViewState} state - the current map view state.
     * @returns {WT_NumberUnit} the most suitable geographic distance to mark on this scale.
     */
    _getGeoDistanceTarget(state) {
        let viewResolution = state.projection.viewResolution;
        let viewLengthTarget = this._viewLengthTarget;
        let target = this._geoDistanceCandidates.reduce((prev, curr) => Math.abs(prev.ratio(viewResolution) - viewLengthTarget) <= Math.abs(curr.ratio(viewResolution) - viewLengthTarget) ? prev : curr);
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
     * @param {WT_Unit} distanceUnit
     * @returns {WT_Unit}
     */
    _selectDisplayUnit(range, distanceUnit) {
        if (distanceUnit.equals(WT_Unit.NMILE) || distanceUnit.equals(WT_Unit.FOOT)) {
            return range.asUnit(WT_Unit.FOOT) <= 1001 ? WT_Unit.FOOT : WT_Unit.NMILE;
        } else if (distanceUnit.equals(WT_Unit.KILOMETER) || distanceUnit.equals(WT_Unit.METER)) {
            return range.asUnit(WT_Unit.METER) <= 501 ? WT_Unit.METER : WT_Unit.KILOMETER;
        } else {
            return distanceUnit;
        }
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_NumberUnit} geoDistance
     */
    _setRightLabel(state, geoDistance) {
        let unit = this._selectDisplayUnit(geoDistance, WT_Unit.NMILE);
        this._right.textContent = this._formatter.getFormattedString(geoDistance, unit);
    }

    /**
     *
     * @param {WT_MapViewState} state
     * @param {WT_NumberUnit} geoDistance
     */
    _setScaleLength(state, geoDistance) {
        this._setBarLength(state, geoDistance);
        this._setRightLabel(state, geoDistance);
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

        let viewResolutionNM = state.projection.viewResolution.asUnit(WT_Unit.NMILE);
        if (!this._isInit || (!this._needUpdate && this._lastViewResolutionNM === viewResolutionNM)) {
            return;
        }

        let target = this._getGeoDistanceTarget(state);
        this._setScaleLength(state, target);
        this._lastViewResolutionNM = viewResolutionNM;
        this._needUpdate = false;
    }
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