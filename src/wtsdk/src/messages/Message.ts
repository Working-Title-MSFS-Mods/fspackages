import { MessageDefinition, MessageLevel } from "./MessageDefinition";

export class Message {
  private _timestamp: number = new Date().valueOf();

  /** Gets the unix timestamp for when the message was created */
  public get timestamp(): number {
    return this._timestamp;
  }

  /** Gets the ID of the message definition */
  public get msgDefId(): number {
    return this._msg.ID;
  }

  /** Gets the {@link MessageLevel} of severity of the message */
  public get level(): MessageLevel {
    return this._msg.Level;
  }

  /** Gets the text content of this message */
  public get content(): string {
    return this._msg.Content;
  }

  constructor(private _msg: MessageDefinition) { }

  /** Calls the message updatehandler and returns a boolean indicating if the condition still exists */
  public update(): boolean {
    return this._msg.updateHandler();
  }

  /** Calls the message blinkhandler and returns a boolean indicating if the msg should blink */
  public updateBlink(): boolean {
    return this._msg.blinkHandler();
  }

}