import { Avionics, SimVar } from "MSFS";
import { AveragingFilter, PidController, PitchAngleController } from "../wtsdk";

/** A controller for issuing pitch commands based on desired vertical speed. */
export class VerticalSpeedController {

  /** The controller for generating pitch commands. */
  private controller: PidController = new PidController(0.001, 0.02, 5, 5, -5, 0.1, -0.1);

  /** The target vertical speed. */
  private targetVerticalSpeed: number = 0;

  /** The target pitch for a given vertical speed. */
  private targetPitch: number = 0;

  /** A filter for the measured vertical speed. */
  private verticalSpeedFilter: AveragingFilter = new AveragingFilter(120);

  /**
   * Creates an instance of a VerticalSpeedController.
   * @param pitchAngleController The pitch angle controller to issue pitch commands to.
   */
  constructor(private pitchAngleController: PitchAngleController) { }

  /**
   * Updates the controller.
   * @param deltaTime The elapsed time since the previous update.
   */
  public update(deltaTime: number): void {
    const angleOfAttack = SimVar.GetSimVarValue('INCIDENCE ALPHA', 'radians');
    const trueAirspeed = SimVar.GetSimVarValue('AIRSPEED TRUE', 'knots') * 101.268591;

    //const pitchAngle = Math.asin(this.targetVerticalSpeed / trueAirspeed);
    //const finalPitchAngle = (pitchAngle + angleOfAttack) * Avionics.Utils.RAD2DEG;

    const verticalSpeed = SimVar.GetSimVarValue('VELOCITY WORLD Y', 'feet per minute');
    const pitchAngle = -1 * SimVar.GetSimVarValue('PLANE PITCH DEGREES', 'radians') * Avionics.Utils.RAD2DEG;

    const filteredVerticalSpeed = this.verticalSpeedFilter.getOutput(deltaTime, verticalSpeed);
    const error = this.targetVerticalSpeed - filteredVerticalSpeed;

    let output = this.controller.getOutput(deltaTime, error);
    if (Math.abs(error) < 10) {
      output = output * .25;
    }

    this.pitchAngleController.setTargetPitchAngle(pitchAngle + output);
    this.pitchAngleController.update(deltaTime);
  }

  /**
   * Sets the target vertical speed for the controller.
   * @param target The target vertical speed to set.
   */
  public setTargetVerticalSpeed(target: number): void {
    this.targetVerticalSpeed = target;
  }

  /** Resets the controller. */
  public reset(): void {
    this.targetVerticalSpeed = 0;
    this.controller.reset();
    this.pitchAngleController.reset();
  }
}