class WT_G3000_PFDNavDMEInfo extends WT_G3x5_PFDElement {
    /**
     * @readonly
     * @property {WT_G3000_PFDNavDMEInfoHTMLElement} htmlElement
     * @type {WT_G3000_PFDNavDMEInfoHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3000_PFDNavDMEInfoHTMLElement();
        htmlElement.setContext({
            airplane: this.instrument.airplane,
            unitsController: this.instrument.unitsController
        });
        return htmlElement;
    }

    init(root) {
        let container = root.querySelector(`#InstrumentsContainer`);
        this._htmlElement = this._createHTMLElement();
        container.appendChild(this.htmlElement);
    }

    onUpdate(deltaTime) {
        this.htmlElement.update();
    }
}

class WT_G3000_PFDNavDMEInfoHTMLElement extends WT_G3x5_PFDNavDMEInfoHTMLElement {
    constructor() {
        super();

        this._isHidden = false;
    }

    _getTemplate() {
        return WT_G3000_PFDNavDMEInfoHTMLElement.TEMPLATE;
    }

    _setHidden(value) {
        if (this._isHidden === value) {
            return;
        }

        this.setAttribute("hide", `${value}`);
        this._isHidden = value;
    }

    _updateDisplay() {
        super._updateDisplay();

        if (this._context.airplane.autopilot.navigationSource() === WT_AirplaneAutopilot.NavSource.FMS) {
            this._setHidden(true);
        } else {
            this._setHidden(false);
        }
    }
}
WT_G3000_PFDNavDMEInfoHTMLElement.NAME = "wt-pfd-navdmeinfo";
WT_G3000_PFDNavDMEInfoHTMLElement.TEMPLATE = document.createElement("template");
WT_G3000_PFDNavDMEInfoHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            background-color: var(--wt-g3x5-bggray);
            border-radius: 5px;
        }
        :host([hide="true"]) {
            display: none;
        }

        #wrapper {
            position: absolute;
            left: var(--navdmeinfo-left-margin, 0%);
            top: var(--navdmeinfo-top-margin, 0%);
            width: calc(100% - var(--navdmeinfo-left-margin, 0%) - var(--navdmeinfo-right-margin, 0%));
            height: calc(100% - var(--navdmeinfo-top-margin, 0%) - var(--navdmeinfo-bottom-margin, 0%));
            display: grid;
            grid-template-rows: 50% 50%;
            grid-template-columns: 100%;
            align-items: center;
        }
            .row {
                position: relative;
                width: 100%;
                display: flex;
                flex-flow: row nowrap;
                align-items: baseline;
            }
                .title {
                    width: 25%;
                    font-size: var(--navdmeinfo-title-font-size, 0.75em);
                    color: white;
                    text-align: left;
                }
                #ident {
                    width: 40%;
                    color: var(--wt-g3x5-lightgreen);
                    text-align: right;
                }
                #frequency {
                    width: 35%;
                    color: var(--wt-g3x5-lightgreen);
                    text-align: right;
                }
                #dme {
                    width: 40%;
                    color: var(--wt-g3x5-lightgreen);
                    text-align: right;
                }

        .${WT_G3x5_PFDNavDMEInfoHTMLElement.UNIT_CLASS} {
            font-size: var(--navdmeinfo-unit-font-size, 0.75em);
        }
    </style>
    <div id="wrapper">
        <div id="top" class="row">
            <div id="navtitle" class="title"></div>
            <div id="ident"></div>
            <div id="frequency"></div>
        </div>
        <div id="bottom" class="row">
            <div id="dmetitle" class="title"></div>
            <div id="dme"></div>
        </div>
    </div>
`;

customElements.define(WT_G3000_PFDNavDMEInfoHTMLElement.NAME, WT_G3000_PFDNavDMEInfoHTMLElement);