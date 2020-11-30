/** A class that averages an input to produce a smoothed output over time. */
export class AveragingFilter {

  /** The previous value of the filter. */
  private previousValue: number = 0;

  /**
   * Creates an instance of an AveragingFilter.
   * @param samples The number of samples in a 60hz system to average.
   */
  constructor(private numSamples: number) { }

  /**
   * Gets an averaged output from the input samples.
   * @param deltaTime The time since the last observed sample.
   * @param input The next input sample to add to the average.
   * @returns The sampled average.
   */
  public getOutput(deltaTime: number, input: number): number {
    this.previousValue += (input - this.previousValue) / (this.numSamples / (deltaTime / 15));
    return this.previousValue;
  }
}