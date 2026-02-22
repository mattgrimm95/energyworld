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
