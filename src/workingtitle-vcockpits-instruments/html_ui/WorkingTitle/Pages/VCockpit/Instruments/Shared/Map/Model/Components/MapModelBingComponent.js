class WT_MapModelBingComponent extends WT_MapModelComponent {
    constructor(bingID, name = WT_MapModelBingComponent.NAME_DEFAULT) {
        super(name);

        this._bingID = bingID;
    }

    get bingID() {
        return this._bingID;
    }
}
WT_MapModelBingComponent.NAME_DEFAULT = "bingMap";