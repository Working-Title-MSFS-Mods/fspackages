import { Message } from "../../../messages/Message";

export class CJ4_PFD_Message extends Message {
  private _blinkCheckHandler: () => boolean;
  public get blinkCheckHandler(): () => boolean {
    return this._blinkCheckHandler;
  }
  public set blinkCheckHandler(v: () => boolean) {
    this._blinkCheckHandler = v;
  }

  public shouldBlink(): boolean {
    return this._blinkCheckHandler();
  }
}