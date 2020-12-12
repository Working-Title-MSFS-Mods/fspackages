/**
 * A text box which displays the current map orientation. The use of this layer requires the .orientation module to be added to
 * the map model.
 */
class WT_MapViewOrientationDisplayLayer extends WT_MapViewLayer {
    constructor(displayTexts, className = WT_MapViewOrientationDisplayLayer.CLASS_DEFAULT, configName = WT_MapViewOrientationDisplayLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._displayTexts = displayTexts;
    }

    _createHTMLElement() {
        this._displayBox = document.createElement("div");
        return this._displayBox;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        this._displayBox.innerHTML = this._displayTexts[state.model.orientation.mode];
    }
}
WT_MapViewOrientationDisplayLayer.CLASS_DEFAULT = "orientationDisplayLayer";
WT_MapViewOrientationDisplayLayer.CONFIG_NAME_DEFAULT = "orientation";