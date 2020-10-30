class WT_Sequence_List_View extends WT_HTML_View {
    updateSequence(sequence) {
        if (sequence) {
            this.innerHTML = sequence.map((waypoint) => {
                return `
                    <div class="sequence-entry">
                        <span class="ident">${waypoint.name ? waypoint.name : "USR"}</span>
                        <span class="bearing">${waypoint.bearing}°</span>
                        <span class="distance">${waypoint.distance.toFixed(waypoint.distance < 10 ? 1 : 0)}NM</span>
                    </div>`;
            }).join("");
        } else {
            this.innerHTML = "";
        }
    }
}
customElements.define("g1000-sequence-list", WT_Sequence_List_View);