class WT_G3x5_MapViewCondensedTrafficStatusLayer extends WT_MapViewLayer {
    constructor(operatingModeText, className = WT_G3x5_MapViewCondensedTrafficStatusLayer.CLASS_DEFAULT, configName = WT_G3x5_MapViewCondensedTrafficStatusLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._operatingModeText = operatingModeText;

        this._initChildren();
    }

    _createHTMLElement() {
        let container = document.createElement("div");
        container.style.position = "absolute";
        container.style.left = 0;
        container.style.top = 0;
        container.style.width = "100%";
        container.style.height = "100%";
        return container;
    }

    _initChildren() {
        let topInfos = document.createElement("div");
        topInfos.classList.add(WT_G3x5_MapViewTrafficStatusLayer.TOP_INFO_CLASS);

        this._operatingMode = new WT_G3x5_MapViewTrafficOperatingModeHTMLElement();
        this._operatingMode.setContext({text: this._operatingModeText});
        topInfos.appendChild(this._operatingMode);

        this.htmlElement.appendChild(topInfos);
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        this._operatingMode.update(state);
    }
}
WT_G3x5_MapViewCondensedTrafficStatusLayer.CLASS_DEFAULT = "trafficStatusLayer";
WT_G3x5_MapViewCondensedTrafficStatusLayer.CONFIG_NAME_DEFAULT = "trafficStatus";
WT_G3x5_MapViewCondensedTrafficStatusLayer.TOP_INFO_CLASS = "trafficStatusTopInfo";