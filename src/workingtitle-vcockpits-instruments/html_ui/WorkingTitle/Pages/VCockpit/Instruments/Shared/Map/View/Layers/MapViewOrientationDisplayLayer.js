class WT_MapViewOrientationDisplayLayer extends WT_MapViewLayer {
    constructor(displayTexts, className = WT_MapViewOrientationDisplayLayer.CLASS_DEFAULT, configName = WT_MapViewOrientationDisplayLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._displayTexts = displayTexts;
    }

    _createHTMLElement() {
        this._displayBox = document.createElement("div");
        return this._displayBox;
    }

    get displayBox() {
        return this._displayBox;
    }

    get displayTexts() {
        return this._displayTexts;
    }

    onUpdate(data) {
        this.displayBox.innerHTML = this.displayTexts[data.model.orientation.mode];
    }
}
WT_MapViewOrientationDisplayLayer.CLASS_DEFAULT = "orientationDisplayLayer";
WT_MapViewOrientationDisplayLayer.CONFIG_NAME_DEFAULT = "orientation";