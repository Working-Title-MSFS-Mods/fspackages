class WT_Sequence_List_View extends WT_HTML_View {
    updateSequence(sequence) {
        if (sequence) {
            this.innerHTML = sequence.map((waypoint) => {
                return `
                    <li>
                        <span class="ident">${waypoint.name ? waypoint.name : "USR"}</span>
                        <span class="bearing">${waypoint.bearing.toFixed(0)}°</span>
                        <span class="distance">${waypoint.distance.toFixed(waypoint.distance < 100 ? 1 : 0)}<span class="units">NM</span></span>
                    </li>`;
            }).join("");
        } else {
            this.innerHTML = "";
        }
    }
}
customElements.define("g1000-sequence-list", WT_Sequence_List_View);