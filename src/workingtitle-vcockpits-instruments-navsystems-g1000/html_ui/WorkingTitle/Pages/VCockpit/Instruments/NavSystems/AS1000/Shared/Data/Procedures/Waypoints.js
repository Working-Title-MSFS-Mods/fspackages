class WT_Procedure_Waypoints {
    /**
     * @param {WT_Procedure_Leg[]} legs 
     */
    constructor(legs) {
        try {
            let i = 0;
            this.waypoints = [];
            const f = (21639 / 2) * Math.PI, sin = Math.sin, asin = Math.asin, cos = Math.cos, acos = Math.acos, tan = Math.tan, atan = Math.atan, abs = Math.abs;
            const greatCircleDistance = Avionics.Utils.computeGreatCircleDistance;
            const greatCircleHeading = Avionics.Utils.computeGreatCircleHeading;
            function deltaAngle(a, b) {
                let delta = a - b;
                delta = Avionics.Utils.fmod(delta + 180, 360) - 180;
                return abs(delta * Math.PI / 180);
            }
            for (let leg of legs) {
                if ((!leg.fix || leg.fix.coordinates == null) && (!leg.origin || leg.origin.coordinates == null)) {
                    console.warn("Leg didn't have any coordinates!");
                    continue;
                }
                switch (leg.type) {
                    case 3: {
                        const bearingToOrigin = greatCircleHeading(this.last.coordinates, leg.origin.coordinates);
                        const distanceToOrigin = greatCircleDistance(this.last.coordinates, leg.origin.coordinates);

                        const beta = deltaAngle(bearingToOrigin, leg.bearing);
                        const b = leg.distance / f;
                        const c = distanceToOrigin / f;

                        const gamma = asin((sin(c) * sin(beta)) / sin(b));
                        const invGamma = Math.PI - asin((sin(c) * sin(beta)) / sin(b));
                        const a1 = 2 * atan(tan(0.5 * (b - c)) * (sin(0.5 * (beta + gamma)) / sin(0.5 * (beta - gamma))));
                        const a2 = 2 * atan(tan(0.5 * (b - c)) * (sin(0.5 * (beta + invGamma)) / sin(0.5 * (beta - invGamma))));
                        const a = b > c ? a1 : Math.min(a1, a2);
                        const coordinates = Avionics.Utils.bearingDistanceToCoordinates(leg.bearing, a * f, this.last.coordinates.lat, this.last.coordinates.long);

                        this.add(leg, `${leg.origin.ident}${leg.distance.toFixed(0)}`, coordinates, a, leg.bearing);
                        break;
                    }
                    case 4: {
                        if (leg.fix && leg.fix.coordinates) {
                            this.add(leg, leg.fix.ident, leg.fix.coordinates, leg.distance, leg.bearing);
                        } else {
                            this.add(leg, `${leg.origin.ident}${leg.distance.toFixed(0)}`, Avionics.Utils.bearingDistanceToCoordinates(leg.bearing, leg.distance, leg.origin.coordinates.lat, leg.origin.coordinates.long), leg.distance, leg.bearing);
                        }
                        break;
                    }
                    case 6: {
                        const originToCoordinates = greatCircleHeading(leg.origin.coordinates, this.last.coordinates);
                        const coordinatesToOrigin = greatCircleHeading(this.last.coordinates, leg.origin.coordinates);
                        const distanceToOrigin = greatCircleDistance(this.last.coordinates, leg.origin.coordinates);

                        const alpha = deltaAngle(coordinatesToOrigin, leg.bearing);
                        const beta = deltaAngle(originToCoordinates, leg.theta);
                        const c = distanceToOrigin / f;

                        const gamma = acos(sin(alpha) * sin(beta) * cos(c) - cos(alpha) * cos(beta));
                        const b = acos((cos(beta) + cos(alpha) * cos(gamma)) / (sin(alpha) * sin(gamma)));
                        const coordinates = Avionics.Utils.bearingDistanceToCoordinates(leg.bearing, b * f, this.last.coordinates.lat, this.last.coordinates.long);

                        this.add(leg, `${leg.origin.ident}${leg.distance.toFixed(0)}`, coordinates, leg.distance, leg.bearing);
                        break;
                    }
                    case 10: {
                        if (i == 0) {
                            this.add(leg, leg.origin.ident, leg.origin.coordinates, 0, 0);
                        }
                        const bearingToOrigin = greatCircleHeading(this.last.coordinates, leg.origin.coordinates);
                        const distanceToOrigin = greatCircleDistance(this.last.coordinates, leg.origin.coordinates);

                        const beta = deltaAngle(bearingToOrigin, leg.bearing);
                        const b = leg.distance / f;
                        const c = distanceToOrigin / f;

                        const gamma = asin((sin(c) * sin(beta)) / sin(b));
                        const invGamma = Math.PI - asin((sin(c) * sin(beta)) / sin(b));
                        const a1 = 2 * atan(tan(0.5 * (b - c)) * (sin(0.5 * (beta + gamma)) / sin(0.5 * (beta - gamma))));
                        const a2 = 2 * atan(tan(0.5 * (b - c)) * (sin(0.5 * (beta + invGamma)) / sin(0.5 * (beta - invGamma))));
                        const a = b > c ? a1 : Math.min(a1, a2);
                        const coordinates = Avionics.Utils.bearingDistanceToCoordinates(leg.bearing, a * f, this.last.coordinates.lat, this.last.coordinates.long);

                        this.add(leg, `${leg.origin.ident}${leg.distance.toFixed(0)}`, coordinates, a, leg.bearing);
                        break;
                    }
                    case 11: {
                        this.add(leg, `${leg.fix ? leg.fix.ident : ""}`, Avionics.Utils.bearingDistanceToCoordinates(leg.bearing, 2, this.last.coordinates.lat, this.last.coordinates.long), 2, leg.bearing);
                        break;
                    }
                    case 7:
                    case 15:
                    case 18: {
                        this.add(leg, leg.fix.ident, leg.fix.coordinates, leg.distance, leg.bearing);
                        break;
                    }
                    default: {
                        console.warn(`Unhandled leg type (${leg.type})`);
                        break;
                    }
                }
                i++;
            }
        } catch (e) {
            console.error(e.message);
        }
    }
    get last() {
        return this.waypoints[this.waypoints.length - 1];
    }
    add(leg, name, coordinates, distance, bearing) {
        if (this.waypoints.length > 0) {
            distance = Avionics.Utils.computeGreatCircleDistance(this.last.coordinates, coordinates);
            bearing = Avionics.Utils.computeGreatCircleHeading(this.last.coordinates, coordinates);
        }
        this.waypoints.push({
            leg: leg,
            name: name,
            coordinates: coordinates,
            distance: distance,
            bearing: bearing
        });
    }
}