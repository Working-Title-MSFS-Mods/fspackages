import { Message } from "./Message";
import { MessageDefinition, MessageLevel } from "./MessageDefinition";

export abstract class MessageController<I, T extends Message> {
  /** Holds the active messages for this controller instance */
  protected _messages: Map<number, T> = new Map<number, T>();
  /** Holds the message definitions for this controller instance */
  protected _messageDefs: Map<number, MessageDefinition> = new Map<number, MessageDefinition>();

  protected _currentMsg: T;

  constructor(protected _instrument: I, private _nm: new (nmd: MessageDefinition) => T) {
    this.init();
  }

  /** Initializes the controller and message definitions */
  protected abstract init(): void;

  /** Returns a boolean indicating if there is a message */
  public hasMsg(): boolean {
    const hasMsg = this._messages.size > 0
    if (!hasMsg) {
      this._currentMsg = undefined;
    }

    return hasMsg;
  }

  /** Gets the string content of the first message */
  public getMsg(): string {
    if (!this.hasMsg()) {
      return "";
    }

    this._currentMsg = this._messages.values().next().value;
    return this._currentMsg.content + "[" + (this._currentMsg.level == MessageLevel.Yellow ? "yellow" : "white") + "]";
  }

  public getAllMsgs() : Map<number, T>{
    return this._messages;
  }

  private createMsg(def: MessageDefinition) {
    return new this._nm(def);
  }

  /**
   * Adds a new message definition to the controller
   * @param content The text content of the message
   * @param level The message level
   * @param checkHandler The update check handler that will return true when the message is to be displayed
   * @param blinkCheckHandler The check handler that will return true when the message should blink (only to be used in PFD)
   */
  public addDefinition(content: string, level: MessageLevel, checkHandler: () => boolean = () => false, blinkCheckHandler: () => boolean = () => false) {
    const newDef = new MessageDefinition(content, level, checkHandler, blinkCheckHandler);
    this._messageDefs.set(newDef.ID, newDef);
  }

  /** Checks the message conditions and updates the list of messages */
  public update() {
    this._messageDefs.forEach((v) => {
      if (this._messages.has(v.ID) == false && v.updateHandler() === true) {
        this._messages.set(v.ID, this.createMsg(v));
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
