class WT_G5000_PFDBottomInfo extends WT_G3x5_PFDBottomInfo {
    _initInfoCells() {
        this.addCell(new WT_G3x5_PFDBottomInfoAirspeedCell(this.instrument.unitsSettingModel));
        this.addCell(new WT_G5000_PFDBottomInfoWindDataCell(this.instrument.airplane, this.instrument.unitsSettingModel));
        //this.addCell(new WT_G3x5_PFDBottomInfoTemperatureCell(this.instrument.unitsController));
        this.addCell(new WT_G5000_PFDBottomInfoNAVDMECell(this.instrument.airplane, this.instrument.unitsSettingModel));
        this.addCell(new WT_G5000_PFDBottomInfoNavStatusCell(this.instrument.airplane, this.instrument.unitsSettingModel));
        this.addCell(new WT_G5000_PFDBottomInfoBearingContainerCell(this._bearingInfos));
        this.addCell(new WT_G3x5_PFDBottomInfoTimeCell(this.instrument));
    }
}

class WT_G5000_PFDBottomInfoNavStatusCell extends WT_G3x5_PFDBottomInfoCell {
    constructor(airplane, unitsSettingModel) {
        super();

        this._airplane = airplane;
        this._unitsSettingModel = unitsSettingModel;
        this._initNavDataInfos();
        this._setHTMLElementContext();
    }

    _createHTMLElement() {
        return new WT_G5000_PFDBottomInfoNavStatusCellHTMLElement();
    }

    _createDistanceFormatter() {
        return new WT_NumberFormatter({
            precision: 0.1,
            maxDigits: 3,
            unitSpaceBefore: false,
            unitCaps: true
        });
    }

    _createETEFormatter() {
        return new WT_TimeFormatter({
            timeFormat: WT_TimeFormatter.Format.HH_MM_OR_MM_SS,
            delim: WT_TimeFormatter.Delim.COLON_OR_CROSS
        });
    }

    _initNavDataInfos() {
        let distanceFormatter = this._createDistanceFormatter();
        let eteFormatter = this._createETEFormatter();

        this._infos = [
            {
                model: new WT_G3x5_NavDataInfoNumber({shortName: "DIS", longName: "Distance to Next Waypoint"}, new WT_G3x5_PFDNavStatusDISModel(this._airplane)),
                formatter: new WT_G3x5_NavDataInfoViewNumberFormatter(distanceFormatter, "___")
            },
            {
                model: new WT_G3x5_NavDataInfoNumber({shortName: "ETE", longName: "Estimated Time Enroute"}, new WT_G3x5_PFDNavStatusETEModel(this._airplane)),
                formatter: new WT_G3x5_NavDataInfoViewDurationFormatter(eteFormatter, "__:__")
            }
        ];

        this._unitsControllerAdapter = new WT_G5000_UnitsSettingModelNavStatusAdapter(this._unitsSettingModel, this._infos[0].model, this._infos[1].model);
    }

    _setHTMLElementContext() {
        this.htmlElement.setContext({
            airplane: this._airplane,
            infos: this._infos
        });
    }

    update() {
        this.htmlElement.update();
    }
}

class WT_G5000_PFDBottomInfoNavStatusCellHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._context = null;
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G5000_PFDBottomInfoNavStatusCellHTMLElement.TEMPLATE;
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
        await WT_Wait.awaitCallback(this._defineChildren.bind(this));
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
WT_G5000_PFDBottomInfoNavStatusCellHTMLElement.NAME = "wt-pfd-bottominfo-navstatuscell";
WT_G5000_PFDBottomInfoNavStatusCellHTMLElement.TEMPLATE = document.createElement("template");
WT_G5000_PFDBottomInfoNavStatusCellHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
        }
            wt-pfd-navstatus {
                position: relative;
                width: 100%;
                height: 100%;
            }
    </style>
    <div id="wrapper">
        <wt-pfd-navstatus></wt-pfd-navstatus>
    </div>
`;

customElements.define(WT_G5000_PFDBottomInfoNavStatusCellHTMLElement.NAME, WT_G5000_PFDBottomInfoNavStatusCellHTMLElement);

class WT_G5000_UnitsSettingModelNavStatusAdapter extends WT_G3x5_UnitsSettingModelAdapter {
    /**
     * @param {WT_G3x5_UnitsSettingModel} unitsSettingModel
     * @param {WT_G3x5_NavDataBarModel} navDataBarModel
     */
    constructor(unitsSettingModel, disInfo, eteInfo) {
        super(unitsSettingModel);

        this._disInfo = disInfo;
        this._eteInfo = eteInfo;
        this._initListeners();
        this._initModel();
    }

    _updateDistance() {
        let unit = this.unitsSettingModel.distanceSpeedSetting.getDistanceUnit();
        this._disInfo.setDisplayUnit(unit);
    }
}

class WT_G5000_PFDBottomInfoNAVDMECell extends WT_G3x5_PFDBottomInfoCell {
    constructor(airplane, unitsSettingModel) {
        super();

        this._airplane = airplane;
        this._unitsSettingModel = unitsSettingModel;
        this._setHTMLElementContext();
    }

    _createHTMLElement() {
        return new WT_G5000_PFDBottomInfoNAVDMECellHTMLElement();
    }

    _setHTMLElementContext() {
        this.htmlElement.setContext({
            airplane: this._airplane,
            unitsSettingModel: this._unitsSettingModel
        })
    }

    update() {
        this.htmlElement.update();
    }
}

class WT_G5000_PFDBottomInfoNAVDMECellHTMLElement extends WT_G3x5_PFDNavDMEInfoHTMLElement {
    _getTemplate() {
        return WT_G5000_PFDBottomInfoNAVDMECellHTMLElement.TEMPLATE;
    }
}
WT_G5000_PFDBottomInfoNAVDMECellHTMLElement.NAME = "wt-pfd-bottominfo-navdmecell";
WT_G5000_PFDBottomInfoNAVDMECellHTMLElement.TEMPLATE = document.createElement("template");
WT_G5000_PFDBottomInfoNAVDMECellHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
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
                    font-size: var(--navdmecell-title-font-size, 0.75em);
                    color: white;
                    text-align: left;
                }
                #ident {
                    width: 40%;
                    color: var(--wt-g3x5-green);
                    text-align: right;
                }
                #frequency {
                    width: 35%;
                    color: var(--wt-g3x5-green);
                    text-align: right;
                }
                #dme {
                    width: 40%;
                    color: var(--wt-g3x5-green);
                    text-align: right;
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
            <wt-numberunit id="dme"></wt-numberunit>
        </div>
    </div>
`;

customElements.define(WT_G5000_PFDBottomInfoNAVDMECellHTMLElement.NAME, WT_G5000_PFDBottomInfoNAVDMECellHTMLElement);

class WT_G5000_PFDBottomInfoBearingContainerCell extends WT_G3x5_PFDBottomInfoCell {
    constructor(bearingInfos) {
        super();

        this._bearingInfos = bearingInfos;
        this._initSubCells();
    }

    _createHTMLElement() {
        return new WT_G5000_PFDBottomInfoBearingContainerCellHTMLElement();
    }

    _initSubCells() {
        this._bearing1Cell = new WT_G5000_PFDBottomInfoBearingCell(this._bearingInfos.getModel(WT_G3x5_PFDBearingInfoContainer.Slot.ONE));
        this._bearing1Cell.htmlElement.slot = WT_G5000_PFDBottomInfoBearingContainerCellHTMLElement.CELLS_SLOT;
        this.htmlElement.appendChild(this._bearing1Cell.htmlElement);

        this._bearing2Cell = new WT_G5000_PFDBottomInfoBearingCell(this._bearingInfos.getModel(WT_G3x5_PFDBearingInfoContainer.Slot.TWO));
        this._bearing2Cell.htmlElement.slot = WT_G5000_PFDBottomInfoBearingContainerCellHTMLElement.CELLS_SLOT;
        this.htmlElement.appendChild(this._bearing2Cell.htmlElement);
    }

    update() {
        this._bearing1Cell.update();
        this._bearing2Cell.update();
    }
}

class WT_G5000_PFDBottomInfoBearingContainerCellHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G5000_PFDBottomInfoBearingContainerCellHTMLElement.TEMPLATE.content.cloneNode(true));
    }
}
WT_G5000_PFDBottomInfoBearingContainerCellHTMLElement.NAME = "wt-pfd-bottominfo-bearingcellcontainer";
WT_G5000_PFDBottomInfoBearingContainerCellHTMLElement.CELLS_SLOT = "cells";
WT_G5000_PFDBottomInfoBearingContainerCellHTMLElement.TEMPLATE = document.createElement("template");
WT_G5000_PFDBottomInfoBearingContainerCellHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #cells {
            position: relative;
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: 50% 50%;
            grid-template-columns: 100%;
        }
    </style>
    <slot name="${WT_G5000_PFDBottomInfoBearingContainerCellHTMLElement.CELLS_SLOT}" id="cells">
    </slot>
`;

customElements.define(WT_G5000_PFDBottomInfoBearingContainerCellHTMLElement.NAME, WT_G5000_PFDBottomInfoBearingContainerCellHTMLElement);

class WT_G5000_PFDBottomInfoBearingCell extends WT_G3x5_PFDBottomInfoBearingCell {
    _createHTMLElement() {
        return new WT_G5000_PFDBottomInfoBearingCellHTMLElement();
    }
}

class WT_G5000_PFDBottomInfoBearingCellHTMLElement extends WT_G3x5_PFDBottomInfoBearingCellHTMLElement {
    _getTemplate() {
        return WT_G5000_PFDBottomInfoBearingCellHTMLElement.TEMPLATE;
    }
}
WT_G5000_PFDBottomInfoBearingCellHTMLElement.NAME = "wt-pfd-bottominfo-bearingcell";
WT_G5000_PFDBottomInfoBearingCellHTMLElement.TEMPLATE = document.createElement("template");
WT_G5000_PFDBottomInfoBearingCellHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            position: relative;
            width: 100%;
            height: 100%;
            display: block;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: 100%;
            grid-template-columns: 7.5% 92.5%;
        }
            #arrow {
                position: relative;
                width: 100%;
                height: 100%;
            }
                #arrow svg {
                    display: none;
                    position: absolute;
                    height: var(--bearingcell-arrow-height, 80%);
                    top: 50%;
                    transform: translateY(-50%);
                    fill: transparent;
                    stroke: var(--wt-g3x5-lightblue);
                    stroke-width: 5;
                }
                #arrow[infoSlot="${WT_G3x5_PFDBearingInfoContainer.Slot.ONE}"] #arrowSVG1 {
                    display: block;
                }
                #arrow[infoSlot="${WT_G3x5_PFDBearingInfoContainer.Slot.TWO}"] #arrowSVG2 {
                    display: block;
                }
            #text {
                position: relative;
                width: 100%;
                display: flex;
                flex-wrap: nowrap;
                align-items: baseline;
                text-align: left;
                font-family: var(--bearingcell-bottom-font-family, inherit);
                font-weight: var(--bearingcell-bottom-font-weight, inherit);
                align-self: center;
            }
                #source {
                    width: 20%;
                    color: var(--wt-g3x5-lightblue);
                    font-size: var(--bearingcell-source-font-size, 0.9em);
                    margin-right: 1%;
                }
                #ident {
                    width: 27%;
                    color: white;
                    margin-right: 1%;
                }
                #distance {
                    width: 33%;
                    color: var(--wt-g3x5-purple);
                    text-align: right;
                    margin-right: 1%;
                }
                #bearing {
                    width: 17%;
                    color: white;
                }
                #nosource {
                    width: 79%;
                    display: none;
                    color: transparent;
                }
                #nodata {
                    width: 79%;
                    display: none;
                    color: white;
                }
                #wrapper[nodata="true"] #ident,
                #wrapper[nosource="true"] #ident {
                    display: none;
                }
                #wrapper[nodata="true"] #distance,
                #wrapper[nosource="true"] #distance {
                    display: none;
                }
                #wrapper[nodata="true"] #bearing,
                #wrapper[nosource="true"] #bearing {
                    display: none;
                }
                #wrapper[nosource="true"] #nosource {
                    display: block;
                }
                #wrapper[nodata="true"] #nodata {
                    display: block;
                }
    </style>
    <div id="wrapper">
        <div id="arrow">
            <svg id="arrowSVG1" viewBox="0 0 50 100">
                <path d="M 25 0 L 25 100 M 0 40 L 25 20 L 50 40" />
            </svg>
            <svg id="arrowSVG2" viewBox="0 0 50 100">
                <path d="M 25 0 L 25 20 M 0 40 L 25 20 L 50 40 L 37.5 30 L 37.5 90 L 12.5 90 L 12.5 30 L 0 40 M 25 90 L 25 100" />
            </svg>
        </div>
        <div id="text">
            <div id="source"></div>
            <div id="ident"></div>
            <wt-numberunit id="distance"></wt-numberunit>
            <div id="bearing"></div>
            <div id="nosource">NO SOURCE</div>
            <div id="nodata">– – –</div>
        </div>
    </div>
`;

customElements.define(WT_G5000_PFDBottomInfoBearingCellHTMLElement.NAME, WT_G5000_PFDBottomInfoBearingCellHTMLElement);

class WT_G5000_PFDBottomInfoWindDataCell extends WT_G3x5_PFDBottomInfoCell {
    constructor(airplane, unitsSettingModel) {
        super();

        this._initSettingModel();
        this._model = this._createModel(airplane, unitsSettingModel);
        this._setHTMLElementContext();
    }

    _createHTMLElement() {
        return new WT_G5000_PFDBottomInfoWindDataCellHTMLElement();
    }

    _createModel(airplane, unitsSettingModel) {
        return new WT_G3x5_PFDWindDataModel(airplane, this._windModeSetting, unitsSettingModel);
    }

    _setHTMLElementContext() {
        this.htmlElement.setContext({
            model: this._model
        });
    }

    _initSettingModel() {
        this._settingModel = new WT_DataStoreSettingModel("PFD", null);
        this._settingModel.addSetting(this._windModeSetting = new WT_G3x5_PFDWindModeSetting(this._settingModel));
        this._settingModel.init();
    }

    update() {
        this._model.update();
        this.htmlElement.update();
    }
}

class WT_G5000_PFDBottomInfoWindDataCellHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._context = null;
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G5000_PFDBottomInfoWindDataCellHTMLElement.TEMPLATE;
    }

    _defineChildren() {
        let windData = this.shadowRoot.querySelector(`wt-pfd-winddata`);
        if (windData instanceof WT_G3x5_PFDWindDataHTMLElement) {
            this._windData = windData;
            return true;
        } else {
            return false;
        }
    }

    async _connectedCallbackHelper() {
        await WT_Wait.awaitCallback(this._defineChildren.bind(this));
        this._isInit = true;
        this._updateFromContext();
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _updateFromContext() {
        this._windData.setContext(this._context);
    }

    /**
     *
     * @param {{model:WT_G3x5_PFDWindDataModel}} context
     */
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

        this._windData.update();
    }
}
WT_G5000_PFDBottomInfoWindDataCellHTMLElement.NAME = "wt-pfd-bottominfo-winddatacell";
WT_G5000_PFDBottomInfoWindDataCellHTMLElement.TEMPLATE = document.createElement("template");
WT_G5000_PFDBottomInfoWindDataCellHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            position: relative;
            width: 100%;
            height: 100%;
            display: block;
        }

        wt-pfd-winddata {
            position: absolute;
            left: var(--winddatacell-padding-left, 0.2em);
            top: var(--winddatacell-padding-top, 0.2em);
            width: calc(100% - var(--winddatacell-padding-left, 0.2em) - var(--winddatacell-padding-right, 0.2em));
            height: calc(100% - var(--winddatacell-padding-top, 0.2em) - var(--winddatacell-padding-bottom, 0.2em));
        }
    </style>
    <wt-pfd-winddata></wt-pfd-winddata>
`;

customElements.define(WT_G5000_PFDBottomInfoWindDataCellHTMLElement.NAME, WT_G5000_PFDBottomInfoWindDataCellHTMLElement);