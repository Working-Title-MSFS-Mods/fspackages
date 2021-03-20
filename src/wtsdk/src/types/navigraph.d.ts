declare module 'Navigraph' {}

export interface NG_ChartType {
  code: string;
  category: string;
  details: string;
  precision: string;
  section: string;
}

export interface NG_ChartPlanview {
  bbox_local: number[];
  bbox_geo: number[];
}

export interface NG_ChartInset {
  bbox_local: number[];
}

export interface NG_Chart {
  file_day: string;
  file_night: string;
  thumb_day: string;
  thumb_night: string;
  icao_airport_identifier: string;
  id: string;
  ext_id: string;
  file_name: string;
  type: NG_ChartType;
  index_number: string;
  procedure_identifier: string;
  action: string;
  revision_date: string;
  effective_date: string;
  trim_size: string;
  georef: boolean;
  bbox_local: number[];
  planview: NG_ChartPlanview;
  insets: NG_ChartInset[];
  procedure_code: string[];
  runway: string[];
  route_id: string[];
  std_visibility: boolean;
  cao_visibility: boolean;
  vfr_visibility: boolean;
  visibility: number;
  source:string;
}

export interface NG_Charts {
  charts: NG_Chart[];
}

