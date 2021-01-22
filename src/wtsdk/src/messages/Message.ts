import { FMS_MESSAGE_ID } from "../cj4/CJ4_MessageDefinitions";
import { MESSAGE_LEVEL, MESSAGE_TARGET } from "./MessageDefinition";

export class Message {
  private _timestamp: number = new Date().valueOf();
  private _id: FMS_MESSAGE_ID;

  /** Gets the unix timestamp for when the message was created */
  public get timestamp(): number {
    return this._timestamp;
  }

  /** Gets the ID of the message definition */
  public get Id(): FMS_MESSAGE_ID {
    return this._id;
  }

  /** Gets the {@link MessageLevel} of severity of the message */
  public get level(): MESSAGE_LEVEL {
    return this._level;
  }

  /** Gets the message weight (priority) */
  public get weight():number {
    return this._weight;
  }

  /** Gets the message target display */
  public get target() : MESSAGE_TARGET {
    return this._target;
  }
  

  /** Gets the text content of this message */
  public get content(): string {
    return this._content;
  }

  /**
   * Constructs a new instance of Message
   * @param _content The message text
   * @param _level The {@link MessageLevel} of this message
   * @param _weight The message weight (priority)
   * @param _target The message target display
   */
  constructor(private _content: string, private _level: MESSAGE_LEVEL, private _weight: number, private _target: MESSAGE_TARGET) { }
}