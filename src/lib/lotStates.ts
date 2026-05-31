import { useEffect, useMemo, useState } from "react";
import type { Lot, LotStatus } from "@/types";
import { lots as baseLots } from "@/data/lots";
import { supabase } from "./supabase";

const TABLE = "lot_states";

async function fetchOverrides(): Promise<Record<string, LotStatus>> {
  const { data, error } = await supabase.from(TABLE).select("lot_id, estado");
  if (error || !data) return {};
  const result: Record<string, LotStatus> = {};
  for (const row of data) {
    result[row.lot_id as string] = row.estado as LotStatus;
  }
  return result;
}

async function upsertState(id: string, status: LotStatus): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ lot_id: id, estado: status }, { onConflict: "lot_id" });
  if (error) console.error("Error guardando estado:", error);
}

export function useLotStates(): [Lot[], (id: string, status: LotStatus) => void] {
  const [overrides, setOverrides] = useState<Record<string, LotStatus>>({});

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
    () => baseLots.map((l) => ({ ...l, estado: overrides[l.id] ?? l.estado })),
    [overrides]
  );

  function changeStatus(id: string, status: LotStatus) {
    setOverrides((prev) => ({ ...prev, [id]: status }));
    upsertState(id, status);
  }

  return [lots, changeStatus];
}
