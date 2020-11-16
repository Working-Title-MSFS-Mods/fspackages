import { Coherent, RegisterViewListener } from "MSFS"
import { FlightPlanManager } from "./FlightPlanManager";

/** A class for syncing a flight plan with the game */
export class FlightPlanAsoboSync {
  public static LoadFromGame(fpln: FlightPlanManager): Promise<void> {
    return new Promise((resolve, reject) => {
      RegisterViewListener("JS_LISTENER_FLIGHTPLAN");
      setTimeout(() => {
        Coherent.call("LOAD_CURRENT_GAME_FLIGHT");
        Coherent.call("LOAD_CURRENT_ATC_FLIGHTPLAN");
        setTimeout(() => {
          Coherent.call("GET_FLIGHTPLAN").then(async (data) => {
            console.log("COHERENT GET_FLIGHTPLAN received");
            const isDirectTo = data.isDirectTo;

            // TODO: talk to matt about dirto
            if (!isDirectTo) {
              if (data.waypoints.length === 0) {
                resolve();
                return;
              }

              await fpln._parentInstrument.facilityLoader.getFacilityRaw(data.waypoints[0].icao, 10000);

              // set origin
              await fpln.setOrigin(data.waypoints[0].icao);

              // set dest
              await fpln.setDestination(data.waypoints[data.waypoints.length - 1].icao);

              // set route
              const enrouteStart = (data.departureWaypointsSize == -1) ? 1 : data.departureWaypointsSize
              const enroute = data.waypoints.slice(enrouteStart);
              for (let i = 0; i < enroute.length - 1; i++) {
                const wpt = enroute[i];
                console.log(wpt.icao);
                await fpln.addWaypoint(wpt.icao);
              }

              // set departure
              //  rwy index
              await fpln.setOriginRunwayIndex(data.originRunwayIndex);
              await fpln.setDepartureRunwayIndex(data.departureRunwayIndex);
              //  proc index
              await fpln.setDepartureProcIndex(data.departureProcIndex);
              //  enroutetrans index
              await fpln.setDepartureEnRouteTransitionIndex(data.departureEnRouteTransitionIndex);

              // set arrival
              //  arrivalproc index
              await fpln.setArrivalProcIndex(data.arrivalProcIndex);
              //  arrivaltrans index
              await fpln.setArrivalEnRouteTransitionIndex(data.arrivalEnRouteTransitionIndex);

              // set approach
              //  approach index
              await fpln.setApproachIndex(data.approachIndex);
              //  approachtrans index
              await fpln.setApproachTransitionIndex(data.approachTransitionIndex);
            }

          });
        }, 500);
      }, 200);
    });
  }
}