export interface ChartData {
  [key: string]: string | number | undefined;
  name: string;
  value: number;
  color?: string;
}

export interface OccupationData {
  name: string;
  "Taxa de Ocupação": number;
  Ociosidade: number;
  Superlotação: number;
  "Capacidade Produtiva": number;
}
export interface HeatMapData {
  hospital: string;
  sector: string;
  value: number;
  status: "high" | "medium" | "low";
}

export interface WaterfallData {
  name: string;
  value: number;
  cumulative: number;
  type: "total" | "positive" | "negative" | "sector";
}
