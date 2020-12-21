/**
 * Represents a navigational map. Each map has an associated model, view, and list of settings (controllers, represented by WT_MapSetting objects).
 * Settings may be synced across multiple maps.
 */
class WT_MapElement extends NavSystemElement {
    /**
     * @param {String} instrumentID - A unique string identifier for the map.
     */
    constructor(instrumentID) {
        super();
        this.instrumentID = instrumentID;
    }

    init(root) {
        this._model = new WT_MapModel();
        this._view = root.querySelector("map-view");
        if (this._view) {
            this.view.setModel(this._model);
        }
        this._controller = new WT_MapController(this.instrumentID, this._model, this._view);
    }

    /**
     * @readonly
     * @property {WT_MapModel} model
     * @returns {WT_MapModel} the model associated with this map.
     */
    get model() {
        return this._model;
    }

    /**
     * @readonly
     * @property {WT_MapView} view
     * @returns {WT_MapView} the view associated with this map.
     */
    get view() {
        return this._view;
    }

    /**
     * @readonly
     * @property {WT_MapController} controller
     * @returns {WT_MapController} the controller associated with this map.
     */
    get controller() {
        return this._controller;
    }

    /**
     * This method will be called on every update step.
     */
    onUpdate(deltaTime) {
        if (this.view) {
            this.view.update();
        }
    }
}