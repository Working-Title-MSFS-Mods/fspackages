class WT_G3000_MFD extends WT_G3x5_MFD {
    /**
     * @returns {WT_G3x5_MFDMainPane}
     */
    _createMainPane() {
        return new WT_G3000_MFDMainPane("MFD", this.citySearcher);
    }

    /**
     * @returns {WT_G3000_TrafficAdvisorySystem}
     */
    _createTrafficSystem() {
        return new WT_G3000_TrafficAdvisorySystem(this.airplane, this._trafficTracker);
    }
}

registerInstrument("as3000-mfd-element", WT_G3000_MFD);