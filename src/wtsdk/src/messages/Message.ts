export class Message {
  private _timestamp: number = new Date().valueOf();
  private _id: number = Math.floor(Math.random() * 10000);

  /** Gets the unix timestamp for when the message was created */
  public get timestamp(): number {
    return this._timestamp;
  }

  /** Gets the ID of the message definition */
  public get Id(): number {
    return this._id;
  }

  /** Gets the {@link MessageLevel} of severity of the message */
  public get level(): MessageLevel {
    return this._level;
  }

  /** Gets the text content of this message */
  public get content(): string {
    return this._content;
  }

  /**
   * Constructs a new instance of Message
   * @param _content The message text
   * @param _level The {@link MessageLevel} of this message
   * @param _exitConditionHandler The condition that should return true if the message should vanish
   */
  constructor(private _content: string, private _level: MessageLevel, private _exitConditionHandler: () => boolean = () => false) { }

  /** Calls the message updatehandler and returns a boolean indicating if the condition still exists */
  public update(): boolean {
    return this._exitConditionHandler();
  }
}

/**
 * Enumeration of message levels
 */
export enum MessageLevel {
  White = 0, // white
  Yellow = 1 // yellow
}