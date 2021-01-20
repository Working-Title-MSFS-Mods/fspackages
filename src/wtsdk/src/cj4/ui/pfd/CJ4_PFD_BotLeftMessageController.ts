import { MessageController } from "../../../messages/MessageController";
import { MessageLevel } from "../../../messages/MessageDefinition";
import { CJ4_PFD_Message } from "./CJ4_PFD_Message";

/**
 * The message controller for the left PFD bottom line
 */
export class CJ4_PFD_BotLeftMessageController extends MessageController<CJ4_FMC, CJ4_PFD_Message> {

  constructor() {
    super(null, CJ4_PFD_Message);
  }

  protected init() {
    this.addDefinition("MSG", MessageLevel.White, () => {
      return SimVar.GetSimVarValue("L:WT_CJ4_DISPLAY_MSG", "number") === 0;
    });
    this.addDefinition("MSG", MessageLevel.Yellow, () => {
      return SimVar.GetSimVarValue("L:WT_CJ4_DISPLAY_MSG", "number") === 1;
    }, () => {
      // this could be nicer by dropping the msg into the callback i guess
      const msg = this._messages.values().next().value as CJ4_PFD_Message;
      return (Date.now() - msg.timestamp < 5000);
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