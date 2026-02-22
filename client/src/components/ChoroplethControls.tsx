import { METRIC_LABELS } from "../api/client";
import type { MetricType } from "../api/client";

type Props = {
  metric: MetricType | null;
  year: number;
  onMetricChange: (metric: MetricType | null) => void;
  onYearChange: (year: number) => void;
};

const YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022];

export function ChoroplethControls({
  metric,
  year,
  onMetricChange,
  onYearChange,
}: Props) {
  return (
    <div className="flex items-center gap-2 bg-slate-800/80 dark:bg-slate-800/80 backdrop-blur border border-slate-600/50 rounded-lg px-3 py-1.5 shadow-lg">
      <select
        value={metric ?? ""}
        onChange={(e) =>
          onMetricChange(
            e.target.value ? (e.target.value as MetricType) : null
          )
        }
        className="bg-transparent text-sm text-white outline-none cursor-pointer [&>option]:bg-slate-800"
      >
        <option value="">No choropleth</option>
        {(Object.entries(METRIC_LABELS) as [MetricType, string][]).map(
          ([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          )
        )}
      </select>
      {metric && (
        <select
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="bg-transparent text-sm text-white outline-none cursor-pointer [&>option]:bg-slate-800"
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
