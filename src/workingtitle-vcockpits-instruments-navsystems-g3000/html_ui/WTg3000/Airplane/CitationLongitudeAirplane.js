class WT_CitationLongitudeAirplane extends WT_PlayerAirplane {
    _createControls() {
        return new WT_CitationLongitudeControls(this);
    }

    _createReferences() {
        return new WT_AirplaneReferences(this, WT_g3000_ModConfig.INSTANCE.longitudeReferences);
    }
}

class WT_CitationLongitudeControls extends WT_AirplaneControls {
}
/**
 * @enum {Number}
 */
WT_CitationLongitudeControls.FlapsPosition = {
    UP: 0,
    FLAPS_1: 1,
    FLAPS_2: 2,
    FLAPS_3: 3
}