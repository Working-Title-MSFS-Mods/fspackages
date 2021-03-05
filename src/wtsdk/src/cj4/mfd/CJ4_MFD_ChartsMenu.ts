import { NG_Chart } from "../../types/navigraph";
import { CHART_TYPE } from "../../utils/NavigraphChartFilter";
import { CJ4_MFD_ChartsMenuModel } from "./CJ4_MFD_ChartsMenuModel";
import { ICJ4_MFD_ChartsPopupPage } from "./ICJ4_MFD_ChartsPopupPage";

export class CJ4_MFD_ChartsMenu implements ICJ4_MFD_ChartsPopupPage {
  private readonly PAGE_SIZE: number = 20;
  private _model: CJ4_MFD_ChartsMenuModel;
  private _selectedIndex: number = 0;
  private _lastChartCount: number = 0;
  private _currentPage: number = 0;
  private _totalPages: number = 1;

  constructor(icao: string, type: CHART_TYPE, private _container: HTMLElement, private _selectCallback: (chart: NG_Chart) => void) {
    this._model = new CJ4_MFD_ChartsMenuModel(icao, type);
    this._model.init();
  }

  public async update(): Promise<void> {
    if (this._model.charts.length === 0) {
      this.selectChart();
    }

    if (this._lastChartCount !== this._model.charts.length) {
      this._lastChartCount = this._model.charts.length;
      this._totalPages = Math.ceil(this._model.charts.length / this.PAGE_SIZE);
      this.render();
      this.renderselect();
    }
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
      default:
        handled = false;
        break;
    }

    // some stupid selection logic
    this.renderselect();

    return handled;
  }

  private render() {
    this._container.innerHTML = '';

    // render header
    const lvl1Head = document.createElement("div");
    lvl1Head.className = "ChartHeader pale";
    lvl1Head.style.paddingLeft = "2%";
    lvl1Head.innerHTML = `--> ANY CHART - ${this._model.icao}`;
    this._container.appendChild(lvl1Head);

    const lvl2Head = document.createElement("div");
    lvl2Head.className = "ChartHeader";
    lvl2Head.style.paddingLeft = "4%";
    lvl2Head.innerHTML = `--> ${CHART_TYPE[this._model.type].toString()} <span style="float:right">${this._currentPage + 1}/${this._totalPages}</span>`;
    this._container.appendChild(lvl2Head);

    // render menu
    const chartsToRender = this._model.charts.slice(this._currentPage * this.PAGE_SIZE, (this._currentPage * this.PAGE_SIZE) + this.PAGE_SIZE);

    const table = document.createElement("table");
    table.style.width = "100%";
    const tbody = table.createTBody();

    if (this._currentPage > 0) {
      const row = tbody.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 2;
      cell.style.color = "cyan";
      cell.textContent = "<-- PREVIOUS CHARTS <--";
    }

    chartsToRender.forEach((c: NG_Chart) => {
      const row = tbody.insertRow();
      const cell1 = row.insertCell();
      cell1.style.width = "110px";
      cell1.textContent = c.index_number;
      const cell2 = row.insertCell();
      cell2.innerHTML = c.procedure_identifier;
    })

    if (chartsToRender.length >= 20) {
      const row = tbody.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 2;
      cell.style.color = "cyan";
      cell.textContent = "--> MORE CHARTS -->";
    }

    this._container.appendChild(table);

  }

  /** Selects a charts and calls back to the view */
  private selectChart() {
    if (this._model.charts.length === 0) {
      this._selectCallback(undefined);
      return;
    }

    if (this._selectedIndex > this.PAGE_SIZE - 1 || (this._currentPage > 0 && this._selectedIndex === 0)) {
      if (this._selectedIndex === 0) {
        this._currentPage--;
      } else {
        this._currentPage++;
      }
      this._selectedIndex = 0;
      this.render();
    } else {
      const idx = (this._currentPage === 0) ? this._selectedIndex : this._selectedIndex - 1;
      this._selectCallback(this._model.charts[idx + (this._currentPage * this.PAGE_SIZE)]);
    }
  }

  private menuScroll(isForward: boolean): void {
    this._selectedIndex = isForward ? this._selectedIndex + 1 : this._selectedIndex - 1;
    const itemCount = this._container.querySelectorAll("tr").length;
    if (this._selectedIndex < 0) {
      this._selectedIndex = itemCount - 1;
    } else if (this._selectedIndex >= itemCount) {
      this._selectedIndex = 0;
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

}