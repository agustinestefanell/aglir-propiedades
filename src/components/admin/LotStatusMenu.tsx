"use client";

import type { Lot, LotStatus } from "@/types";

const OPTIONS: {
  value: LotStatus;
  label: string;
  dotCls: string;
  activeCls: string;
}[] = [
  {
    value: "disponible",
    label: "En venta",
    dotCls: "bg-transparent border border-stone-400",
    activeCls: "bg-stone-100 font-bold text-stone-900",
  },
  {
    value: "reservado",
    label: "Reservado",
    dotCls: "bg-emerald-500",
    activeCls: "bg-emerald-50 font-bold text-emerald-900",
  },
  {
    value: "vendido",
    label: "Vendido",
    dotCls: "bg-yellow-400",
    activeCls: "bg-yellow-50 font-bold text-yellow-900",
  },
];

type Props = {
  lot: Lot;
  onChangeStatus: (status: LotStatus) => void;
  onClose: () => void;
};

export function LotStatusMenu({ lot, onChangeStatus, onClose }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      <aside className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 rounded-t-2xl bg-white px-5 pt-4 pb-8 shadow-2xl">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-stone-200" />

        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
              Estado del terreno
            </p>
            <h2 className="mt-0.5 text-lg font-black text-ink">
              Manzana {lot.manzana} · Solar {lot.solar}
            </h2>
            {lot.area_m2 > 0 && (
              <p className="text-sm text-stone-500">{lot.area_m2} m²</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="min-h-9 min-w-9 rounded-md border border-stone-200 text-stone-500 hover:bg-stone-50"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-2">
          {OPTIONS.map((opt) => {
            const isActive = lot.estado === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChangeStatus(opt.value)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${
                  isActive ? opt.activeCls : "text-stone-700 hover:bg-stone-50"
                }`}
              >
                <span className={`h-4 w-4 flex-shrink-0 rounded-sm ${opt.dotCls}`} />
                <span>{opt.label}</span>
                {isActive && (
                  <span className="ml-auto text-xs font-bold text-stone-400">✓</span>
                )}
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}
