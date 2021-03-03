import { NG_Chart, NG_Charts } from "../../types/navigraph";
import { NavigraphApi } from "../../utils/NavigraphApi";
import { CHART_TYPE, NavigraphChartFilter } from "../../utils/NavigraphChartFilter";

export class CJ4_MFD_ChartsMenuModel {
  private _api: NavigraphApi;
  private _type: CHART_TYPE;
  private _icao: string;
  private _charts: NG_Chart[];

  public get charts(): NG_Chart[] {
    return this._charts;
  }

  constructor(icao: string, type: CHART_TYPE) {
    this._api = new NavigraphApi();
    this._icao = icao;
    this._type = type;
  }

  public async init(): Promise<void> {
    const ngCharts = await this._api.getChartsList(this._icao);
    switch (this._type) {
      case CHART_TYPE.AIRPORT:
        this._charts = NavigraphChartFilter.getAirport(ngCharts);
        break;
      case CHART_TYPE.DEPARTURE:
        this._charts = NavigraphChartFilter.getDeparture(ngCharts);
        break;
      case CHART_TYPE.ARRIVAL:
        this._charts = NavigraphChartFilter.getArrival(ngCharts);
        break;
      case CHART_TYPE.APPROACH:
        this._charts = NavigraphChartFilter.getApproach(ngCharts);
        break;
      case CHART_TYPE.AIRSPACE:
        this._charts = NavigraphChartFilter.getAirspace(ngCharts);
        break;
    }
  }
}