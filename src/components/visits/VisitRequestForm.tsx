"use client";

import { FormEvent, useState } from "react";
import type { Lot, VisitRequest } from "@/types";

type VisitRequestFormProps = {
  selectedLot: Lot | null;
  onCreateRequest: (request: VisitRequest) => void;
};

const inputClass =
  "min-h-12 w-full rounded-md border border-stone-300 bg-white px-4 py-3 text-base outline-none transition focus:border-leaf focus:ring-2 focus:ring-leaf/20";

export function VisitRequestForm({ selectedLot, onCreateRequest }: VisitRequestFormProps) {
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [comentario, setComentario] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedLot || !nombre || !whatsapp || !fecha || !hora) {
      return;
    }

    onCreateRequest({
      id: `local-${Date.now()}`,
      nombre,
      whatsapp,
      lotId: selectedLot.id,
      fecha,
      hora,
      comentario,
      estado: "pendiente"
    });

    setSubmitted(true);
    setNombre("");
    setWhatsapp("");
    setFecha("");
    setHora("");
    setComentario("");
  }

  return (
    <section id="agendar" className="rounded-md border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-leaf">Agenda de visita</p>
        <h2 className="mt-1 text-2xl font-bold text-ink">
          {selectedLot
            ? `Manzana ${selectedLot.manzana}, Solar ${selectedLot.solar}`
            : "Seleccioná un terreno"}
        </h2>
      </div>

      {submitted ? (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
          Solicitud registrada. Aglir Propiedades te contactará por WhatsApp para confirmar.
        </div>
      ) : null}

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-semibold text-stone-700">
          Nombre
          <input
            className={inputClass}
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            required
            disabled={!selectedLot}
            placeholder="Tu nombre"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-stone-700">
          WhatsApp
          <input
            className={inputClass}
            value={whatsapp}
            onChange={(event) => setWhatsapp(event.target.value)}
            required
            disabled={!selectedLot}
            inputMode="tel"
            placeholder="Ej: 099 123 456"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-stone-700">
            Día
            <input
              className={inputClass}
              value={fecha}
              onChange={(event) => setFecha(event.target.value)}
              required
              disabled={!selectedLot}
              type="date"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-stone-700">
            Hora
            <input
              className={inputClass}
              value={hora}
              onChange={(event) => setHora(event.target.value)}
              required
              disabled={!selectedLot}
              type="time"
            />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold text-stone-700">
          Comentario opcional
          <textarea
            className={`${inputClass} min-h-24 resize-y`}
            value={comentario}
            onChange={(event) => setComentario(event.target.value)}
            disabled={!selectedLot}
            placeholder="Contanos si tenés una preferencia de horario o consulta."
          />
        </label>
        <button
          type="submit"
          disabled={!selectedLot}
          className="min-h-12 rounded-md bg-soil px-5 py-3 text-base font-bold text-white transition hover:bg-[#74553e] disabled:cursor-not-allowed disabled:bg-stone-400"
        >
          Enviar solicitud
        </button>
      </form>
    </section>
  );
}
