"use client";

import type { Lot, LotStatus } from "@/types";

const OPTIONS: {
  value: LotStatus;
  label: string;
  dot: string;
  activeCls: string;
}[] = [
  {
    value: "disponible",
    label: "En venta",
    dot: "bg-stone-400",
    activeCls: "bg-stone-100 text-stone-900",
  },
  {
    value: "reservado",
    label: "Reservado",
    dot: "bg-emerald-500",
    activeCls: "bg-emerald-50 text-emerald-900",
  },
  {
    value: "vendido",
    label: "Vendido",
    dot: "bg-yellow-400",
    activeCls: "bg-yellow-50 text-yellow-900",
  },
];

type Props = {
  lot: Lot;
  position: { x: number; y: number };
  onChangeStatus: (status: LotStatus) => void;
  onClose: () => void;
};

export function LotStatusMenu({ lot, position, onChangeStatus, onClose }: Props) {
  const safeX =
    typeof window !== "undefined"
      ? Math.min(position.x, window.innerWidth - 180)
      : position.x;
  const safeY =
    typeof window !== "undefined"
      ? Math.min(position.y, window.innerHeight - 160)
      : position.y;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        className="fixed z-50 min-w-[160px] rounded-lg bg-white py-1 shadow-2xl"
        style={{ top: safeY, left: safeX }}
      >
        <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">
          M{lot.manzana} · S{lot.solar}
        </p>

        {OPTIONS.map((opt) => {
          const isActive = lot.estado === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChangeStatus(opt.value)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition ${
                isActive
                  ? `${opt.activeCls} font-bold`
                  : "text-stone-700 hover:bg-stone-50"
              }`}
            >
              <span className={`h-2 w-2 flex-shrink-0 rounded-full ${opt.dot}`} />
              {opt.label}
              {isActive && <span className="ml-auto text-[10px] text-stone-400">✓</span>}
            </button>
          );
        })}
      </div>
    </>
  );
}
