"use client";

import type { Lot, VisitRequest } from "@/types";

type AdminCalendarViewProps = {
  requests: VisitRequest[];
  lots: Lot[];
};

export function AdminCalendarView({ requests, lots }: AdminCalendarViewProps) {
  const groupedRequests = requests.reduce<Record<string, VisitRequest[]>>((groups, request) => {
    groups[request.fecha] = groups[request.fecha] ?? [];
    groups[request.fecha].push(request);
    return groups;
  }, {});

  return (
    <section className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold text-ink">Vista por día</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.entries(groupedRequests).map(([fecha, dayRequests]) => (
          <article key={fecha} className="rounded-md border border-stone-200 p-4">
            <h3 className="font-bold text-ink">{fecha}</h3>
            <div className="mt-3 grid gap-3">
              {dayRequests
                .slice()
                .sort((a, b) => a.hora.localeCompare(b.hora))
                .map((request) => {
                  const lot = lots.find((item) => item.id === request.lotId);
                  return (
                    <div key={request.id} className="rounded-md bg-paper p-3 text-sm">
                      <p className="font-bold">
                        {request.hora} · {request.nombre}
                      </p>
                      <p className="mt-1 text-stone-700">
                        {lot
                          ? `Manzana ${lot.manzana}, Solar ${lot.solar}`
                          : "Terreno no encontrado"}
                      </p>
                    </div>
                  );
                })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
