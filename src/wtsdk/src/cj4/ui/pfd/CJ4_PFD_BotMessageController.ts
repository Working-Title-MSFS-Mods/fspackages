import { MessageController } from "../../../messages/MessageController";
import { MessageDefinition, MessageLevel } from "../../../messages/MessageDefinition";
import { CJ4_PFD_Message } from "./CJ4_PFD_Message";

export class CJ4_PFD_BotMessageController extends MessageController<CJ4_FMC, CJ4_PFD_Message> {

  constructor() {
    super(null, CJ4_PFD_Message);
  }

  protected init() {
    this._messageDefs.set(1, new MessageDefinition(1, MessageLevel.White, "MSG", () => {
      return SimVar.GetSimVarValue("L:WT_CJ4_DISPLAY_MSG", "number") === 0;
    }));
    this._messageDefs.set(2, new MessageDefinition(2, MessageLevel.Yellow, "MSG", () => {
      return SimVar.GetSimVarValue("L:WT_CJ4_DISPLAY_MSG", "number") === 1;
    }));
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