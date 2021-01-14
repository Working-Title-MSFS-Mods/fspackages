import { SimVar } from "MSFS";
import { Message } from "./Message";
import { MessageDefinition, MessageLevel } from "./MessageDefinition";

export abstract class MessageController<I, T extends Message> {
  protected _messages: Map<number, T> = new Map<number, T>();
  protected _messageDefs: Map<number, MessageDefinition> = new Map<number, MessageDefinition>();

  protected _currentMsg: T;

  constructor(protected _instrument: I, private _nm: new (nmd: MessageDefinition) => T) {
    this.init();
  }

  /** Initializes the controller and message definitions */
  protected abstract init(): void;

  /** Returns a boolean indicating if there is a message */
  public hasMsg(): boolean {
    return this._messages.size > 0;
  }

  /** Gets the string content of the first message */
  public getMsg(): string {
    if (!this.hasMsg()) {
      this._currentMsg = undefined;
      return "";
    }

    this._currentMsg = this._messages.values().next().value;
    return this._currentMsg.content + "[" + (this._currentMsg.level == MessageLevel.Yellow ? "yellow" : "white") + "]";
  }

  /** Checks the message conditions and updates the list of messages */
  public update() {
    this._messageDefs.forEach((v) => {
      if (this._messages.has(v.ID) == false && v.updateHandler() === true) {
        this._messages.set(v.ID, new this._nm(v));
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