class WT_MapModelTrackVectorComponent extends WT_MapModelComponent {
    constructor(name = WT_MapModelTrackVectorComponent.NAME_DEFAULT) {
        super(name);

        this._lookahead = new WT_NumberUnit(0, WT_Unit.SECOND);

        this._optsManager.addOptions(WT_MapModelTrackVectorComponent.OPTIONS_DEF);
    }

    get lookahead() {
        return this._lookahead.copy();
    }

    set lookahead(lookahead) {
        this._lookahead.copyFrom(lookahead);
    }
}
WT_MapModelTrackVectorComponent.NAME_DEFAULT = "trackVector";
WT_MapModelTrackVectorComponent.OPTIONS_DEF = {
    show: {default: false, auto: true},
    lookahead: {}
};