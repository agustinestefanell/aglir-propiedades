"use client";

import { useRef } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import type { Lot, LotStatus } from "@/types";

type LotPolygonProps = {
  lot: Lot;
  selected: boolean;
  onSelect: (lot: Lot) => void;
  forceClickable?: boolean;
  onDoubleSelect?: (lot: Lot, clientX: number, clientY: number) => void;
};

const fillClass: Record<LotStatus, string> = {
  disponible: "fill-transparent",
  reservado: "fill-emerald-500/55",
  vendido: "fill-yellow-400/65",
};

const strokeClass: Record<LotStatus, string> = {
  disponible: "stroke-stone-500",
  reservado: "stroke-emerald-700",
  vendido: "stroke-yellow-600",
};

export function LotPolygon({
  lot,
  selected,
  onSelect,
  forceClickable,
  onDoubleSelect,
}: LotPolygonProps) {
  const isClickable = forceClickable || lot.estado === "disponible";
  const points = lot.polygon.map((p) => `${p.x},${p.y}`).join(" ");
  const lastTapRef = useRef<number>(0);

  function handleClick(e: MouseEvent<SVGGElement>) {
    if (!isClickable) return;

    if (onDoubleSelect) {
      const now = Date.now();
      if (now - lastTapRef.current < 350) {
        lastTapRef.current = 0;
        onDoubleSelect(lot, e.clientX, e.clientY);
        return;
      }
      lastTapRef.current = now;
    }

    onSelect(lot);
  }

  function handleKeyDown(e: KeyboardEvent<SVGGElement>) {
    if (!isClickable) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(lot);
    }
  }

  return (
    <g
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={`Manzana ${lot.manzana}, Solar ${lot.solar}, ${lot.estado}`}
      onClick={isClickable ? handleClick : undefined}
      onKeyDown={handleKeyDown}
      className={isClickable ? "group outline-none" : undefined}
    >
      <polygon
        points={points}
        className={[
          fillClass[lot.estado],
          strokeClass[lot.estado],
          "transition duration-100",
          isClickable &&
            "cursor-pointer group-hover:fill-emerald-100/40 group-focus-visible:outline group-focus-visible:outline-2",
          selected && lot.estado === "disponible" && "fill-emerald-100/50",
        ]
          .filter(Boolean)
          .join(" ")}
        strokeWidth={selected ? 1.4 : 0.6}
        vectorEffect="non-scaling-stroke"
      />
      {/* wider invisible hit area for easier tapping */}
      {isClickable && (
        <polygon
          points={points}
          fill="transparent"
          stroke="transparent"
          strokeWidth={7}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </g>
  );
}
