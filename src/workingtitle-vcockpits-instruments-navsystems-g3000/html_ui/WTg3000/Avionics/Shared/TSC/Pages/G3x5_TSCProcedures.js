class WT_G3x5_TSCProcedures extends WT_G3x5_TSCPageElement {
    /**
     * @param {String} homePageGroup
     * @param {String} homePageName
     */
    constructor(homePageGroup, homePageName) {
        super(homePageGroup, homePageName);


    }

    /**
     * @readonly
     * @type {WT_G3x5_TSCProceduresHTMLElement}
     */
    get htmlElement() {
        return this._htmlElement;
    }

    _createHTMLElement() {
        return new WT_G3x5_TSCProceduresHTMLElement();
    }

    _initHTMLElement() {
        this.htmlElement.setFlightPlan(this._fpm.activePlan);
    }

    init(root) {
        this._fpm = this.instrument.flightPlanManagerWT;

        this.container.title = WT_G3x5_TSCProcedures.TITLE;
        this._htmlElement = this._createHTMLElement();
        root.appendChild(this.htmlElement);
        this._initHTMLElement();
    }

    onUpdate(deltaTime) {
        let activeLeg = this._fpm.getActiveLeg(true);
        let isApproachActive = activeLeg && activeLeg.segment === WT_FlightPlan.Segment.APPROACH;
        this.htmlElement.update(isApproachActive);
    }
}
WT_G3x5_TSCProcedures.TITLE = "Procedures";

class WT_G3x5_TSCProceduresHTMLElement extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});
        this.shadowRoot.appendChild(this._getTemplate().content.cloneNode(true));

        this._flightPlanListener = this._onFlightPlanEvent.bind(this);

        /**
         * @type {WT_FlightPlan}
         */
        this._flightPlan = null;
        this._isApproachActive = false;
        this._isInit = false;
    }

    _getTemplate() {
        return WT_G3x5_TSCProceduresHTMLElement.TEMPLATE;
    }

    /**
     * @readonly
     * @type {Boolean}
     */
    get isInitialized() {
        return this._isInit;
    }

    async _defineChildren() {
        [
            this._departureButton,
            this._arrivalButton,
            this._approachButton,
            this._activateApproachButton
        ] = await Promise.all([
            WT_CustomElementSelector.select(this.shadowRoot, `#departure`, WT_TSCValueButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#arrival`, WT_TSCValueButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#approach`, WT_TSCValueButton),
            WT_CustomElementSelector.select(this.shadowRoot, `#activateapproach`, WT_TSCLabeledButton),
        ]);
    }

    async _connectedCallbackHelper() {
        await this._defineChildren();
        this._isInit = true;
        this._updateFromFlightPlan();
        if (this._flightPlan) {
            this._updateDepartureButton();
            this._updateArrivalButton();
            this._updateApproachButton();
            this._updateActivateApproachButton();
        }
    }

    connectedCallback() {
        this._connectedCallbackHelper();
    }

    _cleanUpFlightPlan() {
        if (!this._flightPlan) {
            return;
        }

        this._flightPlan.removeListener(this._flightPlanListener);
    }

    _updateFromFlightPlan() {
        if (!this._flightPlan) {
            return;
        }

        this._flightPlan.addListener(this._flightPlanListener);
    }

    setFlightPlan(flightPlan) {
        if (this._flightPlan === flightPlan) {
            return;
        }

        this._cleanUpFlightPlan();
        this._flightPlan = flightPlan;
        if (this._isInit) {
            this._updateFromFlightPlan();
        }
    }

    _getDepartureDisplayText() {
        if (this._flightPlan.hasDeparture()) {
            let departure = this._flightPlan.getDeparture();
            let departureProcedure = departure.procedure;
            let rwyTransition = departureProcedure.runwayTransitions.getByIndex(departure.runwayTransitionIndex);
            let enrouteTransition = departureProcedure.enrouteTransitions.getByIndex(departure.enrouteTransitionIndex);
            let prefix = `${rwyTransition ? `RW${rwyTransition.runway.designationFull}` : "ALL"}.`;
            let suffix = (enrouteTransition && departure.legs.length > 0) ? `.${departure.legs.last().fix.ident}` : "";
            return `${departureProcedure.airport.ident}–${prefix}${departureProcedure.name}${suffix}`;
        } else {
            return "____";
        }
    }

    _getArrivalDisplayText() {
        if (this._flightPlan.hasArrival()) {
            let arrival = this._flightPlan.getArrival();
            let arrivalProcedure = arrival.procedure;
            let enrouteTransition = arrivalProcedure.enrouteTransitions.getByIndex(arrival.enrouteTransitionIndex);
            let rwyTransition = arrivalProcedure.runwayTransitions.getByIndex(arrival.runwayTransitionIndex);
            let prefix = (enrouteTransition && arrival.legs.length > 0) ? `${arrival.legs.first().fix.ident}.` : "";
            let suffix = `.${rwyTransition ? `RW${rwyTransition.runway.designationFull}` : "ALL"}`;
            return `${arrivalProcedure.airport.ident}–${prefix}${arrivalProcedure.name}${suffix}`;
        } else {
            return "____";
        }
    }

    _getApproachDisplayText() {
        if (this._flightPlan.hasApproach()) {
            let approach = this._flightPlan.getApproach();
            let approachProcedure = approach.procedure;
            return `${approachProcedure.airport.ident}–${approachProcedure.name}`;
        } else {
            return "____";
        }
    }

    _updateDepartureButton() {
        this._departureButton.enabled = this._flightPlan.isOriginAirport();
        this._departureButton.valueText = this._getDepartureDisplayText();
    }

    _updateArrivalButton() {
        this._arrivalButton.enabled = this._flightPlan.isDestinationAirport();
        this._arrivalButton.valueText = this._getArrivalDisplayText();
    }

    _updateApproachButton() {
        this._approachButton.enabled = this._flightPlan.isDestinationAirport();
        this._approachButton.valueText = this._getApproachDisplayText();
    }

    _updateActivateApproachButton() {
        this._activateApproachButton.enabled = this._flightPlan.hasApproach() && !this._isApproachActive;
    }

    /**
     *
     * @param {WT_FlightPlanEvent} event
     */
    _onFlightPlanEvent(event) {
        if (event.anyType(WT_FlightPlanEvent.Type.ORIGIN_CHANGED | WT_FlightPlanEvent.Type.DEPARTURE_CHANGED)) {
            this._updateDepartureButton();
        }
        if (event.anyType(WT_FlightPlanEvent.Type.ARRIVAL_CHANGED | WT_FlightPlanEvent.Type.DESTINATION_CHANGED)) {
            this._updateArrivalButton();
        }
        if (event.anyType(WT_FlightPlanEvent.Type.APPROACH_CHANGED | WT_FlightPlanEvent.Type.DESTINATION_CHANGED)) {
            this._updateApproachButton();
            this._updateActivateApproachButton();
        }
    }

    _updateApproachActive(isApproachActive) {
        if (this._isApproachActive === isApproachActive) {
            return;
        }

        this._isApproachActive = isApproachActive;
        this._updateActivateApproachButton();
    }

    _doUpdate(isApproachActive) {
        this._updateApproachActive(isApproachActive);
    }

    update(isApproachActive) {
        if (!this._isInit) {
            return;
        }

        this._doUpdate(isApproachActive);
    }
}
WT_G3x5_TSCProceduresHTMLElement.NAME = "wt-tsc-procedures";
WT_G3x5_TSCProceduresHTMLElement.TEMPLATE = document.createElement("template");
WT_G3x5_TSCProceduresHTMLElement.TEMPLATE.innerHTML = `
    <style>
        :host {
            display: block;
        }

        #wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: repeat(4, 1fr);
            grid-template-columns: 100%;
            grid-gap: var(--procedures-grid-row-gap, 0.5em) 0;
            justify-items: center;
        }
            .procedureButton {
                width: var(--procedures-procedurebutton-width, 90%);
                --button-value-font-size: var(--procedures-procedurebutton-value-font-size, 1.25em);
            }
            #bottom {
                width: 100%;
                display: grid;
                grid-template-rows: 100%;
                grid-template-columns: repeat(3, 1fr);
                grid-gap: 0 var(--procedures-bottom-grid-column-gap, 1em);
            }
    </style>
    <div id="wrapper">
        <wt-tsc-button-value id="departure" class="procedureButton" labeltext="Departure"></wt-tsc-button-value>
        <wt-tsc-button-value id="arrival" class="procedureButton" labeltext="Arrival"></wt-tsc-button-value>
        <wt-tsc-button-value id="approach" class="procedureButton" labeltext="Approach"></wt-tsc-button-value>
        <div id="bottom">
            <wt-tsc-button-label id="activateapproach" labeltext="Activate Approach" enabled="false"></wt-tsc-button-label>
            <wt-tsc-button-label id="activatevectors" labeltext="Activate Vectors To Final" enabled="false"></wt-tsc-button-label>
            <wt-tsc-button-label id="activatemissed" labeltext="Activate Missed Approach" enabled="false"></wt-tsc-button-label>
        </div>
    </div>
`;

customElements.define(WT_G3x5_TSCProceduresHTMLElement.NAME, WT_G3x5_TSCProceduresHTMLElement);