class WT_MapViewPointerLayer extends WT_MapViewLayer {
    constructor(className = WT_MapViewPointerLayer.CLASS_DEFAULT, configName = WT_MapViewPointerLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._optsManager = new WT_OptionsManager(this, WT_MapViewPointerLayer.OPTIONS_DEF);

        this._tempVector = new WT_GVector2(0, 0);
    }

    _createHTMLElement() {
        this._pointer = document.createElementNS(Avionics.SVG.NS, "svg");
        this._pointer.setAttribute("viewBox", `0 0 64 64`);
        this._pointer.style.position = "absolute";
        this._pointer.style.overflow = "hidden";
        this._image = document.createElementNS(Avionics.SVG.NS, "image");
        this._image.setAttribute("width", "100%");
        this._image.setAttribute("height", "100%");
        this._pointer.appendChild(this._image);
        return this._pointer;
    }

    _resizeCursor(size) {
        this._pointer.style.left = `0`;
        this._pointer.style.top = `0`;
        this._pointer.style.width = `${size}px`;
        this._pointer.style.height = `${size}px`;
    }

    /**
     * @param {WT_MapViewState} state
     */
    isVisible(state) {
        return state.model.pointer.show;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onConfigLoaded(state) {
        this._setPropertyFromConfig("size");

        this._image.setAttributeNS("http://www.w3.org/1999/xlink", "href", this.config.imagePath);
    }

    /**
     * @param {WT_MapViewState} state
     */
    onProjectionViewChanged(state) {
        this._resizeCursor(this.size * state.dpiScale);
    }

    onAttached(state) {
        this.onProjectionViewChanged(state);
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        let position = state.projection.relXYToAbsXY(state.model.pointer.position, this._tempVector);
        this._pointer.style.transform = `translate(${position.x}px, ${position.y}px)`;
    }
}
WT_MapViewPointerLayer.CLASS_DEFAULT = "pointerLayer";
WT_MapViewPointerLayer.CONFIG_NAME_DEFAULT = "pointer";
WT_MapViewPointerLayer.OPTIONS_DEF = {
    size: {default: 20, auto: true}
};