"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Lot, VisitRequest } from "@/types";

const STORAGE_KEY = "aglir_user";

type StoredUser = { nombre: string; whatsapp: string };

function loadUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

function saveUser(u: StoredUser) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  } catch {
    // storage may be unavailable
  }
}

type Step = "register" | "schedule" | "done";

type Props = {
  lot: Lot;
  onClose: () => void;
  onSubmit: (data: Omit<VisitRequest, "id" | "estado">) => void;
};

const inputCls =
  "min-h-12 w-full rounded-md border border-stone-300 bg-white px-4 py-3 text-base outline-none transition focus:border-leaf focus:ring-2 focus:ring-leaf/20";

export function VisitBookingModal({ lot, onClose, onSubmit }: Props) {
  const [step, setStep] = useState<Step>("register");
  const [user, setUser] = useState<StoredUser | null>(null);
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");

  useEffect(() => {
    const stored = loadUser();
    if (stored) {
      setUser(stored);
      setNombre(stored.nombre);
      setWhatsapp(stored.whatsapp);
      setStep("schedule");
    }
  }, []);

  function handleRegister(e: FormEvent) {
    e.preventDefault();
    const u = { nombre: nombre.trim(), whatsapp: whatsapp.trim() };
    saveUser(u);
    setUser(u);
    setStep("schedule");
  }

  function handleSchedule(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    onSubmit({ nombre: user.nombre, whatsapp: user.whatsapp, lotId: lot.id, fecha, hora });
    setStep("done");
  }

  const today = new Date().toISOString().split("T")[0];
  const lotLabel = `Manzana ${lot.manzana}, Solar ${lot.solar} · ${lot.area_m2} m²`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center md:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl bg-white px-6 pb-8 pt-5 shadow-2xl md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle bar */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-stone-200 md:hidden" />

        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-leaf">{lotLabel}</p>
            <h2 className="mt-1 text-xl font-black text-ink">
              {step === "register" && "Tus datos"}
              {step === "schedule" && "Elegí fecha y hora"}
              {step === "done" && "Solicitud enviada"}
            </h2>
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

        {/* Step 1 — registro */}
        {step === "register" && (
          <form className="grid gap-4" onSubmit={handleRegister}>
            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              Nombre completo
              <input
                className={inputCls}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                autoComplete="name"
                required
                autoFocus
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              WhatsApp
              <input
                className={inputCls}
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ej: 099 123 456"
                inputMode="tel"
                autoComplete="tel"
                required
              />
            </label>
            <p className="text-xs leading-5 text-stone-500">
              Solo usamos tu WhatsApp para confirmar la visita.
            </p>
            <div className="mt-1 flex gap-3">
              <button type="button" onClick={onClose} className={secondaryCls}>
                Cancelar
              </button>
              <button type="submit" className={primaryCls}>
                Continuar →
              </button>
            </div>
          </form>
        )}

        {/* Step 2 — fecha/hora */}
        {step === "schedule" && user && (
          <form className="grid gap-4" onSubmit={handleSchedule}>
            <div className="flex items-center justify-between rounded-md bg-stone-50 px-3 py-2.5 text-sm">
              <span className="text-stone-700">
                Agendando como <strong className="text-ink">{user.nombre}</strong>
              </span>
              <button
                type="button"
                onClick={() => setStep("register")}
                className="text-xs font-bold text-leaf underline"
              >
                Cambiar
              </button>
            </div>
            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              Día preferido
              <input
                className={inputCls}
                type="date"
                min={today}
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              Hora preferida
              <input
                className={inputCls}
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                required
              />
            </label>
            <p className="text-xs leading-5 text-stone-500">
              El horario queda a confirmar. Te contactamos por WhatsApp para coordinar.
            </p>
            <div className="mt-1 flex gap-3">
              <button type="button" onClick={onClose} className={secondaryCls}>
                Cancelar
              </button>
              <button type="submit" className={primaryCls}>
                Agendar visita
              </button>
            </div>
          </form>
        )}

        {/* Step 3 — confirmación */}
        {step === "done" && (
          <div className="grid gap-5">
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
              <p className="font-bold">¡Solicitud registrada!</p>
              <p className="mt-1">
                Aglir Propiedades te contactará por WhatsApp para confirmar el horario de
                la visita a Manzana {lot.manzana}, Solar {lot.solar}.
              </p>
            </div>
            <button type="button" onClick={onClose} className={primaryCls}>
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const primaryCls =
  "flex-1 min-h-12 rounded-md bg-leaf px-5 py-3 text-base font-bold text-white transition hover:bg-emerald-800";

const secondaryCls =
  "flex-1 min-h-12 rounded-md border border-stone-300 bg-white px-5 py-3 text-base font-bold text-stone-700 transition hover:bg-stone-50";
