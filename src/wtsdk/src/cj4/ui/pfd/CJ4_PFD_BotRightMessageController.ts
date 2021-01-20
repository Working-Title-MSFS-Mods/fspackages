import { MessageController } from "../../../messages/MessageController";
import { MessageLevel } from "../../../messages/MessageDefinition";
import { CJ4_PFD_Message } from "./CJ4_PFD_Message";

/**
 * The message controller for the right PFD bottom line
 */
export class CJ4_PFD_BotRightMessageController extends MessageController<CJ4_FMC, CJ4_PFD_Message> {

  constructor() {
    super(null, CJ4_PFD_Message);
  }

  protected init() {
    this.addDefinition("TOD", MessageLevel.White, () => {
      const pathActive = SimVar.GetSimVarValue("L:WT_VNAV_PATH_STATUS", "number") === 3;
      const todDistanceRemaining = SimVar.GetSimVarValue("L:WT_CJ4_TOD_REMAINING", "number");
      return (!pathActive && todDistanceRemaining > 0.1)
    }, () => {
      const altDev = Math.abs(SimVar.GetSimVarValue("L:WT_CJ4_VPATH_ALT_DEV", "feet"));
      return (altDev < 400);
    });
    this.addDefinition("HOLD", MessageLevel.White, () => {
      return SimVar.GetSimVarValue("L:WT_NAV_HOLD_INDEX", "number") > -1;
    });
  }

  /** Gets the string content of the first message */
  public getMsg(): string {
    if (!this.hasMsg()) {
      return "";
    }

    // get first message
    this._currentMsg = this._messages.values().next().value;
    return `<span class="${(this._currentMsg.level === MessageLevel.Yellow ? "yellow" : "white")} ${(this._currentMsg.shouldBlink() === true) ? "blinking" : ""}">${this._currentMsg.content}</span>`;
  }
}