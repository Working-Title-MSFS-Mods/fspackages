import { CJ4_FMC } from "WorkingTitle";

export abstract class CJ4_FMC_Page {
  private _isDirty: boolean = true;

  constructor(private _fmc: CJ4_FMC) { }

  abstract update(): void;
  abstract render(): void;
  
  invalidate(): void {
    this._isDirty = true;
    this._fmc.clearDisplay();
    this.render();
    this.bindEvents();
    this._isDirty = false;
  }
  abstract bindEvents(): void;
}