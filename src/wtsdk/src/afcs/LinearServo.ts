import { SimVar } from "MSFS";

/** A class that linearly drives a SimVar value towards a given set point. */
export class LinearServo {

  /**
   * Creates an instance of a LinearServo.
   * @param simvar The SimVar to drive.
   * @param unit The units of the SimVar.
   * @param rate The rate, in units per second, to drive the servo.
   */
  constructor(private simvar: string, private unit: string, private rate: number) {}

  /**
   * Drives the servo towards the set point.
   * @param deltaTime The elapsed time since the last update.
   * @param setValue The value to drive towards.
   */
  public drive(deltaTime: number, setValue: number) {
    const currentValue = SimVar.GetSimVarValue(this.simvar, this.unit);
    const deltaValue = setValue - currentValue;

    const maximumDrive = this.rate * (deltaTime / 1000);
    const output = Math.abs(deltaValue) > maximumDrive
      ? currentValue + (Math.sign(deltaValue) * maximumDrive)
      : setValue;
    
    SimVar.SetSimVarValue(this.simvar, this.unit, output);
  }
}