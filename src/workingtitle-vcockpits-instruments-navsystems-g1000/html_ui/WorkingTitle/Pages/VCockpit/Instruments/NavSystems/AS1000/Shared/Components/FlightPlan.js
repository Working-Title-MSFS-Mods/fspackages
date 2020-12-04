class WT_Flight_Plan_Waypoint_Line extends WT_HTML_View {

}
WT_Flight_Plan_Waypoint_Line.EVENT_ALTITUDE_CHANGED = "altitude_changed";
WT_Flight_Plan_Waypoint_Line.EVENT_WAYPOINT_DELETED = "waypoint_deleted";
WT_Flight_Plan_Waypoint_Line.EVENT_WAYPOINT_SELECTED = "waypoint_selected";

class WT_Flight_Plan_Header_Line extends WT_HTML_View {

}

class WT_Flight_Plan_Line_Factory {
    createWaypointLine() {

    }
    createHeaderLine() {

    }
}

class WT_Flight_Plan_Lines extends WT_HTML_View {
    constructor() {
        super();

        this.waypointLines = [];
        this.headerLines = [];

        this.onWaypointClicked = new rxjs.Subject();
        this.onWaypointSelected = new rxjs.Subject();
        this.onWaypointAltitudeChanged = new rxjs.Subject();
        this.onNewWaypointLineSelected = new rxjs.Subject();

        this.activeLeg = new rxjs.BehaviorSubject(null);
        this.lines = new rxjs.Subject(null);

        this.lines.subscribe(lines => {
            const lineElements = [];

            let waypointLineIndex = 0;
            let headerLineIndex = 0;
            const waypointLines = [];
            const headerLines = [];
            const approachLines = [];
            for (const line of lines) {
                switch (line.type) {
                    case "waypoint": {
                        const element = this.waypointLines[waypointLineIndex++] || this.factory.createWaypointLine();
                        element.line = line;
                        waypointLines.push(element);
                        if (line.waypointType == "approach") {
                            approachLines.push(element);
                        }
                        lineElements.push(element);
                        break;
                    }
                    case "header": {
                        const element = this.headerLines[headerLineIndex++] || this.factory.createHeaderLine();
                        element.line = line;
                        headerLines.push(element);
                        lineElements.push(element);
                    }
                }
            }

            this.approachLines = approachLines;
            this.waypointLines = waypointLines;
            this.headerLines = headerLines;

            lineElements.unshift(this.elements.activeLegMarker);
            lineElements.push(this.elements.newWaypointLine);
            DOMUtilities.repopulateElement(this, lineElements);
        });

        rxjs.combineLatest(this.lines, this.activeLeg).subscribe(values => {
            const lines = values[0];
            const leg = values[1];

            if (leg && lines) {
                const beginIndex = this.waypointIndexToLineIndex(leg.origin, leg.originIsApproach);
                const endIndex = this.waypointIndexToLineIndex(leg.destination, leg.destinationIsApproach);
                if (beginIndex !== null && endIndex !== null) {
                    this.elements.activeLegMarker.style.gridRowStart = beginIndex + 1;
                    this.elements.activeLegMarker.style.gridRowEnd = endIndex + 2;
                    this.elements.activeLegMarker.style.visibility = "visible";
                } else {
                    this.elements.activeLegMarker.style.visibility = "hidden";
                }
            } else {
                this.elements.activeLegMarker.style.visibility = "hidden";
            }
        })

        DOMUtilities.AddScopedEventListener(this, "*", WT_Flight_Plan_Waypoint_Line.EVENT_ALTITUDE_CHANGED,
            e => this.onWaypointAltitudeChanged.next({
                waypointIndex: e.detail.waypointIndex,
                altitude: e.detail.altitude
            })
        );

        DOMUtilities.AddScopedEventListener(this, ".ident", "selected",
            e => this.onWaypointClicked.next(e.detail.element.parentNode.waypointIndex));

        DOMUtilities.AddScopedEventListener(this, "*", WT_Flight_Plan_Waypoint_Line.EVENT_WAYPOINT_SELECTED,
            e => this.onWaypointSelected.next(e.detail.waypointIndex));
    }
    connectedCallback() {
        if (this.initialised)
            return;
        this.initialised = true;

        this.innerHTML = `
            <div class="flight-plan-marker" data-element="activeLegMarker">
                <svg viewBox="0 0 100 100" style="width:100%; height:100%;">
                    <path d="M100 50 L50 50 Q20 50 20 80 L20 200" stroke="magenta" stroke-width="20" fill="none"></path>
                </svg>
                <div style="overflow:hidden;">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%; height:100%;">
                        <path d="M20 0 L20 100" stroke="magenta" stroke-width="20" fill="none"></path>
                    </svg>
                </div>
                <svg viewBox="0 0 100 100" style="width:100%; height:100%;">
                    <path d="M20 -100 L20 30 Q20 50 50 50 L60 50" stroke="magenta" stroke-width="20" fill="none"></path>
                    <path d="M60 20 L60 80 L100 50 Z" fill="magenta"></path>
                </svg>
            </div>
            <div class="new-waypoint" data-element="newWaypointLine">
                <div></div>
                <div class="ident"><selectable-button data-element="newWaypointButton" class="new-waypoint">__________</selectable-button></div>
            </div>`;
        super.connectedCallback();

        this.elements.newWaypointButton.addEventListener("focus", () => this.onNewWaypointLineSelected.next());
    }
    /**
     * @param {WT_Flight_Plan_Line_Factory} factory 
     */
    setLineFactory(factory) {
        this.factory = factory;
    }
    updateLines(lines) {
        this.lines.next(lines);
    }
    updateActiveLeg(leg) {
        this.activeLeg.next(leg);
        //console.log(JSON.stringify(leg));
    }
    waypointIndexToLineIndex(waypointIndex, approach = false) {
        const source = approach ? this.approachLines : this.waypointLines;
        if (source[waypointIndex]) {
            return source[waypointIndex].lineIndex;
        } else {
            return null;
        }
    }
}
customElements.define("g1000-flight-plan-lines", WT_Flight_Plan_Lines);