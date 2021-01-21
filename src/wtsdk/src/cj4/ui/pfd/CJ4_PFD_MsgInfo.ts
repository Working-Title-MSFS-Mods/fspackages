import { MessageLevel } from "../../../messages/Message";
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
      this.execMessageChecks();
      this._topMsgController.update();
      this._botLeftMsgController.update();
      this._botRightMsgController.update();

      this.topText = this._topMsgController.getMsg();
      this.botLeftText = this._botLeftMsgController.getMsg();
      this.botRightText = this._botRightMsgController.getMsg();

      this._elapsedTime = 0;
    }
  }
  execMessageChecks() {
    // TODO will do these here for now as i see no proper location in pfd
    // TOP
    if (SimVar.GetSimVarValue('L:WT_NAV_SENSITIVITY', 'number') === 1) {
      this._topMsgController.post("TERM", MessageLevel.White, () => {
        return SimVar.GetSimVarValue('L:WT_NAV_SENSITIVITY', 'number') !== 1;
      });
    }
    if (SimVar.GetSimVarValue('L:WT_NAV_SENSITIVITY', 'number') === 2) {
      this._topMsgController.post("LPV TERM", MessageLevel.White, () => {
        return SimVar.GetSimVarValue('L:WT_NAV_SENSITIVITY', 'number') !== 2;
      });
    }
    if (SimVar.GetSimVarValue('L:WT_NAV_SENSITIVITY', 'number') === 3) {
      this._topMsgController.post("APPR", MessageLevel.White, () => {
        return SimVar.GetSimVarValue('L:WT_NAV_SENSITIVITY', 'number') !== 3;
      });
    }
    if (SimVar.GetSimVarValue('L:WT_NAV_SENSITIVITY', 'number') === 4) {
      this._topMsgController.post("LPV APPR", MessageLevel.White, () => {
        return SimVar.GetSimVarValue('L:WT_NAV_SENSITIVITY', 'number') !== 4;
      });
    }

    // BOTTOM LEFT
    if (SimVar.GetSimVarValue("L:WT_CJ4_DISPLAY_MSG", "number") === 0) {
      this._botLeftMsgController.post("MSG", MessageLevel.White, () => {
        return SimVar.GetSimVarValue("L:WT_CJ4_DISPLAY_MSG", "number") !== 0
      });
    }

    if (SimVar.GetSimVarValue("L:WT_CJ4_DISPLAY_MSG", "number") === 1) {
      this._botLeftMsgController.post("MSG", MessageLevel.Yellow, () => {
        return SimVar.GetSimVarValue("L:WT_CJ4_DISPLAY_MSG", "number") !== 1
      }, () => {
        const msg = this._botLeftMsgController.getMsgObj();
        return (Date.now() - msg.timestamp < 5000);
      });
    }

    // BOTTOM RIGHT
    const altDev = Math.abs(SimVar.GetSimVarValue("L:WT_CJ4_VPATH_ALT_DEV", "feet"));
    const pathActive = SimVar.GetSimVarValue("L:WT_VNAV_PATH_STATUS", "number") === 3;
    const todDistanceRemaining = SimVar.GetSimVarValue("L:WT_CJ4_TOD_REMAINING", "number");
    if (!pathActive && todDistanceRemaining > 0.1 && (altDev > 300 && altDev <= 1000)) {
      this._botRightMsgController.post("TOD", MessageLevel.White, () => {
        return !(!pathActive && todDistanceRemaining > 0.1 && (altDev > 300 && altDev <= 1000));
      }, () => {
        return (altDev < 500);
      });
    }

    if (SimVar.GetSimVarValue("L:WT_NAV_HOLD_INDEX", "number") > -1) {
      this._botRightMsgController.post("HOLD", MessageLevel.White, () => {
        return SimVar.GetSimVarValue("L:WT_NAV_HOLD_INDEX", "number") === -1;
      });
    }
  }
}

customElements.define("cj4-pfd-msg-info", CJ4_PFD_MsgInfo);