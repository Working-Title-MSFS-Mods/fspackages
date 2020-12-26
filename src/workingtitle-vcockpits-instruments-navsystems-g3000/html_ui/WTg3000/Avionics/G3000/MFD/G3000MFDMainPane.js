class WT_G3000MFDMainPaneElement extends NavSystemElementGroup {
    constructor(icaoWaypointFactory, icaoSearchers, flightPlanManager) {
        super([
            new WT_G3x5NavMap("MFD", icaoWaypointFactory, icaoSearchers, flightPlanManager),
            new WT_G3x5WeatherRadar("MFD")
        ]);

        this._showWeatherRadar = false;
    }

    /**
     *
     * @param {HTMLElement} root
     */
    init(root) {
        super.init(root);

        this._htmlElement = root;

        /**
         * @type {WT_G3x5NavMap}
         */
        this._map = this.elements[0];

        /**
         * @type {WT_G3x5WeatherRadar}
         */
        this._weatherRadar = this.elements[1];
    }

    _updateVisibility() {
        let showWeatherRadar = this._weatherRadar.isVisible();
        if (showWeatherRadar !== this._showWeatherRadar) {
            this._htmlElement.showWeather = showWeatherRadar;
            this._showWeatherRadar = showWeatherRadar;
        }
    }

    onUpdate(deltaTime) {
        this._updateVisibility();
        if (this._showWeatherRadar) {
            this._weatherRadar.onUpdate(deltaTime);
        }
        this._map.onUpdate(deltaTime);
    }
}

class WT_G3000MFDMainPaneHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3000MFDMainPaneHTMLElement.TEMPLATE_SHADOW.content.cloneNode(true));

        this._showWeather = false;
    }

    get showWeather() {
        return this._showWeather;
    }

    set showWeather(value) {
        this._showWeather = value === true;
        this._updateVisibility();
    }

    connectedCallback() {
        this._wrapper = this.shadowRoot.querySelector(`#wrapper`);
        this._updateVisibility();
    }

    _updateVisibility() {
        if (!this._wrapper) {
            return;
        }

        if (this.showWeather) {
            this._wrapper.setAttribute("layout", "weather");
        }
    }
}
WT_G3000MFDMainPaneHTMLElement.TEMPLATE_SHADOW = document.createElement("template");
WT_G3000MFDMainPaneHTMLElement.TEMPLATE_SHADOW.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            background-color: black;
            display: block;
        }
            .content {
                position: relative;
                width: 100%;
                height: 100%;
            }
            #map {
                display: block;
            }
            #weather {
                display: none;
            }

        #wrapper[layout=weather] {
            position: relative;
            width: 100%;
            height: 100%;
            background-color: black;
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto;
        }
            #wrapper[layout=weather] #weather {
                display: block;
            }
    </style>
    <div id="wrapper">
        <slot id="map" class="content" name="map"></slot>
        <slot id="weather" class="content" name="weather"></slot>
    </div>
`;

customElements.define("g3000-mfd-mainpane", WT_G3000MFDMainPaneHTMLElement);