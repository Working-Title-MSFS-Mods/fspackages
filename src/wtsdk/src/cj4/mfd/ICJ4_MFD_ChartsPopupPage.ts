export interface ICJ4_MFD_ChartsPopupPage {
  update(force?: boolean): Promise<void>;
  onEvent(evt: string): boolean;
}