import { FMS_MESSAGE_ID } from "../cj4/CJ4_MessageDefinitions";
import { MESSAGE_LEVEL, MESSAGE_TARGET } from "./MessageDefinition";
export interface IMessageReceiver {
  /**
   * Processes the message and makes it available to the appropriate target display
   * @param id The message identifier
   * @param text The message content
   * @param level The message severity level
   * @param weight The message priority weight
   * @param target The message target display
   * @param blinkHandler A function returning a boolean indicating if the message should blink
   */
  process(id: FMS_MESSAGE_ID, text: string, level: MESSAGE_LEVEL, weight: number, target: MESSAGE_TARGET, blinkHandler?: () => boolean): void;
 
 /**
  * Clears a message
  * @param id The message identifier
  */
  clear(id: FMS_MESSAGE_ID): void;
}