class WT_G3000_PFDNavStatusBox extends WT_G3x5_PFDElement {
    /**
     * @readonly
     * @property {WT_G3x5_PFDFMSInfoHTMLElement} htmlElement
     * @type {WT_G3x5_PFDNavStatusHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createDistanceFormatter() {
        return new WT_NumberFormatter({
            precision: 0.1,
            maxDigits: 3,
            unitSpaceBefore: false,
            unitCaps: true
        });
    }

    _createBearingFormatter() {
        return new WT_NumberFormatter({
            precision: 1,
            unitSpaceBefore: false
        });
    }

    _initNavDataInfos() {
        let distanceFormatter = this._createDistanceFormatter();
        let bearingFormatter = this._createBearingFormatter();

        this._infos = [
            {
                model: new WT_NavDataInfoNumber({shortName: "DIS", longName: "Distance to Next Waypoint"}, new WT_G3x5_PFDNavStatusDISModel(this.instrument.airplane)),
                formatter: new WT_NavDataInfoViewNumberFormatter(distanceFormatter, "___")
            },
            {
                model: new WT_NavDataInfoNumber({shortName: "BRG", longName: "Bearing to Next Waypoint"}, new WT_G3x5_PFDNavStatusBRGModel(this.instrument.airplane)),
                formatter: new WT_NavDataInfoViewDegreeFormatter(bearingFormatter, "___")
            }
        ];

        this._unitsControllerAdapter = new WT_G3000_UnitsControllerNavStatusAdapter(this.instrument.unitsController, this._infos[0].model, this._infos[1].model);
    }

    _createHTMLElement() {
        let htmlElement = new WT_G3000_PFDNavStatusBoxHTMLElement();
        htmlElement.setContext({
            airplane: this.instrument.airplane,
            infos: this._infos
        });
        return htmlElement;
    }

    init(root) {
        this._initNavDataInfos();

        let container = root.querySelector(`#InstrumentsContainer`);
        this._htmlElement = this._createHTMLElement();
        container.appendChild(this.htmlElement);
    }

    onUpdate(deltaTime) {
        this.htmlElement.update();
    }
}

class WT_G3000_PFDNavStatusBoxHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._context = null;
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3000_PFDNavStatusBoxHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        let navStatus = this.shadowRoot.querySelector(`wt-pfd-navstatus`);
        if (navStatus instanceof WT_G3x5_PFDNavStatusHTMLElement) {
            this._navStatus = navStatus;
            return true;
        } else {
            return false;
        }
    }

    async _connectedCallbackHelper() {
        await WT_Wait.wait(this._defineChildren.bind(this));
        this._isInit = true;
        this._updateFromContext();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _updateFromContext() {
        this._navStatus.setContext(this._context);
    }

    setContext(context) {
        if (this._context === context) {
            return;
        }

        this._context = context;
        if (this._isInit) {
            this._updateFromContext();
        }
    }

    update() {
        if (!this._isInit) {
            return;
        }

        this._navStatus.update();
    }
}
WT_G3000_PFDNavStatusBoxHTMLElement.NAME = "wt-pfd-navstatusbox";
WT_G3000_PFDNavStatusBoxHTMLElement.TEMPLATE = document.createElement("template");
WT_G3000_PFDNavStatusBoxHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            background-color: var(--wt-g3x5-bggray);
            border-radius: 5px;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
        }
            wt-pfd-navstatus {
                position: absolute;
                left: var(--navstatusbox-margin-left, 10%);
                top: 0%;
                width: calc(100% - var(--navstatusbox-margin-left, 10%));
                height: 100%;
            }
    </style>
    <div id="wrapper">
        <wt-pfd-navstatus></wt-pfd-navstatus>
    </div>
`;

customElements.define(WT_G3000_PFDNavStatusBoxHTMLElement.NAME, WT_G3000_PFDNavStatusBoxHTMLElement);

class WT_G3000_UnitsControllerNavStatusAdapter extends WT_G3x5_UnitsControllerModelAdapter {
    /**
     * @param {WT_G3x5_UnitsController} controller
     * @param {WT_NavDataBarModel} navDataBarModel
     */
    constructor(controller, disInfo, brgInfo) {
        super(controller);

        this._disInfo = disInfo;
        this._brgInfo = brgInfo;
        this._initListeners();
        this._initModel();
    }

    _updateBearing() {
        let unit = this.controller.navAngleSetting.getNavAngleUnit();
        this._brgInfo.setDisplayUnit(unit);
    }

    _updateDistance() {
        let unit = this.controller.distanceSpeedSetting.getDistanceUnit();
        this._disInfo.setDisplayUnit(unit);
    }
}