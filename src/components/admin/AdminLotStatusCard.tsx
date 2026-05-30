"use client";

import type { Lot, LotStatus } from "@/types";

type Props = {
  lot: Lot;
  onChangeStatus: (lotId: string, status: LotStatus) => void;
};

const statusLabel: Record<LotStatus, string> = {
  disponible: "Disponible",
  reservado: "Reservado",
  vendido: "Vendido",
};

const badgeCls: Record<LotStatus, string> = {
  disponible: "border-stone-300 bg-white text-stone-800",
  reservado: "border-emerald-300 bg-emerald-50 text-emerald-900",
  vendido: "border-yellow-300 bg-yellow-50 text-yellow-900",
};

const btnCls: Record<LotStatus, string> = {
  disponible: "border-stone-300 bg-white text-stone-800 hover:bg-stone-50",
  reservado: "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
  vendido: "border-yellow-300 bg-yellow-50 text-yellow-900 hover:bg-yellow-100",
};

export function AdminLotStatusCard({ lot, onChangeStatus }: Props) {
  return (
    <article className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase text-stone-500">Terreno</p>
          <h3 className="mt-1 text-xl font-black text-ink">
            Manzana {lot.manzana}, Solar {lot.solar}
          </h3>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeCls[lot.estado]}`}>
          {statusLabel[lot.estado]}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md bg-paper p-3">
          <dt className="text-stone-600">Metros</dt>
          <dd className="font-bold text-ink">{lot.area_m2} m²</dd>
        </div>
        <div className="rounded-md bg-paper p-3">
          <dt className="text-stone-600">Solar</dt>
          <dd className="font-bold text-ink">Nº {lot.solar}</dd>
        </div>
      </dl>

      <div className="mt-4 grid gap-2">
        {(["disponible", "reservado", "vendido"] as LotStatus[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChangeStatus(lot.id, s)}
            disabled={lot.estado === s}
            className={`min-h-11 rounded-md border px-4 py-2.5 text-sm font-bold transition disabled:cursor-default disabled:ring-2 disabled:ring-ink/20 ${btnCls[s]}`}
          >
            Marcar {statusLabel[s].toLowerCase()}
          </button>
        ))}
      </div>
    </article>
  );
}
