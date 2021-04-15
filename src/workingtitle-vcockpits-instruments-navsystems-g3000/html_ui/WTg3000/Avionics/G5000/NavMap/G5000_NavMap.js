class WT_G5000_NavMap extends WT_G3x5_NavMap {
    /**
     * @returns {WT_G5000_MapViewTrafficIntruderLayer}
     */
    _createTrafficIntruderLayer() {
        return new WT_G5000_MapViewTrafficIntruderLayer(false);
    }

    /**
     * @returns {WT_G3x5_MapViewTrafficStatusLayer}
     */
    _createTrafficStatusLayer() {
        return new WT_G5000_MapViewNavMapTrafficStatusLayer();
    }
}