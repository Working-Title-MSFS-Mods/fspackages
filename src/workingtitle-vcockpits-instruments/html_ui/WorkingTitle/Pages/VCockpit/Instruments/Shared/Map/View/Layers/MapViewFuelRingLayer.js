class WT_MapViewFuelRingLayer extends WT_MapViewLabeledRingLayer {
    constructor(className = WT_MapViewFuelRingLayer.CLASS_DEFAULT, configName = WT_MapViewFuelRingLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._outerRing = new WT_MapViewLabeledRing();
        this._innerRing = new WT_MapViewLabeledRing(new WT_MapViewFuelRingInner(), new WT_MapViewFuelRingLabel());
        this._innerRing.label.anchor = {x: 0.5, y: 0.5};
        this.addRing(this._outerRing);
        this.addRing(this._innerRing);

        this._optsManager = new WT_OptionsManager(this, WT_MapViewFuelRingLayer.OPTIONS_DEF);

        this._lastTime = 0;
        this._lastHoursRemaining = 0;
    }

    get outerRing() {
        return this._outerRing;
    }

    get innerRing() {
        return this._innerRing;
    }

    _updateStyles(dpiScale) {
        this.outerRing.ring.setOptions({
            strokeWidth: this.outerRingStrokeWidth * dpiScale,
            strokeColor: this.outerRingStrokeColor,
            outlineWidth: this.outerRingOutlineWidth * dpiScale,
            outlineColor: this.outerRingOutlineColor
        });

        this.innerRing.ring.setOptions({
            strokeWidth: this.innerRingStrokeWidth * dpiScale,
            strokeColor: this.innerRingStrokeColor,
            strokeDash: this.innerRingStrokeDash.map(e => e * dpiScale),
            backingWidth: this.innerRingStrokeBackingWidth * dpiScale,
            backingColor: this.innerRingStrokeBackingColor,
            outlineWidth: this.innerRingOutlineWidth * dpiScale,
            outlineColor: this.innerRingOutlineColor
        });
    }

    isVisible(data) {
        return data.model.fuelRing.show;
    }

    onConfigLoaded(data) {
        for (let property of WT_MapViewFuelRingLayer.CONFIG_PROPERTIES) {
            this._setPropertyFromConfig(property);
        }
    }

    onAttached(data) {
        super.onAttached(data);
        this._updateStyles(data.dpiScale);
    }

    _calculateSmoothingFactor(data) {
        let currentTimeSec = data.currentTime / 1000;
        let dt = currentTimeSec - this._lastTime;
        this._lastTime = currentTimeSec;
        if (dt > WT_MapViewFuelRingLayer.SMOOTHING_MAX_TIME_DELTA) {
            return 1;
        } else {
            return Math.pow(0.5, dt * this.smoothingConstant);
        }
    }

    _smoothHoursRemaining(hoursRemaining, factor) {
        let smoothed = hoursRemaining * factor + this._lastHoursRemaining * (1 - factor);
        this._lastHoursRemaining = smoothed;
        return smoothed;
    }

    onUpdate(data) {
        let fob = data.model.airplane.fuelOnboard.number; // gallons
        let fuelFlow = data.model.airplane.fuelFlowTotal.number; // gallons per hour

        let hoursRemainingTotal = fob / fuelFlow;
        let smoothingFactor = this._calculateSmoothingFactor(data);
        hoursRemainingTotal = this._smoothHoursRemaining(hoursRemainingTotal, smoothingFactor);

        let hoursRemainingReserve = Math.max(0, hoursRemainingTotal - data.model.fuelRing.reserveTime.asUnit(WT_Unit.HOUR));
        let gs = data.model.airplane.groundSpeed.number; // knots
        if (hoursRemainingReserve > 0) {
            this.outerRing.ring.strokeColor = this.outerRingStrokeColor;
            this.innerRing.ring.show = true;
            this.innerRing.label.show = true;
        } else {
            this.outerRing.ring.strokeColor = this.outerRingStrokeColorReserve;
            this.innerRing.ring.show = false;
            this.innerRing.label.show = false;
        }

        let resolution = data.projection.viewResolution.number; //nautical miles per pixel

        let center = data.viewPlane;
        this.outerRing.center = center;
        this.outerRing.radius = gs * hoursRemainingTotal / resolution;
        this.innerRing.center = center;
        this.innerRing.radius = gs * hoursRemainingReserve / resolution;
        this.innerRing.label.time = new WT_NumberUnit(hoursRemainingReserve, WT_Unit.HOUR);

        super.onUpdate(data);
    }
}
WT_MapViewFuelRingLayer.CLASS_DEFAULT = "ruelRingLayer";
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

    _applyStrokeToBuffer(lineWidth, strokeWidth, lineDash, centerX, centerY, radius) {
        this._bufferContext.lineWidth = lineWidth;
        this._bufferContext.strokeStyle = strokeWidth;
        this._bufferContext.setLineDash(lineDash);
        this._bufferContext.beginPath();
        if (lineDash.length === 0) {
            this._bufferContext.arc(centerX, centerY, radius, 0, Math.PI * 2);
        } else {
            let half_pi = Math.PI / 2;
            this._bufferContext.arc(centerX, centerY, radius, -half_pi, -half_pi + Math.PI);
            this._bufferContext.moveTo(centerX, centerY - radius);
            this._bufferContext.arc(centerX, centerY, radius, -half_pi, -half_pi + Math.PI, true);
        }
        this._bufferContext.stroke();
    }

    _drawRingToBuffer(centerX, centerY) {
        if (this.backingWidth > 0) {
            this._applyStrokeToBuffer(this.backingWidth, this.backingColor, [], centerX, centerY, this.radius);
        }
        if (this.outlineWidth > 0) {
            this._applyStrokeToBuffer(this.strokeWidth + this.outlineWidth * 2, this.outlineColor, this.outlineDash, centerX, centerY, this.radius);
        }
        this._applyStrokeToBuffer(this.strokeWidth, this.strokeColor, this.strokeDash, centerX, centerY, this.radius);
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
        this._formatter = new WT_TimeFormatter({
            unitShow: true,
            timeFormat: WT_TimeFormatter.Format.HH_MM,
            delim: WT_TimeFormatter.Delim.SPACE
        });
    }

    get time() {
        return this._time.copy();
    }

    set time(time) {
        this._time.copyFrom(time);
    }

    get timeElement() {
        return this._timeElement;
    }

    _createLabel() {
        let element = document.createElement("div");
        element.classList.add(WT_MapViewFuelRingLabel.LABEL_CLASS_LIST_DEFAULT);

        this._timeElement = document.createElement("div");
        this._timeElement.classList.add(WT_MapViewFuelRingLabel.TIME_CLASS_LIST_DEFAULT);

        element.appendChild(this._timeElement);

        return element;
    }

    onUpdate(data) {
        super.onUpdate(data);
        this.timeElement.innerHTML = this._formatter.getFormattedString(this.time);
    }
}
WT_MapViewFuelRingLabel.LABEL_CLASS_LIST_DEFAULT = ["fuelRingLabel"];
WT_MapViewFuelRingLabel.TIME_CLASS_LIST_DEFAULT = ["time"];