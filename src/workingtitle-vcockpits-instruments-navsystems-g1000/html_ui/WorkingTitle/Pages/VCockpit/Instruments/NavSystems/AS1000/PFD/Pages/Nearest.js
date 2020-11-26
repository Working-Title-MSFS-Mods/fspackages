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
    }
    /**
     * @param {WT_Nearest_Airports_Model} model 
     */
    setModel(model) {
        this.model = model;
        this.inputLayer = new WT_PFD_Nearest_Airports_Input_Layer(this.model, this);
        model.airports.subscribe(this.updateAirports.bind(this));
    }
    updateAirports(airports) {
        let listElement = this.elements.airportList;

        if (!airports)
            return;

        let elements = [];
        for (let airport of airports) {
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

            }
            element.dataset.icao = airport.icao;
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
            element.querySelector(".bearing").innerHTML = airport.bearing.toFixed(0) + "°";
            element.querySelector(".distance").innerHTML = this.model.unitChooser.chooseDistance((airport.distance * 1.852).toFixed(1) + "<span class='units'>KM</span>", airport.distance.toFixed(1) + "<span class='units'>NM</span>");
            elements.push(element);
        }

        let firstElement = listElement.firstChild;
        let previousElement = null;
        let modifications = 0;
        let first = true;
        for (let element of elements) {
            if (previousElement && previousElement.nextSibling == element || (first && firstElement == element)) {
            } else {
                if (previousElement && previousElement.nextSibling) {
                    listElement.insertBefore(element, first ? listElement.firstChild : previousElement.nextSibling);
                } else {
                    if (first) {
                        listElement.insertBefore(element, listElement.firstChild);
                    } else {
                        listElement.appendChild(element);
                    }
                }
                modifications++;
            }
            previousElement = element;
            first = false;
        }
        if (previousElement) {
            let remove = previousElement.nextSibling;
            while (remove) {
                let next = remove.nextSibling;
                listElement.removeChild(remove);
                remove = next;
            }
        }
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
    }
    deactivate() {
        this.model.unsubscribe();
    }
}
customElements.define("g1000-pfd-nearest-airports", WT_PFD_Nearest_View);