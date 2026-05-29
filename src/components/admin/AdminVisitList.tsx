"use client";

import { useState } from "react";
import type { Lot, VisitRequest, VisitStatus } from "@/types";
import { WhatsAppAcceptButton } from "./WhatsAppAcceptButton";

type AdminVisitListProps = {
  initialRequests: VisitRequest[];
  lots: Lot[];
};

const statusStyles: Record<VisitStatus, string> = {
  pendiente: "bg-amber-100 text-amber-900",
  aceptada: "bg-emerald-100 text-emerald-900",
  rechazada: "bg-rose-100 text-rose-900",
  realizada: "bg-slate-100 text-slate-800"
};

export function AdminVisitList({ initialRequests, lots }: AdminVisitListProps) {
  const [requests, setRequests] = useState(initialRequests);

  function handleAccept(requestId: string) {
    setRequests((current) =>
      current.map((request) =>
        request.id === requestId ? { ...request, estado: "aceptada" } : request
      )
    );
  }

  return (
    <section className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-leaf">Solicitudes</p>
          <h2 className="text-2xl font-bold text-ink">Visitas solicitadas</h2>
        </div>
        <p className="text-sm text-stone-600">{requests.length} solicitudes mock</p>
      </div>

      <div className="mt-5 grid gap-4">
        {requests.map((request) => {
          const lot = lots.find((item) => item.id === request.lotId);

          return (
            <article
              key={request.id}
              className="grid gap-4 rounded-md border border-stone-200 p-4 md:grid-cols-[1fr_auto]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-ink">{request.nombre}</h3>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[request.estado]}`}
                  >
                    {request.estado}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
                  <p>
                    <strong className="text-ink">WhatsApp:</strong> {request.whatsapp}
                  </p>
                  <p>
                    <strong className="text-ink">Fecha:</strong> {request.fecha} · {request.hora}
                  </p>
                  <p>
                    <strong className="text-ink">Terreno:</strong>{" "}
                    {lot
                      ? `Manzana ${lot.manzana}, Solar ${lot.solar}, ${lot.area_m2} m²`
                      : "No encontrado"}
                  </p>
                  <p>
                    <strong className="text-ink">Comentario:</strong>{" "}
                    {request.comentario || "Sin comentario"}
                  </p>
                </div>
              </div>

              <div className="flex items-center md:justify-end">
                {lot ? (
                  <WhatsAppAcceptButton request={request} lot={lot} onAccept={handleAccept} />
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
