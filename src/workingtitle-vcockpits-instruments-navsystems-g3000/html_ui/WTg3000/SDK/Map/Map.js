/**
 * Represents a navigational map. Each map has an associated model, view, and list of settings (controllers, represented by WT_MapSetting objects).
 * Settings may be synced across multiple maps.
 */
class WT_Map {
    /**
     * @param {String} instrumentID - A unique string identifier for the map.
     */
    constructor(instrumentID) {
        this.instrumentID = instrumentID;
    }

    /**
     * Initializes the map.
     * @param {WT_MapView} [viewElement] - the map view HTML element. If this argument is omitted, then a new map view will be created
     *                                     and can later be accessed through the .view property.
     */
    init(viewElement) {
        this._model = new WT_MapModel();
        if (!viewElement) {
            viewElement = new WT_MapView();
        }
        this._view = viewElement;
        if (this._view) {
            this.view.setModel(this._model);
        }
        this._controller = new WT_MapController(this.instrumentID, this._model, this._view);
    }

    /**
     * @readonly
     * @property {WT_MapModel} model - the model associated with this map.
     * @type {WT_MapModel}
     */
    get model() {
        return this._model;
    }

    /**
     * @readonly
     * @property {WT_MapView} view - the view associated with this map.
     * @type {WT_MapView}
     */
    get view() {
        return this._view;
    }

    /**
     * @readonly
     * @property {WT_MapController} controller - the controller associated with this map.
     * @type {WT_MapController}
     */
    get controller() {
        return this._controller;
    }

    /**
     * This method should be called on every update step.
     */
    update() {
        if (this.view) {
            this.view.update();
        }
    }
}