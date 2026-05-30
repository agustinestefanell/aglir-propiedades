"use client";

import type { Lot, VisitRequest } from "@/types";
import { buildWhatsAppUrl, formatContactName } from "@/lib/whatsapp";

type Props = {
  request: VisitRequest;
  lot: Lot;
  onAccept: (requestId: string) => void;
};

export function WhatsAppAcceptButton({ request, lot, onAccept }: Props) {
  const contactName = formatContactName(request.nombre, request.whatsapp);

  function handleAccept() {
    onAccept(request.id);
    const url = buildWhatsAppUrl({
      phone: request.whatsapp,
      nombre: request.nombre,
      terreno: lot,
      fecha: request.fecha,
      hora: request.hora,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <p className="text-right text-xs text-stone-500">
        Guardar como:{" "}
        <span className="font-mono font-bold text-stone-800">{contactName}</span>
      </p>
      <button
        type="button"
        onClick={handleAccept}
        className="min-h-11 rounded-md bg-leaf px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800"
      >
        Aceptar visita
      </button>
    </div>
  );
}
