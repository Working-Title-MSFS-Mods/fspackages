
/** Generates fix names based on the ARINC default naming scheme. */
export class FixNamingScheme {
  private static alphabet: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
    'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  
  /**
   * Generates a fix name for a course to distance type fix.
   * @param course The course that will be flown.
   * @param distance The distance along the course or from the reference fix.
   * @returns The generated fix name.
   */
  public static courseToDistance(course: number, distance: number): string {
    const roundedDistance = Math.round(distance);
    const distanceAlpha = distance > 26 ? 'Z' : this.alphabet[roundedDistance];

    return `D${course.toFixed(0).padStart(3, '0')}${distanceAlpha}`;
  }

  /**
   * Generates a fix name for a course turn to intercept type fix.
   * @param course The course that will be turned to.
   * @returns The generated fix name.
   */
  public static courseToIntercept(course: number): string {
    return `I${course.toFixed(0).padStart(3, '0')}`;
  }
}