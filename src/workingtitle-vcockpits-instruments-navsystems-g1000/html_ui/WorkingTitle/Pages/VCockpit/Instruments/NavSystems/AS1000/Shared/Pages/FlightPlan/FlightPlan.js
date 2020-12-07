class WT_Flight_Plan_Page_Model extends WT_Model {
    /**
     * @param {FlightPlanManager} flightPlan 
     * @param {Procedures} procedures 
     * @param {WT_Show_Airways_Handler} showAirwaysHandler 
     * @param {WT_Show_Direct_To_Handler} showDirectToHandler 
     */
    constructor(flightPlan, procedures, showAirwaysHandler, showDirectToHandler) {
        super();
        this.flightPlan = flightPlan;
        this.procedures = procedures;
        this.showAirwaysHandler = showAirwaysHandler;
        this.showDirectToHandler = showDirectToHandler;

        this.activeLeg = procedures.activeLeg;
        this.waypoints = new Subject();
        this.lines = new Subject();
        this.name = new rxjs.BehaviorSubject();
        this.customName = null;
        this.viewMode = new Subject("narrow");
        this.distanceMode = new Subject("leg");
        this.selectedWaypointIndex = null;
        this.selectedWaypoint = null;
        this.previousWaypoint = null;

        this.t = 0;

        // Waypoints
        this.waypoints$ = new rxjs.BehaviorSubject([]);
        const numWaypoints$ = this.waypoints$.pipe(rxjs.operators.map(waypoints => waypoints.length));

        // Flight Plan
        this.flightPlan$ = new rxjs.Subject();
        this.newWaypointLineSelected$ = new rxjs.Subject();

        this.canRemoveApproach$ = this.flightPlan$.pipe(rxjs.operators.map(flightPlan => flightPlan.approach.length > 0))
        this.canRemoveDeparture$ = this.flightPlan$.pipe(rxjs.operators.map(flightPlan => flightPlan.departure.length > 0))
        this.canRemoveArrival$ = this.flightPlan$.pipe(rxjs.operators.map(flightPlan => flightPlan.arrival.length > 0))
        this.canDeleteFlightPlan$ = numWaypoints$.pipe(rxjs.operators.map(num => num > 0));

        // Selected waypoints
        this.selectedWaypointIndex$ = new rxjs.BehaviorSubject(null);
        this.selectedWaypoint$ = rxjs.combineLatest(
            this.waypoints$,
            this.selectedWaypointIndex$,
            (waypoints, index) => index !== null ? waypoints[index] : null
        );

        const mapEventToSelectedindex = rxjs.pipe(
            rxjs.operators.withLatestFrom(this.selectedWaypointIndex$),
            rxjs.operators.map(([_, selectedWaypointIndex]) => selectedWaypointIndex),
            rxjs.operators.filter(waypointIndex => waypointIndex !== null)
        );

        const lastWaypointIndex$ = numWaypoints$.pipe(
            rxjs.operators.map(num => num > 0 ? num - 1 : null)
        );

        const addWaypointIndex$ = rxjs.combineLatest(
            this.selectedWaypointIndex$,
            numWaypoints$,
            (index, lastIndex) => index !== null ? index : lastIndex
        );

        // Previous waypoint
        this.previousWaypointIndex$ = rxjs.combineLatest(
            lastWaypointIndex$,
            this.selectedWaypointIndex$,
            (lastIndex, selectedIndex) => selectedIndex > 0 ? (selectedIndex - 1) : lastIndex
        )
        this.previousWaypoint$ = rxjs.combineLatest(
            this.waypoints$,
            this.previousWaypointIndex$,
            (waypoints, index) => index !== null ? waypoints[index] : null
        );

        // Activate leg
        this.canActivateLeg$ = this.selectedWaypoint$.pipe(
            rxjs.operators.map(waypoint => waypoint != null)
        );

        // Activate waypoint
        this.activateWaypointIndex$ = new rxjs.Subject();
        this.activateWaypointIndex$.pipe(
            mapEventToSelectedindex,
            rxjs.operators.switchMap(waypointIndex => {
                if (this.isWaypointIndexApproach(waypointIndex)) {
                    return rxjs.from(
                        new Promise(resolve => this.flightPlan.activateApproach(resolve))
                    ).pipe(
                        rxjs.operators.mapTo(waypointIndex - this.approachWaypointIndex)
                    );
                }
                return rxjs.of(waypointIndex);
            }),
            rxjs.operators.switchMap(waypointIndex => rxjs.from(new Promise(resolve => {
                this.flightPlan.setActiveWaypointIndex(waypointIndex, resolve)
            })))
        ).subscribe();

        // Delete waypoint
        this.deleteWaypointIndex$ = new rxjs.Subject();
        this.deleteWaypointIndex$.pipe(
            mapEventToSelectedindex,
            rxjs.operators.filter(waypointIndex => !this.isWaypointIndexApproach(waypointIndex)),
            rxjs.operators.switchMap(waypointIndex =>
                rxjs.from(new Promise(resolve => {
                    this.flightPlan.removeWaypoint(waypointIndex, false, resolve)
                }))
            )
        ).subscribe(() => this.updateWaypoints());

        // Name
        this.customName$ = new rxjs.BehaviorSubject(null);
        this.name$ = rxjs.combineLatest(this.flightPlan$, this.customName$).pipe(
            rxjs.operators.map(([flightPlan, custom]) => {
                if (custom)
                    return custom;
                return `${flightPlan.origin ? flightPlan.origin.ident : "_____"} / ${flightPlan.destination ? flightPlan.destination.ident : "_____"}`;
            })
        );

        // Airways
        this.canSelectAirway$ = this.previousWaypoint$.pipe(
            rxjs.operators.map(waypoint => waypoint ? (waypoint.infos.routes && waypoint.infos.routes.length > 0) : false)
        );
        this.showAirwaySelector$ = new rxjs.Subject();

        //const selectedIndexNotNull = rxjs.operators.filter(e => e.selectedWaypointIndex != null);
        const previousWaypointNotNull = rxjs.operators.filter(e => e.previousWaypoint != null);
        const airwayWaypoints$ = this.showAirwaySelector$.pipe(
            rxjs.operators.withLatestFrom(
                this.previousWaypoint$,
                addWaypointIndex$,
                (_, previousWaypoint, index) => ({ previousWaypoint, index })
            ),
            previousWaypointNotNull,
            rxjs.operators.switchMap(e => rxjs.from(
                this.showAirwaysHandler.show(e.previousWaypoint.infos)
                    .then(waypoints => waypoints.map((waypoint, i) => ({ index: e.index + i, icao: waypoint.icao })))
            )),
            rxjs.operators.switchMap(addWaypoints => rxjs.from(addWaypoints))
        );

        // Add waypoint
        this.addWaypoint$ = new rxjs.Subject();
        this.addWaypointAtIndex$ = new rxjs.Subject();

        const concatMapAddWaypoints = rxjs.operators.concatMap(event => {
            return rxjs.from(new Promise(resolve => {
                if (this.getNumWaypoints() == 0) {
                    console.log(`Added origin ${event.icao} at ${event.index}`);
                    this.flightPlan.setOrigin(event.icao, resolve);
                } else {
                    console.log(`Added ${event.icao} at ${event.index}`);
                    this.flightPlan.addWaypoint(event.icao, event.index, resolve);
                }
            }));
        });

        rxjs.merge(
            this.addWaypointAtIndex$,
            this.addWaypoint$.pipe(
                rxjs.operators.withLatestFrom(addWaypointIndex$, (icao, index) => ({ icao, index })),
                rxjs.operators.filter(e => e.index !== null)
            ),
        ).pipe(concatMapAddWaypoints).subscribe(() => this.updateWaypoints());

        airwayWaypoints$.pipe(
            concatMapAddWaypoints,
            rxjs.operators.debounceTime(500),
        ).subscribe(() => this.updateWaypoints())

        this.updateWaypoints();
    }
    setAltitude(waypointIndex, altitudeInFt) {
        waypointIndex = parseInt(waypointIndex);
        altitudeInFt = parseInt(altitudeInFt);
        this.flightPlan.setWaypointAdditionalData(waypointIndex, "ALTITUDE_MODE", "Manual");
        this.flightPlan.setWaypointAltitude(altitudeInFt / 3.2808, waypointIndex, () => {
            console.log(`Updated waypoint ${waypointIndex} altitude to ${altitudeInFt}`);
        });
    }
    setActiveWaypoint() {
        this.activateWaypointIndex$.next();
    }
    deleteWaypoint() {
        this.deleteWaypointIndex$.next();
    }
    isWaypointIndexApproach(waypointIndex) {
        return waypointIndex >= this.approachWaypointIndex;
    }
    deleteDeparture() {
        this.flightPlan.removeDeparture();
    }
    deleteArrival() {
        this.flightPlan.removeArrival();
    }
    deleteApproach() {
        this.flightPlan.deactivateApproach();
        this.flightPlan.setApproachIndex(-1);
    }
    deleteFlightPlan() {
        this.flightPlan.clearFlightPlan();
    }
    getNumWaypoints() {
        return this.flightPlan.getWaypointsCount();
    }
    setName(name) {
        console.log(`Set name: ${name}`);
        this.customName$.next(name == "" ? null : name);
    }
    updateWaypoints() {
        this.t++;
        if (this.t > 30) {
            this.flightPlan.updateFlightPlan();
            this.t = 0;
        }
        const flightPlan = this.flightPlan;

        const departure = flightPlan.getDepartureWaypointsMap();
        const arrival = flightPlan.getArrivalWaypointsMap();
        const approach = flightPlan.getApproachWaypoints();
        const enroute = flightPlan.getEnRouteWaypoints();
        const origin = flightPlan.getOrigin();
        const destination = flightPlan.getDestination();

        this.waypoints$.next(this.getAllWaypoints());
        this.flightPlan$.next({ departure, arrival, approach, enroute, origin, destination });

        const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
        const long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
        const planeCoordinates = new LatLong(lat, long);

        const gph = SimVar.GetSimVarValue("ENG FUEL FLOW GPH:1", "gallons per hour");
        const fob = SimVar.GetSimVarValue("FUEL TOTAL QUANTITY:1", "gallon");

        let lineIndex = 0;

        const hasActiveLeg = this.activeLeg.value ? true : false;
        let waypointIndex = 0;
        let approachWaypointIndex = 0;
        let cumulativeDistance = null;
        const mapWaypoint = (waypoint, type) => {
            const infos = waypoint.GetInfos();

            const isBeforeActiveLeg = hasActiveLeg && waypointIndex <= this.activeLeg.value.origin;
            const isActiveLeg = hasActiveLeg && waypointIndex == this.activeLeg.value.destination;
            const isAfterActiveLeg = hasActiveLeg ? (waypointIndex > this.activeLeg.value.destination) : true;

            let distance = waypoint.distanceInFP;
            let bearing = waypoint.bearingInFP;
            let fod = Math.max(0, fob - gph * (waypoint.estimatedTimeEnRouteFP / 3600));
            let ete = waypoint.estimatedTimeEnRouteFP;
            let eta = waypoint.estimatedTimeOfArrivalFP;
            let altitude = waypoint.altitudeinFP;

            if (isBeforeActiveLeg) {
                bearing = null;
                distance = null;
                fod = null;
                ete = null;
                eta = null;
                altitude = null;
            }
            else if (isActiveLeg) {
                bearing = Avionics.Utils.computeGreatCircleHeading(planeCoordinates, infos.coordinates);
                distance = Avionics.Utils.computeGreatCircleDistance(planeCoordinates, waypoint.infos.coordinates);
                cumulativeDistance = distance;
            }
            else if (isAfterActiveLeg) {
                cumulativeDistance += distance;
            }

            return {
                type: "waypoint",
                waypointType: type,
                approachWaypointIndex: type == "approach" ? approachWaypointIndex++ : null,
                lineIndex: lineIndex++,
                waypointIndex: waypointIndex++,
                ident: infos.ident != "" ? infos.ident : waypoint.ident,
                dtk: waypoint.bearingInFP,
                bearing: bearing,
                distance: this.distanceMode.value == "leg" ? distance : cumulativeDistance,
                legDistance: waypoint.distanceInFP,//distance,
                cumulativeDistance: waypoint.cumulativeDistanceInFP,// cumulativeDistance,
                ete: ete,
                eta: eta,
                fod: fod,
                altitude: altitude,
                altitudeMode: waypoint.legAltitudeDescription,
                altitude1: waypoint.legAltitude1,
                altitude2: waypoint.legAltitude2,
            }
        }

        const mapHeader = (type, text) => {
            return {
                type: "header",
                procedureType: type,
                lineIndex: lineIndex++,
                text: text,
            };
        };

        const lines = [];
        if (departure.length > 0) {
            lines.push(mapHeader("departure", `Departure - ${flightPlan.getDeparture().name}`));
            lines.push(mapWaypoint(flightPlan.getOrigin(), "origin"));
            lines.push(...departure.map(waypoint => mapWaypoint(waypoint, "departure")));
        }
        if (departure.length > 0 || arrival.length > 0 || (approach && approach.length > 0)) {
            lines.push(mapHeader("enroute", `Enroute`));
        }
        if (departure.length == 0 && origin) {
            lines.push(mapWaypoint(flightPlan.getOrigin()));
        }
        lines.push(...enroute.map(waypoint => mapWaypoint(waypoint, "enroute")));
        if (arrival.length > 0) {
            lines.push(mapHeader("arrival", `Arrival - ${flightPlan.getArrival().name}`));
            lines.push(...arrival.map(waypoint => mapWaypoint(waypoint, "arrival")));
        }
        if (destination) {
            lines.push(mapWaypoint(destination, "destination"));
        }
        this.approachWaypointIndex = waypointIndex;
        if (approach && approach.length > 0) {
            // Approaches are special cased to always start at 0 index, so we save a copy of what the current index is to add to our active leg values later
            //this.approachIndex = waypointIndex;
            let airportApproach = flightPlan.getAirportApproach();
            if (airportApproach) {
                lines.push(mapHeader("approach", `Approach - ${airportApproach.name}`));
            }
            lines.push(...approach.map(waypoint => mapWaypoint(waypoint, "approach")));
        }

        this.lines.value = lines;

        if (this.customName == null && this.customName != "") {
            this.name.next(`${origin ? origin.ident : "_____"} / ${destination ? destination.ident : "_____"}`);
        }
    }
    getAllWaypoints() {
        return [...this.flightPlan.getWaypoints(), ...this.flightPlan.getApproachWaypoints()];
    }
    newWaypointLineSelected() {
        this.selectedWaypointIndex$.next(null);
        this.newWaypointLineSelected$.next(true);
    }
    setSelectedWaypointIndex(index) {
        this.selectedWaypointIndex$.next(index);
    }
    directToSelected() {
        if (this.selectedWaypoint) {
            this.showDirectToHandler.show(this.selectedWaypoint.icao);
            return true;
        }
        return false;
    }
    addWaypoint(waypoint, index = null) {
        if (index === null) {
            this.addWaypoint$.next(waypoint.icao);
        } else {
            this.addWaypointAtIndex$.next({ icao: waypoint.icao, index });
        }
    }
}

class WT_Flight_Plan_Input_Layer extends Selectables_Input_Layer {
    /**
     * @param {WT_Flight_Plan_Page_View} flightPlanView 
     */
    constructor(flightPlanView) {
        super(new Selectables_Input_Layer_Dynamic_Source(flightPlanView));
        this.flightPlanView = flightPlanView;
    }
    onCLR(inputStack) {
        this.flightPlanView.handleDelete();
    }
    onMenuPush() {
        this.flightPlanView.showPageMenu();
    }
    onDirectTo() {
        return this.flightPlanView.onDirectTo();
    }
}

class WT_Flight_Plan_Page_View extends WT_HTML_View {
    handleDelete() {
        throw new Error("WT_Flight_Plan_Page_View.handleDelete not implemented");
    }
    onDirectTo() {
        throw new Error("WT_Flight_Plan_Page_View.onDirectTo not implemented");
    }
}