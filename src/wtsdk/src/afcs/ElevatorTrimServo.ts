import { Avionics, SimVar } from "MSFS";
import { PidController } from "../wtsdk";

/** A servo that drives elevator trim to eliminate elevator forces. */
export class ElevatorTrimServo {

  /** The controller for moving the trim control. */
  private controller: PidController = new PidController(0.1, 0, 0, 0.05, -0.05);

  /**
   * Updates the elevator trim servo.
   * @param deltaTime The elapsed time since the previous update.
   */
  public update(deltaTime: number): void {
    const currentElevatorPosition = SimVar.GetSimVarValue('ELEVATOR POSITION', 'position');
    const currentTrimPosition = SimVar.GetSimVarValue('ELEVATOR TRIM POSITION', 'radians') * Avionics.Utils.RAD2DEG;

    const error = currentElevatorPosition;
    const output = this.controller.getOutput(deltaTime, error);

    const clampedOutput = PidController.clamp((currentTrimPosition + output), 45, -45);

    SimVar.SetSimVarValue('ELEVATOR TRIM POSITION', 'radians', clampedOutput * Avionics.Utils.DEG2RAD);
  }
}