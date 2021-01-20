/** 
 * Used to define a message.
 */
export class MessageDefinition {

  private _id: number;

  /**
   * Gets the unique message definition id
   */
  public get ID(): number {
    return this._id;
  }
/**
 * Gets the message level
 */
  public get Level(): MessageLevel {
    return this._level;
  }

  /**
   * Gets the content of the message
   */
  public get Content(): string {
    return this._content;
  }

  /**
   * The updateHandler runs on every update of the message controller and should return true if the message is to be shown
   */
  public updateHandler: () => boolean = () => false;

  /**
   * The blinkHandler runs on every update of the message controller and should return true if the message should blink (only to be used in PFD)
   */
  public blinkHandler: () => boolean = () => false;

  /**
   * Creates a new message definition
   * @param _content The text content of the message
   * @param _level The message level
   * @param checkHandler The update check handler that will return true when the message is to be displayed
   * @param blinkCheckHandler The check handler that will return true when the message should blink (only to be used in PFD)
   */
  constructor(private _content: string, private _level: MessageLevel, checkHandler: () => boolean = () => false, blinkCheckHandler: () => boolean = () => false) {
    this.updateHandler = checkHandler;
    this.blinkHandler = blinkCheckHandler;
    this._id = Math.floor(Math.random()*10000);
  }
}

/**
 * Enumeration of message levels
 */
export enum MessageLevel {
  White = 0, // white
  Yellow = 1 // yellow
}