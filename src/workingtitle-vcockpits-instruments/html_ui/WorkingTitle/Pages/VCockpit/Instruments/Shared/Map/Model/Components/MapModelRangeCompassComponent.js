class WT_MapModelRangeCompassComponent extends WT_MapModelComponent {
    constructor(name = WT_MapModelRangeCompassComponent.NAME_DEFAULT) {
        super(name);

        this._optsManager.addOptions({
            show: {default: true, auto: true}
        });
    }
}
WT_MapModelRangeCompassComponent.NAME_DEFAULT = "rangeCompass";