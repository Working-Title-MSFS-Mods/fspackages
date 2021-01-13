/** 
 * Used to define a message.
 */
export class MessageDefinition {
  constructor(public ID: number, public Level: MessageLevel, public Content: string) { }
}

export enum MessageLevel {
  Info = 0, // white
  Warning = 1 // yellow
}