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
    <aside className="flex flex-col gap-4 rounded-md border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${cfg.badge}`}
          >
            {cfg.label}
          </span>
          <h2 className="mt-2 text-xl font-black text-ink">
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
          {lot.area_m2} <span className="text-xl font-bold text-stone-500">m²</span>
        </dd>
      </dl>

      <div className="mt-auto">
        <button
          type="button"
          onClick={onSchedule}
          disabled={lot.estado !== "disponible"}
          className="min-h-12 w-full rounded-md bg-leaf px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
        >
          {lot.estado === "disponible" ? "Agendar visita" : "No disponible"}
        </button>

        {lot.estado === "disponible" && (
          <p className="mt-2 text-center text-xs leading-5 text-stone-500">
            Horario a confirmar · Te contactamos por WhatsApp
          </p>
        )}
      </div>
    </aside>
  );
}
