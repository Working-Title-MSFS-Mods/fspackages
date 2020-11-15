class WT_MapViewRangeRingLayer extends WT_MapViewLabeledRingLayer {
    constructor(id = WT_MapViewRangeRingLayer.ID_DEFAULT, configName = WT_MapViewRangeRingLayer.CONFIG_NAME_DEFAULT) {
        super(id, configName);

        this.addRing(new WT_MapViewRangeRing());
        this.labeledRing.label.anchor = {x: 0.5, y: 0.5};

        this._optsManager = new WT_OptionsManager(this, WT_MapViewRangeRingLayer.OPTIONS_DEF);
    }

    get labeledRing() {
        return this.rings[0].ring;
    }

    _updateStyles(dpiScale) {
        this.labeledRing.ring.setOptions({
            strokeWidth: this.strokeWidth * dpiScale,
            strokeColor: this.strokeColor,
            strokeDash: this.strokeDash.map(e => e * dpiScale),
            outlineWidth: this.outlineWidth * dpiScale,
            outlineColor: this.outlineColor,
            outlineDash: this.outlineDash.map(e => e * dpiScale)
        });

        this.labeledRing.label.setOptions({
            radialAngle: this.labelAngle,
            radialOffset: this.labelOffset * dpiScale,
        });
    }

    isVisible(data) {
        return data.model.rangeRing.show;
    }

    onConfigLoaded(data) {
        for (let property of WT_MapViewRangeRingLayer.CONFIG_PROPERTIES) {
            this._setPropertyFromConfig(property);
        }
    }

    onViewSizeChanged(data) {
        super.onViewSizeChanged(data);
    }

    onAttached(data) {
        super.onAttached(data);
        this._updateStyles(data.dpiScale);
    }
}
WT_MapViewRangeRingLayer.ID_DEFAULT = "RangeRingLayer";
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

class WT_MapViewRangeRing extends WT_MapViewLabeledRing {
    constructor() {
        super(new WT_MapViewRing(), new WT_MapViewRangeRingLabel())
    }

    onUpdate(data) {
        this.ring.center = data.projection.viewTarget;
        this.ring.radius = data.model.range.ratio(data.projection.range) * data.projection.viewHeight;
        this.label.center = this.ring.center;
        this.label.radius = this.ring.radius;
    }
}

class WT_MapViewRangeRingLabel extends WT_MapViewRingLabel {
    _createLabel() {
        this._rangeLabel = new WT_MapViewRangeLabel("");
        return this._rangeLabel.labelElement;
    }

    get rangeLabel() {
        return this._rangeLabel;
    }

    onUpdate(data) {
        super.onUpdate(data);
        this.rangeLabel.onUpdate(data);
    }
}