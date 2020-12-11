class WT_MapViewAirplaneLayer extends WT_MapViewLayer {
    constructor(className = WT_MapViewAirplaneLayer.CLASS_DEFAULT, configName = WT_MapViewAirplaneLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._optsManager = new WT_OptionsManager(this, WT_MapViewAirplaneLayer.OPTIONS_DEF);
    }

    _createHTMLElement() {
        this._icon = document.createElementNS(Avionics.SVG.NS, "svg");
        this._icon.setAttribute("viewBox", `0 0 64 64`);
        this._icon.style.position = "absolute";
        this._icon.style.overflow = "hidden";
        this._image = document.createElementNS(Avionics.SVG.NS, "image");
        this._image.setAttribute("width", "100%");
        this._image.setAttribute("height", "100%");
        this._icon.appendChild(this._image);
        return this._icon;
    }

    _resizeIcon(size) {
        this._icon.style.width = `${size}px`;
        this._icon.style.height = `${size}px`;
        this._icon.style.left = `${-size / 2}px`;
        this._icon.style.top = `${-size / 2}px`;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onConfigLoaded(state) {
        this._setPropertyFromConfig("iconSize");

        this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", this.config.imagePath);
    }

    /**
     * @param {WT_MapViewState} state
     */
    onProjectionViewChanged(state) {
        this._resizeIcon(this.iconSize * state.dpiScale);
    }

    onAttached(state) {
        this.onProjectionViewChanged(state);
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        if (!state.viewPlane) {
            return;
        }
        let iconRotation = state.model.airplane.headingTrue + state.projection.rotation;
        this._icon.style.transform = `translate(${state.viewPlane.x}px, ${state.viewPlane.y}px) rotate(${iconRotation}deg)`;
    }
}
WT_MapViewAirplaneLayer.CLASS_DEFAULT = "airplaneLayer";
WT_MapViewAirplaneLayer.CONFIG_NAME_DEFAULT = "airplane";
WT_MapViewAirplaneLayer.OPTIONS_DEF = {
    iconSize: {default: 60, auto: true}
};