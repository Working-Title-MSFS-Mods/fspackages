import { NG_Chart } from "../../types/navigraph";
import { NavigraphApi } from "../../utils/NavigraphApi";
import { CHART_TYPE } from "../../utils/NavigraphChartFilter";
import { CJ4_MFD_ChartsIndexModel } from "./CJ4_MFD_ChartsIndexModel";
import { ICJ4_MFD_ChartsPopupPage } from "./ICJ4_MFD_ChartsPopupPage";

export class CJ4_MFD_ChartsIndex implements ICJ4_MFD_ChartsPopupPage {
  private _model: CJ4_MFD_ChartsIndexModel;
  private _selectedIndex: number = 0;

  public constructor(private _container: HTMLElement, ngApi:NavigraphApi, private _chartSelectCallback: (url: string, chart: NG_Chart) => void, private _multiChartCallback: (icao: string, type: CHART_TYPE) => void) {
    this._model = new CJ4_MFD_ChartsIndexModel(ngApi);
    this.update();
  }

  /**
   * Retrieves and updates the chart index
   */
  public async update(force = false): Promise<void> {
    const isDataChanged = await this._model.updateData();

    if (isDataChanged || force) {
      this.render();
    }
    this.renderselect();
  }

  public onEvent(event: string): boolean {
    let handled = true;
    switch (event) {
      case "Lwr_MENU_ADV_DEC":
        this.menuScroll(false);
        break;
      case "Lwr_MENU_ADV_INC":
        this.menuScroll(true);
        break;
      case "Lwr_DATA_PUSH":
        this.selectChart();
        break;
      case "Lwr_DATA_PUSH_LONG":
        this.callChartMenu();
        break;
      default:
        handled = false;
        break;
    }

    // some stupid selection logic
    this.renderselect();

    return handled;
  }

  /** Set a chart at current selected index in the list of charts */
  public setChart(chart: NG_Chart): void {
    this._model.setChartAtIndex(chart, this._selectedIndex);
    this.render();
  }

  /** Requests to open the chart selection menu */
  private callChartMenu(): void {
    const chart = this._model.getChartAtIndex(this._selectedIndex);
    if (chart !== undefined) {
      this._multiChartCallback(chart.icao_airport_identifier, CHART_TYPE[chart.type.category]);
    }
  }

  /** Sends the currently selected chart back to the callback delegates. */
  public async selectChart(): Promise<void> {
    const chart = this._model.getChartAtIndex(this._selectedIndex);
    if (chart !== undefined) {
      if (chart.id !== undefined) {
        const url = await this._model.getChartPngUrl(chart);
        if (url !== "") {
          this._chartSelectCallback(url, chart);
        }
      } else {
        // multiple charts, go to selection
        this._multiChartCallback(chart.icao_airport_identifier, CHART_TYPE[chart.type.category]);
      }
    } else {
      // dirtiest haxx
      const type = CHART_TYPE[this._model.getFlatChartKeys()[this._selectedIndex].toUpperCase()];
      const icao = (this._selectedIndex > 3) ? this._model.destination : this._model.origin;
      this._multiChartCallback(icao, type);
    }
  }

  /** Scroll to previous charts in the list and select it */
  public selectPrevChart(): void {
    if (this._selectedIndex > 0) {
      const chartsIndex = this._model.getFlatChartIndex();
      for (let i = this._selectedIndex - 1; i >= 0; i--) {
        if (chartsIndex[i] !== undefined && chartsIndex[i].id !== undefined) {
          this._selectedIndex = i;
          this.selectChart();
          return;
        }
      }
    }
  }

  /** Scroll to next chart in the list and select it */
  public selectNextChart(): void {
    const chartsIndex = this._model.getFlatChartIndex();
    for (let i = this._selectedIndex + 1; i < chartsIndex.length; i++) {
      if (chartsIndex[i] !== undefined && chartsIndex[i].id !== undefined) {
        this._selectedIndex = i;
        this.selectChart();
        return;
      }
    }
  }

  /** Sets the style on the selected row */
  private renderselect(): void {
    const rows = this._container.querySelectorAll("tr");
    rows.forEach(r => {
      r.className = "";
    });
    if (this._selectedIndex < rows.length) {
      rows[this._selectedIndex].className = "selected";
    }
  }

  /** Handling to scroll through the menu */
  private menuScroll(isForward: boolean): void {
    this._selectedIndex = isForward ? this._selectedIndex + 1 : this._selectedIndex - 1;
    const itemCount = this._model.getFlatChartIndex().length
    if (this._selectedIndex < 0) {
      this._selectedIndex = itemCount - 1;
    } else if (this._selectedIndex >= itemCount) {
      this._selectedIndex = 0;
    }
  }

  /** Renders the chart index */
  private render(): void {
    this._container.innerHTML = '';

    this.renderFmsHead();

    // render origin
    const origSection = this.renderIndexSection(`ORIGIN - ${this._model.origin}`, this._model.chartsIndex.Origin);
    // render destination
    const destSection = this.renderIndexSection(`DESTINATION - ${this._model.destination}`, this._model.chartsIndex.Destination);

    this._container.appendChild(origSection);
    this._container.appendChild(destSection);
  }

  private renderFmsHead() {
    // render fms head
    const fmsheading = document.createElement("h4");
    fmsheading.innerText = "FMS1";
    fmsheading.style.textAlign = "right";
    fmsheading.style.marginTop = "1%";
    fmsheading.style.marginRight = "2%";
    fmsheading.style.color = "magenta";
    const tophr = document.createElement("hr");
    tophr.style.width = "97%";
    tophr.style.marginRight = "2%";
    tophr.style.marginLeft = "1%";
    this._container.appendChild(fmsheading);
    this._container.appendChild(tophr);
  }

  /**
   * Renders a section of the chart index
   * @param caption The caption of the index section
   * @param data An object containing the charts.
   */
  private renderIndexSection(caption: string, data: any): HTMLDivElement {
    const container = document.createElement("div");
    const heading = document.createElement("h4");
    heading.innerHTML = `<mark>${caption}</mark>`;
    heading.className = "tableGap";
    heading.style.verticalAlign = "middle";
    container.appendChild(heading);

    const table = document.createElement("table");
    table.style.width = "100%";
    const tbody = table.createTBody();
    Object.entries(data).forEach((v: [string, NG_Chart]) => {
      const row = tbody.insertRow();
      const cell1 = row.insertCell();
      cell1.style.width = "110px";
      cell1.textContent = v[0];
      const cell2 = row.insertCell();
      const chart = v[1];
      cell2.innerHTML = (chart === undefined) ? '[ ]' : `[<span class="${(chart.id === undefined) ? '' : (chart.source === "FMS") ? 'magenta' : 'cyan'}">${chart.procedure_identifier}</span>]`;
    })
    container.appendChild(table);

    const hrdivider = document.createElement("hr");
    hrdivider.style.width = "97%";
    hrdivider.style.marginLeft = "1%";
    hrdivider.style.marginRight = "2%";
    container.appendChild(hrdivider);

    return container;
  }
}