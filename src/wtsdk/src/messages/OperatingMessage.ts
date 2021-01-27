import { MessageDefinition, MESSAGE_LEVEL } from "./MessageDefinition";

export class OperatingMessage {

  public get msgDefs(): MessageDefinition[] {
    return this._msgDefs;
  }

  public get level(): MESSAGE_LEVEL {
    return this._level;
  }

  public get weight(): number {
    return this._weight;
  }

  constructor(private _msgDefs: MessageDefinition[], private _level: MESSAGE_LEVEL, private _weight: number) {
  }
}