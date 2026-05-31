"use client";

import type { Lot } from "@/types";

type Props = {
  lot: Lot;
  onClose: () => void;
  onSchedule: () => void;
};

const statusConfig = {
  disponible: {
    label: "Disponible",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  reservado: {
    label: "Reservado",
    badge: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  vendido: {
    label: "Vendido",
    badge: "bg-yellow-50 text-yellow-800 border-yellow-300",
  },
} as const;

export function LotDetailPanel({ lot, onClose, onSchedule }: Props) {
  const cfg = statusConfig[lot.estado];

  return (
    // Bottom sheet centrado en 430px — idéntico en mobile y desktop
    <aside className="
      fixed bottom-0 left-1/2 z-30
      w-full max-w-[430px] -translate-x-1/2
      flex flex-col gap-3
      rounded-t-xl border-t border-stone-200
      bg-white px-5 pt-4 pb-6
      shadow-[0_-4px_16px_rgba(0,0,0,0.08)]
    ">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${cfg.badge}`}
          >
            {cfg.label}
          </span>
          <h2 className="mt-1.5 text-xl font-black text-ink">
            Manzana {lot.manzana}
          </h2>
          <p className="text-sm font-semibold text-stone-600">Solar {lot.solar}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalle"
          className="min-h-9 min-w-9 rounded-md border border-stone-200 text-stone-500 hover:bg-stone-50"
        >
          ✕
        </button>
      </div>

      <dl className="rounded-md bg-paper px-4 py-3">
        <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Superficie
        </dt>
        <dd className="mt-1 text-3xl font-black text-ink">
          {lot.area_m2 > 0 ? lot.area_m2 : "—"}{" "}
          <span className="text-xl font-bold text-stone-500">m²</span>
        </dd>
      </dl>

      {lot.estado === "disponible" ? (
        <>
          <button
            type="button"
            onClick={onSchedule}
            className="min-h-12 w-full rounded-md bg-leaf px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-emerald-800"
          >
            Agendar visita
          </button>
          <p className="text-center text-xs leading-5 text-stone-500">
            Horario a confirmar · Te contactamos por WhatsApp
          </p>
        </>
      ) : (
        <>
          <p className="rounded-md bg-stone-50 px-4 py-3 text-center text-sm font-semibold text-stone-600">
            Este terreno no está disponible.
          </p>
          <button
            type="button"
            disabled
            className="min-h-12 w-full rounded-md bg-stone-300 px-5 py-3 text-base font-bold text-stone-500 cursor-not-allowed"
          >
            No disponible
          </button>
        </>
      )}
    </aside>
  );
}
