/** 
 * Used to define a message.
 */
export class MessageDefinition {

  public get ID(): number {
    return this._id;
  }

  public get Level(): MessageLevel {
    return this._level;
  }

  public get Content(): string {
    return this._content;
  }

  public updateHandler: () => boolean = () => false;

  constructor(private _id: number, private _level: MessageLevel, private _content: string, checkHandler: () => boolean = () => false) {
    this.updateHandler = checkHandler;
  }
}

export enum MessageLevel {
  White = 0, // white
  Yellow = 1 // yellow
}