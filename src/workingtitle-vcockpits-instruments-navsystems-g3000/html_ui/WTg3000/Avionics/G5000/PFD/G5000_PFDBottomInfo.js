class WT_G5000_PFDBottomInfo extends WT_G3x5_PFDBottomInfo {
    _initInfoCells() {
        this.addCell(new WT_G3x5_PFDBottomInfoAirspeedCell(this.instrument.unitsController));
        this.addCell(new WT_G3x5_PFDBottomInfoTemperatureCell(this.instrument.unitsController));
        this.addCell(new WT_G5000_PFDBottomInfoNAVDMECell(this.instrument.airplane, this.instrument.unitsController));
        this.addCell(new WT_G5000_PFDBottomInfoBearingContainerCell(this.instrument.bearingInfos));
        this.addCell(new WT_G3x5_PFDBottomInfoTimeCell());
    }
}

class WT_G5000_PFDBottomInfoNAVDMECell extends WT_G3x5_PFDBottomInfoCell {
    constructor(airplane, unitsController) {
        super();

        this._airplane = airplane;
        this._unitsController = unitsController;
        this._setHTMLElementContext();
    }

    _createHTMLElement() {
        return new WT_G5000_PFDBottomInfoNAVDMECellHTMLElement();
    }

    _setHTMLElementContext() {
        this.htmlElement.setContext({
            airplane: this._airplane,
            unitsController: this._unitsController
        })
    }

    update() {
        this.htmlElement.update();
    }
}

class WT_G5000_PFDBottomInfoNAVDMECellHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G5000_PFDBottomInfoNAVDMECellHTMLElement.TEMPLATE.content.cloneNode(true));

        this._initDistanceFormatter();

        this._context = null;
        this._isInit = false;

        this._tempNM = WT_Unit.NMILE.createNumber(0);
    }

    _initDistanceFormatter() {
        let formatter = new WT_NumberFormatter({
            precision: 0.1,
            maxDigits: 3,
            unitSpaceBefore: false,
            unitCaps: true
        });
        this._distanceFormatter = new WT_NumberHTMLFormatter(formatter, {
            classGetter: {
                getNumberClassList: (numberUnit, forceUnit) => [],
                getUnitClassList: (numberUnit, forceUnit) => [WT_G5000_PFDBottomInfoNAVDMECellHTMLElement.UNIT_CLASS]
            },
            numberUnitDelim: ""
        });
    }

    _defineChildren() {
        this._navTitle = new WT_CachedHTML(this.shadowRoot.querySelector(`#navtitle`));
        this._ident = new WT_CachedHTML(this.shadowRoot.querySelector(`#ident`));
        this._frequency = new WT_CachedHTML(this.shadowRoot.querySelector(`#frequency`));
        this._dmeTitle = new WT_CachedHTML(this.shadowRoot.querySelector(`#dmetitle`));
        this._dme = new WT_CachedHTML(this.shadowRoot.querySelector(`#dme`));
    }

    connectedCallback() {
        this._defineChildren();
        this._isInit = true;
    }

    /**
     *
     * @param {{airplane:WT_PlayerAirplane, unitsController:WT_G3x5_UnitsController}} context
     */
    setContext(context) {
        this._context = context;
    }

    _clearDisplay() {
        this._navTitle.innerHTML = "";
        this._ident.innerHTML = "";
        this._frequency.innerHTML = "";
        this._dmeTitle.innerHTML = "";
        this._dme.innerHTML = "";
    }

    /**
     *
     * @param {WT_AirplaneNavSlot} nav
     */
    _updateNavTitle(nav) {
        this._navTitle.innerHTML = nav.name;
    }

    /**
     *
     * @param {WT_AirplaneNavSlot} nav
     */
    _updateIdent(nav) {
        this._ident.innerHTML = nav.isReceiving() ? nav.ident() : "";
    }

    /**
     *
     * @param {WT_AirplaneNavSlot} nav
     */
    _updateFrequency(nav) {
        this._frequency.innerHTML = nav.activeFrequency().hertz(WT_Frequency.Prefix.MHz).toFixed(2);
    }

    /**
     *
     * @param {WT_AirplaneNavSlot} nav
     */
    _updateDMETitle(nav, hasDME) {
        this._dmeTitle.innerHTML = `DME${nav.index}`;
    }

    /**
     *
     * @param {WT_AirplaneNavSlot} nav
     */
    _updateDME(nav, hasDME) {
        let dme = nav.dme(this._tempNM);
        let text;
        if (dme) {
            text = this._distanceFormatter.getFormattedHTML(dme, this._context.unitsController.distanceSpeedSetting.getDistanceUnit());
        } else {
            text = `___${this._distanceFormatter.getFormattedUnitHTML(this._tempNM, this._context.unitsController.distanceSpeedSetting.getDistanceUnit())}`;
        }
        this._dme.innerHTML = text;
    }

    _updateDisplay() {
        let source = this._context.airplane.autopilot.navigationSource();
        if (source === WT_AirplaneAutopilot.NavSource.FMS) {
            this._clearDisplay();
        } else {
            let nav = this._context.airplane.navCom.getNav(source);
            let hasDME = nav.hasDME();
            this._updateNavTitle(nav);
            this._updateIdent(nav);
            this._updateFrequency(nav);
            this._updateDMETitle(nav, hasDME);
            this._updateDME(nav, hasDME);
        }
    }

    update() {
        this._updateDisplay();
    }
}
WT_G5000_PFDBottomInfoNAVDMECellHTMLElement.NAME = "wt-pfd-bottominfo-navdmecell";
WT_G5000_PFDBottomInfoNAVDMECellHTMLElement.UNIT_CLASS = "unit";
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

        .${WT_G5000_PFDBottomInfoNAVDMECellHTMLElement.UNIT_CLASS} {
            font-size: var(--navdmecell-unit-font-size, 0.75em);
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

            .${WT_G3x5_PFDBottomInfoBearingCellHTMLElement.UNIT_CLASS} {
                font-size: var(--bearingcell-unit-font-size, 0.75em);
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
            <div id="distance"></div>
            <div id="bearing"></div>
            <div id="nosource">NO SOURCE</div>
            <div id="nodata">– – –</div>
        </div>
    </div>
`;

customElements.define(WT_G5000_PFDBottomInfoBearingCellHTMLElement.NAME, WT_G5000_PFDBottomInfoBearingCellHTMLElement);