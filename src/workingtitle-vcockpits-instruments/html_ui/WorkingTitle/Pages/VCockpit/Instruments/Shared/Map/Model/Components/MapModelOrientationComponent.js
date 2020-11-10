class WT_MapModelOrientationComponent extends WT_MapModelComponent {
    constructor(name = WT_MapModelOrientationComponent.NAME_DEFAULT) {
        super(name);

        this._optsManager.addOptions({
            mode: {default: 0, auto: true}
        });
    }
}
WT_MapModelOrientationComponent.NAME_DEFAULT = "orientation";