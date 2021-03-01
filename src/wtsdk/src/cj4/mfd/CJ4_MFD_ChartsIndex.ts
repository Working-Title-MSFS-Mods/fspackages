import { FlightPlanManager } from "../../flightplanning/FlightPlanManager";
import { NG_Chart, NG_Charts } from "../../types/navigraph";
import { NavigraphApi } from "../../utils/NavigraphApi";

enum CHARTS_MENU_MODE {
  INDEX,
  ANYCHART,
  LIST
}

interface IChartIndex {
  Origin: {
    Airport: NG_Chart,
    Departure: NG_Chart,
    Arrival: NG_Chart,
    Approach: NG_Chart,
  },
  Destination: {
    Arrival: NG_Chart,
    Approach: NG_Chart,
    Airport: NG_Chart,
    Departure: NG_Chart,
  }
}

class ChartIndex implements IChartIndex {
  Origin: { Airport: NG_Chart; Departure: NG_Chart; Arrival: NG_Chart; Approach: NG_Chart; };
  Destination: { Arrival: NG_Chart; Approach: NG_Chart; Airport: NG_Chart; Departure: NG_Chart; };

}

export class CJ4_MFD_ChartsIndex extends HTMLElement {
  private _chartsindex: ChartIndex = new ChartIndex();

  private _isDirty: boolean = true;
  private _tableContainer: HTMLElement;
  private _api: NavigraphApi;

  // TODO i dont really want to have this in here hmmm
  private _fpm: FlightPlanManager;
  private _selectIndex: number = 0;
  private _chartSelectCallback: (url: string, chart: NG_Chart) => void;
  private _fpChecksum: number = -1;

  /**
   * Gets a boolean indicating if the view is visible
   */
  public get isVisible(): boolean {
    return this.style.visibility === "visible";
  }

  public connectedCallback(chartSelectCallback: (url: string, chart: NG_Chart) => void): void {
    this._tableContainer = this.querySelector("#ChartsTable");
    this._api = new NavigraphApi();
    this._fpm = FlightPlanManager.DEBUG_INSTANCE;
    this._chartSelectCallback = chartSelectCallback;
  }

  /**
   * Retrieves and updates the chart index
   */
  public async updateData(): Promise<void> {
    // check if flight plan has changed
    if (this._fpChecksum !== this._fpm.getFlightPlan(0).checksum) {
      this._isDirty = true;
      this._fpChecksum = this._fpm.getFlightPlan(0).checksum;
    }

    if (this._api.isAccountLinked && this._isDirty) {
      this._isDirty = false;
      try {
        this.resetChartsIndex();
        const icaoOrig = this._fpm.getOrigin() === undefined ? "" : this._fpm.getOrigin().ident;
        const icaoDest = this._fpm.getDestination() === undefined ? "" : this._fpm.getDestination().ident;

        // get charts for origin
        if (icaoOrig !== "") {
          const origCharts = await this._api.getChartsList(icaoOrig);
          this._chartsindex.Origin.Airport = this.findChartInArray(c => c.type.code === "AP", origCharts);
          const departure = this._fpm.getDeparture();
          if (departure !== undefined) {
            this._chartsindex.Origin.Departure = this.findChartInArray(c => c.type.code === "GG" && c.procedure_code.findIndex((x) => x === `${departure.name}`) !== -1, origCharts);
          }
        }

        // get charts for destination
        if (icaoDest !== "") {
          const destCharts = await this._api.getChartsList(icaoDest);
          this._chartsindex.Destination.Airport = this.findChartInArray(c => c.type.code === "AP", destCharts);
          const arrival = this._fpm.getArrival();
          if (arrival !== undefined) {
            this._chartsindex.Destination.Arrival = this.findChartInArray(c => c.type.section === "ARR" && c.procedure_code.findIndex((x) => x === `${arrival.name}`) !== -1, destCharts);
          }
          const approach = this._fpm.getApproach();
          if (approach !== undefined) {
            this._chartsindex.Destination.Approach = this.findChartInArray(c => c.type.section === "APP" && c.procedure_code.findIndex((x) => x === `${this.formatApproachName(approach.name)}`) !== -1, destCharts);
          }
        }
      } catch (err) {
        // noop
      }

      this.render();
      this.renderselect();
    }
  }

  private formatApproachName(name: string): string {
    const segments = name.trim().split(' ');
    return `${segments[0][0]}${Avionics.Utils.formatRunway(segments[1]).trim()}${(segments.length > 2) ? segments[2] : ''}`;
  }

  /**
   * Resets the charts in the index
   */
  private resetChartsIndex(): void {
    this._chartsindex = new ChartIndex();
  }

  /**
   * Finds a chart in the array using the predicate.
   * @param predicate A predicate used to find a chart
   * @param charts The array of charts to search in
   */
  public findChartInArray(predicate: (value: NG_Chart, index: number, obj: NG_Chart[]) => unknown, charts: NG_Charts): NG_Chart {
    const foundCharts = charts.charts.filter(predicate)
    if (foundCharts.length > 0) {
      if (foundCharts.length > 1) {
        return {
          procedure_identifier: `${foundCharts.length} FMS Charts`
        } as NG_Chart;
      } else {
        return foundCharts[0];
      }
    }

    return undefined;
  }

  /** Show the view */
  public show(): void {
    this._isDirty = true;
    this.updateData();
    this.style.visibility = "visible";
  }

  /** Hide the view */
  public hide(): void {
    this.style.visibility = "hidden";
  }

  public onEvent(event: string): boolean {
    if (!this.isVisible) {
      return false;
    }
    let handled = true;
    switch (event) {
      case "Lwr_Push_Chart_1":
        // this.updateData();
        break;
      case "Lwr_MENU_ADV_DEC":
        this.menuScroll(false);
        break;
      case "Lwr_MENU_ADV_INC":
        this.menuScroll(true);
        break;
      case "Lwr_DATA_PUSH":
        this.selectChart();
        break;
      default:
        handled = false;
        break;
    }

    // some stupid selection logic
    this.renderselect();

    return handled;
  }

  /** Sends the currently selected chart back to the callback delegates. */
  private async selectChart() {
    const chart = this.getFlatChartIndex()[this._selectIndex];
    if (chart !== undefined) {
      const url = `https://charts.api.navigraph.com/2/airports/${chart.icao_airport_identifier}/signedurls/${chart.file_day}`;
      const signedpngurl = await this._api.sendRequest(url, "get", null, true);
      this._chartSelectCallback(signedpngurl.data, chart);
    }
  }

  /** Scroll to previous charts in the list and select it */
  public selectPrevChart(): void {
    if (this._selectIndex > 0) {
      const chartsIndex = this.getFlatChartIndex();
      for (let i = this._selectIndex - 1; i >= 0; i--) {
        if (chartsIndex[i] !== undefined && chartsIndex[i].id !== undefined) {
          this._selectIndex = i;
          this.selectChart();
          return;
        }
      }
    }
  }

  /** Scroll to next chart in the list and select it */
  public selectNextChart(): void {
    const chartsIndex = this.getFlatChartIndex();
    for (let i = this._selectIndex + 1; i < chartsIndex.length; i++) {
      if (chartsIndex[i] !== undefined && chartsIndex[i].id !== undefined) {
        this._selectIndex = i;
        this.selectChart();
        return;
      }
    }
  }

  /** Sets the style on the selected row */
  private renderselect(): void {
    const rows = this._tableContainer.querySelectorAll("tr");
    rows.forEach(r => {
      r.className = "";
    });
    rows[this._selectIndex].className = "selected";
  }

  /** Flattens the chart index to an array */
  private getFlatChartIndex(): Array<NG_Chart> {
    const returnArr: Array<NG_Chart> = [];
    Object.values(this._chartsindex).forEach(lvl => {
      returnArr.push(...Object.values<NG_Chart>(lvl));
    });
    return returnArr;
  }

  /** Handling to scroll through the menu */
  private menuScroll(isForward: boolean): void {
    this._selectIndex = isForward ? this._selectIndex + 1 : this._selectIndex - 1;

    const itemCount = this.getFlatChartIndex().length

    if (this._selectIndex < 0) {
      this._selectIndex = itemCount - 1;
    } else if (this._selectIndex >= itemCount) {
      this._selectIndex = 0;
    }
  }

  /** Renders the chart index */
  private render(): void {
    this._tableContainer.innerHTML = '';

    const origin = this._fpm.getOrigin() === undefined ? "----" : this._fpm.getOrigin().ident;
    const destination = this._fpm.getDestination() === undefined ? "----" : this._fpm.getDestination().ident;

    // render origin
    const origSection = this.renderSection(`ORIGIN - ${origin}`, this._chartsindex.Origin);

    // render destination
    const destSection = this.renderSection(`DESTINATION - ${destination}`, this._chartsindex.Destination);

    this._tableContainer.appendChild(origSection);
    this._tableContainer.appendChild(destSection);
  }

  /**
   * Renders a section of the chart index
   * @param caption The caption of the index section
   * @param data An object containing the charts.
   */
  private renderSection(caption: string, data: any): HTMLDivElement {
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
      cell2.innerHTML = (chart === undefined) ? '[ ]' : `[<span class="${(chart.id === undefined) ? '' : 'magenta'}">${chart.procedure_identifier}</span>]`;
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



customElements.define("cj4-mfd-chartsindex", CJ4_MFD_ChartsIndex);
