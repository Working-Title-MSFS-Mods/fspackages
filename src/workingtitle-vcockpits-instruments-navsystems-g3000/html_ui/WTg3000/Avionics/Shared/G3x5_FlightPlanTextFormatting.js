/**
 * Utility class for generating G3000/G5000-style formatted text related to flight plans.
 */
class WT_G3x5_FlightPlanTextFormatting {
    /**
     * Gets the identifier of a departure sequence.
     * @param {WT_FlightPlanDeparture} sequence - a departure sequence.
     * @returns the identifier of the departure sequence.
     */
    static getDepartureIdent(sequence) {
        if (!sequence) {
            return "";
        }

        let departure = sequence.procedure;
        let rwyTransition = departure.runwayTransitions.getByIndex(sequence.runwayTransitionIndex);
        let enrouteTransition = departure.enrouteTransitions.getByIndex(sequence.enrouteTransitionIndex);
        let prefix = `${rwyTransition ? `RW${rwyTransition.runway.designationFull}` : "ALL"}.`;
        let suffix = (enrouteTransition && sequence.legs.length > 0) ? `.${sequence.legs.last().fix.ident}` : "";
        return `${departure.airport.ident}–${prefix}${departure.name}${suffix}`;
    }

    /**
     * Gets the identifier of an arrival sequence.
     * @param {WT_FlightPlanArrival} sequence - an arrival sequence.
     * @returns the identifier of the arrival sequence.
     */
    static getArrivalIdent(sequence) {
        if (!sequence) {
            return "";
        }

        let arrival = sequence.procedure;
        let enrouteTransition = arrival.enrouteTransitions.getByIndex(sequence.enrouteTransitionIndex);
        let rwyTransition = arrival.runwayTransitions.getByIndex(sequence.runwayTransitionIndex);
        let prefix = (enrouteTransition && sequence.legs.length > 0) ? `${sequence.legs.first().fix.ident}.` : "";
        let suffix = `.${rwyTransition ? `RW${rwyTransition.runway.designationFull}` : "ALL"}`;
        return `${arrival.airport.ident}–${prefix}${arrival.name}${suffix}`;
    }

    /**
     * Gets the identifier of an approach sequence.
     * @param {WT_FlightPlanApproach} sequence - an approach sequence.
     * @returns the identifier of the approach sequence.
     */
    static getApproachIdent(sequence) {
        if (!sequence) {
            return "";
        }

        let approach = sequence.procedure;
        return `${approach.airport.ident}–${approach.name}`;
    }

    /**
     * Gets the identifier of an airway sequence.
     * @param {WT_FlightPlanAirwaySequence} sequence - an airway sequence.
     * @returns {String} the identifier of the airway sequence.
     */
    static getAirwaySequenceIdent(sequence) {
        if (!sequence) {
            return "";
        }

        return `${sequence.airway.name}${sequence.legs.length > 0 ? `.${sequence.legs.last().fix.ident}` : ""}`;
    }
}