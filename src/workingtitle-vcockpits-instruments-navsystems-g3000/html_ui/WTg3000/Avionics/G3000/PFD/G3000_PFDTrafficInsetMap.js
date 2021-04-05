class WT_G3000_PFDTrafficInsetMap extends WT_G3x5_TrafficMap {
    /**
     * @returns {WT_G3000_MapViewTrafficIntruderLayer}
     */
    _createTrafficIntruderLayer() {
        return new WT_G3000_MapViewTrafficIntruderLayer(true);
    }

    /**
     * @returns {WT_G3x5_MapViewTrafficStatusLayer}
     */
    _createTrafficStatusLayer() {
        return new WT_G3x5_MapViewCondensedTrafficStatusLayer(WT_G3000_PFDTrafficInsetMap.STATUS_OPERATING_MODE_TEXT, WT_G3000_PFDTrafficInsetMap.STATUS_CENTER_BANNER_TEXT);
    }
}
WT_G3000_PFDTrafficInsetMap.STATUS_OPERATING_MODE_TEXT = [
    "STANDBY",
    "OPERATING"
];
WT_G3000_PFDTrafficInsetMap.STATUS_CENTER_BANNER_TEXT = [
    "STANDBY",
    ""
];