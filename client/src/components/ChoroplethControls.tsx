import { METRIC_LABELS } from "../api/client";
import type { MetricType } from "../api/client";

const ENERGY_TRADE_METRICS: MetricType[] = [
  "energy_consumption",
  "exports",
  "imports",
];
const MINERAL_METRICS: MetricType[] = [
  "copper_production",
  "lithium_production",
  "cobalt_production",
  "rare_earth_production",
  "silicon_production",
  "nickel_production",
];

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
        className="bg-slate-700 text-slate-100 text-sm rounded border border-slate-600 outline-none cursor-pointer focus:ring-1 focus:ring-slate-500 [&>option]:bg-slate-800 [&>option]:text-slate-100"
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
          className="bg-slate-700 text-slate-100 text-sm rounded border border-slate-600 outline-none cursor-pointer focus:ring-1 focus:ring-slate-500 [&>option]:bg-slate-800 [&>option]:text-slate-100"
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
