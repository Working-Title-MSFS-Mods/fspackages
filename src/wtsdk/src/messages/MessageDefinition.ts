export class MessageDefinition {

  public get text(): string {
    return this._text;
  }

  public get target(): MESSAGE_TARGET {
    return this._target;
  }

  constructor(private _text: string, private _target: MESSAGE_TARGET) { }
}

/** An enumeration for CJ4 message target displays */
export enum MESSAGE_TARGET {
  FMC,
  PFD_TOP,
  PFD_BOT,
  MAP_MID,
  MFD_TOP
}

/**
 * Enumeration of message levels
 */
export enum MESSAGE_LEVEL {
  White = 0, // white
  Yellow = 1 // yellow
}