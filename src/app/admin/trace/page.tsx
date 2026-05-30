"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { lots } from "@/data/lots";

// Coordinate space matches the plan image: 4682×3311 px → normalized to 100×70.72
const SVG_W = 100;
const SVG_H = 70.72;
const LS_KEY = "aglir_trace_polygons";

type Point = { x: number; y: number };
type Tf = { scale: number; x: number; y: number };
type LotTrace = { points: Point[]; closed: boolean };
type StoredTraces = Record<string, LotTrace>;

function loadTraces(): StoredTraces {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as StoredTraces) : {};
  } catch {
    return {};
  }
}

function saveTrace(id: string, points: Point[], closed: boolean) {
  try {
    const all = loadTraces();
    all[id] = { points, closed };
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch {
    // localStorage unavailable (SSR, private mode)
  }
}

export default function TracePage() {
  if (process.env.NODE_ENV !== "development") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper">
        <p className="text-base font-bold text-stone-700">
          Esta herramienta solo está disponible en desarrollo.
        </p>
      </main>
    );
  }
  return <TraceCanvas />;
}

function TraceCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  // No system action modifies tf — viewport movement is 100% manual (wheel, drag, pinch)
  const [tf, setTf] = useState<Tf>({ scale: 1, x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState(lots[0]?.id ?? "m2-s1");
  const [points, setPoints] = useState<Point[]>([]);
  const [closed, setClosed] = useState(false);
  const [copied, setCopied] = useState(false);
  // All saved traces for background display (other lots' closed polygons)
  const [allTraces, setAllTraces] = useState<StoredTraces>({});
  const [exportText, setExportText] = useState("");
  const [exportCopied, setExportCopied] = useState(false);

  // Load all traces from localStorage on mount — shows previously closed polygons
  useEffect(() => {
    setAllTraces(loadTraces());
  }, []);

  // Restore saved trace whenever the selected lot changes
  useEffect(() => {
    const saved = loadTraces()[selectedId];
    if (saved) {
      setPoints(saved.points);
      setClosed(saved.closed);
    } else {
      setPoints([]);
      setClosed(false);
    }
    setCopied(false);
  }, [selectedId]);

  // Persist to localStorage + sync allTraces for background display
  useEffect(() => {
    saveTrace(selectedId, points, closed);
    setAllTraces((prev) => ({ ...prev, [selectedId]: { points, closed } }));
  }, [selectedId, points, closed]);

  const isDragging = useRef(false);
  const dragMoved = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef<number | null>(null);
  const lastTouchMid = useRef<{ x: number; y: number } | null>(null);

  const clamp = useCallback((scale: number, x: number, y: number): Tf => {
    const el = containerRef.current;
    if (!el) return { scale, x, y };
    const s = Math.min(12, Math.max(1, scale));
    return {
      scale: s,
      x: Math.min(0, Math.max(el.clientWidth * (1 - s), x)),
      y: Math.min(0, Math.max(el.clientHeight * (1 - s), y)),
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1 / 0.82 : 0.82;
      const rect = el!.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      setTf((prev) => {
        const ns = prev.scale * factor;
        return clamp(ns, cx - (cx - prev.x) * (ns / prev.scale), cy - (cy - prev.y) * (ns / prev.scale));
      });
    }

    function onMouseDown(e: MouseEvent) {
      isDragging.current = true;
      dragMoved.current = false;
      lastPointer.current = { x: e.clientX, y: e.clientY };
    }

    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current) return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragMoved.current = true;
        el!.style.cursor = "grabbing";
      }
      lastPointer.current = { x: e.clientX, y: e.clientY };
      setTf((prev) => clamp(prev.scale, prev.x + dx, prev.y + dy));
    }

    function onMouseUp() {
      isDragging.current = false;
      el!.style.cursor = "crosshair";
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDist.current = Math.hypot(dx, dy);
        lastTouchMid.current = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
      } else {
        dragMoved.current = false;
        lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }

    function onTouchMove(e: TouchEvent) {
      e.preventDefault();
      if (e.touches.length === 2 && lastTouchDist.current !== null && lastTouchMid.current !== null) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newDist = Math.hypot(dx, dy);
        const newMid = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
        const ratio = newDist / lastTouchDist.current;
        const rect = el!.getBoundingClientRect();
        const cx = lastTouchMid.current.x - rect.left;
        const cy = lastTouchMid.current.y - rect.top;
        const panDx = newMid.x - lastTouchMid.current.x;
        const panDy = newMid.y - lastTouchMid.current.y;
        setTf((prev) => {
          const ns = prev.scale * ratio;
          return clamp(ns, cx - (cx - prev.x) * (ns / prev.scale) + panDx, cy - (cy - prev.y) * (ns / prev.scale) + panDy);
        });
        lastTouchDist.current = newDist;
        lastTouchMid.current = newMid;
      } else if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - lastPointer.current.x;
        const dy = e.touches[0].clientY - lastPointer.current.y;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMoved.current = true;
        lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        setTf((prev) => clamp(prev.scale, prev.x + dx, prev.y + dy));
      }
    }

    function onTouchEnd() {
      lastTouchDist.current = null;
      lastTouchMid.current = null;
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [clamp]);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (dragMoved.current || closed) {
      dragMoved.current = false;
      return;
    }
    dragMoved.current = false;

    const el = containerRef.current!;
    const rect = el.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const lx = (cx - tf.x) / tf.scale;
    const ly = (cy - tf.y) / tf.scale;

    const svgScale = Math.min(el.clientWidth / SVG_W, el.clientHeight / SVG_H);
    const svgLeft = (el.clientWidth - SVG_W * svgScale) / 2;
    const svgTop = (el.clientHeight - SVG_H * svgScale) / 2;

    const svgX = (lx - svgLeft) / svgScale;
    const svgY = (ly - svgTop) / svgScale;

    if (svgX < 0 || svgX > SVG_W || svgY < 0 || svgY > SVG_H) return;

    setPoints((prev) => [
      ...prev,
      { x: Math.round(svgX * 100) / 100, y: Math.round(svgY * 100) / 100 },
    ]);
  }

  // None of these handlers touch `tf` — viewport stays exactly where it is.
  function handleClosePolygon() {
    if (points.length >= 3) setClosed(true);
  }

  function handleCopy() {
    const text = JSON.stringify(points.map((p) => ({ x: p.x, y: p.y })));
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleReset() {
    setPoints([]);
    setClosed(false);
    setCopied(false);
    // tf is intentionally NOT reset here — zoom/pan must survive Limpiar
  }

  function handleSelectLot(id: string) {
    setSelectedId(id);
  }

  function buildPolygonMap(): string {
    const closed = Object.entries(allTraces)
      .filter(([, t]) => t.closed && t.points.length >= 3)
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));

    if (closed.length === 0) return "// Sin polígonos cerrados en localStorage";

    const date = new Date().toISOString().split("T")[0];
    const entries = closed
      .map(([id, t]) => `  "${id}": ${JSON.stringify(t.points)},`)
      .join("\n");

    return [
      `// Exportado desde /admin/trace — ${date} — ${closed.length} polígonos`,
      `// 1. Pegar en src/data/lots.ts antes de "export const lots"`,
      `// 2. En el map, cambiar:  polygon: []`,
      `//    por:                 polygon: polygonMap[\`m\${manzana}-s\${solar}\`] ?? []`,
      ``,
      `const polygonMap: Record<string, { x: number; y: number }[]> = {`,
      entries,
      `};`,
    ].join("\n");
  }

  function handleExport() {
    const text = buildPolygonMap();
    setExportText(text);
    navigator.clipboard.writeText(text).then(() => {
      setExportCopied(true);
      setTimeout(() => setExportCopied(false), 2000);
    });
  }

  const closedCount = Object.values(allTraces).filter(
    (t) => t.closed && t.points.length >= 3,
  ).length;

  const svgPointsStr = points.map((p) => `${p.x},${p.y}`).join(" ");
  const centroidX = points.length > 0 ? points.reduce((s, p) => s + p.x, 0) / points.length : 0;
  const centroidY = points.length > 0 ? points.reduce((s, p) => s + p.y, 0) / points.length : 0;
  const outputJson = JSON.stringify(points.map((p) => ({ x: p.x, y: p.y })));

  return (
    <main className="flex h-screen flex-col bg-stone-950 text-white">
      {/* ── Controls bar ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 border-b border-stone-700 bg-stone-900 px-4 py-2.5 text-sm">
        <span className="font-black text-stone-200">Trazado · Aglir</span>

        <select
          value={selectedId}
          onChange={(e) => handleSelectLot(e.target.value)}
          className="max-w-[220px] rounded bg-stone-700 px-2 py-1.5 text-white"
        >
          {lots.map((lot) => {
            const trace = allTraces[lot.id];
            const indicator = trace?.closed ? "✓ " : trace?.points?.length > 0 ? "· " : "";
            return (
              <option key={lot.id} value={lot.id}>
                {indicator}{lot.id} · M{lot.manzana} S{lot.solar}
                {lot.area_m2 > 0 ? ` (${lot.area_m2} m²)` : ""}
              </option>
            );
          })}
        </select>

        <span className="tabular-nums text-stone-400">{points.length} pts</span>

        <button
          type="button"
          onClick={handleClosePolygon}
          disabled={points.length < 3 || closed}
          className="rounded bg-emerald-700 px-3 py-1.5 font-semibold hover:bg-emerald-600 disabled:opacity-40"
        >
          Cerrar polígono
        </button>

        <button
          type="button"
          onClick={handleCopy}
          disabled={points.length === 0}
          className="rounded bg-sky-700 px-3 py-1.5 font-semibold hover:bg-sky-600 disabled:opacity-40"
        >
          {copied ? "✓ Copiado" : "Copiar"}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="rounded bg-stone-700 px-3 py-1.5 font-semibold hover:bg-stone-600"
        >
          Limpiar
        </button>

        <button
          type="button"
          onClick={handleExport}
          disabled={closedCount === 0}
          className="rounded bg-violet-700 px-3 py-1.5 font-semibold hover:bg-violet-600 disabled:opacity-40"
        >
          {exportCopied ? "✓ Copiado" : `Exportar todo (${closedCount})`}
        </button>

        {tf.scale > 1.05 && (
          <button
            type="button"
            onClick={() => setTf({ scale: 1, x: 0, y: 0 })}
            className="rounded bg-stone-700 px-3 py-1.5 text-xs font-semibold hover:bg-stone-600"
          >
            ↺ Zoom
          </button>
        )}

        {closed && (
          <span className="rounded-full bg-emerald-800 px-2.5 py-0.5 text-xs font-bold text-emerald-200">
            Cerrado ✓
          </span>
        )}
      </div>

      {/* ── Plan canvas ─────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden bg-stone-900"
        style={{ cursor: "crosshair" }}
        onClick={handleClick}
      >
        {/* Zoomable layer */}
        <div
          style={{
            transform: `translate(${tf.x}px,${tf.y}px) scale(${tf.scale})`,
            transformOrigin: "0 0",
            width: "100%",
            height: "100%",
            willChange: "transform",
            position: "relative",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/plan/plano-11223.png"
            alt="Plano catastral 11223"
            draggable={false}
            className="h-full w-full object-contain"
          />

          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            preserveAspectRatio="xMidYMid meet"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            {/* ── Background: all OTHER lots' closed polygons from localStorage ── */}
            {Object.entries(allTraces)
              .filter(([id, t]) => id !== selectedId && t.closed && t.points.length >= 3)
              .map(([id, t]) => {
                const bgPts = t.points.map((p) => `${p.x},${p.y}`).join(" ");
                const bgCx = t.points.reduce((s, p) => s + p.x, 0) / t.points.length;
                const bgCy = t.points.reduce((s, p) => s + p.y, 0) / t.points.length;
                return (
                  <g key={`bg-${id}`}>
                    <polygon
                      points={bgPts}
                      fill="rgba(52,211,153,0.3)"
                      stroke="#059669"
                      strokeWidth="0.2"
                      vectorEffect="non-scaling-stroke"
                    />
                    <text
                      x={bgCx}
                      y={bgCy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="0.9"
                      fill="#059669"
                      fontWeight="bold"
                      className="select-none"
                    >
                      {id}
                    </text>
                  </g>
                );
              })}

            {/* ── Active polygon: current lot ─────────────────────────────── */}
            {points.length >= 2 &&
              (closed ? (
                <g>
                  <polygon
                    points={svgPointsStr}
                    fill="rgba(52,211,153,0.3)"
                    stroke="#059669"
                    strokeWidth="0.25"
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    x={centroidX}
                    y={centroidY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="1"
                    fill="#059669"
                    fontWeight="bold"
                    className="select-none"
                  >
                    {selectedId}
                  </text>
                </g>
              ) : (
                <polyline
                  points={svgPointsStr}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="0.25"
                  vectorEffect="non-scaling-stroke"
                />
              ))}

            {/* ── Vertex dots + numbers — r≈1.2px (30% of previous 4px) ──── */}
            {points.map((p, i) => (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="0.14"
                  fill="#ef4444"
                  stroke="white"
                  strokeWidth="0.08"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={p.x + 0.25}
                  y={p.y - 0.3}
                  fontSize="1"
                  fill="white"
                  fontWeight="bold"
                  className="select-none"
                >
                  {i + 1}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Crosshair hint */}
        <div className="pointer-events-none absolute left-3 top-3 rounded bg-black/60 px-2 py-1 text-xs text-stone-300">
          Click para agregar vértice · Drag para mover · Scroll para zoom
        </div>
      </div>

      {/* ── Output: lote activo ─────────────────────────────────────── */}
      {points.length > 0 && (
        <div
          className="border-t border-stone-700 bg-stone-950 px-4 py-3"
          style={{ maxHeight: "18vh", overflowY: "auto" }}
        >
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-stone-400">
            {selectedId} · {points.length} puntos{closed ? " · Cerrado ✓" : " · Abierto"}
          </p>
          <code className="block break-all text-xs text-emerald-400">{outputJson}</code>
        </div>
      )}

      {/* ── Output: export completo ──────────────────────────────────── */}
      {exportText && (
        <div
          className="border-t border-violet-800 bg-stone-950 px-4 py-3"
          style={{ maxHeight: "30vh", overflowY: "auto" }}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-violet-400">
              Export → lots.ts · {closedCount} polígonos
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="rounded bg-violet-700 px-2.5 py-1 text-xs font-semibold hover:bg-violet-600"
              >
                {exportCopied ? "✓ Copiado" : "Copiar"}
              </button>
              <button
                type="button"
                onClick={() => setExportText("")}
                className="rounded bg-stone-700 px-2.5 py-1 text-xs font-semibold hover:bg-stone-600"
              >
                ✕
              </button>
            </div>
          </div>
          <pre className="whitespace-pre-wrap break-all text-xs text-violet-300">{exportText}</pre>
        </div>
      )}
    </main>
  );
}
