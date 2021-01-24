/**
 * A crosshair positioned at the target location of the map view.
 */
class WT_MapViewCrosshairLayer extends WT_MapViewLayer {
    /**
     * @param {String} [className] - the name of the class to add to the new layer's top-level HTML element's class list.
     * @param {String} [configName] - the name of the property in the map view's config file to be associated with the new layer.
     */
    constructor(className = WT_MapViewCrosshairLayer.CLASS_DEFAULT, configName = WT_MapViewCrosshairLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._optsManager = new WT_OptionsManager(this, WT_MapViewCrosshairLayer.OPTIONS_DEF);
    }

    _createHTMLElement() {
        this._crosshair = document.createElementNS(Avionics.SVG.NS, "svg");
        this._crosshair.style.position = "absolute";
        this._crosshair.style.overflow = "hidden";

        this._outline = document.createElementNS(Avionics.SVG.NS, "path");
        this._outline.setAttribute("fill-opacity", "0");
        this._outline.setAttribute("stroke-opacity", "1");

        this._stroke = document.createElementNS(Avionics.SVG.NS, "path");
        this._stroke.setAttribute("fill-opacity", "0");
        this._stroke.setAttribute("stroke-opacity", "1");

        this._crosshair.appendChild(this._outline);
        this._crosshair.appendChild(this._stroke);

        return this._crosshair;
    }

    _restyleCrosshair(size, strokeWidth, outlineWidth) {
        this._crosshair.setAttribute("viewBox", `0 0 ${size} ${size}`);
        this._crosshair.style.left = `${-size / 2}px`;
        this._crosshair.style.top = `${-size / 2}px`;
        this._crosshair.style.width = `${size}px`;
        this._crosshair.style.height = `${size}px`;

        this._outline.setAttribute("d", `M ${size / 2} 0 L ${size / 2} ${size} M 0 ${size / 2} L ${size} ${size / 2}`);
        this._stroke.setAttribute("d", `M ${size / 2} ${outlineWidth} L ${size / 2} ${size - outlineWidth} M ${outlineWidth} ${size / 2} L ${size - outlineWidth} ${size / 2}`);

        this._outline.setAttribute("stroke-width", strokeWidth + 2 * outlineWidth);
        this._stroke.setAttribute("stroke-width", strokeWidth);
    }

    /**
     * @param {WT_MapViewState} state
     */
    isVisible(state) {
        return state.model.crosshair.show;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onConfigLoaded(state) {
        this._setPropertyFromConfig("size");

        this._outline.setAttribute("stroke", this.outlineColor);
        this._stroke.setAttribute("stroke", this.strokeColor);
    }

    /**
     * @param {WT_MapViewState} state
     */
    onProjectionViewChanged(state) {
        this._restyleCrosshair(this.size * state.dpiScale, this.strokeWidth * state.dpiScale, this.outlineWidth * state.dpiScale);
    }

    onAttached(state) {
        this._outline.setAttribute("stroke", this.outlineColor);
        this._stroke.setAttribute("stroke", this.strokeColor);
        this.onProjectionViewChanged(state);
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        this._crosshair.style.transform = `translate(${state.projection.viewTarget.x}px, ${state.projection.viewTarget.y}px)`;
    }
}
WT_MapViewCrosshairLayer.CLASS_DEFAULT = "crosshairLayer";
WT_MapViewCrosshairLayer.CONFIG_NAME_DEFAULT = "crosshair";
WT_MapViewCrosshairLayer.OPTIONS_DEF = {
    size: {default: 16, auto: true},
    strokeWidth: {default: 2, auto: true},
    strokeColor: {default: "white", auto: true},
    outlineWidth: {default: 1, auto: true},
    outlineColor: {default: "black", auto: true}
};