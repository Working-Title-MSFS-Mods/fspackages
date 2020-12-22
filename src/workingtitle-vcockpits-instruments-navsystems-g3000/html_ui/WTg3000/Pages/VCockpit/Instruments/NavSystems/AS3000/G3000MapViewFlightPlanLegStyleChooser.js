class WT_G3000MapViewFlightPlanLegStyleChooser {
    /**
     *
     * @param {WT_FlightPlanLeg} leg
     * @param {Number} legIndex
     * @param {WT_FlightPlanLeg} activeLeg
     * @param {Number} activeLegIndex
     * @param {Boolean} discontinuity - whether the previous leg ended in a discontinuity
     */
    chooseStyle(leg, legIndex, activeLeg, activeLegIndex, discontinuity) {
        let activeIndexDelta = legIndex - activeLegIndex;
        if (discontinuity) {
            if (activeLeg && activeIndexDelta >= 0) {
                if (activeIndexDelta <= 1) {
                    return WT_MapViewFlightPlanCanvasRenderer.LegStyle.ARROW_ALT;
                } else {
                    return WT_MapViewFlightPlanCanvasRenderer.LegStyle.LINE_DOTTED;
                }
            }
            return WT_MapViewFlightPlanCanvasRenderer.LegStyle.NONE;
        }

        if (leg instanceof WT_FlightPlanProcedureLeg) {
            switch (leg.procedureLeg.type) {
                case WT_ProcedureLeg.Type.FLY_HEADING_UNTIL_DISTANCE_FROM_REFERENCE:
                case WT_ProcedureLeg.Type.FLY_HEADING_UNTIL_REFERENCE_RADIAL_CROSSING:
                case WT_ProcedureLeg.Type.FLY_HEADING_TO_INTERCEPT:
                case WT_ProcedureLeg.Type.FLY_HEADING_TO_ALTITUDE:
                    return WT_MapViewFlightPlanCanvasRenderer.LegStyle.ARROW_STANDARD;
            }
        }

        if (activeLeg && leg.segment === activeLeg.segment && activeIndexDelta >= 0) {
            return WT_MapViewFlightPlanCanvasRenderer.LegStyle.LINE_STANDARD;
        } else {
            return WT_MapViewFlightPlanCanvasRenderer.LegStyle.LINE_THIN;
        }
    }
}