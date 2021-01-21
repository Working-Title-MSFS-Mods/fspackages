import { Message, MessageLevel } from "./Message";

export abstract class MessageController<T extends Message> {
  /** Holds the active messages for this controller instance */
  protected _messages: Map<string, T> = new Map<string, T>();

  protected _currentMsg: T;

  constructor(private _nm: new (content: string, level: MessageLevel, checkHandler: () => boolean) => T) { }

  /** Returns a boolean indicating if there is a message */
  public hasMsg(): boolean {
    const hasMsg = this._messages.size > 0
    if (!hasMsg) {
      this._currentMsg = undefined;
    }

    return hasMsg;
  }

  /** Gets the string content of the first message */
  public abstract getMsg(): string;

  public getAllMsgs(): Map<string, T> {
    return this._messages;
  }

  /**
   * Adds a new message definition to the controller
   * @param content The text content of the message
   * @param level The message level
   * @param checkHandler The update check handler that will return true when the message is to be displayed
   */
  public post(content: string, level: MessageLevel, checkHandler: () => boolean = () => false): T {
    const newMsg = new this._nm(content, level, checkHandler);
    if (!this._messages.has(content)) {
      this._messages.set(content, newMsg)
    }
    return newMsg;
  }

  /** Checks the message conditions and updates the list of messages */
  public update(): void {
    this._messages.forEach((v, k) => {
      if (v.update() === true) {
        this._messages.delete(k);
      }
    });
    // TODO: sort messages by level, timestamp
  }
}
