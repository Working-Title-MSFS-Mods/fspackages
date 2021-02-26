import { FlightPlanManager } from "../../flightplanning/FlightPlanManager";
import { NG_Chart, NG_Charts } from "../../types/navigraph";
import { NavigraphApi } from "../../utils/NavigraphApi";

export class CJ4_MFD_ChartsIndex extends HTMLElement {
  private chartsindex = {
    Origin: {
      Airport: undefined,
      Departure: undefined,
      Arrival: undefined,
      Approach: undefined,
    },
    Destination: {
      Arrival: undefined,
      Approach: undefined,
      Airport: undefined,
      Departure: undefined,
    }
  };
  private _isDirty: boolean = true;
  private _tableContainer: HTMLElement;
  private _api: NavigraphApi;

  // TODO i dont really want to have this in here hmmm
  private _fpm: FlightPlanManager;
  private _selectIndex: number = 0;
  private _chartSelectCallback: (url: string, chart: NG_Chart) => void;
  private _fpChecksum: number = -1;

  public get isVisible(): boolean {
    return this.style.visibility === "visible";
  }

  public connectedCallback(chartSelectCallback: (url: string, chart: NG_Chart) => void): void {
    this._tableContainer = this.querySelector("#ChartsTable");
    this._api = new NavigraphApi();
    this._fpm = FlightPlanManager.DEBUG_INSTANCE;
    this._chartSelectCallback = chartSelectCallback;
  }

  public async updateData(): Promise<void> {
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

        if (icaoOrig !== "") {
          const origCharts = await this._api.getChartsList(icaoOrig);
          this.chartsindex.Origin.Airport = this.findChartInArray(c => c.type.code === "AP", origCharts);
          this.chartsindex.Origin.Departure = this.findChartInArray(c => c.type.code === "GG" && c.procedure_code[0] === this._fpm.getDeparture().name, origCharts);
        }

        if (icaoDest !== "") {
          const destCharts = await this._api.getChartsList(icaoDest);
          this.chartsindex.Destination.Airport = this.findChartInArray(c => c.type.code === "AP", destCharts);
          const arrival = this._fpm.getArrival();
          if (arrival !== undefined) {
            this.chartsindex.Destination.Arrival = this.findChartInArray(c => c.type.section === "ARR" && c.procedure_code[0] === arrival.name, destCharts);
          }
          const approach = this._fpm.getApproach();
          if (approach !== undefined) {
            const appname = this._fpm.getApproach().name[0];
            const appRwy = Avionics.Utils.formatRunway(this._fpm.getApproach().runway).trim();

            this.chartsindex.Destination.Approach = this.findChartInArray(c => c.type.code === "01" && c.type.section === "APP" && c.procedure_code.findIndex((x) => x === `${appname}${appRwy}`) !== -1, destCharts);
            if (this.chartsindex.Destination.Approach === undefined) {
              // try to find any chart for this procedure
              this.chartsindex.Destination.Approach = this.findChartInArray(c => c.type.section === "APP" && c.procedure_code.findIndex((x) => x === `${appname}${appRwy}`) !== -1, destCharts);
            }

          }
        }
      } catch (err) {
        // noop
      }

      this.render();
      this.renderselect();
    }
  }
  resetChartsIndex(): void {
    this.getFlatChartIndex().forEach((c) => {
      c = undefined;
    });
  }

  public findChartInArray(predicate: (value: NG_Chart, index: number, obj: NG_Chart[]) => unknown, charts: NG_Charts): NG_Chart {
    const chart = charts.charts.find(predicate)
    return chart;
  }

  show() {
    this._isDirty = true;
    this.updateData();
    this.style.visibility = "visible";
  }

  hide() {
    this.style.visibility = "hidden";
  }

  onEvent(event: string): boolean {
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

  private async selectChart() {
    const chart = this.getFlatChartIndex()[this._selectIndex];
    if (chart !== undefined) {
      const url = `https://charts.api.navigraph.com/2/airports/${chart.icao_airport_identifier}/signedurls/${chart.file_day}`;
      const signedpngurl = await this._api.sendRequest(url, "get", null, true);
      this._chartSelectCallback(signedpngurl.data, chart);
    }
  }

  public selectPrevChart() {
    if (this._selectIndex > 0) {
      const chartsIndex = this.getFlatChartIndex();
      for (let i = this._selectIndex - 1; i >= 0; i--) {
        if (chartsIndex[i] !== undefined) {
          this._selectIndex = i;
          this.selectChart();
          return;
        }
      }
    }
  }

  public selectNextChart() {
    const chartsIndex = this.getFlatChartIndex();
    for (let i = this._selectIndex + 1; i < chartsIndex.length; i++) {
      if (chartsIndex[i] !== undefined) {
        this._selectIndex = i;
        this.selectChart();
        return;
      }
    }
  }

  private renderselect() {
    const rows = this._tableContainer.querySelectorAll("tr");
    rows.forEach(r => {
      r.className = "";
    });
    rows[this._selectIndex].className = "selected";
  }

  private getFlatChartIndex(): Array<NG_Chart> {
    const returnArr: Array<NG_Chart> = [];
    Object.values(this.chartsindex).forEach(lvl => {
      returnArr.push(...Object.values<NG_Chart>(lvl));
    });
    return returnArr;
  }

  private menuScroll(isForward: boolean): void {
    this._selectIndex = isForward ? this._selectIndex + 1 : this._selectIndex - 1;

    const itemCount = this.getFlatChartIndex().length

    if (this._selectIndex < 0) {
      this._selectIndex = itemCount - 1;
    } else if (this._selectIndex >= itemCount) {
      this._selectIndex = 0;
    }
  }

  private render(): void {
    this._tableContainer.innerHTML = '';

    const origin = this._fpm.getOrigin() === undefined ? "----" : this._fpm.getOrigin().ident;
    const destination = this._fpm.getDestination() === undefined ? "----" : this._fpm.getDestination().ident;

    // render origin
    const origSection = this.renderSection(`ORIGIN - ${origin}`, this.chartsindex.Origin);

    // render destination
    const destSection = this.renderSection(`DESTINATION - ${destination}`, this.chartsindex.Destination);

    this._tableContainer.appendChild(origSection);
    this._tableContainer.appendChild(destSection);
  }

  private renderSection(caption: string, data: any): HTMLDivElement {
    const container = document.createElement("div");
    const heading = document.createElement("h4");
    heading.innerHTML = `<mark>${caption}</mark>`;
    heading.className = "tableGap";
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
      cell2.innerHTML = (chart === undefined) ? '[ ]' : `[<span class="magenta">${chart.procedure_identifier}</span>]`;
    })
    container.appendChild(table);

    const hrdivider = document.createElement("hr");
    hrdivider.style.width = "99%";
    hrdivider.style.float = "right";
    container.appendChild(hrdivider);

    return container;
  }
}



customElements.define("cj4-mfd-chartsindex", CJ4_MFD_ChartsIndex);
