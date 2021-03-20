import { MESSAGE_LEVEL } from "../../messages/MessageDefinition";
import { CJ4_PFD_MessagePacket } from "./CJ4_PFD_MessagePacket";
import { CJ4_PFD_MessageReceiver } from "./CJ4_PFD_MessageReceiver";

export class CJ4_PFD_MsgInfo extends HTMLElement {
  private _botLeftElement: Element;
  private _botRightElement: Element;
  private _topElement: Element;

  // update rate control
  private readonly UPDATE_RATE: number = 500;
  private _elapsedTime: number = 0;

  private _fmcMsgTimestamp: number = -1;
  private _lastFmcMsgLevel: number = -1;

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
  }

  connectedCallback(): void {
    this._topElement = this.querySelector('#PFDMessageTop');
    this._botLeftElement = this.querySelector('#PFDMessageBotLeft');
    this._botRightElement = this.querySelector('#PFDMessageBotRight');
  }

  /** Update function called by the display */
  update(_dTime: number): void {
    this._elapsedTime += _dTime;
    if (this._elapsedTime >= this.UPDATE_RATE) {
      const msgsJson = window.localStorage.getItem(CJ4_PFD_MessageReceiver.PFD_MSGS_KEY);
      if (msgsJson !== "") {
        // read msg packet
        const msgs: CJ4_PFD_MessagePacket = JSON.parse(msgsJson);
        if (msgs === null) {
          return;
        }
        // get bottom msg
        if (msgs.bot) {
          const msg: any = JSON.parse(msgs.bot); // For some reason can't access properties when parsing back to CJ4_PFD_Message :(
          this.botRightText = this.getMsgString(msg);
        } else if (this._botRightText !== "") {
          this.botRightText = "";
        }

        // get top msg
        if (msgs.top) {
          const msg: any = JSON.parse(msgs.top);
          this.topText = this.getMsgString(msg);
        } else if (this._topText !== "") {
          this.topText = "";
        }
      } else {
        this.topText = "";
        this.botRightText = "";
      }

      // Doing the MSG manually here as it is pretty "static"
      const fmcMsgLevel = SimVar.GetSimVarValue("L:WT_CJ4_DISPLAY_MSG", "number");
      if (fmcMsgLevel !== this._lastFmcMsgLevel) {
        this._fmcMsgTimestamp = Date.now();
        this._lastFmcMsgLevel = fmcMsgLevel
      }

      if (fmcMsgLevel > -1) {
        const fakeMsg = {
          _level: fmcMsgLevel,
          _content: "MSG",
          _isBlinking: (fmcMsgLevel == MESSAGE_LEVEL.Yellow && Date.now() - this._fmcMsgTimestamp < 5000)
        }
        this.botLeftText = this.getMsgString(fakeMsg);
      } else if (fmcMsgLevel === -1) {
        this.botLeftText = "";
      }

      this._elapsedTime = 0;
    }
  }

  /**
   * Returns a formatted string for message display
   * @param msg The message object
   */
  getMsgString(msg: any): string {
    return `<span class="${(msg._level === MESSAGE_LEVEL.Yellow ? "yellow" : "white")} ${(msg._isBlinking) ? "blinking" : ""}">${msg._content}</span>`;
  }
}

customElements.define("cj4-pfd-msg-info", CJ4_PFD_MsgInfo);