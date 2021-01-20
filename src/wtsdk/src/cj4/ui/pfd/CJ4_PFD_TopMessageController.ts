import { MessageController } from "../../../messages/MessageController";
import { MessageLevel } from "../../../messages/MessageDefinition";
import { CJ4_PFD_Message } from "./CJ4_PFD_Message";

/**
 * The message controller for the PFD top message
 */
export class CJ4_PFD_TopMessageController extends MessageController<CJ4_FMC, CJ4_PFD_Message> {

  constructor() {
    super(null, CJ4_PFD_Message);
  }

  protected init() {
    this.addDefinition("TERM", MessageLevel.White, () => {
      return SimVar.GetSimVarValue('L:WT_NAV_SENSITIVITY', 'number') === 1;
    });
    this.addDefinition("LPV TERM", MessageLevel.White, () => {
      return SimVar.GetSimVarValue('L:WT_NAV_SENSITIVITY', 'number') === 2;
    });
    this.addDefinition("APPR", MessageLevel.White, () => {
      return SimVar.GetSimVarValue('L:WT_NAV_SENSITIVITY', 'number') === 3;
    });
    this.addDefinition("LPV APPR", MessageLevel.White, () => {
      return SimVar.GetSimVarValue('L:WT_NAV_SENSITIVITY', 'number') === 4;
    });
  }

  /** Gets the string content of the first message */
  public getMsg(): string {
    if (!this.hasMsg()) {
      return "";
    }

    this._currentMsg = this._messages.values().next().value;
    return `${this._currentMsg.content}`;
  }
}