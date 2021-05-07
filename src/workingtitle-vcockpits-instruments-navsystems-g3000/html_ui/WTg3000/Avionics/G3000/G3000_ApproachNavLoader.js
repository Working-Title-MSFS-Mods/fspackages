class WT_G3000_ApproachNavLoader extends WT_G3x5_ApproachNavLoader {
    _onApproachLoaded() {
        let frequency = this._currentApproach.frequency;
        if (!frequency) {
            return;
        }

        let navSource = this._airplane.autopilot.navigationSource();
        if (navSource === WT_AirplaneAutopilot.NavSource.FMS) {
            this._loadFrequency(this._nav1, frequency, true);
            this._loadFrequency(this._nav2, frequency, true);
        } else if (navSource === WT_AirplaneAutopilot.NavSource.NAV1) {
            this._loadFrequency(this._nav1, frequency, false);
            this._loadFrequency(this._nav2, frequency, true);
        } else {
            this._loadFrequency(this._nav1, frequency, true);
            this._loadFrequency(this._nav2, frequency, false);
        }
    }

    _onApproachActivated() {
        let frequency = this._currentApproach.frequency;
        if (!frequency) {
            return;
        }

        this._loadFrequency(this._nav1, frequency, true);
        this._loadFrequency(this._nav2, frequency, true);
    }
}