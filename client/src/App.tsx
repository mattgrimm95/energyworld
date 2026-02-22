import { useEffect, useState } from "react";
import { GlobeView, useGlobeData } from "./components/Globe";
import { CountryPanel } from "./components/CountryPanel";
import { fetchStats, type StatsResponse } from "./api/client";

export default function App() {
  const {
    polygonsData,
    hoveredFeature,
    selectedISO3,
    setSelectedISO3,
    loadGeoJSON,
    onPolygonHover,
    onPolygonClick,
    getCountryName,
    globeLoading,
    globeError,
  } = useGlobeData();

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    loadGeoJSON();
  }, [loadGeoJSON]);

  useEffect(() => {
    if (!selectedISO3) {
      setStats(null);
      setStatsError(null);
      return;
    }
    setStatsLoading(true);
    setStatsError(null);
    fetchStats(selectedISO3)
      .then(setStats)
      .catch((e) => setStatsError(e instanceof Error ? e.message : "Failed to load stats"))
      .finally(() => setStatsLoading(false));
  }, [selectedISO3]);

  const countryName = selectedISO3 && hoveredFeature
    ? getCountryName(hoveredFeature)
    : stats?.country.name ?? (selectedISO3 ?? "");

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden flex flex-col md:flex-row">
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
          selectedISO3={selectedISO3}
          onPolygonHover={onPolygonHover}
          onPolygonClick={onPolygonClick}
        />
      </div>
      {selectedISO3 && (
        <div className="md:absolute md:top-4 md:right-4 md:w-80 md:max-w-none md:max-h-[calc(100vh-2rem)] w-full max-h-[45vh] md:max-h-none shrink-0">
          <CountryPanel
            countryName={stats?.country.name ?? countryName}
            iso3={selectedISO3}
            stats={stats}
            loading={statsLoading}
            error={statsError}
            onClose={() => setSelectedISO3(null)}
          />
        </div>
      )}
    </div>
  );
}
