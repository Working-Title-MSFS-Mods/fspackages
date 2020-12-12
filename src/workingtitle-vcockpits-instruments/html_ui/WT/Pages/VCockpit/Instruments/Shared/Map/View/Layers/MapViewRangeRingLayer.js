/**
 * A range ring. This layer draws a ring around the map model's target position with range equal to the map model's nominal range.
 * A label which displays the map's nominal range is also drawn next to the ring. The use of this layer requires the .rangeRing
 * module to be added to the map model.
 */
class WT_MapViewRangeRingLayer extends WT_MapViewLabeledRingLayer {
    constructor(className = WT_MapViewRangeRingLayer.CLASS_DEFAULT, configName = WT_MapViewRangeRingLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._rangeRing = new WT_MapViewLabeledRing(new WT_MapViewRing(), new WT_MapViewRangeRingLabel());
        this.addRing(this._rangeRing);
        this._rangeRing.label.anchor = {x: 0.5, y: 0.5};

        this._optsManager = new WT_OptionsManager(this, WT_MapViewRangeRingLayer.OPTIONS_DEF);
    }

    _updateStyles(dpiScale) {
        this._rangeRing.ring.setOptions({
            strokeWidth: this.strokeWidth * dpiScale,
            strokeColor: this.strokeColor,
            strokeDash: this.strokeDash.map(e => e * dpiScale),
            outlineWidth: this.outlineWidth * dpiScale,
            outlineColor: this.outlineColor,
            outlineDash: this.outlineDash.map(e => e * dpiScale)
        });

        this._rangeRing.label.setOptions({
            radialAngle: this.labelAngle,
            radialOffset: this.labelOffset * dpiScale,
        });
    }

    /**
     * @param {WT_MapViewState} state
     */
    isVisible(state) {
        return state.model.rangeRing.show;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onConfigLoaded(state) {
        for (let property of WT_MapViewRangeRingLayer.CONFIG_PROPERTIES) {
            this._setPropertyFromConfig(property);
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    onProjectionViewChanged(state) {
        super.onProjectionViewChanged(state);
    }

    /**
     * @param {WT_MapViewState} state
     */
    onAttached(state) {
        super.onAttached(state);
        this._updateStyles(state.dpiScale);
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        super.onUpdate(state);

        this._rangeRing.center = state.projection.viewTarget;
        this._rangeRing.radius = state.model.range.ratio(state.projection.range) * state.projection.viewHeight;
    }
}
WT_MapViewRangeRingLayer.CLASS_DEFAULT = "rangeRingLayer";
WT_MapViewRangeRingLayer.CONFIG_NAME_DEFAULT = "rangeRing";
WT_MapViewRangeRingLayer.OPTIONS_DEF = {
    strokeWidth: {default: 2, auto: true},
    strokeColor: {default: "white", auto: true},
    strokeDash: {default: [], auto: true},
    outlineWidth: {default: 0, auto: true},
    outlineColor: {default: "#000000", auto: true},
    outlineDash: {default: [], auto: true},
    labelAngle: {default: -45, auto: true},
    labelOffset: {default: 0, auto: true}
};
WT_MapViewRangeRingLayer.CONFIG_PROPERTIES = [
    "strokeWidth",
    "strokeColor",
    "strokeDash",
    "outlineWidth",
    "outlineColor",
    "outlineDash",
    "labelAngle",
    "labelOffset"
];

class WT_MapViewRangeRingLabel extends WT_MapViewRingLabel {
    _createLabel() {
        this._rangeLabel = new WT_MapViewRangeLabel("");
        return this._rangeLabel.labelElement;
    }

    /**
     * @readonly
     * @property {WT_MapViewRangeLabel} rangeRing - this label's range label object.
     * @type {WT_MapViewRangeLabel}
     */
    get rangeLabel() {
        return this._rangeLabel;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        super.onUpdate(state);
        this.rangeLabel.onUpdate(state);
    }
}