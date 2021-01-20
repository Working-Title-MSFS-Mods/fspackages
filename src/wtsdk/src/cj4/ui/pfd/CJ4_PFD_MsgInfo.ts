import { CJ4_PFD_BotMessageController } from "./CJ4_PFD_BotMessageController";
import { CJ4_PFD_TopMessageController } from "./CJ4_PFD_TopMessageController";

export class CJ4_PFD_MsgInfo extends HTMLElement {
  private _botElement: Element;
  private _topElement: Element;

  private _topMsgController: CJ4_PFD_TopMessageController;
  private _botMsgController: CJ4_PFD_BotMessageController;


  private _botText: string;
  public set botText(v: string) {
    if (v !== this._botText) {
      this._botElement.innerHTML = v;
      this._botText = v;
    }
  }

  private _topText: string;
  public set topText(v: string) {
    if (v !== this._topText) {
      this._topElement.innerHTML = v;
      this._topText = v;
    }
  }
  
  constructor() {
    super();
    this._topMsgController = new CJ4_PFD_TopMessageController();
    this._botMsgController = new CJ4_PFD_BotMessageController();
  }

  connectedCallback() {
    this._topElement = this.querySelector('#PFDMessageTop');
    this._botElement = this.querySelector('#PFDMessageBottom');
  }

  update(_dTime) {
    this._topMsgController.update();
    this._botMsgController.update();

    this.topText = this._topMsgController.getMsg();
    this.botText = this._botMsgController.getMsg();
  }
}

customElements.define("cj4-pfd-msg-info", CJ4_PFD_MsgInfo);