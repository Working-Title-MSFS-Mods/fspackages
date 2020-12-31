import { Avionics, Simplane } from 'MSFS';

/**
 * Details of a hold procedure for a fix.
 */
export class HoldDetails {
  /** The course to fly the hold at. */
  public holdCourse: number;

  /** Whether or not the hold course is a true course. */
  public isHoldCourseTrue: boolean;

  /** The direction to turn in the hold. */
  public turnDirection: HoldTurnDirection;

  /** The amount of time for each hold leg, in seconds. */
  public legTime: number;

  /** The amount of distance for each hold leg, in seconds. */
  public legDistance: number;

  /** The speed at which to fly the hold, in knots indicated airspeed. */
  public speed: number;

  /** The type of hold speed restriction. */
  public holdSpeedType: HoldSpeedType;

  /** The time to expect further clearance. */
  public efcTime: Date;

  /** The current hold state. */
  public state: HoldState;

  /** The hold entry type. */
  public entryType: HoldEntry;

  /** The recorded wind direction. */
  public windDirection: number;

  /** The recorded wind speed. */
  public windSpeed: number;

  /**
   * Creates a default set of hold details.
   * @param course The course to create the hold details for.
   * @param courseTowardsHoldFix The course to the hold fix.
   * @returns A new set of hold details.
   */
  static createDefault(course: number, courseTowardsHoldFix: number): HoldDetails {
    const details = new HoldDetails();

    details.holdCourse = course;
    details.holdSpeedType = HoldSpeedType.FAA;
    details.legTime = 90;
    details.speed = Simplane.getGroundSpeed();

    details.windDirection = 0;
    details.windSpeed = 0;

    details.legDistance = details.legTime * (details.speed / 3600);
    details.turnDirection = HoldTurnDirection.Right;

    details.state = HoldState.None;
    details.entryType = HoldDetails.calculateEntryType(course, courseTowardsHoldFix);

    return details;
  }

  /**
   * Calculates a hold entry type given the hold course and current
   * inbound course. See FMS guide page 14-21.
   * @param holdCourse The course that the hold will be flown with.
   * @param inboundCourse The course that is being flown towards the hold point.
   * @returns The hold entry type for a given set of courses.
   */
  static calculateEntryType(holdCourse: number, inboundCourse: number): HoldEntry {
    const courseDiff = Avionics.Utils.angleDiff(inboundCourse, holdCourse);
    if (courseDiff >= -130 && courseDiff <= 70) {
      return HoldEntry.Direct;
    }
    else if (courseDiff < -130 || courseDiff > 175) {
      return HoldEntry.Teardrop;
    }
    else {
      return HoldEntry.Parallel;
    }
  }
}

/** The type of hold speed restriction. */
export enum HoldSpeedType {
  /** Use FAA hold speed rules. */
  FAA,

  /** Use ICAO hold speed rules. */
  ICAO
}

/** The direction of the hold turn. */
export enum HoldTurnDirection {
  /** Use a right hand turn. */
  Right,

  /** Use a left hand turn. */
  Left
}

/** The current state of the hold. */
export enum HoldState {
  /** The hold is not active. */
  None,

  /** The hold is currently being entered. */
  Entering,

  /** The hold is active. */
  Holding,

  /** The hold is being exited. */
  Exiting
}

/** The hold entry type. */
export enum HoldEntry {
  /** Direct hold entry. */
  Direct,

  /** Teardrop hold entry. */
  Teardrop,

  /** Parallel hold entry. */
  Parallel
}