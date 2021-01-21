import { MessageLevel } from "../../../messages/Message";
import { MessageController } from "../../../messages/MessageController";
import { CJ4_PFD_Message } from "./CJ4_PFD_Message";

/**
 * The message controller for the right PFD bottom line
 */
export class CJ4_PFD_BotRightMessageController extends MessageController<CJ4_PFD_Message> {

  constructor() {
    super(CJ4_PFD_Message);
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

  public post(content: string, level: MessageLevel, checkHandler: () => boolean = () => false, blinkCheckHandler: () => boolean = () => false): CJ4_PFD_Message {
    const newMsg = super.post(content, level, checkHandler);
    newMsg.blinkCheckHandler = blinkCheckHandler;
    return newMsg;
  }
}