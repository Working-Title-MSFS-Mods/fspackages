class WT_MapModelTrackVectorModule extends WT_MapModelModule {
    constructor(name = WT_MapModelTrackVectorModule.NAME_DEFAULT) {
        super(name);

        this._lookahead = new WT_NumberUnit(0, WT_Unit.SECOND);

        this._optsManager.addOptions(WT_MapModelTrackVectorModule.OPTIONS_DEF);
    }

    get lookahead() {
        return this._lookahead.copy();
    }

    set lookahead(lookahead) {
        this._lookahead.copyFrom(lookahead);
    }
}
WT_MapModelTrackVectorModule.NAME_DEFAULT = "trackVector";
WT_MapModelTrackVectorModule.OPTIONS_DEF = {
    show: {default: false, auto: true},
    lookahead: {}
};