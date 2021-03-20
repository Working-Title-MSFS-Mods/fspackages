import { NG_Chart, NG_Charts } from "../types/navigraph";

export enum CHART_TYPE {
  AIRPORT,
  DEPARTURE,
  ARRIVAL,
  APPROACH,
  AIRSPACE,
  NOISE
}

export class NavigraphChartFilter {
  public static getAirspace(charts: NG_Charts): NG_Chart[] {
    return this.findChartInArray(c => c.type.category === "AIRSPACE", charts);
  }

  public static getAirport(charts: NG_Charts): NG_Chart[] {
    return this.findChartInArray(c => c.type.section === "APT", charts);
  }

  public static getDeparture(charts: NG_Charts): NG_Chart[] {
    return this.findChartInArray(c => c.type.section === "DEP", charts);
  }

  public static getArrival(charts: NG_Charts): NG_Chart[] {
    return this.findChartInArray(c => c.type.section === "ARR", charts);
  }

  public static getApproach(charts: NG_Charts): NG_Chart[] {
    return this.findChartInArray(c => c.type.section === "APP", charts);
  }

  public static getApproachPrecision(charts: NG_Charts): NG_Chart[] {
    return this.findChartInArray(c => c.type.section === "APP" && c.type.precision === "Y", charts);
  }

  public static getApproachNonPrecision(charts: NG_Charts): NG_Chart[] {
    return this.findChartInArray(c => c.type.section === "APP" && c.type.precision === "N", charts);
  }

  /**
 * Finds a chart in the array using the predicate.
 * @param predicate A predicate used to find a chart
 * @param charts The array of charts to search in
 */
  private static findChartInArray(predicate: (value: NG_Chart, index: number, obj: NG_Chart[]) => unknown, charts: NG_Charts): NG_Chart[] {
    const foundCharts = charts.charts.filter(predicate)
    return foundCharts;
  }
}