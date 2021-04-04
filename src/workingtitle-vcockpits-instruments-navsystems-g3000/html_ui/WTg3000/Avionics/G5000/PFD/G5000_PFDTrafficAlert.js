class WT_G5000_PFDTrafficAlert extends WT_G3x5_PFDTrafficAlert {
    constructor() {
        super();

        this._lastAlertLevel = WT_G5000_PFDTrafficAlertModel.AlertLevel.NONE;
    }

    _createModel() {
        return new WT_G5000_PFDTrafficAlertModel(this.instrument.trafficSystem);
    }

    _createHTMLElement() {
        let htmlElement = new WT_G5000_PFDTrafficAlertHTMLElement();
        htmlElement.setContext({model: this._model});
        return htmlElement;
    }

    _shouldOpenTrafficMap() {
        if (this._model.alertLevel !== WT_G5000_PFDTrafficAlertModel.AlertLevel.NONE && this._lastAlertLevel === WT_G5000_PFDTrafficAlertModel.AlertLevel.NONE) {
            return true;
        } else {
            return false;
        }
    }

    onUpdate(deltaTime) {
        super.onUpdate(deltaTime);

        this._lastAlertLevel = this._model.alertLevel;
    }
}

class WT_G5000_PFDTrafficAlertModel extends WT_G3x5_PFDTrafficAlertModel {
    _updateAlertLevel() {
        if (this._trafficSystem.trafficAdvisories.length > 0) {
            this._alertLevel = WT_G5000_PFDTrafficAlertModel.AlertLevel.TRAFFIC_ADVISORY;
        } else {
            this._alertLevel = WT_G5000_PFDTrafficAlertModel.AlertLevel.NONE;
        }
    }

    update() {
        this._updateAlertLevel();
    }
}
/**
 * @enum {Number}
 */
WT_G5000_PFDTrafficAlertModel.AlertLevel = {
    NONE: 0,
    TRAFFIC_ADVISORY: 1,
    RESOLUTION_ADVISORY: 2
}

class WT_G5000_PFDTrafficAlertHTMLElement extends WT_G3x5_PFDTrafficAlertHTMLElement {
    _getTemplate() {
        return WT_G5000_PFDTrafficAlertHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        this._wrapper = new WT_CachedElement(this.shadowRoot.querySelector(`#wrapper`));
    }

    _setVisibility(value) {
        this._wrapper.setAttribute("show", `${value}`);
    }

    _updateVisibility() {
        let visible = this._context.model.alertLevel !== WT_G5000_PFDTrafficAlertModel.AlertLevel.NONE;
        this._setVisibility(visible);
    }

    _setAlertLevel(level) {
        this._wrapper.setAttribute("alert", WT_G5000_PFDTrafficAlertHTMLElement.ALERT_LEVEL_ATTRIBUTES[level]);
    }

    _updateAlertLevel() {
        this._setAlertLevel(this._context.model.alertLevel);
    }

    _doUpdate() {
        this._updateVisibility();
        this._updateAlertLevel();
    }
}
WT_G5000_PFDTrafficAlertHTMLElement.ALERT_LEVEL_ATTRIBUTES = [
    "none",
    "ta",
    "ra"
];
WT_G5000_PFDTrafficAlertHTMLElement.NAME = "wt-pfd-trafficalert";
WT_G5000_PFDTrafficAlertHTMLElement.TEMPLATE = document.createElement("template");
WT_G5000_PFDTrafficAlertHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        @keyframes flash {
            0% {
                visibility: inherit;
            }
            50% {
                visibility: hidden;
            }
            100% {
                visibility: inherit;
            }
        }

        #wrapper {
            display: none;
            width: 100%;
            height: 100%;
            background-color: var(--wt-g3x5-bggray);
            border: solid 1px var(--wt-g3x5-bggray);
            border-radius: 5px;
        }
        #wrapper[show="true"] {
            display: block;
        }
            #annunciation {
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                color: white;
            }
        #wrapper[alert="ta"] {
            width: 100%;
            height: 100%;
            background-color: var(--wt-g3x5-amber);
            animation: flash 1s step-end 5
        }
            #wrapper[alert="ta"] #annunciation {
                color: black;
            }
        #wrapper[alert="ra"] {
            width: 100%;
            height: 100%;
            background-color: red;
            animation: flash 1s step-end 5
        }
            #wrapper[alert="ra"] #annunciation {
                color: white;
            }
    </style>
    <div id="wrapper">
        <div id="annunciation">TRAFFIC</div>
    </div>
`;

customElements.define(WT_G5000_PFDTrafficAlertHTMLElement.NAME, WT_G5000_PFDTrafficAlertHTMLElement);