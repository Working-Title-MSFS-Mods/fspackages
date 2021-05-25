class WT_G5000_PFD extends WT_G3x5_PFD {
    get templateID() { return "AS3000_PFD"; }

    /**
     * @readonly
     * @type {WT_G5000_AutoThrottle}
     */
    get autoThrottle() {
        return this._autoThrottle;
    }

    _createInsetMap() {
        return new WT_G5000_PFDInsetMap("PFD");
    }

    _createTrafficInsetMap() {
        return new WT_G5000_PFDTrafficInsetMapContainer("PFD");
    }

    _createMainPage() {
        return new WT_G5000_PFDMainPage(this);
    }

    _createApproachNavLoader() {
        return new WT_G5000_ApproachNavLoader(this.airplane);
    }

    /**
     *
     * @returns {WT_G5000_TCASII}
     */
    _createTrafficSystem() {
        return new WT_G5000_TCASII(this.airplane, this._trafficTracker, "XPDR1");
    }

    _initAutoThrottle() {
        this._autoThrottle = new WT_G5000_AutoThrottle(this.airplane, this.referenceAltimeter, this.airplane.references.clbN1Table, this.airplane.references.cruN1Table);
    }

    Init() {
        super.Init();

        this._initAutoThrottle();
    }

    _updateAutoThrottle() {
        this.autoThrottle.update();
    }

    _doUpdates(currentTime) {
        super._doUpdates(currentTime);

        this._updateAutoThrottle();
    }
}

class WT_G5000_PFDInsetMap extends WT_G3x5_PFDInsetMap {
    _createNavMap() {
        return new WT_G5000_NavMap(this.instrumentID, this.instrument.airplane, this.instrument.referenceAirspeedSensor.index, this.instrument.referenceAltimeter.index, this.instrument.icaoWaypointFactory, this.instrument.icaoSearchers, this.instrument.flightPlanManagerWT, this.instrument.unitsSettingModel, this.instrument.citySearcher, new WT_MapViewBorderData(), null, null, this.instrument.trafficSystem, WT_G3x5_PFDInsetMap.LAYER_OPTIONS);
    }

    _changeMapRange(delta) {
        this.navMap.rangeSetting.changeRange(delta);
    }

    _handleZoomEvent(event) {
        switch (event) {
            case "RANGE_DEC":
                this._changeMapRange(-1);
                break;
            case "RANGE_INC":
                this._changeMapRange(1);
                break;
        }
    }

    onEvent(event) {
        if (!this._isEnabled) {
            return;
        }

        this._handleZoomEvent(event);
    }
}

class WT_G5000_PFDTrafficInsetMapContainer extends WT_G3x5_PFDTrafficInsetMapContainer {
    _createTrafficMap() {
        return new WT_G5000_PFDTrafficInsetMap(this.instrument.airplane, this.instrument.trafficSystem, this.instrument.unitsSettingModel);
    }

    _changeMapRange(delta) {
        this.trafficMap.rangeSetting.changeRange(delta);
    }

    _handleZoomEvent(event) {
        switch (event) {
            case "RANGE_DEC":
                this._changeMapRange(-1);
                break;
            case "RANGE_INC":
                this._changeMapRange(1);
                break;
        }
    }

    onEvent(event) {
        if (!this._isEnabled) {
            return;
        }

        this._handleZoomEvent(event);
    }
}

class WT_G5000_PFDMainPage extends WT_G3x5_PFDMainPage {
    _createAutopilotDisplay() {
        return new WT_G5000_PFDAutopilotDisplay();
    }

    _createAirspeedIndicator() {
        return new WT_G5000_PFDAirspeedIndicator();
    }

    _createAltimeter() {
        return new WT_G5000_PFDAltimeter();
    }

    _createAoAIndicator() {
        return new WT_G5000_PFDAoAIndicator();
    }

    _createTrafficAlert() {
        return new WT_G5000_PFDTrafficAlert();
    }

    _createBottomInfo() {
        return new WT_G5000_PFDBottomInfo();
    }
}

registerInstrument("as3000-pfd-element", WT_G5000_PFD);