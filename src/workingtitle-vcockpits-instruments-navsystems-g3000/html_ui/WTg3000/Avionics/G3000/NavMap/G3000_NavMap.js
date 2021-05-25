class WT_G3000_NavMap extends WT_G3x5_NavMap {
    /**
     * @returns {WT_G3000_MapViewTrafficIntruderLayer}
     */
    _createTrafficIntruderLayer() {
        return new WT_G3000_MapViewTrafficIntruderLayer(false);
    }

    /**
     * @returns {WT_G3x5_MapViewTrafficStatusLayer}
     */
    _createTrafficStatusLayer() {
        return new WT_G3000_MapViewNavMapTrafficStatusLayer();
    }
}