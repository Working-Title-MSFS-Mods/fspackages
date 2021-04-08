class WT_G3x5_MapViewChartsAirplaneLayer extends WT_MapViewAirplaneLayer {
    /**
     * @param {WT_G3x5_ChartsModel} chartsModel
     * @param {WT_G3x5_ChartsDisplayHTMLElement} chartsView
     * @param {String} className
     * @param {String} configName
     */
    constructor(chartsModel, chartsView, className = WT_MapViewAirplaneLayer.CLASS_DEFAULT, configName = WT_MapViewAirplaneLayer.CONFIG_NAME_DEFAULT) {
        super(className, configName);

        this._chartsModel = chartsModel;
        this._chartsView = chartsView;
        this._tempVector2 = new WT_GVector2(0, 0);
    }

    /**
     *
     * @param {{bbox_local:Number[]}[]} insets
     * @param {WT_GVector2} position
     * @returns {Boolean}
     */
    _isInInset(insets, position, chartBounds) {
        return insets.some(inset => {
            return position.x >= inset.bbox_local[WT_NavigraphChart.BoundsIndex.LEFT] &&
                   position.x <= inset.bbox_local[WT_NavigraphChart.BoundsIndex.RIGHT] &&
                   position.y >= inset.bbox_local[WT_NavigraphChart.BoundsIndex.TOP] &&
                   position.y <= inset.bbox_local[WT_NavigraphChart.BoundsIndex.BOTTOM];
        });
    }

    /**
     * @param {WT_MapViewState} state
     */
    isVisible(state) {
        let show = false;
        if (state.model.airplaneIcon.show) {
            let chartBounds = this._chartsView.chartBounds;
            let chartPos = this._chartsView.chartTransformInverse.apply(this._tempVector2.set(state.viewPlane), true).add(chartBounds.left, chartBounds.top);
            if (chartPos.x >= chartBounds.left && chartPos.x <= chartBounds.right && chartPos.y >= chartBounds.top && chartPos.y <= chartBounds.bottom) {
                show = !this._isInInset(this._chartsModel.chart.insets, chartPos);
            }
        }
        return show;
    }
}