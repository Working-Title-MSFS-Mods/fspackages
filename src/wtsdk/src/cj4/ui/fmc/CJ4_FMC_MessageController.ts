import { MessageController } from "../../../messages/MessageController";
import { Message, MessageLevel } from "../../../messages/Message";

/**
 * The message controller for the FMC
 */
export class CJ4_FMC_MessageController extends MessageController<Message> {

  private static _instance: CJ4_FMC_MessageController;

  private constructor() {
    super(Message);
  }

  public static getInstance(): CJ4_FMC_MessageController {
    if (CJ4_FMC_MessageController._instance === undefined) {
      CJ4_FMC_MessageController._instance = new CJ4_FMC_MessageController()
    }

    return CJ4_FMC_MessageController._instance;
  }

  /** Gets the string content of the first message */
  public getMsg(): string {
    if (!this.hasMsg()) {
      return "";
    }

    this._currentMsg = this._messages.values().next().value;
    return this._currentMsg.content + "[" + (this._currentMsg.level == MessageLevel.Yellow ? "yellow" : "white") + "]";
  }

  public update() {
    super.update();
    if (!this.hasMsg()) {
      SimVar.SetSimVarValue("L:WT_CJ4_DISPLAY_MSG", "number", -1);
    } else {
      if (this._currentMsg) {
        SimVar.SetSimVarValue("L:WT_CJ4_DISPLAY_MSG", "number", this._currentMsg.level);
      }
    }
  }
}
