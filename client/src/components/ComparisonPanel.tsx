import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { StatsResponse, MetricType } from "../api/client";
import { METRIC_LABELS, METRIC_UNITS } from "../api/client";

type Props = {
  statsMap: Map<string, StatsResponse>;
  selectedCountries: string[];
  onClose: () => void;
  onRemove: (iso3: string) => void;
};

const COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#ec4899",
];

function ComparisonChart({
  metric,
  statsMap,
  selectedCountries,
}: {
  metric: MetricType;
  statsMap: Map<string, StatsResponse>;
  selectedCountries: string[];
}) {
  const label = METRIC_LABELS[metric];
  const unit = METRIC_UNITS[metric];

  const yearMap = new Map<number, Record<string, number>>();
  for (const iso3 of selectedCountries) {
    const resp = statsMap.get(iso3);
    if (!resp) continue;
    for (const row of resp.stats) {
      if (row.metricType !== metric) continue;
      const existing = yearMap.get(row.year) ?? {};
      existing[iso3] = row.value;
      yearMap.set(row.year, existing);
    }
  }

  const data = Array.from(yearMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, vals]) => ({ year, ...vals }));

  if (data.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-medium text-slate-300 mb-2">
        {label}{" "}
        <span className="text-slate-500 font-normal">({unit})</span>
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
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
            formatter={(value: number | undefined, name?: string) => [
              `${(value ?? 0).toLocaleString()} ${unit}`,
              statsMap.get(name ?? "")?.country.name ?? name ?? "",
            ]}
          />
          <Legend
            formatter={(value: string) =>
              statsMap.get(value)?.country.name ?? value
            }
            wrapperStyle={{ fontSize: 11 }}
          />
          {selectedCountries.map((iso3, i) => (
            <Line
              key={iso3}
              type="monotone"
              dataKey={iso3}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 2 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ComparisonPanel({
  statsMap,
  selectedCountries,
  onClose,
  onRemove,
}: Props) {
  return (
    <div className="w-full h-full min-h-0 max-h-full bg-slate-800/95 dark:bg-slate-800/95 backdrop-blur rounded-xl shadow-xl border border-slate-600/50 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-600/50">
        <h2 className="text-lg font-semibold text-white">
          Comparing {selectedCountries.length} Countries
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-600/50 transition-colors"
          aria-label="Close"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="px-4 py-2 flex flex-wrap gap-2 border-b border-slate-700/50">
        {selectedCountries.map((iso3, i) => {
          const name = statsMap.get(iso3)?.country.name ?? iso3;
          return (
            <span
              key={iso3}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-white"
              style={{ backgroundColor: COLORS[i % COLORS.length] + "33", borderColor: COLORS[i % COLORS.length], borderWidth: 1 }}
            >
              {name}
              <button
                type="button"
                onClick={() => onRemove(iso3)}
                className="ml-0.5 hover:text-red-400"
              >
                ×
              </button>
            </span>
          );
        })}
      </div>
      <div className="p-4 overflow-y-auto flex-1 min-h-0 space-y-5">
        {(Object.keys(METRIC_LABELS) as MetricType[]).map((metric) => (
          <ComparisonChart
            key={metric}
            metric={metric}
            statsMap={statsMap}
            selectedCountries={selectedCountries}
          />
        ))}
      </div>
    </div>
  );
}
