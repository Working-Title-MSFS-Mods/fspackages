import { Avionics, SimVar } from "MSFS";
import { AveragingFilter } from "../wtsdk";
import { PidController } from "./PidController";
import { PitchRateController } from "./PitchRateController";

/** A controller for controlling the pitch angle of the aircraft. */
export class PitchAngleController {

  /** The current target pitch angle. */
  private targetPitchAngle: number = 0;

  /** The controller for generating a pitch rate command. */
  private controller: PidController = new PidController(0.75, 0.005, 0.5, 7.5, -7.5, 0.02, -0.02);

  /** The averaging filter to remove input noise. */
  private pitchAngleFilter: AveragingFilter = new AveragingFilter(80);

  /**
   * Creates a new PitchAngleController.
   * @param pitchRateController The pitch rate controller to use.
   */
  constructor(private pitchRateController: PitchRateController) {}

  /**
   * Sets the target pitch angle of the controller.
   * @param pitchAngle The pitch angle to set.
   */
  public setTargetPitchAngle(pitchAngle: number): void {
    this.targetPitchAngle = pitchAngle;
  }

  /**
   * Updates the bank angle controller.
   * @param deltaTime The elapsed time since the last update.
   */
  public update(deltaTime: number): void {
    const pitchAngle = -1 * SimVar.GetSimVarValue('PLANE PITCH DEGREES', 'radians') * Avionics.Utils.RAD2DEG;
    const filteredPitchAngle = this.pitchAngleFilter.getOutput(deltaTime, pitchAngle);

    const error = this.targetPitchAngle - filteredPitchAngle;
    const output = this.controller.getOutput(deltaTime, error);

    this.pitchRateController.setTargetPitchRate(output);
    this.pitchRateController.update(deltaTime);
  }

  /** Resets the controller. */
  public reset(): void {
    this.targetPitchAngle = 0;
    this.controller.reset();
    this.pitchRateController.reset();
  }
}