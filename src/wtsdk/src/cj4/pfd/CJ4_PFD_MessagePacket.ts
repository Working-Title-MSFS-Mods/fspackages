import { CJ4_PFD_Message } from "./CJ4_PFD_Message";

/** A poco to send messages via localstorage to the PFD */
export interface CJ4_PFD_MessagePacket {
  top: string;
  bot: string;
  map: string;
}