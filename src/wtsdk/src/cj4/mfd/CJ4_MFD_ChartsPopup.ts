import { NG_Chart } from "../../types/navigraph";
import { CHART_TYPE } from "../../utils/NavigraphChartFilter";
import { CJ4_MFD_ChartsIndex } from "./CJ4_MFD_ChartsIndex";
import { CJ4_MFD_ChartsMenu } from "./CJ4_MFD_ChartsMenu";
import { ICJ4_MFD_ChartsPopupPage } from "./ICJ4_MFD_ChartsPopupPage";

export class CJ4_MFD_ChartsPopup extends HTMLElement {

  private _mode: CHARTS_MENU_MODE = CHARTS_MENU_MODE.INDEX;
  private _tableContainer: HTMLElement;
  private _chartSelectCallback: (url: string, chart: NG_Chart) => void;
  private _views: Map<CHARTS_MENU_MODE, ICJ4_MFD_ChartsPopupPage> = new Map();

  /**
   * Gets a boolean indicating if the view is visible
   */
  public get isVisible(): boolean {
    return this.style.visibility === "visible";
  }

  public connectedCallback(chartSelectCallback: (url: string, chart: NG_Chart) => void): void {
    this._chartSelectCallback = chartSelectCallback;
    this._tableContainer = this.querySelector("#ChartsTable");

    // set index view
    this._views.set(CHARTS_MENU_MODE.INDEX, new CJ4_MFD_ChartsIndex(this._tableContainer, this._chartSelectCallback, this.openChartMenuCallback.bind(this)));
  }

  private openChartMenuCallback(icao: string, type: CHART_TYPE): void {
    this._views.set(CHARTS_MENU_MODE.LIST, new CJ4_MFD_ChartsMenu(icao, type, this._tableContainer, this.multiChartSelectCallback.bind(this)))
    this._mode = CHARTS_MENU_MODE.LIST;
  }

  private multiChartSelectCallback(chart: NG_Chart): void {
    // put it into index model somehow
    chart.source = "USR";
    (this._views.get(CHARTS_MENU_MODE.INDEX) as CJ4_MFD_ChartsIndex).setChart(chart);
    (this._views.get(CHARTS_MENU_MODE.INDEX) as CJ4_MFD_ChartsIndex).selectChart();
    this.hide();
    this._mode = CHARTS_MENU_MODE.INDEX;
    this._views.delete(CHARTS_MENU_MODE.LIST);
  }

  public update(): void {
    this._views.get(this._mode).update();
  }

  public onEvent(event: string): boolean {
    let handled = false;
    handled = this._views.get(this._mode).onEvent(event);

    if (!handled) {
      switch (event) {
        case "Lwr_Push_ESC":
          if (this._mode === CHARTS_MENU_MODE.INDEX) {
            this.hide();
          } else {
            this._mode = CHARTS_MENU_MODE.INDEX;
            this._views.delete(CHARTS_MENU_MODE.ANYCHART);
            this._views.delete(CHARTS_MENU_MODE.LIST);
            this._views.get(this._mode).update(true);
          }
          break;
      }
    }

    return handled;
  }

  /** Show the view */
  public show(): void {
    this.style.visibility = "visible";
  }

  /** Hide the view */
  public hide(): void {
    this.style.visibility = "hidden";
  }
}

enum CHARTS_MENU_MODE {
  INDEX,
  ANYCHART,
  LIST
}

customElements.define("cj4-mfd-chartspopup", CJ4_MFD_ChartsPopup);