import { MessageDefinition, MESSAGE_LEVEL, MESSAGE_TARGET } from "../messages/MessageDefinition";
import { OperatingMessage } from "../messages/OperatingMessage";

/** Enumeration for CJ4 FMS Messages */
export enum FMS_MESSAGE_ID {
  INIT_POS,
  NO_FPLN,
  FPLN_DISCO,
  CHK_SPD,
  CHK_ALT_SEL,
  HOLD,
  TOD,
  TERM,
  TERM_LPV,
  APPR,
  APPR_LPV,
  SEQ_INHIBIT,
  LOC_WILL_BE_TUNED
}

/** A class that contains the CJ4 message definitions */
export class CJ4_MessageDefinitions {
  private static _definitions: Map<FMS_MESSAGE_ID, OperatingMessage> = new Map([
    [FMS_MESSAGE_ID.INIT_POS, new OperatingMessage(
      [new MessageDefinition("INITIALIZE POSITION", MESSAGE_TARGET.FMC)], MESSAGE_LEVEL.Yellow, 50)],
    [FMS_MESSAGE_ID.NO_FPLN, new OperatingMessage(
      [new MessageDefinition("NO FLIGHT PLAN", MESSAGE_TARGET.FMC),
      new MessageDefinition("NO FLIGHT PLAN", MESSAGE_TARGET.MAP_MID)], MESSAGE_LEVEL.White, 20)],
    [FMS_MESSAGE_ID.FPLN_DISCO, new OperatingMessage(
      [new MessageDefinition("FPLN DISCONTINUITY", MESSAGE_TARGET.FMC),
      new MessageDefinition("DISCONTINUITY", MESSAGE_TARGET.MAP_MID)], MESSAGE_LEVEL.Yellow, 90)],
    [FMS_MESSAGE_ID.CHK_SPD, new OperatingMessage(
      [new MessageDefinition("CHECK SPEED", MESSAGE_TARGET.FMC),
      new MessageDefinition("SPD", MESSAGE_TARGET.PFD_BOT)], MESSAGE_LEVEL.Yellow, 80)],
    [FMS_MESSAGE_ID.CHK_ALT_SEL, new OperatingMessage(
      [new MessageDefinition("CHECK ALT SEL", MESSAGE_TARGET.FMC)], MESSAGE_LEVEL.White, 70)],
    [FMS_MESSAGE_ID.HOLD, new OperatingMessage(
      [new MessageDefinition("HOLD", MESSAGE_TARGET.PFD_BOT)], MESSAGE_LEVEL.White, 70)],
    [FMS_MESSAGE_ID.TOD, new OperatingMessage(
      [new MessageDefinition("TOD", MESSAGE_TARGET.PFD_BOT)], MESSAGE_LEVEL.White, 50)],
    [FMS_MESSAGE_ID.TERM, new OperatingMessage(
      [new MessageDefinition("TERM", MESSAGE_TARGET.PFD_TOP)], MESSAGE_LEVEL.White, 50)],
    [FMS_MESSAGE_ID.TERM_LPV, new OperatingMessage(
      [new MessageDefinition("LPV TERM", MESSAGE_TARGET.PFD_TOP)], MESSAGE_LEVEL.White, 51)],
    [FMS_MESSAGE_ID.APPR, new OperatingMessage(
      [new MessageDefinition("APPR", MESSAGE_TARGET.PFD_TOP)], MESSAGE_LEVEL.White, 52)],
    [FMS_MESSAGE_ID.APPR_LPV, new OperatingMessage(
      [new MessageDefinition("LPV APPR", MESSAGE_TARGET.PFD_TOP)], MESSAGE_LEVEL.White, 53)],
    [FMS_MESSAGE_ID.SEQ_INHIBIT, new OperatingMessage(
      [new MessageDefinition("SEQ INHB", MESSAGE_TARGET.PFD_TOP)], MESSAGE_LEVEL.White, 60)],
    [FMS_MESSAGE_ID.LOC_WILL_BE_TUNED, new OperatingMessage(
      [new MessageDefinition("LOC WILL BE TUNED", MESSAGE_TARGET.FMC)], MESSAGE_LEVEL.White, 50)],
  ]);
  
  /** Gets the message definitions */
  public static get definitions() : Map<FMS_MESSAGE_ID, OperatingMessage> {
    return this._definitions;
  }
}