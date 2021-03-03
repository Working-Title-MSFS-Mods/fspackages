import { NG_Chart } from "../../types/navigraph";
import { CHART_TYPE } from "../../utils/NavigraphChartFilter";
import { CJ4_MFD_ChartsMenuModel } from "./CJ4_MFD_ChartsMenuModel";
import { ICJ4_MFD_ChartsPopupPage } from "./ICJ4_MFD_ChartsPopupPage";

export class CJ4_MFD_ChartsMenu implements ICJ4_MFD_ChartsPopupPage {
  private _model: CJ4_MFD_ChartsMenuModel;
  private _selectedIndex: number = 0;
  private _lastChartCount: number = 0;

  /**
   *
   */
  constructor(icao: string, type: CHART_TYPE, private _container: HTMLElement, private _selectCallback: (chart: NG_Chart) => void) {
    this._model = new CJ4_MFD_ChartsMenuModel(icao, type);
    this._model.init();
  }

  public async update(): Promise<void> {
    if (this._lastChartCount !== this._model.charts.length) {
      this._lastChartCount = this._model.charts.length;
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
    const table = document.createElement("table");
    table.style.width = "100%";
    const tbody = table.createTBody();
    this._model.charts.forEach((c: NG_Chart) => {
      const row = tbody.insertRow();
      const cell1 = row.insertCell();
      cell1.style.width = "110px";
      cell1.textContent = c.index_number;
      const cell2 = row.insertCell();
      cell2.innerHTML = c.procedure_identifier;
    })
    this._container.appendChild(table);
  }

  private selectChart() {
    this._selectCallback(this._model.charts[this._selectedIndex]);
  }

  private menuScroll(isForward: boolean): void {
    this._selectedIndex = isForward ? this._selectedIndex + 1 : this._selectedIndex - 1;
    const itemCount = this._model.charts.length;
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
    if (this._selectedIndex < rows.length - 1) {
      rows[this._selectedIndex].className = "selected";
    }
  }

}