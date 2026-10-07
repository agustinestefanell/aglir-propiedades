"use client";

import Link from "next/link";
import type { Lot } from "@/types";

type Props = {
  lot: Lot;
  onClose: () => void;
  // Sin uso desde OE 039 (se eliminó "Agendar visita"); se mantiene para no romper InteractivePlan
  onSchedule?: () => void;
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

export function LotDetailPanel({ lot, onClose }: Props) {
  const cfg = statusConfig[lot.estado];

  return (
    // Mobile/tablet: bottom sheet centrado en 430px.
    // Desktop (lg+): columna derecha fija, a la derecha del plano de 430px (OE 048).
    // En ambos casos max-h al viewport visible + scroll interno → nunca se sale de pantalla.
    <aside className="
      fixed bottom-0 left-1/2 z-30
      w-full max-w-[430px] -translate-x-1/2
      max-h-[calc(100dvh-4rem)] overflow-y-auto
      flex flex-col gap-3
      rounded-t-xl border-t border-stone-200
      bg-white px-5 pt-4 pb-6
      shadow-[0_-4px_16px_rgba(0,0,0,0.08)]
      lg:top-20 lg:bottom-auto lg:left-auto lg:right-4 lg:translate-x-0
      lg:w-64 lg:max-h-[calc(100dvh-6rem)]
      lg:rounded-xl lg:border lg:shadow-lg
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
        {(lot.precio_ur || lot.precio_contado_usd) && (
          <div className="mt-2 space-y-0.5 text-sm text-ink">
            {lot.precio_ur && (
              <p>
                <span className="font-semibold text-stone-500">Precio:</span>{" "}
                <span className="font-bold">UR {lot.precio_ur}</span>
              </p>
            )}
            {lot.precio_contado_usd && (
              <p>
                <span className="font-semibold text-stone-500">Contado:</span>{" "}
                <span className="font-bold">U$S {lot.precio_contado_usd}</span>
              </p>
            )}
          </div>
        )}
      </dl>

      {lot.estado === "disponible" && (
        <Link
          href={`/propuesta/${lot.id}?modo=publico`}
          className="flex min-h-12 w-full items-center justify-center rounded-md bg-leaf px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-emerald-800"
        >
          Descargar propuesta
        </Link>
      )}

      {lot.estado !== "disponible" && (
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
