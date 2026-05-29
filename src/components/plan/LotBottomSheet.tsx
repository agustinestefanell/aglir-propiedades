"use client";

import type { Lot } from "@/types";

type LotBottomSheetProps = {
  lot: Lot | null;
  onClose: () => void;
  onSchedule: () => void;
};

const statusLabel = {
  disponible: "Disponible",
  reservado: "Reservado",
  vendido: "Vendido"
};

const currencyFormatter = new Intl.NumberFormat("es-UY", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

export function LotBottomSheet({ lot, onClose, onSchedule }: LotBottomSheetProps) {
  if (!lot) {
    return null;
  }

  return (
    <aside className="fixed inset-x-0 bottom-0 z-30 rounded-t-lg border-t border-stone-200 bg-white p-5 shadow-2xl md:static md:rounded-md md:border md:shadow-sm">
      <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-stone-300 md:hidden" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-leaf">
            {statusLabel[lot.estado]}
          </p>
          <h2 className="mt-1 text-xl font-bold text-ink">
            Manzana {lot.manzana}, Solar {lot.solar}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 min-w-11 rounded-md border border-stone-200 text-xl text-stone-600 md:hidden"
          aria-label="Cerrar ficha"
        >
          x
        </button>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md bg-paper p-3">
          <dt className="text-stone-600">Metros</dt>
          <dd className="text-lg font-bold">{lot.area_m2} m²</dd>
        </div>
        <div className="rounded-md bg-paper p-3">
          <dt className="text-stone-600">Contado</dt>
          <dd className="text-lg font-bold">{currencyFormatter.format(lot.precio_contado)}</dd>
        </div>
        <div className="col-span-2 rounded-md bg-paper p-3">
          <dt className="text-stone-600">Financiado</dt>
          <dd className="text-lg font-bold">{currencyFormatter.format(lot.precio_financiado)}</dd>
        </div>
      </dl>

      <p className="mt-4 text-sm leading-6 text-stone-700">{lot.observaciones}</p>
      <button
        type="button"
        onClick={onSchedule}
        disabled={lot.estado === "vendido"}
        className="mt-5 min-h-12 w-full rounded-md bg-leaf px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-400"
      >
        Agendar visita para este terreno
      </button>
    </aside>
  );
}
