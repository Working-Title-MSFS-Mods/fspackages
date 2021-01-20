import { Message } from "../../../messages/Message";

export class CJ4_PFD_Message extends Message {
   public shouldBlink():boolean {
    return this.updateBlink();
  }
}