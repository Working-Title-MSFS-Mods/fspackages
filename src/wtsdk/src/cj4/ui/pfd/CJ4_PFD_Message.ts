import { Message } from "../../../messages/Message";

export class CJ4_PFD_Message extends Message {
  
  private _isBlinking : boolean;
  public get isBlinking() : boolean {
    return this._isBlinking;
  }
  public set isBlinking(v : boolean) {
    this._isBlinking = v;
  }  
}