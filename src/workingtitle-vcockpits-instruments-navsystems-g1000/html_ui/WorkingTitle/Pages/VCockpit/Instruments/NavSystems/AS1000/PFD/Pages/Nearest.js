class WT_PFD_Nearest_Airports_Input_Layer extends Selectables_Input_Layer {
    /**
     * @param {WT_Nearest_Airports_Model} model 
     * @param {*} view 
     */
    constructor(model, view) {
        super(new Selectables_Input_Layer_Dynamic_Source(view, ".ident, .frequency"));
        this.model = model;
        this.view = view;
    }
    onDirectTo() {
        if (this.selectedElement) {
            this.model.directTo(this.selectedElement.parentNode.dataset.icao);
        }
    }
}

class WT_PFD_Nearest_View extends WT_HTML_View {
    constructor() {
        super();

        this.activated$ = new rxjs.Subject();
    }
    /**
     * @param {WT_Nearest_Airports_Model} model 
     */
    setModel(model) {
        this.model = model;
        this.inputLayer = new WT_PFD_Nearest_Airports_Input_Layer(this.model, this);

        this.activated$.pipe(
            rxjs.operators.switchMap(activated => {
                if (activated) {
                    return model.airports;
                } else {
                    return rxjs.empty();
                }
            })
        ).subscribe(this.updateAirports.bind(this));
    }
    updateAirports(airports) {
        const listElement = this.elements.airportList;

        if (!airports)
            return;

        const elements = [];
        for (const airport of airports) {
            if (airport == null)
                continue;
            let element = listElement.querySelector(`[data-icao="${airport.icao}"]`);
            if (!element) {
                element = document.createElement("li");
                element.innerHTML = `
                    <span class="ident"></span>
                    <airport-icon></airport-icon>
                    <span class="bearing"></span>
                    <span class="distance"></span>
                    <span class="approach">VFR</span>
                    <span class="com-name"></span>
                    <span class="frequency"></span>
                    <span class="runway">RNWY</span>
                    <span class="runway-length"></span>
                `;
                element.querySelector(".ident").innerHTML = airport.ident;
                element.querySelector("airport-icon").angle = airport.longestRunwayDirection;
                element.querySelector("airport-icon").applyInfo(airport);

                if (airport.frequencyName)
                    element.querySelector(".com-name").innerHTML = airport.frequencyName;
                else
                    element.querySelector(".com-name").innerHTML = "----------";
                if (airport.frequencyMHz)
                    element.querySelector(".frequency").innerHTML = airport.frequencyMHz.toFixed(2);
                else
                    element.querySelector(".frequency").innerHTML = "___.__";
                if (airport.bestApproach)
                    element.querySelector(".approach").innerHTML = airport.bestApproach;
                element.querySelector(".runway-length").innerHTML = airport.longestRunwayLength.toFixed(0) + "<span class='units'>FT</span>";
            }
            element.dataset.icao = airport.icao;
            Avionics.Utils.diffAndSet(element.querySelector(".bearing"), `${airport.bearing.toFixed(0)}°`);
            Avionics.Utils.diffAndSet(element.querySelector(".distance"), this.model.unitChooser.chooseDistance(`${(airport.distance * 1.852).toFixed(1)}<span class='units'>KM</span>`, `${airport.distance.toFixed(1)}<span class='units'>NM</span>`));
            elements.push(element);
        }

        this.inputLayer.refreshSelected();

        DOMUtilities.repopulateElement(listElement, elements);
    }
    update(dt) {
        this.model.update(dt);
    }
    enter(inputStack) {
        this.inputHandle = inputStack.push(this.inputLayer);
    }
    exit() {
        if (this.inputHandle) {
            this.inputHandle = this.inputHandle.pop();
        }
    }
    activate() {
        this.model.subscribe();
        this.inputLayer.refreshSelected();
        this.activated$.next(true);
    }
    deactivate() {
        this.model.unsubscribe();
        this.activated$.next(false);
    }
}
customElements.define("g1000-pfd-nearest-airports", WT_PFD_Nearest_View);