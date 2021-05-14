class WT_FlightPlanSerializer {
    /**
     * @param {WT_ICAOWaypointFactory} icaoWaypointFactory
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
     * @param {WT_FlightPlanLeg} leg
     * @returns {WT_FlightPlanAirwaySerializedObject}
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

        if (leg.altitudeConstraint.advisoryAltitude) {
            obj.advAlt = leg.altitudeConstraint.advisoryAltitude.asUnit(WT_Unit.FOOT);
        }
        if (leg.altitudeConstraint.publishedConstraint) {
            obj.pubAltType = leg.altitudeConstraint.publishedConstraint.type;
            obj.pubAltCeil = leg.altitudeConstraint.publishedConstraint.ceiling.asUnit(WT_Unit.FOOT);
            obj.pubAltFloor = leg.altitudeConstraint.publishedConstraint.floor.asUnit(WT_Unit.FOOT);
        }

        return obj;
    }

    /**
     *
     * @param {WT_FlightPlanAirwaySequence} airwaySequence
     * @returns {WT_FlightPlanAirwaySerializedObject}
     */
    _getAirwayObject(airwaySequence) {
        return {
            airway: 1,
            name: airwaySequence.airway.name,
            entry: airwaySequence.legs.first().fix.icao,
            exit: airwaySequence.legs.last().fix.icao
        };
    }

    /**
     *
     * @param {WT_FlightPlan} flightPlan
     * @returns {(WT_FlightPlanLegSerializedObject|WT_FlightPlanAirwaySerializedObject)[]}
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
     * @returns {WT_FlightPlanDepartureArrivalSerializedObject}
     */
    _getDeparture(departureSegment) {
        return {
            name: departureSegment.procedure.name,
            enrIndex: departureSegment.enrouteTransitionIndex,
            rwyIndex: departureSegment.runwayTransitionIndex
        };
    }

    /**
     *
     * @param {WT_FlightPlanArrival} arrivalSegment
     * @returns {WT_FlightPlanDepartureArrivalSerializedObject}
     */
    _getArrival(arrivalSegment) {
        return {
            name: arrivalSegment.procedure.name,
            enrIndex: arrivalSegment.enrouteTransitionIndex,
            rwyIndex: arrivalSegment.runwayTransitionIndex
        };
    }

    /**
     *
     * @param {WT_FlightPlanApproach} approachSegment
     * @returns {WT_FlightPlanApproachSerializedObject}
     */
    _getApproach(approachSegment) {
        return {
            name: approachSegment.procedure.name,
            trnIndex: approachSegment.transitionIndex
        }
    }

    /**
     *
     * @param {WT_FlightPlan} flightPlan
     * @returns {WT_FlightPlanSerializedObject}
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
     *
     * @param {WT_FlightPlan} flightPlan
     * @returns {String}
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
     * @param {WT_FlightPlan.Segment} segment
     * @param {WT_FlightPlanLegSerializedObject} obj
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
        if (obj.advAlt !== undefined) {
            entry.advisoryAltitude = new WT_Unit.FOOT.createNumber(obj.advAlt);
        }
        if (obj.pubAltType !== undefined) {
            switch (obj.pubAltType) {
                case WT_AltitudeConstraint.Type.NONE:
                    entry.publishedConstraint = WT_AltitudeConstraint.NONE;
                    break;
                case WT_AltitudeConstraint.Type.AT:
                    entry.publishedConstraint = new WT_AtAltitude(this._tempFoot1.set(obj.pubAltCeil));
                    break;
                case WT_AltitudeConstraint.Type.AT_OR_ABOVE:
                    entry.publishedConstraint = new WT_AtOrAboveAltitude(this._tempFoot1.set(obj.pubAltFloor));
                    break;
                case WT_AltitudeConstraint.Type.AT_OR_BELOW:
                    entry.publishedConstraint = new WT_AtOrAboveAltitude(this._tempFoot1.set(obj.pubAltCeil));
                    break;
                case WT_AltitudeConstraint.Type.BETWEEN:
                    entry.publishedConstraint = new WT_BetweenAltitude(this._tempFoot1.set(obj.pubAltFloor), this._tempFoot2.set(obj.pubAltCeil));
                    break;
            }
        }
        await flightPlan.insertWaypoint(segment, entry);
    }

    /**
     *
     * @param {WT_FlightPlan.Segment} segment
     * @param {WT_FlightPlanAirwaySerializedObject} obj
     * @param {WT_FlightPlan} flightPlan
     */
    async _parseAirway(segment, obj, flightPlan) {
        await flightPlan.insertAirway(segment, obj.name, obj.entry, obj.exit);
    }

    /**
     *
     * @param {(WT_FlightPlanLegSerializedObject|WT_FlightPlanAirwaySerializedObject)[]} enr
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
     * @param {WT_FlightPlanDepartureArrivalSerializedObject} dep
     * @param {WT_FlightPlan} flightPlan
     */
    async _parseDeparture(dep, flightPlan) {
        await flightPlan.setDeparture(dep.name, dep.rwyIndex, dep.enrIndex);
    }

    /**
     *
     * @param {WT_FlightPlanDepartureArrivalSerializedObject} arr
     * @param {WT_FlightPlan} flightPlan
     */
    async _parseArrival(arr, flightPlan) {
        await flightPlan.setArrival(arr.name, arr.enrIndex, arr.rwyIndex);
    }

    /**
     *
     * @param {WT_FlightPlanApproachSerializedObject} app
     * @param {WT_FlightPlan} flightPlan
     */
    async _parseApproach(app, flightPlan) {
        await flightPlan.setApproach(app.name, app.trnIndex);
    }

    /**
     *
     * @param {WT_FlightPlanSerializedObject} json
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
     *
     * @param {String} string
     * @param {WT_FlightPlan} flightPlan
     * @returns {Promise<WT_FlightPlan>}
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
 * @typedef WT_FlightPlanSerializedObject
 * @property {String} orig
 * @property {String} dest
 * @property {(WT_FlightPlanLegSerializedObject|WT_FlightPlanAirwaySerializedObject)[]} enr
 * @property {WT_FlightPlanDepartureArrivalSerializedObject} [dep]
 * @property {WT_FlightPlanDepartureArrivalSerializedObject} [arr]
 * @property {WT_FlightPlanApproachSerializedObject} [app]
 */

/**
 * @typedef WT_FlightPlanDepartureArrivalSerializedObject
 * @property {String} name
 * @property {Number} enrIndex
 * @property {Number} rwyIndex
 * @property {WT_FlightPlanLegSerializedObject[]} [legs]
 */

/**
 * @typedef WT_FlightPlanApproachSerializedObject
 * @property {String} name
 * @property {Number} trnIndex
 * @property {WT_FlightPlanLegSerializedObject[]} [legs]
 */

/**
 * @typedef WT_FlightPlanAirwaySerializedObject
 * @property {Number} airway
 * @property {String} name
 * @property {String} entry
 * @property {String} exit
 */

/**
 * @typedef WT_FlightPlanLegSerializedObject
 * @property {Number} leg
 * @property {String} [icao]
 * @property {Number[]} [latlon]
 * @property {String} [ident]
 * @property {Number[][]} [steps]
 * @property {Number} [advAlt]
 * @property {Number} [pubAltType]
 * @property {Number} [pubAltCeil]
 * @property {Number} [pubAltFloor]
 */