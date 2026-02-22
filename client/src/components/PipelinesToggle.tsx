import { useState } from "react";
import {
  PIPELINE_TYPE_COLORS,
  PIPELINE_TYPE_LABELS,
  PIPELINE_STATUS_LABELS,
} from "../api/client";
import type { PipelineType, PipelineStatus } from "../api/client";

type Props = {
  active: boolean;
  onToggle: () => void;
};

const TYPES: PipelineType[] = ["oil", "gas", "products", "lng"];
const STATUSES: { key: PipelineStatus; dot: string }[] = [
  { key: "operational", dot: "#22c55e" },
  { key: "under_construction", dot: "#eab308" },
  { key: "planned", dot: "#60a5fa" },
  { key: "decommissioned", dot: "#6b7280" },
];

export function PipelinesToggle({ active, onToggle }: Props) {
  const [showLegend, setShowLegend] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        onMouseEnter={() => active && setShowLegend(true)}
        onMouseLeave={() => setShowLegend(false)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all duration-200 backdrop-blur shadow-lg ${
          active
            ? "bg-red-500/20 border-red-500/50 text-red-300 hover:bg-red-500/30"
            : "bg-slate-800/80 border-slate-600/50 text-slate-400 hover:text-slate-200 hover:border-slate-500/50"
        }`}
      >
        <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
          <path
            d="M2 8h4M10 8h4M6 6l4 4M6 10l4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          {active && (
            <path
              d="M1 8h14"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.3"
            />
          )}
        </svg>
        Pipelines
      </button>

      {showLegend && (
        <div className="absolute top-full left-0 mt-2 p-3 bg-slate-800/95 backdrop-blur border border-slate-600/50 rounded-lg shadow-xl z-30 min-w-[180px]">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-semibold">
            Pipeline Types
          </div>
          <div className="flex flex-col gap-1.5 mb-3">
            {TYPES.map((type) => (
              <div key={type} className="flex items-center gap-2">
                <span
                  className="w-5 h-0.5 rounded-full shrink-0"
                  style={{ backgroundColor: PIPELINE_TYPE_COLORS[type] }}
                />
                <span className="text-xs text-slate-300 whitespace-nowrap">
                  {PIPELINE_TYPE_LABELS[type]}
                </span>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-semibold">
            Status
          </div>
          <div className="flex flex-col gap-1.5">
            {STATUSES.map(({ key, dot }) => (
              <div key={key} className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: dot }}
                />
                <span className="text-xs text-slate-300 whitespace-nowrap">
                  {PIPELINE_STATUS_LABELS[key]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
