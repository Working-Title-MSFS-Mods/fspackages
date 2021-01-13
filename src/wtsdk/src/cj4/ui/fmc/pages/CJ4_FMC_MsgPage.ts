import { CJ4_FMC_Page } from "../CJ4_FMC_Page";

export class CJ4_FMC_MsgPage extends CJ4_FMC_Page 
{
  hasRefresh(): boolean {
    return true;
  }
  update(): void {
    throw new Error("Method not implemented.");
  }
  render(): void {
    throw new Error("Method not implemented.");
  }
  bindEvents(): void {
    throw new Error("Method not implemented.");
  }

}