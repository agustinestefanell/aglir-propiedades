import { useEffect, useMemo, useState } from "react";
import type { Lot, LotStatus } from "@/types";
import { lots as baseLots } from "@/data/lots";
import { supabase } from "./supabase";

const TABLE = "lot_states";

type LotOverride = {
  estado?: LotStatus;
  precio_ur?: string;
  precio_contado?: string;
};

async function fetchOverrides(): Promise<Record<string, LotOverride>> {
  const { data, error } = await supabase.from(TABLE).select("*");
  if (error) {
    console.error("Error cargando estados de lot_states:", error);
    return {};
  }
  if (!data) return {};
  if (data.length === 0) {
    console.warn(
      "lot_states: 0 filas leidas (sin error). Si hay estados guardados en Supabase, " +
        "revisar la policy de RLS de SELECT para el rol anon/publishable en la tabla lot_states."
    );
  }
  const result: Record<string, LotOverride> = {};
  for (const row of data) {
    result[row.lot_id as string] = {
      estado: (row.estado as LotStatus) ?? undefined,
      precio_ur: (row.precio_ur as string | null) ?? undefined,
      precio_contado: (row.precio_contado as string | null) ?? undefined,
    };
  }
  return result;
}

async function upsertState(id: string, status: LotStatus): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ lot_id: id, estado: status }, { onConflict: "lot_id" });
  if (error) console.error("Error guardando estado:", error);
}

async function upsertPrices(
  id: string,
  precioUr: string,
  precioContado: string
): Promise<boolean> {
  // estado NO se envía: así no se pisa un estado guardado. Filas nuevas toman el default de la columna.
  const { error } = await supabase.from(TABLE).upsert(
    {
      lot_id: id,
      precio_ur: precioUr || null,
      precio_contado: precioContado || null,
    },
    { onConflict: "lot_id" }
  );
  if (error) {
    console.error("Error guardando precios:", error);
    return false;
  }
  return true;
}

export type SavePrices = (id: string, precioUr: string, precioContado: string) => Promise<boolean>;

export function useLotStates(): [Lot[], (id: string, status: LotStatus) => void, SavePrices] {
  const [overrides, setOverrides] = useState<Record<string, LotOverride>>({});

  useEffect(() => {
    fetchOverrides().then(setOverrides);

    const channel = supabase
      .channel("lot_states_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLE },
        () => { fetchOverrides().then(setOverrides); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const lots = useMemo(
    () =>
      baseLots.map((l) => {
        const o = overrides[l.id];
        return {
          ...l,
          estado: o?.estado ?? l.estado,
          precio_ur: o?.precio_ur,
          precio_contado_usd: o?.precio_contado,
        };
      }),
    [overrides]
  );

  function changeStatus(id: string, status: LotStatus) {
    setOverrides((prev) => ({ ...prev, [id]: { ...prev[id], estado: status } }));
    upsertState(id, status);
  }

  async function savePrices(id: string, precioUr: string, precioContado: string) {
    const ur = precioUr.trim();
    const contado = precioContado.trim();
    const ok = await upsertPrices(id, ur, contado);
    if (ok) {
      setOverrides((prev) => ({
        ...prev,
        [id]: { ...prev[id], precio_ur: ur || undefined, precio_contado: contado || undefined },
      }));
    }
    return ok;
  }

  return [lots, changeStatus, savePrices];
}
