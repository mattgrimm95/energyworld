import { useEffect, useState, useCallback } from "react";
import { GlobeView, useGlobeData, getCountryName } from "./components/Globe";
import { CountryPanel } from "./components/CountryPanel";
import { ComparisonPanel } from "./components/ComparisonPanel";
import { CountrySearch } from "./components/CountrySearch";
import { ChoroplethControls } from "./components/ChoroplethControls";
import { ThemeToggle } from "./components/ThemeToggle";
import {
  fetchCountries,
  fetchStats,
  fetchChoropleth,
  fetchReserves,
  type Country,
  type StatsResponse,
  type MetricType,
  type EnergyReserve,
} from "./api/client";
import { ReservesToggle } from "./components/ReservesToggle";

function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  return { isDark, toggleTheme: () => setIsDark((v) => !v) };
}

export default function App() {
  const {
    polygonsData,
    hoveredFeature,
    selectedCountries,
    setSelectedCountries,
    loadGeoJSON,
    onPolygonHover,
    onPolygonClick,
    globeLoading,
    globeError,
    setChoroplethData,
    choroplethMap,
  } = useGlobeData();

  const { isDark, toggleTheme } = useTheme();

  const [countries, setCountries] = useState<Country[]>([]);
  const [statsMap, setStatsMap] = useState<Map<string, StatsResponse>>(
    new Map()
  );
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [choroplethMetric, setChoroplethMetric] =
    useState<MetricType | null>(null);
  const [choroplethYear, setChoroplethYear] = useState(2022);

  const [reserves, setReserves] = useState<EnergyReserve[]>([]);
  const [showReserves, setShowReserves] = useState(false);

  useEffect(() => {
    loadGeoJSON();
    fetchCountries()
      .then(setCountries)
      .catch(() => {});
    fetchReserves()
      .then(setReserves)
      .catch(() => setReserves([]));
  }, [loadGeoJSON]);

  // Fetch choropleth data when metric/year changes
  useEffect(() => {
    if (!choroplethMetric) {
      setChoroplethData([]);
      return;
    }
    fetchChoropleth(choroplethMetric, choroplethYear)
      .then((res) => setChoroplethData(res.data))
      .catch(() => setChoroplethData([]));
  }, [choroplethMetric, choroplethYear, setChoroplethData]);

  // Fetch stats for each selected country
  useEffect(() => {
    if (selectedCountries.length === 0) {
      setStatsMap(new Map());
      setStatsError(null);
      return;
    }

    setStatsLoading(true);
    setStatsError(null);

    const newCodes = selectedCountries.filter((c) => !statsMap.has(c));
    if (newCodes.length === 0) {
      setStatsLoading(false);
      return;
    }

    Promise.all(newCodes.map((iso3) => fetchStats(iso3)))
      .then((results) => {
        setStatsMap((prev) => {
          const next = new Map(prev);
          for (const r of results) {
            next.set(r.country.iso3, r);
          }
          // Remove deselected
          for (const key of next.keys()) {
            if (!selectedCountries.includes(key)) next.delete(key);
          }
          return next;
        });
      })
      .catch((e) =>
        setStatsError(
          e instanceof Error ? e.message : "Failed to load stats"
        )
      )
      .finally(() => setStatsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountries]);

  const handleSearchSelect = useCallback(
    (iso3: string) => {
      setSelectedCountries([iso3]);
    },
    [setSelectedCountries]
  );

  const handleRemoveCountry = useCallback(
    (iso3: string) => {
      setSelectedCountries((prev) => prev.filter((c) => c !== iso3));
      setStatsMap((prev) => {
        const next = new Map(prev);
        next.delete(iso3);
        return next;
      });
    },
    [setSelectedCountries]
  );

  const handleClosePanel = useCallback(() => {
    setSelectedCountries([]);
    setStatsMap(new Map());
  }, [setSelectedCountries]);

  const singleSelected =
    selectedCountries.length === 1 ? selectedCountries[0] : null;
  const singleStats = singleSelected ? statsMap.get(singleSelected) : null;

  const countryName = singleSelected
    ? singleStats?.country.name ??
      (hoveredFeature
        ? getCountryName(hoveredFeature)
        : singleSelected)
    : "";

  const showComparison = selectedCountries.length > 1;

  return (
    <div
      className={`relative w-full h-screen overflow-hidden flex flex-col md:flex-row ${
        isDark ? "bg-slate-900" : "bg-blue-50"
      }`}
    >
      {/* Globe area */}
      <div className="relative flex-1 min-h-[50vh] md:min-h-0">
        {globeLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
            <div className="text-slate-400 text-sm">Loading globe…</div>
          </div>
        )}
        {globeError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
            <p className="text-red-400 text-sm">{globeError}</p>
          </div>
        )}
        <GlobeView
          polygonsData={polygonsData}
          hoveredFeature={hoveredFeature}
          selectedCountries={selectedCountries}
          onPolygonHover={onPolygonHover}
          onPolygonClick={onPolygonClick}
          choroplethMetric={choroplethMetric}
          choroplethMap={choroplethMap}
          isDark={isDark}
          reserves={reserves}
          showReserves={showReserves}
        />

        {/* Top toolbar */}
        <div className="absolute top-4 left-4 flex items-center gap-2 z-20 flex-wrap">
          <CountrySearch
            countries={countries}
            onSelect={handleSearchSelect}
          />
          <ChoroplethControls
            metric={choroplethMetric}
            year={choroplethYear}
            onMetricChange={setChoroplethMetric}
            onYearChange={setChoroplethYear}
          />
          <ReservesToggle
            active={showReserves}
            onToggle={() => setShowReserves((v) => !v)}
          />
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </div>

        {/* Shift-click hint */}
        {selectedCountries.length === 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
            <span className="text-xs text-slate-400 bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-600/50">
              Shift+click to compare countries
            </span>
          </div>
        )}
      </div>

      {/* Side panel */}
      {selectedCountries.length > 0 && (
        <div className="md:absolute md:top-4 md:right-4 md:w-96 md:max-w-none md:max-h-[calc(100vh-2rem)] w-full max-h-[45vh] md:max-h-none shrink-0 z-20">
          {showComparison ? (
            <ComparisonPanel
              statsMap={statsMap}
              selectedCountries={selectedCountries}
              onClose={handleClosePanel}
              onRemove={handleRemoveCountry}
            />
          ) : (
            <CountryPanel
              countryName={countryName}
              iso3={singleSelected!}
              stats={singleStats ?? null}
              loading={statsLoading}
              error={statsError}
              onClose={handleClosePanel}
            />
          )}
        </div>
      )}
    </div>
  );
}
