import { CJ4_FMC_MessageController } from "cj4/CJ4_FMC_MessageController";
import { CJ4_FMC_Page } from "../CJ4_FMC_Page";

export class CJ4_FMC_MsgPage extends CJ4_FMC_Page {
  private _msgCtrl: CJ4_FMC_MessageController

  hasRefresh(): boolean {
    return true;
  }
  update(): void {
    this._msgCtrl.update();
    throw new Error("Method not implemented.");
  }
  render(): void {
    throw new Error("Method not implemented.");
  }
  bindEvents(): void {
    throw new Error("Method not implemented.");
  }
}