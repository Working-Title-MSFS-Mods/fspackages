class WT_Arrival_Page_View extends WT_HTML_View {
    constructor() {
        super();

        this.procedures = new Subject([]);
        this.selectedProcedure = new Subject(null);

        this.onLoadProcedure = new WT_Event();
    }
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;
        
        let template = document.getElementById('arrival-page');
        this.appendChild(template.content.cloneNode(true));
        super.connectedCallback();

        this.procedures.subscribe(this.updateProcedures.bind(this));

        this.selectedProcedure.subscribe(selectedProcedure => {
            this.updateRunwayTransitions(selectedProcedure ? selectedProcedure.procedure.getRunwayTransitions() : []);
            this.updateEnRouteTransitions(selectedProcedure ? selectedProcedure.procedure.getEnRouteTransitions() : []);
        });

        this.elements.procedureSelector.addEventListener("change", e => this.setProcedure(e.target.value));
        this.elements.runwayTransitionSelector.addEventListener("input", DOMUtilities.debounce(e => this.setRunwayTransition(e.target.value), 200, false));
        this.elements.enRouteTransitionSelector.addEventListener("input", DOMUtilities.debounce(e => this.setEnRouteTransition(e.target.value), 200, false));
    }
    /**
     * @param {Subject} airport 
     */
    setAirport(airport) {
        if (this.airportSubscription) {
            this.airportSubscription = this.airportSubscription();
        }
        if (airport) {
            this.airportSubscription = airport.subscribe(async airport => {
                this.procedures.value = airport ? await airport.getArrivals() : [];
            });
        }
    }
    /**
     * @param {WT_Arrival_Procedure[]} procedures 
     */
    updateProcedures(procedures) {
        try {
            this.elements.procedureSelector.clearOptions();
            let i = 0;
            for (let procedure of procedures) {
                i == 0 ? this.setProcedure(i) : null;
                this.elements.procedureSelector.addOption(i++, procedure.name);
            }
        } catch (e) {
            console.error(e.message);
        }
    }
    setProcedure(procedureIndex) {
        this.selectedProcedure.value = new WT_Selected_Arrival_Procedure(this.procedures.value[procedureIndex]);
        this.updateSequence();
    }
    updateRunwayTransitions(transitions) {
        this.elements.runwayTransitionSelector.clearOptions();
        if (transitions) {
            let i = 0;
            for (let transition of transitions) {
                i == 0 ? this.setRunwayTransition(i) : null;
                this.elements.runwayTransitionSelector.addOption(i++, transition.name);
            }
        }
    }
    setRunwayTransition(index) {
        this.selectedProcedure.value.setRunwayTransitionIndex(index);
        this.updateSequence();
    }
    updateEnRouteTransitions(transitions) {
        this.elements.enRouteTransitionSelector.clearOptions();
        if (transitions) {
            let i = 0;
            for (let transition of transitions) {
                i == 0 ? this.setEnRouteTransition(i) : null;
                this.elements.enRouteTransitionSelector.addOption(i++, transition.name);
            }
        }
    }
    setEnRouteTransition(index) {
        this.selectedProcedure.value.setEnRouteTransitionIndex(index);
        this.updateSequence();
    }
    updateSequence() {
        if (!this.elements.sequenceList)
            return;
        if (this.selectedProcedure.value) {
            this.elements.sequenceList.updateSequence(this.selectedProcedure.value.getSequence());
        } else {
            this.elements.sequenceList.updateSequence(null);
        }
    }
    loadProcedure() {
        this.onLoadProcedure.fire(this.selectedProcedure.value);
    }
}
customElements.define("g1000-arrival-page", WT_Arrival_Page_View);