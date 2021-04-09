class WT_G5000_ChartsDisplay extends WT_G3x5_ChartsDisplay {
    _getBacklightLevel() {
        return this._airplane.engineering.potentiometer(WT_CitationLongitudeEngineering.Potentiometer.MFD_BACKLIGHT);
    }
}