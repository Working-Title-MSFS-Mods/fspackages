class WT_G5000_MFDMainPane extends WT_G3x5_MFDMainPane {
    /**
     *
     * @param {WT_G3x5_MFDHalfPane.ID} side
     * @returns {WT_G3x5_MFDHalfPane}
     */
    _createHalfPane(paneID) {
         let slot = (paneID === WT_G3x5_MFDHalfPane.ID.LEFT) ? "left" : "right";
         return new WT_G5000_MFDHalfPane(this.htmlElement.querySelector(`mfd-halfpane[slot="${slot}"]`), this.instrumentID, paneID, this.instrument.airplane, this.instrument.referenceAirspeedSensor.index, this.instrument.referenceAltimeter.index, this.instrument.icaoWaypointFactory, this.instrument.icaoSearchers, this.instrument.flightPlanManagerWT, this.instrument.trafficSystem, this.instrument.unitsSettingModel, this._citySearcher, this._borderData, this._roadFeatureData, this._roadLabelData);
    }
}

class WT_G5000_MFDHalfPane extends WT_G3x5_MFDHalfPane {
    /**
     * @returns {WT_G5000_NavMap}
     */
    _createNavMap(id, airplane, airspeedSensorIndex, altimeterIndex, icaoWaypointFactory, icaoSearchers, flightPlanManager, unitsController, citySearcher, borderData, roadFeatureData, roadLabelData, trafficSystem) {
        return new WT_G5000_NavMap(id, airplane, airspeedSensorIndex, altimeterIndex, icaoWaypointFactory, icaoSearchers, flightPlanManager, unitsController, citySearcher, borderData, roadFeatureData, roadLabelData, trafficSystem);
    }

    /**
     * @returns {WT_G5000_TrafficMap}
     */
    _createTrafficMap(airplane, trafficSystem) {
         return new WT_G5000_TrafficMap(airplane, trafficSystem);
    }
}