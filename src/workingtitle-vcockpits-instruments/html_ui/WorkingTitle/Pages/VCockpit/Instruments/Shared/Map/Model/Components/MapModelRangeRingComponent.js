class WT_MapModelRangeRingComponent extends WT_MapModelComponent {
    constructor(name = WT_MapModelRangeRingComponent.NAME_DEFAULT) {
        super(name);

        this._optsManager.addOptions({
            show: {default: true, auto: true}
        });
    }
}
WT_MapModelRangeRingComponent.NAME_DEFAULT = "rangeRing";