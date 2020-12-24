class WT_MapModelBingModule extends WT_MapModelModule {
    constructor(bingID, name = WT_MapModelBingModule.NAME_DEFAULT) {
        super(name);

        this._bingID = bingID;
    }

    get bingID() {
        return this._bingID;
    }
}
WT_MapModelBingModule.NAME_DEFAULT = "bingMap";