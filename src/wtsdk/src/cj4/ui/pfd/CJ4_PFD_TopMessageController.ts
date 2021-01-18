import { MessageController } from "../../../messages/MessageController";
import { MessageDefinition, MessageLevel } from "../../../messages/MessageDefinition";
import { CJ4_PFD_Message } from "./CJ4_PFD_Message";

export class CJ4_PFD_TopMessageController extends MessageController<CJ4_FMC, CJ4_PFD_Message> {

  constructor() {
    super(null, CJ4_PFD_Message);
  }

  protected init() {
    this._messageDefs.set(1, new MessageDefinition(1, MessageLevel.White, "TERM", () => {
      return SimVar.GetSimVarValue('L:WT_NAV_SENSITIVITY', 'number') === 1;
    }));
    this._messageDefs.set(2, new MessageDefinition(2, MessageLevel.White, "LPV TERM", () => {
      return SimVar.GetSimVarValue('L:WT_NAV_SENSITIVITY', 'number') === 2;
    }));
    this._messageDefs.set(3, new MessageDefinition(3, MessageLevel.White, "APPR", () => {
      return SimVar.GetSimVarValue('L:WT_NAV_SENSITIVITY', 'number') === 3;
    }));
    this._messageDefs.set(4, new MessageDefinition(4, MessageLevel.White, "LPV APPR", () => {
      return SimVar.GetSimVarValue('L:WT_NAV_SENSITIVITY', 'number') === 4;
    }));
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