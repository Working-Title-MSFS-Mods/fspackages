class WT_G5000_MapViewNavMapTrafficStatusLayer extends WT_G3x5_MapViewNavMapTrafficStatusLayer {
    _createHTMLElement() {
        return new WT_G5000_MapViewNavMapTrafficStatusHTMLElement();
    }
}

class WT_G5000_MapViewNavMapTrafficStatusHTMLElement extends WT_G3x5_MapViewNavMapTrafficStatusHTMLElement {
    /**
     * @param {WT_MapViewState} state
     */
    _updateEnabledIcon(state) {
        this._wrapper.setAttribute("traffic-enabled", `${state.model.traffic.trafficSystem.operatingMode !== WT_G5000_TCASII.OperatingMode.STANDBY}`);
    }
}
WT_G5000_MapViewNavMapTrafficStatusHTMLElement.NAME = "wt-map-view-traffic-navmapstatus";

customElements.define(WT_G5000_MapViewNavMapTrafficStatusHTMLElement.NAME, WT_G5000_MapViewNavMapTrafficStatusHTMLElement);