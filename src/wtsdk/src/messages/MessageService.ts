import { CJ4_MessageDefinitions, FMS_MESSAGE_ID } from "../cj4/CJ4_MessageDefinitions";
import { IMessageReceiver } from "./IMessageReceiver";
import { MESSAGE_TARGET } from "./MessageDefinition";

export class MessageService {
  private _activeMsgs: Map<FMS_MESSAGE_ID, MessageConditionChecks> = new Map<FMS_MESSAGE_ID, MessageConditionChecks>();
  private _receivers: Map<MESSAGE_TARGET, IMessageReceiver> = new Map<MESSAGE_TARGET, IMessageReceiver>();

  private static _instance: MessageService;

  public static getInstance(): MessageService {
    if (MessageService._instance === undefined) {
      MessageService._instance = new MessageService()
    }

    return MessageService._instance;
  }

  private constructor() {
    // noop
  }

  /**
   * Posts messages to the targets defined in the message definition
   * @param msgkey The message identifier
   * @param exitHandler A function that returns true when the msg should not be shown anymore
   * @param blinkHandler A function that returns a boolean indicating if the message should blink
   */
  public post(msgkey: FMS_MESSAGE_ID, exitHandler: () => boolean, blinkHandler: () => boolean = () => false): void {
    if (CJ4_MessageDefinitions.definitions.has(msgkey)) {
      const opmsg = CJ4_MessageDefinitions.definitions.get(msgkey);
      opmsg.msgDefs.forEach(def => {
        if (this._receivers.has(def.target)) {
          this._receivers.get(def.target).process(msgkey, def.text, opmsg.level, opmsg.weight, def.target, blinkHandler);
        }
      });
      this._activeMsgs.set(msgkey, new MessageConditionChecks(exitHandler))
    }
  }

  /**
   * Clears a message from all targets
   * @param msgkey The message identifier
   */
  public clear(msgkey: FMS_MESSAGE_ID): void {
    if (this._activeMsgs.has(msgkey)) {
      this._activeMsgs.get(msgkey).exitHandler = () => true;
    }
  }

  /** Update function which calls the exitHandler function and clears messages that have to go */
  public update(): void {
    this._activeMsgs.forEach((v, k) => {
      if (v.exitHandler() === true) {
        const opmsg = CJ4_MessageDefinitions.definitions.get(k);
        opmsg.msgDefs.forEach(def => {
          if (this._receivers.has(def.target)) {
            this._receivers.get(def.target).clear(k);
          }
        });
        this._activeMsgs.delete(k);
      }
    });
  }

  /**
   * Registers a receiver implementation to the target display
   * @param target The target display
   * @param receiver The receiver
   */
  public registerReceiver(target: MESSAGE_TARGET, receiver: IMessageReceiver): void {
    this._receivers.set(target, receiver);
  }
}

/** Just a wrapper */
export class MessageConditionChecks {
  public get exitHandler(): () => boolean {
    return this._exitHandler;
  }

  public set exitHandler(v: () => boolean) {
    this._exitHandler = v;
  }

  constructor(private _exitHandler: () => boolean) {
  }
}