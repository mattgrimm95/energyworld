const API_BASE = "/api";

export type Country = {
  id: number;
  iso3: string;
  name: string;
};

export type StatRow = {
  year: number;
  metricType: string;
  value: number;
  unit: string | null;
};

export type StatsResponse = {
  country: { iso3: string; name: string };
  stats: StatRow[];
};

export type ChoroplethRow = {
  iso3: string;
  name: string;
  value: number;
};

export type ChoroplethResponse = {
  metric: string;
  year: number;
  data: ChoroplethRow[];
};

export type MetricType = "energy_consumption" | "exports" | "imports";

export type ReserveType = "oil" | "natural_gas" | "coal" | "oil_sands" | "shale";

export type EnergyReserve = {
  id: number;
  name: string;
  type: ReserveType;
  subtype: string | null;
  lat: number;
  lng: number;
  estimatedReserves: number | null;
  unit: string | null;
  country: string;
  iso3: string;
  year: number | null;
};

export const RESERVE_TYPE_LABELS: Record<ReserveType, string> = {
  oil: "Oil",
  natural_gas: "Natural Gas",
  coal: "Coal",
  oil_sands: "Oil Sands",
  shale: "Shale / Tight Oil",
};

export const RESERVE_TYPE_COLORS: Record<ReserveType, string> = {
  oil: "#f59e0b",
  natural_gas: "#06b6d4",
  coal: "#78716c",
  oil_sands: "#d97706",
  shale: "#a855f7",
};

export const METRIC_LABELS: Record<MetricType, string> = {
  energy_consumption: "Energy Consumption",
  exports: "Exports",
  imports: "Imports",
};

export const METRIC_UNITS: Record<MetricType, string> = {
  energy_consumption: "TWh",
  exports: "B USD",
  imports: "B USD",
};

export async function fetchCountries(): Promise<Country[]> {
  const res = await fetch(`${API_BASE}/countries`);
  if (!res.ok) throw new Error("Failed to fetch countries");
  return res.json();
}

export async function fetchStats(
  country: string,
  metrics?: string,
  year?: string
): Promise<StatsResponse> {
  const params = new URLSearchParams({ country });
  if (metrics) params.set("metrics", metrics);
  if (year) params.set("year", year);
  const res = await fetch(`${API_BASE}/stats?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to fetch stats");
  }
  return res.json();
}

export async function fetchChoropleth(
  metric: MetricType = "energy_consumption",
  year = 2022
): Promise<ChoroplethResponse> {
  const params = new URLSearchParams({ metric, year: String(year) });
  const res = await fetch(`${API_BASE}/stats/choropleth?${params}`);
  if (!res.ok) throw new Error("Failed to fetch choropleth data");
  return res.json();
}

export async function fetchReserves(
  type?: ReserveType
): Promise<EnergyReserve[]> {
  const params = type ? `?type=${type}` : "";
  const res = await fetch(`${API_BASE}/reserves${params}`);
  if (!res.ok) throw new Error("Failed to fetch reserves");
  return res.json();
}
