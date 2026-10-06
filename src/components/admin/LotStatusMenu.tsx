"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Lot, LotStatus } from "@/types";
import type { SavePrices } from "@/lib/lotStates";
import { loadVendedor } from "@/lib/vendedor";
import { VendedorProfileModal } from "./VendedorProfileModal";

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
  onSavePrices: SavePrices;
  onClose: () => void;
};

type SaveState = "idle" | "saving" | "saved" | "error";

export function LotStatusMenu({ lot, onChangeStatus, onSavePrices, onClose }: Props) {
  const [ur, setUr] = useState(lot.precio_ur ?? "");
  const [contado, setContado] = useState(lot.precio_contado_usd ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [showProfile, setShowProfile] = useState(false);
  const router = useRouter();

  function openPropuesta() {
    router.push(`/propuesta/${lot.id}?modo=vendedor`);
  }

  function handleEnviarPropuesta() {
    // Sin perfil de vendedor guardado → pedirlo antes de abrir la propuesta
    if (loadVendedor()) openPropuesta();
    else setShowProfile(true);
  }

  // Pre-llena con los precios actuales y re-sincroniza si cambian (realtime / tab Terrenos)
  useEffect(() => { setUr(lot.precio_ur ?? ""); }, [lot.id, lot.precio_ur]);
  useEffect(() => { setContado(lot.precio_contado_usd ?? ""); }, [lot.id, lot.precio_contado_usd]);

  async function handleSavePrices() {
    setSaveState("saving");
    const ok = await onSavePrices(lot.id, ur, contado);
    setSaveState(ok ? "saved" : "error");
    if (ok) setTimeout(() => setSaveState("idle"), 2000);
  }

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

        <div className="mt-4 border-t border-stone-100 pt-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">
            Precio
          </p>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-semibold text-stone-600">
              Precio UR
              <input
                type="text"
                inputMode="numeric"
                value={ur}
                onChange={(e) => { setUr(e.target.value); setSaveState("idle"); }}
                placeholder="Ej: 10"
                className="mt-1 w-full rounded-md border border-stone-300 px-2.5 py-2 text-sm font-normal text-ink"
              />
            </label>
            <label className="text-xs font-semibold text-stone-600">
              Precio U$S contado
              <input
                type="text"
                inputMode="numeric"
                value={contado}
                onChange={(e) => { setContado(e.target.value); setSaveState("idle"); }}
                placeholder="Ej: 25.000"
                className="mt-1 w-full rounded-md border border-stone-300 px-2.5 py-2 text-sm font-normal text-ink"
              />
            </label>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSavePrices}
              disabled={saveState === "saving"}
              className="flex-1 rounded-md bg-leaf py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {saveState === "saving" ? "Guardando…" : "Guardar precio"}
            </button>
            {saveState === "saved" && (
              <span className="text-sm font-bold text-emerald-700">✓</span>
            )}
            {saveState === "error" && (
              <span className="text-sm font-bold text-red-600">Error</span>
            )}
          </div>
        </div>

        {lot.estado === "disponible" && (
          <button
            type="button"
            onClick={handleEnviarPropuesta}
            className="mt-4 w-full rounded-md border-2 border-leaf py-2.5 text-sm font-bold text-leaf transition hover:bg-emerald-50"
          >
            Enviar propuesta
          </button>
        )}
      </aside>

      {showProfile && (
        <VendedorProfileModal
          onSaved={() => { setShowProfile(false); openPropuesta(); }}
          onClose={() => setShowProfile(false)}
        />
      )}
    </>
  );
}
