import { Message, MessageLevel } from "../../../messages/Message";
import { CJ4_FMC_MessageController } from "../CJ4_FMC_MessageController";
import { CJ4_FMC_Page } from "../CJ4_FMC_Page";

export class CJ4_FMC_MsgPage extends CJ4_FMC_Page {
  private _msgsChecksum = -1;
  private _msgs: Message[];

  private _currentPage = 0;
  private _pageCount = 1;
  private _offset = 0;

  set currentPage(value: number) {
    this._currentPage = value;
    if (this._currentPage > (this._pageCount - 1)) {
      this._currentPage = 0;
    } else if (this._currentPage < 0) {
      this._currentPage = (this._pageCount - 1);
    }

    if (this._currentPage == 0) {
      this._offset = 0;
    } else {
      this._offset = ((this._currentPage) * 6);
    }
  }

  private gotoNextPage() {
    this.currentPage = this._currentPage + 1;
    this.update(true);
  }

  private gotoPrevPage() {
    this.currentPage = this._currentPage - 1;
    this.update(true);
  }

  public hasRefresh(): boolean {
    return true;
  }

  public update(force: boolean = false): void {
    this._msgs = Array.from(CJ4_FMC_MessageController.getInstance().getAllMsgs().values()) as Message[];
    const chksum = this.getMsgsChecksum();
    if (force === true || chksum !== this._msgsChecksum) {
      this._msgsChecksum = chksum;
      this._pageCount = Math.max(1, (Math.ceil((this._msgs.length - 1) / 6)));
      this.isDirty = true;
    }
  }

  public render(): void {
    const rows = [];
    rows.push(["", `${this._currentPage + 1}/${this._pageCount}[blue]`, "MESSAGES[blue]"])
    rows.push(["-----NEW MESSAGES-------[blue s-text]"]);
    for (let i = this._offset; i < Math.min(6,this._msgs.length); i++) {
      const msg = this._msgs[i];
      rows.push([`${msg.content}[${msg.level === MessageLevel.Yellow ? "yellow" : "white"}]`]);
      rows.push([""]);
    }

    this._fmc._templateRenderer.setTemplateRaw(rows);
  }

  public bindEvents(): void {
    this._fmc.onPrevPage = () => {
      this.gotoPrevPage();
    };
    this._fmc.onNextPage = () => {
      this.gotoNextPage();
    };
  }

  /** Gets the checksum of the current active message ids */
  private getMsgsChecksum() {
    let checksum = 0;
    for (let i = this._offset; i < this._msgs.length; i++) {
      const msg = this._msgs[i];
      checksum += msg.Id;
    }
    return checksum;
  }
}