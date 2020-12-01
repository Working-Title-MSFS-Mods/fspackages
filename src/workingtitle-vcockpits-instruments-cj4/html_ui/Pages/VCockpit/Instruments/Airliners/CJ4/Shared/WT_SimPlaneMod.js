// Simplane.getNextWaypointName(), Math.round(Simplane.getNextWaypointTrack()), Simplane.getNextWaypointDistance(), Simplane.getNextWaypointETA()

Simplane.getNextWaypointName = () => {
    return FlightPlanManager.DEBUG_INSTANCE.getActiveWaypointIdent();
};

Simplane.getNextWaypointTrack = () => {
    return SimVar.GetSimVarValue("L:WT_CJ4_DTK", "number");
    // return FlightPlanManager.DEBUG_INSTANCE.getBearingToActiveWaypoint();
};

Simplane.getNextWaypointDistance = () => {
    return FlightPlanManager.DEBUG_INSTANCE.getDistanceToActiveWaypoint();
};

Simplane.getNextWaypointETA = () => {
    return FlightPlanManager.DEBUG_INSTANCE.getETEToActiveWaypoint();
};