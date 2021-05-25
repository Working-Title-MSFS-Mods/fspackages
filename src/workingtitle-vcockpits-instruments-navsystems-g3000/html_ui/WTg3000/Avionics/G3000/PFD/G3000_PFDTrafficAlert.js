class WT_G3000_PFDTrafficAlert extends WT_G3x5_PFDTrafficAlert {
    constructor() {
        super();

        this._lastAlertLevel = WT_G3000_PFDTrafficAlertModel.AlertLevel.NONE;
    }

    _createModel() {
        return new WT_G3000_PFDTrafficAlertModel(this.instrument.trafficSystem);
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3000_PFDTrafficAlertHTMLElement();
        htmlElement.setContext({model: this._model});
        return htmlElement;
    }

    _shouldOpenTrafficMap() {
        if (this._model.alertLevel === WT_G3000_PFDTrafficAlertModel.AlertLevel.TRAFFIC_ADVISORY && this._lastAlertLevel === WT_G3000_PFDTrafficAlertModel.AlertLevel.NONE) {
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

class WT_G3000_PFDTrafficAlertModel extends WT_G3x5_PFDTrafficAlertModel {
    _updateAlertLevel() {
        if (this._trafficSystem.trafficAdvisories.length > 0) {
            this._alertLevel = WT_G3000_PFDTrafficAlertModel.AlertLevel.TRAFFIC_ADVISORY;
        } else {
            this._alertLevel = WT_G3000_PFDTrafficAlertModel.AlertLevel.NONE;
        }
    }

    update() {
        this._updateAlertLevel();
    }
}
/**
 * @enum {Number}
 */
WT_G3000_PFDTrafficAlertModel.AlertLevel = {
    NONE: 0,
    TRAFFIC_ADVISORY: 1
}

class WT_G3000_PFDTrafficAlertHTMLElement extends WT_G3x5_PFDTrafficAlertHTMLElement {
    _getTemplate() {
        return WT_G3000_PFDTrafficAlertHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        this._wrapper = new WT_CachedElement(this.shadowRoot.querySelector(`#wrapper`));
    }

    _setVisibility(value) {
        this._wrapper.setAttribute("show", `${value}`);
    }

    _updateVisibility() {
        let visible = this._context.model.alertLevel === WT_G3000_PFDTrafficAlertModel.AlertLevel.TRAFFIC_ADVISORY;
        this._setVisibility(visible);
    }

    _setFlash(value) {
        this._wrapper.setAttribute("flash", `${value}`);
    }

    _updateFlash() {
        this._setFlash(this._context.model.alertLevel === WT_G3000_PFDTrafficAlertModel.AlertLevel.TRAFFIC_ADVISORY);
    }

    _doUpdate() {
        this._updateVisibility();
        this._updateFlash();
    }
}
WT_G3000_PFDTrafficAlertHTMLElement.NAME = "wt-pfd-trafficalert";
WT_G3000_PFDTrafficAlertHTMLElement.TEMPLATE = document.createElement("template");
WT_G3000_PFDTrafficAlertHTMLElement.TEMPLATE.innerHTML = `
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
            background-color: var(--wt-g3x5-amber);
            border: solid 1px var(--wt-g3x5-bggray);
            border-radius: 5px;
        }
        #wrapper[show="true"] {
            display: block;
        }
        #wrapper[flash="true"] {
            animation: flash 1s step-end 5
        }
            #annunciation {
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                color: black;
            }
    </style>
    <div id="wrapper">
        <div id="annunciation">TRAFFIC</div>
    </div>
`;

customElements.define(WT_G3000_PFDTrafficAlertHTMLElement.NAME, WT_G3000_PFDTrafficAlertHTMLElement);