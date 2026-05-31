"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Lot } from "@/types";
import { LotDetailPanel } from "./LotDetailPanel";
import { LotPolygon } from "./LotPolygon";

type Props = {
  lots: Lot[];
  selectedLot: Lot | null;
  onSelectLot: (lot: Lot | null) => void;
  onSchedule: () => void;
  showLotDetails?: boolean;
  isAdmin?: boolean;
  onLotDoubleClick?: (lot: Lot, clientX: number, clientY: number) => void;
};

type Tf = { scale: number; x: number; y: number };

export function InteractivePlan({
  lots,
  selectedLot,
  onSelectLot,
  onSchedule,
  showLotDetails = true,
  isAdmin = false,
  onLotDoubleClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tf, setTf] = useState<Tf>({ scale: 1, x: 0, y: 0 });
  const [planReady, setPlanReady] = useState(false);

  const isDragging = useRef(false);
  const dragMoved = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef<number | null>(null);
  const lastTouchMid = useRef<{ x: number; y: number } | null>(null);

  const drawableLots = lots.filter((l) => l.polygon.length >= 3);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setPlanReady(true);
    img.onerror = () => setPlanReady(false);
    img.src = "/plan/plano-11223.png";
  }, []);

  const clamp = useCallback((scale: number, x: number, y: number): Tf => {
    const el = containerRef.current;
    if (!el) return { scale, x, y };
    const s = Math.min(6, Math.max(1, scale));
    return {
      scale: s,
      x: Math.min(0, Math.max(el.clientWidth * (1 - s), x)),
      y: Math.min(0, Math.max(el.clientHeight * (1 - s), y)),
    };
  }, []);

  // Guard against lot selection during drag
  function handleLotSelect(lot: Lot) {
    if (dragMoved.current) {
      dragMoved.current = false;
      return;
    }
    onSelectLot(lot);
  }

  function handleLotDoubleClick(lot: Lot, clientX: number, clientY: number) {
    if (dragMoved.current) return;
    onLotDoubleClick?.(lot, clientX, clientY);
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1 / 0.84 : 0.84;
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
      el!.style.cursor = "grabbing";
    }

    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current) return;
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMoved.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      setTf((prev) => clamp(prev.scale, prev.x + dx, prev.y + dy));
    }

    function onMouseUp() {
      isDragging.current = false;
      el!.style.cursor = "grab";
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
      } else if (e.touches.length === 1) {
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
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) dragMoved.current = true;
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

  const panelVisible = showLotDetails && selectedLot;

  // Full A3 plan — no crop. Coordinate table visible on left.
  const VIEW = "0 0 100 70.72";

  return (
    <section
      className={panelVisible ? "md:grid md:grid-cols-[1fr_300px] md:items-start md:gap-4" : ""}
    >
      {/* ── Plan container ─────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative overflow-hidden bg-stone-100 select-none touch-none"
        style={{
          height: "60vh",
          cursor: "grab",
        }}
      >
        {/* Zoomable layer */}
        <div
          style={{
            transform: `translate(${tf.x}px,${tf.y}px) scale(${tf.scale})`,
            transformOrigin: "0 0",
            width: "100%",
            height: "100%",
            willChange: "transform",
          }}
        >
          {/* Single SVG: plan image + polygons share the same coordinate space.
              viewBox clips to the lot area; the <image> fills the full 100×70.72
              space so polygons align pixel-perfect with the underlying plan. */}
          <svg
            viewBox={VIEW}
            preserveAspectRatio="xMidYMid meet"
            className="block h-full w-full"
            aria-label="Plano interactivo de lotes"
          >
            {planReady ? (
              <image
                href="/plan/plano-11223.png"
                x="0"
                y="0"
                width="100"
                height="70.72"
                preserveAspectRatio="xMidYMid meet"
              />
            ) : (
              <rect x="0" y="0" width="100" height="70.72" fill="#e7e1d2" />
            )}
            {drawableLots.map((lot) => (
              <LotPolygon
                key={lot.id}
                lot={lot}
                selected={selectedLot?.id === lot.id}
                onSelect={handleLotSelect}
                forceClickable={isAdmin}
                onDoubleSelect={onLotDoubleClick ? handleLotDoubleClick : undefined}
              />
            ))}
          </svg>
        </div>

        {/* Reset zoom */}
        {tf.scale > 1.05 && (
          <button
            type="button"
            onClick={() => setTf({ scale: 1, x: 0, y: 0 })}
            className="absolute right-3 top-3 rounded-md bg-white/90 px-2.5 py-1.5 text-[11px] font-bold text-stone-700 shadow-sm hover:bg-white"
          >
            ↺ Zoom
          </button>
        )}
      </div>

      {/* ── Detail panel (no cierra el plano) ─────────────────────── */}
      {panelVisible && (
        <LotDetailPanel
          lot={selectedLot}
          onClose={() => onSelectLot(null)}
          onSchedule={onSchedule}
        />
      )}
    </section>
  );
}
