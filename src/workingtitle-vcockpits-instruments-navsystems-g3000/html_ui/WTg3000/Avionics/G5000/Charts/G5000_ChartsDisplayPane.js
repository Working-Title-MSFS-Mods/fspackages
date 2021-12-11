class WT_G5000_ChartsDisplayPane extends WT_G3x5_ChartsDisplayPane {
    _getBacklightLevel() {
        return this._airplane.engineering.potentiometer(WT_CitationLongitudeEngineering.Potentiometer.MFD_BACKLIGHT);
    }
}