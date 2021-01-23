import { Message } from "../../messages/Message";

export class CJ4_PFD_Message extends Message {
  private _blinkCheckHandler: () => boolean;
  public get blinkCheckHandler(): () => boolean {
    return this._blinkCheckHandler;
  }
  public set blinkCheckHandler(v: () => boolean) {
    this._blinkCheckHandler = v;
  }

  /** Returns a boolean indicating if the message should blink */
  public shouldBlink(): boolean {
    return this._blinkCheckHandler();
  }

  // This is used for transporting the info to PFD, didnt want a new poco for it
  private _isBlinking: boolean;
  public get isBlinking(): boolean {
    return this._isBlinking;
  }
  public set isBlinking(v: boolean) {
    this._isBlinking = v;
  }

}