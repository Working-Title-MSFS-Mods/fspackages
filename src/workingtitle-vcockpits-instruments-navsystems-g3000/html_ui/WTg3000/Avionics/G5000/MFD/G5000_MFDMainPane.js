class WT_G5000_MFDMainPane extends WT_G3x5_MFDMainPane {
    /**
     *
     * @param {WT_G3x5_MFDHalfPane.ID} side
     * @param {Object} data
     * @returns {WT_G3x5_MFDHalfPane}
     */
    _createHalfPane(paneID, data) {
         let slot = (paneID === WT_G3x5_MFDHalfPane.ID.LEFT) ? "left" : "right";
         return new WT_G5000_MFDHalfPane(this.htmlElement.querySelector(`mfd-halfpane[slot="${slot}"]`), this.instrumentID, paneID, this.instrument, data);
    }
}

class WT_G5000_MFDHalfPane extends WT_G3x5_MFDHalfPane {
    /**
     * @returns {WT_G5000_NavMap}
     */
    _createNavMap(airplane, airspeedSensorIndex, altimeterIndex, icaoWaypointFactory, icaoSearchers, flightPlanManager, unitsSettingModel, citySearcher, borderData, roadFeatureData, roadLabelData, trafficSystem) {
        return new WT_G5000_NavMap(this.paneID, airplane, airspeedSensorIndex, altimeterIndex, icaoWaypointFactory, icaoSearchers, flightPlanManager, unitsSettingModel, citySearcher, borderData, roadFeatureData, roadLabelData, trafficSystem);
    }

    /**
     * @returns {WT_G5000_TrafficMap}
     */
    _createTrafficMap(airplane, trafficSystem, unitsSettingModel) {
         return new WT_G5000_TrafficMap(airplane, trafficSystem, unitsSettingModel);
    }

    /**
     * @returns {WT_G5000_ChartsDisplayPane}
     */
    _createChartsDisplayPane(airplane, navigraphNetworkAPI, unitsSettingModel) {
        return new WT_G5000_ChartsDisplayPane(this.paneID, this.settings, airplane, navigraphNetworkAPI, unitsSettingModel);
    }
}