class WT_Approach_Page_View extends WT_HTML_View {
    constructor() {
        super();

        this.procedures = new Subject([]);
        this.selectedProcedure = new Subject(null);
        this.primaryFrequency = new Subject(null);

        this.onLoadProcedure = new WT_Event();
        this.onActivateProcedure = new WT_Event();
    }
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;

        let template = document.getElementById('approach-page');
        this.appendChild(template.content.cloneNode(true));
        super.connectedCallback();

        this.procedures.subscribe(this.updateProcedures.bind(this));

        this.selectedProcedure.subscribe(selectedProcedure => {
            if (selectedProcedure) {
                this.primaryFrequency.value = selectedProcedure.procedure.getPrimaryFrequency();
                this.updateTransitions(selectedProcedure.procedure.getTransitions());
            }
        });

        this.primaryFrequency.subscribe(this.updatePrimaryFrequency.bind(this));

        this.elements.procedureSelector.addEventListener("change", e => this.setProcedure(e.target.value));
        this.elements.transitionSelector.addEventListener("input", DOMUtilities.debounce(e => this.setTransition(e.target.value), 200, false));
        this.elements.primaryFrequencyHz.addEventListener("selected", e => this.selectFrequency(this.primaryFrequency.value));
    }
    selectFrequency(frequency) {
        SimVar.SetSimVarValue("K:NAV1_RADIO_SWAP", "number", 0);
        SimVar.SetSimVarValue("K:NAV1_RADIO_SET_HZ", "hertz", Math.floor(parseFloat(frequency.mhValue) * 1000000));
    }
    /**
     * @param {Subject} airport 
     */
    setAirport(airport, initialProcedureIndex = 0) {
        if (this.airportSubscription) {
            this.airportSubscription = this.airportSubscription.unsubscribe();
        }
        if (airport) {
            this.airportSubscription = airport.subscribe(async airport => {
                this.procedures.value = airport ? await airport.getApproaches() : [];
            });
        }
        this.initialProcedureIndex = initialProcedureIndex;
    }
    /**
     * @param {WT_Approach_Procedure[]} procedures 
     */
    updateProcedures(procedures) {
        this.elements.procedureSelector.clearOptions();
        let i = 0;
        for (let procedure of procedures) {
            i == this.initialProcedureIndex ? this.setProcedure(i) : null;
            this.elements.procedureSelector.addOption(i, procedure.name);
            i++;
        }
        this.initialProcedureIndex = 0;
    }
    setProcedure(procedureIndex) {
        this.selectedProcedure.value = new WT_Selected_Approach_Procedure(this.procedures.value[procedureIndex]);
    }
    updatePrimaryFrequency(frequency) {
        if (frequency) {
            this.elements.primaryFrequencyName.textContent = frequency.name;
            this.elements.primaryFrequencyHz.textContent = frequency.mhValue.toFixed(3);
        } else {
            this.elements.primaryFrequencyName.textContent = "____";
            this.elements.primaryFrequencyHz.textContent = "___.__";
        }
    }
    /**
     * @param {WT_Approach_Transition[]} transitions 
     */
    updateTransitions(transitions) {
        this.elements.transitionSelector.clearOptions();
        if (transitions) {
            let i = 0;
            for (let transition of transitions) {
                i == 0 ? this.setTransition(i) : null;
                this.elements.transitionSelector.addOption(i++, transition.name);
            }
        }
    }
    setTransition(transitionIndex) {
        this.selectedProcedure.value.setTransitionIndex(transitionIndex);
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
    activateProcedure() {
        this.onActivateProcedure.fire(this.selectedProcedure.value);
    }
}
customElements.define("g1000-approach-page", WT_Approach_Page_View);