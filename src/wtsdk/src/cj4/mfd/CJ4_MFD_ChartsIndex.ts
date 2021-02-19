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

  public connectedCallback(): void {
    this._tableContainer = this.querySelector("#ChartsTable");
    this._api = new NavigraphApi();
    this._fpm = FlightPlanManager.DEBUG_INSTANCE;
  }

  public async updateData(icaoOrig: string, icaoDest: string): Promise<void> {
    if (this._api.isAccountLinked && this._isDirty) {
      this._isDirty = false;
      try {
        if (icaoOrig !== "") {
          const origCharts = await this._api.getChartsList(icaoOrig);
          this.chartsindex.Origin.Airport = this.findChartInArray(c => c.type.code === "AP", origCharts);
          this.chartsindex.Origin.Departure = this.findChartInArray(c => c.type.code === "AP", origCharts);
        }
      } catch (err) {
        // noop
      }

      this.render();
    }
  }

  public findChartInArray(predicate: (value: NG_Chart, index: number, obj: NG_Chart[]) => unknown, charts: NG_Charts): NG_Chart {
    const chart = charts.charts.find(predicate)
    return chart;
  }

  onEvent(event: string): boolean {
    if (this.style.display === "none") {
      return false;
    }
    this._isDirty = true;
    let handled = true;
    switch (event) {
      case "Lwr_Push_Chart_1":
        this.updateData("KBOS", "KPHL");
        break;
      default:
        this._isDirty = false;
        handled = false;
        break;
    }
    return handled;
  }

  private render(): void {
    this._tableContainer.innerHTML = '';

    const origin = this._fpm.getOrigin() === undefined ? "----" : this._fpm.getOrigin();
    const destination = this._fpm.getDestination() === undefined ? "----" : this._fpm.getDestination();

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
      cell1.textContent = v[0];
      const cell2 = row.insertCell();
      const chart = v[1];
      cell2.textContent = (chart === undefined) ? '[ ]' : `[${chart.procedure_identifier}]`;
    })
    container.appendChild(table);

    const hrdivider = document.createElement("hr");
    hrdivider.style.width = "95%";
    hrdivider.style.textAlign = "center";
    container.appendChild(hrdivider);

    return container;
  }
}



customElements.define("cj4-mfd-chartsindex", CJ4_MFD_ChartsIndex);
