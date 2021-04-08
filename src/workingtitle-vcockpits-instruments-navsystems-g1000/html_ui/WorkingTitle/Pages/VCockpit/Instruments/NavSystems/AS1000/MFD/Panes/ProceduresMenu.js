class WT_MFD_Procedures_Menu_View extends WT_Procedures_Menu_View {
    connectedCallback() {
        super.connectedCallback();
        this.subscriptions.add(this.procedures.approach.subscribe(this.updateLoadedApproach.bind(this)));
        this.subscriptions.add(this.procedures.arrival.subscribe(this.updateLoadedArrival.bind(this)));
        this.subscriptions.add(this.procedures.departure.subscribe(this.updateLoadedDeparture.bind(this)));
    }
    updateLoadedApproach(approach) {
        this.elements.loadedApproach.textContent = approach ? approach.name : "____-";
        this.elements.loadedApproach.classList.toggle("highlighted", approach != null);
    }
    updateLoadedArrival(arrival) {
        this.elements.loadedArrival.textContent = arrival ? arrival.name : "____-";
        this.elements.loadedArrival.classList.toggle("highlighted", arrival != null);
    }
    updateLoadedDeparture(departure) {
        this.elements.loadedDeparture.textContent = departure ? departure.name : "____-";
        this.elements.loadedDeparture.classList.toggle("highlighted", departure != null);
    }
}
customElements.define("g1000-mfd-procedures-menu", WT_MFD_Procedures_Menu_View);