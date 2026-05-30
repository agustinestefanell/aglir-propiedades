"use client";

import type { KeyboardEvent } from "react";
import type { Lot, LotStatus } from "@/types";

type LotPolygonProps = {
  lot: Lot;
  selected: boolean;
  onSelect: (lot: Lot) => void;
  forceClickable?: boolean;
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

export function LotPolygon({ lot, selected, onSelect, forceClickable }: LotPolygonProps) {
  const isClickable = forceClickable || lot.estado === "disponible";
  const points = lot.polygon.map((p) => `${p.x},${p.y}`).join(" ");
  const cx = lot.polygon.reduce((s, p) => s + p.x, 0) / lot.polygon.length;
  const cy = lot.polygon.reduce((s, p) => s + p.y, 0) / lot.polygon.length;

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
      onClick={isClickable ? () => onSelect(lot) : undefined}
      onKeyDown={handleKeyDown}
      className={isClickable ? "group outline-none" : undefined}
    >
      <polygon
        points={points}
        className={[
          fillClass[lot.estado],
          strokeClass[lot.estado],
          "transition duration-100",
          isClickable && "cursor-pointer group-hover:fill-emerald-100/40 group-focus-visible:outline group-focus-visible:outline-2",
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
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        className="pointer-events-none select-none fill-stone-700 font-bold"
        fontSize="2"
      >
        {lot.solar}
      </text>
    </g>
  );
}
