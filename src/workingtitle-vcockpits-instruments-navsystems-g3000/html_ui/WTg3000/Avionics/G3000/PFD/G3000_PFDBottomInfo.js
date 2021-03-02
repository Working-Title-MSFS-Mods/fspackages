class WT_G3000_PFDBottomInfo extends WT_G3x5_PFDBottomInfo {
    _initInfoCells() {
        this.addCell(new WT_G3x5_PFDBottomInfoAirspeedCell(this.instrument.unitsController));
        this.addCell(new WT_G3x5_PFDBottomInfoTemperatureCell(this.instrument.unitsController));

        let bearingCellLeft = new WT_G3000_PFDBottomInfoBearingCell(this.instrument.bearingInfos.getModel(WT_G3x5_PFDBearingInfoContainer.Slot.ONE));
        bearingCellLeft.htmlElement.setOrientation(WT_G3000_PFDBottomInfoBearingCellHTMLElement.Orientation.LEFT);
        this.addCell(bearingCellLeft);

        let bearingCellRight = new WT_G3000_PFDBottomInfoBearingCell(this.instrument.bearingInfos.getModel(WT_G3x5_PFDBearingInfoContainer.Slot.TWO));
        bearingCellRight.htmlElement.setOrientation(WT_G3000_PFDBottomInfoBearingCellHTMLElement.Orientation.RIGHT);
        this.addCell(bearingCellRight);

        this.addCell(new WT_G3x5_PFDBottomInfoTimeCell());
    }
}

class WT_G3000_PFDBottomInfoBearingCell extends WT_G3x5_PFDBottomInfoBearingCell {
    _createHTMLElement() {
        return new WT_G3000_PFDBottomInfoBearingCellHTMLElement();
    }
}

class WT_G3000_PFDBottomInfoBearingCellHTMLElement extends WT_G3x5_PFDBottomInfoBearingCellHTMLElement {
    constructor() {
        super();

        this._orientation = WT_G3000_PFDBottomInfoBearingCellHTMLElement.Orientation.LEFT;
    }

    _getTemplate() {
        return WT_G3000_PFDBottomInfoBearingCellHTMLElement.TEMPLATE;
    }

    connectedCallback() {
        super.connectedCallback();

        this._updateOrientation();
    }

    _updateOrientation() {
        this.setAttribute("orientation", this._orientation);
    }

    setOrientation(orientation) {
        if (orientation === this._orientation) {
            return;
        }

        this._orientation = orientation;
        this._updateOrientation();
    }
}
/**
 * @enum {String}
 */
WT_G3000_PFDBottomInfoBearingCellHTMLElement.Orientation = {
    LEFT: "left",
    RIGHT: "right"
}
WT_G3000_PFDBottomInfoBearingCellHTMLElement.NAME = "wt-pfd-bottominfo-bearingcell";
WT_G3000_PFDBottomInfoBearingCellHTMLElement.TEMPLATE = document.createElement("template");
WT_G3000_PFDBottomInfoBearingCellHTMLElement.TEMPLATE.innerHTML = `
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
        }
            #top {
                position: relative;
                display: block;
                width: 100%;
            }
                #distance {
                    position: absolute;
                    width: auto;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #9e6daf;
                }
                :host([orientation=left]) #distance {
                    text-align: right;
                    right: var(--bearingcell-top-centermargin, 50%);
                }
                :host([orientation=right]) #distance {
                    text-align: left;
                    left: var(--bearingcell-top-centermargin, 50%);
                }
            #bottom {
                position: relative;
                width: 100%;
                height: 100%;
                display: grid;
                grid-template-rows: 100%;
            }
                :host([orientation=left]) #bottom {
                    grid-template-columns: 90% 10%;
                    grid-template-areas:
                        "bottomText arrow";
                }
                :host([orientation=right]) #bottom {
                    grid-template-columns: 10% 90%;
                    grid-template-areas:
                        "arrow bottomText";
                }
                #bottomText {
                    position: relative;
                    width: 100%;
                    display: flex;
                    flex-wrap: nowrap;
                    align-items: baseline;
                    text-align: center;
                    font-family: var(--bearingcell-bottom-font-family, inherit);
                    font-weight: var(--bearingcell-bottom-font-weight, inherit);
                    grid-area: bottomText;
                    align-self: center;
                }
                :host([orientation=left]) #bottomText {
                    flex-direction: row;
                }
                :host([orientation=right]) #bottomText {
                    flex-direction: row-reverse;
                }
                    #bearing {
                        width: 31.5%;
                        color: #9e6daf;
                    }
                    #ident {
                        width: 42.5%;
                        color: white;
                    }
                    #source {
                        width: 26%;
                        color: #67e8ef;
                        font-size: var(--bearingcell-source-font-size, 0.9em);
                    }
                    #nodata {
                        width: 74%;
                        display: none;
                        color: white;
                    }
                    #nosource {
                        width: 74%;
                        display: none;
                        color: transparent;
                    }
                    #wrapper[nodata="true"] #bearing,
                    #wrapper[nosource="true"] #bearing {
                        display: none;
                    }
                    #wrapper[nodata="true"] #ident,
                    #wrapper[nosource="true"] #ident {
                        display: none;
                    }
                    #wrapper[nodata="true"] #nodata {
                        display: block;
                    }
                    #wrapper[nosource="true"] #nosource {
                        display: block;
                    }
                #arrow {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    grid-area: arrow;
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

            .${WT_G3x5_PFDBottomInfoBearingCellHTMLElement.UNIT_CLASS} {
                font-size: var(--bearingcell-unit-font-size, 0.75em);
            }
    </style>
    <div id="wrapper">
        <div id="top">
            <div id="distance"></div>
        </div>
        <div id="bottom">
            <div id="bottomText">
                <div id="bearing"></div>
                <div id="ident"></div>
                <div id="nodata">NO DATA</div>
                <div id="nosource">NO SOURCE</div>
                <div id="source"></div>
            </div>
            <div id="arrow">
                <svg id="arrowSVG1" viewBox="0 0 50 100">
                    <path d="M 25 0 L 25 100 M 0 40 L 25 20 L 50 40" />
                </svg>
                <svg id="arrowSVG2" viewBox="0 0 50 100">
                    <path d="M 25 0 L 25 20 M 0 40 L 25 20 L 50 40 L 37.5 30 L 37.5 90 L 12.5 90 L 12.5 30 L 0 40 M 25 90 L 25 100" />
                </svg>
            </div>
        </div>
    </div>
`;

customElements.define(WT_G3000_PFDBottomInfoBearingCellHTMLElement.NAME, WT_G3000_PFDBottomInfoBearingCellHTMLElement);