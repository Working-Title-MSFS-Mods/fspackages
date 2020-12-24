/**
 * A text box which displays the current nominal map range.
 */
class WT_MapViewRangeDisplayLayer extends WT_MapViewLayer {
    constructor(className = WT_MapViewRangeDisplayLayer.CLASS_DEFAULT, configName = WT_MapViewRangeDisplayLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);
    }

    _createHTMLElement() {
        this._rangeDisplay = new WT_MapViewRangeDisplay();
        return this._rangeDisplay;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        this._rangeDisplay.update(state);
    }
}
WT_MapViewRangeDisplayLayer.CLASS_DEFAULT = "rangeDisplayLayer";
WT_MapViewRangeDisplayLayer.CONFIG_NAME_DEFAULT = "range";