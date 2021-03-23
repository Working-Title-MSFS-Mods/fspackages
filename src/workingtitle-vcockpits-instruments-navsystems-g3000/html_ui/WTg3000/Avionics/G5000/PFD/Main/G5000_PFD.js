class WT_G5000_PFD extends WT_G3x5_PFD {
    get templateID() { return "AS3000_PFD"; }

    _createInsetMap() {
        return new WT_G5000_PFDInsetMap("PFD", this.citySearcher);
    }

    _createMainPage() {
        return new WT_G5000_PFDMainPage(this);
    }

    _createApproachNavLoader() {
        return new WT_G5000_ApproachNavLoader(this.airplane);
    }
}

class WT_G5000_PFDInsetMap extends WT_G3x5_PFDInsetMap {
    _changeMapRange(delta) {
        let currentIndex = this.navMap.rangeSetting.getValue();
        let newIndex = Math.max(Math.min(currentIndex + delta, WT_G3x5_NavMap.MAP_RANGE_LEVELS.length - 1), 0);
        this.navMap.rangeSetting.setValue(newIndex);
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
    _createAirspeedIndicator() {
        return new WT_G5000_PFDAirspeedIndicator();
    }

    _createAltimeter() {
        return new WT_G5000_PFDAltimeter();
    }

    _createAoAIndicator() {
        return new WT_G5000_PFDAoAIndicator();
    }

    _createBottomInfo() {
        return new WT_G5000_PFDBottomInfo();
    }
}

registerInstrument("as3000-pfd-element", WT_G5000_PFD);