import { useEffect, useMemo, useState } from "react";
import type { Lot, LotStatus } from "@/types";
import { lots as baseLots } from "@/data/lots";

const STATES_KEY = "aglir_lot_states";

function loadStates(): Record<string, LotStatus> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STATES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, LotStatus>) : {};
  } catch {
    return {};
  }
}

function persistState(id: string, status: LotStatus): void {
  try {
    const current = loadStates();
    current[id] = status;
    localStorage.setItem(STATES_KEY, JSON.stringify(current));
  } catch {}
}

export function useLotStates(): [Lot[], (id: string, status: LotStatus) => void] {
  const [overrides, setOverrides] = useState<Record<string, LotStatus>>({});

  useEffect(() => {
    setOverrides(loadStates());
    const onFocus = () => setOverrides(loadStates());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const lots = useMemo(
    () => baseLots.map((l) => ({ ...l, estado: overrides[l.id] ?? l.estado })),
    [overrides]
  );

  function changeStatus(id: string, status: LotStatus) {
    persistState(id, status);
    setOverrides((prev) => ({ ...prev, [id]: status }));
  }

  return [lots, changeStatus];
}
