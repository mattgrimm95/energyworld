import type { StatRow, StatsResponse } from "../api/client";

const METRIC_LABELS: Record<string, string> = {
  energy_consumption: "Energy consumption",
  exports: "Exports",
  imports: "Imports",
};

type CountryPanelProps = {
  countryName: string;
  iso3: string;
  stats: StatsResponse | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
};

export function CountryPanel({
  countryName,
  iso3,
  stats,
  loading,
  error,
  onClose,
}: CountryPanelProps) {
  const byMetric = (stats?.stats ?? []).reduce<Record<string, StatRow[]>>(
    (acc, s) => {
      if (!acc[s.metricType]) acc[s.metricType] = [];
      acc[s.metricType].push(s);
      return acc;
    },
    {}
  );

  return (
    <div className="w-full h-full min-h-0 bg-slate-800/95 backdrop-blur rounded-xl shadow-xl border border-slate-600/50 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-600/50">
        <h2 className="text-lg font-semibold text-white truncate">
          {countryName || iso3 || "Country"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-600/50 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-4 overflow-y-auto flex-1">
        {loading && (
          <p className="text-slate-400 text-sm">Loading statistics…</p>
        )}
        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}
        {!loading && !error && stats && (
          <div className="space-y-4">
            {["energy_consumption", "exports", "imports"].map((metric) => {
              const rows = byMetric[metric] ?? [];
              const label = METRIC_LABELS[metric] ?? metric;
              return (
                <div key={metric}>
                  <h3 className="text-sm font-medium text-slate-300 mb-2">{label}</h3>
                  {rows.length === 0 ? (
                    <p className="text-slate-500 text-sm">No data</p>
                  ) : (
                    <table className="w-full text-sm text-slate-200">
                      <thead>
                        <tr className="text-left text-slate-400 border-b border-slate-600/50">
                          <th className="pb-1 pr-2">Year</th>
                          <th className="pb-1 pr-2">Value</th>
                          <th className="pb-1">Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={`${r.year}-${r.metricType}`} className="border-b border-slate-700/50">
                            <td className="py-1.5 pr-2">{r.year}</td>
                            <td className="py-1.5 pr-2">{r.value.toLocaleString()}</td>
                            <td className="py-1.5">{r.unit ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
