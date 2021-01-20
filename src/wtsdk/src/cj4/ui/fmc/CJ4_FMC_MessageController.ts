import { MessageController } from "../../../messages/MessageController";
import { MessageLevel } from "../../../messages/MessageDefinition";
import { Message } from "../../../messages/Message";

/**
 * The message controller for the FMC
 */
export class CJ4_FMC_MessageController extends MessageController<CJ4_FMC, Message> {

  constructor(protected _instrument: CJ4_FMC) {
    super(_instrument, Message);
  }

  protected init() {
    this.addDefinition("INITIALIZE POSITION", MessageLevel.Yellow, () => {
      return this._instrument.lastPos === "";
    });
    this.addDefinition("NO FLIGHT PLAN", MessageLevel.White, () => {
      return Simplane.getNextWaypointName() === "";
    });
    this.addDefinition("FPLN DISCONTINUITY", MessageLevel.Yellow, () => {
      return SimVar.GetSimVarValue("L:WT_CJ4_IN_DISCONTINUITY", "number") === 1;
    });

    this.addDefinition("CHECK ALT SEL", MessageLevel.White, () => {
      // TODO this is missing some conditions, talk to chris
      const approachingTodDistance = 0.0125 * Math.round(Simplane.getGroundSpeed());
      const distanceToTod = SimVar.GetSimVarValue("L:WT_CJ4_TOD_REMAINING", "number");
      return (distanceToTod < approachingTodDistance && distanceToTod > 0);
    });

    // ADD FAKES FOR TESTING
    // for (let i = 0; i < 10; i++) {
    //   this.addDefinition("Test this " + i, MessageLevel.White, () => {
    //     return (Date.now()/1000) % (Math.random()*10) > 2;
    //   });   
    // }  
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
