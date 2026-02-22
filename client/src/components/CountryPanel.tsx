import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { StatRow, StatsResponse, MetricType } from "../api/client";
import {
  METRIC_LABELS,
  METRIC_UNITS,
  METRIC_COLORS,
  ENERGY_TRADE_METRICS,
  MINERAL_METRICS,
} from "../api/client";

type CountryPanelProps = {
  countryName: string;
  iso3: string;
  stats: StatsResponse | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
};

function MetricChart({ metric, rows }: { metric: MetricType; rows: StatRow[] }) {
  const sorted = [...rows].sort((a, b) => a.year - b.year);
  const label = METRIC_LABELS[metric];
  const unit = METRIC_UNITS[metric];
  const color = METRIC_COLORS[metric] ?? "#8884d8";

  if (sorted.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-2">
          {label} <span className="text-slate-500 font-normal">({unit})</span>
        </h3>
        <p className="text-slate-500 text-sm">No data</p>
      </div>
    );
  }

  if (sorted.length === 1) {
    return (
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-2">
          {label} <span className="text-slate-500 font-normal">({unit})</span>
        </h3>
        <p className="text-slate-200 text-lg font-semibold">
          {sorted[0].year}: {sorted[0].value.toLocaleString()} {unit}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-slate-300 mb-2">
        {label} <span className="text-slate-500 font-normal">({unit})</span>
      </h3>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={sorted}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickLine={false}
            width={55}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #475569",
              borderRadius: "0.5rem",
              color: "#e2e8f0",
              fontSize: 12,
            }}
            formatter={(value: number | undefined) => [
              `${(value ?? 0).toLocaleString()} ${unit}`,
              label,
            ]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

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
      (acc[s.metricType] ??= []).push(s);
      return acc;
    },
    {}
  );

  const hasMinerals = MINERAL_METRICS.some(
    (m) => (byMetric[m]?.length ?? 0) > 0
  );

  return (
    <div className="w-full h-full min-h-0 max-h-full bg-slate-800/95 backdrop-blur rounded-xl shadow-xl border border-slate-600/50 overflow-hidden flex flex-col">
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
      <div className="p-4 overflow-y-auto flex-1 min-h-0">
        {loading && <p className="text-slate-400 text-sm">Loading statistics…</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {!loading && !error && stats && (
          <div className="space-y-5">
            {ENERGY_TRADE_METRICS.map((metric) => (
              <MetricChart key={metric} metric={metric} rows={byMetric[metric] ?? []} />
            ))}
            {hasMinerals && (
              <>
                <div className="border-t border-slate-600/50 pt-3 mt-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Critical Minerals
                  </h3>
                </div>
                {MINERAL_METRICS.map((metric) =>
                  (byMetric[metric]?.length ?? 0) > 0 ? (
                    <MetricChart key={metric} metric={metric} rows={byMetric[metric]} />
                  ) : null
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
