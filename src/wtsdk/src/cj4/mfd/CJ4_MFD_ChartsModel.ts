import { FlightPlanManager } from "../../flightplanning/FlightPlanManager";
import { NG_Chart, NG_Charts } from "../../types/navigraph";
import { NavigraphApi } from "../../utils/NavigraphApi";

interface IChartIndex {
  Origin: {
    Airport: NG_Chart | undefined,
    Departure: NG_Chart | undefined,
    Arrival: NG_Chart | undefined,
    Approach: NG_Chart | undefined,
  },
  Destination: {
    Arrival: NG_Chart | undefined,
    Approach: NG_Chart | undefined,
    Airport: NG_Chart | undefined,
    Departure: NG_Chart | undefined,
  }
}

class ChartIndex implements IChartIndex {
  Origin = { Airport: undefined, Departure: undefined, Arrival: undefined, Approach: undefined };
  Destination = { Arrival: undefined, Approach: undefined, Airport: undefined, Departure: undefined };
}

export class CJ4_MFD_ChartsModel {
  private _api: NavigraphApi;
  private _fpm: FlightPlanManager;
  private _fpChecksum: number = -1;

  private _chartsIndex: IChartIndex;
  public get chartsIndex(): IChartIndex {
    return this._chartsIndex;
  }

  private _origin: string;
  public get origin(): string {
    return this._origin;
  }

  private _destination: string;
  public get destination(): string {
    return this._destination;
  }

  constructor() {
    this._api = new NavigraphApi();
    this._fpm = FlightPlanManager.DEBUG_INSTANCE;
    this._chartsIndex = new ChartIndex();
  }

  /**
 * Retrieves and updates the chart index
 */
  public async updateData(): Promise<boolean> {
    // check if flight plan has changed
    let fpChanged = false;
    if (this._fpChecksum !== this._fpm.getFlightPlan(0).checksum) {
      this._fpChecksum = this._fpm.getFlightPlan(0).checksum;
      fpChanged = true;
    }

    if (this._api.isAccountLinked && fpChanged) {
      try {
        this.resetChartsIndex();
        this._origin = this._fpm.getOrigin() === undefined ? "----" : this._fpm.getOrigin().ident;
        this._destination = this._fpm.getDestination() === undefined ? "----" : this._fpm.getDestination().ident;

        // get charts for origin
        if (this._origin !== "----") {
          const origCharts = await this._api.getChartsList(this._origin);
          this._chartsIndex.Origin.Airport = this.findChartInArray(c => c.type.code === "AP", origCharts);
          const departure = this._fpm.getDeparture();
          if (departure !== undefined) {
            this._chartsIndex.Origin.Departure = this.findChartInArray(c => c.type.code === "GG" && c.procedure_code.findIndex((x) => x === `${departure.name}`) !== -1, origCharts);
          }
        }

        // get charts for destination
        if (this._destination !== "----") {
          const destCharts = await this._api.getChartsList(this._destination);
          this._chartsIndex.Destination.Airport = this.findChartInArray(c => c.type.code === "AP", destCharts);
          const arrival = this._fpm.getArrival();
          if (arrival !== undefined) {
            this._chartsIndex.Destination.Arrival = this.findChartInArray(c => c.type.section === "ARR" && c.procedure_code.findIndex((x) => x === `${arrival.name}`) !== -1, destCharts);
          }
          const approach = this._fpm.getApproach();
          if (approach !== undefined) {
            this._chartsIndex.Destination.Approach = this.findChartInArray(c => c.type.section === "APP" && c.procedure_code.findIndex((x) => x === `${this.formatApproachName(approach.name)}`) !== -1, destCharts);
          }
        }

        return true;
      } catch (err) {
        console.error("Something went wrong with charts");
      }
    }

    return false;
  }

  public async getChartPngUrl(chart: NG_Chart): Promise<string> {
    if (chart !== undefined) {
      const url = `https://charts.api.navigraph.com/2/airports/${chart.icao_airport_identifier}/signedurls/${chart.file_day}`;
      const urlResp = await this._api.sendRequest(url, "get", null, true);
      return urlResp.data;
    }

    return "";
  }

  public getChartAtIndex(index: number): NG_Chart {
    return this.getFlatChartIndex()[index];
  }

  /** Flattens the chart index to an array */
  public getFlatChartIndex(): Array<NG_Chart> {
    const returnArr: Array<NG_Chart> = [];
    Object.values(this._chartsIndex).forEach(lvl => {
      returnArr.push(...Object.values<NG_Chart>(lvl));
    });
    return returnArr;
  }

  /**
 * Resets the charts in the index
 */
  private resetChartsIndex(): void {
    this._chartsIndex = new ChartIndex();
  }

  /**
   * Formats the approach name to be compatible with Navigraph.
   * @param name The msfs name of the approach
   */
  private formatApproachName(name: string): string {
    const segments = name.trim().split(' ');
    return `${segments[0][0]}${Avionics.Utils.formatRunway(segments[1]).trim()}${(segments.length > 2) ? segments[2] : ''}`;
  }

  /**
   * Finds a chart in the array using the predicate.
   * @param predicate A predicate used to find a chart
   * @param charts The array of charts to search in
   */
  private findChartInArray(predicate: (value: NG_Chart, index: number, obj: NG_Chart[]) => unknown, charts: NG_Charts): NG_Chart {
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

}