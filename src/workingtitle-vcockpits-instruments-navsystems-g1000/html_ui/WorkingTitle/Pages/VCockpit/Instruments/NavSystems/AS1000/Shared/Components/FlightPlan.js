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

        this.onWaypointClicked = new WT_Event();
        this.onWaypointSelected = new WT_Event();
        this.onWaypointAltitudeChanged = new WT_Event();
        this.onNewWaypointLineSelected = new WT_Event();

        DOMUtilities.AddScopedEventListener(this, "*", WT_Flight_Plan_Waypoint_Line.EVENT_ALTITUDE_CHANGED,
            e => this.onWaypointAltitudeChanged.fire(e.detail.waypointIndex, e.detail.altitude));

        DOMUtilities.AddScopedEventListener(this, ".ident", "selected",
            e => this.onWaypointClicked.fire(e.detail.element.parentNode.waypointIndex));

        DOMUtilities.AddScopedEventListener(this, "*", WT_Flight_Plan_Waypoint_Line.EVENT_WAYPOINT_SELECTED,
            e => this.onWaypointSelected.fire(e.detail.waypointIndex));
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
                <div class="ident"><selectable-button data-element="newWaypointButton" data-click="showCreateNewWaypoint" class="new-waypoint">__________</selectable-button></div>
            </div>`;
        super.connectedCallback();

        this.elements.newWaypointButton.addEventListener("focus", () => this.onNewWaypointLineSelected.fire());
    }
    /**
     * @param {WT_Flight_Plan_Line_Factory} factory 
     */
    setLineFactory(factory) {
        this.factory = factory;
    }
    updateLines(lines) {
        const lineElements = [];

        let waypointLineIndex = 0;
        let headerLineIndex = 0;
        const waypointLines = [];
        const headerLines = [];
        for (const line of lines) {
            switch (line.type) {
                case "waypoint": {
                    const element = this.waypointLines[waypointLineIndex++] || this.factory.createWaypointLine();
                    element.line = line;
                    waypointLines.push(element);
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

        this.waypointLines = waypointLines;
        this.headerLines = headerLines;

        lineElements.unshift(this.elements.activeLegMarker);
        lineElements.push(this.elements.newWaypointLine);
        DOMUtilities.repopulateElement(this, lineElements);
    }
    updateActiveLeg(leg) {
        if (leg) {
            const beginIndex = this.waypointIndexToLineIndex(leg.origin + (leg.originIsApproach ? this.approachIndex : 0));
            const endIndex = this.waypointIndexToLineIndex(leg.destination + (leg.destinationIsApproach ? this.approachIndex : 0));
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
        this.activeLeg = leg;
    }
    waypointIndexToLineIndex(waypointIndex) {
        if (this.waypointLines[waypointIndex]) {
            return this.waypointLines[waypointIndex].lineIndex;
        } else {
            return null;
        }
    }
}
customElements.define("g1000-flight-plan-lines", WT_Flight_Plan_Lines);