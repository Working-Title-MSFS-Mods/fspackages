import { MessageController } from "../../../messages/MessageController";
import { MessageLevel } from "../../../messages/MessageDefinition";
import { CJ4_PFD_Message } from "./CJ4_PFD_Message";

/**
 * The message controller for the PFD bottom line
 */
export class CJ4_PFD_BotMessageController extends MessageController<CJ4_FMC, CJ4_PFD_Message> {

  constructor() {
    super(null, CJ4_PFD_Message);
  }

  protected init() {
    this.addDefinition("MSG", MessageLevel.White, () => {
      return SimVar.GetSimVarValue("L:WT_CJ4_DISPLAY_MSG", "number") === 0;
    });
    this.addDefinition("MSG", MessageLevel.Yellow, () => {
      return SimVar.GetSimVarValue("L:WT_CJ4_DISPLAY_MSG", "number") === 1;
    });
  }

  /** Gets the string content of the first message */
  public getMsg(): string {
    if (!this.hasMsg()) {
      return "";
    }

    this._currentMsg = this._messages.values().next().value;
    return `<span class="${(this._currentMsg.level == MessageLevel.Yellow ? "yellow" : "white")}">${this._currentMsg.content}</span>`;
  }
}