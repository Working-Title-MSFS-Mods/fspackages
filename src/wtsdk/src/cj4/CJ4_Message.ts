import { MessageDefinition, MessageLevel } from "../messages/MessageDefinition";

export class CJ4_Message {
  private _instanceId: string = Math.random().toString(36).substr(2, 9);;
  private _isArchived: boolean = false;
  private _timestamp: number = new Date().valueOf();

  /** Gets the id of this message instance */
  get instanceId(): string {
    return this._instanceId;
  }

  /** Indicates if the message is archived */
  get isArchived(): boolean {
    return this._isArchived;
  }

  /** Gets the unix timestamp for when the message was created */
  get timestamp(): number {
    return this._timestamp;
  }

  /** Gets the ID of the message definition */
  get msgDefId(): number {
    return this.msg.ID;
  }

  /** Gets the {@link MessageLevel} of severity of the message */
  get level(): MessageLevel {
    return this.msg.Level;
  }

  get content(): string {
    return this.msg.Content;
  }

  constructor(private msg: MessageDefinition) { }

  public archive() {
    this._isArchived = true;
  }

}