declare module "MSFS" {
  export class WayPoint {
    constructor(_baseInstrument: BaseInstrument);
    icao: string;
    ident: string;
    endsInDiscontinuity?: boolean;
    isVectors?: boolean;
    isRunway?: boolean;
    hasHold?: boolean;
    holdDetails: HoldDetails;
    infos: WayPointInfo;
    type: string;
    bearingInFP: number;
    distanceInFP: number;
    cumulativeDistanceInFP: number;
    instrument: BaseInstrument;
    altDesc: number;
    altitude1: number;
    altitude2: number;
    legAltitudeDescription: number;
    legAltitude1: number;
    legAltitude2: number;
    speedConstraint: number;
    additionalData: { [key: string]: any }
    _svgElements: any;
  }

  export class BaseInstrument {
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    facilityLoader: FacilityLoader;
    instrumentIdentifier: string;
  }

  export class NavSystem {
  }

  export class FacilityLoader {
    getFacilityRaw(icao: string, timeout?: number): Promise<any>;
  }

  export class WayPointInfo {
    constructor(_instrument: BaseInstrument);
    coordinates: LatLongAlt;
    icao: string;
    ident: string;
    airwayIn: string;
    airwayOut: string;
    routes: any[];
    instrument: BaseInstrument;
    magneticVariation?: number;
    _svgElements: any;
    routes: any[];
    UpdateInfos(_CallBack?, loadFacilitiesTransitively?);
    CopyBaseInfosFrom(_WP: WayPoint);
  }

  export class AirportInfo extends WayPointInfo {
    constructor(_instrument: BaseInstrument);
    frequencies: any[];
    namedFrequencies: any[];
    departures: any[];
    approaches: any[];
    arrivals: any[];
    runways: any[];
    oneWayRunways: OneWayRunway[];
    UpdateNamedFrequencies(icao?: string): Promise<void>
  }

  export class IntersectionInfo extends WayPointInfo {
    constructor(_instrument: BaseInstrument);
  }

  export class VORInfo extends WayPointInfo {
    constructor(_instrument: BaseInstrument);
  }

  export class NDBInfo extends WayPointInfo {
    constructor(_instrument: BaseInstrument);
  }

  export interface OneWayRunway {
    designation: string;
    direction: number;
    beginningCoordinates: LatLongAlt;
    endCoordinates: LatLongAlt;
    elevation: number;
  }

  export interface RunwayTransition {
    runwayNumber: number;
    runwayDesignation: number;
  }

  export interface EnrouteTransition {
    legs: ProcedureLeg[];
  }

  export class Runway { }

  export class Avionics {
    static Utils: Utils;
  }

  export class Utils {
    computeGreatCircleHeading(coords1: LatLongAlt, coords2: LatLongAlt): number;
    computeGreatCircleDistance(coords1: LatLongAlt, coords2: LatLongAlt): number;
    bearingDistanceToCoordinates(bearing: number, distanceInNM: number, lat: number, long: number): LatLongAlt;
    fmod(value: number, moduloBy: number): number;
    computeDistance(coords1: LatLongAlt, coords2: LatLongAlt);
    angleDiff(degrees1: number, degrees2: number);
    lerpAngle(from: number, to: number, d: number);
    DEG2RAD: number;
    RAD2DEG: number;
  }

  export interface ProcedureLeg {
    type: number;
    fixIcao: string;
    originIcao: string;
    altDesc: number;
    altitude1: number;
    altitude2: number;
    course: number;
    distance: number;
    rho: number;
    theta: number;
    turnDirection: number;
  }

  export class LatLongAlt {
    constructor(lat?: number, long?: number, alt?: number);
    lat: number;
    long: number;
    alt: number;
  }

  export class SimVar {
    static GetSimVarValue(name: string, unit: string, dataSource?: string): any;
    static SetSimVarValue(name: string, unit: string, value: any, dataSource?: string): Promise<void>;
  }

  export class Simplane {
    static getHeadingMagnetic(): number;
    static getGroundSpeed(): number;
    static getNextWaypointName(): string;
  }

  export class EmptyCallback {
    static Void: () => void;
    static Boolean: (boolean) => void;
  }

  export class Coherent {
    static call(handler: string, ...params: any[]): Promise<any>
  }

  export function RegisterViewListener(handler: string): void

  export class FMCMainDisplay {
    lastPos: string;
  }
}
