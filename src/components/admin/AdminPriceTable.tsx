"use client";

import { useEffect, useState } from "react";
import type { Lot } from "@/types";
import type { SavePrices } from "@/lib/lotStates";

type Props = {
  lots: Lot[];
  onSavePrices: SavePrices;
};

type SaveState = "idle" | "saving" | "saved" | "error";

function PriceRow({ lot, onSavePrices }: { lot: Lot; onSavePrices: SavePrices }) {
  const [ur, setUr] = useState(lot.precio_ur ?? "");
  const [contado, setContado] = useState(lot.precio_contado_usd ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");

  // Re-sincroniza cuando llegan valores nuevos desde Supabase (fetch inicial / realtime)
  useEffect(() => { setUr(lot.precio_ur ?? ""); }, [lot.precio_ur]);
  useEffect(() => { setContado(lot.precio_contado_usd ?? ""); }, [lot.precio_contado_usd]);

  async function handleSave() {
    setSaveState("saving");
    const ok = await onSavePrices(lot.id, ur, contado);
    setSaveState(ok ? "saved" : "error");
    if (ok) setTimeout(() => setSaveState("idle"), 2000);
  }

  const buttonLabel =
    saveState === "saving" ? "…" : saveState === "saved" ? "✓" : saveState === "error" ? "Error" : "Guardar";

  return (
    <tr className="border-b border-stone-100 last:border-b-0">
      <td className="py-2 pr-1 text-center font-bold text-ink">{lot.manzana}</td>
      <td className="py-2 pr-1 text-center font-bold text-ink">{lot.solar}</td>
      <td className="py-2 pr-2 text-right text-stone-600">{lot.area_m2 > 0 ? lot.area_m2 : "—"}</td>
      <td className="py-2 pr-1">
        <input
          type="text"
          inputMode="numeric"
          value={ur}
          onChange={(e) => { setUr(e.target.value); setSaveState("idle"); }}
          placeholder="Ej: 500.000"
          aria-label={`Precio UR manzana ${lot.manzana} solar ${lot.solar}`}
          className="w-full rounded border border-stone-300 px-1.5 py-1 text-xs"
        />
      </td>
      <td className="py-2 pr-1">
        <input
          type="text"
          inputMode="numeric"
          value={contado}
          onChange={(e) => { setContado(e.target.value); setSaveState("idle"); }}
          placeholder="Ej: 25.000"
          aria-label={`Precio contado U$S manzana ${lot.manzana} solar ${lot.solar}`}
          className="w-full rounded border border-stone-300 px-1.5 py-1 text-xs"
        />
      </td>
      <td className="py-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saveState === "saving"}
          className={`w-full rounded px-1.5 py-1 text-[11px] font-bold text-white ${
            saveState === "error" ? "bg-red-600" : "bg-leaf"
          } disabled:opacity-60`}
        >
          {buttonLabel}
        </button>
      </td>
    </tr>
  );
}

export function AdminPriceTable({ lots, onSavePrices }: Props) {
  return (
    <section className="mx-auto w-full max-w-[430px] px-2 pt-3 pb-6">
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full table-fixed text-xs">
          <colgroup>
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[14%]" />
            <col className="w-[25%]" />
            <col className="w-[25%]" />
            <col className="w-[18%]" />
          </colgroup>
          <thead className="bg-stone-50 text-[10px] uppercase tracking-wide text-stone-500">
            <tr>
              <th className="py-2 pr-1 font-bold">Mz</th>
              <th className="py-2 pr-1 font-bold">Lote</th>
              <th className="py-2 pr-2 text-right font-bold">m²</th>
              <th className="py-2 pr-1 text-left font-bold">UR</th>
              <th className="py-2 pr-1 text-left font-bold">Contado U$S</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody className="px-2">
            {lots.map((lot) => (
              <PriceRow key={lot.id} lot={lot} onSavePrices={onSavePrices} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
