"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { lots } from "@/data/lots";

// SVG coordinate space: 2897×4496 px → normalized to 100×155.20
const SVG_W = 100;
const SVG_H = 155.20;

// localStorage keys — separated by lifecycle
const CLOSED_KEY = "aglir_trace_polygons"; // Record<lotId, Point[]> — permanent closed polys
const DRAFT_KEY = "aglir_trace_draft";     // {id, points} — single active in-progress draft

type Point = { x: number; y: number };
type Tf = { scale: number; x: number; y: number };

// ── localStorage helpers ────────────────────────────────────────────

function loadClosed(): Record<string, Point[]> {
  try {
    const raw = localStorage.getItem(CLOSED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const result: Record<string, Point[]> = {};
    for (const [id, val] of Object.entries(parsed)) {
      if (Array.isArray(val) && val.length >= 3) {
        // New format: val is Point[]
        result[id] = val as Point[];
      } else if (val && typeof val === "object" && !Array.isArray(val)) {
        // Old format migration: {points: Point[], closed: boolean}
        const old = val as { points?: Point[]; closed?: boolean };
        if (old.closed && old.points && old.points.length >= 3) {
          result[id] = old.points;
        }
      }
    }
    return result;
  } catch {
    return {};
  }
}

function saveClosed(id: string, pts: Point[]): Record<string, Point[]> {
  try {
    const all = loadClosed();
    all[id] = pts;
    localStorage.setItem(CLOSED_KEY, JSON.stringify(all));
    return all;
  } catch {
    return {};
  }
}

function loadDraft(id: string): Point[] | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as { id: string; points: Point[] };
    return d.id === id && d.points?.length > 0 ? d.points : null;
  } catch {
    return null;
  }
}

function saveDraft(id: string, pts: Point[]) {
  try {
    if (pts.length > 0) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ id, points: pts }));
    } else {
      localStorage.removeItem(DRAFT_KEY);
    }
  } catch {}
}

// ── Page guard ──────────────────────────────────────────────────────

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

// ── Main canvas component ───────────────────────────────────────────

function TraceCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  // No system action modifies tf — viewport movement is 100% manual
  const [tf, setTf] = useState<Tf>({ scale: 1, x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState(lots[0]?.id ?? "m2-s1");

  // Active draft state — separate lifecycle from closed polygons
  const [points, setPoints] = useState<Point[]>([]);
  const [isClosed, setIsClosed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Permanent closed polygons — never overwritten by reset
  const [allClosed, setAllClosed] = useState<Record<string, Point[]>>({});

  // Export panel
  const [exportText, setExportText] = useState("");
  const [exportCopied, setExportCopied] = useState(false);

  // ── Restore on lot change ─────────────────────────────────────────
  // Loads ALL closed polygons (for background) and restores this lot's state.
  // Kept as a single effect to avoid the race condition where the persist
  // effect fires with stale state before restore completes.
  useEffect(() => {
    const closed = loadClosed();
    setAllClosed(closed);

    const closedPts = closed[selectedId];
    if (closedPts && closedPts.length >= 3) {
      setPoints(closedPts);
      setIsClosed(true);
    } else {
      const draft = loadDraft(selectedId);
      setPoints(draft ?? []);
      setIsClosed(false);
    }
    setCopied(false);
  }, [selectedId]);

  // ── Auto-save in-progress draft ───────────────────────────────────
  // Only runs for non-closed, non-empty drafts.
  // Never touches the closed polygon store.
  useEffect(() => {
    if (isClosed) return;
    saveDraft(selectedId, points);
  }, [selectedId, points, isClosed]);

  // ── Zoom / pan event listeners ────────────────────────────────────

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

  // ── Click to add vertex ────────────────────────────────────────────

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (dragMoved.current || isClosed) {
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

  // ── Action handlers — none touch tf ───────────────────────────────

  function handleClosePolygon() {
    if (points.length < 3) return;
    setIsClosed(true);
    // Explicit save — only place where closed polygons are written to localStorage
    const updated = saveClosed(selectedId, points);
    setAllClosed(updated);
    saveDraft(selectedId, []); // clear draft now that it's closed
  }

  function handleCopy() {
    const text = JSON.stringify(points.map((p) => ({ x: p.x, y: p.y })));
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // "Nuevo" — clears active draft only; allClosed and closed polygon in
  // localStorage are NEVER touched. The green background polygon persists.
  function handleNuevo() {
    setPoints([]);
    setIsClosed(false);
    setCopied(false);
    saveDraft(selectedId, []); // clear draft
    // tf intentionally NOT reset
  }

  function handleSelectLot(id: string) {
    setSelectedId(id);
  }

  function buildPolygonMap(): string {
    const entries = Object.entries(allClosed)
      .filter(([, pts]) => pts.length >= 3)
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));

    if (entries.length === 0) return "// Sin polígonos cerrados en localStorage";

    const date = new Date().toISOString().split("T")[0];
    const rows = entries.map(([id, pts]) => `  "${id}": ${JSON.stringify(pts)},`).join("\n");

    return [
      `// Exportado desde /admin/trace — ${date} — ${entries.length} polígonos`,
      `// 1. Pegar en src/data/lots.ts antes de "export const lots"`,
      `// 2. En el map, cambiar:  polygon: []`,
      `//    por:                 polygon: polygonMap[\`m\${manzana}-s\${solar}\`] ?? []`,
      ``,
      `const polygonMap: Record<string, { x: number; y: number }[]> = {`,
      rows,
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

  // ── Derived values ─────────────────────────────────────────────────

  const svgPointsStr = points.map((p) => `${p.x},${p.y}`).join(" ");
  const centroidX = points.length > 0 ? points.reduce((s, p) => s + p.x, 0) / points.length : 0;
  const centroidY = points.length > 0 ? points.reduce((s, p) => s + p.y, 0) / points.length : 0;
  const outputJson = JSON.stringify(points.map((p) => ({ x: p.x, y: p.y })));
  const closedCount = Object.values(allClosed).filter((pts) => pts.length >= 3).length;

  // ── Render ─────────────────────────────────────────────────────────

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
            const isClosed_ = Boolean(allClosed[lot.id]);
            const isActiveDraft = lot.id === selectedId && points.length > 0 && !isClosed;
            const indicator = isClosed_ ? "✓ " : isActiveDraft ? "· " : "";
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
          disabled={points.length < 3 || isClosed}
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
          onClick={handleNuevo}
          className="rounded bg-stone-700 px-3 py-1.5 font-semibold hover:bg-stone-600"
        >
          Nuevo
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

        {isClosed && (
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
            {/* ── Background: ALL closed polygons (including selectedId) ── */}
            {Object.entries(allClosed)
              .filter(([id]) => id !== selectedId)
              .map(([id, pts]) => {
                const bgPts = pts.map((p) => `${p.x},${p.y}`).join(" ");
                const bgCx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
                const bgCy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
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

            {/* ── Active polygon: current lot ─────────────────────────── */}
            {points.length >= 2 &&
              (isClosed ? (
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

            {/* ── Vertex dots + numbers ─────────────────────────────── */}
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
            {selectedId} · {points.length} puntos{isClosed ? " · Cerrado ✓" : " · Abierto"}
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
