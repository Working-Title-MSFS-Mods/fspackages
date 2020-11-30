import { Avionics, SimVar } from "MSFS";
import { PidController } from "./PidController";
import { RollRateController } from "./RollRateController";

/** A controller for controlling the bank angle of the aircraft. */
export class BankAngleController {

  /** The current target bank angle. */
  private targetBankAngle: number = 0;

  /** The controller for generating a roll rate command. */
  private controller: PidController = new PidController(1, 0.01, 0.01, 12.5, -12.5, 0.1, -0.1);

  /**
   * Creates an instance of a BankAngleController.
   * @param rollRateController The roll rate controller to use.
   */
  constructor(private rollRateController: RollRateController) {}

  /**
   * Sets the target bank angle of the controller.
   * @param bankAngle The bank angle to set.
   */
  public setTargetBankAngle(bankAngle: number): void {
    this.targetBankAngle = bankAngle;
  }

  /**
   * Updates the bank angle controller.
   * @param deltaTime The elapsed time since the last update.
   */
  public update(deltaTime: number): void {
    const bankAngle = -1 * SimVar.GetSimVarValue('PLANE BANK DEGREES', 'radians') * Avionics.Utils.RAD2DEG;
    const error = this.targetBankAngle - bankAngle;

    const output = this.controller.getOutput(deltaTime, error);
    this.rollRateController.setTargetRollRate(output);
    this.rollRateController.update(deltaTime);
  }

  /** Resets the controller. */
  public reset(): void {
    this.targetBankAngle = 0;
    this.controller.reset();
    this.rollRateController.reset();
  }
}