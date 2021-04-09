/**
 * A layer that displays an icon that signals when the airplane symbol is not displayed.
 */
class WT_G3x5_MapViewChartsAirplaneStatusLayer extends WT_MapViewLayer {
    constructor(className = WT_G3x5_MapViewChartsAirplaneStatusLayer.CLASS_DEFAULT, configName = WT_G3x5_MapViewChartsAirplaneStatusLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);
    }

    _createHTMLElement() {
        return new WT_G3x5_MapViewChartsAirplaneStatusHTMLElement();
    }

    /**
     * @param {WT_MapViewState} state
     */
    isVisible(state) {
        return !state.model.charts.showAirplane;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onConfigLoaded(state) {
        for (let property of WT_MapViewAirplaneLayer.CONFIG_PROPERTIES) {
            this._setPropertyFromConfig(property);
        }

        this.htmlElement.setAirplaneImage(this.config.imagePath);
    }
}
WT_G3x5_MapViewChartsAirplaneStatusLayer.CLASS_DEFAULT = "airplaneStatusLayer";
WT_G3x5_MapViewChartsAirplaneStatusLayer.CONFIG_NAME_DEFAULT = "airplaneStatus";

class WT_G3x5_MapViewChartsAirplaneStatusHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._imageURL = "";
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_MapViewChartsAirplaneStatusHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        this._airplaneIcon = this.shadowRoot.querySelector(`#airplaneicon`);
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
        this._setAirplaneImageURL(this._imageURL);
    }

    _setAirplaneImageURL(url) {
        this._airplaneIcon.setAttributeNS("http://www.w3.org/1999/xlink", "href", url);
    }

    setAirplaneImage(url) {
        this._imageURL = url;

        if (this._isInit) {
            this._setAirplaneImageURL(url);
        }
    }
}
WT_G3x5_MapViewChartsAirplaneStatusHTMLElement.NAME = "wt-map-view-charts-airplanestatus";
WT_G3x5_MapViewChartsAirplaneStatusHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_MapViewChartsAirplaneStatusHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            background-color: black;
            border: solid 1px white;
            border-radius: 3px;
        }

        svg {
            left: var(--airplanestatus-padding-left, 0);
            top: var(--airplanestatus-padding-top, 0);
            width: calc(100% - var(--airplanestatus-padding-left, 0) - var(--airplanestatus-padding-right, 0));
            height: calc(100% - var(--airplanestatus-padding-top, 0) - var(--airplanestatus-padding-bottom, 0));
        }
            #cross {
                fill: transparent;
                stroke-width: 5;
                stroke: white;
            }
    </style>
    <svg viewbox="0 0 64 64">
        <image id="airplaneicon" width="100%" height="100%" />
        <path id="cross" d="M 4 4 L 60 60 M 4 60 L 60 4" />
    </svg>
`;

customElements.define(WT_G3x5_MapViewChartsAirplaneStatusHTMLElement.NAME, WT_G3x5_MapViewChartsAirplaneStatusHTMLElement);