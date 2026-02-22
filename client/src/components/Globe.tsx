import { useCallback, useState } from "react";
import Globe from "react-globe.gl";
const WORLD_GEOJSON =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";

type GlobeFeature = {
  type?: string;
  id?: string;
  properties?: { name?: string; NAME?: string; ISO_A3?: string; iso_a3?: string };
  geometry?: unknown;
};

function getISO3(d: GlobeFeature): string {
  const id = d.id ?? d.properties?.ISO_A3 ?? d.properties?.iso_a3 ?? "";
  return typeof id === "string" ? id : "";
}

function getCountryName(d: GlobeFeature): string {
  return d.properties?.name ?? d.properties?.NAME ?? getISO3(d) ?? "Unknown";
}

type GlobeViewProps = {
  polygonsData: GlobeFeature[];
  hoveredFeature: GlobeFeature | null;
  selectedISO3: string | null;
  onPolygonHover: (feature: GlobeFeature | null) => void;
  onPolygonClick: (feature: GlobeFeature) => void;
};

export function GlobeView({
  polygonsData,
  hoveredFeature,
  selectedISO3,
  onPolygonHover,
  onPolygonClick,
}: GlobeViewProps) {
  const polygonCapColor = useCallback(
    (d: GlobeFeature) => {
      const iso = getISO3(d);
      if (iso === selectedISO3) return "rgba(34, 197, 94, 0.9)";
      if (d === hoveredFeature) return "rgba(59, 130, 246, 0.8)";
      return "rgba(30, 58, 138, 0.7)";
    },
    [hoveredFeature, selectedISO3]
  );

  const polygonSideColor = useCallback(() => "rgba(0, 0, 0, 0.1)", []);
  const polygonStrokeColor = useCallback(() => "rgba(255,255,255,0.15)", []);
  const polygonAltitude = useCallback(
    (d: GlobeFeature) => (d === hoveredFeature || getISO3(d) === selectedISO3 ? 0.08 : 0.04),
    [hoveredFeature, selectedISO3]
  );
  const polygonLabel = useCallback((d: GlobeFeature) => getCountryName(d), []);

  return (
    <div className="w-full h-full">
    <Globe
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
      bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
      backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
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
  const [hoveredFeature, setHoveredFeature] = useState<GlobeFeature | null>(null);
  const [selectedISO3, setSelectedISO3] = useState<string | null>(null);
  const [globeLoading, setGlobeLoading] = useState(true);
  const [globeError, setGlobeError] = useState<string | null>(null);

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
      const msg = e instanceof Error ? e.message : "Failed to load world map";
      setGlobeError(msg);
      console.error("Failed to load world GeoJSON", e);
    } finally {
      setGlobeLoading(false);
    }
  }, []);

  const onPolygonHover = useCallback((f: GlobeFeature | null) => {
    setHoveredFeature(f);
  }, []);

  const onPolygonClick = useCallback((f: GlobeFeature) => {
    const iso = getISO3(f);
    setSelectedISO3((prev) => (prev === iso ? null : iso));
  }, []);

  return {
    polygonsData,
    hoveredFeature,
    selectedISO3,
    setSelectedISO3,
    loadGeoJSON,
    onPolygonHover,
    onPolygonClick,
    getISO3,
    getCountryName,
    globeLoading,
    globeError,
  };
}
