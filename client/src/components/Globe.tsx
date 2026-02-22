import { useCallback, useMemo, useState } from "react";
import Globe from "react-globe.gl";
import type {
  MetricType,
  ChoroplethRow,
  EnergyReserve,
  ReserveType,
  Pipeline,
  PipelineType,
} from "../api/client";
import {
  RESERVE_TYPE_COLORS,
  RESERVE_TYPE_LABELS,
  PIPELINE_TYPE_COLORS,
  PIPELINE_STATUS_LABELS,
  PIPELINE_TYPE_LABELS,
} from "../api/client";

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
  copper_production: [0, 6000],
  lithium_production: [0, 61000],
  cobalt_production: [0, 130000],
  rare_earth_production: [0, 210000],
  silicon_production: [0, 5500],
  nickel_production: [0, 1600],
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
  reserves: EnergyReserve[];
  showReserves: boolean;
  pipelines: Pipeline[];
  showPipelines: boolean;
};

function reservePointColor(r: EnergyReserve): string {
  return RESERVE_TYPE_COLORS[r.type as ReserveType] ?? "#f59e0b";
}

function reserveLabel(r: EnergyReserve): string {
  const typeLabel = RESERVE_TYPE_LABELS[r.type as ReserveType] ?? r.type;
  const est =
    r.estimatedReserves != null
      ? `<div style="margin-top:2px;font-size:11px;opacity:0.85">${r.estimatedReserves.toLocaleString()} ${r.unit ?? ""}</div>`
      : "";
  const color = RESERVE_TYPE_COLORS[r.type as ReserveType] ?? "#f59e0b";
  return `<div style="padding:6px 10px;background:rgba(15,23,42,0.92);border:1px solid ${color}40;border-radius:8px;backdrop-filter:blur(8px);min-width:120px">
    <div style="font-size:12px;font-weight:600;color:#f8fafc">${r.name}</div>
    <div style="font-size:10px;color:${color};margin-top:1px;text-transform:uppercase;letter-spacing:0.5px">${typeLabel}</div>
    ${est}
    <div style="font-size:10px;color:#94a3b8;margin-top:2px">${r.country}</div>
  </div>`;
}

function reserveRadius(r: EnergyReserve, enlarged: boolean): number {
  const base = enlarged ? 1.5 : 1.0;
  if (r.estimatedReserves == null) return 0.3 * base;
  if (r.type === "natural_gas")
    return Math.min(0.8, 0.3 + (r.estimatedReserves / 1800) * 0.5) * base;
  if (r.type === "coal")
    return Math.min(0.8, 0.3 + (r.estimatedReserves / 200) * 0.5) * base;
  return Math.min(0.8, 0.3 + (r.estimatedReserves / 50) * 0.5) * base;
}

// ── Pipeline helpers ──

function pipelineColor(p: Pipeline): string {
  return PIPELINE_TYPE_COLORS[p.type as PipelineType] ?? "#ef4444";
}

function pipelineLabel(p: Pipeline): string {
  const color = pipelineColor(p);
  const typeLabel = PIPELINE_TYPE_LABELS[p.type as PipelineType] ?? p.type;
  const statusLabel =
    PIPELINE_STATUS_LABELS[p.status as keyof typeof PIPELINE_STATUS_LABELS] ??
    p.status;
  const cap =
    p.capacityValue != null
      ? `<div style="margin-top:2px;font-size:11px;opacity:0.85">${p.capacityValue.toLocaleString()} ${p.capacityUnit ?? ""}</div>`
      : "";
  const len =
    p.lengthKm != null
      ? `<div style="font-size:10px;opacity:0.7">${p.lengthKm.toLocaleString()} km</div>`
      : "";
  const yr = p.yearBuilt ? ` (${p.yearBuilt})` : "";
  const statusDot =
    p.status === "operational"
      ? "#22c55e"
      : p.status === "under_construction"
        ? "#eab308"
        : p.status === "decommissioned"
          ? "#6b7280"
          : "#60a5fa";

  return `<div style="padding:6px 10px;background:rgba(15,23,42,0.92);border:1px solid ${color}40;border-radius:8px;backdrop-filter:blur(8px);min-width:140px;pointer-events:none">
    <div style="font-size:12px;font-weight:600;color:#f8fafc">${p.name}</div>
    <div style="display:flex;align-items:center;gap:4px;margin-top:2px">
      <span style="width:6px;height:6px;border-radius:50%;background:${statusDot};display:inline-block"></span>
      <span style="font-size:10px;color:#94a3b8">${statusLabel}${yr}</span>
    </div>
    <div style="font-size:10px;color:${color};margin-top:1px;text-transform:uppercase;letter-spacing:0.5px">${typeLabel}</div>
    ${cap}${len}
    <div style="font-size:10px;color:#94a3b8;margin-top:2px">${p.countries}</div>
  </div>`;
}

function pipelineStroke(p: Pipeline): number {
  if (p.status === "decommissioned") return 1.5;
  if (p.status === "planned" || p.status === "under_construction") return 2.5;
  return 3.5;
}

const NOOP_HOVER = () => {};
const NOOP_CLICK = () => {};

export function GlobeView({
  polygonsData,
  hoveredFeature,
  selectedCountries,
  onPolygonHover,
  onPolygonClick,
  choroplethMetric,
  choroplethMap,
  isDark,
  reserves,
  showReserves,
  pipelines,
  showPipelines,
}: GlobeViewProps) {
  const overlayActive = showReserves || showPipelines;

  const polygonCapColor = useCallback(
    (d: GlobeFeature) => {
      const iso = getISO3(d);
      if (selectedCountries.includes(iso)) return "rgba(34, 197, 94, 0.9)";
      if (!overlayActive && d === hoveredFeature)
        return "rgba(59, 130, 246, 0.8)";
      if (choroplethMetric) {
        return choroplethColor(choroplethMap.get(iso), choroplethMetric);
      }
      if (overlayActive) {
        return isDark
          ? "rgba(30, 58, 138, 0.35)"
          : "rgba(100, 140, 200, 0.35)";
      }
      return isDark ? "rgba(30, 58, 138, 0.7)" : "rgba(100, 140, 200, 0.7)";
    },
    [
      hoveredFeature,
      selectedCountries,
      choroplethMetric,
      choroplethMap,
      isDark,
      overlayActive,
    ]
  );

  const polygonSideColor = useCallback(() => "rgba(0, 0, 0, 0.1)", []);
  const polygonStrokeColor = useCallback(
    () => (isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"),
    [isDark]
  );
  const polygonAltitude = useCallback(
    (d: GlobeFeature) => {
      if (overlayActive) return 0.01;
      return d === hoveredFeature || selectedCountries.includes(getISO3(d))
        ? 0.08
        : 0.04;
    },
    [hoveredFeature, selectedCountries, overlayActive]
  );
  const polygonLabel = useCallback(
    (d: GlobeFeature) => {
      if (overlayActive) return "";
      const name = getCountryName(d);
      if (choroplethMetric) {
        const val = choroplethMap.get(getISO3(d));
        if (val != null) return `${name}: ${val.toLocaleString()}`;
      }
      return name;
    },
    [choroplethMetric, choroplethMap, overlayActive]
  );

  // ── Reserve layers ──
  const pointsData = useMemo(
    () => (showReserves ? reserves : []),
    [showReserves, reserves]
  );
  const ringsData = useMemo(
    () => (showReserves ? reserves : []),
    [showReserves, reserves]
  );

  const pointColor = useCallback(
    (d: object) => reservePointColor(d as EnergyReserve),
    []
  );
  const pointLabel = useCallback(
    (d: object) => reserveLabel(d as EnergyReserve),
    []
  );
  const pointRadiusFn = useCallback(
    (d: object) => reserveRadius(d as EnergyReserve, true),
    []
  );
  const ringColor = useCallback((d: object) => {
    const color = reservePointColor(d as EnergyReserve);
    return (t: number) =>
      `${color}${Math.round((1 - t) * 120)
        .toString(16)
        .padStart(2, "0")}`;
  }, []);

  // ── Pipeline layers ──
  const pathsData = useMemo(
    () => (showPipelines ? pipelines : []),
    [showPipelines, pipelines]
  );

  const pathPointsFn = useCallback((d: object) => (d as Pipeline).path, []);
  const pathColorFn = useCallback(
    (d: object) => {
      const p = d as Pipeline;
      const base = pipelineColor(p);
      if (p.status === "decommissioned") return `${base}99`;
      if (p.status === "planned" || p.status === "under_construction")
        return `${base}cc`;
      return base;
    },
    []
  );
  const pathLabelFn = useCallback(
    (d: object) => pipelineLabel(d as Pipeline),
    []
  );
  const pathStrokeFn = useCallback(
    (d: object) => pipelineStroke(d as Pipeline),
    []
  );
  const pathDashLength = useCallback(
    (d: object) => {
      const p = d as Pipeline;
      if (p.status === "planned" || p.status === "under_construction")
        return 0.3;
      if (p.status === "decommissioned") return 0.2;
      return 1;
    },
    []
  );
  const pathDashGap = useCallback(
    (d: object) => {
      const p = d as Pipeline;
      if (p.status === "planned" || p.status === "under_construction")
        return 0.15;
      if (p.status === "decommissioned") return 0.1;
      return 0.05;
    },
    []
  );

  const effectivePolygonHover = overlayActive ? NOOP_HOVER : onPolygonHover;
  const effectivePolygonClick = overlayActive ? NOOP_CLICK : onPolygonClick;

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
        onPolygonHover={effectivePolygonHover}
        onPolygonClick={effectivePolygonClick}
        polygonsTransitionDuration={300}
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointColor={pointColor}
        pointAltitude={0.08}
        pointRadius={pointRadiusFn}
        pointLabel={pointLabel}
        pointsMerge={false}
        pointsTransitionDuration={500}
        ringsData={ringsData}
        ringLat="lat"
        ringLng="lng"
        ringColor={ringColor}
        ringMaxRadius={2.5}
        ringPropagationSpeed={0.6}
        ringRepeatPeriod={2500}
        pathsData={pathsData}
        pathPoints={pathPointsFn}
        pathPointAlt={0.015}
        pathColor={pathColorFn}
        pathLabel={pathLabelFn}
        pathStroke={pathStrokeFn}
        pathDashLength={pathDashLength}
        pathDashGap={pathDashGap}
        pathDashAnimateTime={showPipelines ? 8000 : 0}
        pathTransitionDuration={600}
        pathResolution={4}
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
