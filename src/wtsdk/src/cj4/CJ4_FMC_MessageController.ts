import { Simplane } from "MSFS";
import { CJ4_FMC } from "WorkingTitle";
import { MessageDefinition, MessageLevel } from "../messages/MessageDefinition";
import { CJ4_Message } from "./CJ4_Message";

export class CJ4_FMC_MessageController {
  private _messages: Map<number, CJ4_Message> = new Map<number, CJ4_Message>();
  private _messageDefs: Map<number, MessageDefinition> = new Map<number, MessageDefinition>();

  constructor(private _fmc: CJ4_FMC) {
    this.init();
  }

  private init() {
    this._messageDefs.set(1, new MessageDefinition(1, MessageLevel.Yellow, "INITIALIZE POSITION", () => {
      return this._fmc.lastPos === "";
    }));
    this._messageDefs.set(1, new MessageDefinition(1, MessageLevel.White, "NO FLIGHT PLAN", () => {
      return Simplane.getNextWaypointName() === "";
    }));
  }

  /** Returns a boolean indicating if there is a message */
  public hasMsg(): boolean {
    return this._messages.size > 0;
  }

  /** Gets the string content of the first message */
  public getMsg(): string {
    if (!this.hasMsg()) {
      return "";
    }

    const msg: CJ4_Message = this._messages.values().next().value;
    return msg.content + "[" + (msg.level == MessageLevel.Yellow ? "yellow" : "white") + "]";
  }

  /** Checks the message conditions and updates the list of messages */
  public update() {
    this._messageDefs.forEach((v) => {
      if (this._messages.has(v.ID) == false && v.updateHandler() === true) {
        this._messages.set(v.ID, new CJ4_Message(v));
      }
    });

    this._messages.forEach((v, k) => {
      if (v.update() === false) {
        this._messages.delete(k);
      }
    });

    // TODO: sort messages by level, timestamp
  }
}