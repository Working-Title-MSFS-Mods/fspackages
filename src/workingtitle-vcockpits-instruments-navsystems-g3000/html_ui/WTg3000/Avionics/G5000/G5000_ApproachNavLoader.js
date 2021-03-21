class WT_G5000_ApproachNavLoader extends WT_G3x5_ApproachNavLoader {
    _loadFrequencyFMSSource(frequency) {
        let activeFreq = this._nav1.activeFrequency();
        if (activeFreq.equals(frequency)) {
            return;
        }

        let standbyFreq = this._nav1.standbyFrequency();
        if (standbyFreq.equals(frequency)) {
            this._nav1.swapFrequency();
        } else {
            this._loadFrequency(this._nav1, frequency, true);
        }
    }

    _onApproachLoaded() {
        let frequency = this._currentApproach.frequency;
        if (!frequency) {
            return;
        }

        let navSource = this._airplane.autopilot.navigationSource();
        if (navSource === WT_AirplaneAutopilot.NavSource.FMS) {
            this._loadFrequencyFMSSource(frequency);
        } else if (navSource === WT_AirplaneAutopilot.NavSource.NAV1) {
            this._loadFrequency(this._nav1, frequency, false);
        } else {
            this._loadFrequency(this._nav2, frequency, false);
        }
    }

    _onApproachActivated() {
        let frequency = this._currentApproach.frequency;
        if (!frequency) {
            return;
        }

        let navSource = this._airplane.autopilot.navigationSource();
        if (navSource === WT_AirplaneAutopilot.NavSource.FMS) {
            this._loadFrequencyFMSSource(frequency);
        } else if (navSource === WT_AirplaneAutopilot.NavSource.NAV1) {
            this._loadFrequency(this._nav1, frequency, true);
        } else {
            this._loadFrequency(this._nav2, frequency, true);
        }
    }
}