import { useState, useRef, useEffect, useMemo } from "react";
import type { Country } from "../api/client";

type Props = {
  countries: Country[];
  onSelect: (iso3: string) => void;
};

export function CountrySearch({ countries, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return countries.slice(0, 10);
    const q = query.toLowerCase();
    return countries
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.iso3.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [countries, query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex items-center gap-1.5 bg-slate-800/80 dark:bg-slate-800/80 backdrop-blur border border-slate-600/50 rounded-lg px-3 py-1.5 shadow-lg">
        <svg
          className="w-4 h-4 text-slate-400 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search country…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="bg-transparent text-sm text-white placeholder-slate-400 outline-none w-40"
        />
      </div>
      {open && filtered.length > 0 && (
        <ul className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto bg-slate-800 dark:bg-slate-800 border border-slate-600/50 rounded-lg shadow-xl z-50">
          {filtered.map((c) => (
            <li key={c.iso3}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                onClick={() => {
                  onSelect(c.iso3);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <span className="font-medium">{c.name}</span>{" "}
                <span className="text-slate-500">{c.iso3}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
