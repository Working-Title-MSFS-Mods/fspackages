import { NG_Chart } from "../../types/navigraph";
import { NavigraphApi } from "../../utils/NavigraphApi";
import { CHART_TYPE } from "../../utils/NavigraphChartFilter";
import { CJ4_MFD_ChartsIndex } from "./CJ4_MFD_ChartsIndex";
import { CJ4_MFD_ChartsMenu } from "./CJ4_MFD_ChartsMenu";
import { ICJ4_MFD_ChartsPopupPage } from "./ICJ4_MFD_ChartsPopupPage";

/** Class for managing the view portion of showing the charts pages on the MFD */
export class CJ4_MFD_ChartsPopup extends HTMLElement {

  private _mode: CHARTS_MENU_MODE = CHARTS_MENU_MODE.INDEX;
  private _tableContainer: HTMLElement;
  private _chartSelectCallback: (url: string, chart: NG_Chart) => void;
  private _views: Map<CHARTS_MENU_MODE, ICJ4_MFD_ChartsPopupPage> = new Map();
  private _overlayHeader: HTMLElement;
  private _ngApi: NavigraphApi;

  /**
   * Gets a boolean indicating if the view is visible
   */
  public get isVisible(): boolean {
    return this.style.visibility === "visible";
  }

  public connectedCallback(chartSelectCallback: (url: string, chart: NG_Chart) => void): void {
    this._chartSelectCallback = chartSelectCallback;
    this._tableContainer = this.querySelector("#ChartsTable");
    this._overlayHeader = this.querySelector("#ChartOverlayHeader");

    this._ngApi = new NavigraphApi();
    // set index view
    this._views.set(CHARTS_MENU_MODE.INDEX, new CJ4_MFD_ChartsIndex(this._tableContainer, this._ngApi, this._chartSelectCallback, this.openChartMenuCallback.bind(this)));
  }

  /** Is getting called when the chart menu is to be opened */
  private openChartMenuCallback(icao: string, type: CHART_TYPE): void {
    this._views.set(CHARTS_MENU_MODE.LIST, new CJ4_MFD_ChartsMenu(icao, type, this._ngApi, this._tableContainer, this.multiChartSelectCallback.bind(this)))
    this._mode = CHARTS_MENU_MODE.LIST;
    this._overlayHeader.classList.add("pale");
  }

  /** Is getting called when a chart was selected from the chart selection menu */
  private multiChartSelectCallback(chart: NG_Chart): void {
    if (chart !== undefined) {
      // put it into index model somehow
      chart.source = "USR";
      (this._views.get(CHARTS_MENU_MODE.INDEX) as CJ4_MFD_ChartsIndex).setChart(chart);
      (this._views.get(CHARTS_MENU_MODE.INDEX) as CJ4_MFD_ChartsIndex).selectChart();
      this.hide();
    }
    this._mode = CHARTS_MENU_MODE.INDEX;
    // set the popup header coloring
    this._overlayHeader.classList.remove("pale");
    this._views.delete(CHARTS_MENU_MODE.LIST);
  }

  public async update(): Promise<void> {
    await this._views.get(this._mode).update();
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
            this._overlayHeader.classList.remove("pale");
            this._views.get(this._mode).update(true);
          }
          handled = true;
          break;
      }
    }

    return handled;
  }

  /** Scroll to previous charts in the list and select it */
  public selectPrevChart(): void {
    (this._views.get(CHARTS_MENU_MODE.INDEX) as CJ4_MFD_ChartsIndex).selectPrevChart();
  }

  /** Scroll to next chart in the list and select it */
  public selectNextChart(): void {
    (this._views.get(CHARTS_MENU_MODE.INDEX) as CJ4_MFD_ChartsIndex).selectNextChart();
  }

  /** Show the view */
  public show(): void {
    (this._views.get(CHARTS_MENU_MODE.INDEX) as CJ4_MFD_ChartsIndex).update(true);
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