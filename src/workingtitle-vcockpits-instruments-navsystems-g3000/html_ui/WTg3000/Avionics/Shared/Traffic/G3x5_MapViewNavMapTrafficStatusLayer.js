class WT_G3x5_MapViewNavMapTrafficStatusLayer extends WT_MapViewLayer {
    constructor(altitudeRestrictionModeText = WT_G3x5_MapViewNavMapTrafficStatusLayer.ALTITUDE_RESTRICTION_MODE_TEXT, className = WT_G3x5_MapViewNavMapTrafficStatusLayer.CLASS_DEFAULT, configName = WT_G3x5_MapViewNavMapTrafficStatusLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._altitudeRestrictionModeText = altitudeRestrictionModeText;

        this._initHTMLElement();
    }

    _createHTMLElement() {
    }

    _initHTMLElement() {
        this.htmlElement.setContext({text: this._altitudeRestrictionModeText});
    }

    /**
     * @param {WT_MapViewState} state
     */
    isVisible(state) {
        return state.model.traffic.show;
    }

    /**
     * @param {WT_MapViewState} state
     */
    onUpdate(state) {
        this.htmlElement.update(state);
    }
}
WT_G3x5_MapViewNavMapTrafficStatusLayer.CLASS_DEFAULT = "trafficStatusLayer";
WT_G3x5_MapViewNavMapTrafficStatusLayer.CONFIG_NAME_DEFAULT = "trafficStatus";
WT_G3x5_MapViewNavMapTrafficStatusLayer.ALTITUDE_RESTRICTION_MODE_TEXT = [
    "UNRES",
    "ABOVE",
    "NORMAL",
    "BELOW"
];

class WT_G3x5_MapViewNavMapTrafficStatusHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_MapViewNavMapTrafficStatusHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        this._wrapper = new WT_CachedElement(this.shadowRoot.querySelector(`#wrapper`));
        this._altitudeRestriction = new WT_CachedElement(this.shadowRoot.querySelector(`#altituderestriction`));
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
    _updateEnabledIcon(state) {
    }

    _setAltitudeRestrictionText(text) {
        this._altitudeRestriction.textContent = text;
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateAltitudeRestriction(state) {
        this._setAltitudeRestrictionText(this._context.text[state.model.traffic.altitudeRestrictionMode]);
    }

    /**
     * @param {WT_MapViewState} state
     */
    _updateDisplay(state) {
        this._updateEnabledIcon(state);
        this._updateAltitudeRestriction(state);
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
WT_G3x5_MapViewNavMapTrafficStatusHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_MapViewNavMapTrafficStatusHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            background-color: black;
            border: solid 1px white;
            border-radius: 3px;
            display: block;
        }

        #wrapper {
            position: relative;
            margin: var(--traffic-navmapstatus-margin, 0.2em);
            display: flex;
            flex-flow: row nowrap;
            align-items: center;
        }
            #altituderestriction {
                color: white;
                margin-right: 0.5em;
            }
            #enabled {
                width: 1.8em;
                height: 1.2em;
                fill: white;
            }
                .disabledcross {
                    fill: transparent;
                }
                #disabledcrossoutline {
                    stroke-width: 20;
                    stroke: black;
                }
                #disabledcrossstroke {
                    stroke-width: 15;
                    stroke: white;
                }
                #wrapper[traffic-enabled="true"] .disabledcross {
                    display: none;
                }
    </style>
    <div id="wrapper">
        <div id="altituderestriction"></div>
        <svg id="enabled" viewbox="0 0 150 100">
            <path d="M 50 5 L 95 50 L 50 95 L 5 50 Z" />
            <path d="M 115 10 L 135 35 L 122.5 35 L 122.5 80 L 107.5 80 L 107.5 35 L 95 35 Z" />
            <path id="disabledcrossoutline" class="disabledcross" d="M 10 10 L 140 90 M 10 90 L 140 10" />
            <path id="disabledcrossstroke" class="disabledcross" d="M 10 10 L 140 90 M 10 90 L 140 10" />
        </svg>
    </div>
`;