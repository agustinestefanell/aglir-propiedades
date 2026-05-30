"use client";

import { useMemo, useState } from "react";
import { InteractivePlan } from "@/components/plan/InteractivePlan";
import type { Lot, LotStatus } from "@/types";
import { AdminLotStatusCard } from "./AdminLotStatusCard";

type AdminLotStatusManagerProps = {
  initialLots: Lot[];
};

export function AdminLotStatusManager({ initialLots }: AdminLotStatusManagerProps) {
  const [adminLots, setAdminLots] = useState(initialLots);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(initialLots[0] ?? null);
  const [query, setQuery] = useState("");

  const filteredLots = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return adminLots;
    }

    return adminLots.filter((lot) => {
      const searchable = `manzana ${lot.manzana} solar ${lot.solar} ${lot.manzana} ${lot.solar}`;
      return searchable.toLowerCase().includes(normalizedQuery);
    });
  }, [adminLots, query]);

  function handleChangeStatus(lotId: string, status: LotStatus) {
    setAdminLots((currentLots) =>
      currentLots.map((lot) => (lot.id === lotId ? { ...lot, estado: status } : lot))
    );
    setSelectedLot((currentLot) =>
      currentLot?.id === lotId ? { ...currentLot, estado: status } : currentLot
    );
  }

  function handleSelectLot(lot: Lot | null) {
    if (!lot) {
      setSelectedLot(null);
      return;
    }

    setSelectedLot(adminLots.find((item) => item.id === lot.id) ?? lot);
  }

  return (
    <section className="grid gap-5">
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-950">
        Modo demo: los cambios de estado son locales hasta conectar base de datos.
      </div>

      <div className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-leaf">Terrenos</p>
          <h2 className="text-2xl font-black text-ink">Estados comerciales</h2>
          <p className="text-sm leading-6 text-stone-700">
            Gestion mobile-first con cards y acciones rapidas para disponible, reservado y
            vendido.
          </p>
          <label className="grid gap-2 text-sm font-bold text-stone-700">
            Buscar por manzana o solar
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-h-12 w-full rounded-md border border-stone-300 bg-white px-4 py-3 text-base outline-none transition focus:border-leaf focus:ring-2 focus:ring-leaf/20"
              placeholder="Ej: manzana 1, solar 5"
            />
          </label>
        </div>
      </div>

      <InteractivePlan
        lots={adminLots}
        selectedLot={selectedLot}
        onSelectLot={handleSelectLot}
        onSchedule={() => undefined}
        showLotDetails={false}
        isAdmin
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredLots.map((lot) => (
          <AdminLotStatusCard key={lot.id} lot={lot} onChangeStatus={handleChangeStatus} />
        ))}
      </div>
    </section>
  );
}
