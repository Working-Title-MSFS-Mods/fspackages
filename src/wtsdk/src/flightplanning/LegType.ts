/**
 * ARINC 424 Leg Types
 */
export enum LegType {
  /**
   * A non-AIRAC discontinuity leg type.
   */
  DIS = 0,

  /**
   * An arc-to-fix leg. This indicates a DME arc leg to a specified fix.
   */
  AF = 1,

  /** 
   * A course-to-altitude leg.
   */
  CA = 2,

  /**
   * A course-to-DME-distance leg. This leg is flown on a wind corrected course
   * to a specific DME distance from another fix.
   */
  CD = 3,

  /**
   * A course-to-fix leg.
   */
  CF = 4,

  /**
   * A course-to-intercept leg.
   */
  CI = 5,

  /**
   * A course-to-radial intercept leg.
   */
  CR = 6,

   /** 
   * A direct-to-fix leg, from an unspecified starting position.
   */
  DF = 7,

  /**
   * A fix-to-altitude leg. A FA leg is flown on a track from a fix to a
   * specified altitude.
   */
  FA = 8,

  /**
   * A fix-to-distance leg. This leg is flown on a track from a fix to a
   * specific distance from the fix.
   */
  FC = 9,

  /**
   * A fix to DME distance leg. This leg is flown on a track from a fix to
   * a specific DME distance from another fix.
   */
  FD = 10,

  /**
   * A course-to-manual-termination leg.
   */
  CM = 11,

  /**
   * A hold-to-altitude leg. The hold is flown until a specified altitude is reached.
   */
  HA = 12,

  /**
   * A hold-to-fix leg. This indicates one time around the hold circuit and 
   * then an exit.
   */
  HF = 13,

  /**
   * A hold-to-manual-termination leg.
   */
  HM = 14,

  /**
   * Initial procedure fix.
   */
  IF = 15,

  /**
   * A procedure turn leg.
   */
  PT = 16,

  /**
   * A radius-to-fix leg, with endpoint fixes, a center fix, and a radius.
   */
  RF = 17,

  /**
   * A track-to-fix leg, from the previous fix to the terminator.
   */
  TF = 18,

  /**
   * A heading-to-altitude leg.
   */
  VA = 19,

  /**
   * A heading-to-DME-distance leg.
   */
  VD = 20,

  /**
   * A heading-to-intercept leg.
   */
  VI = 21,

  /**
   * A heading-to-manual-termination leg.
   */
  VM = 22,

  /**
   * A heading-to-radial intercept leg.
   */
  VR = 23,
}