import { MessageController } from "../../messages/MessageController";
import { CJ4_PFD_Message } from "./CJ4_PFD_Message";

/**
 * The message controller for the PFD top message
 */
export class CJ4_PFD_TopMessageController extends MessageController<CJ4_PFD_Message> {

  constructor() {
    super(CJ4_PFD_Message);
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