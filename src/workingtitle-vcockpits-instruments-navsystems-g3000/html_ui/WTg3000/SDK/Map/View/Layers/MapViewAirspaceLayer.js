class WT_MapViewAirspaceLayer extends WT_MapViewMultiLayer {
    constructor(className = WT_MapViewAirspaceLayer.CLASS_DEFAULT, configName = WT_MapViewAirspaceLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        /**
         * @type {Map<String,WT_MapViewRegisteredCityEntry>}
         */
        this._registeredCities = new Map();

        this._airspaceLayer = new WT_MapViewPersistentCanvas(WT_MapViewAirspaceLayer.OVERDRAW_FACTOR);
        this.addSubLayer(this._airspaceLayer);

        this._searcher = new WT_AirspaceSearcher();

        this._optsManager = new WT_OptionsManager(this, WT_MapViewCityLayer.OPTIONS_DEF);
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        super.onUpdate(state);

        this._airspaceLayer.update(state);

        if (!this._searcher.isBusy) {
            this._searcher.search(state.projection.center);
        }
    }
}
WT_MapViewAirspaceLayer.CLASS_DEFAULT = "airspaceLayer";
WT_MapViewAirspaceLayer.CONFIG_NAME_DEFAULT = "airspaces";
WT_MapViewAirspaceLayer.OVERDRAW_FACTOR = 1.91421356237;