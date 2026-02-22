import type { MetricType } from "../api/client";
import {
  METRIC_LABELS,
  ENERGY_TRADE_METRICS,
  MINERAL_METRICS,
  DATA_YEARS,
} from "../api/client";

type Props = {
  metric: MetricType | null;
  year: number;
  onMetricChange: (metric: MetricType | null) => void;
  onYearChange: (year: number) => void;
};

const selectClass =
  "bg-slate-700 text-slate-100 text-sm rounded border border-slate-600 outline-none cursor-pointer focus:ring-1 focus:ring-slate-500 [&>option]:bg-slate-800 [&>option]:text-slate-100";

export function ChoroplethControls({
  metric,
  year,
  onMetricChange,
  onYearChange,
}: Props) {
  return (
    <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur border border-slate-600/50 rounded-lg px-3 py-1.5 shadow-lg">
      <select
        value={metric ?? ""}
        onChange={(e) =>
          onMetricChange(
            e.target.value ? (e.target.value as MetricType) : null
          )
        }
        className={selectClass}
      >
        <option value="">No choropleth</option>
        <optgroup label="Energy & Trade">
          {ENERGY_TRADE_METRICS.map((key) => (
            <option key={key} value={key}>
              {METRIC_LABELS[key]}
            </option>
          ))}
        </optgroup>
        <optgroup label="Critical Minerals">
          {MINERAL_METRICS.map((key) => (
            <option key={key} value={key}>
              {METRIC_LABELS[key]}
            </option>
          ))}
        </optgroup>
      </select>
      {metric && (
        <select
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className={selectClass}
        >
          {DATA_YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
