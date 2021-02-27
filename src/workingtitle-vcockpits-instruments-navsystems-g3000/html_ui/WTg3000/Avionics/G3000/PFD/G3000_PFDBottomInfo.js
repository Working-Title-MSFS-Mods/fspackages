class WT_G3000_PFDBottomInfo extends WT_G3x5_PFDBottomInfo {
    _initInfoCells() {
        this.htmlElement.addCell(new WT_G3x5_PFDBottomInfoAirspeedCell(this._unitsController));
        this.htmlElement.addCell(new WT_G3x5_PFDBottomInfoTemperatureCell(this._unitsController));
        this.htmlElement.addCell(new WT_G3x5_PFDBottomInfoTimeCell());
    }
}