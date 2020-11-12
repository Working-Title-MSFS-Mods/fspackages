class WT_BaseAutopilot {
    constructor(fpm) {
        this._fpm = fpm;

        this._vnavType = false;

        //COMPONENTS TO REFRESH ONLY WHEN THERE IS A FLIGHT PLAN CHANGE
        this._desiredFPA = WTDataStore.get('CJ4_vpa', 3);
        this._currPos = undefined;
        this._groundSpeed = undefined;
        this._altitude = undefined;

    }

    /**
     * Run on first activation.
     */
    activate() {

    }

    /**
     * Update data if needed.
     */
    update() {
        this._desiredFPA = WTDataStore.get('CJ4_vpa', 3);
        this._currPos = new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"));
        this._groundSpeed = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
        this._altitude = SimVar.GetSimVarValue("PLANE ALTITUDE", "Feet");
    }

    /**
     * Execute.
     */
    execute() {

    }

    /**
     * Run when deactivated.
     */
    deactivate() {

    }
}