import { IMessageReceiver } from "../../messages/IMessageReceiver";
import { Message } from "../../messages/Message";
import { MESSAGE_LEVEL, MESSAGE_TARGET } from "../../messages/MessageDefinition";
import { FMS_MESSAGE_ID } from "../CJ4_MessageDefinitions";

/**
 * The receiver for messages shown in the FMC
 */

export class CJ4_FMC_MessageReceiver implements IMessageReceiver {
  private _activeMsgs: Map<FMS_MESSAGE_ID, Message> = new Map<FMS_MESSAGE_ID, Message>();

  process(id: FMS_MESSAGE_ID, text: string, level: MESSAGE_LEVEL, weight: number, target: MESSAGE_TARGET): void {
    if (!this._activeMsgs.has(id)) {
      this._activeMsgs.set(id, new Message(text, level, weight, target))
    }
  }

  clear(id: FMS_MESSAGE_ID): void {
    this._activeMsgs.delete(id);
  }

  /** Returns a boolean indicating if there are active messages */
  public hasMsg(): boolean {
    return this._activeMsgs.size > 0;
  }

  /** Returns the string content of the highest priority message */
  public getMsgText(): string {
    if (!this.hasMsg()) {
      SimVar.SetSimVarValue("L:WT_CJ4_DISPLAY_MSG", "number", -1)
      return "";
    }

    // find highest priority message
    let msgToShow: Message;
    this._activeMsgs.forEach((v, k) => {
      if (msgToShow === undefined) {
        msgToShow = v;
      } else {
        if ((v.level > msgToShow.level) || (v.level === msgToShow.level && v.weight > msgToShow.weight)) {
          msgToShow = v;
        }
      }
    });
    SimVar.SetSimVarValue("L:WT_CJ4_DISPLAY_MSG", "number", msgToShow.level);
    return msgToShow.content + "[" + (msgToShow.level == MESSAGE_LEVEL.Yellow ? "yellow" : "white") + "]";
  }

  /** Returns all active messages */
  public getActiveMsgs(): Message[] {
    return Array.from(this._activeMsgs.values())
  }
} 