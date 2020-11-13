// Simplane.getNextWaypointName(), Math.round(Simplane.getNextWaypointTrack()), Simplane.getNextWaypointDistance(), Simplane.getNextWaypointETA()

Simplane.getNextWaypointName = () => {
    return FlightPlanManager.DEBUG_INSTANCE.getActiveWaypointIdent();
};

Simplane.getNextWaypointTrack = () => {
    return FlightPlanManager.DEBUG_INSTANCE.getBearingToActiveWaypoint();
};

Simplane.getNextWaypointDistance = () => {
    return FlightPlanManager.DEBUG_INSTANCE.getDistanceToActiveWaypoint();
};

Simplane.getNextWaypointETA = () => {
    return FlightPlanManager.DEBUG_INSTANCE.getETEToActiveWaypoint();
};