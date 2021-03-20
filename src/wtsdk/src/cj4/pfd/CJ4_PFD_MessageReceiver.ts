import { IMessageReceiver } from "../../messages/IMessageReceiver";
import { MESSAGE_LEVEL, MESSAGE_TARGET } from "../../messages/MessageDefinition";
import { FMS_MESSAGE_ID } from "../CJ4_MessageDefinitions";
import { CJ4_PFD_Message } from "./CJ4_PFD_Message";
import { CJ4_PFD_MessagePacket } from "./CJ4_PFD_MessagePacket";

export class CJ4_PFD_MessageReceiver implements IMessageReceiver {
  public static PFD_MSGS_KEY = "WT_CJ4_PFD_MESSAGES";

  private _activeMsgs: Map<FMS_MESSAGE_ID, CJ4_PFD_Message> = new Map<FMS_MESSAGE_ID, CJ4_PFD_Message>();

  constructor() {
    window.localStorage.setItem(CJ4_PFD_MessageReceiver.PFD_MSGS_KEY, "");
  }

  public process(id: FMS_MESSAGE_ID, text: string, level: MESSAGE_LEVEL, weight: number, target: MESSAGE_TARGET, blinkHandler: () => boolean = () => false): void {
    const pfdMsg = new CJ4_PFD_Message(text, level, weight, target);
    pfdMsg.blinkCheckHandler = blinkHandler;
    if (!this._activeMsgs.has(id)) {
      this._activeMsgs.set(id, pfdMsg);
    }
  }

  public clear(id: FMS_MESSAGE_ID): void {
    this._activeMsgs.delete(id);
  }

  /** Update function called by the FMS to update and send messages to the pfd */
  public update(): void {
    if (this.hasMsg()) {
      this._activeMsgs.forEach((v) => {
        v.isBlinking = v.blinkCheckHandler();
      });

      const msgArray = Array.from(this._activeMsgs.values())
      const msgPacket: CJ4_PFD_MessagePacket = {
        top: JSON.stringify(this.pickHighPriorityMsg(msgArray, MESSAGE_TARGET.PFD_TOP), ["_content", "_level", "_isBlinking"]),
        bot: JSON.stringify(this.pickHighPriorityMsg(msgArray, MESSAGE_TARGET.PFD_BOT), ["_content", "_level", "_isBlinking"]),
        map: JSON.stringify(this.pickHighPriorityMsg(msgArray, MESSAGE_TARGET.MAP_MID), ["_content", "_level"])
      };
      const msgJson = JSON.stringify(msgPacket) //, );
      window.localStorage.setItem(CJ4_PFD_MessageReceiver.PFD_MSGS_KEY, msgJson);
    } else {
      window.localStorage.setItem(CJ4_PFD_MessageReceiver.PFD_MSGS_KEY, "");
    }
  }

  /**
   * Filters messages by target and returns the one with the highes priority
   * @param msgs Array of messages
   * @param target The display target
   */
  private pickHighPriorityMsg(msgs: CJ4_PFD_Message[], target: MESSAGE_TARGET): CJ4_PFD_Message {
    const filteredArr = msgs.filter((v) => {
      return v.target === target;
    })

    // find highest priority message
    let returnMsg: CJ4_PFD_Message;
    filteredArr.forEach(v => {
      if (returnMsg === undefined) {
        returnMsg = v;
      } else {
        if ((v.level > returnMsg.level) || (v.level === returnMsg.level && v.weight > returnMsg.weight)) {
          returnMsg = v;
        }
      }
    });

    return returnMsg;
  }

  /** Returns a boolean indicating if there are active messages */
  private hasMsg(): boolean {
    return this._activeMsgs.size > 0;
  }
} 