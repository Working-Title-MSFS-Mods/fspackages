import { Avionics, SimVar } from "MSFS";
import { AveragingFilter } from "../wtsdk";
import { LinearServo } from "./LinearServo";
import { PidController } from "./PidController";

/** A controller for establishing a roll rate in the AFCS. */
export class RollRateController {

  /** The target roll rate for the controller. */
  private targetRollRate: number = 0;

  /** The servo that drives the aileron position. */
  private aileronServo: LinearServo = new LinearServo('AILERON POSITION', 'position', 6 / 20);

  /** A filter for reducing noise in the roll rate measurement. */
  private rollRateFilter: AveragingFilter = new AveragingFilter(10);

  /** The controller for generating a roll rate command. */
  private controller: PidController = new PidController(1 / 45, 0.01, 0.05, 1, -1, 0.1, -0.1);

  /** The previously observed bank angle. */
  private previousBankAngle: number;

  /**
   * Creates an instance of a RollRateController.
   * @param rateScalar A scalar that defines a conversion between aileron position and roll rate.
   */
  constructor(private rateScalar: number = .01) {}

  /**
   * Sets the target roll rate for the controller.
   * @param rollRate The roll rate to set.
   */
  public setTargetRollRate(rollRate: number): void {
    this.targetRollRate = rollRate;
  }

  /**
   * Updates the roll controller.
   * @param deltaTime The time elasped since the last update.
   */
  public update(deltaTime: number): void {
    const bankAngle = -1 * SimVar.GetSimVarValue('PLANE BANK DEGREES', 'radians') * Avionics.Utils.RAD2DEG;
    if (this.previousBankAngle === undefined) {
      this.previousBankAngle = bankAngle;
    }

    const rollRate = (bankAngle - this.previousBankAngle) / (deltaTime / 1000);
    const filteredRollRate = this.rollRateFilter.getOutput(deltaTime, rollRate);

    const error = this.targetRollRate - filteredRollRate;
    const output = this.controller.getOutput(deltaTime, error);

    this.aileronServo.drive(deltaTime, output);
    this.previousBankAngle = bankAngle;
  }

  /** Resets the controller. */
  public reset(): void {
    this.targetRollRate = 0;
  }
}