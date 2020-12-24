/**
 * A fuel ring. This layer draws two rings centered on the player aircraft. The outer ring marks the maximum range of the plane given the
 * current ground speed, fuel consumption and remaining fuel onboard. The inner ring marks the distance the plane can fly until only
 * reserve fuel is left. The inner ring also has an attached label displaying the time remaining to reserve fuel. If only reserve fuel
 * currently remains, the inner ring is not displayed, and the outer ring (optionally) changes color. Reserve fuel is defined
 * by the map model in terms of time of flight, not amount of fuel. The use of this layer requires the .fuelRing module to be added
 * to the map model.
 */
class WT_MapViewFuelRingLayer extends WT_MapViewLabeledRingLayer {
    constructor(className = WT_MapViewFuelRingLayer.CLASS_DEFAULT, configName = WT_MapViewFuelRingLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._outerRing = new WT_MapViewLabeledRing();
        this._innerRing = new WT_MapViewLabeledRing(new WT_MapViewFuelRingInner(), new WT_MapViewFuelRingLabel());
        this._innerRing.label.anchor = {x: 0.5, y: 0.5};
        this.addRing(this._outerRing);
        this.addRing(this._innerRing);

        this._timeToReserve = new WT_NumberUnit(0, WT_Unit.HOUR);

        this._optsManager = new WT_OptionsManager(this, WT_MapViewFuelRingLayer.OPTIONS_DEF);

        this._lastTime = 0;
        this._lastHoursRemaining = 0;

        this._tempGPH = WT_Unit.GPH.createNumber(0);
        this._tempGal = WT_Unit.GALLON.createNumber(0);
        this._tempKnot = WT_Unit.KNOT.createNumber(0);
    }

    /**
     * Updates the styling of this layer's rings.
     * @param {Number} dpiScale - the current dpi scale of the map view.
     */
    _updateStyles(dpiScale) {
        this._outerRing.ring.setOptions({
            strokeWidth: this.outerRingStrokeWidth * dpiScale,
            strokeColor: this.outerRingStrokeColor,
            outlineWidth: this.outerRingOutlineWidth * dpiScale,
            outlineColor: this.outerRingOutlineColor
        });

        this._innerRing.ring.setOptions({
            strokeWidth: this.innerRingStrokeWidth * dpiScale,
            strokeColor: this.innerRingStrokeColor,
            strokeDash: this.innerRingStrokeDash.map(e => e * dpiScale),
            backingWidth: this.innerRingStrokeBackingWidth * dpiScale,
            backingColor: this.innerRingStrokeBackingColor,
            outlineWidth: this.innerRingOutlineWidth * dpiScale,
            outlineColor: this.innerRingOutlineColor
        });
    }

    /**
     * @param {WT_MapViewState} state
     */
    isVisible(state) {
        return state.model.fuelRing.show && !state.model.airplane.model.isOnGround();
    }

    /**
     * @param {WT_MapViewState} state
     */
    onConfigLoaded(state) {
        for (let property of WT_MapViewFuelRingLayer.CONFIG_PROPERTIES) {
            this._setPropertyFromConfig(property);
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    onAttached(state) {
        super.onAttached(state);
        this._updateStyles(state.dpiScale);
    }

    /**
     * Calculates an appropriate exponential smoothing factor to use.
     * @param {WT_MapViewState} state - the current map view state.
     * @returns {Number} - a smoothing factor.
     */
    _calculateSmoothingFactor(state) {
        let currentTimeSec = state.currentTime / 1000;
        let dt = currentTimeSec - this._lastTime;
        this._lastTime = currentTimeSec;
        if (dt > WT_MapViewFuelRingLayer.SMOOTHING_MAX_TIME_DELTA) {
            return 1;
        } else {
            return Math.pow(0.5, dt * this.smoothingConstant);
        }
    }

    /**
     * Applies exponential smoothing (i.e. exponential moving average) to a time fuel remaining value.
     * @param {Number} hoursRemaining - the value to smooth.
     * @param {Number} factor - the smoothing factor to use.
     * @returns {Number} - the smoothed value.
     */
    _smoothHoursRemaining(hoursRemaining, factor) {
        let smoothed = hoursRemaining * factor + this._lastHoursRemaining * (1 - factor);
        this._lastHoursRemaining = smoothed;
        return smoothed;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        let fob = state.model.airplane.model.fuelOnboard(this._tempGal).number; // gallons
        let fuelFlow = state.model.airplane.model.fuelFlowTotal(this._tempGPH).number; // gallons per hour

        let hoursRemainingTotal = fob / fuelFlow;
        let smoothingFactor = this._calculateSmoothingFactor(state);
        hoursRemainingTotal = this._smoothHoursRemaining(hoursRemainingTotal, smoothingFactor);

        let hoursRemainingReserve = Math.max(0, hoursRemainingTotal - state.model.fuelRing.reserveTime.asUnit(WT_Unit.HOUR));
        let gs = state.model.airplane.model.groundSpeed(this._tempKnot).number; // knots
        if (hoursRemainingReserve > 0) {
            this._outerRing.ring.strokeColor = this.outerRingStrokeColor;
            this._innerRing.ring.show = true;
            this._innerRing.label.show = true;
        } else {
            this._outerRing.ring.strokeColor = this.outerRingStrokeColorReserve;
            this._innerRing.ring.show = false;
            this._innerRing.label.show = false;
        }

        let resolution = state.projection.viewResolution.number; //nautical miles per pixel

        let center = state.viewPlane;
        this._outerRing.center = center;
        this._outerRing.radius = gs * hoursRemainingTotal / resolution;
        this._innerRing.center = center;
        this._innerRing.radius = gs * hoursRemainingReserve / resolution;
        this._innerRing.label.time = this._timeToReserve.set(hoursRemainingReserve);

        super.onUpdate(state);
    }
}
WT_MapViewFuelRingLayer.CLASS_DEFAULT = "fuelRingLayer";
WT_MapViewFuelRingLayer.CONFIG_NAME_DEFAULT = "fuelRing";
WT_MapViewFuelRingLayer.SMOOTHING_MAX_TIME_DELTA = 0.5;
WT_MapViewFuelRingLayer.OPTIONS_DEF = {
    smoothingConstant: {default: 120, auto: true},

    outerRingStrokeWidth: {default: 2, auto: true},
    outerRingStrokeColor: {default: "#63aa59", auto: true},
    outerRingStrokeColorReserve: {default: "yellow", auto: true},
    outerRingOutlineWidth: {default: 1, auto: true},
    outerRingOutlineColor: {default: "black", auto: true},

    innerRingStrokeWidth: {default: 3, auto: true},
    innerRingStrokeColor: {default: "#63aa59", auto: true},
    innerRingStrokeDash: {default: [4, 4], auto: true},
    innerRingStrokeBackingWidth: {default: 3, auto: true},
    innerRingStrokeBackingColor: {default: "black", auto: true},
    innerRingOutlineWidth: {default: 0, auto: true},
    innerRingOutlineColor: {default: "black", auto: true},

    labelAngle: {default: 0, auto: true},
    labelOffset: {default: 0, auto: true}
};
WT_MapViewFuelRingLayer.CONFIG_PROPERTIES = [
    "smoothingConstant",
    "outerRingStrokeWidth",
    "outerRingStrokeColor",
    "outerRingStrokeColorReserve",
    "outerRingOutlineWidth",
    "outerRingOutlineColor",
    "innerRingStrokeWidth",
    "innerRingStrokeColor",
    "innerRingStrokeDash",
    "innerRingStrokeBackingWidth",
    "innerRingStrokeBackingColor",
    "innerRingOutlineWidth",
    "innerRingOutlineColor",
    "labelAngle",
    "labelOffset"
];

class WT_MapViewFuelRingInner extends WT_MapViewRing {
    constructor() {
        super();

        this._optsManager.addOptions(WT_MapViewFuelRingInner.OPTIONS_DEF);
    }

    _drawRingToCanvas(context, center, radius) {
        let half_pi = Math.PI / 2;
        context.beginPath();
        context.arc(center.x, center.y, radius, -half_pi, -half_pi + Math.PI);
        context.moveTo(center.x, center.y - radius);
        context.arc(center.x, center.y, radius, -half_pi, -half_pi + Math.PI, true);

        if (this.backingWidth > 0) {
            this._applyStrokeToContext(context, this.backingWidth, this.backingColor, []);
        }
        if (this.outlineWidth > 0) {
            this._applyStrokeToContext(context, this.strokeWidth + this.outlineWidth * 2, this.outlineColor, this.outlineDash);
        }
        this._applyStrokeToContext(context, this.strokeWidth, this.strokeColor, this.strokeDash);
    }
}
WT_MapViewFuelRingInner.OPTIONS_DEF = {
    backingWidth: {default: 1, auto: true, observed: true},
    backingColor: {default: "#000000", auto: true, observed: true},
};

class WT_MapViewFuelRingLabel extends WT_MapViewRingLabel {
    constructor() {
        super();

        this._time = new WT_NumberUnit(0, WT_Unit.MINUTE);
    }

    /**
     * @property {WT_NumberUnit} time - the time to display on this label.
     * @type {WT_NumberUnit}
     */
    get time() {
        return this._time.readonly();
    }

    set time(time) {
        this._time.set(time);
    }

    _createLabel() {
        return this._timeDisplay = new WT_MapViewFuelReserveTimeDisplay();
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        super.onUpdate(state);
        this._timeDisplay.update(this.time);
    }
}
WT_MapViewFuelRingLabel.LABEL_CLASS_LIST_DEFAULT = ["fuelRingLabel"];
WT_MapViewFuelRingLabel.TIME_CLASS_LIST_DEFAULT = ["time"];

class WT_MapViewFuelReserveTimeDisplay extends HTMLElement {
    constructor() {
        super();

        let template = document.createElement("template");
        template.innerHTML = `
            <style>
                :host {
                    display: block;
                    background-color: black;
                    border: solid 1px white;
                    border-radius: 5px;
                    text-align: center;
                    color: #63aa59;
                    font-size: 1.75vh;
                    line-height: 1.5vh;
                }
                    #time {
                        margin: 0.2em;
                    }
            </style>
            <div id="time"></div>
        `;
        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this._formatter = new WT_TimeFormatter({
            unitShow: true,
            timeFormat: WT_TimeFormatter.Format.HH_MM,
            delim: WT_TimeFormatter.Delim.SPACE
        });
    }

    connectedCallback() {
        this._timeElement = this.shadowRoot.querySelector(`#time`);
    }

    update(time) {
        this._timeElement.innerHTML = this._formatter.getFormattedString(time);
    }
}

customElements.define("map-view-fuelreservetimedisplay", WT_MapViewFuelReserveTimeDisplay);