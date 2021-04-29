class WT_G3000_MFDMainPane extends WT_G3x5_MFDMainPane {
    /**
     *
     * @param {WT_G3x5_MFDHalfPane.ID} side
     * @param {Object} data
     * @returns {WT_G3000_MFDHalfPane}
     */
    _createHalfPane(paneID, data) {
         let slot = (paneID === WT_G3x5_MFDHalfPane.ID.LEFT) ? "left" : "right";
         return new WT_G3000_MFDHalfPane(this.htmlElement.querySelector(`mfd-halfpane[slot="${slot}"]`), this.instrumentID, paneID, data);
    }
}

class WT_G3000_MFDHalfPane extends WT_G3x5_MFDHalfPane {
    /**
     * @returns {WT_G3000_NavMap}
     */
    _createNavMap(id, airplane, airspeedSensorIndex, altimeterIndex, icaoWaypointFactory, icaoSearchers, flightPlanManager, unitsSettingModel, citySearcher, borderData, roadFeatureData, roadLabelData, trafficSystem) {
        return new WT_G3000_NavMap(id, airplane, airspeedSensorIndex, altimeterIndex, icaoWaypointFactory, icaoSearchers, flightPlanManager, unitsSettingModel, citySearcher, borderData, roadFeatureData, roadLabelData, trafficSystem);
    }

    /**
     * @returns {WT_G3000_TrafficMap}
     */
    _createTrafficMap(airplane, trafficSystem, unitsSettingModel) {
         return new WT_G3000_TrafficMap(airplane, trafficSystem, unitsSettingModel);
    }

    /**
     * @returns {WT_G3000_ChartsDisplay}
     */
    _createCharts(id, airplane, navigraphAPI, unitsSettingModel) {
        return new WT_G3000_ChartsDisplay(id, airplane, navigraphAPI, unitsSettingModel);
    }
}