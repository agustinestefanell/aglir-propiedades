"use client";

import { useEffect, useState } from "react";
import type { Lot } from "@/types";
import { PROPUESTAS_TABLE, fetchPropuestaCountsPorLote } from "@/lib/vendedores";
import { supabase } from "@/lib/supabase";

type RankingRow = { lotId: string; manzana: string; solar: string; area: number; count: number };

// Tab RanTerr: terrenos con propuestas generadas, de mayor a menor; empate → manzana y solar.
export function AdminRankingTerrenos({ lots }: { lots: Lot[] }) {
  const [counts, setCounts] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    const refresh = () => { fetchPropuestaCountsPorLote().then(setCounts); };
    refresh();
    const channel = supabase
      .channel("ranterr_propuestas")
      .on("postgres_changes", { event: "*", schema: "public", table: PROPUESTAS_TABLE }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (counts === null) {
    return <p className="pt-8 text-center text-sm text-stone-500">Cargando…</p>;
  }

  const lotById = new Map(lots.map((l) => [l.id, l]));
  const rows: RankingRow[] = Object.entries(counts).map(([lotId, count]) => {
    const lot = lotById.get(lotId);
    // lot_id con formato "m{manzana}-s{solar}"; si no está en lots.ts se deriva del id
    const match = /^m(\w+)-s(\w+)$/.exec(lotId);
    return {
      lotId,
      manzana: lot?.manzana ?? match?.[1] ?? "—",
      solar: lot?.solar ?? match?.[2] ?? "—",
      area: lot?.area_m2 ?? 0,
      count,
    };
  });
  rows.sort(
    (a, b) =>
      b.count - a.count ||
      Number(a.manzana) - Number(b.manzana) ||
      Number(a.solar) - Number(b.solar)
  );

  if (rows.length === 0) {
    return (
      <p className="pt-8 text-center text-sm text-stone-500">
        Aún no se generaron propuestas.
      </p>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[430px] px-2 pt-3 pb-6">
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full table-fixed text-center text-xs">
          <thead className="bg-stone-50 text-[10px] uppercase tracking-wide text-stone-500">
            <tr>
              <th className="w-10 py-2 font-bold">#</th>
              <th className="py-2 font-bold">Mz</th>
              <th className="py-2 font-bold">Solar</th>
              <th className="py-2 font-bold">m²</th>
              <th className="py-2 font-bold">Propuestas</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.lotId} className="border-b border-stone-100">
                <td className="py-1.5 font-bold text-stone-400">{i + 1}</td>
                <td className="py-1.5 font-bold text-ink">{r.manzana}</td>
                <td className="py-1.5 font-bold text-ink">{r.solar}</td>
                <td className="py-1.5 text-stone-600">{r.area > 0 ? r.area : "—"}</td>
                <td className="py-1.5">
                  <span className="inline-block min-w-[2rem] rounded-full bg-leaf/10 px-1.5 py-0.5 font-bold text-leaf">
                    {r.count}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
