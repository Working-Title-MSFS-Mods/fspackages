/**
 * A layer for rendering text labels.
 */
class WT_MapViewTextLabelLayer extends WT_MapViewMultiLayer {
    /**
     * @param {WT_MapViewTextLabelManager} manager - the manager from which to get labels to render.
     * @param {String} [className] - the name of the class to add to the new layer's top-level HTML element's class list.
     * @param {String} [configName] - the name of the property in the map view's config file to be associated with the new layer.
     */
    constructor(manager, className = WT_MapViewTextLabelLayer.CLASS_DEFAULT, configName = WT_MapViewTextLabelLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._manager = manager;

        this._textLayer = new WT_MapViewCanvas(true, true);
        this.addSubLayer(this._textLayer);
    }

    /**
     * @readonly
     * @property {WT_MapViewTextLabelManager} manager - this layer's label manager.
     * @type {WT_MapViewTextLabelManager}
     */
    get manager() {
        return this._manager;
    }

    _drawLabels(data, labels) {
        labels = Array.from(labels);
        labels.sort(
            (a, b) => {
                let value = a.priority - b.priority;
                if (a.alwaysShow !== b.alwaysShow) {
                    value = b.alwaysShow ? -1 : 1;
                }
                return value;
            }
        )
        this._textLayer.buffer.clear();
        for (let label of labels) {
            label.draw(data, this._textLayer.buffer.context);
        }
        this._textLayer.display.clear();
        this._textLayer.copyBufferToCanvas();
        this._textLayer.resetBuffer();
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        this.manager.onUpdate(state);
        this._drawLabels(state, this.manager.getVisibleLabels());
    }
}
WT_MapViewTextLabelLayer.CLASS_DEFAULT = "textLabelLayer";
WT_MapViewTextLabelLayer.CONFIG_NAME_DEFAULT = "textLabel";