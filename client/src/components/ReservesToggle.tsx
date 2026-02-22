import { useState } from "react";
import { RESERVE_TYPE_COLORS, RESERVE_TYPE_LABELS } from "../api/client";
import type { ReserveType } from "../api/client";

type Props = {
  active: boolean;
  onToggle: () => void;
};

const TYPES: ReserveType[] = ["oil", "natural_gas", "coal", "oil_sands", "shale"];

export function ReservesToggle({ active, onToggle }: Props) {
  const [showLegend, setShowLegend] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        onMouseEnter={() => active && setShowLegend(true)}
        onMouseLeave={() => setShowLegend(false)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all duration-200 backdrop-blur shadow-lg ${
          active
            ? "bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30"
            : "bg-slate-800/80 border-slate-600/50 text-slate-400 hover:text-slate-200 hover:border-slate-500/50"
        }`}
      >
        <svg
          viewBox="0 0 16 16"
          fill="currentColor"
          className="w-3.5 h-3.5"
        >
          <circle cx="8" cy="8" r="3" />
          {active && (
            <>
              <circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
              <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.25" />
            </>
          )}
        </svg>
        Reserves
      </button>

      {showLegend && (
        <div className="absolute top-full left-0 mt-2 p-3 bg-slate-800/95 backdrop-blur border border-slate-600/50 rounded-lg shadow-xl z-30 min-w-[160px]">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-semibold">
            Reserve Types
          </div>
          <div className="flex flex-col gap-1.5">
            {TYPES.map((type) => (
              <div key={type} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: RESERVE_TYPE_COLORS[type] }}
                />
                <span className="text-xs text-slate-300 whitespace-nowrap">
                  {RESERVE_TYPE_LABELS[type]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
