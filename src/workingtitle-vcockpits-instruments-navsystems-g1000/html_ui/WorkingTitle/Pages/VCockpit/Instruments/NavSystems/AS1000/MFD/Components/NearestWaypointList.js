class WT_Nearest_Waypoint_List extends WT_HTML_View {
    constructor() {
        super();
        this.selectedIcao = new Subject(null);
        DOMUtilities.AddScopedEventListener(this, ".ident", "highlighted", e => {
            this.selectedIcao.value = e.detail.element.parentNode.dataset.icao;
        });
        this.selectedIcao.subscribe(icao => {
            if (icao !== null) {
                let element = this.querySelector(`[data-icao="${icao}"]`);
                if (element)
                    element.querySelector(".arrow").appendChild(this.arrow);
            }
        })
    }
    connectedCallback() {
        super.connectedCallback();

        this.arrow = document.createElement("div");
        this.arrow.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewbox="0 0 100 100">
            <path d="M0 30 L50 30 L50 0 L100 50 L50 100 L50 70 L0 70 z" fill="white"></path>
        </svg>`;
    }
    setUnitChooser(unitChooser) {
        this.unitChooser = unitChooser;
    }
    setWaypoints(waypoints) {
        let listElement = this;

        let elements = [];
        for (let waypoint of waypoints) {
            if (waypoint == null)
                continue;
            let isAirport = "airportClass" in waypoint;
            let element = listElement.querySelector(`[data-icao="${waypoint.icao}"]`);
            if (!element) {
                element = document.createElement("li");
                element.innerHTML = `
                    <span class="arrow"></span>
                    <span class="ident"></span>
                    ${isAirport ? `<airport-icon></airport-icon>` : `<img class="icon"></img>`}
                    <span class="bearing"><span></span>°</span>
                    <span class="distance"><span></span><span class='units'></span></span>
                `;
                element.querySelector(".ident").innerHTML = waypoint.ident;
                if (isAirport) {
                    element.querySelector("airport-icon").angle = waypoint.longestRunwayDirection;
                    element.querySelector("airport-icon").applyInfo(waypoint);
                } else {
                    //element.querySelector("icon").setAttribute("src",);
                }
            }
            element.dataset.icao = waypoint.icao;
            Avionics.Utils.diffAndSet(element.querySelector(".bearing span"), waypoint.bearing.toFixed(0));
            Avionics.Utils.diffAndSet(element.querySelector(".distance span:first-child"), this.unitChooser.chooseDistance((waypoint.distance * 1.852).toFixed(1), waypoint.distance.toFixed(1)));
            Avionics.Utils.diffAndSet(element.querySelector(".distance .units"), this.unitChooser.chooseDistance("KM", "NM"));
            elements.push(element);
        }
        DOMUtilities.repopulateElement(listElement, elements);

        if (this.selectedIcao.value === null && waypoints.length > 0)
            this.selectedIcao.value = waypoints[0].icao;
    }
}
customElements.define("g1000-nearest-waypoint-list", WT_Nearest_Waypoint_List);