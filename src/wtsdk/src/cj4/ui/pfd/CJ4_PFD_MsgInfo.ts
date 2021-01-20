import { CJ4_PFD_BotLeftMessageController } from "./CJ4_PFD_BotLeftMessageController";
import { CJ4_PFD_BotRightMessageController } from "./CJ4_PFD_BotRightMessageController";
import { CJ4_PFD_TopMessageController } from "./CJ4_PFD_TopMessageController";

export class CJ4_PFD_MsgInfo extends HTMLElement {
  private _botLeftElement: Element;
  private _botRightElement: Element;
  private _topElement: Element;

  private readonly _topMsgController: CJ4_PFD_TopMessageController;
  private readonly _botLeftMsgController: CJ4_PFD_BotLeftMessageController;
  private readonly _botRightMsgController: CJ4_PFD_BotRightMessageController;

  // update rate control
  private readonly UPDATE_RATE: number = 500;
  private _elapsedTime: number = 0;

  private _botLeftText: string;
  private set botLeftText(v: string) {
    if (v !== this._botLeftText) {
      this._botLeftElement.innerHTML = v + "&nbsp;";
      this._botLeftText = v;
    }
  }

  private _botRightText: string;
  private set botRightText(v: string) {
    if (v !== this._botRightText) {
      this._botRightElement.innerHTML = v;
      this._botRightText = v;
    }
  }

  private _topText: string;
  private set topText(v: string) {
    if (v !== this._topText) {
      this._topElement.innerHTML = v;
      this._topText = v;
    }
  }

  constructor() {
    super();
    this._topMsgController = new CJ4_PFD_TopMessageController();
    this._botLeftMsgController = new CJ4_PFD_BotLeftMessageController();
    this._botRightMsgController = new CJ4_PFD_BotRightMessageController();
  }

  connectedCallback() {
    this._topElement = this.querySelector('#PFDMessageTop');
    this._botLeftElement = this.querySelector('#PFDMessageBotLeft');
    this._botRightElement = this.querySelector('#PFDMessageBotRight');
  }

  update(_dTime) {
    this._elapsedTime += _dTime;
    if (this._elapsedTime >= this.UPDATE_RATE) {
      this._topMsgController.update();
      this._botLeftMsgController.update();
      this._botRightMsgController.update();

      this.topText = this._topMsgController.getMsg();
      this.botLeftText = this._botLeftMsgController.getMsg();
      this.botRightText = this._botRightMsgController.getMsg();

      this._elapsedTime = 0;
    }
  }
}

customElements.define("cj4-pfd-msg-info", CJ4_PFD_MsgInfo);