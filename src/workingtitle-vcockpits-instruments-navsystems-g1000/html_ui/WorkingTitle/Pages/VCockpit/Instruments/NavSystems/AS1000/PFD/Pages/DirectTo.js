class WT_PFD_Direct_To_View extends WT_Direct_To_View {
    /**
     * @param {WT_Direct_To_Model} model 
     */
    setModel(model) {
        super.setModel(model);
        model.waypoint.subscribe(waypoint => {
            this.elements.footer.style.display = waypoint ? "block" : "none"
        });
    }
}
customElements.define("g1000-pfd-direct-to", WT_PFD_Direct_To_View);