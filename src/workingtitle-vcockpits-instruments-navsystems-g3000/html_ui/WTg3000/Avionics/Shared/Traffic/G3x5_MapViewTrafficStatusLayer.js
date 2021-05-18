class WT_G3x5_MapViewTrafficStatusLayer extends WT_MapViewLayer {
    constructor(operatingModeText, altitudeRestrictionModeText, centerBannerText, motionVectorModeText, className = WT_G3x5_MapViewTrafficStatusLayer.CLASS_DEFAULT, configName = WT_G3x5_MapViewTrafficStatusLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._operatingModeText = operatingModeText;
        this._altitudeRestrictionText = altitudeRestrictionModeText;
        this._centerBannerText = centerBannerText;
        this._motionVectorModeText = motionVectorModeText;

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

    _initAltitudeRestrictionMode() {
        this._altitudeRestrictionMode = new WT_G3x5_MapViewTrafficAltitudeRestrictionModeHTMLElement();
        this._altitudeRestrictionMode.setContext({text: this._altitudeRestrictionText});
        this._topInfos.appendChild(this._altitudeRestrictionMode);
    }

    _initTopInfos() {
        this._topInfos = document.createElement("div");
        this._topInfos.classList.add(WT_G3x5_MapViewTrafficStatusLayer.TOP_INFO_CLASS);

        this._initOperatingMode();
        this._initAltitudeRestrictionMode();

        this.htmlElement.appendChild(this._topInfos);
    }

    _initCenterBanner() {
        this._centerBanner = new WT_G3x5_MapViewTrafficCenterBannerHTMLElement();
        this._centerBanner.setContext({text: this._centerBannerText});
        this._centerBanner.setAttribute("style", "position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);");
        this.htmlElement.appendChild(this._centerBanner);
    }

    _initMotionVectorMode() {
        this._motionVectorMode = new WT_G3x5_MapViewTrafficMotionVectorModeHTMLElement();
        this._motionVectorMode.setContext({text: this._motionVectorModeText});
        this.htmlElement.appendChild(this._motionVectorMode);
    }

    _initChildren() {
        this._initTopInfos();
        this._initCenterBanner();
        this._initMotionVectorMode();
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        this._operatingMode.update(state);
        this._altitudeRestrictionMode.update(state);
        this._centerBanner.update(state);
        this._motionVectorMode.update(state);
    }
}
WT_G3x5_MapViewTrafficStatusLayer.CLASS_DEFAULT = "trafficStatusLayer";
WT_G3x5_MapViewTrafficStatusLayer.CONFIG_NAME_DEFAULT = "trafficStatus";
WT_G3x5_MapViewTrafficStatusLayer.TOP_INFO_CLASS = "trafficStatusTopInfo";

class WT_G3x5_MapViewTrafficOperatingModeHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_MapViewTrafficOperatingModeHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        this._mode = new WT_CachedElement(this.shadowRoot.querySelector(`#mode`));
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
    }

    setContext(context) {
        this._context = context;
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateDisplay(state) {
        let trafficSystem = state.model.traffic.trafficSystem;
        this._mode.textContent = this._context.text[trafficSystem.operatingMode];
        this._mode.setAttribute("alert", `${(trafficSystem.isStandby() && !state.model.airplane.sensors.isOnGround()) ? "caution" : "none"}`);
    }

    /**
     * @param {WT_MapViewState} state
     */
    update(state) {
        if (!this._isInit || !this._context) {
            return;
        }

        this._updateDisplay(state);
    }
}
WT_G3x5_MapViewTrafficOperatingModeHTMLElement.NAME = "wt-map-view-traffic-operatingmode";
WT_G3x5_MapViewTrafficOperatingModeHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_MapViewTrafficOperatingModeHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            position: relative;
            width: 100%;
            background-color: black;
            border: solid 1px white;
            border-radius: 3px;
            text-align: center;
            display: block;
        }

        #mode {
            margin: var(--traffic-operatingmode-margin, 0 0.1em);
            color: white;
        }
        #mode[alert="caution"] {
            color: var(--wt-g3x5-amber);
        }
    </style>
    <div id="mode"></div>
`;

customElements.define(WT_G3x5_MapViewTrafficOperatingModeHTMLElement.NAME, WT_G3x5_MapViewTrafficOperatingModeHTMLElement);

class WT_G3x5_MapViewTrafficAltitudeRestrictionModeHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_MapViewTrafficAltitudeRestrictionModeHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        this._mode = new WT_CachedElement(this.shadowRoot.querySelector(`#mode`));
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
    }

    setContext(context) {
        this._context = context;
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateDisplay(state) {
        this._mode.textContent = this._context.text[state.model.traffic.altitudeRestrictionMode];
    }

    /**
     * @param {WT_MapViewState} state
     */
    update(state) {
        if (!this._isInit || !this._context) {
            return;
        }

        this._updateDisplay(state);
    }
}
WT_G3x5_MapViewTrafficAltitudeRestrictionModeHTMLElement.NAME = "wt-map-view-traffic-altituderestrictionmode";
WT_G3x5_MapViewTrafficAltitudeRestrictionModeHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_MapViewTrafficAltitudeRestrictionModeHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            position: relative;
            width: 100%;
            background-color: black;
            border: solid 1px white;
            border-radius: 3px;
            text-align: center;
            display: block;
        }

        #mode {
            margin: var(--traffic-altituderestriction-margin, 0 0.1em);
            color: white;
        }
    </style>
    <div id="mode"></div>
`;

customElements.define(WT_G3x5_MapViewTrafficAltitudeRestrictionModeHTMLElement.NAME, WT_G3x5_MapViewTrafficAltitudeRestrictionModeHTMLElement);

class WT_G3x5_MapViewTrafficCenterBannerHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_MapViewTrafficCenterBannerHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        this._wrapper = new WT_CachedElement(this.shadowRoot.querySelector(`#wrapper`));
        this._text = new WT_CachedElement(this.shadowRoot.querySelector(`#text`));
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
    }

    setContext(context) {
        this._context = context;
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateDisplay(state) {
        let trafficSystem = state.model.traffic.trafficSystem;
        let text = this._context.text[trafficSystem.operatingMode];
        if (text !== "") {
            this._wrapper.setAttribute("show", "true");
            this._text.textContent = this._context.text[trafficSystem.operatingMode];
            this._wrapper.setAttribute("alert", `${(trafficSystem.isStandby() && !state.model.airplane.sensors.isOnGround()) ? "caution" : "none"}`);
        } else {
            this._wrapper.setAttribute("show", "false");
        }
    }

    /**
     * @param {WT_MapViewState} state
     */
    update(state) {
        if (!this._isInit || !this._context) {
            return;
        }

        this._updateDisplay(state);
    }
}
WT_G3x5_MapViewTrafficCenterBannerHTMLElement.NAME = "wt-map-view-traffic-centerbanner";
WT_G3x5_MapViewTrafficCenterBannerHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_MapViewTrafficCenterBannerHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper {
            display: none;
            background-color: var(--traffic-centerbanner-background-color, black);
            border: var(--traffic-centerbanner-border, solid 1px white);
            border-radius: var(--traffic-centerbanner-border-radius, 3px);
        }
        #wrapper[show="true"] {
            display: block;
        }
            #text {
                margin: var(--traffic-centerbanner-padding, 0 0.2em);
                color: white;
            }
            #wrapper[alert="caution"] #text {
                color: var(--wt-g3x5-amber);
            }
    </style>
    <div id="wrapper">
        <div id="text"></div>
    </wrapper>
`;

customElements.define(WT_G3x5_MapViewTrafficCenterBannerHTMLElement.NAME, WT_G3x5_MapViewTrafficCenterBannerHTMLElement);

class WT_G3x5_MapViewTrafficMotionVectorModeHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_MapViewTrafficMotionVectorModeHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        this._mode = new WT_CachedElement(this.shadowRoot.querySelector(`#mode`));
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
    }

    setContext(context) {
        this._context = context;
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateDisplay(state) {
        this._mode.textContent = this._context.text[state.model.traffic.motionVectorMode];
    }

    /**
     * @param {WT_MapViewState} state
     */
    update(state) {
        if (!this._isInit || !this._context) {
            return;
        }

        this._updateDisplay(state);
    }
}
WT_G3x5_MapViewTrafficMotionVectorModeHTMLElement.NAME = "wt-map-view-traffic-motionvectormode";
WT_G3x5_MapViewTrafficMotionVectorModeHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_MapViewTrafficMotionVectorModeHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            background-color: black;
            border: solid 1px white;
            border-radius: 3px;
            text-align: center;
        }

        #text {
            margin: var(--traffic-motionvectormode-padding, 0 0.2em);
            color: white;
        }
            #mode {
                color: var(--wt-g3x5-lightblue);
            }
    </style>
    <div id="text">
        Motion: <span id="mode"></span>
    </div>
`;

customElements.define(WT_G3x5_MapViewTrafficMotionVectorModeHTMLElement.NAME, WT_G3x5_MapViewTrafficMotionVectorModeHTMLElement);