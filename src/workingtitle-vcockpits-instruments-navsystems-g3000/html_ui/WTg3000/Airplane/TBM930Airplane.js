class WT_TBM930Airplane extends WT_PlayerAirplane {
    _createControls() {
        return new WT_TBM930Controls(this);
    }

    _createReferences() {
        return new WT_AirplaneReferences(this, WT_g3000_ModConfig.INSTANCE.tbm930References);
    }
}

class WT_TBM930Controls extends WT_AirplaneControls {
}
/**
 * @enum {Number}
 */
WT_TBM930Controls.FlapsPosition = {
    UP: 0,
    TAKEOFF: 1,
    LANDING: 2
}