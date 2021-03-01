class WT_G5000_PFDBottomInfo extends WT_G3x5_PFDBottomInfo {
    _initInfoCells() {
        this.addCell(new WT_G3x5_PFDBottomInfoAirspeedCell(this._unitsController));
        this.addCell(new WT_G3x5_PFDBottomInfoTemperatureCell(this._unitsController));
        this.addCell(new WT_G5000_PFDBottomInfoBearingContainerCell(this._bearingInfos));
        this.addCell(new WT_G3x5_PFDBottomInfoTimeCell());
    }
}

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
                    stroke: #67e8ef;
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
                    color: #67e8ef;
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
                    color: #9e6daf;
                    text-align: right;
                    margin-right: 1%;
                }
                #bearing {
                    width: 17%;
                    color: white;
                }
                #bearing[visible="false"] {
                    color: transparent;
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
        </div>
    </div>
`;

customElements.define(WT_G5000_PFDBottomInfoBearingCellHTMLElement.NAME, WT_G5000_PFDBottomInfoBearingCellHTMLElement);