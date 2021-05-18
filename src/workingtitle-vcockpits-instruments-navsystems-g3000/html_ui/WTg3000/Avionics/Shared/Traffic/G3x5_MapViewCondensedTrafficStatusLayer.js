class WT_G3x5_MapViewCondensedTrafficStatusLayer extends WT_MapViewLayer {
    constructor(operatingModeText, centerBannerText, className = WT_G3x5_MapViewCondensedTrafficStatusLayer.CLASS_DEFAULT, configName = WT_G3x5_MapViewCondensedTrafficStatusLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._operatingModeText = operatingModeText;
        this._centerBannerText = centerBannerText;

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

    _initOperatingMode() {
        this._operatingMode = new WT_G3x5_MapViewTrafficOperatingModeHTMLElement();
        this._operatingMode.setContext({text: this._operatingModeText});
        this._topInfos.appendChild(this._operatingMode);
    }

    _initTopInfos() {
        this._topInfos = document.createElement("div");
        this._topInfos.classList.add(WT_G3x5_MapViewTrafficStatusLayer.TOP_INFO_CLASS);

        this._initOperatingMode();

        this.htmlElement.appendChild(this._topInfos);
    }

    _initCenterBanner() {
        this._centerBanner = new WT_G3x5_MapViewTrafficCenterBannerHTMLElement();
        this._centerBanner.setContext({text: this._centerBannerText});
        this._centerBanner.setAttribute("style", "position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);");
        this.htmlElement.appendChild(this._centerBanner);
    }

    _initChildren() {
        this._initTopInfos();
        this._initCenterBanner();
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        this._operatingMode.update(state);
        this._centerBanner.update(state);
    }
}
WT_G3x5_MapViewCondensedTrafficStatusLayer.CLASS_DEFAULT = "trafficStatusLayer";
WT_G3x5_MapViewCondensedTrafficStatusLayer.CONFIG_NAME_DEFAULT = "trafficStatus";
WT_G3x5_MapViewCondensedTrafficStatusLayer.TOP_INFO_CLASS = "trafficStatusTopInfo";