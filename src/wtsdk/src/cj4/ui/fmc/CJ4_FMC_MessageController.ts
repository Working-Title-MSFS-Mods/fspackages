import { MessageController } from "../../../messages/MessageController";
import { MessageDefinition, MessageLevel } from "../../../messages/MessageDefinition";
import { Message } from "../../../messages/Message";

export class CJ4_FMC_MessageController extends MessageController<CJ4_FMC, Message> {

  constructor(protected _instrument: CJ4_FMC) {
    super(_instrument, Message);
  }

  protected init() {
    this._messageDefs.set(1, new MessageDefinition(1, MessageLevel.Yellow, "INITIALIZE POSITION", () => {
      return this._instrument.lastPos === "";
    }));
    this._messageDefs.set(2, new MessageDefinition(2, MessageLevel.White, "NO FLIGHT PLAN", () => {
      return Simplane.getNextWaypointName() === "";
    }));
    this._messageDefs.set(3, new MessageDefinition(3, MessageLevel.Yellow, "FPLN DISCONTINUITY", () => {
      return SimVar.GetSimVarValue("L:WT_CJ4_IN_DISCONTINUITY", "number") === 1;
    }));
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
