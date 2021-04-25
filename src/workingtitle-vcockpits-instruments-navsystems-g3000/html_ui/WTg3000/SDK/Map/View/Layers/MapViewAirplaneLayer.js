/**
 * A symbol representing the player airplane. The symbol is placed at the airplane's present position, and its
 * orientation is synchronized to the airplane's heading. The use of this layer requires the .airplaneIcon
 * module to be added to the map model.
 */
class WT_MapViewAirplaneLayer extends WT_MapViewLayer {
    /**
     * @param {String} [className] - the name of the class to add to the new layer's top-level HTML element's class list.
     * @param {String} [configName] - the name of the property in the map view's config file to be associated with the new layer.
     */
    constructor(className = WT_MapViewAirplaneLayer.CLASS_DEFAULT, configName = WT_MapViewAirplaneLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._optsManager = new WT_OptionsManager(this, WT_MapViewAirplaneLayer.OPTIONS_DEF);

        this._lastRotation = 0;
        this._lastViewPos = {x: 0, y: 0};
    }

    _createHTMLElement() {
        this._icon = document.createElement("img");
        this._icon.style.position = "absolute";
        this._icon.style.overflow = "hidden";
        this._icon.style.transform = "scale3d(1, 1, 1)"; // create CoherentGT layer
        return this._icon;
    }

    _resizeIcon(size, anchor) {
        this._icon.style.width = `${size}px`;
        this._icon.style.height = `${size}px`;
        this._icon.style.left = `${-size * anchor[0]}px`;
        this._icon.style.top = `${-size * anchor[1]}px`;
        this._icon.style.transformOrigin = `${anchor[0] * 100}% ${anchor[1] * 100}%`;
    }

    /**
     * @param {WT_MapViewState} state
     */
    isVisible(state) {
        return state.model.airplaneIcon.show;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onConfigLoaded(state) {
        for (let property of WT_MapViewAirplaneLayer.CONFIG_PROPERTIES) {
            this._setPropertyFromConfig(property);
        }

        this._icon.src = this.config.imagePath;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onProjectionViewChanged(state) {
        this._resizeIcon(this.iconSize * state.dpiScale, this.iconAnchor);
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

        let iconRotation = Math.round((state.model.airplane.navigation.headingTrue() + state.projection.rotation) * 10) / 10;
        let viewPosX = Math.round(state.viewPlane.x * 10) / 10;
        let viewPosY = Math.round(state.viewPlane.y * 10) / 10;

        if (iconRotation !== this._lastRotation || viewPosX !== this._lastViewPos.x || viewPosY !== this._lastViewPos.y) {
            this._icon.style.transform = `translate(${viewPosX}px, ${viewPosY}px) rotate(${iconRotation}deg) scale3d(1, 1, 1)`;
            this._lastRotation = iconRotation;
            this._lastViewPos.x = viewPosX;
            this._lastViewPos.y = viewPosY;
        }
    }
}
WT_MapViewAirplaneLayer.CLASS_DEFAULT = "airplaneLayer";
WT_MapViewAirplaneLayer.CONFIG_NAME_DEFAULT = "airplane";
WT_MapViewAirplaneLayer.OPTIONS_DEF = {
    iconSize: {default: 60, auto: true},
    iconAnchor: {default: [0.5, 0.5], auto: true}
};
WT_MapViewAirplaneLayer.CONFIG_PROPERTIES = [
    "iconSize",
    "iconAnchor"
];