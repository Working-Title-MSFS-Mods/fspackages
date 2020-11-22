class WT_MapViewMiniCompassLayer extends WT_MapViewLayer {
    constructor(className = WT_MapViewMiniCompassLayer.CLASS_DEFAULT, configName = WT_MapViewMiniCompassLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);
    }

    _createHTMLElement() {
        this._miniCompassContainer = document.createElement("div");
        return this._miniCompassContainer;
    }

    /**
     * @readonly
     * @property {HTMLDivElement} miniCompassContainer - the top-level container element for the mini compass.
     * @type {HTMLDivElement}
     */
    get miniCompassContainer() {
        return this._miniCompassContainer;
    }

    /**
     * @readonly
     * @property {HTMLImageElement} compassIcon - the compass arrow image element.
     * @type {HTMLImageElement}
     */
    get compassIcon() {
        return this._compassIcon;
    }

    _initIconLayer(path) {
        this._compassIcon = document.createElement("img");
        this._compassIcon.classList.add(WT_MapViewMiniCompassLayer.ICON_IMAGE_CLASS);
        this._compassIcon.style.zIndex = 1;
        this._compassIcon.src = path;
        this.miniCompassContainer.appendChild(this._compassIcon);
    }

    _initTextLayer() {
        let text = document.createElement("div");
        text.classList.add(WT_MapViewMiniCompassLayer.TEXT_CLASS);
        text.style.zIndex = 2;
        text.innerHTML = "N";
        this.miniCompassContainer.appendChild(text);
    }

    /**
     * @param {WT_MapViewState} state
     */
    onConfigLoaded(state) {
        this._initIconLayer(this.config.iconPath);
        this._initTextLayer();
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        this.compassIcon.style.transform = `rotate(${state.projection.rotation}deg)`;
    }
}
WT_MapViewMiniCompassLayer.CLASS_DEFAULT = "miniCompassLayer";
WT_MapViewMiniCompassLayer.CONFIG_NAME_DEFAULT = "miniCompass";
WT_MapViewMiniCompassLayer.ICON_IMAGE_CLASS = "miniCompassIcon";
WT_MapViewMiniCompassLayer.TEXT_CLASS = "miniCompassText";