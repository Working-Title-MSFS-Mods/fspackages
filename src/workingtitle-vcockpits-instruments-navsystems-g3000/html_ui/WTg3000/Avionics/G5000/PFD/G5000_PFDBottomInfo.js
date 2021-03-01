class WT_G5000_PFDBottomInfo extends WT_G3x5_PFDBottomInfo {
    _initInfoCells() {
        this.addCell(new WT_G3x5_PFDBottomInfoAirspeedCell(this._unitsController));
        this.addCell(new WT_G3x5_PFDBottomInfoTemperatureCell(this._unitsController));
        this.addCell(new WT_G3x5_PFDBottomInfoTimeCell());
    }
}