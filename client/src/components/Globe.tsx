import { useCallback, useMemo, useState } from "react";
import Globe from "react-globe.gl";
import type { MetricType, ChoroplethRow } from "../api/client";

const WORLD_GEOJSON =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";

export type GlobeFeature = {
  type?: string;
  id?: string;
  properties?: {
    name?: string;
    NAME?: string;
    ISO_A3?: string;
    iso_a3?: string;
    ISO_A3_EH?: string;
  };
  geometry?: unknown;
};

export function getISO3(d: GlobeFeature): string {
  const id =
    d.properties?.ISO_A3_EH ??
    d.properties?.ISO_A3 ??
    d.properties?.iso_a3 ??
    d.id ??
    "";
  return typeof id === "string" && id !== "-99" ? id : "";
}

export function getCountryName(d: GlobeFeature): string {
  return d.properties?.name ?? d.properties?.NAME ?? getISO3(d) ?? "Unknown";
}

const CHOROPLETH_SCALES: Record<MetricType, [number, number]> = {
  energy_consumption: [0, 45000],
  exports: [0, 3600],
  imports: [0, 3400],
};

function choroplethColor(
  value: number | undefined,
  metric: MetricType
): string {
  if (value == null) return "rgba(30, 41, 59, 0.5)";
  const [min, max] = CHOROPLETH_SCALES[metric];
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const r = Math.round(30 + t * 225);
  const g = Math.round(120 - t * 80);
  const b = Math.round(200 - t * 160);
  return `rgba(${r}, ${g}, ${b}, 0.85)`;
}

type GlobeViewProps = {
  polygonsData: GlobeFeature[];
  hoveredFeature: GlobeFeature | null;
  selectedCountries: string[];
  onPolygonHover: (feature: GlobeFeature | null) => void;
  onPolygonClick: (feature: GlobeFeature, event: MouseEvent) => void;
  choroplethMetric: MetricType | null;
  choroplethMap: Map<string, number>;
  isDark: boolean;
};

export function GlobeView({
  polygonsData,
  hoveredFeature,
  selectedCountries,
  onPolygonHover,
  onPolygonClick,
  choroplethMetric,
  choroplethMap,
  isDark,
}: GlobeViewProps) {
  const polygonCapColor = useCallback(
    (d: GlobeFeature) => {
      const iso = getISO3(d);
      if (selectedCountries.includes(iso)) return "rgba(34, 197, 94, 0.9)";
      if (d === hoveredFeature) return "rgba(59, 130, 246, 0.8)";
      if (choroplethMetric) {
        return choroplethColor(choroplethMap.get(iso), choroplethMetric);
      }
      return isDark ? "rgba(30, 58, 138, 0.7)" : "rgba(100, 140, 200, 0.7)";
    },
    [hoveredFeature, selectedCountries, choroplethMetric, choroplethMap, isDark]
  );

  const polygonSideColor = useCallback(() => "rgba(0, 0, 0, 0.1)", []);
  const polygonStrokeColor = useCallback(
    () => (isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"),
    [isDark]
  );
  const polygonAltitude = useCallback(
    (d: GlobeFeature) =>
      d === hoveredFeature || selectedCountries.includes(getISO3(d))
        ? 0.08
        : 0.04,
    [hoveredFeature, selectedCountries]
  );
  const polygonLabel = useCallback(
    (d: GlobeFeature) => {
      const name = getCountryName(d);
      if (choroplethMetric) {
        const val = choroplethMap.get(getISO3(d));
        if (val != null) return `${name}: ${val.toLocaleString()}`;
      }
      return name;
    },
    [choroplethMetric, choroplethMap]
  );

  return (
    <div className="w-full h-full">
      <Globe
        globeImageUrl={
          isDark
            ? "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            : "//unpkg.com/three-globe/example/img/earth-day.jpg"
        }
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl={
          isDark
            ? "//unpkg.com/three-globe/example/img/night-sky.png"
            : undefined
        }
        backgroundColor={isDark ? "#0f172a" : "#dbeafe"}
        polygonsData={polygonsData}
        polygonCapColor={polygonCapColor}
        polygonSideColor={polygonSideColor}
        polygonStrokeColor={polygonStrokeColor}
        polygonAltitude={polygonAltitude}
        polygonLabel={polygonLabel}
        onPolygonHover={onPolygonHover}
        onPolygonClick={onPolygonClick}
        polygonsTransitionDuration={300}
        rendererConfig={{ antialias: false }}
      />
    </div>
  );
}

export function useGlobeData() {
  const [polygonsData, setPolygonsData] = useState<GlobeFeature[]>([]);
  const [hoveredFeature, setHoveredFeature] = useState<GlobeFeature | null>(
    null
  );
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [globeLoading, setGlobeLoading] = useState(true);
  const [globeError, setGlobeError] = useState<string | null>(null);
  const [choroplethData, setChoroplethData] = useState<ChoroplethRow[]>([]);

  const choroplethMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const row of choroplethData) {
      m.set(row.iso3, row.value);
    }
    return m;
  }, [choroplethData]);

  const loadGeoJSON = useCallback(async () => {
    setGlobeLoading(true);
    setGlobeError(null);
    try {
      const res = await fetch(WORLD_GEOJSON);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const features: GlobeFeature[] = json.features ?? json;
      setPolygonsData(Array.isArray(features) ? features : []);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Failed to load world map";
      setGlobeError(msg);
      console.error("Failed to load world GeoJSON", e);
    } finally {
      setGlobeLoading(false);
    }
  }, []);

  const onPolygonHover = useCallback((f: GlobeFeature | null) => {
    setHoveredFeature(f);
  }, []);

  const onPolygonClick = useCallback(
    (f: GlobeFeature, event: MouseEvent) => {
      const iso = getISO3(f);
      if (!iso) return;
      if (event.shiftKey) {
        setSelectedCountries((prev) =>
          prev.includes(iso) ? prev.filter((c) => c !== iso) : [...prev, iso]
        );
      } else {
        setSelectedCountries((prev) =>
          prev.length === 1 && prev[0] === iso ? [] : [iso]
        );
      }
    },
    []
  );

  return {
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
  };
}
