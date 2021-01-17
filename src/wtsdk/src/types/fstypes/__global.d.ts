// WT

declare class WTDataStore {
  /**
   * Retrieves a key from the datastore, possibly returning the default value
   * @param key The name of the key to retrieve
   * @param defaultValue The default value to use if the key does not exist
   * @returns Either the stored value of the key, or the default value
   */
  static get(key: string, defaultValue: string | number | boolean): any;

  /**
   * Stores a key in the datastore
   * @param key The name of the value to store
   * @param The value to store
   */
  static set(key: string, value: string | number | boolean): any;
}

declare class CJ4_FMC extends FMCMainDisplay {
  clearDisplay(): void;
  registerPeriodicPageRefresh(action: () => boolean, interval: number, runImmediately: boolean): void;
  unregisterPeriodicPageRefresh(): void;
}

declare class LZUTF8 {
  static compress(input: string, options?: {}): any;
  static decompress(input: string, options?: {}): any;
}


// MSFS

declare class WayPoint {
    constructor(_baseInstrument: BaseInstrument);
    icao: string;
    ident: string;
    endsInDiscontinuity?: boolean;
    isVectors?: boolean;
    isRunway?: boolean;
    hasHold?: boolean;
    holdDetails: any;
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

  declare class BaseInstrument {
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    facilityLoader: FacilityLoader;
    instrumentIdentifier: string;
  }

  declare class NavSystem {
  }

  declare class FacilityLoader {
    getFacilityRaw(icao: string, timeout?: number): Promise<any>;
  }

  declare class WayPointInfo {
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
    UpdateInfos(_CallBack?, loadFacilitiesTransitively?);
    CopyBaseInfosFrom(_WP: WayPoint);
  }

  declare class AirportInfo extends WayPointInfo {
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

  declare class IntersectionInfo extends WayPointInfo {
    constructor(_instrument: BaseInstrument);
  }

  declare class VORInfo extends WayPointInfo {
    constructor(_instrument: BaseInstrument);
  }

  declare class NDBInfo extends WayPointInfo {
    constructor(_instrument: BaseInstrument);
  }

  declare interface OneWayRunway {
    designation: string;
    direction: number;
    beginningCoordinates: LatLongAlt;
    endCoordinates: LatLongAlt;
    elevation: number;
  }

  declare interface RunwayTransition {
    runwayNumber: number;
    runwayDesignation: number;
  }

  declare interface EnrouteTransition {
    legs: ProcedureLeg[];
  }

  declare class Runway { }

  declare class Avionics {
    static Utils: Utils;
  }

  declare class Utils {
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

  declare interface ProcedureLeg {
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

  declare class LatLongAlt {
    constructor(lat?: number, long?: number, alt?: number);
    lat: number;
    long: number;
    alt: number;
  }

  declare class SimVar {
    static GetSimVarValue(name: string, unit: string, dataSource?: string): any;
    static SetSimVarValue(name: string, unit: string, value: any, dataSource?: string): Promise<void>;
  }

  declare class Simplane {
    static getHeadingMagnetic(): number;
    static getGroundSpeed(): number;
    static getNextWaypointName(): string;
  }

  declare class EmptyCallback {
    static Void: () => void;
    static Boolean: (boolean) => void;
  }

  declare class Coherent {
    static call(handler: string, ...params: any[]): Promise<any>
  }

  declare function RegisterViewListener(handler: string): void

  declare class FMCMainDisplay {
    lastPos: string;
  }