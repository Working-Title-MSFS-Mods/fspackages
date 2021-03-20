class WT_G3x5_TSCFlightPlan extends WT_G3x5_TSCPageElement {
    /**
     *
     * @param {String} homePageGroup
     * @param {String} homePageName
     * @param {WT_FlightPlanManager} flightPlanManager
     */
    constructor(homePageGroup, homePageName, flightPlanManager) {
        super(homePageGroup, homePageName);

        this._fpm = flightPlanManager;
        this._displayedView = null;

        this._flightPlanListener = this._onDisplayedFlightPlanChanged.bind(this);

        this._rows = [];
        this._rowsHead = 0;

        this._setDisplayedFlightPlan(this._fpm.activePlan);
    }

    init(root) {
        this._table = root.querySelector(`tsc-flightplan-table`);
    }

    /**
     * @returns {WT_G3x5_TSCFlightPlanRowHTMLElement}
     */
    requestRow() {
        if (this._rowsHead === this._rows.length) {
            let newRow = WT_G3x5_TSCFlightPlanRowHTMLElement();
            this._table.addRow(newRow);
            this._rowsHead.push(newRow);
        }
        let row = this._rows[this._rowsHead++];
        row.setVisible(true);
        return row;
    }

    /**
     *
     * @param {WT_FlightPlan} flightPlan
     */
    _setDisplayedFlightPlan(flightPlan) {
        if (this._displayedView) {
            this._displayedView.flightPlan.removeListener(this._flightPlanListener);
        }

        this._displayedView = new WT_G3x5_TSCFlightPlanView(flightPlan);
        flightPlan.addListener(this._flightPlanListener);
        this._redrawFlightPlan();
    }

    _clearTable() {
        this._displayedView.cleanup();
        for (let row of this._rows) {
            row.setVisible(false);
        }
        this._rowsHead = 0;
    }

    _redrawFlightPlan() {
        this._clearTable();
        this._displayedView.draw(this);
    }

    _onDisplayedFlightPlanChanged(event) {
        if (event.types !== WT_FlightPlanEvent.Type.LEG_ALTITUDE_CHANGED) {
            this._redrawFlightPlan();
        } else {
        }
    }
}

class WT_G3x5_TSCFlightPlanHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCFlightPlanHTMLElement.TEMPLATE.content.cloneNode(true));
    }
}
WT_G3x5_TSCFlightPlanHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCFlightPlanHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            width: 100%;
            height: 100%;
        }

        #buttons {
            position: absolute;
        }
    </style>
    <wrapper>
        <slot name="left" id="left"></slot>
        <slot name="table" id="table"></slot>
        <slot name="popup" id="right"></slot>
    </wrapper>
`;

customElements.define("tsc-flightplan", WT_G3x5_TSCFlightPlanHTMLElement);

class WT_G3x5_TSCFlightPlanTableHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCFlightPlanTableHTMLElement.TEMPLATE.content.cloneNode(true));
    }

    addRow(row) {
        row.slot = "rows";
        this.appendChild(row);
    }
}
WT_G3x5_TSCFlightPlanTableHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCFlightPlanTableHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            width: 100%;
            height: 100%;
        }

        #table {
            position: relative;
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-columns: auto;
            grid-template-rows: var(--flightplan-table-head-height, 5vh) auto;
        }
            #head {
                width: 100%;
                height: 100%;
                grid-template-rows: auto;
                grid-template-columns: var(--flightplan-table-grid-columns, 50% 25% 25%);
            }
            #rowscontainer {
                position: relative;
            }
                #rows {
                    display: block;
                    position: relative;
                    height: 100%;
                    width: 100%;
                    overflow-x: hidden;
                    overflow-y: scroll;
                }
                    #rows::-webkit-scrollbar {
                        width: 1vw;
                    }
                    #rows::-webkit-scrollbar-track {
                        background: none;
                    }
                    #rows::-webkit-scrollbar-thumb {
                        background: white;
                    }
    </style>
    <div id="table">
        <div id="head">
            <div id="nametitle">______/______</div>
            <div id="alttitle">ALT</div>
            <div id="dtkdistitle">DTK/DIS</div>
        </div>
        <div id="rowscontainer">
            <slot name="rows"></slot>
        </div>
    </div>
`;

customElements.define("tsc-flightplan-table", WT_G3x5_TSCFlightPlanTableHTMLElement);

class WT_G3x5_TSCFlightPlanRowHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCFlightPlanRowHTMLElement.TEMPLATE.content.cloneNode(true));

        this._initLeg();
        this._initEnrouteFooter();

        this._mode = "";
    }

    _initLeg() {
        this._dtkDis = WT_G3x5_TSCFlightPlanDTKDISHTMLElement();
    }

    _initEnrouteFooter() {
        this._enrouteFooterAdd = new WT_TSCLabeledButton();
        this._enrouteFooterAdd.labelText = "Add Enroute Waypoint";
        this._enrouteFooterDone = new WT_TSCLabeledButton();
        this._enrouteFooterDone.labelText = "Done";
    }

    /**
     * @readonly
     * @property {WT_G3x5_TSCFlightPlanDTKDISHTMLElement} dtkDisDisplay
     * @type {WT_G3x5_TSCFlightPlanDTKDISHTMLElement}
     */
    get dtkDisDisplay() {
        return this._dtkDis;
    }

    /**
     * @readonly
     * @property {WT_TSCButton} enrouteFooterAddButton
     * @type {WT_TSCLabeledButton}
     */
    get enrouteFooterAddButton() {
        return this._enrouteFooterAdd;
    }

    /**
     * @readonly
     * @property {WT_TSCButton} enrouteFooterDoneButton
     * @type {WT_TSCLabeledButton}
     */
    get enrouteFooterDoneButton() {
        return this._enrouteFooterDone;
    }

    _appendLeg() {
        this._dtkDis.slot = "dtkdis";
        this.appendChild(this._dtkDis);
    }

    _appendEnrouteFooter() {
        this._enrouteFooterAdd.slot = "enroutefooteradd";
        this.appendChild(this._enrouteFooterAdd);
        this._enrouteFooterDone.slot = "enroutefooterdone";
        this.appendChild(this._enrouteFooterDone);
    }

    connectedCallback() {
        this._header = this.shadowRoot.querySelector(`#header`);
        this._leg = this.shadowRoot.querySelector(`#leg`);
        this._enrouteFooter = this.shadowRoot.querySelector(`#enroutefooter`);
        this._appendLeg();
        this._appendEnrouteFooter();
    }

    setVisible(value) {
        this.style.display = value ? "block" : "none";
    }

    setMode(mode) {
        if (this._mode !== mode) {
            this.setAttribute("mode", mode);
            this._mode = mode;
        }
    }
}
/**
 * @enum {String}
 */
WT_G3x5_TSCFlightPlanRowHTMLElement.Mode = {
    NONE: "",
    LEG: "leg",
    HEADER: "header",
    ENROUTE_FOOTER: "enroutefooter"
}
WT_G3x5_TSCFlightPlanRowHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCFlightPlanRowHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
        }

        .mode {
            display: none;
            width: 100%;
            height: 100%;
            grid-template-rows: auto;
            grid-template-columns: var(--flightplan-table-grid-columns, 50% 25% 25%);
        }
            :host([mode=${WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG}]) #leg {
                display: grid;
            }
            :host([mode=${WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.HEADER}]) #header {
                display: grid;
            }
            :host([mode=${WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.ENROUTE_FOOTER}]) #enroutefooter {
                display: grid;
            }

        #headerlabel {
            grid-column: 1 / span 3;
        }

        #enroutefooteradd {
            grid-column: 1 / span 2;
        }
    </style>
    <div class="mode" id="leg">
        <slot name="waypoint" id="waypoint"></slot>
        <slot name="alt" id="alt"></slot>
        <slot name="dtkdis" id="dtkdis"></slot>
    </div>
    <div class="mode" id="header">
        <slot name="headerlabel" id="headerlabel"></slot>
    </div>
    <div class="mode" id="enroutefooter">
        <slot name="enroutefooteradd" id="enroutefooteradd"></slot>
        <slot name="enroutefooterdone" id="enroutefooterdone"></slot>
    </div>
`;

customElements.define("tsc-flightplan-row", WT_G3x5_TSCFlightPlanRowHTMLElement);

class WT_G3x5_TSCFlightPlanDTKDISHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(WT_G3x5_TSCFlightPlanDTKDISHTMLElement.TEMPLATE.content.cloneNode(true));

        let formatterOpts = {
            precision: 0.1,
            maxDigits: 3,
            unitCaps: true
        };
        let htmlFormatterOpts = {
            numberUnitDelim: "",
            classGetter: {
                getNumberClassList() {
                    return ["distanceNumber"];
                },
                getUnitClassList() {
                    return ["distanceUnit"];
                }
            }
        };
        this._disFormatter = new WT_NumberHTMLFormatter(new WT_NumberFormatter(formatterOpts), htmlFormatterOpts);
    }

    connectedCallback() {
        this._dtk = this.shadowRoot.querySelector(`dtk`);
        this._dis = this.shadowRoot.querySelector(`dis`);
    }

    setDTK(dtk) {
        this._dtk.innerHTML = `${dtk}°`;
    }

    setDistance(distance) {
        this._dis.innerHTML = this._disFormatter.getFormattedHTML(distance, WT_Unit.NMILE);
    }
}
WT_G3x5_TSCFlightPlanDTKDISHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCFlightPlanDTKDISHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
            position: relative;
            font-size: 3vh;
            color: white;
        }

        #wrapper {
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-columns: auto;
            grid-template-rows: 50% 50%;
            justify-items: end;
            align-items: center;
        }

        .distanceUnit {
            font-size: 0.75em;
        }
    </style>
    <div id="wrapper">
        <div id="dtk"></div>
        <div id="dis"></div>
    </div>
`;

customElements.define("tsc-flightplan-leg-dtkdis", WT_G3x5_TSCFlightPlanDTKDISHTMLElement);

class WT_G3x5_FlightPlanView {
    /**
     * @param {WT_FlightPlan} flightPlan
     */
    constructor(flightPlan) {
        this._flightPlan = flightPlan;

        this._origin = new WT_G3x5_TSCFlightPlanOriginView(flightPlan.getOrigin());
        this._enroute = new WT_G3x5_TSCFlightPlanEnrouteView(flightPlan.getEnroute());
        this._destination = new WT_G3x5_TSCFlightPlanDestinationView(flightPlan.getDestination());

        this._departure = null;
        this._arrival = null;
        this._approach = null;
    }

    /**
     * @readonly
     * @property {WT_FlightPlan} flightPlan
     * @type {WT_FlightPlan}
     */
    get flightPlan() {
        return this._flightPlan;
    }

    draw(pageElement) {
        this._origin.draw(pageElement);
        if (this.flightPlan.hasDeparture()) {
            this._departure = new WT_G3x5_TSCFlightPlanDepartureView(this.flightPlan.getDeparture());
            this._departure.draw(pageElement);
        }
        this._enroute.draw(pageElement);
        if (this.flightPlan.hasArrival()) {
            this._arrival = new WT_G3x5_TSCFlightPlanArrivalView(this.flightPlan.getArrival());
            this._arrival.draw(pageElement);
        }
        if (this.flightPlan.hasApproach()) {
            this._approach = new WT_G3x5_TSCFlightPlanApproachView(this.flightPlan.getApproach());
            this._approach.draw(pageElement);
        }
        this._destination.draw(pageElement);
    }

    cleanup() {
        this._origin.cleanup();
        if (this._departure) {
            this._departure.cleanup();
        }
        this._enroute.cleanup();
        if (this._arrival) {
            this._arrival.cleanup();
        }
        if (this._approach) {
            this._approach.cleanup();
        }
        this._destination.cleanup();
    }
}

class WT_G3x5_TSCFlightPlanElementView {
    /**
     * @param {WT_FlightPlanElement} element
     */
    constructor(element) {
        this._element = element;
    }

    /**
     * @readonly
     * @property {WT_FlightPlanElement} element
     * @type {WT_FlightPlanElement}
     */
    get element() {
        return this._element;
    }

    draw(pageElement) {
    }

    cleanup() {
    }
}

class WT_G3x5_TSCFlightPlanSequenceView extends WT_G3x5_TSCFlightPlanElementView {
    /**
     * @param {WT_FlightPlanSequence} sequence
     */
    constructor(sequence) {
        super(sequence);

        this._children = [];
    }

    _initChildren() {
        for (let element of sequence.elements()) {
            this._children.push(WT_G3x5_TSCFlightPlanElementFactory.create(parent, element));
        }
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlan} pageElement
     */
    _drawHeader(pageElement) {
        this._header = pageElement.requestRow();
        this._header.setMode(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.HEADER);
    }

    _drawChildren(pageElement) {
        for (let child of this._children) {
            child.draw(pageElement);
        }
    }

    draw(pageElement) {
        this._initChildren();
        this._drawHeader(pageElement);
        this._drawChildren(pageElement);
    }

    _cleanupHeader() {

    }

    _cleanupChildren() {
        for (let child of this._children) {
            child.cleanup();
        }
        this._children = [];
    }

    cleanup() {
        this._cleanupHeader();
        this._cleanupChildren();
    }
}

class WT_G3x5_TSCFlightPlanSegmentView extends WT_G3x5_TSCFlightPlanSequenceView {
}

class WT_G3x5_TSCFlightPlanOriginView extends WT_G3x5_TSCFlightPlanSegmentView {
    _drawHeader(pageElement) {
        super._drawHeader(pageElement);
        if (this.element.waypoint) {
            this._header.labelText = `Origin - ${this.element.waypoint.ident}`
        } else {
            this._header.labelText = "Add Origin";
        }
    }
}

class WT_G3x5_TSCFlightPlanDestinationView extends WT_G3x5_TSCFlightPlanSegmentView {
    _drawHeader(pageElement) {
        super._drawHeader(pageElement);
        if (this.element.waypoint) {
            this._header.labelText = `Destination - ${this.element.waypoint.ident}`
        } else {
            this._header.labelText = "Add Destination";
        }
    }
}

class WT_G3x5_TSCFlightPlanDepartureView extends WT_G3x5_TSCFlightPlanSegmentView {

}

class WT_G3x5_TSCFlightPlanEnrouteView extends WT_G3x5_TSCFlightPlanSegmentView {
    _drawHeader(pageElement) {
        if (this.element.length() > 0) {
            super._drawHeader();
            this._header.labelText = "Enroute";
        }
    }

    _drawFooter(pageElement) {
        this._footer = pageElement.requestRow();
        this._footer.setMode(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.ENROUTE_FOOTER);
    }

    draw(pageElement) {
        super.draw(pageElement);
        this._drawFooter(pageElement);
    }
}

class WT_G3x5_TSCFlightPlanArrivalView extends WT_G3x5_TSCFlightPlanSegmentView {

}

class WT_G3x5_TSCFlightPlanApproachView extends WT_G3x5_TSCFlightPlanSegmentView {

}

class WT_G3x5_TSCFlightPlanLegView extends WT_G3x5_TSCFlightPlanElementView {
    /**
     * @param {WT_G3x5_TSCFlightPlan} parent
     * @param {WT_FlightPlanLeg} leg
     */
    constructor(leg) {
        super(leg);
    }

    /**
     *
     * @param {WT_G3x5_TSCFlightPlan} pageElement
     */
    draw(pageElement) {
        this._row = pageElement.requestRow();
        this._row.setMode(WT_G3x5_TSCFlightPlanRowHTMLElement.Mode.LEG);
        this._row.dtkDisDisplay.setDTK(this.element.desiredTrack);
        this._row.dtkDisDisplay.setDistance(this.element.distance);
    }

    cleanup() {

    }
}

class WT_G3x5_TSCFlightPlanElementFactory {
    static create(element) {
        if (element instanceof WT_FlightPlanSequence) {
            return new WT_G3x5_TSCFlightPlanSequenceView(element);
        } else if (element instanceof WT_FlightPlanLeg) {
            return new WT_G3x5_TSCFlightPlanLegView(element);
        }

        return null;
    }
}