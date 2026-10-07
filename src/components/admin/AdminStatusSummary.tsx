"use client";

import type { Lot, LotStatus } from "@/types";

type Counts = Record<LotStatus, number>;

const emptyCounts = (): Counts => ({ disponible: 0, reservado: 0, vendido: 0 });

const BADGE: Record<LotStatus, string> = {
  disponible: "bg-stone-100 text-stone-700",
  reservado: "bg-emerald-100 text-emerald-800",
  vendido: "bg-yellow-100 text-yellow-800",
};

function Badge({ status, value }: { status: LotStatus; value: number }) {
  return (
    <span className={`inline-block min-w-[2rem] rounded-full px-1.5 py-0.5 font-bold ${BADGE[status]}`}>
      {value}
    </span>
  );
}

// `lots` ya viene de useLotStates: datos base de lots.ts con el estado actual de Supabase aplicado.
export function AdminStatusSummary({ lots }: { lots: Lot[] }) {
  const byManzana = new Map<string, Counts>();
  const totals = emptyCounts();
  for (const lot of lots) {
    const counts = byManzana.get(lot.manzana) ?? emptyCounts();
    counts[lot.estado] += 1;
    totals[lot.estado] += 1;
    byManzana.set(lot.manzana, counts);
  }
  const manzanas = Array.from(byManzana.keys()).sort((a, b) => Number(a) - Number(b));
  const sum = (c: Counts) => c.disponible + c.reservado + c.vendido;

  return (
    <section className="mx-auto w-full max-w-[430px] px-2 pt-3">
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full table-fixed text-center text-xs">
          <thead className="bg-stone-50 text-[10px] uppercase tracking-wide text-stone-500">
            <tr>
              <th className="py-2 font-bold">Mz</th>
              <th className="py-2 font-bold">En venta</th>
              <th className="py-2 font-bold">Reserv.</th>
              <th className="py-2 font-bold">Vendidos</th>
              <th className="py-2 font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {manzanas.map((mz) => {
              const c = byManzana.get(mz)!;
              return (
                <tr key={mz} className="border-b border-stone-100">
                  <td className="py-1.5 font-bold text-ink">{mz}</td>
                  <td className="py-1.5"><Badge status="disponible" value={c.disponible} /></td>
                  <td className="py-1.5"><Badge status="reservado" value={c.reservado} /></td>
                  <td className="py-1.5"><Badge status="vendido" value={c.vendido} /></td>
                  <td className="py-1.5 font-bold text-ink">{sum(c)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-stone-50">
            <tr className="border-t border-stone-200">
              <td className="py-2 text-[10px] font-bold uppercase tracking-wide text-stone-500">Total</td>
              <td className="py-2"><Badge status="disponible" value={totals.disponible} /></td>
              <td className="py-2"><Badge status="reservado" value={totals.reservado} /></td>
              <td className="py-2"><Badge status="vendido" value={totals.vendido} /></td>
              <td className="py-2 font-bold text-ink">{sum(totals)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
