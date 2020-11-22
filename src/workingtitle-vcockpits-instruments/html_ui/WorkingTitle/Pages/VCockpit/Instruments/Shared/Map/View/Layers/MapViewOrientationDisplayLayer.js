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
     * @readonly
     * @property {HTMLDivElement} displayBox - the orientation display box element.
     * @type {HTMLDivElement}
     */
    get displayBox() {
        return this._displayBox;
    }

    /**
     * @readonly
     * @property {String[]} displayTexts - the text to display for each orientation mode.
     * @type {String[]}
     */
    get displayTexts() {
        return this._displayTexts;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        this.displayBox.innerHTML = this.displayTexts[state.model.orientation.mode];
    }
}
WT_MapViewOrientationDisplayLayer.CLASS_DEFAULT = "orientationDisplayLayer";
WT_MapViewOrientationDisplayLayer.CONFIG_NAME_DEFAULT = "orientation";