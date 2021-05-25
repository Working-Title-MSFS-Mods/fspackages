class WT_G5000_MFD extends WT_G3x5_MFD {
    /**
     * @returns {WT_G5000_MFDMainPane}
     */
    _createMainPane() {
        return new WT_G5000_MFDMainPane("MFD", this.citySearcher);
    }

    /**
     * @returns {WT_G5000_TrafficAdvisorySystem}
     */
    _createTrafficSystem() {
        return new WT_G5000_TCASII(this.airplane, this._trafficTracker, "XPDR1");
    }
}

registerInstrument("as3000-mfd-element", WT_G5000_MFD);