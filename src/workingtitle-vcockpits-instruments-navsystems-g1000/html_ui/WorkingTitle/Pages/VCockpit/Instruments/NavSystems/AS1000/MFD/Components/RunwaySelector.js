class WT_Runway_Selector_View extends WT_HTML_View {
    constructor() {
        super();
        this.inputLayer = new Selectables_Input_Layer(new Selectables_Input_Layer_Dynamic_Source(this));
        this.selectedRunway = new Subject();
    }
    connectedCallback() {
        if (this.hasInitialised)
            return;
        this.hasInitialised = true;

        let template = document.getElementById('runway-selector');
        let templateContent = template.content;

        this.appendChild(templateContent.cloneNode(true));
        super.connectedCallback();

        this.selectedRunway.subscribe(runway => {
            if (runway) {
                this.elements.runwaySurface.textContent = runway.getSurfaceString();
                this.elements.runwayLength.innerHTML = `${fastToFixed(runway.length * 3.28084, 0)}<span class="units">FT</span>`;
                this.elements.runwayWidth.innerHTML = `${fastToFixed(runway.width * 3.28084, 0)}<span class="units">FT</span>`;
                switch (runway.lighting) { // No idea if this ever changes
                    case 0:
                        this.elements.runwayOperatingTime.innerHTML = "FULLTIME";
                        break;
                }
            }
        });

        this.elements.runwaySelector.addEventListener("change", e => {
            this.selectedRunway.value = this.runways[this.elements.runwaySelector.value];
        });
    }
    /**
     * @param {Waypoint} waypoint 
     */
    setFromWaypoint(waypoint) {
        if (!waypoint) {
            this.setRunways([]);
            return;
        }
        let infos = waypoint.infos;
        let runways = {};
        let selectedRunway = "";
        for (let runway of infos.runways) {
            let name = runway.designation;
            runways[name] = runway;
            if (selectedRunway == "") {
                selectedRunway = name;
            }
        }
        this.setRunways(runways);
        this.setSelectedRunway(selectedRunway);
    }
    setRunways(runways) {
        this.runways = runways;
        this.elements.runwaySelector.values = Object.keys(this.runways);
    }
    setSelectedRunway(runwayName) {
        this.elements.runwaySelector.value = runwayName;
        this.elements.runwaySelector.fireChangeEvent();
    }
    enter(inputStack) {
        this.inputStackHandle = inputStack.push(this.inputLayer);
    }
    exit() {
        if (this.inputStackHandle) {
            this.inputStackHandle.pop();
            this.inputStackHandle = null;
        }
    }
}
customElements.define("g1000-runway-selector", WT_Runway_Selector_View);