class WT_PFD_Procedure_Page_Model extends WT_Model {
    /**
     * @param {FlightPlanManager} flightPlanManager 
     * @param {WT_Procedure_Facility_Repository} procedureFacilityRepository
     */
    constructor(flightPlanManager, procedureFacilityRepository) {
        super();
        this.flightPlanManager = flightPlanManager;
        this.procedureFacilityRepository = procedureFacilityRepository;

        this.icao = null;
        this.airport = new Subject();
        this.initialProcedureIndex = 0;
    }
    setICAO(icao) {
        this.icao = icao;
        this.airport.value = this.procedureFacilityRepository.get(icao);
    }
    setInitialProcedureIndex(index) {
        this.initialProcedureIndex = index;
    }
    /**
     * @param {WT_Selected_Procedure} procedure 
     */
    async loadProcedure(procedure) {
        procedure.load(this.flightPlanManager);
    }
    /**
     * @param {WT_Selected_Procedure} procedure 
     */
    async activateProcedure(procedure) {
        procedure.activate(this.flightPlanManager);
    }
}

class WT_PFD_Procedure_Page_View extends WT_HTML_View {
    /**
     * @param {WT_Icao_Input_Model} icaoInputModel 
     * @param {WT_HTML_View} procedurePage
     */
    constructor(icaoInputModel, procedurePage) {
        super();

        this.icaoInputModel = icaoInputModel;
        this.procedurePage = procedurePage;

        this.inputLayer = new Selectables_Input_Layer(new Selectables_Input_Layer_Dynamic_Source(this));

        this.onExit = new WT_Event();

        if (this.procedurePage.onLoadProcedure) {
            this.procedurePage.onLoadProcedure.subscribe(selectedProcedure => {
                this.model.loadProcedure(selectedProcedure);
            });
        }
        if (this.procedurePage.onActiveProcedure) {
            this.procedurePage.onActiveProcedure.subscribe(selectedProcedure => {
                this.model.activateProcedure(selectedProcedure);
            });
        }
    }
    /**
     * @param {WT_Procedure_Page_Model} model 
     */
    setModel(model) {
        this.model = model;
        this.procedurePage.setAirport(this.model.airport);
    }
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;

        const template = document.getElementById('procedure-page');
        this.appendChild(template.content.cloneNode(true));
        super.connectedCallback();

        this.elements.page.appendChild(this.procedurePage);
        this.elements.icaoInput.setModel(this.icaoInputModel);
    };
    disconnectedCallback() {
        this.procedurePage.setAirport(null);
    }
    updateIcao(icao) {
        this.model.setICAO(icao);
    }
    /**
     * @param {Input_Stack} inputStack 
     */
    enter(inputStack) {
        this.inputStackHandle = inputStack.push(this.inputLayer);
        this.inputStackHandle.onPopped.subscribe(() => {
            this.onExit.fire();
        });
    }
    exit() {
        if (this.inputStackHandle) {
            this.inputStackHandle = this.inputStackHandle.pop();
        }
    }
}
customElements.define("g1000-pfd-procedures-page", WT_PFD_Procedure_Page_View);