/**
 * Traffic map range overlay. Consists of an inner and outer range ring. Each range ring can have an associated label
 * and major and minor tick marks.
 */
class WT_G3x5_MapViewTrafficRangeLayer extends WT_MapViewLabeledRingLayer {
    constructor(className = WT_G3x5_MapViewTrafficRangeLayer.CLASS_DEFAULT, configName = WT_G3x5_MapViewTrafficRangeLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._outerRing = new WT_MapViewLabeledRing(new WT_MapViewRing(), new WT_G3x5_MapViewTrafficRangeLabel(false));
        this._innerRing = new WT_MapViewLabeledRing(new WT_MapViewRing(), new WT_G3x5_MapViewTrafficRangeLabel(true));

        this._outerRingTickLayer = new WT_MapViewCanvas(false, true);
        this._innerRingTickLayer = new WT_MapViewCanvas(false, true);

        this.addRing(this._outerRing);
        this.addRing(this._innerRing);
        this.addSubLayer(this._outerRingTickLayer);
        this.addSubLayer(this._innerRingTickLayer);
        this._outerRing.label.anchor = {x: 0.5, y: 0.5};
        this._innerRing.label.anchor = {x: 0.5, y: 0.5};

        this._optsManager = new WT_OptionsManager(this, WT_G3x5_MapViewTrafficRangeLayer.OPTIONS_DEF);

        this._tempVector2 = new WT_GVector2(0, 0);
    }

    _updateStyles(dpiScale) {
        this._outerRing.ring.setOptions({
            strokeWidth: this.outerStrokeWidth * dpiScale,
            strokeColor: this.outerStrokeColor,
            strokeDash: this.outerStrokeDash.map(e => e * dpiScale),
            outlineWidth: this.outerOutlineWidth * dpiScale,
            outlineColor: this.outerOutlineColor,
            outlineDash: this.outerOutlineDash.map(e => e * dpiScale)
        });
        this._innerRing.ring.setOptions({
            strokeWidth: this.innerStrokeWidth * dpiScale,
            strokeColor: this.innerStrokeColor,
            strokeDash: this.innerStrokeDash.map(e => e * dpiScale),
            outlineWidth: this.innerOutlineWidth * dpiScale,
            outlineColor: this.innerOutlineColor,
            outlineDash: this.innerOutlineDash.map(e => e * dpiScale)
        });

        this._outerRing.label.setOptions({
            radialAngle: this.outerLabelAngle,
            radialOffset: this.outerLabelOffset * dpiScale,
        });
        this._innerRing.label.setOptions({
            radialAngle: this.innerLabelAngle,
            radialOffset: this.innerLabelOffset * dpiScale,
        });
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
        for (let property of WT_G3x5_MapViewTrafficRangeLayer.CONFIG_PROPERTIES) {
            this._setPropertyFromConfig(property);
        }
        this._outerRing.label.show = this.outerLabelShow;
        this._innerRing.label.show = this.innerLabelShow;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onProjectionViewChanged(state) {
        super.onProjectionViewChanged(state);

        this._updateStyles(state.dpiScale);
    }

    /**
     * @param {WT_MapViewState} state
     */
    onAttached(state) {
        super.onAttached(state);

        this._updateStyles(state.dpiScale);
    }

    /**
     *
     * @param {WT_MapViewCanvas} layer
     */
    _clearRingTicks(layer) {
        layer.display.clear();
    }

    _loadTickPath(layer, center, radiusStart, radiusEnd, angle) {
        let angleRad = angle * Avionics.Utils.DEG2RAD;
        let start = this._tempVector2.setFromPolar(radiusStart, angleRad).add(center);
        layer.display.context.moveTo(start.x, start.y);
        let end = this._tempVector2.setFromPolar(radiusEnd, angleRad).add(center);
        layer.display.context.lineTo(end.x, end.y);
    }

    /**
     *
     * @param {WT_MapViewCanvas} layer
     * @param {WT_GVector2} center
     * @param {Number} radius
     * @param {{start:Number, interval:Number, width:Number, length:Number, style:String|CanvasGradient|CanvasPattern}} options
     */
    _drawMajorTicks(layer, center, radius, options) {
        let angle = options.start;
        let radiusShort = radius - (options.length / 2);
        let radiusLong = radius + (options.length / 2);
        layer.display.context.strokeStyle = options.style;
        layer.display.context.lineWidth = options.width;
        layer.display.context.beginPath();
        while (angle < 360) {
            this._loadTickPath(layer, center, radiusShort, radiusLong, angle);
            angle += options.interval;
        }
        layer.display.context.stroke();
    }

    /**
     *
     * @param {WT_MapViewCanvas} layer
     * @param {WT_GVector2} center
     * @param {Number} radius
     * @param {{start:Number, interval:Number, width:Number, length:Number, style:String|CanvasGradient|CanvasPattern}} majorTickOptions
     * @param {{factor:Number, width:Number, length:Number, style:String|CanvasGradient|CanvasPattern}} minorTickOptions
     */
    _drawMinorTicks(layer, center, radius, majorTickOptions, minorTickOptions) {
        if (minorTickOptions.factor <= 1) {
            return;
        }

        let angle = majorTickOptions.start;
        let i = 0;
        let interval = majorTickOptions.interval / minorTickOptions.factor;
        let radiusShort = radius - (minorTickOptions.length / 2);
        let radiusLong = radius + (minorTickOptions.length / 2);
        layer.display.context.strokeStyle = minorTickOptions.style;
        layer.display.context.lineWidth = minorTickOptions.width;
        layer.display.context.beginPath();
        while (angle < 360) {
            if ((i % minorTickOptions.factor) !== 0) {
                this._loadTickPath(layer, center, radiusShort, radiusLong, angle);
            }
            angle += interval;
            i++;
        }
        layer.display.context.stroke();
    }

    /**
     *
     * @param {WT_MapViewCanvas} layer
     * @param {WT_GVector2} center
     * @param {Number} radius
     */
    _setRingTicks(layer, center, radius, majorTickOptions, minorTickOptions) {
        layer.display.clear();
        this._drawMajorTicks(layer, center, radius, majorTickOptions);
        this._drawMinorTicks(layer, center, radius, majorTickOptions, minorTickOptions);
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateOuterRing(state) {
        let center = state.projection.viewTarget;
        let radius = state.model.traffic.outerRange.ratio(state.projection.range) * state.projection.viewHeight;
        if (radius === 0) {
            this._outerRing.ring.show = false;
            this._outerRing.label.show = false;
            this._clearRingTicks(this._outerRingTickLayer);
            return;
        } else {
            this._outerRing.ring.show = true;
            this._outerRing.label.show = this.outerLabelShow;
        }

        if (!center.equals(this._outerRing.center) || radius !== this._outerRing.radius) {
            let majorTickOptions = {
                start: this.outerTickMajorStart,
                interval: this.outerTickMajorInterval,
                width: this.outerTickMajorWidth * state.dpiScale,
                length: this.outerTickMajorLength * state.dpiScale,
                style: this.outerTickMajorColor
            };
            let minorTickOptions = {
                factor: this.outerTickMinorFactor,
                width: this.outerTickMinorWidth * state.dpiScale,
                length: this.outerTickMinorLength * state.dpiScale,
                style: this.outerTickMinorColor
            };
            this._setRingTicks(this._outerRingTickLayer, center, radius, majorTickOptions, minorTickOptions);
            this._outerRing.center = center;
            this._outerRing.radius = radius;
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateInnerRing(state) {
        let center = state.projection.viewTarget;
        let radius = state.model.traffic.innerRange.ratio(state.projection.range) * state.projection.viewHeight;
        if (radius === 0) {
            this._innerRing.ring.show = false;
            this._innerRing.label.show = false;
            this._clearRingTicks(this._innerRingTickLayer);
            return;
        } else {
            this._innerRing.ring.show = true;
            this._innerRing.label.show = this.innerLabelShow;
        }

        if (!center.equals(this._innerRing.center) || radius !== this._innerRing.radius) {
            let majorTickOptions = {
                start: this.innerTickMajorStart,
                interval: this.innerTickMajorInterval,
                width: this.innerTickMajorWidth * state.dpiScale,
                length: this.innerTickMajorLength * state.dpiScale,
                style: this.innerTickMajorColor
            };
            let minorTickOptions = {
                factor: this.innerTickMinorFactor,
                width: this.innerTickMinorWidth * state.dpiScale,
                length: this.innerTickMinorLength * state.dpiScale,
                style: this.innerTickMinorColor
            };
            this._setRingTicks(this._innerRingTickLayer, center, radius, majorTickOptions, minorTickOptions);
            this._innerRing.center = center;
            this._innerRing.radius = radius;
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        this._updateOuterRing(state);
        this._updateInnerRing(state);

        super.onUpdate(state);
    }
}
WT_G3x5_MapViewTrafficRangeLayer.CLASS_DEFAULT = "trafficRangeLayer";
WT_G3x5_MapViewTrafficRangeLayer.CONFIG_NAME_DEFAULT = "trafficRange";
WT_G3x5_MapViewTrafficRangeLayer.OPTIONS_DEF = {
    outerStrokeWidth: {default: 2, auto: true},
    outerStrokeColor: {default: "white", auto: true},
    outerStrokeDash: {default: [6, 6], auto: true},
    outerOutlineWidth: {default: 0, auto: true},
    outerOutlineColor: {default: "#000000", auto: true},
    outerOutlineDash: {default: [], auto: true},

    outerTickMajorStart: {default: 0, auto: true},
    outerTickMajorInterval: {default: 90, auto: true},
    outerTickMajorLength: {default: 8, auto: true},
    outerTickMajorWidth: {default: 10, auto: true},
    outerTickMajorColor: {default: "white", auto: true},

    outerTickMinorFactor: {default: 3, auto: true},
    outerTickMinorLength: {default: 6, auto: true},
    outerTickMinorWidth: {default: 6, auto: true},
    outerTickMinorColor: {default: "white", auto: true},

    innerStrokeWidth: {default: 2, auto: true},
    innerStrokeColor: {default: "white", auto: true},
    innerStrokeDash: {default: [6, 6], auto: true},
    innerOutlineWidth: {default: 0, auto: true},
    innerOutlineColor: {default: "#000000", auto: true},
    innerOutlineDash: {default: [], auto: true},

    innerTickMajorStart: {default: 0, auto: true},
    innerTickMajorInterval: {default: 90, auto: true},
    innerTickMajorLength: {default: 8, auto: true},
    innerTickMajorWidth: {default: 10, auto: true},
    innerTickMajorColor: {default: "white", auto: true},

    innerTickMinorFactor: {default: 1, auto: true},
    innerTickMinorLength: {default: 6, auto: true},
    innerTickMinorWidth: {default: 6, auto: true},
    innerTickMinorColor: {default: "white", auto: true},

    outerLabelShow: {default: true, auto: true},
    outerLabelAngle: {default: -135, auto: true},
    outerLabelOffset: {default: 0, auto: true},

    innerLabelShow: {default: true, auto: true},
    innerLabelAngle: {default: -135, auto: true},
    innerLabelOffset: {default: 0, auto: true},
};
WT_G3x5_MapViewTrafficRangeLayer.CONFIG_PROPERTIES = [
    "outerStrokeWidth",
    "outerStrokeColor",
    "outerStrokeDash",
    "outerOutlineWidth",
    "outerOutlineColor",
    "outerOutlineDash",
    "outerTickMajorStart",
    "outerTickMajorInterval",
    "outerTickMajorLength",
    "outerTickMajorWidth",
    "outerTickMajorColor",
    "outerTickMinorFactor",
    "outerTickMinorLength",
    "outerTickMinorWidth",
    "outerTickMinorColor",
    "innerStrokeWidth",
    "innerStrokeColor",
    "innerStrokeDash",
    "innerOutlineWidth",
    "innerOutlineColor",
    "innerOutlineDash",
    "innerTickMajorStart",
    "innerTickMajorInterval",
    "innerTickMajorLength",
    "innerTickMajorWidth",
    "innerTickMajorColor",
    "innerTickMinorFactor",
    "innerTickMinorLength",
    "innerTickMinorWidth",
    "innerTickMinorColor",
    "outerLabelShow",
    "outerLabelAngle",
    "outerLabelOffset",
    "innerLabelShow",
    "innerLabelAngle",
    "innerLabelOffset"
];

class WT_G3x5_MapViewTrafficRangeLabel extends WT_MapViewRingLabel {
    constructor(isInner) {
        super();

        this._isInner = isInner;
    }

    _createLabel() {
        this._rangeDisplay = new WT_MapViewRangeDisplay();
        return this._rangeDisplay;
    }

    /**
     * This label's range display object.
     * @readonly
     * @type {WT_MapViewRangeDisplay}
     */
    get rangeDisplay() {
        return this._rangeDisplay;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        super.onUpdate(state);

        this.rangeDisplay.setRange(this._isInner ? state.model.traffic.innerRange : state.model.range);
        this.rangeDisplay.update(state);
    }
}