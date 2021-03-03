import { NG_Chart } from "../../types/navigraph";
import { CJ4_MFD_ChartsModel } from "./CJ4_MFD_ChartsModel";

enum CHARTS_MENU_MODE {
  INDEX,
  ANYCHART,
  LIST
}
export class CJ4_MFD_ChartsIndex extends HTMLElement {
  private _model: CJ4_MFD_ChartsModel;

  private _isDirty: boolean = true;
  private _tableContainer: HTMLElement;
  private _selectIndex: number = 0;
  private _chartSelectCallback: (url: string, chart: NG_Chart) => void;

  /**
   * Gets a boolean indicating if the view is visible
   */
  public get isVisible(): boolean {
    return this.style.visibility === "visible";
  }

  public connectedCallback(chartSelectCallback: (url: string, chart: NG_Chart) => void): void {
    this._tableContainer = this.querySelector("#ChartsTable");
    this._chartSelectCallback = chartSelectCallback;
    this._model = new CJ4_MFD_ChartsModel();
  }

  /**
   * Retrieves and updates the chart index
   */
  public async updateData(): Promise<void> {
    if (this.isVisible) {
      const isDataChanged = await this._model.updateData();

      if (isDataChanged) {
        this.render();
      }
      this.renderselect();
    }
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
    const chart = this._model.getChartAtIndex(this._selectIndex);
    if (chart !== undefined) {
      const url = await this._model.getChartPngUrl(chart);
      if (url !== "") {
        this._chartSelectCallback(url, chart);
      }
    }
  }

  /** Scroll to previous charts in the list and select it */
  public selectPrevChart(): void {
    if (this._selectIndex > 0) {
      const chartsIndex = this._model.getFlatChartIndex();
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
    const chartsIndex = this._model.getFlatChartIndex();
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

  /** Handling to scroll through the menu */
  private menuScroll(isForward: boolean): void {
    this._selectIndex = isForward ? this._selectIndex + 1 : this._selectIndex - 1;
    const itemCount = this._model.getFlatChartIndex().length
    if (this._selectIndex < 0) {
      this._selectIndex = itemCount - 1;
    } else if (this._selectIndex >= itemCount) {
      this._selectIndex = 0;
    }
  }

  /** Renders the chart index */
  private render(): void {
    this._tableContainer.innerHTML = '';
    // render origin
    const origSection = this.renderIndexSection(`ORIGIN - ${this._model.origin}`, this._model.chartsIndex.Origin);
    // render destination
    const destSection = this.renderIndexSection(`DESTINATION - ${this._model.destination}`, this._model.chartsIndex.Destination);
    this._tableContainer.appendChild(origSection);
    this._tableContainer.appendChild(destSection);
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
