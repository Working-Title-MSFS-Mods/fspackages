import { MessageDefinition, MessageLevel } from "./MessageDefinition";

export class Message {
  private _instanceId: string = Math.random().toString(36).substr(2, 9);;
  private _isSeen: boolean = false;
  private _timestamp: number = new Date().valueOf();

  /** Gets the id of this message instance */
  public get instanceId(): string {
    return this._instanceId;
  }

  /** Indicates if the message is archived */
  public get isSeen(): boolean {
    return this._isSeen;
  }

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

  public get content(): string {
    return this._msg.Content;
  }

  constructor(private _msg: MessageDefinition) { }

  public setSeen() {
    this._isSeen = true;
  }

  /** Calls the message updatehandler and returns a boolean indicating if the condition still exists */
  public update() :boolean {
    return this._msg.updateHandler();
  }

}