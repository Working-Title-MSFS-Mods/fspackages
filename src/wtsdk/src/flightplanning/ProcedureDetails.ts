/**
 * The details of procedures selected in the flight plan.
 */
export class ProcedureDetails {
    /** The index of the origin runway in the origin runway information. */
    public originRunwayIndex: number = -1;

    /** The index of the departure in the origin airport information. */
    public departureIndex: number = -1;

    /** The index of the departure transition in the origin airport departure information. */
    public departureTransitionIndex: number = -1;

    /** The index of the selected runway in the original airport departure information. */
    public departureRunwayIndex: number = -1;

    /** The index of the arrival in the destination airport information. */
    public arrivalIndex: number = -1;

    /** The index of the arrival transition in the destination airport arrival information. */
    public arrivalTransitionIndex: number = -1;

    /** The index of the selected runway at the destination airport. */
    public arrivalRunwayIndex: number = -1;

    /** The index of the apporach in the destination airport information.*/
    public approachIndex: number = -1;

    /** The index of the approach transition in the destination airport approach information.*/
    public approachTransitionIndex: number = -1;
}