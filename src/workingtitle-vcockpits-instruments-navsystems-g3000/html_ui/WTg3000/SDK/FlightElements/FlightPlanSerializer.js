/**
 * Serializer for WT_FlightPlan objects.
 */
class WT_FlightPlanSerializer {
    /**
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory - a factory with which to create ICAO waypoints.
     */
    constructor(icaoWaypointFactory) {
        this._tempFlightPlan = new WT_FlightPlan(icaoWaypointFactory);
        this._tempFoot1 = WT_Unit.FOOT.createNumber(0);
        this._tempFoot2 = WT_Unit.FOOT.createNumber(0);
        this._tempGeoPoint = new WT_GeoPoint(0, 0);
    }

    /**
     *
     * @param {WT_FlightPlan} flightPlan
     * @returns {String}
     */
    _getOriginICAO(flightPlan) {
        return flightPlan.hasOrigin() ? flightPlan.getOrigin().waypoint.icao : "";
    }

    /**
     *
     * @param {WT_FlightPlan} flightPlan
     * @returns {String}
     */
    _getDestinationICAO(flightPlan) {
        return flightPlan.hasDestination() ? flightPlan.getDestination().waypoint.icao : "";
    }

    /**
     *
     * @param {WT_FlightPlanLegAltitudeConstraint} altitudeConstraint
     * @returns {WT_FlightPlanAltitudeConstraintSerializableObject}
     */
    _getAltitudeConstraintObject(altitudeConstraint) {
        let obj = {};
        if (altitudeConstraint.customAltitude) {
            obj.customAlt = altitudeConstraint.customAltitude.asUnit(WT_Unit.FOOT);
        }
        if (altitudeConstraint.advisoryAltitude) {
            obj.advAlt = altitudeConstraint.advisoryAltitude.asUnit(WT_Unit.FOOT);
        }
        if (altitudeConstraint.publishedConstraint) {
            obj.pubAltType = altitudeConstraint.publishedConstraint.type;
            switch (altitudeConstraint.publishedConstraint.type) {
                case WT_AltitudeConstraint.Type.BETWEEN:
                    obj.pubAltFloor = altitudeConstraint.publishedConstraint.floor.asUnit(WT_Unit.FOOT);
                case WT_AltitudeConstraint.Type.AT:
                case WT_AltitudeConstraint.Type.AT_OR_BELOW:
                    obj.pubAltCeil = altitudeConstraint.publishedConstraint.ceiling.asUnit(WT_Unit.FOOT);
                    break;
                case WT_AltitudeConstraint.Type.AT_OR_ABOVE:
                    obj.pubAltFloor = altitudeConstraint.publishedConstraint.floor.asUnit(WT_Unit.FOOT);
                    break;
            }
        }
        return obj;
    }

    /**
     *
     * @param {WT_FlightPlanLeg} leg
     * @returns {WT_FlightPlanAirwaySerializableObject}
     */
    _getLegObject(leg) {
        let obj = {
            leg: 1
        }
        if (leg.fix instanceof WT_ICAOWaypoint) {
            obj.icao = leg.fix.icao;
        } else {
            obj.latlon = [leg.fix.location.long, leg.fix.location.lat];
            obj.ident = leg.fix.ident;
        }

        /**
         * @type {WT_FlightPlanLegStep[]}
         */
        let steps = [];
        let currentStep = leg.firstStep();
        while (currentStep) {
            steps.push(currentStep);
            let next = currentStep.next();
            if (!currentStep.isLoop && next) {
                currentStep = next;
            } else {
                currentStep = null;
            }
        }
        if (steps.length > 1) {
            obj.steps = steps.map(step => [step.endpoint.long, step.endpoint.lat]);
        }

        obj.alt = this._getAltitudeConstraintObject(leg.altitudeConstraint);

        return obj;
    }

    /**
     *
     * @param {WT_FlightPlanAirwaySequence} airwaySequence
     * @returns {WT_FlightPlanAirwaySerializableObject}
     */
    _getAirwayObject(airwaySequence) {
        return {
            airway: 1,
            name: airwaySequence.airway.name,
            entry: airwaySequence.legs.first().fix.icao,
            exit: airwaySequence.legs.last().fix.icao,
            alts: airwaySequence.legs.map(leg => this._getAltitudeConstraintObject(leg.altitudeConstraint), this)
        };
    }

    /**
     *
     * @param {WT_FlightPlan} flightPlan
     * @returns {(WT_FlightPlanLegSerializableObject|WT_FlightPlanAirwaySerializableObject)[]}
     */
    _getEnroute(flightPlan) {
        let enr = [];
        flightPlan.getEnroute().elements.forEach(element => {
            if (element instanceof WT_FlightPlanLeg) {
                enr.push(this._getLegObject(element))
            } else if (element instanceof WT_FlightPlanAirwaySequence) {
                enr.push(this._getAirwayObject(element));
            }
        }, this);
        return enr;
    }

    /**
     *
     * @param {WT_FlightPlanDeparture} departureSegment
     * @returns {WT_FlightPlanDepartureArrivalSerializableObject}
     */
    _getDeparture(departureSegment) {
        return {
            name: departureSegment.procedure.name,
            enrIndex: departureSegment.enrouteTransitionIndex,
            rwyIndex: departureSegment.runwayTransitionIndex,
            alts: departureSegment.legs.map(leg => this._getAltitudeConstraintObject(leg.altitudeConstraint), this)
        };
    }

    /**
     *
     * @param {WT_FlightPlanArrival} arrivalSegment
     * @returns {WT_FlightPlanDepartureArrivalSerializableObject}
     */
    _getArrival(arrivalSegment) {
        return {
            name: arrivalSegment.procedure.name,
            enrIndex: arrivalSegment.enrouteTransitionIndex,
            rwyIndex: arrivalSegment.runwayTransitionIndex,
            alts: arrivalSegment.legs.map(leg => this._getAltitudeConstraintObject(leg.altitudeConstraint), this)
        };
    }

    /**
     *
     * @param {WT_FlightPlanApproach} approachSegment
     * @returns {WT_FlightPlanApproachSerializableObject}
     */
    _getApproach(approachSegment) {
        return {
            name: approachSegment.procedure.name,
            trnIndex: approachSegment.transitionIndex,
            alts: approachSegment.legs.map(leg => this._getAltitudeConstraintObject(leg.altitudeConstraint), this)
        };
    }

    /**
     *
     * @param {WT_FlightPlan} flightPlan
     * @returns {WT_FlightPlanSerializableObject}
     */
    _buildJSON(flightPlan) {
        let json = {
            orig: this._getOriginICAO(flightPlan),
            dest: this._getDestinationICAO(flightPlan),
            enr: this._getEnroute(flightPlan)
        }
        if (flightPlan.hasDeparture()) {
            json.dep = this._getDeparture(flightPlan.getDeparture());
        }
        if (flightPlan.hasArrival()) {
            json.arr = this._getArrival(flightPlan.getArrival());
        }
        if (flightPlan.hasApproach()) {
            json.app = this._getApproach(flightPlan.getApproach());
        }
        return json;
    }

    /**
     * Serializes a flight plan to a string.
     * @param {WT_FlightPlan} flightPlan - the flight plan to serialize.
     * @returns {String} a string representation of the provided flight plan.
     */
    serialize(flightPlan) {
        if (!flightPlan) {
            return "";
        }

        let json = this._buildJSON(flightPlan);
        return JSON.stringify(json);
    }

    /**
     *
     * @param {String} icao
     * @param {WT_FlightPlan} flightPlan
     */
    async _parseOrigin(icao, flightPlan) {
        if (icao !== "") {
            await flightPlan.setOriginICAO(icao);
        }
    }

    /**
     *
     * @param {String} icao
     * @param {WT_FlightPlan} flightPlan
     */
    async _parseDestination(icao, flightPlan) {
        if (icao !== "") {
            await flightPlan.setDestinationICAO(icao);
        }
    }

    /**
     *
     * @param {WT_FlightPlanAltitudeConstraintSerializableObject} obj
     * @param {WT_FlightPlanLeg} leg
     */
    _parseAltitudeConstraint(obj, leg) {
        if (obj.customAlt !== undefined) {
            leg.altitudeConstraint.setCustomAltitude(this._tempFoot1.set(obj.customAlt));
        }
        if (obj.advAlt !== undefined) {
            leg.altitudeConstraint.setAdvisoryAltitude(this._tempFoot1.set(obj.advAlt));
        }
        if (obj.pubAltType !== undefined) {
            switch (obj.pubAltType) {
                case WT_AltitudeConstraint.Type.NONE:
                    leg.altitudeConstraint.setPublishedConstraint(WT_AltitudeConstraint.NONE);
                    break;
                case WT_AltitudeConstraint.Type.AT:
                    leg.altitudeConstraint.setPublishedConstraint(new WT_AtAltitude(this._tempFoot1.set(obj.pubAltCeil)));
                    break;
                case WT_AltitudeConstraint.Type.AT_OR_ABOVE:
                    leg.altitudeConstraint.setPublishedConstraint(new WT_AtOrAboveAltitude(this._tempFoot1.set(obj.pubAltFloor)));
                    break;
                case WT_AltitudeConstraint.Type.AT_OR_BELOW:
                    leg.altitudeConstraint.setPublishedConstraint(new WT_AtOrAboveAltitude(this._tempFoot1.set(obj.pubAltCeil)));
                    break;
                case WT_AltitudeConstraint.Type.BETWEEN:
                    leg.altitudeConstraint.setPublishedConstraint(new WT_BetweenAltitude(this._tempFoot1.set(obj.pubAltFloor), this._tempFoot2.set(obj.pubAltCeil)));
                    break;
            }
        }
    }

    /**
     *
     * @param {WT_FlightPlan.Segment} segment
     * @param {WT_FlightPlanLegSerializableObject} obj
     * @param {WT_FlightPlan} flightPlan
     */
    async _parseLeg(segment, obj, flightPlan) {
        let entry = {};
        if (obj.icao) {
            entry.icao = obj.icao;
        } else {
            entry.waypoint = new WT_FlightPathWaypoint(obj.ident, this._tempGeoPoint.set(obj.latlon[1], obj.latlon[0]));
        }
        if (obj.steps) {
            entry.steps = obj.steps.map(step => new WT_GeoPoint(step[1], step[0]));
        }

        let leg = await flightPlan.insertWaypoint(segment, entry);
        this._parseAltitudeConstraint(obj.alt, leg);
    }

    /**
     *
     * @param {WT_FlightPlan.Segment} segment
     * @param {WT_FlightPlanAirwaySerializableObject} obj
     * @param {WT_FlightPlan} flightPlan
     */
    async _parseAirway(segment, obj, flightPlan) {
        let airwaySequence = await flightPlan.insertAirway(segment, obj.name, obj.entry, obj.exit);
        airwaySequence.legs.forEach((leg, index) => this._parseAltitudeConstraint(obj.alts[index], leg), this);
    }

    /**
     *
     * @param {(WT_FlightPlanLegSerializableObject|WT_FlightPlanAirwaySerializableObject)[]} enr
     * @param {WT_FlightPlan} flightPlan
     */
    async _parseEnroute(enr, flightPlan) {
        for (let i = 0; i < enr.length; i++) {
            let obj = enr[i];
            if (obj.leg === 1) {
                await this._parseLeg(WT_FlightPlan.Segment.ENROUTE, obj, flightPlan);
            } else if (obj.airway === 1) {
                await this._parseAirway(WT_FlightPlan.Segment.ENROUTE, obj, flightPlan);
            }
        }
    }

    /**
     *
     * @param {WT_FlightPlanDepartureArrivalSerializableObject} dep
     * @param {WT_FlightPlan} flightPlan
     */
    async _parseDeparture(dep, flightPlan) {
        await flightPlan.setDeparture(dep.name, dep.rwyIndex, dep.enrIndex);
        flightPlan.getDeparture().legs.forEach((leg, index) => this._parseAltitudeConstraint(dep.alts[index], leg), this);
    }

    /**
     *
     * @param {WT_FlightPlanDepartureArrivalSerializableObject} arr
     * @param {WT_FlightPlan} flightPlan
     */
    async _parseArrival(arr, flightPlan) {
        await flightPlan.setArrival(arr.name, arr.enrIndex, arr.rwyIndex);
        flightPlan.getArrival().legs.forEach((leg, index) => this._parseAltitudeConstraint(arr.alts[index], leg), this);
    }

    /**
     *
     * @param {WT_FlightPlanApproachSerializableObject} app
     * @param {WT_FlightPlan} flightPlan
     */
    async _parseApproach(app, flightPlan) {
        await flightPlan.setApproach(app.name, app.trnIndex);
        flightPlan.getApproach().legs.forEach((leg, index) => this._parseAltitudeConstraint(app.alts[index], leg), this);
    }

    /**
     *
     * @param {WT_FlightPlanSerializableObject} json
     * @param {WT_FlightPlan} flightPlan
     */
    async _parseJSON(json, flightPlan) {
        flightPlan.clear();
        await this._parseOrigin(json.orig, flightPlan);
        await this._parseDestination(json.dest, flightPlan);
        if (json.dep) {
            await this._parseDeparture(json.dep, flightPlan);
        }
        await this._parseEnroute(json.enr, flightPlan);
        if (json.arr) {
            await this._parseArrival(json.arr, flightPlan);
        }
        if (json.app) {
            await this._parseApproach(json.app, flightPlan);
        }
    }

    /**
     * Deserializes a flight plan and copies it to a specified flight plan.
     * @param {String} string - the string representation of the flight plan to deserialize.
     * @param {WT_FlightPlan} flightPlan - the flight plan into which to copy the deserialized flight plan.
     * @returns {Promise<WT_FlightPlan>} a Promise which is fulfilled with the supplied flight plan once it has been
     *          copied from the deserialized flight plan.
     */
    async deserialize(string, flightPlan) {
        if (string === "") {
            return flightPlan;
        }

        let json = JSON.parse(string);
        await this._parseJSON(json, this._tempFlightPlan);
        flightPlan.copyFrom(this._tempFlightPlan);
        return flightPlan;
    }
}

/**
 * @typedef WT_FlightPlanSerializableObject
 * @property {String} orig - the ICAO string of the origin, or the empty string if no origin exists.
 * @property {String} dest - the ICAO string of the destination, or the empty string if no destination exists.
 * @property {(WT_FlightPlanLegSerializableObject|WT_FlightPlanAirwaySerializableObject)[]} enr - an array of
 *           serializable object representations of the elements in the enroute segment.
 * @property {WT_FlightPlanDepartureArrivalSerializableObject} [dep] - a serializable object representation of the
 *           departure segment.
 * @property {WT_FlightPlanDepartureArrivalSerializableObject} [arr] - a serializable object representation of the
 *           arrival segment.
 * @property {WT_FlightPlanApproachSerializableObject} [app] - a serializable object representation of the approach
 *           segment.
 */

/**
 * @typedef WT_FlightPlanDepartureArrivalSerializableObject
 * @property {String} name - the name of the procedure.
 * @property {Number} enrIndex - the enroute transition index of the procedure.
 * @property {Number} rwyIndex - the runway transition index of the procedure.
 * @property {WT_FlightPlanAltitudeConstraintSerializableObject[]} alts - an array of serializable object
 *           representations of the altitude constraints of the procedure segment's legs.
 */

/**
 * @typedef WT_FlightPlanApproachSerializableObject
 * @property {String} name - the name of the procedure.
 * @property {Number} trnIndex - the transition index of the procedure.
 * @property {WT_FlightPlanAltitudeConstraintSerializableObject[]} alts - an array of serializable object
 *           representations of the altitude constraints of the procedure segment's legs.
 */

/**
 * @typedef WT_FlightPlanAirwaySerializableObject
 * @property {Number} airway - equal to 1 to signify this object represents an airway sequence.
 * @property {String} name - the name of the airway.
 * @property {String} entry - the ICAO string of the entry waypoint.
 * @property {String} exit - the ICAO string of the exit waypoint.
 * @property {WT_FlightPlanAltitudeConstraintSerializableObject[]} alts - an array of serializable object
 *           representations of the altitude constraints of the airway sequence's legs.
 */

/**
 * @typedef WT_FlightPlanLegSerializableObject
 * @property {Number} leg - equal to 1 to signify this object represents a flight plan leg.
 * @property {String} [icao] - the ICAO string of the leg terminator fix.
 * @property {Number[]} [latlon] - the lat/long coordinates ([long, lat]) of the leg terminator fix. Only defined if
 *           the fix is not an ICAO waypoint.
 * @property {String} [ident] - the ident string of the leg terminator fix. Only defined if the fix is not an ICAO
 *           waypoint.
 * @property {Number[][]} [steps] - an array of lat/long coordinates ([long, lat]) of the endpoints of the individual
 *           steps which comprise the leg. Only defined if the leg has more than one component step.
 * @property {WT_FlightPlanAltitudeConstraintSerializableObject} alt - a serializable object representation of the
 *           leg's altitude constraint.
 */

/**
 * @typedef WT_FlightPlanAltitudeConstraintSerializableObject
 * @property {Number} [customAlt] - the value (in feet) of the custom altitude constraint, if one exists.
 * @property {Number} [advAlt] - the value (in feet) of the advisory altitude constraint, if one exists.
 * @property {Number} [pubAltType] - the type of the published altitude constraint, if one exists.
 * @property {Number} [pubAltCeil] - the published altitude ceiling, if one exists.
 * @property {Number} [pubAltFloor] - the published altitude floor, if one exists.
 */