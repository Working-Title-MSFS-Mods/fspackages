/**
 * A symbol representing the player airplane. The symbol is placed at the airplane's present position, and its
 * orientation is synchronized to the airplane's heading. The use of this layer requires the .charts module to be
 * added to the map model.
 */
class WT_G3x5_MapViewChartsAirplaneLayer extends WT_MapViewAirplaneLayer {
    /**
     * @param {WT_MapViewState} state
     */
    isVisible(state) {
        return state.model.charts.showAirplane;
    }
}