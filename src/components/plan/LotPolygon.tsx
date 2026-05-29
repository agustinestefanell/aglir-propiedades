"use client";

import type { KeyboardEvent } from "react";
import type { Lot } from "@/types";

type LotPolygonProps = {
  lot: Lot;
  selected: boolean;
  onSelect: (lot: Lot) => void;
};

const statusStyles = {
  disponible: "fill-emerald-500/35 stroke-emerald-700",
  reservado: "fill-amber-400/40 stroke-amber-700",
  vendido: "fill-slate-400/40 stroke-slate-600"
};

export function LotPolygon({ lot, selected, onSelect }: LotPolygonProps) {
  const points = lot.polygon.map((point) => `${point.x},${point.y}`).join(" ");
  const centerX = lot.polygon.reduce((sum, point) => sum + point.x, 0) / lot.polygon.length;
  const centerY = lot.polygon.reduce((sum, point) => sum + point.y, 0) / lot.polygon.length;

  function handleKeyDown(event: KeyboardEvent<SVGGElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(lot);
    }
  }

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Manzana ${lot.manzana}, Solar ${lot.solar}, ${lot.estado}`}
      onClick={() => onSelect(lot)}
      onKeyDown={handleKeyDown}
      className="group outline-none"
    >
      <polygon
        points={points}
        className={`${statusStyles[lot.estado]} cursor-pointer transition duration-150 group-hover:fill-leaf/55 group-focus-visible:fill-leaf/55 ${
          selected ? "fill-leaf/65 stroke-ink" : ""
        }`}
        strokeWidth={selected ? 1.1 : 0.7}
        vectorEffect="non-scaling-stroke"
      />
      <polygon
        points={points}
        className="fill-transparent stroke-transparent"
        strokeWidth={5}
        vectorEffect="non-scaling-stroke"
      />
      <text
        x={centerX}
        y={centerY}
        textAnchor="middle"
        dominantBaseline="middle"
        className="pointer-events-none select-none fill-ink text-[3.4px] font-bold"
      >
        {lot.solar}
      </text>
    </g>
  );
}
