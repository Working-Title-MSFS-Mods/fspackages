class WT_BingMapElement extends BingMapElement {
    updatePosAndSize() {
        if (this.m_listenerBinded && this.m_params) {
            Coherent.call("SET_MAP_POS_SIZE", this.m_listenerUId, this.m_params.lla, this.m_params.radius);
        }
    }
}

customElements.define("wt-bing-map", WT_BingMapElement);