import { Avionics, SimVar } from "MSFS";
import { AveragingFilter } from "./AveragingFilter";
import { LinearServo } from "./LinearServo";
import { PidController } from "./PidController";

/** A controller for establishing a pitch rate in the AFCS. */
export class PitchRateController {

  /** The target pitch rate for the controller. */
  private targetPitchRate: number = 0;

  /** The previously observed pitch angle. */
  private previousPitchAngle: number = 0;

  /** The averaging filter to remove pitch rate noise. */
  private pitchRateFilter: AveragingFilter = new AveragingFilter(120);

  /** A filter on the elevator output. */
  private elevatorServo: LinearServo = new LinearServo('ELEVATOR POSITION', 'position', 3 / 20);
  
  /** The controller for generating a pitch rate command. */
  private controller: PidController = new PidController(.1, 0.0001, 0.01, 1, -1, 0.002, -0.002);

  /**
   * Sets the target pitch rate for the controller.
   * @param pitchRate The pitch rate to set.
   */
  public setTargetPitchRate(pitchRate: number): void {
    this.targetPitchRate = pitchRate;
  }

  /**
   * Updates the pitch rate controller.
   * @param deltaTime The time elasped since the last update.
   */
  public update(deltaTime: number): void {
    const pitchAngle = -1 * SimVar.GetSimVarValue('PLANE PITCH DEGREES', 'radians') * Avionics.Utils.RAD2DEG;

    const pitchRate = (pitchAngle - this.previousPitchAngle) / (deltaTime / 1000);
    const filteredPitchRate = this.pitchRateFilter.getOutput(deltaTime, pitchRate);

    const error = this.targetPitchRate - filteredPitchRate;
    const output = this.controller.getOutput(deltaTime, error);

    console.log(`Target pRate: ${this.targetPitchRate} | Detected rate: ${filteredPitchRate} | Output: ${output}`);

    this.elevatorServo.drive(deltaTime, output);
    this.previousPitchAngle = pitchAngle;
  }

  /** Resets the controller. */
  public reset(): void {
    this.targetPitchRate = 0;
    this.controller.reset();
  }
}