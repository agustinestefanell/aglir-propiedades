"use client";

import type { Lot, VisitRequest } from "@/types";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type WhatsAppAcceptButtonProps = {
  request: VisitRequest;
  lot: Lot;
  onAccept: (requestId: string) => void;
};

export function WhatsAppAcceptButton({ request, lot, onAccept }: WhatsAppAcceptButtonProps) {
  function handleAccept() {
    onAccept(request.id);
    const url = buildWhatsAppUrl({
      phone: request.whatsapp,
      nombre: request.nombre,
      terreno: lot,
      fecha: request.fecha,
      hora: request.hora
    });

    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={handleAccept}
      className="min-h-11 rounded-md bg-leaf px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-800"
    >
      Aceptar visita
    </button>
  );
}
