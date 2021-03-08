class WT_MapModelPointerModule extends WT_MapModelModule {
    constructor(name = WT_MapModelPointerModule.NAME_DEFAULT) {
        super(name);

        this._position = new WT_GVector2(0, 0);
        this._measureReference = new WT_GeoPoint(0, 0, 0);
        this._isMeasureReferenceNull = true;

        this._optsManager.addOptions(WT_MapModelPointerModule.OPTIONS_DEF);
    }

    get position() {
        return this._position.readonly();
    }

    set position(position) {
        this._position.set(position);
    }

    get measureReference() {
        if (this._isMeasureReferenceNull) {
            return null;
        }
        return this._measureReference.readonly();
    }

    set measureReference(reference) {
        if (reference === null) {
            this._isMeasureReferenceNull = true;
        } else {
            this._measureReference.set(reference);
            this._isMeasureReferenceNull = false;
        }
    }
}
WT_MapModelPointerModule.NAME_DEFAULT = "pointer";
WT_MapModelPointerModule.OPTIONS_DEF = {
    show: {default: false, auto: true},
    position: {},
    measureReference: {}
};